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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 rounded-3xl border border-[#2b211a] shadow-2xl">
        <div>
          <h2 className="text-xl font-light text-[#f5ede4] flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-[#7ec29a]" />
            Finanse & Koszty — JC Studio
          </h2>
          <p className="text-xs text-[#9e8f82] mt-0.5 font-light">
            Zarobki ze zleceń, koszty ZUS/podatków oraz dochód netto
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevMonth}
            className="p-2 rounded-xl text-[#9e8f82] hover:text-[#f5ede4] hover:bg-[#251b14] transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="px-5 py-2 rounded-full bg-[#1a1410] font-mono font-medium text-xs text-[#f5ede4] border border-[#2e231c] min-w-[170px] text-center shadow-inner">
            {MONTH_NAMES[currentMonth]} {currentYear}
          </span>
          <button
            onClick={handleNextMonth}
            className="p-2 rounded-xl text-[#9e8f82] hover:text-[#f5ede4] hover:bg-[#251b14] transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          <button
            onClick={() => window.print()}
            className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#251b14] hover:bg-[#322319] text-[#9e8f82] hover:text-[#f5ede4] border border-[#382b20] text-xs font-medium ml-2 transition-colors"
            title="Drukuj raport miesięczny"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Drukuj / PDF</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Zarobki (Opłacone) */}
        <div className="glass-panel border border-[#7ec29a]/30 rounded-3xl p-5 shadow-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-[#7ec29a] font-medium">
            <span>Zarobiono (Opłacone)</span>
            <TrendingUp className="w-4 h-4" />
          </div>
          <div className="mt-3 text-2xl sm:text-3xl font-light text-[#f5ede4] font-mono">
            {earnings.toLocaleString('pl-PL')} zł
          </div>
          <div className="mt-1 text-[11px] text-[#9e8f82]">
            {paidTasks.length} z {monthTasks.length} zleceń opłacone
          </div>
        </div>

        {/* W toku / Do opłacenia */}
        <div className="glass-panel border border-[#d99b5a]/30 rounded-3xl p-5 shadow-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-[#d99b5a] font-medium">
            <span>Oczekujące płatności</span>
            <FileText className="w-4 h-4" />
          </div>
          <div className="mt-3 text-2xl sm:text-3xl font-light text-[#f5ede4] font-mono">
            {pendingValue.toLocaleString('pl-PL')} zł
          </div>
          <div className="mt-1 text-[11px] text-[#9e8f82]">
            W toku lub do rozliczenia
          </div>
        </div>

        {/* Koszty miesięczne */}
        <div className="glass-panel border border-[#e07a68]/30 rounded-3xl p-5 shadow-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-[#e07a68] font-medium">
            <span>Koszty (ZUS + Podatek)</span>
            <TrendingDown className="w-4 h-4" />
          </div>
          <div className="mt-3 text-2xl sm:text-3xl font-light text-[#e07a68] font-mono">
            {totalCosts.toLocaleString('pl-PL')} zł
          </div>
          <div className="mt-1 text-[11px] text-[#9e8f82]">
            ZUS: {currentZus} zł | Podatek: {currentTax} zł
          </div>
        </div>

        {/* Dochód na czysto */}
        <div className="glass-panel rounded-3xl p-5 shadow-2xl flex flex-col justify-between border border-[#2b211a]">
          <div className="flex items-center justify-between text-xs font-medium">
            <span className={netProfit >= 0 ? 'text-[#7ec29a]' : 'text-[#e07a68]'}>
              Na czysto (Zysk)
            </span>
            <span className="text-base">💰</span>
          </div>
          <div className={`mt-3 text-2xl sm:text-3xl font-semibold font-mono ${
            netProfit >= 0 ? 'text-[#7ec29a]' : 'text-[#e07a68]'
          }`}>
            {netProfit.toLocaleString('pl-PL')} zł
          </div>
          <div className="mt-1 text-[11px] text-[#9e8f82]">
            Po odliczeniu wszystkich kosztów
          </div>
        </div>
      </div>

      {/* Costs Configuration Form & Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Costs Input Box */}
        <div className="glass-panel border border-[#2b211a] rounded-3xl p-6 shadow-2xl md:col-span-1">
          <h3 className="font-medium text-[#f5ede4] text-sm mb-1 flex items-center gap-2">
            <Receipt className="w-4 h-4 text-[#d99b5a]" />
            Koszty w tym miesiącu
          </h3>
          <p className="text-xs text-[#9e8f82] mb-4 font-light">
            Podaj stałe opłaty za ZUS i podatek
          </p>

          <form onSubmit={handleSaveCosts} className="space-y-4">
            <div>
              <label className="block text-xs font-mono uppercase text-[#9e8f82] mb-1 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-[#7a6b5e]" />
                ZUS (zł)
              </label>
              <input
                type="number"
                min="0"
                value={zusInput}
                onChange={(e) => setZusInput(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl glass-input text-sm font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-[#9e8f82] mb-1 flex items-center gap-1.5">
                <Receipt className="w-3.5 h-3.5 text-[#7a6b5e]" />
                Podatek (zł)
              </label>
              <input
                type="number"
                min="0"
                value={taxInput}
                onChange={(e) => setTaxInput(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl glass-input text-sm font-mono"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-full bg-[#f5ede4] hover:bg-white text-[#120e0a] text-xs font-semibold shadow-md transition-all active:scale-95"
            >
              {isSavedNotice ? 'Zapisano pomyślnie ✓' : 'Zapisz koszty'}
            </button>
          </form>
        </div>

        {/* Month Orders Table */}
        <div className="glass-panel border border-[#2b211a] rounded-3xl p-6 shadow-2xl md:col-span-2">
          <h3 className="font-medium text-[#f5ede4] text-sm mb-1 flex items-center justify-between">
            <span>Zlecenia w miesiącu: {MONTH_NAMES[currentMonth]} {currentYear}</span>
            <span className="text-xs text-[#9e8f82] font-light">
              Łączna wartość: <strong className="text-[#f5ede4] font-mono">{totalValue.toLocaleString('pl-PL')} zł</strong>
            </span>
          </h3>
          <p className="text-xs text-[#9e8f82] mb-4 font-light">
            Lista zleceń powiązanych z tym okresem rozliczeniowym
          </p>

          <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
            {monthTasks.length === 0 ? (
              <div className="h-32 flex flex-col items-center justify-center border border-dashed border-[#2e231c] rounded-2xl text-xs text-[#7a6b5e] text-center p-3">
                Brak zleceń w wybranym miesiącu
              </div>
            ) : (
              monthTasks.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-[#140f0c]/60 border border-[#251b14] hover:border-[#382b20] transition-colors"
                >
                  <div>
                    <span className="text-sm font-medium text-[#f5ede4] block">
                      {t.title}
                    </span>
                    <span className="text-[11px] text-[#9e8f82]">
                      Termin: {t.dueDate || 'brak'} • Status: {t.status === 'paid' ? 'Opłacone' : t.status === 'done' ? 'Gotowe' : 'W toku'}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-mono font-medium text-[#f5ede4] block">
                      {t.price ? `${t.price.toLocaleString('pl-PL')} zł` : '—'}
                    </span>
                    <span className={`text-[10px] font-mono uppercase ${t.status === 'paid' ? 'text-[#7ec29a]' : 'text-[#d99b5a]'}`}>
                      {t.status === 'paid' ? 'Opłacone' : 'Oczekuje'}
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
