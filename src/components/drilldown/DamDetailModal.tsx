import React from 'react';
import { X, ArrowDownRight, ArrowUpRight, Droplets, AlertTriangle, ShieldCheck, MapPin, Building2, Calendar } from 'lucide-react';
import { DamTelemetry } from '../../types/dam';

interface DamDetailModalProps {
  dam: DamTelemetry | null;
  onClose: () => void;
  lang: 'th' | 'en';
}

export const DamDetailModal: React.FC<DamDetailModalProps> = ({ dam, onClose, lang }) => {
  if (!dam) return null;

  // Advisory note based on storage percentage
  const getAdvisory = () => {
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
  };

  const advisory = getAdvisory();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div 
        className="relative w-full max-w-lg bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden transition-colors duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Ribbon with Dam Color Glow */}
        <div 
          className="h-2 w-full"
          style={{ backgroundColor: dam.status_color }}
        />

        <div className="p-6">
          {/* Top Bar: Title & Close Button */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span 
                  className="px-2.5 py-0.5 rounded-full text-xs font-semibold inline-flex items-center gap-1.5"
                  style={{ 
                    backgroundColor: `${dam.status_color}20`,
                    color: dam.status_color,
                    border: `1px solid ${dam.status_color}50`
                  }}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: dam.status_color }}></span>
                  {lang === 'th' ? dam.status_label_th : dam.status_label_en}
                </span>
                {dam.national_rank && dam.national_rank <= 10 && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:bg-amber-400/20 dark:text-amber-300 border border-amber-300/40">
                    {lang === 'th' ? `เขื่อนใหญ่อันดับ ${dam.national_rank} ของประเทศ` : `Top ${dam.national_rank} National Dam`}
                  </span>
                )}
                <span className="text-xs text-slate-600 dark:text-slate-400 capitalize bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700/50">
                  {dam.region}
                </span>
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                {lang === 'th' ? dam.name_th : dam.name_en}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {lang === 'th' ? dam.name_en : dam.name_th}
              </p>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Gauge: Storage Percentage Bar */}
          <div className="mt-5 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800">
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

            {/* Custom Meter Bar */}
            <div className="w-full h-3 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden relative">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{
                  width: `${Math.min(dam.storage_percent, 100)}%`,
                  backgroundColor: dam.status_color
                }}
              />
              {/* 100% Capacity Marker Line */}
              <div className="absolute top-0 bottom-0 right-0 w-0.5 bg-red-400/80" title="100% Maximum capacity line" />
            </div>

            <div className="flex justify-between items-center mt-2 text-[11px] text-slate-500 font-mono">
              <span>0% (แห้ง)</span>
              <span>30% (วิกฤตแล้ง)</span>
              <span>80% (เฝ้าระวัง)</span>
              <span>100% (เต็มความจุ)</span>
            </div>
          </div>

          {/* Hydrology Telemetry Grid */}
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-1">
                <Droplets className="w-3.5 h-3.5 text-sky-600 dark:text-cyan-400" />
                <span>{lang === 'th' ? 'ปริมาตรน้ำในอ่าง' : 'Water Volume'}</span>
              </div>
              <div className="text-lg font-bold text-slate-900 dark:text-white">
                {dam.storage_mcm.toLocaleString()} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">MCM</span>
              </div>
              <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                {dam.capacity_mcm
                  ? `${lang === 'th' ? 'ความจุสูงสุด' : 'Max capacity'}: ${dam.capacity_mcm.toLocaleString()} MCM`
                  : (lang === 'th' ? 'ล้านลูกบาศก์เมตร' : 'Million Cubic Meters')}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-1">
                <Calendar className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                <span>{lang === 'th' ? 'วันที่บันทึกข้อมูล' : 'Telemetry Date'}</span>
              </div>
              <div className="text-lg font-bold text-slate-900 dark:text-white">
                {dam.date}
              </div>
              <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                {lang === 'th' ? 'กรมชลประทาน / สสน.' : 'Official Source: HII/RID'}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80">
              <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 mb-1">
                <ArrowDownRight className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>{lang === 'th' ? 'น้ำไหลเข้า (24ชม.)' : '24h Inflow'}</span>
              </div>
              <div className="text-lg font-bold text-emerald-600 dark:text-emerald-300">
                +{dam.inflow_mcm.toLocaleString()} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">MCM</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80">
              <div className="flex items-center gap-1.5 text-xs text-sky-600 dark:text-sky-400 mb-1">
                <ArrowUpRight className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                <span>{lang === 'th' ? 'น้ำระบายออก (24ชม.)' : '24h Outflow'}</span>
              </div>
              <div className="text-lg font-bold text-sky-600 dark:text-sky-300">
                -{dam.outflow_mcm.toLocaleString()} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">MCM</span>
              </div>
            </div>
          </div>

          {/* Risk Advisory Note */}
          <div className="mt-4 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 flex items-start gap-3">
            {advisory.level === 'critical' ? (
              <AlertTriangle className="w-5 h-5 text-red-500 dark:text-red-400 shrink-0 mt-0.5 animate-pulse" />
            ) : advisory.level === 'warning' ? (
              <AlertTriangle className="w-5 h-5 text-amber-500 dark:text-amber-400 shrink-0 mt-0.5" />
            ) : (
              <ShieldCheck className="w-5 h-5 text-emerald-500 dark:text-emerald-400 shrink-0 mt-0.5" />
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

          {/* Action Footer */}
          <div className="mt-5 flex justify-end gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 dark:border-slate-700 transition-colors"
            >
              {lang === 'th' ? 'ปิดหน้าต่าง' : 'Close'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
