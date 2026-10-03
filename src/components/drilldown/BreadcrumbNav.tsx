import React from 'react';
import { ChevronRight, Home, MapPin } from 'lucide-react';
import { RegionId, DamTelemetry } from '../../types/dam';
import { REGIONS } from '../../data/regions';

interface BreadcrumbNavProps {
  lang: 'th' | 'en';
  selectedRegion: RegionId;
  selectedDam: DamTelemetry | null;
  onSelectRegion: (region: RegionId) => void;
  onClearDam: () => void;
}

export const BreadcrumbNav: React.FC<BreadcrumbNavProps> = ({
  lang,
  selectedRegion,
  selectedDam,
  onSelectRegion,
  onClearDam
}) => {
  const regionInfo = REGIONS[selectedRegion] || REGIONS.all;

  return (
    <nav className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400 bg-white/85 dark:bg-slate-900/80 backdrop-blur-md px-3 sm:px-4 py-2 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-md">
      {/* Root: Thailand Overview */}
      <button
        onClick={() => {
          onSelectRegion('all');
          onClearDam();
        }}
        className={`flex items-center gap-1.5 px-2 py-1 rounded-lg transition-colors ${
          selectedRegion === 'all' && !selectedDam
            ? 'text-sky-700 bg-sky-100/70 dark:text-cyan-400 font-semibold dark:bg-cyan-950/50'
            : 'hover:text-slate-900 hover:bg-slate-100 dark:hover:text-slate-200 dark:hover:bg-slate-800/60'
        }`}
      >
        <Home className="w-3.5 h-3.5" />
        <span>{lang === 'th' ? 'ประเทศไทย' : 'Thailand'}</span>
      </button>

      {/* Region Segment */}
      {selectedRegion !== 'all' && (
        <>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-600 shrink-0" />
          <button
            onClick={onClearDam}
            title={lang === 'th' ? regionInfo.name_th : regionInfo.name_en}
            className={`px-2 py-1 rounded-lg transition-colors whitespace-nowrap ${
              !selectedDam
                ? 'text-sky-700 bg-sky-100/70 dark:text-cyan-400 font-semibold dark:bg-cyan-950/50'
                : 'hover:text-slate-900 hover:bg-slate-100 dark:hover:text-slate-200 dark:hover:bg-slate-800/60'
            }`}
          >
            {lang === 'th'
              ? (regionInfo.short_name_th || regionInfo.name_th)
              : (regionInfo.short_name_en || regionInfo.name_en)}
          </button>
        </>
      )}

      {/* Dam Segment */}
      {selectedDam && (
        <>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-600 shrink-0" />
          <span className="flex items-center gap-1 text-slate-800 dark:text-slate-200 font-semibold px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/80">
            <MapPin className="w-3.5 h-3.5" style={{ color: selectedDam.status_color }} />
            <span>{lang === 'th' ? selectedDam.name_th : selectedDam.name_en}</span>
          </span>
        </>
      )}
    </nav>
  );
};
