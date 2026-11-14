import React, { useState, useRef, useEffect } from 'react';
import type { Task, MonthlyCosts, MonthlyBillsData } from '../types';
import { useAnimatedCounter } from '../hooks/useAnimatedCounter';
import {
  Clock,
  DollarSign,
  Wallet,
  Settings2,
  Layers,
  ZoomIn,
  MoveHorizontal
} from 'lucide-react';

interface FinanceSummaryBoxesProps {
  tasks: Task[];
  costs: MonthlyCosts;
  monthlyBills?: MonthlyBillsData;
  statusFilter: 'all' | 'in_progress' | 'done' | 'paid';
  onFilterChange: (filter: 'all' | 'in_progress' | 'done' | 'paid') => void;
  onSaveCosts: (costs: MonthlyCosts) => void;
  onOpenFinancesView: () => void;
  onOpenPersonalView?: () => void;
}

export const FinanceSummaryBoxes: React.FC<FinanceSummaryBoxesProps> = ({
  tasks,
  costs,
  monthlyBills,
  statusFilter,
  onFilterChange,
  onSaveCosts,
  onOpenFinancesView,
  onOpenPersonalView,
}) => {
  const [showCostSettings, setShowCostSettings] = useState(false);
  const [tempZus, setTempZus] = useState(costs.zus.toString());
  const [tempTax, setTempTax] = useState(costs.tax.toString());
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [chartZoom, setChartZoom] = useState<'1x' | '1.5x' | '2x'>('1.5x');
  const chartScrollRef = useRef<HTMLDivElement>(null);

  const now = new Date();
  const curYear = now.getFullYear();
  const curMonth = now.getMonth();
  const curDate = now.getDate();
  const daysInMonth = new Date(curYear, curMonth + 1, 0).getDate();
  const currentYm = `${curYear}-${String(curMonth + 1).padStart(2, '0')}`;
  const monthNamePolish = now.toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' });

  // Helper to format Date to local YYYY-MM-DD (avoiding UTC timezone shift)
  const toLocalDateStr = (d: Date): string => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const getTaskCashFlowDate = (t: Task): string => {
    // 1. If task is paid and completedAt is set, this is the exact payment transaction date
    if (t.status === 'paid' && t.completedAt) {
      try {
        const d = new Date(t.completedAt);
        if (!isNaN(d.getTime())) return toLocalDateStr(d);
      } catch {}
    }

    // 2. dueDate
    if (t.dueDate) {
      if (/^\d{4}-\d{2}-\d{2}$/.test(t.dueDate)) return t.dueDate;
      try {
        const d = new Date(t.dueDate);
        if (!isNaN(d.getTime())) return toLocalDateStr(d);
      } catch {}
    }

    // 3. completedAt (for 'done')
    if (t.completedAt) {
      try {
        const d = new Date(t.completedAt);
        if (!isNaN(d.getTime())) return toLocalDateStr(d);
      } catch {}
    }

    // 4. startDate
    if (t.startDate) {
      if (/^\d{4}-\d{2}-\d{2}$/.test(t.startDate)) return t.startDate;
      try {
        const d = new Date(t.startDate);
        if (!isNaN(d.getTime())) return toLocalDateStr(d);
      } catch {}
    }

    // 5. Fallback to createdAt
    if (t.createdAt) {
      try {
        const d = new Date(t.createdAt);
        if (!isNaN(d.getTime())) return toLocalDateStr(d);
      } catch {}
      if (t.createdAt.length >= 10) return t.createdAt.slice(0, 10);
    }

    return '';
  };

  // Strictly filter tasks belonging to the CURRENT MONTH (od 1 do ostatniego dnia)
  const currentMonthTasks = tasks.filter((t) => {
    const cashDate = getTaskCashFlowDate(t);
    if (cashDate && cashDate.startsWith(currentYm)) return true;
    const createdYm = t.createdAt ? t.createdAt.slice(0, 7) : '';
    const dueYm = t.dueDate ? t.dueDate.slice(0, 7) : '';
    const startYm = t.startDate ? t.startDate.slice(0, 7) : '';
    return createdYm === currentYm || dueYm === currentYm || startYm === currentYm;
  });

  // Calculations for CURRENT MONTH
  const inProgressTasks = currentMonthTasks.filter((t) => t.status === 'in_progress' || t.status === 'todo');
  const inProgressValue = inProgressTasks.reduce((sum, t) => sum + (Number(t.price) || 0), 0);

  const doneTasks = currentMonthTasks.filter((t) => t.status === 'done');
  const doneValue = doneTasks.reduce((sum, t) => sum + (Number(t.price) || 0), 0);

  const paidTasks = currentMonthTasks.filter((t) => t.status === 'paid');
  const paidValue = paidTasks.reduce((sum, t) => sum + (Number(t.price) || 0), 0);

  // Calculate monthly bills total for the current month from Moje Sprawy
  const currentMonthBillsMap = monthlyBills?.[currentYm] || {};
  const currentMonthBillsEntries = Object.entries(currentMonthBillsMap);
  const monthlyBillsTotal = currentMonthBillsEntries.reduce(
    (sum, [_, item]) => sum + (Number(item?.amount) || 0),
    0
  );
  const filledBillsCount = currentMonthBillsEntries.filter(
    ([_, item]) => (Number(item?.amount) || 0) > 0
  ).length;

  // Use the sum of fixed bills entered in Moje Sprawy, or fall back to default costs if empty
  const fallbackCosts = (costs.zus || 0) + (costs.tax || 0);
  const totalCosts = monthlyBillsTotal > 0 ? monthlyBillsTotal : fallbackCosts;
  const netProfit = paidValue - totalCosts;

  // Animated number counters for the 4 KPI boxes (rolling up on mount & filter switch)
  const animInProgressValue = useAnimatedCounter(inProgressValue, 1100);
  const animInProgressCount = useAnimatedCounter(inProgressTasks.length, 800);

  const animDoneValue = useAnimatedCounter(doneValue, 1100);
  const animDoneCount = useAnimatedCounter(doneTasks.length, 800);

  const animPaidValue = useAnimatedCounter(paidValue, 1100);
  const animPaidCount = useAnimatedCounter(paidTasks.length, 800);

  const animNetProfit = useAnimatedCounter(netProfit, 1100);
  const animTotalCount = useAnimatedCounter(currentMonthTasks.length, 800);

  // Animated chart rise effect ("wykres się podnosi")
  const [chartRise, setChartRise] = useState(0);

  useEffect(() => {
    let startTime: number | null = null;
    let animId: number;
    const duration = 1100;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(1, elapsed / duration);
      // Snappy lift-off with smooth logarithmic deceleration (easeOutQuart)
      const ease = 1 - Math.pow(1 - progress, 3.5);
      setChartRise(ease);

      if (progress < 1) {
        animId = requestAnimationFrame(animate);
      }
    };

    setChartRise(0);
    animId = requestAnimationFrame(animate);

    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [statusFilter]);

  const handleSaveCosts = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveCosts({
      zus: Number(tempZus) || 0,
      tax: Number(tempTax) || 0,
    });
    setShowCostSettings(false);
  };

  // Build Cumulative Month-to-Date Timeline Points (od 1 do DZISIEJSZEGO DNIA)
  const getTimelinePoints = () => {
    const rawPoints: {
      dateStr: string;
      label: string;
      val: number;
      dailyVal: number;
      tasks: Task[];
      isToday: boolean;
    }[] = [];

    let runningTotal = 0;

    for (let day = 1; day <= curDate; day++) {
      const d = new Date(curYear, curMonth, day);
      const dateStr = toLocalDateStr(d);
      const label = `${day} ${d.toLocaleDateString('pl-PL', { month: 'short' })}`;
      const isToday = day === curDate;

      const dayTasks = currentMonthTasks.filter((t) => {
        const taskDate = getTaskCashFlowDate(t);
        return taskDate === dateStr;
      });

      let dayVal = 0;
      if (statusFilter === 'paid') {
        dayVal = dayTasks
          .filter((t) => t.status === 'paid')
          .reduce((sum, t) => sum + (Number(t.price) || 0), 0);
      } else if (statusFilter === 'in_progress') {
        dayVal = dayTasks
          .filter((t) => t.status === 'in_progress' || t.status === 'todo')
          .reduce((sum, t) => sum + (Number(t.price) || 0), 0);
      } else {
        dayVal = dayTasks.reduce((sum, t) => sum + (Number(t.price) || 0), 0);
      }

      runningTotal += dayVal;

      rawPoints.push({
        dateStr,
        label,
        val: runningTotal,
        dailyVal: dayVal,
        tasks: dayTasks,
        isToday,
      });
    }

    return rawPoints;
  };

  const timelineData = getTimelinePoints();
  const rawMax = Math.max(...timelineData.map((d) => d.val), 2000);
  // Add 15% margin above peak so the line has breathing room
  const maxVal = Math.ceil((rawMax * 1.15) / 500) * 500;

  // SVG Chart Dimensions (Expanded for mobile scrolling & crisp zoom)
  const svgWidth = 880;
  const svgHeight = 135;
  const padX = 48;
  const padTop = 18;
  const padBottom = 26;
  const plotW = svgWidth - padX * 2;
  const plotH = svgHeight - padTop - padBottom;

  const denominator = Math.max(1, timelineData.length - 1);
  const baselineY = padTop + plotH;
  const coords = timelineData.map((pt, idx) => {
    const x = padX + (timelineData.length === 1 ? 0.5 : idx / denominator) * plotW;
    const targetOffset = (pt.val / maxVal) * plotH;
    // Graph elevates smoothly from baselineY up to peak
    const y = baselineY - targetOffset * chartRise;
    return { x, y, pt };
  });

  const todayCoord = coords.find((c) => c.pt.isToday) || coords[coords.length - 1];

  // Auto-center chart on today on mount & when zoom changes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (chartScrollRef.current) {
        const container = chartScrollRef.current;
        container.scrollTo({ left: container.scrollWidth, behavior: 'smooth' });
      }
    }, 120);
    return () => clearTimeout(timer);
  }, [chartZoom]);

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
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono tracking-wider text-[#d99b5a] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#d99b5a] animate-pulse" />
                {now.toLocaleDateString('pl-PL', { month: 'long' }).toLowerCase()} - {String(curDate).padStart(2, '0')}.{String(curMonth + 1).padStart(2, '0')}
              </span>
            </div>
            <h3 className="text-base font-light text-[#f5ede4] tracking-tight mt-0.5">
              Skumulowany przychód miesiąca JC Studio
            </h3>
          </div>

          <div className="flex items-center gap-2">
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

          <div
            onClick={onOpenPersonalView}
            className={`p-3.5 rounded-2xl bg-[#140f0c] border border-[#2e231c] transition-all ${
              onOpenPersonalView ? 'hover:border-[#3d2c20] cursor-pointer group' : ''
            }`}
            title="Koszty stałe wyliczane na podstawie kwot wpisanych w Moich Sprawach (Czynsz, Prąd, ZUS, itp.). Kliknij, aby przejść do edycji."
          >
            <div className="text-[11px] font-mono text-[#9e8f82] flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#e07a68]" />
                Koszty stałe (Stałe opłaty)
              </span>
              {onOpenPersonalView && (
                <span className="text-[10px] text-[#7a6b5e] group-hover:text-[#d99b5a] transition-colors">
                  Moje Sprawy →
                </span>
              )}
            </div>
            <div className="text-2xl sm:text-3xl font-light text-[#e07a68] tracking-tight mt-1 font-mono">
              {totalCosts.toLocaleString('pl-PL')} zł
            </div>
            <div className="text-[10px] text-[#7a6b5e] font-mono mt-0.5">
              {monthlyBillsTotal > 0
                ? `Wpisano ${filledBillsCount} ${filledBillsCount === 1 ? 'opłatę' : filledBillsCount < 5 ? 'opłaty' : 'opłat'} w Moich Sprawach`
                : 'Uzupełnij kwoty w Moich Sprawach'}
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

        {/* Interactive Dynamic SVG Line Chart (Scrollable & Zoomable on Mobile) */}
        <div className="pt-3 space-y-2 select-none">
          {/* Zoom Controls & Mobile Swipe Hint Bar */}
          <div className="flex items-center justify-between text-xs px-1">
            <div className="flex items-center gap-1.5 text-[#9e8f82] text-[11px] font-mono">
              <MoveHorizontal className="w-3.5 h-3.5 text-[#d99b5a] animate-pulse" />
              <span className="hidden sm:inline">Przesuwaj wykres w poziomie:</span>
              <span className="sm:hidden">Przesuń w poziomie:</span>
              <span className="text-[10px] text-[#7a6b5e] hidden xs:inline">
                (od 1 do {daysInMonth} {monthNamePolish.slice(0, 3)})
              </span>
            </div>

            <div className="flex items-center gap-1 bg-[#140f0c] border border-[#2e231c] px-2 py-0.5 rounded-full text-[11px] font-mono">
              <ZoomIn className="w-3 h-3 text-[#d99b5a]" />
              <span className="text-[#7a6b5e] text-[10px] mr-0.5 hidden xs:inline">Zoom:</span>
              {(['1x', '1.5x', '2x'] as const).map((z) => (
                <button
                  key={z}
                  onClick={() => setChartZoom(z)}
                  className={`px-2 py-0.5 rounded-full transition-all ${
                    chartZoom === z
                      ? 'bg-[#d99b5a]/25 text-[#f1c38e] font-semibold border border-[#d99b5a]/40 shadow-sm'
                      : 'text-[#7a6b5e] hover:text-[#f5ede4]'
                  }`}
                >
                  {z}
                </button>
              ))}
            </div>
          </div>

          {/* Horizontally Scrollable Chart Track */}
          <div
            ref={chartScrollRef}
            className="overflow-x-auto scrollbar-thin scrollbar-thumb-[#3d2f24] scrollbar-track-transparent rounded-2xl bg-[#140f0c]/50 border border-[#261d17] p-2.5 touch-pan-x"
          >
            <div
              className={`relative py-1 transition-all duration-200 ${
                chartZoom === '1x'
                  ? 'min-w-[740px] lg:min-w-full'
                  : chartZoom === '1.5x'
                  ? 'min-w-[1050px]'
                  : 'min-w-[1450px]'
              }`}
              style={{ height: '175px' }}
            >
              {/* Floating Tooltip */}
              {hoveredCoord && (
                <div
                  className="absolute pointer-events-none -top-2 z-30 px-3 py-1.5 rounded-xl bg-[#1e1713] text-[#f5ede4] text-xs border border-[#3d2f24] shadow-2xl transition-all font-mono whitespace-nowrap"
                  style={{
                    left: `${(hoveredCoord.x / svgWidth) * 100}%`,
                    transform: 'translateX(-50%)',
                  }}
                >
                  <div className="text-[10px] text-[#9e8f82]">
                    {hoveredCoord.pt.label}
                    {hoveredCoord.pt.isToday && ' • Dziś ✨'}
                  </div>
                  <div className="font-semibold text-[#f5ede4]">
                    Suma: {hoveredCoord.pt.val.toLocaleString('pl-PL')} zł
                  </div>
                  {hoveredCoord.pt.dailyVal > 0 && (
                    <div className="text-[10px] text-[#7ec29a] font-mono">
                      +{hoveredCoord.pt.dailyVal.toLocaleString('pl-PL')} zł w tym dniu
                    </div>
                  )}
                  {hoveredCoord.pt.tasks.length > 0 && (
                    <div className="text-[10px] text-[#d99b5a] truncate max-w-[220px]">
                      {hoveredCoord.pt.tasks.map((t) => t.title).join(', ')}
                    </div>
                  )}
                </div>
              )}

              <svg
                viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                className="w-full h-full overflow-visible cursor-crosshair"
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

                {/* Subtle studio glow behind main line */}
                <path
                  d={linePathD}
                  fill="none"
                  stroke="#d99b5a"
                  strokeWidth="5"
                  strokeOpacity="0.22"
                  className="blur-[2px]"
                />

                {/* Main Dynamic Line */}
                <path
                  d={linePathD}
                  fill="none"
                  stroke="#f5ede4"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
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
                        onTouchStart={() => setHoveredIndex(i)}
                        onClick={() => setHoveredIndex(i)}
                      />

                      {/* Hover dot indicator only (no static dots on peaks) */}
                      {isHovered && (
                        <circle
                          cx={c.x}
                          cy={c.y}
                          r={5}
                          className="fill-[#f5ede4] stroke-[#d99b5a] stroke-2 shadow-lg"
                        />
                      )}

                      {/* X-axis date labels */}
                      <text
                        x={c.x}
                        y={svgHeight - 6}
                        textAnchor="middle"
                        className={`text-[9px] font-mono transition-colors ${
                          isHovered
                            ? 'fill-[#f5ede4] font-bold'
                            : c.pt.isToday
                            ? 'fill-[#d99b5a] font-semibold'
                            : 'fill-[#7a6b5e]'
                        }`}
                      >
                        {c.pt.isToday
                          ? `Dziś (${c.pt.label})`
                          : chartZoom === '1x'
                          ? i % 2 === 0 || i === 0
                            ? c.pt.label
                            : ''
                          : c.pt.label}
                      </text>
                    </g>
                  );
                })}

                {/* Glowing beacon at the tip of the line (Today - end of chart) */}
                {todayCoord && (
                  <g className="pointer-events-none transition-all duration-300">
                    <circle
                      cx={todayCoord.x}
                      cy={todayCoord.y}
                      r={7}
                      className="fill-[#d99b5a]/30 animate-ping"
                    />
                    <circle
                      cx={todayCoord.x}
                      cy={todayCoord.y}
                      r={4}
                      className="fill-[#f5ede4] stroke-[#d99b5a] stroke-2 shadow-md"
                    />
                  </g>
                )}
              </svg>
            </div>
          </div>
        </div>

        {/* Card Footer */}
        <div className="pt-3 border-t border-[#2e231c] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-[#9e8f82]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#7ec29a]" />
            <span>
              {monthlyBillsTotal > 0
                ? `Koszty stałe z Moich Spraw: ${totalCosts.toLocaleString('pl-PL')} zł (${filledBillsCount} pozycji)`
                : `Domyślne koszty stałe: ${totalCosts.toLocaleString('pl-PL')} zł (ZUS + Podatek)`}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onOpenPersonalView || (() => setShowCostSettings(true))}
              className="text-[#d99b5a] hover:text-[#f1c38e] flex items-center gap-1 text-[11px] font-medium transition-colors"
            >
              <Settings2 className="w-3.5 h-3.5" />
              <span>Edytuj stałe opłaty</span>
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
          className={`cursor-pointer rounded-2xl p-4 transition-all duration-200 hover:-translate-y-1 active:scale-[0.98] border shadow-lg relative group stagger-1 ${
            statusFilter === 'in_progress'
              ? 'bg-[#2a1e16] border-[#d99b5a]/60 shadow-[#d99b5a]/10 ring-1 ring-[#d99b5a]/30'
              : 'glass-panel hover:border-[#3d2f24] hover:shadow-xl'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-[#d99b5a] font-medium mb-1">
            <span className="flex items-center gap-1.5 truncate">
              <Clock className="w-3.5 h-3.5 shrink-0 transition-transform group-hover:rotate-12 duration-200" />
              W toku
            </span>
            <span className="shrink-0 text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-[#d99b5a]/15 text-[#f1c38e] border border-[#d99b5a]/30 transition-transform group-hover:scale-105">
              {animInProgressCount}
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-light text-[#f5ede4] tracking-tight font-mono">
            {animInProgressValue.toLocaleString('pl-PL')} zł
          </div>
          <div className="mt-1 text-[11px] text-[#9e8f82] flex items-center justify-between">
            <span>W trakcie renderów</span>
            <span className="text-[10px] text-[#d99b5a] group-hover:underline transition-all">filtruj →</span>
          </div>
        </div>

        {/* Box 2: Gotowe */}
        <div
          onClick={() => onFilterChange(statusFilter === 'done' ? 'all' : 'done')}
          className={`cursor-pointer rounded-2xl p-4 transition-all duration-200 hover:-translate-y-1 active:scale-[0.98] border shadow-lg relative group stagger-2 ${
            statusFilter === 'done'
              ? 'bg-[#2a1e16] border-[#7ec29a]/60 shadow-[#7ec29a]/10 ring-1 ring-[#7ec29a]/30'
              : 'glass-panel hover:border-[#3d2f24] hover:shadow-xl'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-[#7ec29a] font-medium mb-1">
            <span className="flex items-center gap-1.5 truncate">
              <Layers className="w-3.5 h-3.5 shrink-0 transition-transform group-hover:rotate-12 duration-200" />
              Gotowe
            </span>
            <span className="shrink-0 text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-[#7ec29a]/15 text-[#9ee2b9] border border-[#7ec29a]/30 transition-transform group-hover:scale-105">
              {animDoneCount}
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-light text-[#f5ede4] tracking-tight font-mono">
            {animDoneValue.toLocaleString('pl-PL')} zł
          </div>
          <div className="mt-1 text-[11px] text-[#9e8f82] flex items-center justify-between">
            <span>Czeka na rozliczenie</span>
            <span className="text-[10px] text-[#7ec29a] group-hover:underline transition-all">filtruj →</span>
          </div>
        </div>

        {/* Box 3: Opłacone */}
        <div
          onClick={() => onFilterChange(statusFilter === 'paid' ? 'all' : 'paid')}
          className={`cursor-pointer rounded-2xl p-4 transition-all duration-200 hover:-translate-y-1 active:scale-[0.98] border shadow-lg relative group stagger-3 ${
            statusFilter === 'paid'
              ? 'bg-[#2a1e16] border-[#f5ede4]/60 shadow-black/30 ring-1 ring-[#f5ede4]/30'
              : 'glass-panel hover:border-[#3d2f24] hover:shadow-xl'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-[#f5ede4] font-medium mb-1">
            <span className="flex items-center gap-1.5 truncate">
              <DollarSign className="w-3.5 h-3.5 shrink-0 transition-transform group-hover:rotate-12 duration-200" />
              Opłacone
            </span>
            <span className="shrink-0 text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-[#f5ede4]/15 text-[#f5ede4] border border-[#f5ede4]/30 transition-transform group-hover:scale-105">
              {animPaidCount}
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-light text-[#f5ede4] tracking-tight font-mono">
            {animPaidValue.toLocaleString('pl-PL')} zł
          </div>
          <div className="mt-1 text-[11px] text-[#9e8f82] flex items-center justify-between">
            <span>Rzeczywisty przychód</span>
            <span className="text-[10px] text-[#f5ede4] group-hover:underline transition-all">filtruj →</span>
          </div>
        </div>

        {/* Box 4: Na czysto */}
        <div
          onClick={onOpenFinancesView}
          className="cursor-pointer glass-panel hover:border-[#3d2f24] hover:shadow-xl rounded-2xl p-4 transition-all duration-200 hover:-translate-y-1 active:scale-[0.98] border shadow-lg relative group flex flex-col justify-between stagger-4"
        >
          <div className="flex items-center justify-between text-xs font-medium mb-1">
            <span className={`flex items-center gap-1.5 truncate ${netProfit >= 0 ? 'text-[#7ec29a]' : 'text-[#e07a68]'}`}>
              <Wallet className="w-3.5 h-3.5 shrink-0 transition-transform group-hover:rotate-12 duration-200" />
              Zysk netto
            </span>
            <span className="shrink-0 text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-[#7ec29a]/15 text-[#9ee2b9] border border-[#7ec29a]/30" title="Łącznie zleceń w miesiącu">
              {animTotalCount}
            </span>
          </div>

          <div
            className={`text-xl sm:text-2xl font-semibold tracking-tight font-mono ${
              netProfit >= 0 ? 'text-[#7ec29a]' : 'text-[#e07a68]'
            }`}
          >
            {animNetProfit.toLocaleString('pl-PL')} zł
          </div>

          <div className="mt-1 text-[11px] text-[#9e8f82] flex items-center justify-between">
            <span>Koszty: {totalCosts} zł</span>
            <span className="text-[10px] text-[#d99b5a] group-hover:underline">panel →</span>
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
