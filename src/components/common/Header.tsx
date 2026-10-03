import React from 'react';
import { Waves, Sparkles, Layers, RefreshCw } from 'lucide-react';

interface HeaderProps {
  lang: 'th' | 'en';
  onToggleLang: () => void;
  viewMode: '3d' | '2d';
  onToggleViewMode: () => void;
  lastUpdated: string;
  damCount: number;
  criticalCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  lang,
  onToggleLang,
  viewMode,
  onToggleViewMode,
  lastUpdated,
  damCount,
  criticalCount
}) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-[#0B1120]/80 backdrop-blur-md border-b border-slate-800/80 px-4 py-3 transition-all duration-300">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        
        {/* Brand & Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-sky-500/20 text-white">
            <Waves className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
                ท่วมมั้ย <span className="text-cyan-400 font-semibold text-sm px-2 py-0.5 rounded-full bg-cyan-950/70 border border-cyan-800/50">Tuammai</span>
              </h1>
              {criticalCount > 0 && (
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-950/80 border border-red-700/60 text-red-300 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                  {lang === 'th' ? `วิกฤต ${criticalCount} เขื่อน` : `${criticalCount} Critical`}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              {lang === 'th' 
                ? 'ระบบติดตามระดับน้ำในเขื่อนและอ่างเก็บน้ำ 3D แบบ Drill-Down'
                : 'Interactive 3D Low-Relief Dam & Hydrology Telemetry'}
            </p>
          </div>
        </div>

        {/* Status Legend */}
        <div className="hidden lg:flex items-center gap-3 text-xs bg-slate-900/90 px-3 py-1.5 rounded-xl border border-slate-800 shadow-inner">
          <span className="text-slate-400 font-medium">{lang === 'th' ? 'เกณฑ์เฝ้าระวัง:' : 'Status:'}</span>
          <span className="inline-flex items-center gap-1 text-red-400">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-sm shadow-red-500/50"></span>
            {lang === 'th' ? 'วิกฤต (>100% / <30%)' : 'Critical (>100% / <30%)'}
          </span>
          <span className="inline-flex items-center gap-1 text-amber-400">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-sm shadow-amber-500/50"></span>
            {lang === 'th' ? 'เฝ้าระวัง (80-100% / 30-50%)' : 'Warning'}
          </span>
          <span className="inline-flex items-center gap-1 text-emerald-400">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50"></span>
            {lang === 'th' ? 'ปกติ (50-80%)' : 'Normal (50-80%)'}
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 ml-auto">
          {/* 3D / 2D Switcher */}
          <button
            onClick={onToggleViewMode}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700/60 shadow-sm transition-all"
            title="สลับมุมมอง 3D นูนต่ำ / แผนที่ 2D"
          >
            {viewMode === '3d' ? (
              <>
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>3D Low-Relief</span>
              </>
            ) : (
              <>
                <Layers className="w-3.5 h-3.5 text-sky-400" />
                <span>2D Map</span>
              </>
            )}
          </button>

          {/* Language Toggle */}
          <button
            onClick={onToggleLang}
            className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-800/90 hover:bg-slate-700 text-slate-300 border border-slate-700/60 transition-all"
          >
            {lang === 'th' ? '🇬🇧 EN' : '🇹🇭 TH'}
          </button>
        </div>

      </div>
    </header>
  );
};
