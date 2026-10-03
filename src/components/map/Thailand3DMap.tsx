import React, { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import { RegionId, DamTelemetry } from '../../types/dam';
import { REGIONS } from '../../data/regions';
import { geoTo3D, REGION_COLORS, createShapesFromMultiPolygon } from '../../utils/geoUtils';
import provincesGeoData from '../../data/thailand-provinces.json';
import riversGeoData from '../../data/thailand-rivers.json';
import { RiverMesh3D } from './RiverMesh3D';
import { RiverFeature } from '../../types/river';
import { getDamLabelConfig, getShortDamName } from '../../utils/labelUtils';

interface Thailand3DMapProps {
  lang: 'th' | 'en';
  selectedRegion: RegionId;
  selectedDam: DamTelemetry | null;
  dams: DamTelemetry[];
  onSelectRegion: (region: RegionId) => void;
  onSelectDam: (dam: DamTelemetry) => void;
  theme?: 'light' | 'dark';
}

// ----------------------------------------------------
// Smooth Camera Controller
// ----------------------------------------------------
const CameraController: React.FC<{
  selectedRegion: RegionId;
  selectedDam: DamTelemetry | null;
}> = ({ selectedRegion, selectedDam }) => {
  const { camera, size } = useThree();
  const controlsRef = useRef<any>(null);

  const targetCoords = useMemo(() => {
    // Determine right panel width based on responsive breakpoints
    // On Desktop (width >= 1024): w-88 (352px) + 16px right margin = 368px
    // On Tablet/Small Desktop (768 <= width < 1024): w-80 (320px) + 16px = 336px
    // On Mobile (width < 768): bottom sheet drawer (offset = 0)
    const isDesktop = size.width >= 768;
    const panelWidth = size.width >= 1024 ? 368 : (isDesktop ? 336 : 0);
    const aspect = size.width / Math.max(size.height, 1);
    const fovRad = ((camera as any).fov * Math.PI) / 360;

    // Helper to compute world X offset so content centers in the open space left of the panel
    const getPanelOffsetX = (dist: number) => {
      if (!isDesktop || panelWidth === 0) return 0;
      const visibleHeight = 2 * dist * Math.tan(fovRad);
      return (panelWidth / 2) * (visibleHeight / size.height);
    };

    if (selectedDam) {
      const [x, y, z] = geoTo3D(selectedDam.coordinates[0], selectedDam.coordinates[1]);
      const damDist = 3.6;
      const offsetX = getPanelOffsetX(damDist);
      return {
        target: new THREE.Vector3(x + offsetX, y, z),
        cameraPos: new THREE.Vector3(x + offsetX, y - 0.8, damDist)
      };
    }

    const reg = REGIONS[selectedRegion] || REGIONS.all;
    if (selectedRegion === 'all') {
      // Thailand spans latitude ~5.6 to ~20.5 (height ~8.2 units, width ~4.6 units)
      // Distance adjusted so the entire country fits vertically with comfortable padding
      let baseDist = 11.6;
      if (aspect < 0.65) {
        baseDist = Math.max(baseDist, 5.2 / (2 * aspect * Math.tan(fovRad)));
      }
      const offsetX = getPanelOffsetX(baseDist);
      const [tx, ty, tz] = reg.cameraTarget;

      return {
        target: new THREE.Vector3(tx + offsetX, ty, tz),
        cameraPos: new THREE.Vector3(tx + offsetX, ty - 1.5, baseDist)
      };
    }

    const [tx, ty, tz] = reg.cameraTarget;
    const zoomDist = 10.5 / reg.zoom;
    const offsetX = getPanelOffsetX(zoomDist);
    return {
      target: new THREE.Vector3(tx + offsetX, ty, tz),
      cameraPos: new THREE.Vector3(tx + offsetX, ty - 0.8, zoomDist)
    };
  }, [selectedRegion, selectedDam, size.width, size.height, camera]);

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
// Province 3D Mesh Component (Low-Relief Extruded Clay)
// ----------------------------------------------------
const ProvinceMesh: React.FC<{
  feature: any;
  selectedRegion: RegionId;
  onSelectRegion: (reg: RegionId) => void;
  theme?: 'light' | 'dark';
}> = React.memo(({ feature, selectedRegion, onSelectRegion, theme = 'light' }) => {
  const [hovered, setHovered] = useState(false);

  const regionNameRaw = (feature.properties?.reg_royin || 'Central').toLowerCase() as RegionId;
  const isRegionActive = selectedRegion === 'all' || selectedRegion === regionNameRaw;
  const isSelectedRegion = selectedRegion === regionNameRaw;

  // Shapes cached per feature
  const shapes = useMemo(() => {
    return createShapesFromMultiPolygon(feature.geometry.coordinates);
  }, [feature]);

  // Elevation based on region terrain
  const regionConfig = REGION_COLORS[regionNameRaw] || REGION_COLORS.central;
  const extrudeDepth = regionConfig.elevation + (isSelectedRegion ? 0.08 : 0);

  const extrudeSettings = useMemo(() => ({
    depth: extrudeDepth,
    bevelEnabled: true,
    bevelSegments: 2,
    steps: 1,
    bevelSize: 0.015,
    bevelThickness: 0.015
  }), [extrudeDepth]);

  // Color calculation matching Design.md
  const color = useMemo(() => {
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
  }, [hovered, isRegionActive, isSelectedRegion, selectedRegion, regionConfig, theme]);

  return (
    <group>
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
          onClick={(e) => {
            e.stopPropagation();
            onSelectRegion(regionNameRaw);
          }}
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

  // Subtle 3D leader line connecting pin top to floating label
  const leaderLine = useMemo(() => {
    const p1 = new THREE.Vector3(0, 0, isSmallDam ? 0.03 : 0.18);
    const p2 = new THREE.Vector3(
      labelConfig.offset3D[0] * 0.75,
      labelConfig.offset3D[1] * 0.75,
      labelConfig.offset3D[2] * 0.90
    );
    const geom = new THREE.BufferGeometry().setFromPoints([p1, p2]);
    const mat = new THREE.LineBasicMaterial({
      color: dam.status_color,
      transparent: true,
      opacity: hovered || isSelected ? 0.85 : 0.35
    });
    return new THREE.Line(geom, mat);
  }, [labelConfig, isSmallDam, dam.status_color, hovered, isSelected]);

  if (!isVisible) return null;

  // Label visibility:
  // - Major dam: always display compact pill, expand on hover/select
  // - Small dam: display only when hovered or selected
  const showLabel = isMajor || hovered || isSelected;

  return (
    <group position={[x, y, baseZ]}>
      {/* 3D Pin Geometry */}
      {isSmallDam ? (
        // Small dam tactile dot
        <>
          {/* Hit Sphere */}
          <mesh
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
            onClick={(e) => {
              e.stopPropagation();
              onSelectDam(dam);
            }}
          >
            <sphereGeometry args={[0.09, 12, 12]} />
            <meshBasicMaterial transparent opacity={0} depthWrite={false} />
          </mesh>

          {/* Outer glowing halo ring */}
          <mesh ref={ringRef} position={[0, 0, 0.005]}>
            <ringGeometry args={[0.035, 0.055, 20]} />
            <meshBasicMaterial
              color={dam.status_color}
              transparent
              opacity={hovered || isSelected ? 0.85 : (dam.status === 'critical' ? 0.6 : 0.3)}
            />
          </mesh>

          {/* 3D Dot Core */}
          <mesh position={[0, 0, 0.02]} scale={isSelected || hovered ? 1.45 : 1.0}>
            <sphereGeometry args={[0.032, 16, 16]} />
            <meshStandardMaterial
              color={dam.status_color}
              emissive={dam.status_color}
              emissiveIntensity={hovered || isSelected ? 0.9 : (dam.status === 'critical' ? 0.65 : 0.3)}
              roughness={0.25}
              metalness={0.1}
            />
          </mesh>
        </>
      ) : (
        // Major dam pin
        <>
          {/* Pulse ground ring */}
          <mesh ref={ringRef} position={[0, 0, -0.05]}>
            <ringGeometry args={[0.04, 0.08, 16]} />
            <meshBasicMaterial
              color={dam.status_color}
              transparent
              opacity={dam.status === 'critical' ? 0.8 : 0.4}
            />
          </mesh>

          {/* Pin Stem */}
          <mesh
            position={[0, 0, 0.08]}
            rotation={[Math.PI / 2, 0, 0]}
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
            onClick={(e) => {
              e.stopPropagation();
              onSelectDam(dam);
            }}
          >
            <cylinderGeometry args={[0.015, 0.01, 0.16, 8]} />
            <meshStandardMaterial
              color={theme === 'dark' ? '#E2E8F0' : '#64748B'}
              metalness={0.8}
              roughness={0.2}
            />
          </mesh>

          {/* Pin Head Sphere */}
          <mesh
            position={[0, 0, 0.18]}
            scale={isSelected || hovered ? 1.4 : 1.0}
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
            onClick={(e) => {
              e.stopPropagation();
              onSelectDam(dam);
            }}
          >
            <sphereGeometry args={[0.05, 16, 16]} />
            <meshStandardMaterial
              color={dam.status_color}
              emissive={dam.status_color}
              emissiveIntensity={dam.status === 'critical' ? 0.7 : 0.3}
              roughness={0.3}
            />
          </mesh>
        </>
      )}

      {/* 3D Connector Leader Line when label is displayed */}
      {showLabel && <primitive object={leaderLine} />}

      {/* Floating Anti-Collision Label */}
      {showLabel && (
        <Html
          position={labelConfig.offset3D}
          center
          distanceFactor={8.5}
          style={{
            zIndex: isSelected ? 60 : (hovered ? 50 : 10),
            pointerEvents: 'none'
          }}
        >
          <div
            className="relative select-none pointer-events-auto transition-transform duration-200 ease-out"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
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
  selectedDam,
  dams,
  onSelectRegion,
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
        <CameraController selectedRegion={selectedRegion} selectedDam={selectedDam} />

        {/* 3D Map Group */}
        <group>
          {/* All 77 Provinces rendered with low-relief extrusion */}
          {provincesGeoData.features.map((feature: any) => (
            <ProvinceMesh
              key={feature.properties.pro_code || feature.properties.pro_en}
              feature={feature}
              selectedRegion={selectedRegion}
              onSelectRegion={onSelectRegion}
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

      {/* Floating 3D Navigation Guide Tip */}
      <div className="absolute bottom-4 left-4 z-10 pointer-events-none hidden sm:flex items-center gap-2 bg-white/85 dark:bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 shadow-md">
        <span className="w-2 h-2 rounded-full bg-cyan-500 dark:bg-cyan-400 animate-pulse" />
        <span>
          {lang === 'th' 
            ? 'คลิกที่ภูมิภาคเพื่อ Drill-Down | หมุนมุมมองได้อิสระ (Drag & Scroll)'
            : 'Click region to Drill-Down | Rotate & Zoom freely'}
        </span>
      </div>
    </div>
  );
};
