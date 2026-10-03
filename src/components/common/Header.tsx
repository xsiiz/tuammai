import React from 'react';
import { Waves, Sparkles, Layers, Sun, Moon } from 'lucide-react';

interface HeaderProps {
  lang: 'th' | 'en';
  onToggleLang: () => void;
  viewMode: '3d' | '2d';
  onToggleViewMode: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  lastUpdated: string;
  damCount: number;
  criticalCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  lang,
  onToggleLang,
  viewMode,
  onToggleViewMode,
  theme,
  onToggleTheme,
  lastUpdated,
  damCount,
  criticalCount
}) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-white/85 dark:bg-[#0B1120]/85 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 px-4 py-3 transition-colors duration-300">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        
        {/* Brand & Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-sky-500/20 text-white">
            <Waves className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                ท่วมมั้ย <span className="text-cyan-700 bg-cyan-100/70 border border-cyan-200 dark:text-cyan-400 font-semibold text-sm px-2 py-0.5 rounded-full dark:bg-cyan-950/70 dark:border-cyan-800/50">Tuammai</span>
              </h1>
              {criticalCount > 0 && (
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 border border-red-300 text-red-700 dark:bg-red-950/80 dark:border-red-700/60 dark:text-red-300 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                  {lang === 'th' ? `วิกฤต ${criticalCount} เขื่อน` : `${criticalCount} Critical`}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
              {lang === 'th' 
                ? 'ระบบตรวจสอบระดับน้ำในเขื่อนและริมตลิ่งแม่น้ำ พร้อมวิเคราะห์พื้นที่ที่อาจจะได้รับผลกระทบด้วย AI'
                : 'Dam & Riverbank Water Level Monitoring with AI Flood Impact Analysis'}
            </p>
          </div>
        </div>

        {/* Status Legend */}
        <div className="hidden lg:flex items-center gap-3 text-xs bg-slate-100/90 dark:bg-slate-900/90 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-inner">
          <span className="text-slate-500 dark:text-slate-400 font-medium">{lang === 'th' ? 'เกณฑ์เฝ้าระวัง:' : 'Status:'}</span>
          <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-sm shadow-red-500/50"></span>
            {lang === 'th' ? 'วิกฤต (>95%)' : 'Critical (>95%)'}
          </span>
          <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-sm shadow-amber-500/50"></span>
            {lang === 'th' ? 'เฝ้าระวัง (>80%)' : 'Warning (>80%)'}
          </span>
          <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50"></span>
            {lang === 'th' ? 'ปกติ (<80%)' : 'Normal (<80%)'}
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Theme Toggle (Light / Dark) */}
          <button
            onClick={onToggleTheme}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-white/90 hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-sm dark:bg-slate-800/90 dark:hover:bg-slate-700 dark:text-slate-200 dark:border-slate-700/60 transition-all"
            title={theme === 'dark' ? 'เปลี่ยนเป็นโหมดสว่าง' : 'เปลี่ยนเป็นโหมดกลางคืน'}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-4 h-4 text-amber-400" />
                <span className="hidden sm:inline">{lang === 'th' ? 'โหมดสว่าง' : 'Light'}</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-sky-600" />
                <span className="hidden sm:inline">{lang === 'th' ? 'โหมดกลางคืน' : 'Dark'}</span>
              </>
            )}
          </button>

          {/* 3D / 2D Switcher */}
          <button
            onClick={onToggleViewMode}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/90 hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-sm dark:bg-slate-800/90 dark:hover:bg-slate-700 dark:text-slate-200 dark:border-slate-700/60 transition-all"
            title="สลับมุมมอง 3D นูนต่ำ / แผนที่ 2D"
          >
            {viewMode === '3d' ? (
              <>
                <Sparkles className="w-3.5 h-3.5 text-sky-600 dark:text-cyan-400" />
                <span>3D Low-Relief</span>
              </>
            ) : (
              <>
                <Layers className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                <span>2D Map</span>
              </>
            )}
          </button>

          {/* Language Toggle */}
          <button
            onClick={onToggleLang}
            className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-white/90 hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-sm dark:bg-slate-800/90 dark:hover:bg-slate-700 dark:text-slate-300 dark:border-slate-700/60 transition-all"
          >
            {lang === 'th' ? '🇬🇧 EN' : '🇹🇭 TH'}
          </button>
        </div>

      </div>
    </header>
  );
};
