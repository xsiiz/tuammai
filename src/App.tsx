import React, { useState, useMemo, useEffect } from 'react';
import { RegionId, DamTelemetry } from './types/dam';
import { ContactCategory } from './types/contact';
import { DAMS_DATA } from './data/dams';
import { PROVINCES_DATA, PROVINCES_BY_CODE } from './data/provinces';
import { Header } from './components/common/Header';
import { BreadcrumbNav } from './components/drilldown/BreadcrumbNav';
import { DamDetailDrawer } from './components/drilldown/DamDetailDrawer';
import { DamAlertWidget } from './components/drilldown/DamAlertWidget';
import { EmergencyContactModal } from './components/common/EmergencyContactModal';
import { EmergencyHotlineWidget } from './components/common/EmergencyHotlineWidget';
import { Thailand3DMap } from './components/map/Thailand3DMap';
import { Thailand2DFallback } from './components/map/Thailand2DFallback';

export function App() {
  const [lang, setLang] = useState<'th' | 'en'>('th');
  const [viewMode, setViewMode] = useState<'3d' | '2d'>('3d');
  const [selectedRegion, setSelectedRegion] = useState<RegionId>('all');
  const [selectedProvince, setSelectedProvince] = useState<string | null>(null);
  const [selectedDam, setSelectedDam] = useState<DamTelemetry | null>(null);
  const [isContactModalOpen, setIsContactModalOpen] = useState<boolean>(false);
  const [contactCategory, setContactCategory] = useState<ContactCategory>('all');

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
    setSelectedProvince(null);
    // If selecting region, clear dam selection to show regional overview
    if (selectedDam && selectedDam.region !== region) {
      setSelectedDam(null);
    }
  };

  const handleSelectProvince = (provinceCode: string | null) => {
    setSelectedProvince(provinceCode);
    if (provinceCode) {
      const prov = PROVINCES_BY_CODE[provinceCode];
      if (prov && prov.region !== selectedRegion) {
        setSelectedRegion(prov.region);
      }
      if (selectedDam && selectedDam.province && prov) {
        if (!selectedDam.province.includes(prov.name_th) && !prov.name_th.includes(selectedDam.province)) {
          setSelectedDam(null);
        }
      }
    }
  };

  const handleSelectDam = (dam: DamTelemetry) => {
    setSelectedDam(dam);
    if (dam.region !== selectedRegion) {
      setSelectedRegion(dam.region);
    }
    if (dam.province) {
      const provMatch = PROVINCES_DATA.find(
        (p) => dam.province === p.name_th || dam.province?.includes(p.name_th)
      );
      if (provMatch) {
        setSelectedProvince(provMatch.code);
      }
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
        lastUpdated={dams[0]?.date || '2026-10-05'}
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
              selectedProvince={selectedProvince}
              selectedDam={selectedDam}
              dams={dams}
              onSelectRegion={handleSelectRegion}
              onSelectProvince={handleSelectProvince}
              onSelectDam={handleSelectDam}
              theme={theme}
            />
          ) : (
            <Thailand2DFallback
              lang={lang}
              selectedRegion={selectedRegion}
              selectedProvince={selectedProvince}
              selectedDam={selectedDam}
              dams={dams}
              onSelectRegion={handleSelectRegion}
              onSelectProvince={handleSelectProvince}
              onSelectDam={handleSelectDam}
              theme={theme}
            />
          )}
        </div>

        {/* Top Floating Breadcrumb Drill-Down */}
        <div className="absolute top-20 left-4 z-20 pointer-events-auto">
          <BreadcrumbNav
            lang={lang}
            selectedRegion={selectedRegion}
            selectedProvince={selectedProvince}
            selectedDam={selectedDam}
            onSelectRegion={handleSelectRegion}
            onClearProvince={() => setSelectedProvince(null)}
            onClearDam={() => setSelectedDam(null)}
          />
        </div>

        {/* Bottom-Left Alert Widget (10s animation, hover to view scrollable alert list) */}
        <DamAlertWidget
          dams={dams}
          onSelectDam={handleSelectDam}
          lang={lang}
        />

        {/* Slide-over Right Dam Detail Drawer */}
        <DamDetailDrawer
          dam={selectedDam}
          onClose={() => setSelectedDam(null)}
          lang={lang}
        />

        {/* Bottom-Right Emergency Hotline Quick Widget */}
        <EmergencyHotlineWidget
          lang={lang}
          onOpenAll={() => {
            setContactCategory('all');
            setIsContactModalOpen(true);
          }}
        />

        {/* Emergency & Relevant Agency Contacts Modal */}
        <EmergencyContactModal
          isOpen={isContactModalOpen}
          onClose={() => setIsContactModalOpen(false)}
          lang={lang}
          defaultCategory={contactCategory}
        />
      </main>
    </div>
  );
}

export default App;
