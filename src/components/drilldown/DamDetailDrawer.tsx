import React, { useMemo } from 'react';
import { X, ArrowDownRight, ArrowUpRight, Droplets, AlertTriangle, ShieldCheck, Waves, Calendar, ChevronRight } from 'lucide-react';
import { DamTelemetry } from '../../types/dam';
import riversGeoData from '../../data/thailand-rivers.json';

interface DamDetailDrawerProps {
  dam: DamTelemetry | null;
  onClose: () => void;
  lang: 'th' | 'en';
}

export const DamDetailDrawer: React.FC<DamDetailDrawerProps> = ({ dam, onClose, lang }) => {
  // Advisory note based on storage percentage
  const advisory = useMemo(() => {
    if (!dam) return null;
    if (dam.storage_percent > 100) {
      return {
        level: 'critical',
        text_th: 'ปริมาตรน้ำเกินความจุอ่างเก็บน้ำ (>100%) เฝ้าระวังการระบายน้ำฉุกเฉิน พื้นที่ท้ายน้ำอาจได้รับผลกระทบน้ำท่วม',
        text_en: 'Reservoir exceeds 100% capacity! Spillway overflow risk, downstream areas may face flood advisory.'
      };
    }
    if (dam.storage_percent < 30) {
      return {
        level: 'critical',
        text_th: 'ปริมาตรน้ำต่ำกว่า 30% เข้าสู่ภาวะเสี่ยงภัยแล้งรุนแรง ควรวางแผนบริหารจัดการน้ำอุปโภคบริโภคอย่างเข้มงวด',
        text_en: 'Water level critically low (<30%). Severe drought risk. Prioritize municipal water conservation.'
      };
    }
    if (dam.storage_percent >= 80) {
      return {
        level: 'warning',
        text_th: 'ปริมาตรน้ำ 80% - 100% อยู่ในเกณฑ์เฝ้าระวังน้ำหลาก ควรติดตามการปรับเพิ่มการระบายน้ำอย่างใกล้ชิด',
        text_en: 'Storage between 80% - 100% (High retention). Monitor discharge rates for monsoon inflow.'
      };
    }
    if (dam.storage_percent < 50) {
      return {
        level: 'warning',
        text_th: 'ปริมาตรน้ำ 30% - 50% อยู่ในเกณฑ์น้ำน้อย ควรใช้น้ำอย่างประหยัดเพื่อสำรองช่วงฤดูแล้ง',
        text_en: 'Storage between 30% - 50% (Low retention). Conserve water for dry season reserves.'
      };
    }
    return {
      level: 'normal',
      text_th: 'ปริมาตรน้ำอยู่ในเกณฑ์ปกติ (50% - 80%) เหมาะสมต่อการบริหารจัดการน้ำเพื่อการเกษตรและอุปโภค',
      text_en: 'Optimal storage range (50% - 80%). Balanced inflow and operational discharge.'
    };
  }, [dam]);

  // Find rivers connected to this dam
  const connectedRivers = useMemo(() => {
    if (!dam) return [];
    return (riversGeoData.features as any[]).filter((r) =>
      r.properties.connected_dams.includes(dam.id)
    );
  }, [dam?.id]);

  const isOpen = Boolean(dam);

  return (
    <>
      {/* Backdrop overlay */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-over Drawer Panel */}
      <aside
        className={`fixed top-0 right-0 bottom-0 z-50 w-full sm:w-[460px] md:w-[500px] bg-white/95 dark:bg-[#0F172A]/95 backdrop-blur-xl border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        aria-label="Dam Detail Drawer"
      >
        {dam && (
          <>
            {/* Top Color Accent Bar */}
            <div
              className="h-2 w-full shrink-0 transition-colors duration-300"
              style={{ backgroundColor: dam.status_color }}
            />

            {/* Header */}
            <div className="p-5 border-b border-slate-200/80 dark:border-slate-800/80 flex items-start justify-between gap-3 shrink-0">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span
                    className="px-2.5 py-0.5 rounded-full text-xs font-semibold inline-flex items-center gap-1.5"
                    style={{
                      backgroundColor: `${dam.status_color}20`,
                      color: dam.status_color,
                      border: `1px solid ${dam.status_color}50`
                    }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: dam.status_color }} />
                    {lang === 'th' ? dam.status_label_th : dam.status_label_en}
                  </span>

                  {dam.national_rank && dam.national_rank <= 10 && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:bg-amber-400/20 dark:text-amber-300 border border-amber-300/40">
                      {lang === 'th' ? `#${dam.national_rank} ของประเทศ` : `Top #${dam.national_rank}`}
                    </span>
                  )}

                  <span className="text-xs text-slate-600 dark:text-slate-400 capitalize bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
                    {dam.region}
                  </span>
                </div>

                <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight truncate">
                  {lang === 'th' ? dam.name_th : dam.name_en}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {lang === 'th' ? dam.name_en : dam.name_th}
                </p>
              </div>

              {/* Close Button */}
              <button
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 transition-colors shrink-0"
                aria-label="Close drawer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-4">
              {/* Storage Capacity Gauge */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800">
                <div className="flex items-baseline justify-between mb-2">
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                    {lang === 'th' ? 'ระดับกักเก็บน้ำปัจจุบัน' : 'Current Storage Ratio'}
                  </span>
                  <span
                    className="text-2xl font-bold tracking-tight"
                    style={{ color: dam.status_color }}
                  >
                    {dam.storage_percent.toFixed(1)}%
                  </span>
                </div>

                {/* Meter Bar */}
                <div className="w-full h-3 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden relative">
                  <div
                    className="h-full rounded-full transition-all duration-700 ease-out"
                    style={{
                      width: `${Math.min(dam.storage_percent, 100)}%`,
                      backgroundColor: dam.status_color
                    }}
                  />
                  <div className="absolute top-0 bottom-0 right-0 w-0.5 bg-red-400" title="100% Limit" />
                </div>

                <div className="flex justify-between items-center mt-2 text-[10px] text-slate-500 font-mono">
                  <span>0% (แห้ง)</span>
                  <span>30% (วิกฤต)</span>
                  <span>80% (เฝ้าระวัง)</span>
                  <span>100% (เต็มความจุ)</span>
                </div>
              </div>

              {/* Telemetry Metrics Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-1">
                    <Droplets className="w-3.5 h-3.5 text-sky-600 dark:text-cyan-400" />
                    <span>{lang === 'th' ? 'ปริมาตรน้ำในอ่าง' : 'Water Volume'}</span>
                  </div>
                  <div className="text-lg font-bold text-slate-900 dark:text-white">
                    {dam.storage_mcm.toLocaleString()} <span className="text-xs font-normal text-slate-500">MCM</span>
                  </div>
                  <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 truncate">
                    {dam.capacity_mcm
                      ? `${lang === 'th' ? 'ความจุสูงสุด' : 'Max'}: ${dam.capacity_mcm.toLocaleString()} MCM`
                      : (lang === 'th' ? 'ล้าน ลบ.ม.' : 'Million Cubic Meters')}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-1">
                    <Calendar className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                    <span>{lang === 'th' ? 'วันที่บันทึก' : 'Date'}</span>
                  </div>
                  <div className="text-lg font-bold text-slate-900 dark:text-white">
                    {dam.date}
                  </div>
                  <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 truncate">
                    {lang === 'th' ? 'กรมชลประทาน / สสน.' : 'Source: HII/RID'}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80">
                  <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 mb-1">
                    <ArrowDownRight className="w-3.5 h-3.5" />
                    <span>{lang === 'th' ? 'น้ำไหลเข้า (24ชม.)' : '24h Inflow'}</span>
                  </div>
                  <div className="text-lg font-bold text-emerald-600 dark:text-emerald-300">
                    +{dam.inflow_mcm.toLocaleString()} <span className="text-xs font-normal text-slate-500">MCM</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80">
                  <div className="flex items-center gap-1.5 text-xs text-sky-600 dark:text-sky-400 mb-1">
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    <span>{lang === 'th' ? 'น้ำระบายออก (24ชม.)' : '24h Outflow'}</span>
                  </div>
                  <div className="text-lg font-bold text-sky-600 dark:text-sky-300">
                    -{dam.outflow_mcm.toLocaleString()} <span className="text-xs font-normal text-slate-500">MCM</span>
                  </div>
                </div>
              </div>

              {/* Connected Downstream Rivers & Basin */}
              {connectedRivers.length > 0 && (
                <div className="p-4 rounded-xl bg-sky-50/70 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/60">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-sky-800 dark:text-sky-300 mb-2">
                    <Waves className="w-4 h-4 text-sky-600 dark:text-cyan-400" />
                    <span>
                      {lang === 'th' ? 'สายน้ำท้ายเขื่อนที่รับน้ำ & ลุ่มน้ำ' : 'Downstream River & Basin'}
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {connectedRivers.map((r: any) => (
                      <div
                        key={r.id}
                        className="flex items-center justify-between p-2 rounded-lg text-xs bg-white dark:bg-slate-900 border border-sky-200 dark:border-sky-800/70 shadow-sm"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
                          <span className="font-semibold text-slate-900 dark:text-white">
                            {lang === 'th' ? r.properties.name_th : r.properties.name_en}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                          {lang === 'th' ? r.properties.basin_th : r.properties.basin}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Advisory Card */}
              {advisory && (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 flex items-start gap-3">
                  {advisory.level === 'critical' ? (
                    <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5 animate-pulse" />
                  ) : advisory.level === 'warning' ? (
                    <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  ) : (
                    <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-200">
                      {lang === 'th' ? 'ข้อแนะนำ & สถานะเตือนภัย' : 'Hydrology Advisory Status'}
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                      {lang === 'th' ? advisory.text_th : advisory.text_en}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex justify-end shrink-0">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 dark:border-slate-700 transition-colors"
              >
                {lang === 'th' ? 'ปิดหน้าต่าง' : 'Close'}
              </button>
            </div>
          </>
        )}
      </aside>
    </>
  );
};
