import React, { useState, useMemo, useEffect } from 'react';
import { RegionId, DamTelemetry } from './types/dam';
import { DAMS_DATA } from './data/dams';
import { Header } from './components/common/Header';
import { BreadcrumbNav } from './components/drilldown/BreadcrumbNav';
import { RegionFilterBar } from './components/drilldown/RegionFilterBar';
import { RegionalSummaryCard } from './components/drilldown/RegionalSummaryCard';
import { DamDetailModal } from './components/drilldown/DamDetailModal';
import { Thailand3DMap } from './components/map/Thailand3DMap';
import { Thailand2DFallback } from './components/map/Thailand2DFallback';
import { BarChart3, ChevronUp, ChevronDown } from 'lucide-react';

export function App() {
  const [lang, setLang] = useState<'th' | 'en'>('th');
  const [viewMode, setViewMode] = useState<'3d' | '2d'>('3d');
  const [selectedRegion, setSelectedRegion] = useState<RegionId>('all');
  const [selectedDam, setSelectedDam] = useState<DamTelemetry | null>(null);
  const [showMobilePanel, setShowMobilePanel] = useState<boolean>(false);

  // Theme state: defaults to 'light', persisted in localStorage
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('tuammai_theme');
    return (saved === 'dark' || saved === 'light') ? saved : 'light';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('tuammai_theme', theme);
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  // Dam dataset
  const dams = DAMS_DATA;

  // Stats calculation
  const criticalCount = useMemo(() => {
    return dams.filter((d) => d.status === 'critical').length;
  }, [dams]);

  const handleSelectRegion = (region: RegionId) => {
    setSelectedRegion(region);
    // If selecting region, clear dam selection to show regional overview
    if (selectedDam && selectedDam.region !== region) {
      setSelectedDam(null);
    }
  };

  const handleSelectDam = (dam: DamTelemetry) => {
    setSelectedDam(dam);
    if (dam.region !== selectedRegion) {
      setSelectedRegion(dam.region);
    }
  };

  return (
    <div className={`relative w-screen h-screen overflow-hidden flex flex-col font-sans transition-colors duration-300 ${theme === 'dark' ? 'bg-[#0B1120] text-slate-100' : 'bg-white text-slate-900'}`}>
      {/* Top Header */}
      <Header
        lang={lang}
        onToggleLang={() => setLang((prev) => (prev === 'th' ? 'en' : 'th'))}
        viewMode={viewMode}
        onToggleViewMode={() => setViewMode((prev) => (prev === '3d' ? '2d' : '3d'))}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        lastUpdated="2026-10-03"
        damCount={dams.length}
        criticalCount={criticalCount}
      />

      {/* Main Interactive Stage */}
      <main className="relative flex-1 w-full h-full pt-16 overflow-hidden">
        {/* Map Viewport (3D or 2D) */}
        <div className="absolute inset-0 z-0">
          {viewMode === '3d' ? (
            <Thailand3DMap
              lang={lang}
              selectedRegion={selectedRegion}
              selectedDam={selectedDam}
              dams={dams}
              onSelectRegion={handleSelectRegion}
              onSelectDam={handleSelectDam}
              theme={theme}
            />
          ) : (
            <Thailand2DFallback
              lang={lang}
              selectedRegion={selectedRegion}
              selectedDam={selectedDam}
              dams={dams}
              onSelectRegion={handleSelectRegion}
              onSelectDam={handleSelectDam}
              theme={theme}
            />
          )}
        </div>

        {/* Top Floating Drill-Down Navigation & Region Filters */}
        <div className="absolute top-20 left-4 right-4 z-20 pointer-events-none">
          <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-start lg:items-center justify-between gap-2.5">
            {/* Breadcrumb Nav */}
            <div className="pointer-events-auto shrink-0">
              <BreadcrumbNav
                lang={lang}
                selectedRegion={selectedRegion}
                selectedDam={selectedDam}
                onSelectRegion={handleSelectRegion}
                onClearDam={() => setSelectedDam(null)}
              />
            </div>

            {/* Quick 6 Regions Filter Pills */}
            <div className="pointer-events-auto w-full lg:w-auto min-w-0 max-w-full overflow-hidden">
              <RegionFilterBar
                lang={lang}
                selectedRegion={selectedRegion}
                onSelectRegion={handleSelectRegion}
                dams={dams}
              />
            </div>
          </div>
        </div>

        {/* Desktop Side Summary Panel */}
        <div className="absolute right-4 top-36 z-20 hidden md:block w-80 lg:w-88 pointer-events-auto">
          <RegionalSummaryCard
            lang={lang}
            selectedRegion={selectedRegion}
            dams={dams}
            onSelectDam={handleSelectDam}
          />
        </div>

        {/* Mobile Bottom Collapsible Summary Sheet */}
        <div className="md:hidden absolute bottom-0 left-0 right-0 z-30 pointer-events-auto">
          <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 rounded-t-2xl shadow-2xl p-3">
            <button
              onClick={() => setShowMobilePanel(!showMobilePanel)}
              className="w-full flex items-center justify-between py-1 text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              <span className="flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4 text-sky-600 dark:text-cyan-400" />
                <span>
                  {lang === 'th' ? 'สรุปข้อมูลเขื่อนในพื้นที่' : 'Regional Hydrology Summary'}
                </span>
              </span>
              {showMobilePanel ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>

            {showMobilePanel && (
              <div className="mt-2 max-h-72 overflow-y-auto">
                <RegionalSummaryCard
                  lang={lang}
                  selectedRegion={selectedRegion}
                  dams={dams}
                  onSelectDam={(d) => {
                    handleSelectDam(d);
                    setShowMobilePanel(false);
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Dam Detail Modal */}
        <DamDetailModal
          dam={selectedDam}
          onClose={() => setSelectedDam(null)}
          lang={lang}
        />
      </main>
    </div>
  );
}

export default App;
