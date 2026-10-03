import React, { useState } from 'react';
import { PhoneCall, ChevronDown, ChevronUp, ExternalLink, ShieldAlert, HeartPulse, Droplets, Compass } from 'lucide-react';

interface EmergencyHotlineWidgetProps {
  lang: 'th' | 'en';
  onOpenAll: () => void;
}

export const EmergencyHotlineWidget: React.FC<EmergencyHotlineWidgetProps> = ({
  lang,
  onOpenAll,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  const topHotlines = [
    {
      number: '1784',
      nameTh: 'ปภ. ช่วยเหลือน้ำท่วม 24 ชม.',
      nameEn: 'DDPM Disaster Relief 24/7',
      descTh: 'แจ้งเหตุด่วน ขอเรือ ช่วยเหลืออุทกภัย',
      descEn: 'Flood emergency & rescue assistance',
      color: 'from-red-500 to-rose-600',
      badgeBg: 'bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/60',
      icon: <ShieldAlert className="w-3.5 h-3.5 text-red-500" />
    },
    {
      number: '1669',
      nameTh: 'การแพทย์ฉุกเฉิน (กู้ชีพ)',
      nameEn: 'Emergency Medical (EMS)',
      descTh: 'เจ็บป่วยฉุกเฉิน เคลื่อนย้ายผู้ป่วย',
      descEn: 'Medical ambulance & patient evacuation',
      color: 'from-emerald-500 to-teal-600',
      badgeBg: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/60',
      icon: <HeartPulse className="w-3.5 h-3.5 text-emerald-500" />
    },
    {
      number: '1460',
      nameTh: 'สายด่วนน้ำ กรมชลประทาน',
      nameEn: 'RID Water Hotline',
      descTh: 'สอบถามระดับน้ำในอ่าง & การระบาย',
      descEn: 'Reservoir levels & water discharge',
      color: 'from-sky-500 to-blue-600',
      badgeBg: 'bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 border-sky-200 dark:border-sky-900/60',
      icon: <Droplets className="w-3.5 h-3.5 text-sky-500" />
    },
    {
      number: '1193',
      nameTh: 'ตำรวจทางหลวง (น้ำท่วมทาง)',
      nameEn: 'Highway Police',
      descTh: 'สอบถามทางหลวงน้ำท่วม ถนนขาด',
      descEn: 'Flooded highway inquiry & road status',
      color: 'from-amber-500 to-orange-600',
      badgeBg: 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900/60',
      icon: <Compass className="w-3.5 h-3.5 text-amber-500" />
    }
  ];

  return (
    <div className="fixed bottom-4 right-4 z-30 pointer-events-auto select-none transition-all duration-300">
      {/* Collapsed Pill State */}
      {!isExpanded ? (
        <button
          onClick={() => setIsExpanded(true)}
          className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-white/95 dark:bg-[#0F172A]/95 backdrop-blur-md border border-red-200/90 dark:border-red-900/70 shadow-xl hover:shadow-2xl hover:border-red-300 dark:hover:border-red-800 text-slate-800 dark:text-white transition-all hover:scale-102 active:scale-98 group"
          title={lang === 'th' ? 'คลิกเพื่อเปิดกล่องสายด่วนฉุกเฉิน' : 'Click to expand emergency hotlines'}
        >
          <div className="w-6 h-6 rounded-lg bg-red-500 flex items-center justify-center text-white shadow-sm shadow-red-500/50">
            <PhoneCall className="w-3.5 h-3.5 animate-pulse" />
          </div>
          <span className="text-xs font-bold text-red-600 dark:text-red-400">
            {lang === 'th' ? 'สายด่วนฉุกเฉิน' : 'Emergency Hotlines'}
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 font-semibold border border-red-200 dark:border-red-800">
            4 เบอร์สำคัญ
          </span>
          <ChevronUp className="w-4 h-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 ml-0.5 transition-transform" />
        </button>
      ) : (
        /* Expanded Card State */
        <div className="w-72 sm:w-80 rounded-2xl bg-white/95 dark:bg-[#0F172A]/95 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800/90 shadow-2xl overflow-hidden transition-all animate-in fade-in slide-in-from-bottom-3 duration-200">
          {/* Card Header */}
          <div className="px-3.5 py-2.5 bg-gradient-to-r from-red-500/10 via-amber-500/5 to-transparent border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-red-500 flex items-center justify-center text-white shadow-sm shadow-red-500/30">
                <PhoneCall className="w-3.5 h-3.5 animate-pulse" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-tight flex items-center gap-1.5">
                  <span>{lang === 'th' ? 'สายด่วนฉุกเฉินน้ำท่วม' : 'Emergency Hotlines'}</span>
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-ping inline-block"></span>
                </h4>
              </div>
            </div>

            <button
              onClick={() => setIsExpanded(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title={lang === 'th' ? 'ย่อกล่อง' : 'Collapse widget'}
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          {/* Hotline Quick List */}
          <div className="p-2 space-y-1.5">
            {topHotlines.map((item) => (
              <div
                key={item.number}
                className="group flex items-center justify-between p-2 rounded-xl bg-slate-50/80 dark:bg-slate-900/60 hover:bg-slate-100/90 dark:hover:bg-slate-800/90 border border-slate-200/60 dark:border-slate-800/60 transition-all duration-150"
              >
                <div className="flex items-center gap-2 min-w-0 pr-2">
                  <div className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0 shadow-xs">
                    {item.icon}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-900 dark:text-white truncate leading-tight">
                      {lang === 'th' ? item.nameTh : item.nameEn}
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate leading-tight">
                      {lang === 'th' ? item.descTh : item.descEn}
                    </p>
                  </div>
                </div>

                <a
                  href={`tel:${item.number}`}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 hover:border-red-400 dark:hover:border-red-500 hover:text-red-600 dark:hover:text-red-400 shadow-xs transition-all shrink-0 hover:scale-105 active:scale-95"
                  title={`${lang === 'th' ? 'โทรออก' : 'Call'} ${item.number}`}
                >
                  <PhoneCall className="w-3 h-3 text-red-500" />
                  <span>{item.number}</span>
                </a>
              </div>
            ))}
          </div>

          {/* Bottom Action Footer */}
          <div className="px-3 py-2 bg-slate-50/70 dark:bg-slate-900/80 border-t border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between text-[11px]">
            <span className="text-slate-500 dark:text-slate-400">
              {lang === 'th' ? 'โทรฟรีตลอด 24 ชม.' : 'Toll-free 24/7'}
            </span>
            <button
              onClick={onOpenAll}
              className="inline-flex items-center gap-1 font-semibold text-sky-600 dark:text-cyan-400 hover:text-sky-700 dark:hover:text-cyan-300 transition-colors"
            >
              <span>{lang === 'th' ? 'ดูเบอร์ทั้งหมด' : 'View all'}</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
