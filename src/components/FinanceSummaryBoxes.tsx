import React, { useState } from 'react';
import type { Task, MonthlyCosts } from '../types';
import {
  Clock,
  CheckCircle2,
  DollarSign,
  Wallet,
  ArrowUpRight,
  Settings2,
  TrendingUp,
  CreditCard,
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

  return (
    <div className="mb-6 space-y-4">
      {/* Top 2 Featured Glass Cards (Kindra "Studio balance" & "Cash flow" layout) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Studio Balance Card (4 cols) */}
        <div className="lg:col-span-5 glass-panel rounded-3xl p-6 flex flex-col justify-between space-y-5 shadow-2xl hover:border-[#3d2f24] transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono tracking-wider uppercase text-[#9e8f82]">
              Studio balance
            </span>
            <CreditCard className="w-4 h-4 text-[#9e8f82]" />
          </div>

          <div>
            <div className="text-3xl sm:text-4xl font-light text-[#f5ede4] tracking-tight">
              {paidValue.toLocaleString('pl-PL')} zł
            </div>
            <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#251b14] border border-[#382b20] text-[11px] text-[#9e8f82]">
              <span className="text-[#7ec29a] font-medium">+100%</span>
              <span>rzeczywisty wpływ na konto</span>
            </div>
          </div>

          {/* Smooth Warm Sparkline SVG curve */}
          <div className="py-2">
            <svg viewBox="0 0 300 60" className="w-full h-12 stroke-[#f5ede4] fill-none" strokeWidth="2.5" strokeLinecap="round">
              <path d="M 0,45 Q 40,50 80,35 T 160,25 T 240,15 T 300,8" />
              <circle cx="300" cy="8" r="3.5" className="fill-[#f5ede4]" />
            </svg>
          </div>

          <div className="pt-2 border-t border-[#2e231c] flex items-center justify-between text-xs text-[#9e8f82]">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#7ec29a]" />
              <span className="font-mono text-[11px]">Konto firmowe ••• JC Studio</span>
            </div>
            <button
              onClick={onOpenFinancesView}
              className="text-[#f5ede4] hover:text-[#d99b5a] flex items-center gap-0.5 text-[11px] font-medium transition-colors"
            >
              <span>Szczegóły</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Cash Flow & Summary Card (7 cols) */}
        <div className="lg:col-span-7 glass-panel rounded-3xl p-6 flex flex-col justify-between space-y-5 shadow-2xl hover:border-[#3d2f24] transition-all">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-xs font-mono tracking-wider uppercase text-[#9e8f82]">
              Cash flow & Rozliczenia
            </span>
            <div className="flex items-center gap-1 bg-[#1a1410] border border-[#2e231c] p-0.5 rounded-full text-[11px]">
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

          <div className="grid grid-cols-3 gap-4 pt-1">
            <div>
              <div className="text-[11px] font-mono text-[#9e8f82] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#f5ede4]" />
                Przychód (Wpływy)
              </div>
              <div className="text-xl sm:text-2xl font-light text-[#f5ede4] tracking-tight mt-1 font-mono">
                {paidValue.toLocaleString('pl-PL')} zł
              </div>
            </div>

            <div>
              <div className="text-[11px] font-mono text-[#9e8f82] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#e07a68]" />
                Koszty (ZUS + Podatek)
              </div>
              <div className="text-xl sm:text-2xl font-light text-[#e07a68] tracking-tight mt-1 font-mono">
                {totalCosts.toLocaleString('pl-PL')} zł
              </div>
            </div>

            <div>
              <div className="text-[11px] font-mono text-[#9e8f82] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#7ec29a]" />
                Net (Na czysto)
              </div>
              <div className="text-xl sm:text-2xl font-semibold text-[#7ec29a] tracking-tight mt-1 font-mono">
                {netProfit >= 0 ? `+${netProfit.toLocaleString('pl-PL')}` : netProfit.toLocaleString('pl-PL')} zł
              </div>
            </div>
          </div>

          {/* Cashflow Wave SVG chart */}
          <div className="py-2">
            <svg viewBox="0 0 450 70" className="w-full h-14 fill-none stroke-linecap-round" strokeWidth="2">
              <path
                d="M 0,55 L 45,45 L 90,60 L 135,35 L 180,50 L 225,25 L 270,40 L 315,10 L 360,50 L 405,25 L 450,30"
                className="stroke-[#f5ede4]/90"
              />
              <path
                d="M 0,65 L 45,60 L 90,55 L 135,62 L 180,58 L 225,50 L 270,55 L 315,48 L 360,52 L 405,45 L 450,42"
                className="stroke-[#7a6b5e]/70"
              />
            </svg>
          </div>

          <div className="pt-2 border-t border-[#2e231c] flex items-center justify-between text-xs text-[#9e8f82]">
            <span>Koszty stałe: ZUS {costs.zus} zł • Podatek {costs.tax} zł</span>
            <button
              onClick={() => setShowCostSettings(true)}
              className="text-[#d99b5a] hover:text-[#f1c38e] flex items-center gap-1 text-[11px] transition-colors"
            >
              <Settings2 className="w-3.5 h-3.5" />
              <span>Edytuj koszty</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Interactive Filter Pills Bar */}
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
            <span>Oczekuje na ukończenie</span>
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
              <CheckCircle2 className="w-3.5 h-3.5" />
              Gotowe
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#7ec29a]/15 text-[#9ee2b9] border border-[#7ec29a]/30">
              {doneTasks.length} {doneTasks.length === 1 ? 'zlecenie' : 'zleceń'}
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-light text-[#f5ede4] tracking-tight font-mono">
            {doneValue.toLocaleString('pl-PL')} zł
          </div>
          <div className="mt-1 text-[11px] text-[#9e8f82] flex items-center justify-between">
            <span>Do rozliczenia</span>
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
