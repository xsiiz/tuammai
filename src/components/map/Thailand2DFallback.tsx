import React, { useMemo, useState } from 'react';
import { RegionId, DamTelemetry } from '../../types/dam';
import { REGIONS } from '../../data/regions';
import { REGION_COLORS, multiPolygonToSvgPath, lineStringToSvgPath } from '../../utils/geoUtils';
import provincesGeoData from '../../data/thailand-provinces.json';
import riversGeoData from '../../data/thailand-rivers.json';
import { getRiverTelemetry } from '../../data/riverStations';

interface Thailand2DFallbackProps {
  lang: 'th' | 'en';
  selectedRegion: RegionId;
  selectedDam: DamTelemetry | null;
  dams: DamTelemetry[];
  onSelectRegion: (region: RegionId) => void;
  onSelectDam: (dam: DamTelemetry) => void;
  theme?: 'light' | 'dark';
}

// Fixed dimensions for SVG canvas
const SVG_WIDTH = 600;
const SVG_HEIGHT = 1000;

// Coordinate bounds of Thailand
const THAILAND_BOUNDS = {
  minLng: 97.2,
  maxLng: 105.8,
  minLat: 5.5,
  maxLat: 20.6
};

// Regional ViewBox presets for smooth 2D drill-down
const REGION_VIEWBOXES: Record<RegionId, string> = {
  all: `0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`,
  north: '80 30 350 400',
  northeast: '220 220 370 380',
  central: '140 400 300 320',
  west: '50 380 280 360',
  east: '220 480 280 300',
  south: '80 620 340 380'
};

export const Thailand2DFallback: React.FC<Thailand2DFallbackProps> = ({
  lang,
  selectedRegion,
  selectedDam,
  dams,
  onSelectRegion,
  onSelectDam,
  theme = 'light'
}) => {
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);
  const [hoveredDamId, setHoveredDamId] = useState<string | null>(null);
  const [hoveredRiverId, setHoveredRiverId] = useState<string | null>(null);

  // Pre-project all provinces into SVG paths
  const projectedProvinces = useMemo(() => {
    return provincesGeoData.features.map((feature: any) => {
      const regId = (feature.properties?.reg_royin || 'Central').toLowerCase() as RegionId;
      const pathD = multiPolygonToSvgPath(
        feature.geometry.coordinates,
        SVG_WIDTH,
        SVG_HEIGHT,
        THAILAND_BOUNDS
      );
      return {
        id: feature.properties.pro_code,
        name_th: feature.properties.pro_th,
        name_en: feature.properties.pro_en,
        region: regId,
        pathD
      };
    });
  }, []);

  // Pre-project all rivers into SVG paths with riverbank telemetry
  const projectedRivers = useMemo(() => {
    const lngRange = THAILAND_BOUNDS.maxLng - THAILAND_BOUNDS.minLng;
    const latRange = THAILAND_BOUNDS.maxLat - THAILAND_BOUNDS.minLat;

    return (riversGeoData.features as any[]).map((feature) => {
      const coords = feature.geometry.coordinates as [number, number][];
      const pathD = lineStringToSvgPath(
        coords,
        SVG_WIDTH,
        SVG_HEIGHT,
        THAILAND_BOUNDS
      );

      // Midpoint coordinate for hover tooltip
      const midCoord = coords[Math.floor(coords.length / 2)] || coords[0];
      const midX = ((midCoord[0] - THAILAND_BOUNDS.minLng) / lngRange) * (SVG_WIDTH * 0.9) + SVG_WIDTH * 0.05;
      const midY = ((THAILAND_BOUNDS.maxLat - midCoord[1]) / latRange) * (SVG_HEIGHT * 0.9) + SVG_HEIGHT * 0.05;

      const connectedDamIds = feature.properties.connected_dams as string[];
      const connectedDams = dams.filter((d) => connectedDamIds.includes(d.id));
      const riverTelemetry = getRiverTelemetry(feature.id);
      const avgWaterLevel = riverTelemetry
        ? riverTelemetry.avg_bank_percent
        : (connectedDams.length > 0
          ? connectedDams.reduce((s, d) => s + (d.storage_percent || 0), 0) / connectedDams.length
          : null);
      const statusColor = riverTelemetry?.status_color || '#10B981';

      return {
        id: feature.id,
        name_th: feature.properties.name_th,
        name_en: feature.properties.name_en,
        basin: feature.properties.basin,
        basin_th: feature.properties.basin_th,
        region: feature.properties.region as RegionId,
        connected_dams: connectedDamIds,
        major: feature.properties.major as boolean,
        avgWaterLevel,
        statusColor,
        midX,
        midY,
        pathD
      };
    });
  }, [dams]);

  // Project dam coordinates to SVG (x, y)
  const projectedDams = useMemo(() => {
    const lngRange = THAILAND_BOUNDS.maxLng - THAILAND_BOUNDS.minLng;
    const latRange = THAILAND_BOUNDS.maxLat - THAILAND_BOUNDS.minLat;

    return dams.map((dam) => {
      const x = ((dam.coordinates[0] - THAILAND_BOUNDS.minLng) / lngRange) * (SVG_WIDTH * 0.9) + SVG_WIDTH * 0.05;
      const y = ((THAILAND_BOUNDS.maxLat - dam.coordinates[1]) / latRange) * (SVG_HEIGHT * 0.9) + SVG_HEIGHT * 0.05;
      return {
        ...dam,
        svgX: x,
        svgY: y
      };
    });
  }, [dams]);

  const currentViewBox = REGION_VIEWBOXES[selectedRegion] || REGION_VIEWBOXES.all;

  return (
    <div className={`relative w-full h-full flex items-center justify-center p-2 sm:p-6 md:pr-84 lg:pr-96 overflow-hidden transition-colors duration-300 ${theme === 'dark' ? 'bg-[#0B1120]' : 'bg-[#E2E8F0]/30'}`}>
      <svg
        viewBox={currentViewBox}
        className="w-full h-full max-h-[85vh] transition-all duration-700 ease-in-out drop-shadow-2xl"
      >
        <defs>
          <radialGradient id="oceanGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={theme === 'dark' ? '#0B132B' : '#BAE6FD'} stopOpacity="0.8" />
            <stop offset="100%" stopColor={theme === 'dark' ? '#070B14' : '#E2E8F0'} stopOpacity="1" />
          </radialGradient>
        </defs>

        {/* Ocean Background */}
        <rect width={SVG_WIDTH} height={SVG_HEIGHT} fill="url(#oceanGlow)" rx={20} />

        {/* Provinces Layer */}
        <g>
          {projectedProvinces.map((prov) => {
            const isRegActive = selectedRegion === 'all' || selectedRegion === prov.region;
            const isSelectedReg = selectedRegion === prov.region;
            const isHovered = hoveredRegion === prov.region;

            const regConfig = REGION_COLORS[prov.region];
            let fillColor = theme === 'dark' ? '#1E293B' : '#E2E8F0'; // Inactive slate
            if (isHovered && isRegActive) fillColor = regConfig?.highlight || '#38BDF8';
            else if (isSelectedReg) fillColor = regConfig?.highlight || '#0284C7';
            else if (selectedRegion === 'all') fillColor = regConfig?.base || (theme === 'dark' ? '#64748B' : '#94A3B8');

            return (
              <path
                key={prov.id}
                d={prov.pathD}
                fill={fillColor}
                stroke={theme === 'dark' ? '#0F172A' : '#FFFFFF'}
                strokeWidth={1}
                className="cursor-pointer transition-colors duration-200"
                onMouseEnter={() => setHoveredRegion(prov.region)}
                onMouseLeave={() => setHoveredRegion(null)}
                onClick={() => onSelectRegion(prov.region)}
              >
                <title>{`${prov.name_th} (${prov.name_en}) - ${prov.region}`}</title>
              </path>
            );
          })}
        </g>

        {/* River Outflow Network Layer */}
        <g id="rivers-layer">
          {projectedRivers.map((river) => {
            const isConnectedToSelectedDam = Boolean(
              selectedDam && river.connected_dams.includes(selectedDam.id)
            );
            const isRegionActive =
              selectedRegion === 'all' ||
              river.region === selectedRegion ||
              isConnectedToSelectedDam;

            const isHovered = hoveredRiverId === river.id;

            const strokeColor = isConnectedToSelectedDam
              ? '#0284C7'
              : isHovered
              ? '#06B6D4'
              : isRegionActive
              ? (theme === 'dark' ? '#0EA5E9' : '#0284C7')
              : (theme === 'dark' ? '#0369A1' : '#38BDF8');

            const strokeW = isConnectedToSelectedDam
              ? 3.8
              : isHovered
              ? 3.2
              : isRegionActive
              ? (river.major ? 2.2 : 1.4)
              : (river.major ? 1.6 : 1.0);

            const riverOpacity = isConnectedToSelectedDam
              ? 1
              : isHovered
              ? 1
              : isRegionActive
              ? 0.85
              : 0.55;

            // Alert status color according to Design.md
            const statusColor =
              river.avgWaterLevel === null
                ? '#06B6D4'
                : river.avgWaterLevel > 100 || river.avgWaterLevel < 30
                ? '#EF4444'
                : (river.avgWaterLevel >= 80 && river.avgWaterLevel <= 100) || (river.avgWaterLevel >= 30 && river.avgWaterLevel < 50)
                ? '#F59E0B'
                : '#10B981';

            const tooltipText = `${lang === 'th' ? river.name_th : river.name_en} - ${lang === 'th' ? 'ระดับน้ำเฉลี่ย' : 'Avg Water Level'} ${river.avgWaterLevel !== null ? `${river.avgWaterLevel.toFixed(1)}%` : '-'}`;

            return (
              <g
                key={river.id}
                className="cursor-pointer transition-all duration-200"
                onMouseEnter={() => setHoveredRiverId(river.id)}
                onMouseLeave={() => setHoveredRiverId(null)}
              >
                {/* Background casing line */}
                <path
                  d={river.pathD}
                  fill="none"
                  stroke={theme === 'dark' ? '#0F172A' : '#FFFFFF'}
                  strokeWidth={strokeW + 1.6}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={isRegionActive ? 0.7 : 0.4}
                />

                {/* Flowing animated river path */}
                <path
                  d={river.pathD}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth={strokeW}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={isConnectedToSelectedDam ? 'river-flow-fast' : isRegionActive ? 'river-flow-animated' : undefined}
                  opacity={riverOpacity}
                >
                  <title>{tooltipText}</title>
                </path>

                {/* Floating tooltip on hover (River Name & Average Water Level) */}
                {isHovered && (
                  <g className="pointer-events-none animate-fadeIn select-none" transform={`translate(${river.midX}, ${river.midY - 14})`}>
                    <rect
                      x={-75}
                      y={-12}
                      width={150}
                      height={24}
                      rx={8}
                      fill={theme === 'dark' ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)'}
                      stroke={theme === 'dark' ? '#06B6D4' : '#0284C7'}
                      strokeWidth={1.2}
                      className="filter drop-shadow-xl"
                    />
                    <circle
                      cx={-64}
                      cy={0}
                      r={3.5}
                      fill={statusColor}
                    />
                    <text
                      x={-54}
                      y={4}
                      fill={theme === 'dark' ? '#F8FAFC' : '#0F172A'}
                      fontSize={9.5}
                      fontWeight={700}
                    >
                      {lang === 'th' ? river.name_th : river.name_en}
                    </text>
                    <text
                      x={26}
                      y={4}
                      fill={statusColor}
                      fontSize={9.5}
                      fontWeight={700}
                    >
                      {river.avgWaterLevel !== null ? `${river.avgWaterLevel.toFixed(1)}%` : '-'}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </g>

        {/* Dam Markers Layer */}
        <g>
          {projectedDams.map((dam) => {
            const isTop10 = Boolean(dam.national_rank && dam.national_rank <= 10);
            const isMajor = Boolean(isTop10 || (dam.region === 'east' && dam.national_rank === 14));
            const isSmallDam = !isMajor;

            // In national overview, show only top 10 largest dams.
            // On drill-down into a region, show all dams of that region.
            const isVisible = selectedRegion === 'all'
              ? (isTop10 || selectedDam?.id === dam.id)
              : (selectedRegion === dam.region);
            if (!isVisible) return null;

            const isSelected = selectedDam?.id === dam.id;
            const isHovered = hoveredDamId === dam.id;

            return (
              <g
                key={dam.id}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredDamId(dam.id)}
                onMouseLeave={() => setHoveredDamId(null)}
                onClick={() => onSelectDam(dam)}
              >
                {/* Ping ring for critical */}
                {dam.status === 'critical' && (
                  <circle
                    cx={dam.svgX}
                    cy={dam.svgY}
                    r={isSmallDam ? 8 : 12}
                    fill="none"
                    stroke={dam.status_color}
                    strokeWidth={1.5}
                    opacity={0.6}
                    className="animate-ping"
                  />
                )}

                {/* Invisible larger hit target for smooth hover */}
                <circle
                  cx={dam.svgX}
                  cy={dam.svgY}
                  r={10}
                  fill="transparent"
                />

                {/* Base circle (Dot for small dam, larger marker for major) */}
                <circle
                  cx={dam.svgX}
                  cy={dam.svgY}
                  r={isSmallDam ? (isSelected || isHovered ? 5 : 3.2) : (isSelected ? 7 : 5)}
                  fill={dam.status_color}
                  stroke="#FFFFFF"
                  strokeWidth={isSelected ? 2 : (isSmallDam ? 1 : 1.5)}
                  className="filter drop-shadow-md transition-all duration-150"
                />

                {/* Floating label/tooltip:
                    - Major dam: visible when drilled down, or top 10 in national, or selected
                    - Small dam: visible ONLY when hovered or selected */}
                {((!isSmallDam && (selectedRegion !== 'all' || isTop10 || isSelected)) || (isSmallDam && (isHovered || isSelected))) && (
                  <g className="pointer-events-none animate-fadeIn select-none">
                    {isSmallDam && (
                      <rect
                        x={dam.svgX + 8}
                        y={dam.svgY - 12}
                        width={(lang === 'th' ? dam.name_th : dam.name_en).length * 8 + 50}
                        height={18}
                        rx={6}
                        fill={theme === 'dark' ? '#0F172A' : '#FFFFFF'}
                        stroke={`${dam.status_color}90`}
                        strokeWidth={1}
                        className="filter drop-shadow-lg"
                      />
                    )}
                    <text
                      x={dam.svgX + (isSmallDam ? 14 : 8)}
                      y={dam.svgY + (isSmallDam ? 1 : 4)}
                      fill={theme === 'dark' ? '#F8FAFC' : '#0F172A'}
                      fontSize={isSmallDam ? 9.5 : 10}
                      fontWeight={600}
                      className="select-none pointer-events-none drop-shadow"
                    >
                      {isTop10 && selectedRegion === 'all' ? `#${dam.national_rank} ` : ''}
                      {lang === 'th' ? dam.name_th : dam.name_en} ({dam.storage_percent.toFixed(0)}%)
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </g>
      </svg>

      {/* 2D Fallback Indicator Badge */}
      <div className="absolute bottom-4 left-4 z-10 hidden sm:flex items-center gap-2 bg-white/85 dark:bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 shadow-md">
        <span className="w-2 h-2 rounded-full bg-sky-500 dark:bg-sky-400" />
        <span>{lang === 'th' ? 'โหมดแผนที่ 2D ความละเอียดสูง (SVG View)' : '2D High-Resolution Vector Mode'}</span>
      </div>
    </div>
  );
};
