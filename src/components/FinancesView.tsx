import React, { useState } from 'react';
import type { Task, MonthlyCosts } from '../types';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Building2,
  Receipt,
  Printer,
  ChevronLeft,
  ChevronRight,
  FileText
} from 'lucide-react';

interface FinancesViewProps {
  tasks: Task[];
  costs: MonthlyCosts;
  onSaveCosts: (costs: MonthlyCosts) => void;
}

const MONTH_NAMES = [
  'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
  'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'
];

export const FinancesView: React.FC<FinancesViewProps> = ({
  tasks,
  costs,
  onSaveCosts,
}) => {
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth()); // 0-indexed

  const [zusInput, setZusInput] = useState(costs.zus.toString());
  const [taxInput, setTaxInput] = useState(costs.tax.toString());
  const [isSavedNotice, setIsSavedNotice] = useState(false);

  // Month navigation
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  // Filter tasks belonging to selected month
  const ym = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
  const monthTasks = tasks.filter((t) => {
    const createdYm = t.createdAt ? t.createdAt.slice(0, 7) : '';
    const dueYm = t.dueDate ? t.dueDate.slice(0, 7) : '';
    const startYm = t.startDate ? t.startDate.slice(0, 7) : '';
    return createdYm === ym || dueYm === ym || startYm === ym;
  });

  // Calculate earnings
  const paidTasks = monthTasks.filter((t) => t.status === 'paid');
  const earnings = paidTasks.reduce((sum, t) => sum + (t.price || 0), 0);

  // Total potential value (all orders with price)
  const totalValue = monthTasks.reduce((sum, t) => sum + (t.price || 0), 0);
  const pendingValue = totalValue - earnings;

  const currentZus = Number(zusInput) || 0;
  const currentTax = Number(taxInput) || 0;
  const totalCosts = currentZus + currentTax;
  const netProfit = earnings - totalCosts;

  const handleSaveCosts = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveCosts({ zus: currentZus, tax: currentTax });
    setIsSavedNotice(true);
    setTimeout(() => setIsSavedNotice(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Month Navigator Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 p-5 rounded-3xl border border-slate-800 shadow-xl">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-400" />
            Finanse & Koszty — JC Studio
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Zarobki ze zleceń, koszty ZUS/podatków oraz dochód netto
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevMonth}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="px-4 py-2 rounded-xl bg-slate-950 font-bold text-sm text-indigo-300 border border-slate-800 min-w-[170px] text-center">
            {MONTH_NAMES[currentMonth]} {currentYear}
          </span>
          <button
            onClick={handleNextMonth}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          <button
            onClick={() => window.print()}
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium ml-2 transition-colors"
            title="Drukuj raport miesięczny"
          >
            <Printer className="w-4 h-4" />
            <span>Drukuj / PDF</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Zarobki (Opłacone) */}
        <div className="bg-slate-900/90 border border-emerald-500/20 rounded-2xl p-4 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-emerald-400 font-medium">
            <span>Zarobiono (Opłacone)</span>
            <TrendingUp className="w-4 h-4" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-white">
            {earnings.toLocaleString('pl-PL')} zł
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            {paidTasks.length} z {monthTasks.length} zleceń opłacone
          </div>
        </div>

        {/* W toku / Do opłacenia */}
        <div className="bg-slate-900/90 border border-indigo-500/20 rounded-2xl p-4 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-indigo-400 font-medium">
            <span>Oczekujące płatności</span>
            <FileText className="w-4 h-4" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-white">
            {pendingValue.toLocaleString('pl-PL')} zł
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            W toku lub do rozliczenia
          </div>
        </div>

        {/* Koszty miesięczne */}
        <div className="bg-slate-900/90 border border-rose-500/20 rounded-2xl p-4 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-rose-400 font-medium">
            <span>Koszty (ZUS + Podatek)</span>
            <TrendingDown className="w-4 h-4" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-white">
            {totalCosts.toLocaleString('pl-PL')} zł
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            ZUS: {currentZus} zł | Podatek: {currentTax} zł
          </div>
        </div>

        {/* Dochód na czysto */}
        <div className={`rounded-2xl p-4 shadow-lg flex flex-col justify-between border ${
          netProfit >= 0
            ? 'bg-emerald-950/30 border-emerald-500/30'
            : 'bg-rose-950/30 border-rose-500/30'
        }`}>
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className={netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
              Na czysto (Dochód)
            </span>
            <span className="text-lg">💰</span>
          </div>
          <div className={`mt-2 text-2xl font-black ${
            netProfit >= 0 ? 'text-emerald-300' : 'text-rose-400'
          }`}>
            {netProfit.toLocaleString('pl-PL')} zł
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            Po odliczeniu wszystkich kosztów
          </div>
        </div>
      </div>

      {/* Costs Configuration Form & Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Costs Input Box */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-xl md:col-span-1">
          <h3 className="font-bold text-white text-sm mb-1 flex items-center gap-2">
            <Receipt className="w-4 h-4 text-indigo-400" />
            Koszty w tym miesiącu
          </h3>
          <p className="text-xs text-slate-400 mb-4">
            Podaj stałe opłaty za ZUS i podatek
          </p>

          <form onSubmit={handleSaveCosts} className="space-y-3.5">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                ZUS (zł)
              </label>
              <input
                type="number"
                min="0"
                value={zusInput}
                onChange={(e) => setZusInput(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800/80 rounded-xl border border-slate-700 text-white text-sm focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1.5">
                <Receipt className="w-3.5 h-3.5 text-slate-400" />
                Podatek (zł)
              </label>
              <input
                type="number"
                min="0"
                value={taxInput}
                onChange={(e) => setTaxInput(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800/80 rounded-xl border border-slate-700 text-white text-sm focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 transition-all active:scale-95"
            >
              {isSavedNotice ? 'Zapisano pomyślnie ✓' : 'Zapisz koszty'}
            </button>
          </form>
        </div>

        {/* Month Orders Table */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-xl md:col-span-2">
          <h3 className="font-bold text-white text-sm mb-1 flex items-center justify-between">
            <span>Zlecenia w miesiącu: {MONTH_NAMES[currentMonth]} {currentYear}</span>
            <span className="text-xs text-slate-400 font-normal">
              Łączna wartość: <strong>{totalValue.toLocaleString('pl-PL')} zł</strong>
            </span>
          </h3>
          <p className="text-xs text-slate-400 mb-4">
            Lista wycenionych prac i ich status rozliczenia
          </p>

          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {monthTasks.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-500">
                Brak zarejestrowanych zleceń w wybranym miesiącu.
              </div>
            ) : (
              monthTasks.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-950/40 border border-slate-800/80 hover:border-slate-700 transition-colors text-xs"
                >
                  <div className="min-w-0 flex-1 pr-3">
                    <div className="font-semibold text-slate-200 truncate">{t.title}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {t.dueDate ? `Termin: ${t.dueDate}` : 'Bez terminu'}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${
                        t.status === 'paid'
                          ? 'bg-purple-500/10 text-purple-300 border-purple-500/30'
                          : t.status === 'done'
                          ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                          : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                      }`}
                    >
                      {t.status === 'paid' ? 'Opłacone ✓' : t.status === 'done' ? 'Gotowe' : 'W toku'}
                    </span>

                    <span className="font-mono font-bold text-white min-w-[70px] text-right">
                      {t.price !== undefined ? `${t.price.toLocaleString('pl-PL')} zł` : '—'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
