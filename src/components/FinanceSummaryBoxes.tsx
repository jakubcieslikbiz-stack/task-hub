import React, { useState } from 'react';
import type { Task, MonthlyCosts } from '../types';
import { Clock, CheckCircle2, DollarSign, Wallet, ArrowUpRight, Settings2 } from 'lucide-react';

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
    <div className="mb-6 space-y-3">
      {/* 4 Interactive KPI Stat Boxes */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Box 1: W toku */}
        <div
          onClick={() => onFilterChange(statusFilter === 'in_progress' ? 'all' : 'in_progress')}
          className={`cursor-pointer rounded-2xl p-4 transition-all duration-200 border shadow-lg relative group ${
            statusFilter === 'in_progress'
              ? 'bg-amber-500/15 border-amber-500/50 shadow-amber-500/10 scale-[1.02]'
              : 'bg-slate-900/80 border-slate-800 hover:border-amber-500/30 hover:bg-slate-800/60'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-amber-400 font-semibold mb-1">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              W toku
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20">
              {inProgressTasks.length} {inProgressTasks.length === 1 ? 'zlecenie' : 'zleceń'}
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-white tracking-tight font-mono">
            {inProgressValue.toLocaleString('pl-PL')} zł
          </div>
          <div className="mt-1 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Oczekuje na ukończenie</span>
            <span className="text-[10px] text-amber-400/80 group-hover:underline">filtruj →</span>
          </div>
        </div>

        {/* Box 2: Gotowe */}
        <div
          onClick={() => onFilterChange(statusFilter === 'done' ? 'all' : 'done')}
          className={`cursor-pointer rounded-2xl p-4 transition-all duration-200 border shadow-lg relative group ${
            statusFilter === 'done'
              ? 'bg-emerald-500/15 border-emerald-500/50 shadow-emerald-500/10 scale-[1.02]'
              : 'bg-slate-900/80 border-slate-800 hover:border-emerald-500/30 hover:bg-slate-800/60'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-emerald-400 font-semibold mb-1">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Gotowe
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              {doneTasks.length} {doneTasks.length === 1 ? 'zlecenie' : 'zleceń'}
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-white tracking-tight font-mono">
            {doneValue.toLocaleString('pl-PL')} zł
          </div>
          <div className="mt-1 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Gotowe do rozliczenia</span>
            <span className="text-[10px] text-emerald-400/80 group-hover:underline">filtruj →</span>
          </div>
        </div>

        {/* Box 3: Opłacone */}
        <div
          onClick={() => onFilterChange(statusFilter === 'paid' ? 'all' : 'paid')}
          className={`cursor-pointer rounded-2xl p-4 transition-all duration-200 border shadow-lg relative group ${
            statusFilter === 'paid'
              ? 'bg-purple-500/15 border-purple-500/50 shadow-purple-500/10 scale-[1.02]'
              : 'bg-slate-900/80 border-slate-800 hover:border-purple-500/30 hover:bg-slate-800/60'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-purple-300 font-semibold mb-1">
            <span className="flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-purple-400" />
              Opłacone
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300">
              {paidTasks.length} {paidTasks.length === 1 ? 'zlecenie' : 'zleceń'}
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-purple-200 tracking-tight font-mono">
            {paidValue.toLocaleString('pl-PL')} zł
          </div>
          <div className="mt-1 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Rzeczywisty przychód</span>
            <span className="text-[10px] text-purple-400/80 group-hover:underline">filtruj →</span>
          </div>
        </div>

        {/* Box 4: Panel Finansowy - Na czysto */}
        <div
          className={`rounded-2xl p-4 transition-all duration-200 border shadow-lg relative flex flex-col justify-between ${
            netProfit >= 0
              ? 'bg-gradient-to-br from-emerald-950/30 to-slate-900/80 border-emerald-500/30'
              : 'bg-gradient-to-br from-rose-950/30 to-slate-900/80 border-rose-500/30'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold mb-1">
            <span className={`flex items-center gap-1.5 ${netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              <Wallet className="w-3.5 h-3.5" />
              Na czysto (Zysk)
            </span>
            <button
              onClick={() => setShowCostSettings(true)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Zmień koszty ZUS / Podatek"
            >
              <Settings2 className="w-3.5 h-3.5" />
            </button>
          </div>

          <div
            className={`text-xl sm:text-2xl font-black tracking-tight font-mono ${
              netProfit >= 0 ? 'text-emerald-300' : 'text-rose-400'
            }`}
          >
            {netProfit.toLocaleString('pl-PL')} zł
          </div>

          <div className="mt-1 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Koszty: {totalCosts.toLocaleString('pl-PL')} zł</span>
            <button
              onClick={onOpenFinancesView}
              className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-0.5 font-medium"
            >
              <span>Pełny panel</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Quick Costs Settings Modal */}
      {showCostSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl">
            <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-indigo-400" />
              Ustawienia kosztów miesięcznych
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Wprowadź stałe opłaty za ZUS i podatek, aby na bieżąco widzieć zysk na czysto.
            </p>

            <form onSubmit={handleSaveCosts} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  ZUS (zł)
                </label>
                <input
                  type="number"
                  min="0"
                  value={tempZus}
                  onChange={(e) => setTempZus(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 rounded-xl border border-slate-700 text-white font-mono text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Podatek (zł)
                </label>
                <input
                  type="number"
                  min="0"
                  value={tempTax}
                  onChange={(e) => setTempTax(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 rounded-xl border border-slate-700 text-white font-mono text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCostSettings(false)}
                  className="px-3 py-1.5 rounded-xl text-slate-400 hover:text-white text-xs"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20"
                >
                  Zapisz
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
