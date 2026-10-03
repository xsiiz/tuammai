import React, { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import { RegionId, DamTelemetry } from '../../types/dam';
import { REGIONS } from '../../data/regions';
import { geoTo3D, REGION_COLORS, createShapesFromMultiPolygon, GEO_SCALE, THAILAND_CENTER_LNG, THAILAND_CENTER_LAT } from '../../utils/geoUtils';
import { PROVINCES_BY_CODE } from '../../data/provinces';
import provincesGeoData from '../../data/thailand-provinces.json';
import riversGeoData from '../../data/thailand-rivers.json';
import { RiverMesh3D } from './RiverMesh3D';
import { RiverFeature } from '../../types/river';
import { getDamLabelConfig, getShortDamName } from '../../utils/labelUtils';

interface Thailand3DMapProps {
  lang: 'th' | 'en';
  selectedRegion: RegionId;
  selectedProvince?: string | null;
  selectedDam: DamTelemetry | null;
  dams: DamTelemetry[];
  onSelectRegion: (region: RegionId) => void;
  onSelectProvince?: (provinceCode: string | null) => void;
  onSelectDam: (dam: DamTelemetry) => void;
  theme?: 'light' | 'dark';
}

// ----------------------------------------------------
// Smooth Camera Controller
// ----------------------------------------------------
const CameraController: React.FC<{
  selectedRegion: RegionId;
  selectedProvince?: string | null;
  selectedDam: DamTelemetry | null;
}> = ({ selectedRegion, selectedProvince, selectedDam }) => {
  const { camera, size } = useThree();
  const controlsRef = useRef<any>(null);

  const targetCoords = useMemo(() => {
    // Determine right panel width: only offset camera when selectedDam is active (drawer open)
    const isDesktop = size.width >= 768;
    const panelWidth = selectedDam ? (size.width >= 1024 ? 480 : (isDesktop ? 380 : 0)) : 0;
    const aspect = size.width / Math.max(size.height, 1);
    const fovRad = ((camera as any).fov * Math.PI) / 360;

    // Helper to compute world X offset so content centers in the open space left of the drawer
    const getPanelOffsetX = (dist: number) => {
      if (!isDesktop || panelWidth === 0) return 0;
      const visibleHeight = 2 * dist * Math.tan(fovRad);
      return (panelWidth / 2) * (visibleHeight / size.height);
    };

    // 1. Focused Dam Level
    if (selectedDam) {
      const [x, y, z] = geoTo3D(selectedDam.coordinates[0], selectedDam.coordinates[1]);
      const damDist = 3.6;
      const offsetX = getPanelOffsetX(damDist);
      return {
        target: new THREE.Vector3(x + offsetX, y, z),
        cameraPos: new THREE.Vector3(x + offsetX, y - 0.8, damDist)
      };
    }

    // 2. Focused Province Level (Drill-Down)
    if (selectedProvince) {
      const provMeta = PROVINCES_BY_CODE[selectedProvince];
      if (provMeta) {
        const [px, py, pz] = geoTo3D(provMeta.centroid[0], provMeta.centroid[1], 0.2);
        const provDist = 4.8;
        const offsetX = getPanelOffsetX(provDist);
        return {
          target: new THREE.Vector3(px + offsetX, py, pz),
          cameraPos: new THREE.Vector3(px + offsetX, py - 0.7, provDist)
        };
      }
    }

    // 3. Regional or National Overview Level
    const reg = REGIONS[selectedRegion] || REGIONS.all;
    if (selectedRegion === 'all') {
      let baseDist = 11.2;
      if (aspect < 0.65) {
        baseDist = Math.max(baseDist, 5.2 / (2 * aspect * Math.tan(fovRad)));
      }
      const offsetX = getPanelOffsetX(baseDist);
      const [tx, ty, tz] = reg.cameraTarget;

      return {
        target: new THREE.Vector3(tx + offsetX, ty, tz),
        cameraPos: new THREE.Vector3(tx + offsetX, ty - 1.2, baseDist)
      };
    }

    const [tx, ty, tz] = reg.cameraTarget;
    const zoomDist = 10.5 / reg.zoom;
    const offsetX = getPanelOffsetX(zoomDist);
    return {
      target: new THREE.Vector3(tx + offsetX, ty, tz),
      cameraPos: new THREE.Vector3(tx + offsetX, ty - 0.8, zoomDist)
    };
  }, [selectedRegion, selectedProvince, selectedDam, size.width, size.height, camera]);

  useFrame((_, delta) => {
    // Smooth lerp camera position and controls target
    const speed = Math.min(delta * 4, 0.15);
    camera.position.lerp(targetCoords.cameraPos, speed);
    if (controlsRef.current) {
      controlsRef.current.target.lerp(targetCoords.target, speed);
      controlsRef.current.update();
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enableRotate={true}
      enablePan={true}
      enableZoom={true}
      maxPolarAngle={Math.PI / 2.1}
      minPolarAngle={Math.PI / 6}
      minDistance={2.0}
      maxDistance={20.0}
    />
  );
};

// ----------------------------------------------------
// Province 3D Mesh Component (Low-Relief Extruded Clay & Crisp Outlines)
// ----------------------------------------------------
const ProvinceMesh: React.FC<{
  feature: any;
  selectedRegion: RegionId;
  selectedProvince?: string | null;
  selectedDam: DamTelemetry | null;
  onSelectRegion: (reg: RegionId) => void;
  onSelectProvince?: (provCode: string | null) => void;
  lang: 'th' | 'en';
  theme?: 'light' | 'dark';
}> = React.memo(({
  feature,
  selectedRegion,
  selectedProvince,
  selectedDam,
  onSelectRegion,
  onSelectProvince,
  lang,
  theme = 'light'
}) => {
  const [hovered, setHovered] = useState(false);

  const provCode = feature.properties?.pro_code;
  const provMeta = PROVINCES_BY_CODE[provCode];
  const regionNameRaw = (feature.properties?.reg_royin || 'Central').toLowerCase() as RegionId;
  const isRegionActive = selectedRegion === 'all' || selectedRegion === regionNameRaw;
  const isSelectedRegion = selectedRegion === regionNameRaw;
  const isSelectedProvince = selectedProvince === provCode;

  // Shapes cached per feature
  const shapes = useMemo(() => {
    return createShapesFromMultiPolygon(feature.geometry.coordinates);
  }, [feature]);

  // Elevation based on region terrain + extra lift if province is selected
  const regionConfig = REGION_COLORS[regionNameRaw] || REGION_COLORS.central;
  const extrudeDepth = regionConfig.elevation + (isSelectedRegion ? 0.08 : 0) + (isSelectedProvince ? 0.05 : 0);

  const extrudeSettings = useMemo(() => ({
    depth: extrudeDepth,
    bevelEnabled: true,
    bevelSegments: 2,
    steps: 1,
    bevelSize: 0.015,
    bevelThickness: 0.015
  }), [extrudeDepth]);

  // Crisp boundary line geometries along the outer rim of each polygon
  const borderLines = useMemo(() => {
    const geoms: THREE.BufferGeometry[] = [];
    for (const polygon of feature.geometry.coordinates) {
      const ring = polygon[0];
      if (!ring || ring.length < 3) continue;
      const points: THREE.Vector3[] = [];
      for (const [lng, lat] of ring) {
        const x = (lng - THAILAND_CENTER_LNG) * GEO_SCALE;
        const y = (lat - THAILAND_CENTER_LAT) * GEO_SCALE;
        // Float slightly above the extruded top surface to prevent z-fighting
        points.push(new THREE.Vector3(x, y, extrudeDepth + 0.006));
      }
      geoms.push(new THREE.BufferGeometry().setFromPoints(points));
    }
    return geoms;
  }, [feature.geometry.coordinates, extrudeDepth]);

  // Color calculation matching Design.md
  const color = useMemo(() => {
    if (isSelectedProvince) {
      return '#0284C7'; // Highlight selected province with primary water cyan/sky
    }
    if (hovered && isRegionActive) {
      return regionConfig.highlight;
    }
    if (isSelectedRegion) {
      return regionConfig.highlight;
    }
    if (selectedRegion === 'all') {
      return regionConfig.base;
    }
    // Dimmed when another region is selected
    return theme === 'dark' ? '#334155' : '#E2E8F0';
  }, [hovered, isRegionActive, isSelectedRegion, isSelectedProvince, selectedRegion, regionConfig, theme]);

  // Border outline color & opacity for crisp delineation
  const borderColor = useMemo(() => {
    if (isSelectedProvince) return theme === 'dark' ? '#38BDF8' : '#0284C7';
    if (hovered && isRegionActive) return theme === 'dark' ? '#38BDF8' : '#0369A1';
    if (isSelectedRegion) return theme === 'dark' ? '#38BDF8' : '#FFFFFF';
    if (selectedRegion === 'all') return theme === 'dark' ? '#64748B' : '#FFFFFF';
    return theme === 'dark' ? '#1E293B' : '#CBD5E1';
  }, [isSelectedProvince, hovered, isRegionActive, isSelectedRegion, selectedRegion, theme]);

  const borderOpacity = useMemo(() => {
    if (isSelectedProvince || (hovered && isRegionActive)) return 1.0;
    if (isSelectedRegion) return theme === 'dark' ? 0.85 : 0.95;
    if (selectedRegion === 'all') return theme === 'dark' ? 0.6 : 0.9;
    return 0.35;
  }, [isSelectedProvince, hovered, isRegionActive, isSelectedRegion, selectedRegion, theme]);

  // Label 3D position at centroid
  const [labelX, labelY, labelZ] = useMemo(() => {
    const cLng = provMeta ? provMeta.centroid[0] : 100.5;
    const cLat = provMeta ? provMeta.centroid[1] : 13.5;
    return geoTo3D(cLng, cLat, extrudeDepth + 0.035);
  }, [provMeta, extrudeDepth]);

  // Visual hierarchy for province label display:
  // - Always show if selected or hovered
  // - Show all in regional view (when no dam drawer is active)
  // - Show major economic anchors in national view (when no dam drawer is active)
  const isMajor = provMeta?.isMajorCity;
  const showLabel =
    isSelectedProvince ||
    hovered ||
    (isSelectedRegion && !selectedDam) ||
    (selectedRegion === 'all' && isMajor && !selectedDam);

  const handleClick = (e: any) => {
    e.stopPropagation();
    if (onSelectProvince) {
      onSelectProvince(provCode);
    } else {
      onSelectRegion(regionNameRaw);
    }
  };

  return (
    <group>
      {/* 3D Extruded Province Mesh */}
      {shapes.map((shape, idx) => (
        <mesh
          key={idx}
          castShadow
          receiveShadow
          onPointerOver={(e) => {
            e.stopPropagation();
            setHovered(true);
            document.body.style.cursor = 'pointer';
          }}
          onPointerOut={(e) => {
            e.stopPropagation();
            setHovered(false);
            document.body.style.cursor = 'auto';
          }}
          onClick={handleClick}
        >
          <extrudeGeometry args={[shape, extrudeSettings]} />
          <meshStandardMaterial
            color={color}
            roughness={0.65}
            metalness={0.1}
            polygonOffset
            polygonOffsetFactor={1}
            polygonOffsetUnits={1}
          />
        </mesh>
      ))}

      {/* Crisp Province Outlines (Line Loops) */}
      {borderLines.map((geom, idx) => (
        <lineLoop key={`border-${idx}`} geometry={geom}>
          <lineBasicMaterial
            color={borderColor}
            transparent
            opacity={borderOpacity}
            linewidth={isSelectedProvince || hovered ? 2 : 1}
          />
        </lineLoop>
      ))}

      {/* Province Name Tag (Anchored at Centroid) */}
      {showLabel && (
        <Html
          position={[labelX, labelY, labelZ]}
          center
          distanceFactor={9.0}
          style={{
            zIndex: isSelectedProvince ? 35 : (hovered ? 30 : 12),
            pointerEvents: 'none'
          }}
        >
          <div
            className={`whitespace-nowrap transition-all duration-150 select-none pointer-events-auto cursor-pointer font-sans ${
              isSelectedProvince
                ? 'text-sky-600 dark:text-cyan-400 font-bold text-[11px] scale-110'
                : hovered
                ? 'text-sky-600 dark:text-cyan-400 font-bold text-[10.5px] scale-105'
                : theme === 'dark'
                ? 'text-slate-200 font-medium text-[9.5px]'
                : 'text-slate-800 font-medium text-[9.5px]'
            }`}
            style={{
              textShadow: theme === 'dark'
                ? (isSelectedProvince || hovered
                  ? '0 0 8px rgba(56, 189, 248, 0.9), 0 1px 3px rgba(0, 0, 0, 0.95)'
                  : '0 1px 3px rgba(11, 17, 32, 0.95), 0 0 2px rgba(0, 0, 0, 0.9)')
                : (isSelectedProvince || hovered
                  ? '0 0 6px rgba(255, 255, 255, 1), 0 1px 3px rgba(2, 132, 199, 0.4)'
                  : '0 1px 2px rgba(255, 255, 255, 0.95), 0 0 3px rgba(255, 255, 255, 0.9)')
            }}
            onClick={handleClick}
          >
            <span>{lang === 'th' ? (provMeta?.name_th || feature.properties.pro_th) : (provMeta?.name_en || feature.properties.pro_en)}</span>
          </div>
        </Html>
      )}
    </group>
  );
});

// ----------------------------------------------------
// 3D Dam Marker Pin Component with Pulse Ring
// ----------------------------------------------------
const DamMarker3D: React.FC<{
  dam: DamTelemetry;
  selectedRegion: RegionId;
  isSelected: boolean;
  onSelectDam: (dam: DamTelemetry) => void;
  lang: 'th' | 'en';
  theme?: 'light' | 'dark';
}> = React.memo(({ dam, selectedRegion, isSelected, onSelectDam, lang, theme = 'light' }) => {
  const [hovered, setHovered] = useState(false);
  const ringRef = useRef<THREE.Mesh>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handlePointerEnter = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setHovered(true);
    document.body.style.cursor = 'pointer';
  };

  const handlePointerLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    hoverTimeoutRef.current = setTimeout(() => {
      setHovered(false);
      document.body.style.cursor = 'auto';
    }, 180);
  };

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  const isTop10 = Boolean(dam.national_rank && dam.national_rank <= 10);
  const isMajor = Boolean(isTop10 || (dam.region === 'east' && dam.national_rank === 14));
  const isSmallDam = !isMajor;

  // National overview ('all') displays only the top 10 largest dams.
  // Drill-down into a specific region displays all reservoirs within that region.
  const isVisible = selectedRegion === 'all'
    ? (isTop10 || isSelected)
    : (selectedRegion === dam.region);

  const [x, y, baseZ] = useMemo(() => {
    return geoTo3D(dam.coordinates[0], dam.coordinates[1], isSmallDam ? 0.33 : 0.35);
  }, [dam.coordinates, isSmallDam]);

  // Pulse animation for critical & warning pins
  useFrame(({ clock }) => {
    if (ringRef.current && isVisible) {
      const elapsed = clock.getElapsedTime() * 2;
      const scale = 1 + (Math.sin(elapsed) + 1) * (isSmallDam ? 0.25 : 0.4);
      ringRef.current.scale.set(scale, scale, 1);
    }
  });

  const labelConfig = useMemo(() => getDamLabelConfig(dam.id), [dam.id]);
  const shortName = useMemo(() => getShortDamName(dam.name_th, dam.name_en, lang), [dam.name_th, dam.name_en, lang]);
  const fullName = lang === 'th' ? dam.name_th : dam.name_en;

  if (!isVisible) return null;

  // Label visibility:
  // - Major dam: always display compact pill, expand on hover/select
  // - Small dam: display only when hovered or selected
  const showLabel = isMajor || hovered || isSelected;

  return (
    <group position={[x, y, baseZ]}>
      {/* 2D Flat Dam Beacon Geometry */}
      {/* Hit Disc */}
      <mesh
        position={[0, 0, 0.03]}
        onPointerOver={(e) => {
          e.stopPropagation();
          handlePointerEnter();
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          handlePointerLeave();
        }}
        onClick={(e) => {
          e.stopPropagation();
          onSelectDam(dam);
        }}
      >
        <circleGeometry args={[isMajor ? 0.09 : 0.07, 16]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>

      {/* Outer Pulsing Halo Wave */}
      <mesh ref={ringRef} position={[0, 0, 0.006]}>
        <ringGeometry args={[isMajor ? 0.045 : 0.035, isMajor ? 0.075 : 0.055, 24]} />
        <meshBasicMaterial
          color={dam.status_color}
          transparent
          opacity={hovered || isSelected ? 0.85 : (dam.status === 'critical' ? 0.65 : 0.35)}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Outer Contrast Rim */}
      <mesh position={[0, 0, 0.012]}>
        <circleGeometry args={[isMajor ? 0.045 : 0.034, 24]} />
        <meshBasicMaterial
          color={theme === 'dark' ? '#0F172A' : '#FFFFFF'}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Status Color Disc */}
      <mesh position={[0, 0, 0.018]} scale={hovered || isSelected ? 1.25 : 1.0}>
        <circleGeometry args={[isMajor ? 0.036 : 0.026, 24]} />
        <meshBasicMaterial
          color={dam.status_color}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Inner Bullseye Center Dot for Major Dams */}
      {isMajor && (
        <mesh position={[0, 0, 0.024]}>
          <circleGeometry args={[0.012, 16]} />
          <meshBasicMaterial
            color="#FFFFFF"
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* Floating Anti-Collision Label (Anchored directly to pin, never drifts) */}
      {showLabel && (
        <Html
          position={[0, 0, 0.03]}
          center
          distanceFactor={8.5}
          style={{
            zIndex: isSelected ? 60 : (hovered ? 50 : 10),
            pointerEvents: 'none'
          }}
        >
          <div
            className={`absolute select-none pointer-events-auto transition-transform duration-200 ease-out ${labelConfig.wrapperClass}`}
            onMouseEnter={handlePointerEnter}
            onMouseLeave={handlePointerLeave}
            onClick={(e) => {
              e.stopPropagation();
              onSelectDam(dam);
            }}
          >
            {/* Visual Caret Tail pointing towards pin */}
            <div
              className={`absolute w-2 h-2 ${labelConfig.tailClass} ${
                theme === 'dark'
                  ? 'bg-slate-900 border-slate-700/80'
                  : 'bg-white border-slate-200'
              }`}
              style={{
                borderColor: hovered || isSelected ? `${dam.status_color}90` : undefined
              }}
            />

            {/* EXPANDED HOVER / SELECTED STATE */}
            {(hovered || isSelected) ? (
              <div
                className={`relative px-3 py-2 rounded-xl shadow-2xl border backdrop-blur-md cursor-pointer transition-all duration-200 flex flex-col gap-1 min-w-[170px] max-w-[220px] ${
                  theme === 'dark' ? 'bg-slate-900/95 text-slate-100' : 'bg-white/95 text-slate-800'
                }`}
                style={{
                  borderColor: dam.status_color,
                  boxShadow: `0 10px 25px -5px ${dam.status_color}30, 0 8px 10px -6px rgba(0,0,0,0.2)`
                }}
              >
                {/* Header row: rank + full name + status */}
                <div className="flex items-center justify-between gap-1.5 border-b pb-1 border-slate-200/60 dark:border-slate-800/80">
                  <div className="flex items-center gap-1.5 truncate">
                    {dam.national_rank && dam.national_rank <= 10 && (
                      <span className="font-mono text-[9px] px-1 py-0.2 rounded font-bold bg-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0">
                        #{dam.national_rank}
                      </span>
                    )}
                    <span className="text-[11px] font-bold truncate leading-tight">
                      {fullName}
                    </span>
                  </div>
                  <span
                    className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0"
                    style={{ backgroundColor: `${dam.status_color}25`, color: dam.status_color }}
                  >
                    {dam.storage_percent.toFixed(0)}%
                  </span>
                </div>

                {/* Storage volume progress */}
                <div className="flex flex-col gap-0.5">
                  <div className="flex justify-between text-[9px] text-slate-500 dark:text-slate-400 font-mono">
                    <span>{dam.storage_mcm.toLocaleString()} MCM</span>
                    <span>{dam.capacity_mcm ? dam.capacity_mcm.toLocaleString() : '-'} MCM</span>
                  </div>
                  <div className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.min(dam.storage_percent, 100)}%`,
                        backgroundColor: dam.status_color
                      }}
                    />
                  </div>
                </div>

                {/* Status and Action Tip */}
                <div className="flex items-center justify-between pt-0.5 text-[9px]">
                  <span className="flex items-center gap-1 font-medium" style={{ color: dam.status_color }}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: dam.status_color }} />
                    {lang === 'th' ? dam.status_label_th : dam.status_label_en}
                  </span>
                  <span className="text-slate-400 dark:text-slate-500 text-[8.5px]">
                    {lang === 'th' ? 'คลิกดูข้อมูล ↗' : 'Details ↗'}
                  </span>
                </div>
              </div>
            ) : (
              /* COMPACT PILL (Normal Unhovered State) */
              <div
                className={`relative px-2 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap shadow-lg border flex items-center gap-1.5 backdrop-blur-md cursor-pointer transition-all duration-150 hover:scale-105 ${
                  theme === 'dark' ? 'text-white' : 'text-slate-900'
                }`}
                style={{
                  backgroundColor: theme === 'dark' ? 'rgba(15, 23, 42, 0.90)' : 'rgba(255, 255, 255, 0.92)',
                  borderColor: `${dam.status_color}70`
                }}
              >
                {isTop10 && selectedRegion === 'all' && (
                  <span className="font-mono text-[9px] px-1 py-0.2 rounded font-bold bg-amber-500/20 text-amber-600 dark:text-amber-400">
                    #{dam.national_rank}
                  </span>
                )}
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: dam.status_color }} />
                <span className="tracking-tight">{shortName}</span>
                <span
                  className="font-mono text-[9px] px-1 py-0.2 rounded font-bold ml-0.5"
                  style={{ backgroundColor: `${dam.status_color}25`, color: dam.status_color }}
                >
                  {dam.storage_percent.toFixed(0)}%
                </span>
              </div>
            )}
          </div>
        </Html>
      )}
    </group>
  );
});

// ----------------------------------------------------
// Ocean / Base Pedestal Plate
// ----------------------------------------------------
const BasePedestal: React.FC<{ theme?: 'light' | 'dark' }> = ({ theme = 'light' }) => {
  return (
    <group position={[0, 0, -0.05]}>
      {/* Matte Low-Relief Base Shadow Plate */}
      <mesh receiveShadow position={[0, 0, -0.01]}>
        <planeGeometry args={[24, 24]} />
        <meshStandardMaterial
          color={theme === 'dark' ? '#0B132B' : '#F8FAFC'}
          roughness={0.95}
          metalness={0.0}
        />
      </mesh>
    </group>
  );
};

// ----------------------------------------------------
// Main 3D Canvas Scene
// ----------------------------------------------------
export const Thailand3DMap: React.FC<Thailand3DMapProps> = ({
  lang,
  selectedRegion,
  selectedProvince,
  selectedDam,
  dams,
  onSelectRegion,
  onSelectProvince,
  onSelectDam,
  theme = 'light'
}) => {
  // Memoize structured river features
  const rivers: RiverFeature[] = useMemo(() => {
    return (riversGeoData.features as any[]).map((f) => ({
      id: f.id,
      name_th: f.properties.name_th,
      name_en: f.properties.name_en,
      basin: f.properties.basin,
      basin_th: f.properties.basin_th,
      region: f.properties.region,
      connected_dams: f.properties.connected_dams,
      major: f.properties.major,
      coordinates: f.geometry.coordinates as [number, number][]
    }));
  }, []);

  return (
    <div className={`relative w-full h-full select-none transition-colors duration-300 ${theme === 'dark' ? 'bg-[#0B1120]' : 'bg-white'}`}>
      <Canvas
        camera={{ position: [0.54, -2.0, 11.6], fov: 45, near: 0.1, far: 50 }}
        shadows
        gl={{ antialias: true, alpha: true }}
        className="w-full h-full"
      >
        {/* Set explicit canvas background color */}
        <color attach="background" args={[theme === 'dark' ? '#0B1120' : '#FFFFFF']} />

        {/* Ambient & Studio Directional Lighting for Low-Relief Clay */}
        <ambientLight intensity={theme === 'dark' ? 0.9 : 1.15} />
        <directionalLight
          position={[5, 8, 10]}
          intensity={theme === 'dark' ? 1.4 : 1.55}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
          shadow-camera-near={0.5}
          shadow-camera-far={25}
        />
        <directionalLight position={[-6, -4, 6]} intensity={theme === 'dark' ? 0.5 : 0.4} color="#38BDF8" />
        <directionalLight position={[0, -8, 4]} intensity={0.3} color="#0EA5E9" />

        {/* Camera Lerp Controller */}
        <CameraController
          selectedRegion={selectedRegion}
          selectedProvince={selectedProvince}
          selectedDam={selectedDam}
        />

        {/* 3D Map Group */}
        <group>
          {/* All 77 Provinces rendered with low-relief extrusion, crisp boundaries, and name labels */}
          {provincesGeoData.features.map((feature: any) => (
            <ProvinceMesh
              key={feature.properties.pro_code || feature.properties.pro_en}
              feature={feature}
              selectedRegion={selectedRegion}
              selectedProvince={selectedProvince}
              selectedDam={selectedDam}
              onSelectRegion={onSelectRegion}
              onSelectProvince={onSelectProvince}
              lang={lang}
              theme={theme}
            />
          ))}

          {/* River Outflow Network (3D Channels & Animated Droplets) */}
          {rivers.map((river) => (
            <RiverMesh3D
              key={river.id}
              river={river}
              selectedRegion={selectedRegion}
              selectedDam={selectedDam}
              dams={dams}
              theme={theme}
              lang={lang}
            />
          ))}

          {/* Dam Marker Pins */}
          {dams.map((dam) => (
            <DamMarker3D
              key={dam.id}
              dam={dam}
              selectedRegion={selectedRegion}
              isSelected={selectedDam?.id === dam.id}
              onSelectDam={onSelectDam}
              lang={lang}
              theme={theme}
            />
          ))}

          {/* Underlay Pedestal */}
          <BasePedestal theme={theme} />
        </group>
      </Canvas>
    </div>
  );
};
