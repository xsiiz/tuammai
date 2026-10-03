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

  if (!isVisible) return null;

  // 1) Small Dam (เขื่อนเล็ก): Render as a sleek tactile 3D dot
  if (isSmallDam) {
    return (
      <group position={[x, y, baseZ]}>
        {/* Invisible hit sphere for effortless hover & click */}
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
        <mesh
          position={[0, 0, 0.02]}
          scale={isSelected || hovered ? 1.45 : 1.0}
        >
          <sphereGeometry args={[0.032, 16, 16]} />
          <meshStandardMaterial
            color={dam.status_color}
            emissive={dam.status_color}
            emissiveIntensity={hovered || isSelected ? 0.9 : (dam.status === 'critical' ? 0.65 : 0.3)}
            roughness={0.25}
            metalness={0.1}
          />
        </mesh>

        {/* Floating Tooltip ONLY on Hover or Selection */}
        {(hovered || isSelected) && (
          <Html
            position={[0, 0.06, 0.06]}
            center
            distanceFactor={8.5}
            style={{ pointerEvents: 'none' }}
          >
            <div className="flex flex-col items-center animate-fadeIn select-none pointer-events-none">
              <div 
                className={`px-2 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap shadow-xl border flex items-center gap-1.5 backdrop-blur-md ${
                  theme === 'dark' ? 'text-white' : 'text-slate-900'
                }`}
                style={{
                  backgroundColor: theme === 'dark' ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                  borderColor: `${dam.status_color}90`
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: dam.status_color }} />
                <span>{lang === 'th' ? dam.name_th : dam.name_en}</span>
                <span
                  className="font-mono text-[9px] px-1 py-0.2 rounded font-bold"
                  style={{ backgroundColor: `${dam.status_color}25`, color: dam.status_color }}
                >
                  {dam.storage_percent.toFixed(0)}%
                </span>
              </div>
              <div 
                className={`w-1.5 h-1.5 rotate-45 -mt-0.8 border-r border-b ${
                  theme === 'dark' ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300'
                }`}
              />
            </div>
          </Html>
        )}
      </group>
    );
  }

  // 2) Major Dam (เขื่อนหลัก): 3D Pin with Stem, Head, and Floating Tag
  return (
    <group position={[x, y, baseZ]}>
      {/* Pulse ground ring */}
      <mesh ref={ringRef} position={[0, 0, -0.05]} rotation={[0, 0, 0]}>
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

      {/* Hover / Active Floating Tag */}
      {(hovered || isSelected || selectedRegion !== 'all' || isTop10) && (
        <Html
          position={[0, 0.1, 0.22]}
          center
          distanceFactor={9}
          style={{ pointerEvents: 'none' }}
        >
          <div className="flex flex-col items-center animate-fadeIn select-none">
            <div 
              className={`px-2 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap shadow-xl border flex items-center gap-1 backdrop-blur-md ${
                theme === 'dark' ? 'text-white' : 'text-slate-900'
              }`}
              style={{
                backgroundColor: theme === 'dark' ? 'rgba(15, 23, 42, 0.92)' : 'rgba(255, 255, 255, 0.95)',
                borderColor: `${dam.status_color}80`
              }}
            >
              {dam.national_rank && dam.national_rank <= 10 && (
                <span className="font-mono text-[9px] px-1 py-0.2 rounded font-bold bg-amber-500/20 text-amber-600 dark:text-amber-400">
                  #{dam.national_rank}
                </span>
              )}
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: dam.status_color }} />
              <span>{lang === 'th' ? dam.name_th : dam.name_en}</span>
              <span
                className="font-mono text-[9px] px-1 py-0.2 rounded"
                style={{ backgroundColor: `${dam.status_color}25`, color: dam.status_color }}
              >
                {dam.storage_percent.toFixed(0)}%
              </span>
            </div>
            <div 
              className={`w-1 h-1 rotate-45 -mt-0.5 border-r border-b ${
                theme === 'dark' ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300'
              }`}
            />
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
