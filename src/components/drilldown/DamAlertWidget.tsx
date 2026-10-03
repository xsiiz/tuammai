import React, { useState, useEffect, useMemo } from 'react';
import { AlertTriangle, Bell, ChevronRight, Droplets } from 'lucide-react';
import { DamTelemetry } from '../../types/dam';

interface DamAlertWidgetProps {
  dams: DamTelemetry[];
  onSelectDam: (dam: DamTelemetry) => void;
  lang: 'th' | 'en';
}

export const DamAlertWidget: React.FC<DamAlertWidgetProps> = ({ dams, onSelectDam, lang }) => {
  // Wiggle / animation runs for 10 seconds after mounting, then stops
  const [isWiggling, setIsWiggling] = useState<boolean>(true);
  const [isOpen, setIsOpen] = useState<boolean>(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsWiggling(false);
    }, 10000); // 10 seconds

    return () => clearTimeout(timer);
  }, []);

  // Filter dams with alert status (critical or warning)
  const alertDams = useMemo(() => {
    return dams.filter((d) => d.status === 'critical' || d.status === 'warning')
      .sort((a, b) => {
        // Critical first, then warning
        if (a.status === 'critical' && b.status !== 'critical') return -1;
        if (b.status === 'critical' && a.status !== 'critical') return 1;
        return b.storage_percent - a.storage_percent;
      });
  }, [dams]);

  const criticalCount = useMemo(() => alertDams.filter((d) => d.status === 'critical').length, [alertDams]);
  const warningCount = useMemo(() => alertDams.filter((d) => d.status === 'warning').length, [alertDams]);

  if (alertDams.length === 0) return null;

  return (
    <div
      className="fixed bottom-5 left-5 z-30 pointer-events-auto"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      {/* Alert Details Popover (when hovered / open) */}
      <div
        className={`absolute bottom-full left-0 mb-3 w-80 sm:w-88 bg-white/95 dark:bg-[#0F172A]/95 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 origin-bottom-left ${
          isOpen
            ? 'opacity-100 scale-100 pointer-events-auto translate-y-0'
            : 'opacity-0 scale-95 pointer-events-none translate-y-2'
        }`}
      >
        {/* Popover Header */}
        <div className="p-3.5 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between bg-slate-50/60 dark:bg-slate-900/60">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              {lang === 'th' ? 'รายการแจ้งเตือนระดับน้ำ' : 'Water Level Alerts'}
            </h3>
          </div>
          <div className="flex items-center gap-1.5 text-[11px]">
            {criticalCount > 0 && (
              <span className="px-2 py-0.5 rounded-full font-semibold bg-red-100 text-red-700 dark:bg-red-950/80 dark:text-red-300 border border-red-200 dark:border-red-800">
                🔴 {criticalCount} {lang === 'th' ? 'วิกฤต' : 'Critical'}
              </span>
            )}
            {warningCount > 0 && (
              <span className="px-2 py-0.5 rounded-full font-semibold bg-amber-100 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                🟡 {warningCount} {lang === 'th' ? 'เฝ้าระวัง' : 'Warning'}
              </span>
            )}
          </div>
        </div>

        {/* Scrollable Alert List */}
        <div className="max-h-60 sm:max-h-72 overflow-y-auto custom-scrollbar p-2 space-y-1.5 divide-y divide-slate-100 dark:divide-slate-800/50">
          {alertDams.map((dam) => {
            const isCrit = dam.status === 'critical';
            return (
              <button
                key={dam.id}
                onClick={() => {
                  onSelectDam(dam);
                  setIsOpen(false);
                }}
                className="w-full text-left p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/70 transition-colors flex items-center justify-between group pt-2 first:pt-2"
              >
                <div className="min-w-0 pr-2">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: dam.status_color }}
                    />
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate group-hover:text-sky-600 dark:group-hover:text-cyan-400">
                      {lang === 'th' ? dam.name_th : dam.name_en}
                    </span>
                    <span className="text-[10px] text-slate-400 uppercase">
                      {dam.region}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      <Droplets className="w-3 h-3 text-sky-500" />
                      {dam.storage_mcm.toLocaleString()} MCM
                    </span>
                    <span>•</span>
                    <span className={isCrit ? 'text-red-600 dark:text-red-400 font-medium' : 'text-amber-600 dark:text-amber-400 font-medium'}>
                      {isCrit
                        ? (dam.storage_percent > 100 ? (lang === 'th' ? 'น้ำล้นเกินจุ' : 'Overflow') : (lang === 'th' ? 'วิกฤตแล้ง' : 'Drought'))
                        : (dam.storage_percent >= 80 ? (lang === 'th' ? 'น้ำมาก' : 'High') : (lang === 'th' ? 'น้ำน้อย' : 'Low'))}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span
                    className="text-xs font-bold px-2 py-0.5 rounded-lg border font-mono"
                    style={{
                      color: dam.status_color,
                      backgroundColor: `${dam.status_color}15`,
                      borderColor: `${dam.status_color}40`
                    }}
                  >
                    {dam.storage_percent.toFixed(1)}%
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" />
                </div>
              </button>
            );
          })}
        </div>

        {/* Popover Footer Hint */}
        <div className="p-2 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 text-center">
          {lang === 'th' ? 'คลิกที่เขื่อนเพื่อดูข้อมูลแบบเจาะลึกทางขวา' : 'Click dam to slide open telemetry drawer'}
        </div>
      </div>

      {/* Main Alert Trigger Button (Bottom-Left Pill) */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className={`group flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl bg-white/90 dark:bg-[#0F172A]/90 backdrop-blur-xl border border-red-300 dark:border-red-900/60 shadow-lg shadow-red-500/10 hover:shadow-red-500/20 text-slate-900 dark:text-white transition-all duration-300 select-none ${
          isWiggling ? 'animate-alert-wiggle' : ''
        }`}
        aria-label="Water alert notifications"
      >
        <div className="relative">
          <div className="w-7 h-7 rounded-xl bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center border border-red-200 dark:border-red-800">
            {criticalCount > 0 ? (
              <AlertTriangle className="w-4 h-4 animate-pulse" />
            ) : (
              <Bell className="w-4 h-4" />
            )}
          </div>
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 absolute -top-1 -right-1 border-2 border-white dark:border-[#0F172A] shadow-sm animate-ping" />
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 absolute -top-1 -right-1 border-2 border-white dark:border-[#0F172A]" />
        </div>

        <div className="text-left">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-slate-800 dark:text-white">
              {lang === 'th' ? 'เฝ้าระวัง' : 'Alert'}
            </span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-red-500 text-white leading-tight">
              {alertDams.length}
            </span>
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400">
            {lang === 'th' ? 'ชี้เพื่อดูรายละเอียด' : 'Hover for details'}
          </p>
        </div>
      </button>
    </div>
  );
};
