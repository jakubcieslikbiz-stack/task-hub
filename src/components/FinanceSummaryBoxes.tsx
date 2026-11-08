import React, { useState } from 'react';
import type { Task, MonthlyCosts } from '../types';
import {
  Clock,
  DollarSign,
  Wallet,
  Settings2,
  TrendingUp,
  Layers
} from 'lucide-react';

interface FinanceSummaryBoxesProps {
  tasks: Task[];
  costs: MonthlyCosts;
  statusFilter: 'all' | 'in_progress' | 'done' | 'paid';
  onFilterChange: (filter: 'all' | 'in_progress' | 'done' | 'paid') => void;
  onSaveCosts: (costs: MonthlyCosts) => void;
  onOpenFinancesView: () => void;
}

export const FinanceSummaryBoxes: React.FC<FinanceSummaryBoxesProps> = ({
  tasks,
  costs,
  statusFilter,
  onFilterChange,
  onSaveCosts,
  onOpenFinancesView,
}) => {
  const [showCostSettings, setShowCostSettings] = useState(false);
  const [tempZus, setTempZus] = useState(costs.zus.toString());
  const [tempTax, setTempTax] = useState(costs.tax.toString());
  const [chartMode, setChartMode] = useState<'daily' | 'cumulative'>('daily');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Calculations
  const inProgressTasks = tasks.filter((t) => t.status === 'in_progress');
  const inProgressValue = inProgressTasks.reduce((sum, t) => sum + (t.price || 0), 0);

  const doneTasks = tasks.filter((t) => t.status === 'done');
  const doneValue = doneTasks.reduce((sum, t) => sum + (t.price || 0), 0);

  const paidTasks = tasks.filter((t) => t.status === 'paid');
  const paidValue = paidTasks.reduce((sum, t) => sum + (t.price || 0), 0);

  const totalCosts = (costs.zus || 0) + (costs.tax || 0);
  const netProfit = paidValue - totalCosts;

  const handleSaveCosts = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveCosts({
      zus: Number(tempZus) || 0,
      tax: Number(tempTax) || 0,
    });
    setShowCostSettings(false);
  };

  // Build Real Timeline Data Points from tasks
  const getTimelinePoints = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Number of days to display (last 10 days)
    const numDays = 10;
    const rawPoints: {
      dateStr: string;
      label: string;
      dailyVal: number;
      tasks: Task[];
    }[] = [];

    for (let i = numDays - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const label = `${d.getDate()} ${d.toLocaleDateString('pl-PL', { month: 'short' })}`;

      // Filter tasks matching this day (dueDate or startDate or createdAt)
      const dayTasks = tasks.filter((t) => {
        const taskDate = t.dueDate || t.startDate || t.createdAt.slice(0, 10);
        return taskDate === dateStr;
      });

      let dailyVal = 0;
      if (statusFilter === 'paid') {
        dailyVal = dayTasks
          .filter((t) => t.status === 'paid')
          .reduce((sum, t) => sum + (t.price || 0), 0);
      } else if (statusFilter === 'in_progress') {
        dailyVal = dayTasks
          .filter((t) => t.status === 'in_progress')
          .reduce((sum, t) => sum + (t.price || 0), 0);
      } else {
        // all active / completed / paid
        dailyVal = dayTasks.reduce((sum, t) => sum + (t.price || 0), 0);
      }

      rawPoints.push({
        dateStr,
        label,
        dailyVal,
        tasks: dayTasks,
      });
    }

    // Apply cumulative mode if selected
    let runningSum = 0;
    return rawPoints.map((pt) => {
      runningSum += pt.dailyVal;
      return {
        ...pt,
        val: chartMode === 'cumulative' ? runningSum : pt.dailyVal,
      };
    });
  };

  const timelineData = getTimelinePoints();
  const maxVal = Math.max(...timelineData.map((d) => d.val), 2000);

  // SVG Chart Dimensions
  const svgWidth = 720;
  const svgHeight = 110;
  const padX = 45;
  const padTop = 15;
  const padBottom = 25;
  const plotW = svgWidth - padX * 2;
  const plotH = svgHeight - padTop - padBottom;

  const coords = timelineData.map((pt, idx) => {
    const x = padX + (idx / (timelineData.length - 1)) * plotW;
    const y = padTop + plotH - (pt.val / maxVal) * plotH;
    return { x, y, pt };
  });

  // Construct SVG Path
  const linePathD = coords
    .map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x.toFixed(1)},${c.y.toFixed(1)}`)
    .join(' ');

  const areaPathD =
    linePathD +
    ` L ${coords[coords.length - 1].x.toFixed(1)},${(padTop + plotH).toFixed(1)}` +
    ` L ${coords[0].x.toFixed(1)},${(padTop + plotH).toFixed(1)} Z`;

  const hoveredCoord = hoveredIndex !== null ? coords[hoveredIndex] : null;

  return (
    <div className="mb-6 space-y-4">
      {/* Full-width Working Cash Flow & Rozliczenia Card */}
      <div className="w-full glass-panel rounded-3xl p-6 sm:p-7 shadow-2xl hover:border-[#3d2f24] transition-all space-y-5">
        {/* Card Header & Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#2e231c]">
          <div>
            <span className="text-xs font-mono uppercase tracking-wider text-[#9e8f82] block">
              Cash flow & Rozliczenia
            </span>
            <h3 className="text-base font-light text-[#f5ede4] tracking-tight mt-0.5">
              Rzeczywiste przepływy finansowe JC Studio
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Chart mode toggle (Daily vs Cumulative) */}
            <div className="flex items-center gap-1 bg-[#140f0c] border border-[#2e231c] p-1 rounded-full text-[11px]">
              <button
                onClick={() => setChartMode('daily')}
                className={`px-3 py-1 rounded-full transition-all ${
                  chartMode === 'daily'
                    ? 'bg-[#251b14] text-[#f5ede4] font-medium border border-[#382b20]'
                    : 'text-[#9e8f82] hover:text-[#f5ede4]'
                }`}
              >
                Przepływy dzienne
              </button>
              <button
                onClick={() => setChartMode('cumulative')}
                className={`px-3 py-1 rounded-full transition-all ${
                  chartMode === 'cumulative'
                    ? 'bg-[#251b14] text-[#f5ede4] font-medium border border-[#382b20]'
                    : 'text-[#9e8f82] hover:text-[#f5ede4]'
                }`}
              >
                Trend narastająco
              </button>
            </div>

            {/* Status Filter buttons */}
            <div className="flex items-center gap-1 bg-[#140f0c] border border-[#2e231c] p-1 rounded-full text-[11px]">
              <button
                onClick={() => onFilterChange('all')}
                className={`px-3 py-1 rounded-full transition-all ${
                  statusFilter === 'all'
                    ? 'bg-[#f5ede4] text-[#120e0a] font-medium shadow-sm'
                    : 'text-[#9e8f82] hover:text-[#f5ede4]'
                }`}
              >
                Wszystko
              </button>
              <button
                onClick={() => onFilterChange('paid')}
                className={`px-3 py-1 rounded-full transition-all ${
                  statusFilter === 'paid'
                    ? 'bg-[#f5ede4] text-[#120e0a] font-medium shadow-sm'
                    : 'text-[#9e8f82] hover:text-[#f5ede4]'
                }`}
              >
                Opłacone
              </button>
              <button
                onClick={() => onFilterChange('in_progress')}
                className={`px-3 py-1 rounded-full transition-all ${
                  statusFilter === 'in_progress'
                    ? 'bg-[#f5ede4] text-[#120e0a] font-medium shadow-sm'
                    : 'text-[#9e8f82] hover:text-[#f5ede4]'
                }`}
              >
                W toku
              </button>
            </div>
          </div>
        </div>

        {/* 3 Main Numbers Breakdown */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
          <div className="p-3.5 rounded-2xl bg-[#140f0c] border border-[#2e231c]">
            <div className="text-[11px] font-mono text-[#9e8f82] flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#f5ede4]" />
              Przychód zrealizowany (Opłacone)
            </div>
            <div className="text-2xl sm:text-3xl font-light text-[#f5ede4] tracking-tight mt-1 font-mono">
              {paidValue.toLocaleString('pl-PL')} zł
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#140f0c] border border-[#2e231c]">
            <div className="text-[11px] font-mono text-[#9e8f82] flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#e07a68]" />
              Koszty stałe (ZUS + PIT/VAT)
            </div>
            <div className="text-2xl sm:text-3xl font-light text-[#e07a68] tracking-tight mt-1 font-mono">
              {totalCosts.toLocaleString('pl-PL')} zł
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#140f0c] border border-[#2e231c]">
            <div className="text-[11px] font-mono text-[#9e8f82] flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#7ec29a]" />
              Zysk netto (Na czysto)
            </div>
            <div className="text-2xl sm:text-3xl font-semibold text-[#7ec29a] tracking-tight mt-1 font-mono">
              {netProfit >= 0 ? `+${netProfit.toLocaleString('pl-PL')}` : netProfit.toLocaleString('pl-PL')} zł
            </div>
          </div>
        </div>

        {/* Interactive Dynamic SVG Line Chart */}
        <div className="relative pt-3 select-none">
          {/* Floating Tooltip */}
          {hoveredCoord && (
            <div
              className="absolute pointer-events-none -top-3 z-30 px-3 py-1.5 rounded-xl bg-[#1e1713] text-[#f5ede4] text-xs border border-[#3d2f24] shadow-2xl transition-all font-mono"
              style={{
                left: `${Math.min(Math.max(hoveredCoord.x - 50, 10), 600)}px`,
              }}
            >
              <div className="text-[10px] text-[#9e8f82]">{hoveredCoord.pt.label}</div>
              <div className="font-semibold text-[#f5ede4]">
                {hoveredCoord.pt.val.toLocaleString('pl-PL')} zł
              </div>
              {hoveredCoord.pt.tasks.length > 0 && (
                <div className="text-[10px] text-[#d99b5a] truncate max-w-[140px]">
                  {hoveredCoord.pt.tasks[0].title}
                </div>
              )}
            </div>
          )}

          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full h-36 overflow-visible cursor-crosshair"
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <defs>
              <linearGradient id="cashflowGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f5ede4" stopOpacity="0.18" />
                <stop offset="100%" stopColor="#f5ede4" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Horizontal Grid lines */}
            <line
              x1={padX}
              y1={padTop}
              x2={svgWidth - padX}
              y2={padTop}
              stroke="#261d17"
              strokeDasharray="3 3"
            />
            <text
              x={padX - 8}
              y={padTop + 3}
              textAnchor="end"
              className="fill-[#7a6b5e] text-[9px] font-mono"
            >
              {maxVal.toLocaleString('pl-PL')} zł
            </text>

            <line
              x1={padX}
              y1={padTop + plotH / 2}
              x2={svgWidth - padX}
              y2={padTop + plotH / 2}
              stroke="#261d17"
              strokeDasharray="3 3"
            />
            <text
              x={padX - 8}
              y={padTop + plotH / 2 + 3}
              textAnchor="end"
              className="fill-[#7a6b5e] text-[9px] font-mono"
            >
              {(maxVal / 2).toLocaleString('pl-PL')} zł
            </text>

            <line
              x1={padX}
              y1={padTop + plotH}
              x2={svgWidth - padX}
              y2={padTop + plotH}
              stroke="#382b20"
            />
            <text
              x={padX - 8}
              y={padTop + plotH + 3}
              textAnchor="end"
              className="fill-[#7a6b5e] text-[9px] font-mono"
            >
              0 zł
            </text>

            {/* Area gradient under line */}
            <path d={areaPathD} fill="url(#cashflowGradient)" />

            {/* Main Dynamic Line */}
            <path
              d={linePathD}
              fill="none"
              stroke="#f5ede4"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-all duration-300"
            />

            {/* Vertical hover indicator line */}
            {hoveredCoord && (
              <line
                x1={hoveredCoord.x}
                y1={padTop}
                x2={hoveredCoord.x}
                y2={padTop + plotH}
                stroke="#d99b5a"
                strokeWidth="1.5"
                strokeDasharray="2 2"
              />
            )}

            {/* Interactive Data points */}
            {coords.map((c, i) => {
              const isHovered = hoveredIndex === i;
              const hasValue = c.pt.val > 0;

              return (
                <g key={i}>
                  {/* Invisible wide hover target area */}
                  <rect
                    x={c.x - plotW / (coords.length * 2)}
                    y={0}
                    width={plotW / coords.length}
                    height={svgHeight}
                    fill="transparent"
                    onMouseEnter={() => setHoveredIndex(i)}
                  />

                  {/* Dot */}
                  <circle
                    cx={c.x}
                    cy={c.y}
                    r={isHovered ? 5.5 : hasValue ? 3.5 : 2}
                    className={`transition-all duration-150 ${
                      isHovered
                        ? 'fill-[#f5ede4] stroke-[#d99b5a] stroke-2 shadow-lg'
                        : hasValue
                        ? 'fill-[#f5ede4]'
                        : 'fill-[#3d2f24]'
                    }`}
                  />

                  {/* X-axis date labels */}
                  <text
                    x={c.x}
                    y={svgHeight - 6}
                    textAnchor="middle"
                    className={`text-[9px] font-mono transition-colors ${
                      isHovered ? 'fill-[#f5ede4] font-bold' : 'fill-[#7a6b5e]'
                    }`}
                  >
                    {c.pt.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Card Footer */}
        <div className="pt-3 border-t border-[#2e231c] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-[#9e8f82]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#7ec29a]" />
            <span>Koszty stałe studia: ZUS {costs.zus} zł • Podatek {costs.tax} zł (miesięcznie)</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowCostSettings(true)}
              className="text-[#d99b5a] hover:text-[#f1c38e] flex items-center gap-1 text-[11px] font-medium transition-colors"
            >
              <Settings2 className="w-3.5 h-3.5" />
              <span>Edytuj koszty stałe</span>
            </button>
            <button
              onClick={onOpenFinancesView}
              className="text-[#f5ede4] hover:text-white flex items-center gap-1 text-[11px] font-medium transition-colors"
            >
              <span>Pełny panel finansów →</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Interactive Order Status & Profit Boxes below */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Box 1: W toku */}
        <div
          onClick={() => onFilterChange(statusFilter === 'in_progress' ? 'all' : 'in_progress')}
          className={`cursor-pointer rounded-2xl p-4 transition-all duration-200 border shadow-lg relative group ${
            statusFilter === 'in_progress'
              ? 'bg-[#2a1e16] border-[#d99b5a]/60 shadow-[#d99b5a]/10'
              : 'glass-panel hover:border-[#3d2f24]'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-[#d99b5a] font-medium mb-1">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              W toku
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#d99b5a]/15 text-[#f1c38e] border border-[#d99b5a]/30">
              {inProgressTasks.length} {inProgressTasks.length === 1 ? 'zlecenie' : 'zleceń'}
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-light text-[#f5ede4] tracking-tight font-mono">
            {inProgressValue.toLocaleString('pl-PL')} zł
          </div>
          <div className="mt-1 text-[11px] text-[#9e8f82] flex items-center justify-between">
            <span>W trakcie renderów</span>
            <span className="text-[10px] text-[#d99b5a] group-hover:underline">filtruj →</span>
          </div>
        </div>

        {/* Box 2: Gotowe */}
        <div
          onClick={() => onFilterChange(statusFilter === 'done' ? 'all' : 'done')}
          className={`cursor-pointer rounded-2xl p-4 transition-all duration-200 border shadow-lg relative group ${
            statusFilter === 'done'
              ? 'bg-[#2a1e16] border-[#7ec29a]/60 shadow-[#7ec29a]/10'
              : 'glass-panel hover:border-[#3d2f24]'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-[#7ec29a] font-medium mb-1">
            <span className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" />
              Gotowe (Oddane)
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#7ec29a]/15 text-[#9ee2b9] border border-[#7ec29a]/30">
              {doneTasks.length} {doneTasks.length === 1 ? 'zlecenie' : 'zleceń'}
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-light text-[#f5ede4] tracking-tight font-mono">
            {doneValue.toLocaleString('pl-PL')} zł
          </div>
          <div className="mt-1 text-[11px] text-[#9e8f82] flex items-center justify-between">
            <span>Czeka na rozliczenie</span>
            <span className="text-[10px] text-[#7ec29a] group-hover:underline">filtruj →</span>
          </div>
        </div>

        {/* Box 3: Opłacone */}
        <div
          onClick={() => onFilterChange(statusFilter === 'paid' ? 'all' : 'paid')}
          className={`cursor-pointer rounded-2xl p-4 transition-all duration-200 border shadow-lg relative group ${
            statusFilter === 'paid'
              ? 'bg-[#2a1e16] border-[#f5ede4]/60 shadow-black/30'
              : 'glass-panel hover:border-[#3d2f24]'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-[#f5ede4] font-medium mb-1">
            <span className="flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5" />
              Opłacone
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#f5ede4]/15 text-[#f5ede4] border border-[#f5ede4]/30">
              {paidTasks.length} {paidTasks.length === 1 ? 'zlecenie' : 'zleceń'}
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-light text-[#f5ede4] tracking-tight font-mono">
            {paidValue.toLocaleString('pl-PL')} zł
          </div>
          <div className="mt-1 text-[11px] text-[#9e8f82] flex items-center justify-between">
            <span>Rzeczywisty przychód</span>
            <span className="text-[10px] text-[#f5ede4] group-hover:underline">filtruj →</span>
          </div>
        </div>

        {/* Box 4: Na czysto */}
        <div
          onClick={onOpenFinancesView}
          className="cursor-pointer glass-panel hover:border-[#3d2f24] rounded-2xl p-4 transition-all duration-200 border shadow-lg relative group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-xs font-medium mb-1">
            <span className={`flex items-center gap-1.5 ${netProfit >= 0 ? 'text-[#7ec29a]' : 'text-[#e07a68]'}`}>
              <Wallet className="w-3.5 h-3.5" />
              Zysk netto
            </span>
            <span className="text-[10px] text-[#9e8f82] group-hover:text-[#f5ede4] transition-colors">
              pełny panel →
            </span>
          </div>

          <div
            className={`text-xl sm:text-2xl font-semibold tracking-tight font-mono ${
              netProfit >= 0 ? 'text-[#7ec29a]' : 'text-[#e07a68]'
            }`}
          >
            {netProfit.toLocaleString('pl-PL')} zł
          </div>

          <div className="mt-1 text-[11px] text-[#9e8f82] flex items-center justify-between">
            <span>Koszty: {totalCosts} zł</span>
            <span className="text-[10px] text-[#d99b5a] flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" />
              Zysk
            </span>
          </div>
        </div>
      </div>

      {/* Modal Settings for ZUS & Tax */}
      {showCostSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="glass-panel border border-[#3d2f24] rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#2e231c] pb-3">
              <h3 className="text-base font-medium text-[#f5ede4]">Koszty stałe studia</h3>
              <button
                onClick={() => setShowCostSettings(false)}
                className="text-[#9e8f82] hover:text-[#f5ede4]"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCosts} className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase text-[#9e8f82] mb-1">
                  Składka ZUS (zł / miesiąc)
                </label>
                <input
                  type="number"
                  value={tempZus}
                  onChange={(e) => setTempZus(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl glass-input text-sm"
                  placeholder="np. 1600"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-[#9e8f82] mb-1">
                  Zaliczka na podatek PIT/VAT (zł / miesiąc)
                </label>
                <input
                  type="number"
                  value={tempTax}
                  onChange={(e) => setTempTax(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl glass-input text-sm"
                  placeholder="np. 800"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCostSettings(false)}
                  className="px-4 py-2 rounded-xl text-xs text-[#9e8f82] hover:text-[#f5ede4] transition-colors"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-[#f5ede4] hover:bg-white text-[#120e0a] text-xs font-semibold shadow-md transition-all active:scale-95"
                >
                  Zapisz koszty
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
