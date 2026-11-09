import React, { useState, useEffect } from 'react';
import type { Task, MonthlyCosts, MonthlyReport } from '../types';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Building2,
  Receipt,
  ChevronLeft,
  ChevronRight,
  FileText,
  Sparkles,
  FileCheck2,
  Trash2,
  Eye
} from 'lucide-react';
import {
  generateMonthlyReport,
  getStoredMonthlyReports,
  saveMonthlyReport,
  deleteMonthlyReport,
  POLISH_MONTH_NAMES
} from '../lib/monthlyReport';
import { MonthlyReportModal } from './MonthlyReportModal';

interface FinancesViewProps {
  tasks: Task[];
  costs: MonthlyCosts;
  onSaveCosts: (costs: MonthlyCosts) => void;
}

export const FinancesView: React.FC<FinancesViewProps> = ({
  tasks,
  costs,
  onSaveCosts,
}) => {
  const now = new Date();
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(now.getMonth()); // 0-indexed

  const [zusInput, setZusInput] = useState(costs.zus.toString());
  const [taxInput, setTaxInput] = useState(costs.tax.toString());
  const [isSavedNotice, setIsSavedNotice] = useState(false);

  // Monthly Reports Archive State
  const [reports, setReports] = useState<MonthlyReport[]>(() => getStoredMonthlyReports());
  const [activeReport, setActiveReport] = useState<MonthlyReport | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  useEffect(() => {
    setReports(getStoredMonthlyReports());
  }, []);

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const nextScheduledDateStr = `${daysInMonth}.${String(currentMonth + 1).padStart(2, '0')}.${currentYear} o 23:50`;

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

  const handleJumpToCurrent = () => {
    setCurrentYear(now.getFullYear());
    setCurrentMonth(now.getMonth());
  };

  const isCurrentMonth = currentYear === now.getFullYear() && currentMonth === now.getMonth();

  // Filter tasks belonging to selected month (from 1st to last day)
  const ym = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
  const monthTasks = tasks.filter((t) => {
    const createdYm = t.createdAt ? t.createdAt.slice(0, 7) : '';
    const dueYm = t.dueDate ? t.dueDate.slice(0, 7) : '';
    const startYm = t.startDate ? t.startDate.slice(0, 7) : '';
    const compYm = t.completedAt ? t.completedAt.slice(0, 7) : '';
    return createdYm === ym || dueYm === ym || startYm === ym || compYm === ym;
  });

  // Calculate earnings
  const paidTasks = monthTasks.filter((t) => t.status === 'paid');
  const earnings = paidTasks.reduce((sum, t) => sum + (Number(t.price) || 0), 0);

  // Total potential value (all orders with price)
  const totalValue = monthTasks.reduce((sum, t) => sum + (Number(t.price) || 0), 0);
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

  // Generate / Preview report for selected month
  const handleGeneratePreviewReport = () => {
    const report = generateMonthlyReport(
      currentYear,
      currentMonth + 1,
      tasks,
      { zus: currentZus, tax: currentTax },
      false
    );
    const updated = saveMonthlyReport(report);
    setReports(updated);
    setActiveReport(report);
    setIsReportModalOpen(true);
  };

  const handleOpenReport = (rep: MonthlyReport) => {
    setActiveReport(rep);
    setIsReportModalOpen(true);
  };

  const handleDeleteReport = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Czy na pewno chcesz usunąć ten zarchiwizowany raport?')) {
      const updated = deleteMonthlyReport(id);
      setReports(updated);
    }
  };

  return (
    <div className="space-y-6">
      {/* Month Navigator Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 rounded-3xl border border-[#2b211a] shadow-2xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#7ec29a] flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#7ec29a] animate-pulse" />
              Rozliczenie miesięczne (1 – {daysInMonth} {POLISH_MONTH_NAMES[currentMonth].slice(0, 3)})
            </span>
          </div>
          <h2 className="text-xl font-light text-[#f5ede4] flex items-center gap-2 mt-0.5">
            <DollarSign className="w-5 h-5 text-[#7ec29a]" />
            Finanse & Koszty — JC Studio
          </h2>
          <p className="text-xs text-[#9e8f82] mt-0.5 font-light">
            Zarobki ze zleceń, koszty ZUS/podatków oraz dochód netto w wybranym miesiącu
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevMonth}
            className="p-2 rounded-xl text-[#9e8f82] hover:text-[#f5ede4] hover:bg-[#251b14] transition-colors"
            title="Poprzedni miesiąc"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="px-5 py-2 rounded-full bg-[#1a1410] font-mono font-medium text-xs text-[#f5ede4] border border-[#2e231c] min-w-[170px] text-center shadow-inner">
            {POLISH_MONTH_NAMES[currentMonth]} {currentYear}
          </span>
          <button
            onClick={handleNextMonth}
            className="p-2 rounded-xl text-[#9e8f82] hover:text-[#f5ede4] hover:bg-[#251b14] transition-colors"
            title="Następny miesiąc"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {!isCurrentMonth && (
            <button
              onClick={handleJumpToCurrent}
              className="text-xs text-[#d99b5a] hover:text-[#f1c38e] px-3.5 py-2 rounded-full border border-[#d99b5a]/30 bg-[#d99b5a]/10 ml-1 transition-colors font-medium"
            >
              Bieżący miesiąc
            </button>
          )}

          <button
            onClick={handleGeneratePreviewReport}
            className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#d99b5a]/15 hover:bg-[#d99b5a]/25 text-[#f1c38e] border border-[#d99b5a]/30 text-xs font-medium ml-2 transition-all active:scale-95"
            title="Generuj raport za ten miesiąc"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#d99b5a]" />
            <span>Raport miesięczny</span>
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
            {netProfit >= 0 ? '+' : ''}
            {netProfit.toLocaleString('pl-PL')} zł
          </div>
          <div className="mt-1 text-[11px] text-[#9e8f82]">
            Po odliczeniu wszystkich kosztów
          </div>
        </div>
      </div>

      {/* Automatic Monthly Reports Section (23:50 scheduler) */}
      <div className="glass-panel border border-[#382b20] rounded-3xl p-6 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#2e231c]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-[#d99b5a]/15 border border-[#d99b5a]/30 flex items-center justify-center text-[#d99b5a]">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-[#f5ede4] flex items-center gap-2">
                Automatyczne Raporty Miesięczne
                <span className="px-2 py-0.5 rounded-full bg-[#7ec29a]/15 text-[#9ee2b9] border border-[#7ec29a]/30 text-[10px] font-mono">
                  Harmonogram 23:50
                </span>
              </h3>
              <p className="text-xs text-[#9e8f82] font-light mt-0.5">
                Raport generuje się automatycznie w ostatni dzień miesiąca o godz. 23:50
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-[#9e8f82] font-mono hidden md:inline">
              Najbliższy automatyczny raport: <strong className="text-[#d99b5a]">{nextScheduledDateStr}</strong>
            </span>
            <button
              onClick={handleGeneratePreviewReport}
              className="px-4 py-2 rounded-full bg-[#f5ede4] hover:bg-white text-[#120e0a] text-xs font-semibold shadow-md transition-all active:scale-95 flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#d99b5a]" />
              <span>Generuj raport za ten miesiąc (Podgląd)</span>
            </button>
          </div>
        </div>

        {/* Reports Archive List */}
        <div className="space-y-2">
          {reports.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#7a6b5e] border border-dashed border-[#2e231c] rounded-2xl">
              Brak wygenerowanych raportów. Kliknij powyższy przycisk, aby wygenerować raport za bieżący miesiąc lub poczekaj na automatyczne wygenerowanie na koniec miesiąca o 23:50.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {reports.map((rep) => (
                <div
                  key={rep.id}
                  onClick={() => handleOpenReport(rep)}
                  className="p-4 rounded-2xl bg-[#140f0c] border border-[#2e231c] hover:border-[#d99b5a]/40 transition-all cursor-pointer group flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-[#f5ede4] group-hover:text-[#f1c38e] transition-colors">
                          {rep.monthName}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-[#251b14] text-[10px] font-mono text-[#9e8f82] border border-[#382b20]">
                          {rep.period}
                        </span>
                      </div>
                      <span className="text-[10px] text-[#7a6b5e] font-mono mt-0.5 block">
                        {rep.isAutoGenerated ? '⏱️ Automatyczny (23:50)' : '✨ Podgląd na żądanie'} • {new Date(rep.generatedAt).toLocaleDateString('pl-PL')}
                      </span>
                    </div>

                    <button
                      onClick={(e) => handleDeleteReport(rep.id, e)}
                      className="p-1.5 rounded-lg text-[#6d5e53] hover:text-[#e07a68] hover:bg-[#251b14] transition-colors opacity-0 group-hover:opacity-100"
                      title="Usuń raport z archiwum"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="mt-3 pt-3 border-t border-[#221813] flex items-center justify-between text-xs font-mono">
                    <div>
                      <span className="text-[10px] text-[#9e8f82] block">Przychód</span>
                      <span className="text-[#7ec29a] font-medium">
                        {rep.financials.paidRevenue.toLocaleString('pl-PL')} zł
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#9e8f82] block">Koszty</span>
                      <span className="text-[#e07a68]">
                        {rep.financials.totalCosts.toLocaleString('pl-PL')} zł
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#9e8f82] block">Zysk netto</span>
                      <span className={`font-semibold ${rep.financials.netProfit >= 0 ? 'text-[#7ec29a]' : 'text-[#e07a68]'}`}>
                        {rep.financials.netProfit >= 0 ? '+' : ''}{rep.financials.netProfit.toLocaleString('pl-PL')} zł
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-[#d99b5a] group-hover:underline flex items-center gap-1">
                        <Eye className="w-3 h-3" /> Zobacz →
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
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
            <span>Zlecenia w miesiącu: {POLISH_MONTH_NAMES[currentMonth]} {currentYear}</span>
            <span className="text-xs text-[#9e8f82] font-light">
              Łączna wartość: <strong className="text-[#f5ede4] font-mono">{totalValue.toLocaleString('pl-PL')} zł</strong>
            </span>
          </h3>
          <p className="text-xs text-[#9e8f82] mb-4 font-light">
            Lista zleceń powiązanych z tym okresem rozliczeniowym (1 – {daysInMonth} {POLISH_MONTH_NAMES[currentMonth].slice(0, 3)})
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

      {/* Monthly Report Full Details & Print Modal */}
      <MonthlyReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        report={activeReport}
      />
    </div>
  );
};
