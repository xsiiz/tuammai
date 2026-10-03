import React, { useMemo, useState } from 'react';
import { RegionId, DamTelemetry } from '../../types/dam';
import { REGIONS } from '../../data/regions';
import { REGION_COLORS, multiPolygonToSvgPath } from '../../utils/geoUtils';
import provincesGeoData from '../../data/thailand-provinces.json';

interface Thailand2DFallbackProps {
  lang: 'th' | 'en';
  selectedRegion: RegionId;
  selectedDam: DamTelemetry | null;
  dams: DamTelemetry[];
  onSelectRegion: (region: RegionId) => void;
  onSelectDam: (dam: DamTelemetry) => void;
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
  onSelectDam
}) => {
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);

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
    <div className="relative w-full h-full bg-[#0B1120] flex items-center justify-center p-2 sm:p-6 overflow-hidden">
      <svg
        viewBox={currentViewBox}
        className="w-full h-full max-h-[85vh] transition-all duration-700 ease-in-out drop-shadow-2xl"
      >
        <defs>
          <radialGradient id="oceanGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#0B132B" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#070B14" stopOpacity="1" />
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
            let fillColor = '#1E293B'; // Inactive slate
            if (isHovered && isRegActive) fillColor = regConfig?.highlight || '#38BDF8';
            else if (isSelectedReg) fillColor = regConfig?.highlight || '#0284C7';
            else if (selectedRegion === 'all') fillColor = regConfig?.base || '#64748B';

            return (
              <path
                key={prov.id}
                d={prov.pathD}
                fill={fillColor}
                stroke="#0F172A"
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

        {/* Dam Markers Layer */}
        <g>
          {projectedDams.map((dam) => {
            const isVisible = selectedRegion === 'all' || selectedRegion === dam.region;
            if (!isVisible) return null;

            const isSelected = selectedDam?.id === dam.id;

            return (
              <g
                key={dam.id}
                className="cursor-pointer transition-transform duration-200 hover:scale-125"
                onClick={() => onSelectDam(dam)}
              >
                {/* Ping ring for critical */}
                {dam.status === 'critical' && (
                  <circle
                    cx={dam.svgX}
                    cy={dam.svgY}
                    r={12}
                    fill="none"
                    stroke={dam.status_color}
                    strokeWidth={1.5}
                    opacity={0.6}
                    className="animate-ping"
                  />
                )}

                {/* Base circle */}
                <circle
                  cx={dam.svgX}
                  cy={dam.svgY}
                  r={isSelected ? 7 : 5}
                  fill={dam.status_color}
                  stroke="#FFFFFF"
                  strokeWidth={isSelected ? 2 : 1}
                  className="filter drop-shadow-md"
                />

                {/* Floating label if region selected */}
                {(selectedRegion !== 'all' || isSelected) && (
                  <text
                    x={dam.svgX + 8}
                    y={dam.svgY + 4}
                    fill="#F8FAFC"
                    fontSize={10}
                    fontWeight={600}
                    className="select-none pointer-events-none drop-shadow"
                  >
                    {lang === 'th' ? dam.name_th : dam.name_en} ({dam.storage_percent.toFixed(0)}%)
                  </text>
                )}
              </g>
            );
          })}
        </g>
      </svg>

      {/* 2D Fallback Indicator Badge */}
      <div className="absolute bottom-4 left-4 z-10 hidden sm:flex items-center gap-2 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 text-[11px] text-slate-400">
        <span className="w-2 h-2 rounded-full bg-sky-400" />
        <span>{lang === 'th' ? 'โหมดแผนที่ 2D ความละเอียดสูง (SVG View)' : '2D High-Resolution Vector Mode'}</span>
      </div>
    </div>
  );
};
