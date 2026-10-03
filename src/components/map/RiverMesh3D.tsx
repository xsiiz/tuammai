import React, { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { RegionId, DamTelemetry } from '../../types/dam';
import { RiverFeature } from '../../types/river';
import { lineStringTo3DPoints } from '../../utils/geoUtils';

interface RiverMesh3DProps {
  river: RiverFeature;
  selectedRegion: RegionId;
  selectedDam: DamTelemetry | null;
  dams: DamTelemetry[];
  theme?: 'light' | 'dark';
  lang: 'th' | 'en';
}

export const RiverMesh3D: React.FC<RiverMesh3DProps> = ({
  river,
  selectedRegion,
  selectedDam,
  dams,
  theme = 'light',
  lang
}) => {
  const [hovered, setHovered] = useState(false);
  const particle1Ref = useRef<THREE.Mesh>(null);
  const particle2Ref = useRef<THREE.Mesh>(null);
  const particle3Ref = useRef<THREE.Mesh>(null);

  // Check relationship with selected dam
  const isConnectedToSelectedDam = Boolean(
    selectedDam && river.connected_dams.includes(selectedDam.id)
  );

  // Check visibility based on regional drill-down
  const isVisible = useMemo(() => {
    if (selectedRegion === 'all') {
      return river.major || isConnectedToSelectedDam;
    }
    return river.region === selectedRegion || isConnectedToSelectedDam;
  }, [selectedRegion, river.major, river.region, isConnectedToSelectedDam]);

  // Find connected dam objects to compute outflow volume
  const connectedDamObjects = useMemo(() => {
    return dams.filter((d) => river.connected_dams.includes(d.id));
  }, [dams, river.connected_dams]);

  const totalOutflow = useMemo(() => {
    return connectedDamObjects.reduce((sum, d) => sum + (d.outflow_mcm || 0), 0);
  }, [connectedDamObjects]);

  // Build smooth 3D spline curve and tube geometry
  const { curve, geometry } = useMemo(() => {
    const points = lineStringTo3DPoints(
      river.coordinates,
      isConnectedToSelectedDam ? 0.026 : 0.016
    );
    const spline = new THREE.CatmullRomCurve3(points, false, 'centripetal', 0.5);

    const segments = Math.max(river.coordinates.length * 6, 32);
    const radius = isConnectedToSelectedDam
      ? 0.022
      : hovered
      ? 0.018
      : river.major
      ? 0.014
      : 0.009;

    const tube = new THREE.TubeGeometry(spline, segments, radius, 8, false);
    return { curve: spline, geometry: tube };
  }, [river.coordinates, isConnectedToSelectedDam, hovered, river.major]);

  // Flow animation speed based on dam outflow
  // Higher outflow = faster animated water beads
  const flowSpeed = useMemo(() => {
    const base = isConnectedToSelectedDam ? 0.22 : 0.12;
    if (totalOutflow > 10) return base * 1.8;
    if (totalOutflow > 3) return base * 1.3;
    return base;
  }, [isConnectedToSelectedDam, totalOutflow]);

  useFrame(({ clock }) => {
    if (!isVisible || !curve) return;
    const t = clock.getElapsedTime() * flowSpeed;

    // Advance 3 glowing water particles along the river reach
    if (particle1Ref.current) {
      const p1 = curve.getPointAt(t % 1);
      particle1Ref.current.position.set(p1.x, p1.y, p1.z + 0.005);
    }
    if (particle2Ref.current) {
      const p2 = curve.getPointAt((t + 0.35) % 1);
      particle2Ref.current.position.set(p2.x, p2.y, p2.z + 0.005);
    }
    if (particle3Ref.current) {
      const p3 = curve.getPointAt((t + 0.7) % 1);
      particle3Ref.current.position.set(p3.x, p3.y, p3.z + 0.005);
    }
  });

  if (!isVisible) return null;

  // River color according to Design.md tokens
  const riverColor = isConnectedToSelectedDam
    ? '#38BDF8' // Bright Cyan Highlight
    : hovered
    ? '#06B6D4' // Cyan 500
    : theme === 'dark'
    ? '#0284C7' // Sky 600
    : '#0EA5E9'; // Sky 500

  const emissiveColor = isConnectedToSelectedDam ? '#38BDF8' : '#06B6D4';
  const emissiveIntensity = isConnectedToSelectedDam ? 0.8 : (hovered ? 0.5 : 0.2);

  // Midpoint coordinate for floating label on hover
  const midPoint = curve.getPointAt(0.5);

  return (
    <group>
      {/* 3D River Channel Tube */}
      <mesh
        geometry={geometry}
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
      >
        <meshStandardMaterial
          color={riverColor}
          emissive={emissiveColor}
          emissiveIntensity={emissiveIntensity}
          roughness={0.2}
          metalness={0.1}
          transparent
          opacity={isConnectedToSelectedDam ? 0.95 : (hovered ? 0.9 : 0.75)}
        />
      </mesh>

      {/* Flowing Water Beads (Particles) traveling downstream from dam */}
      <mesh ref={particle1Ref}>
        <sphereGeometry args={[isConnectedToSelectedDam ? 0.026 : 0.016, 12, 12]} />
        <meshBasicMaterial
          color={theme === 'dark' ? '#E0F2FE' : '#FFFFFF'}
          transparent
          opacity={0.9}
        />
      </mesh>

      <mesh ref={particle2Ref}>
        <sphereGeometry args={[isConnectedToSelectedDam ? 0.022 : 0.014, 12, 12]} />
        <meshBasicMaterial
          color={theme === 'dark' ? '#BAE6FD' : '#E0F2FE'}
          transparent
          opacity={0.8}
        />
      </mesh>

      <mesh ref={particle3Ref}>
        <sphereGeometry args={[isConnectedToSelectedDam ? 0.022 : 0.014, 12, 12]} />
        <meshBasicMaterial
          color={theme === 'dark' ? '#7DD3FC' : '#BAE6FD'}
          transparent
          opacity={0.8}
        />
      </mesh>

      {/* Interactive Tooltip on Hover */}
      {(hovered || isConnectedToSelectedDam) && (
        <Html
          position={[midPoint.x, midPoint.y + 0.08, midPoint.z + 0.08]}
          center
          distanceFactor={9.5}
          style={{ pointerEvents: 'none' }}
        >
          <div className="flex flex-col items-center animate-fadeIn select-none pointer-events-none">
            <div
              className={`px-2.5 py-1.5 rounded-xl text-[10px] font-medium whitespace-nowrap shadow-2xl border backdrop-blur-md flex flex-col gap-0.5 ${
                theme === 'dark'
                  ? 'bg-slate-900/95 text-white border-cyan-500/50'
                  : 'bg-white/95 text-slate-900 border-sky-400/60'
              }`}
            >
              <div className="flex items-center gap-1.5 font-bold">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                <span className="text-[11px] text-cyan-600 dark:text-cyan-300">
                  {lang === 'th' ? river.name_th : river.name_en}
                </span>
                <span className="text-[9px] px-1.5 py-0.2 rounded font-normal bg-sky-500/10 text-sky-600 dark:text-sky-300">
                  {lang === 'th' ? river.basin_th : river.basin}
                </span>
              </div>

              {connectedDamObjects.length > 0 && (
                <div className="text-[9px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <span>
                    {lang === 'th' ? 'เขื่อนต้นน้ำ:' : 'Upstream Dams:'}
                  </span>
                  <span className="font-semibold text-slate-700 dark:text-slate-200">
                    {connectedDamObjects.map((d) => (lang === 'th' ? d.name_th : d.name_en)).join(', ')}
                  </span>
                  {totalOutflow > 0 && (
                    <span className="font-mono text-cyan-600 dark:text-cyan-400">
                      ({totalOutflow.toFixed(2)} MCM/d)
                    </span>
                  )}
                </div>
              )}
            </div>
            <div
              className={`w-1.5 h-1.5 rotate-45 -mt-0.8 border-r border-b ${
                theme === 'dark' ? 'bg-slate-900 border-cyan-500/50' : 'bg-white border-sky-400/60'
              }`}
            />
          </div>
        </Html>
      )}
    </group>
  );
};
