import React, { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { RegionId, DamTelemetry } from '../../types/dam';
import { RiverFeature } from '../../types/river';
import { lineStringTo3DPoints } from '../../utils/geoUtils';
import { getRiverTelemetry } from '../../data/riverStations';

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

  // Check if river belongs to the actively selected region or connected dam
  const isRegionActive = selectedRegion === 'all' || river.region === selectedRegion || isConnectedToSelectedDam;

  // Retrieve representative riverbank gauging station telemetry
  const riverTelemetry = useMemo(() => {
    return getRiverTelemetry(river.id);
  }, [river.id]);

  // Find connected dam objects to compute outflow volume
  const connectedDamObjects = useMemo(() => {
    return dams.filter((d) => river.connected_dams.includes(d.id));
  }, [dams, river.connected_dams]);

  // Average riverbank water level percentage (% เทียบระดับตลิ่ง)
  const avgWaterLevel = useMemo(() => {
    if (riverTelemetry) return riverTelemetry.avg_bank_percent;
    if (connectedDamObjects.length === 0) return null;
    const sum = connectedDamObjects.reduce((acc, d) => acc + (d.storage_percent || 0), 0);
    return sum / connectedDamObjects.length;
  }, [riverTelemetry, connectedDamObjects]);

  // Alert status color according to Design.md
  const statusColor = useMemo(() => {
    if (riverTelemetry) return riverTelemetry.status_color;
    if (avgWaterLevel === null) return '#06B6D4';
    if (avgWaterLevel > 100 || avgWaterLevel < 30) return '#EF4444'; // Critical
    if ((avgWaterLevel >= 80 && avgWaterLevel <= 100) || (avgWaterLevel >= 30 && avgWaterLevel < 50)) return '#F59E0B'; // Warning
    return '#10B981'; // Normal
  }, [riverTelemetry, avgWaterLevel]);

  const totalOutflow = useMemo(() => {
    return connectedDamObjects.reduce((sum, d) => sum + (d.outflow_mcm || 0), 0);
  }, [connectedDamObjects]);

  // Build smooth 3D spline curve and tube geometry with drill-down elevation matching
  const { curve, geometry } = useMemo(() => {
    const points = lineStringTo3DPoints(
      river.coordinates,
      isConnectedToSelectedDam ? 0.028 : isRegionActive ? 0.022 : 0.016,
      selectedRegion,
      river.region
    );
    const spline = new THREE.CatmullRomCurve3(points, false, 'centripetal', 0.5);

    const segments = Math.max(river.coordinates.length * 6, 32);
    const radius = isConnectedToSelectedDam
      ? 0.022
      : hovered
      ? 0.020
      : isRegionActive
      ? (river.major ? 0.015 : 0.011)
      : (river.major ? 0.012 : 0.008);

    const tube = new THREE.TubeGeometry(spline, segments, radius, 8, false);
    return { curve: spline, geometry: tube };
  }, [river.coordinates, isConnectedToSelectedDam, isRegionActive, hovered, river.major, selectedRegion, river.region]);

  // Flow animation speed based on dam outflow
  // Higher outflow = faster animated water beads
  const flowSpeed = useMemo(() => {
    const base = isConnectedToSelectedDam ? 0.22 : 0.12;
    if (totalOutflow > 10) return base * 1.8;
    if (totalOutflow > 3) return base * 1.3;
    return base;
  }, [isConnectedToSelectedDam, totalOutflow]);

  useFrame(({ clock }) => {
    if (!curve) return;
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

  // River color according to Design.md tokens
  const riverColor = isConnectedToSelectedDam
    ? '#38BDF8' // Bright Cyan Highlight
    : hovered
    ? '#06B6D4' // Cyan 500
    : isRegionActive
    ? (theme === 'dark' ? '#0284C7' : '#0EA5E9')
    : (theme === 'dark' ? '#0369A1' : '#38BDF8'); // Visible river line across country

  const emissiveColor = isConnectedToSelectedDam ? '#38BDF8' : hovered ? '#06B6D4' : '#0284C7';
  const emissiveIntensity = isConnectedToSelectedDam ? 0.8 : (hovered ? 0.6 : (isRegionActive ? 0.25 : 0.1));

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
          opacity={isConnectedToSelectedDam ? 0.95 : (hovered ? 0.95 : (isRegionActive ? 0.85 : 0.6))}
        />
      </mesh>

      {/* Flowing Water Beads (Particles) traveling downstream from dam */}
      <mesh ref={particle1Ref}>
        <sphereGeometry args={[isConnectedToSelectedDam ? 0.026 : isRegionActive ? 0.016 : 0.012, 12, 12]} />
        <meshBasicMaterial
          color={theme === 'dark' ? '#E0F2FE' : '#FFFFFF'}
          transparent
          opacity={isRegionActive ? 0.9 : 0.5}
        />
      </mesh>

      <mesh ref={particle2Ref}>
        <sphereGeometry args={[isConnectedToSelectedDam ? 0.022 : isRegionActive ? 0.014 : 0.010, 12, 12]} />
        <meshBasicMaterial
          color={theme === 'dark' ? '#BAE6FD' : '#E0F2FE'}
          transparent
          opacity={isRegionActive ? 0.8 : 0.4}
        />
      </mesh>

      <mesh ref={particle3Ref}>
        <sphereGeometry args={[isConnectedToSelectedDam ? 0.022 : isRegionActive ? 0.014 : 0.010, 12, 12]} />
        <meshBasicMaterial
          color={theme === 'dark' ? '#7DD3FC' : '#BAE6FD'}
          transparent
          opacity={isRegionActive ? 0.8 : 0.4}
        />
      </mesh>

      {/* Interactive Tooltip on Hover: Show only river name and average water level */}
      {hovered && (
        <Html
          position={[midPoint.x, midPoint.y + 0.08, midPoint.z + 0.08]}
          center
          distanceFactor={9.5}
          zIndexRange={[100000000, 100000000]}
          wrapperClass="z-[999999] pointer-events-none"
          style={{ zIndex: 100000000, pointerEvents: 'none' }}
        >
          <div className="flex flex-col items-center animate-fadeIn select-none pointer-events-none relative z-50">
            <div
              className={`px-3 py-1.5 rounded-xl text-[11px] font-semibold whitespace-nowrap shadow-2xl border backdrop-blur-md flex items-center gap-2 ${
                theme === 'dark'
                  ? 'bg-slate-900/95 text-white border-cyan-500/50'
                  : 'bg-white/95 text-slate-900 border-sky-400/60'
              }`}
            >
              <span
                className="w-2 h-2 rounded-full animate-pulse flex-shrink-0"
                style={{ backgroundColor: statusColor }}
              />
              <span className="font-bold text-slate-900 dark:text-white">
                {lang === 'th' ? river.name_th : river.name_en}
              </span>
              <span className="text-slate-300 dark:text-slate-600">|</span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">
                {lang === 'th' ? 'ระดับน้ำเฉลี่ย' : 'Avg Water Level'}
              </span>
              <span
                className="font-mono text-[11px] font-bold px-1.5 py-0.5 rounded-md"
                style={{
                  backgroundColor: `${statusColor}20`,
                  color: statusColor
                }}
              >
                {avgWaterLevel !== null ? `${avgWaterLevel.toFixed(1)}%` : '-'}
              </span>
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
