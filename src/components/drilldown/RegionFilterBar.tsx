import React from 'react';
import { RegionId, DamTelemetry } from '../../types/dam';
import { REGIONS } from '../../data/regions';
import { REGION_COLORS } from '../../utils/geoUtils';

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
  const containerRef = React.useRef<HTMLDivElement>(null);
  const pillRefs = React.useRef<Record<string, HTMLButtonElement | null>>({});

  // Count dams and critical dams per region
  const getStats = (regionId: RegionId) => {
    if (regionId === 'all') {
      const top10 = dams.filter((d) => d.national_rank && d.national_rank <= 10);
      const critical = top10.filter((d) => d.status === 'critical').length;
      return { total: top10.length, critical };
    }
    const list = dams.filter((d) => d.region === regionId);
    const critical = list.filter((d) => d.status === 'critical').length;
    return { total: list.length, critical };
  };

  // Enable mouse wheel horizontal scrolling on desktop
  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        e.preventDefault();
        container.scrollLeft += e.deltaY;
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, []);

  // Scroll active button into view smoothly when changed
  React.useEffect(() => {
    const activePill = pillRefs.current[selectedRegion];
    if (activePill && containerRef.current) {
      activePill.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'nearest'
      });
    }
  }, [selectedRegion]);

  return (
    <div
      ref={containerRef}
      className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 touch-pan-x"
    >
      {REGION_ORDER.map((regId) => {
        const info = REGIONS[regId];
        const isSelected = selectedRegion === regId;
        const stats = getStats(regId);
        const regColor = REGION_COLORS[regId];
        const label = lang === 'th'
          ? (info.short_name_th || info.name_th)
          : (info.short_name_en || info.name_en);
        const fullName = lang === 'th' ? info.name_th : info.name_en;
        const tooltip = regId === 'all'
          ? (lang === 'th' ? 'ภาพรวมทั้งประเทศ (10 เขื่อนใหญ่)' : 'National Overview (Top 10 Dams)')
          : fullName;

        return (
          <button
            key={regId}
            ref={(el) => { pillRefs.current[regId] = el; }}
            onClick={() => onSelectRegion(regId)}
            title={tooltip}
            className={`group shrink-0 relative flex items-center gap-1.5 sm:gap-2 px-2.5 py-1.5 sm:px-3 rounded-xl text-xs font-medium transition-all duration-200 border select-none ${
              isSelected
                ? 'bg-white text-slate-900 shadow-md font-semibold dark:bg-slate-800/95 dark:text-white'
                : 'bg-white/85 text-slate-700 hover:text-slate-900 hover:bg-white border-slate-200/90 shadow-sm dark:bg-slate-900/80 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800/90 dark:border-slate-800'
            }`}
            style={
              isSelected
                ? {
                    borderColor: regColor?.highlight || '#0284C7',
                    boxShadow: `0 4px 14px -2px ${(regColor?.highlight || '#0284C7')}50`
                  }
                : undefined
            }
          >
            {/* Region pastel dot indicator */}
            {regId !== 'all' ? (
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm transition-transform duration-200 group-hover:scale-125"
                style={{ backgroundColor: regColor?.base }}
              />
            ) : (
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0 bg-gradient-to-tr from-sky-400 via-emerald-300 to-rose-400 shadow-sm"
              />
            )}

            <span className="whitespace-nowrap">{label}</span>

            {/* Total Dam Count Badge */}
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                isSelected
                  ? 'bg-slate-100 text-slate-800 dark:bg-white/20 dark:text-white font-semibold'
                  : 'bg-slate-100 text-slate-500 group-hover:text-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:group-hover:text-slate-300'
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
