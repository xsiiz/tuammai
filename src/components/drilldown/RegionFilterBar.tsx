import React from 'react';
import { RegionId, DamTelemetry } from '../../types/dam';
import { REGIONS } from '../../data/regions';

interface RegionFilterBarProps {
  lang: 'th' | 'en';
  selectedRegion: RegionId;
  onSelectRegion: (region: RegionId) => void;
  dams: DamTelemetry[];
}

const REGION_ORDER: RegionId[] = ['all', 'north', 'northeast', 'central', 'west', 'east', 'south'];

export const RegionFilterBar: React.FC<RegionFilterBarProps> = ({
  lang,
  selectedRegion,
  onSelectRegion,
  dams
}) => {
  // Count dams and critical dams per region
  const getStats = (regionId: RegionId) => {
    const list = regionId === 'all' ? dams : dams.filter(d => d.region === regionId);
    const critical = list.filter(d => d.status === 'critical').length;
    return { total: list.length, critical };
  };

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
      {REGION_ORDER.map((regId) => {
        const info = REGIONS[regId];
        const isSelected = selectedRegion === regId;
        const stats = getStats(regId);

        return (
          <button
            key={regId}
            onClick={() => onSelectRegion(regId)}
            className={`group shrink-0 relative flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 border ${
              isSelected
                ? 'bg-gradient-to-r from-sky-600 to-cyan-600 text-white border-cyan-400/80 shadow-lg shadow-sky-600/30 font-semibold'
                : 'bg-slate-900/80 text-slate-300 hover:text-white hover:bg-slate-800/90 border-slate-800'
            }`}
          >
            <span>{lang === 'th' ? info.name_th : info.name_en}</span>

            {/* Total Dam Count Badge */}
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                isSelected
                  ? 'bg-white/25 text-white'
                  : 'bg-slate-800 text-slate-400 group-hover:text-slate-300'
              }`}
            >
              {stats.total}
            </span>

            {/* Critical alert dot if any */}
            {stats.critical > 0 && (
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping absolute -top-0.5 -right-0.5" />
            )}
            {stats.critical > 0 && (
              <span className="w-2 h-2 rounded-full bg-red-500 absolute -top-0.5 -right-0.5 shadow-sm shadow-red-500" />
            )}
          </button>
        );
      })}
    </div>
  );
};
