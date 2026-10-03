import React from 'react';
import { RegionId, DamTelemetry } from '../../types/dam';
import { REGIONS } from '../../data/regions';
import { REGION_COLORS } from '../../utils/geoUtils';
import { Waves, AlertCircle, CheckCircle, ChevronRight, Gauge } from 'lucide-react';

interface RegionalSummaryCardProps {
  lang: 'th' | 'en';
  selectedRegion: RegionId;
  dams: DamTelemetry[];
  onSelectDam: (dam: DamTelemetry) => void;
}

export const RegionalSummaryCard: React.FC<RegionalSummaryCardProps> = ({
  lang,
  selectedRegion,
  dams,
  onSelectDam
}) => {
  const regionInfo = REGIONS[selectedRegion] || REGIONS.all;

  // Filter dams
  const regionalDams = selectedRegion === 'all'
    ? dams
    : dams.filter((d) => d.region === selectedRegion);

  // Calculate statistics
  const totalDams = regionalDams.length;
  const criticalDams = regionalDams.filter((d) => d.status === 'critical');
  const warningDams = regionalDams.filter((d) => d.status === 'warning');
  const normalDams = regionalDams.filter((d) => d.status === 'normal');

  const totalStorage = regionalDams.reduce((sum, d) => sum + d.storage_mcm, 0);
  const avgPercent = totalDams > 0
    ? regionalDams.reduce((sum, d) => sum + d.storage_percent, 0) / totalDams
    : 0;

  return (
    <div className="bg-white/95 dark:bg-slate-900/85 backdrop-blur-md border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col max-h-[calc(100vh-140px)] transition-colors duration-300">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-sky-600 dark:text-cyan-400 uppercase tracking-wider">
            {lang === 'th' ? 'ข้อมูลสรุปพื้นที่' : 'Regional Summary'}
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
            {totalDams} {lang === 'th' ? 'เขื่อน' : 'Dams'}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          {selectedRegion !== 'all' && (
            <span
              className="w-3 h-3 rounded-full shrink-0 shadow-sm"
              style={{ backgroundColor: REGION_COLORS[selectedRegion]?.base }}
            />
          )}
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            {lang === 'th' ? regionInfo.name_th : regionInfo.name_en}
          </h3>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">
          {lang === 'th' ? regionInfo.description_th : regionInfo.description_en}
        </p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 gap-2 my-3">
        <div className="p-2.5 rounded-xl bg-white dark:bg-slate-950/60 border border-slate-200/90 dark:border-slate-800/80 shadow-sm">
          <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
            <Gauge className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
            <span>{lang === 'th' ? 'กักเก็บเฉลี่ย' : 'Avg Capacity'}</span>
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">
            {avgPercent.toFixed(1)}%
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-white dark:bg-slate-950/60 border border-slate-200/90 dark:border-slate-800/80 shadow-sm">
          <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
            <Waves className="w-3.5 h-3.5 text-sky-600 dark:text-cyan-400" />
            <span>{lang === 'th' ? 'ปริมาตรรวม' : 'Total Storage'}</span>
          </div>
          <div className="text-base font-bold text-sky-700 dark:text-cyan-300 mt-1 truncate">
            {Math.round(totalStorage).toLocaleString()} <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">MCM</span>
          </div>
        </div>
      </div>

      {/* Status Breakdown Bar */}
      <div className="flex items-center gap-1.5 text-[11px] mb-3 px-1">
        <span className="flex items-center gap-1 text-red-600 dark:text-red-400 font-medium">
          <span className="w-2 h-2 rounded-full bg-red-500"></span>
          {criticalDams.length} {lang === 'th' ? 'วิกฤต' : 'Crit'}
        </span>
        <span className="text-slate-300 dark:text-slate-600">•</span>
        <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
          <span className="w-2 h-2 rounded-full bg-amber-500"></span>
          {warningDams.length} {lang === 'th' ? 'เฝ้าระวัง' : 'Warn'}
        </span>
        <span className="text-slate-300 dark:text-slate-600">•</span>
        <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          {normalDams.length} {lang === 'th' ? 'ปกติ' : 'Norm'}
        </span>
      </div>

      {/* Dam List with Scrollbar */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-1.5 custom-scrollbar">
        <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider sticky top-0 bg-white/95 dark:bg-slate-900/90 py-1 backdrop-blur-sm">
          {lang === 'th' ? 'รายชื่อเขื่อนในพื้นที่' : 'Reservoirs List'}
        </div>
        {regionalDams.map((dam) => (
          <button
            key={dam.id}
            onClick={() => onSelectDam(dam)}
            className="w-full text-left p-2.5 rounded-xl bg-white hover:bg-sky-50/70 border border-slate-200/90 hover:border-sky-300 dark:bg-slate-950/40 dark:hover:bg-slate-800/80 dark:border-slate-800/60 dark:hover:border-slate-700 transition-all flex items-center justify-between group shadow-xs"
          >
            <div className="min-w-0 pr-2">
              <div className="flex items-center gap-1.5">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: dam.status_color }}
                />
                <span className="text-xs font-semibold text-slate-800 group-hover:text-sky-600 dark:text-slate-200 dark:group-hover:text-cyan-300 truncate">
                  {lang === 'th' ? dam.name_th : dam.name_en}
                </span>
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 ml-3.5">
                {dam.storage_mcm.toLocaleString()} MCM
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span
                className="text-xs font-bold font-mono px-2 py-0.5 rounded-md"
                style={{
                  backgroundColor: `${dam.status_color}18`,
                  color: dam.status_color
                }}
              >
                {dam.storage_percent.toFixed(1)}%
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700 dark:text-slate-600 dark:group-hover:text-slate-300 transition-colors" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
