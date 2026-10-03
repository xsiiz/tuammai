import React, { useState, useMemo } from 'react';
import { TrendingUp, TrendingDown, Minus, ArrowDownRight, ArrowUpRight, Activity } from 'lucide-react';
import { DamHistoryRecord } from '../../types/dam';

interface DamTrendChartProps {
  history: DamHistoryRecord[];
  currentStoragePercent: number;
  statusColor: string;
  lang: 'th' | 'en';
}

export const DamTrendChart: React.FC<DamTrendChartProps> = ({
  history,
  currentStoragePercent,
  statusColor,
  lang
}) => {
  const [activeTab, setActiveTab] = useState<'storage' | 'flow'>('storage');
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (!history || history.length === 0) {
    return (
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500">
        {lang === 'th' ? 'ไม่มีข้อมูลแนวโน้มย้อนหลัง' : 'No historical data available'}
      </div>
    );
  }

  // Format short date (e.g., "2026-09-27" -> "27 ก.ย." or "27 Sep")
  const formatDateLabel = (dateStr: string) => {
    const parts = dateStr.split('-');
    if (parts.length < 3) return dateStr;
    const day = parseInt(parts[2], 10);
    const month = parseInt(parts[1], 10);
    const thMonths = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    const enMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${day} ${lang === 'th' ? thMonths[month - 1] : enMonths[month - 1]}`;
  };

  // 7-day analytical summary calculations
  const stats = useMemo(() => {
    const first = history[0];
    const latest = history[history.length - 1];
    const diffStorage = latest.storage_mcm - first.storage_mcm;
    const diffPercent = latest.storage_percent - first.storage_percent;
    const totalInflow = history.reduce((acc, h) => acc + (h.inflow_mcm || 0), 0);
    const totalOutflow = history.reduce((acc, h) => acc + (h.outflow_mcm || 0), 0);

    let trendType: 'increasing' | 'decreasing' | 'stable' = 'stable';
    if (diffStorage > 5) trendType = 'increasing';
    else if (diffStorage < -5) trendType = 'decreasing';

    return {
      diffStorage,
      diffPercent,
      totalInflow,
      totalOutflow,
      trendType
    };
  }, [history]);

  // Chart dimensions & scaling
  const width = 420;
  const height = 150;
  const padding = { top: 20, right: 25, bottom: 28, left: 35 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  // Max/Min calculations for Storage Tab
  const percents = history.map(h => h.storage_percent);
  const minPercent = Math.max(0, Math.floor(Math.min(...percents) - 5));
  const maxPercent = Math.min(120, Math.ceil(Math.max(...percents) + 5));
  const percentRange = Math.max(1, maxPercent - minPercent);

  // SVG Points for Storage Line
  const points = history.map((h, i) => {
    const x = padding.left + (i / Math.max(1, history.length - 1)) * chartW;
    const y = padding.top + chartH - ((h.storage_percent - minPercent) / percentRange) * chartH;
    return { x, y, data: h };
  });

  const linePath = points.reduce((acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${pt.x},${pt.y}`, '');
  const areaPath = `${linePath} L ${points[points.length - 1].x},${padding.top + chartH} L ${points[0].x},${padding.top + chartH} Z`;

  // Flow Tab (Inflow vs Outflow) calculations
  const maxFlow = Math.max(...history.map(h => Math.max(h.inflow_mcm || 0, h.outflow_mcm || 0)), 10);
  const flowRange = maxFlow * 1.15;

  const activeData = hoverIndex !== null ? history[hoverIndex] : history[history.length - 1];

  return (
    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800 transition-colors">
      {/* Title & Tab Switcher */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200">
          <Activity className="w-3.5 h-3.5 text-sky-600 dark:text-cyan-400" />
          <span>{lang === 'th' ? 'แนวโน้ม & สถิติ 7 วันย้อนหลัง' : '7-Day Water Telemetry Trend'}</span>
        </div>

        {/* Tab Switcher */}
        <div className="inline-flex rounded-lg p-0.5 bg-slate-200/80 dark:bg-slate-800 text-[11px] font-medium">
          <button
            onClick={() => setActiveTab('storage')}
            className={`px-2 py-0.5 rounded-md transition-all ${
              activeTab === 'storage'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {lang === 'th' ? '% ความจุ' : '% Storage'}
          </button>
          <button
            onClick={() => setActiveTab('flow')}
            className={`px-2 py-0.5 rounded-md transition-all ${
              activeTab === 'flow'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {lang === 'th' ? 'น้ำเข้า/ระบาย' : 'In/Outflow'}
          </button>
        </div>
      </div>

      {/* 7-Day Change Indicator Pill */}
      <div className="flex items-center justify-between mb-2 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            {lang === 'th' ? 'ทิศทางระดับน้ำ:' : '7-day trend:'}
          </span>
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-semibold text-[11px] ${
              stats.trendType === 'increasing'
                ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                : stats.trendType === 'decreasing'
                ? 'bg-sky-500/15 text-sky-600 dark:text-sky-400'
                : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
            }`}
          >
            {stats.trendType === 'increasing' && <TrendingUp className="w-3 h-3" />}
            {stats.trendType === 'decreasing' && <TrendingDown className="w-3 h-3" />}
            {stats.trendType === 'stable' && <Minus className="w-3 h-3" />}
            {stats.trendType === 'increasing'
              ? (lang === 'th' ? `เพิ่มขึ้น (+${stats.diffStorage.toFixed(1)} MCM)` : `Rising (+${stats.diffStorage.toFixed(1)} MCM)`)
              : stats.trendType === 'decreasing'
              ? (lang === 'th' ? `ลดลง (${stats.diffStorage.toFixed(1)} MCM)` : `Falling (${stats.diffStorage.toFixed(1)} MCM)`)
              : (lang === 'th' ? 'ทรงตัว' : 'Stable')}
          </span>
        </div>

        {/* Hover / Active Telemetry Focus Badge */}
        <div className="text-[11px] font-mono text-slate-600 dark:text-slate-300">
          <span className="text-slate-400">{formatDateLabel(activeData.date)}: </span>
          <span className="font-bold text-slate-900 dark:text-white">
            {activeTab === 'storage'
              ? `${activeData.storage_percent.toFixed(1)}% (${activeData.storage_mcm.toLocaleString()} MCM)`
              : `เข้า +${activeData.inflow_mcm.toFixed(1)} / ออก -${activeData.outflow_mcm.toFixed(1)}`}
          </span>
        </div>
      </div>

      {/* SVG Chart Area */}
      <div className="relative w-full overflow-hidden select-none">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto overflow-visible"
        >
          <defs>
            <linearGradient id="trendGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={statusColor} stopOpacity="0.4" />
              <stop offset="100%" stopColor={statusColor} stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="inflowGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#10B981" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#10B981" stopOpacity="0.5" />
            </linearGradient>
            <linearGradient id="outflowGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#0284C7" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#0284C7" stopOpacity="0.5" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line
            x1={padding.left}
            y1={padding.top}
            x2={width - padding.right}
            y2={padding.top}
            stroke="currentColor"
            strokeDasharray="2 3"
            className="text-slate-200 dark:text-slate-800"
          />
          <line
            x1={padding.left}
            y1={padding.top + chartH / 2}
            x2={width - padding.right}
            y2={padding.top + chartH / 2}
            stroke="currentColor"
            strokeDasharray="2 3"
            className="text-slate-200 dark:text-slate-800"
          />
          <line
            x1={padding.left}
            y1={padding.top + chartH}
            x2={width - padding.right}
            y2={padding.top + chartH}
            stroke="currentColor"
            className="text-slate-300 dark:text-slate-700"
          />

          {/* Y-Axis Labels */}
          {activeTab === 'storage' ? (
            <>
              <text
                x={padding.left - 6}
                y={padding.top + 4}
                textAnchor="end"
                className="text-[9px] fill-slate-400 font-mono"
              >
                {maxPercent}%
              </text>
              <text
                x={padding.left - 6}
                y={padding.top + chartH / 2 + 3}
                textAnchor="end"
                className="text-[9px] fill-slate-400 font-mono"
              >
                {Math.round((maxPercent + minPercent) / 2)}%
              </text>
              <text
                x={padding.left - 6}
                y={padding.top + chartH}
                textAnchor="end"
                className="text-[9px] fill-slate-400 font-mono"
              >
                {minPercent}%
              </text>
            </>
          ) : (
            <>
              <text
                x={padding.left - 6}
                y={padding.top + 4}
                textAnchor="end"
                className="text-[9px] fill-slate-400 font-mono"
              >
                {Math.round(flowRange)}
              </text>
              <text
                x={padding.left - 6}
                y={padding.top + chartH / 2 + 3}
                textAnchor="end"
                className="text-[9px] fill-slate-400 font-mono"
              >
                {Math.round(flowRange / 2)}
              </text>
              <text
                x={padding.left - 6}
                y={padding.top + chartH}
                textAnchor="end"
                className="text-[9px] fill-slate-400 font-mono"
              >
                0
              </text>
            </>
          )}

          {/* TAB 1: Storage Percentage Area & Line */}
          {activeTab === 'storage' && (
            <>
              {/* 80% Warning Line */}
              {minPercent < 80 && maxPercent > 80 && (
                <line
                  x1={padding.left}
                  y1={padding.top + chartH - ((80 - minPercent) / percentRange) * chartH}
                  x2={width - padding.right}
                  y2={padding.top + chartH - ((80 - minPercent) / percentRange) * chartH}
                  stroke="#F59E0B"
                  strokeDasharray="3 3"
                  strokeWidth="1"
                  opacity="0.6"
                />
              )}

              {/* Area Gradient Fill */}
              <path d={areaPath} fill="url(#trendGradient)" />

              {/* Trend Line */}
              <path
                d={linePath}
                fill="none"
                stroke={statusColor}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Data points */}
              {points.map((pt, idx) => {
                const isHovered = hoverIndex === idx || (hoverIndex === null && idx === points.length - 1);
                return (
                  <g key={pt.data.date}>
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={isHovered ? 5 : 3.5}
                      fill={isHovered ? statusColor : '#FFFFFF'}
                      stroke={statusColor}
                      strokeWidth={isHovered ? 2.5 : 1.5}
                      className="transition-all duration-200 cursor-pointer"
                      onMouseEnter={() => setHoverIndex(idx)}
                      onMouseLeave={() => setHoverIndex(null)}
                    />
                  </g>
                );
              })}
            </>
          )}

          {/* TAB 2: Flow (Inflow vs Outflow Grouped Bar) */}
          {activeTab === 'flow' && (
            <>
              {history.map((h, idx) => {
                const groupW = chartW / history.length;
                const barW = Math.max(4, groupW * 0.32);
                const xCenter = padding.left + idx * groupW + groupW / 2;

                const inH = ((h.inflow_mcm || 0) / flowRange) * chartH;
                const outH = ((h.outflow_mcm || 0) / flowRange) * chartH;

                const isHovered = hoverIndex === idx;

                return (
                  <g
                    key={h.date}
                    className="cursor-pointer"
                    onMouseEnter={() => setHoverIndex(idx)}
                    onMouseLeave={() => setHoverIndex(null)}
                  >
                    {/* Inflow Bar (Green) */}
                    <rect
                      x={xCenter - barW - 1}
                      y={padding.top + chartH - inH}
                      width={barW}
                      height={Math.max(2, inH)}
                      rx={2}
                      fill="url(#inflowGrad)"
                      className={isHovered ? 'filter brightness-110' : ''}
                    />

                    {/* Outflow Bar (Blue) */}
                    <rect
                      x={xCenter + 1}
                      y={padding.top + chartH - outH}
                      width={barW}
                      height={Math.max(2, outH)}
                      rx={2}
                      fill="url(#outflowGrad)"
                      className={isHovered ? 'filter brightness-110' : ''}
                    />
                  </g>
                );
              })}
            </>
          )}

          {/* X-Axis Date Labels */}
          {history.map((h, idx) => {
            const x = padding.left + (idx / Math.max(1, history.length - 1)) * chartW;
            const isHovered = hoverIndex === idx || (hoverIndex === null && idx === history.length - 1);
            return (
              <text
                key={h.date}
                x={x}
                y={height - 6}
                textAnchor="middle"
                className={`text-[9.5px] font-mono transition-colors ${
                  isHovered
                    ? 'fill-slate-900 dark:fill-white font-bold'
                    : 'fill-slate-400 dark:fill-slate-500'
                }`}
              >
                {formatDateLabel(h.date)}
              </text>
            );
          })}
        </svg>
      </div>

      {/* Mini Legend & 7-Day Cumulative Metric Pills */}
      <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-500/10 dark:bg-emerald-950/20 border border-emerald-500/20">
          <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
            <ArrowDownRight className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>{lang === 'th' ? 'น้ำเข้าสะสม 7 วัน' : '7-Day Inflow'}</span>
          </div>
          <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 font-mono">
            +{stats.totalInflow.toLocaleString(undefined, { maximumFractionDigits: 1 })} <span className="text-[10px] font-normal">MCM</span>
          </span>
        </div>

        <div className="flex items-center justify-between p-2 rounded-lg bg-sky-500/10 dark:bg-sky-950/20 border border-sky-500/20">
          <div className="flex items-center gap-1.5 text-[11px] text-sky-700 dark:text-sky-400 font-medium">
            <ArrowUpRight className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
            <span>{lang === 'th' ? 'น้ำระบายสะสม 7 วัน' : '7-Day Outflow'}</span>
          </div>
          <span className="text-xs font-bold text-sky-700 dark:text-sky-300 font-mono">
            -{stats.totalOutflow.toLocaleString(undefined, { maximumFractionDigits: 1 })} <span className="text-[10px] font-normal">MCM</span>
          </span>
        </div>
      </div>
    </div>
  );
};
