import React, { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import { RegionId, DamTelemetry } from '../../types/dam';
import { REGIONS } from '../../data/regions';
import { geoTo3D, REGION_COLORS, createShapesFromMultiPolygon } from '../../utils/geoUtils';
import provincesGeoData from '../../data/thailand-provinces.json';

interface Thailand3DMapProps {
  lang: 'th' | 'en';
  selectedRegion: RegionId;
  selectedDam: DamTelemetry | null;
  dams: DamTelemetry[];
  onSelectRegion: (region: RegionId) => void;
  onSelectDam: (dam: DamTelemetry) => void;
}

// ----------------------------------------------------
// Smooth Camera Controller
// ----------------------------------------------------
const CameraController: React.FC<{
  selectedRegion: RegionId;
  selectedDam: DamTelemetry | null;
}> = ({ selectedRegion, selectedDam }) => {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);

  const targetCoords = useMemo(() => {
    if (selectedDam) {
      const [x, y, z] = geoTo3D(selectedDam.coordinates[0], selectedDam.coordinates[1]);
      return {
        target: new THREE.Vector3(x, y, z),
        cameraPos: new THREE.Vector3(x, y - 1.2, 3.0)
      };
    }

    const reg = REGIONS[selectedRegion] || REGIONS.all;
    if (selectedRegion === 'all') {
      return {
        target: new THREE.Vector3(0, 0, 0),
        cameraPos: new THREE.Vector3(0, -1.8, 8.8)
      };
    }

    const [tx, ty, tz] = reg.cameraTarget;
    const zoomDist = 8.5 / reg.zoom;
    return {
      target: new THREE.Vector3(tx, ty, tz),
      cameraPos: new THREE.Vector3(tx, ty - 0.8, zoomDist)
    };
  }, [selectedRegion, selectedDam]);

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
      maxDistance={14.0}
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
}> = React.memo(({ feature, selectedRegion, onSelectRegion }) => {
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
    return '#334155'; // Slate 700
  }, [hovered, isRegionActive, isSelectedRegion, selectedRegion, regionConfig]);

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
}> = React.memo(({ dam, selectedRegion, isSelected, onSelectDam, lang }) => {
  const [hovered, setHovered] = useState(false);
  const ringRef = useRef<THREE.Mesh>(null);

  const isVisible = selectedRegion === 'all' || selectedRegion === dam.region;
  const [x, y, baseZ] = useMemo(() => {
    return geoTo3D(dam.coordinates[0], dam.coordinates[1], 0.35);
  }, [dam.coordinates]);

  // Pulse animation for critical & warning pins
  useFrame(({ clock }) => {
    if (ringRef.current && isVisible) {
      const elapsed = clock.getElapsedTime() * 2;
      const scale = 1 + (Math.sin(elapsed) + 1) * 0.4;
      ringRef.current.scale.set(scale, scale, 1);
    }
  });

  if (!isVisible) return null;

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
          color="#E2E8F0"
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
      {(hovered || isSelected || selectedRegion !== 'all') && (
        <Html
          position={[0, 0.1, 0.22]}
          center
          distanceFactor={9}
          style={{ pointerEvents: 'none' }}
        >
          <div className="flex flex-col items-center animate-fadeIn select-none">
            <div 
              className="px-2 py-1 rounded-lg text-[10px] font-bold text-white whitespace-nowrap shadow-xl border flex items-center gap-1 backdrop-blur-md"
              style={{
                backgroundColor: 'rgba(15, 23, 42, 0.92)',
                borderColor: `${dam.status_color}80`
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: dam.status_color }} />
              <span>{lang === 'th' ? dam.name_th : dam.name_en}</span>
              <span
                className="font-mono text-[9px] px-1 py-0.2 rounded"
                style={{ backgroundColor: `${dam.status_color}30`, color: dam.status_color }}
              >
                {dam.storage_percent.toFixed(0)}%
              </span>
            </div>
            <div className="w-1 h-1 bg-slate-900 rotate-45 -mt-0.5 border-r border-b border-slate-700"></div>
          </div>
        </Html>
      )}
    </group>
  );
});

// ----------------------------------------------------
// Ocean / Base Pedestal Plate
// ----------------------------------------------------
const BasePedestal: React.FC = () => {
  return (
    <group position={[0, 0, -0.05]}>
      {/* Matte Low-Relief Base Shadow Plate */}
      <mesh receiveShadow position={[0, 0, -0.01]}>
        <planeGeometry args={[18, 18]} />
        <meshStandardMaterial
          color="#0B132B"
          roughness={0.9}
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
  onSelectDam
}) => {
  return (
    <div className="relative w-full h-full bg-[#0B1120] select-none">
      <Canvas
        camera={{ position: [0, -1.8, 8.8], fov: 45, near: 0.1, far: 50 }}
        shadows
        gl={{ antialias: true, alpha: false }}
        className="w-full h-full"
      >
        {/* Ambient & Studio Directional Lighting for Low-Relief Clay */}
        <ambientLight intensity={0.9} />
        <directionalLight
          position={[5, 8, 10]}
          intensity={1.4}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
          shadow-camera-near={0.5}
          shadow-camera-far={25}
        />
        <directionalLight position={[-6, -4, 6]} intensity={0.5} color="#38BDF8" />
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
            />
          ))}

          {/* Underlay Pedestal */}
          <BasePedestal />
        </group>
      </Canvas>

      {/* Floating 3D Navigation Guide Tip */}
      <div className="absolute bottom-4 left-4 z-10 pointer-events-none hidden sm:flex items-center gap-2 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 text-[11px] text-slate-400">
        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
        <span>
          {lang === 'th' 
            ? 'คลิกที่ภูมิภาคเพื่อ Drill-Down | หมุนมุมมองได้อิสระ (Drag & Scroll)'
            : 'Click region to Drill-Down | Rotate & Zoom freely'}
        </span>
      </div>
    </div>
  );
};
