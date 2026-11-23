import React, { useState, useMemo } from 'react';
import type { MortgageConfig, MortgagePaymentRecord } from '../types';
import {
  getStoredMortgageConfig,
  saveStoredMortgageConfig,
  getStoredMortgagePayments,
  saveStoredMortgagePayments,
  getNextMortgagePaymentDate,
  calculateTotalOverpayment,
  calculateOverpaymentInMonth,
  calculateRequiredOverpaymentForTargetDate,
} from '../lib/mortgage';
import {
  Landmark,
  Target,
  Plus,
  Trash2,
  CheckCircle2,
  Copy,
  Check,
  Settings,
  X,
  Sparkles,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  Percent,
  CalendarDays,
} from 'lucide-react';

const POLISH_MONTHS = [
  'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
  'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'
];

export const MortgageView: React.FC = () => {
  const [config, setConfig] = useState<MortgageConfig>(() => getStoredMortgageConfig());
  const [payments, setPayments] = useState<MortgagePaymentRecord[]>(() => getStoredMortgagePayments());

  // Zwijane sekcje szczegółowe
  const [showComparison, setShowComparison] = useState(false);
  const [showHistory, setShowHistory] = useState(true);

  // Modal: Zarejestruj wpłatę / nadpłatę
  const [isAddPaymentOpen, setIsAddPaymentOpen] = useState(false);
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [paymentRegular, setPaymentRegular] = useState(String(config.regularInstallment));
  const [paymentOverpayment, setPaymentOverpayment] = useState('4645');
  const [paymentNotes, setPaymentNotes] = useState('');

  // Modal: Edycja parametrów kredytu
  const [isEditConfigOpen, setIsEditConfigOpen] = useState(false);
  const [tempConfig, setTempConfig] = useState<MortgageConfig>(config);

  // Docelowy termin spłaty wprowadzany przez użytkownika
  const [customTargetYear, setCustomTargetYear] = useState<number>(() => {
    if (config.targetPayoffDate) {
      const y = parseInt(config.targetPayoffDate.split('-')[0], 10);
      if (!isNaN(y)) return y;
    }
    return 2033;
  });
  const [customTargetMonth, setCustomTargetMonth] = useState<number>(() => {
    if (config.targetPayoffDate) {
      const m = parseInt(config.targetPayoffDate.split('-')[1], 10);
      if (!isNaN(m)) return m;
    }
    return 10;
  });

  // Kopiowanie numeru konta & Toast
  const [copiedAccount, setCopiedAccount] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Najbliższa data pobrania raty kredytu
  const nextPaymentInfo = useMemo(() => {
    return getNextMortgagePaymentDate();
  }, []);

  // Aktualny miesiąc YYYY-MM
  const now = new Date();
  const currentYm = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const currentMonthName = POLISH_MONTHS[now.getMonth()];
  const nextMonthIndex = (now.getMonth() + 1) % 12;
  const nextMonthYear = now.getMonth() === 11 ? now.getFullYear() + 1 : now.getFullYear();
  const nextMonthName = `${POLISH_MONTHS[nextMonthIndex]} ${nextMonthYear}`;

  // Kluczowe obliczenia dla wybranego terminu
  const sim = useMemo(() => {
    return calculateRequiredOverpaymentForTargetDate({
      currentBalance: config.currentRemainingCapital || 568843.28,
      annualInterestRate: config.interestRate,
      regularInstallment: config.regularInstallment,
      targetYear: customTargetYear,
      targetMonth: customTargetMonth,
      fromYear: now.getFullYear(),
      fromMonth: now.getMonth() + 1,
      alreadyPaidInterest: 32833.09,
      originalLoanAmount: config.originalAmount,
      originalTermMonths: config.loanTermMonths || 360,
    });
  }, [config, customTargetYear, customTargetMonth]);

  // Statystyki wpłat z bieżącego miesiąca
  const overpaymentThisMonth = useMemo(() => {
    return calculateOverpaymentInMonth(payments, currentYm);
  }, [payments, currentYm]);

  const totalOverpaid = useMemo(() => {
    return calculateTotalOverpayment(payments);
  }, [payments]);

  // Wymagana nadpłata miesięczna do trzymania się terminu
  const requiredMonthlyOverpayment = Math.round(sim.requiredMonthlyOverpayment);

  // Analiza kolejnego miesiąca (uwzględnienie nadwyżki lub zaległości z tego miesiąca)
  const currentMonthDiff = overpaymentThisMonth - requiredMonthlyOverpayment;
  const hasSurplus = currentMonthDiff > 0;
  const hasGap = currentMonthDiff < 0 && overpaymentThisMonth > 0;

  // Zalecenia kwotowe na kolejny miesiąc:
  const nextOverpaymentStandard = requiredMonthlyOverpayment;
  const nextOverpaymentMin = hasSurplus ? Math.max(0, requiredMonthlyOverpayment - currentMonthDiff) : requiredMonthlyOverpayment + Math.abs(currentMonthDiff);
  const nextTotalStandard = config.regularInstallment + nextOverpaymentStandard;
  const nextTotalMin = config.regularInstallment + nextOverpaymentMin;

  // Szybki wybór terminu (np. 5, 7, 10, 15 lat)
  const handleSetQuickTerm = (years: number) => {
    const targetDate = new Date(now.getFullYear() + years, now.getMonth(), 1);
    setCustomTargetYear(targetDate.getFullYear());
    setCustomTargetMonth(targetDate.getMonth() + 1);
  };

  const isQuickSelected = (years: number) => {
    const targetDate = new Date(now.getFullYear() + years, now.getMonth(), 1);
    return customTargetYear === targetDate.getFullYear() && customTargetMonth === targetDate.getMonth() + 1;
  };

  // Ustawienie wyliczonej nadpłaty jako cel bazowy
  const handleApplyAsTarget = () => {
    if (!sim.isValid) return;
    const targetDateStr = `${customTargetYear}-${String(customTargetMonth).padStart(2, '0')}`;
    const updated = {
      ...config,
      targetMonthlyOverpayment: requiredMonthlyOverpayment,
      targetPayoffDate: targetDateStr,
    };
    setConfig(updated);
    saveStoredMortgageConfig(updated);
    showToast(`Ustawiono ${requiredMonthlyOverpayment.toLocaleString('pl-PL')} zł/mc jako Twój stały cel nadpłaty!`);
  };

  // Kopiowanie numeru konta
  const handleCopyAccount = () => {
    if (!config.accountNumber) return;
    navigator.clipboard.writeText(config.accountNumber.replace(/\s+/g, ''));
    setCopiedAccount(true);
    showToast('Skopiowano numer konta Pekao do schowka!');
    setTimeout(() => setCopiedAccount(false), 2500);
  };

  // Zapis nowej wpłaty
  const handleAddPayment = (e: React.FormEvent) => {
    e.preventDefault();
    const regularNum = parseFloat(paymentRegular) || 0;
    const overpaymentNum = parseFloat(paymentOverpayment) || 0;

    const newRecord: MortgagePaymentRecord = {
      id: `pekao-${Date.now()}`,
      date: paymentDate,
      regularInstallment: regularNum,
      overpayment: overpaymentNum,
      totalPaid: regularNum + overpaymentNum,
      notes: paymentNotes.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    const updated = [newRecord, ...payments].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    setPayments(updated);
    saveStoredMortgagePayments(updated);
    setIsAddPaymentOpen(false);
    setPaymentNotes('');
    showToast(`Zarejestrowano nadpłatę ${overpaymentNum.toLocaleString('pl-PL')} zł!`);
  };

  // Usunięcie wpisu
  const handleDeletePayment = (id: string) => {
    if (!window.confirm('Usunąć ten wpis z historii płatności?')) return;
    const updated = payments.filter((p) => p.id !== id);
    setPayments(updated);
    saveStoredMortgagePayments(updated);
    showToast('Usunięto wpis.');
  };

  // Zapis edycji parametrów
  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    setConfig(tempConfig);
    saveStoredMortgageConfig(tempConfig);
    setIsEditConfigOpen(false);
    showToast('Zaktualizowano parametry kredytu!');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-[#18261e]/95 text-[#4ade80] border border-[#22c55e]/40 shadow-2xl backdrop-blur-md text-xs font-medium animate-in slide-in-from-top-2 duration-200">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="ml-2 text-white/50 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* NAGŁÓWEK GŁÓWNY: Kredyt Pekao + Akcje */}
      <div className="glass-panel p-5 sm:p-6 rounded-3xl border border-[#2e231c] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#2a1e16] border border-[#d99b5a]/30 flex items-center justify-center text-[#d99b5a] shadow-lg flex-shrink-0">
            <Landmark className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-light text-[#f5ede4]">
                {config.loanName}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-[#7ec29a]/15 text-[#9ee2b9] border border-[#7ec29a]/30">
                {config.interestRate}%
              </span>
            </div>
            <p className="text-xs text-[#9e8f82] mt-1 font-light flex items-center gap-3 flex-wrap">
              <span>Kapitał do spłaty: <strong className="text-[#f5ede4] font-medium font-mono privacy-mask">{(config.currentRemainingCapital || 568843.28).toLocaleString('pl-PL')} zł</strong></span>
              <span>•</span>
              <span>Rata bankowa: <strong className="text-[#f5ede4] font-medium font-mono privacy-mask">{config.regularInstallment.toLocaleString('pl-PL')} zł</strong></span>
              <span>•</span>
              <span>Łącznie (rata + nadpłata): <strong className="text-[#f1c38e] font-semibold font-mono privacy-mask">{nextTotalStandard.toLocaleString('pl-PL', { minimumFractionDigits: 2 })} zł</strong></span>
              <span>•</span>
              <span>Najbliższa rata: <strong className="text-[#d99b5a] font-medium">{nextPaymentInfo.dateString}</strong> (za {nextPaymentInfo.daysLeft} dni)</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-end md:self-center">
          <button
            onClick={() => {
              setTempConfig(config);
              setIsEditConfigOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-medium bg-[#1e1712] hover:bg-[#2b2019] text-[#d99b5a] border border-[#d99b5a]/30 transition-all active:scale-95"
            title="Edytuj kwoty, oprocentowanie, rachunek"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Parametry</span>
          </button>

          <button
            onClick={() => {
              setPaymentRegular(String(config.regularInstallment));
              setPaymentOverpayment(String(requiredMonthlyOverpayment));
              setIsAddPaymentOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#f5ede4] hover:bg-white text-[#120e0a] rounded-2xl text-xs font-semibold shadow-md transition-all active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Zarejestruj wpłatę</span>
          </button>
        </div>
      </div>

      {/* SELEKTOR TERMINU SPŁATY (PROSTY, INTUICYJNY, BEZ PRZEŁADOWANIA) */}
      <div className="p-4 sm:p-5 rounded-3xl border border-[#d99b5a]/35 bg-gradient-to-r from-[#1c140e] via-[#16100c] to-[#120e0a] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-[#d99b5a]" />
            <span className="text-xs font-medium text-[#f5ede4]">Wskaż kiedy chcesz spłacić kredyt:</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-[#9e8f82] font-mono">
            <span>Docelowo: <strong className="text-[#f1c38e] font-semibold">{sim.payoffDateFormatted}</strong></span>
            <span>•</span>
            <span>za {sim.yearsRemaining} l. {sim.monthsRemainder} m. ({sim.monthsRemaining} rat zamiast 348)</span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Szybkie przyciski */}
          <div className="flex items-center gap-1 p-1 rounded-2xl bg-[#120e0a] border border-[#2e231c]">
            {[5, 7, 10, 15].map((yr) => (
              <button
                key={yr}
                onClick={() => handleSetQuickTerm(yr)}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition-all ${
                  isQuickSelected(yr)
                    ? 'bg-[#d99b5a] text-[#120e0a] shadow-md'
                    : 'text-[#9e8f82] hover:text-[#f5ede4] hover:bg-[#251b14]'
                }`}
              >
                {yr} lat
              </button>
            ))}
          </div>

          {/* Ręczny wybór miesiąca i roku */}
          <div className="flex items-center gap-1.5">
            <select
              value={customTargetMonth}
              onChange={(e) => setCustomTargetMonth(parseInt(e.target.value, 10))}
              className="bg-[#120e0a] border border-[#382b20] focus:border-[#d99b5a] text-[#f5ede4] text-xs rounded-xl px-2.5 py-1.5 outline-none cursor-pointer"
            >
              {POLISH_MONTHS.map((m, idx) => (
                <option key={idx} value={idx + 1} className="bg-[#140f0c]">
                  {m}
                </option>
              ))}
            </select>

            <select
              value={customTargetYear}
              onChange={(e) => setCustomTargetYear(parseInt(e.target.value, 10))}
              className="bg-[#120e0a] border border-[#382b20] focus:border-[#d99b5a] text-[#f5ede4] text-xs font-mono rounded-xl px-2.5 py-1.5 outline-none cursor-pointer"
            >
              {Array.from({ length: 29 }).map((_, i) => {
                const yr = 2027 + i;
                return (
                  <option key={yr} value={yr} className="bg-[#140f0c]">
                    {yr}
                  </option>
                );
              })}
            </select>
          </div>
        </div>
      </div>

      {/* 3 KLUCZOWE KARTY: ODPOWIEDZI NA 3 GŁÓWNE PYTANIA UŻYTKOWNIKA */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* KARTA 1: ILE ŁĄCZNIE PRZELAĆ NA RATĘ + NADPŁATĘ */}
        <div className="p-5 sm:p-6 rounded-3xl border border-[#d99b5a]/45 bg-gradient-to-b from-[#1c1610]/95 via-[#16120e]/95 to-[#120e0a]/95 shadow-xl flex flex-col justify-between space-y-4 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#d99b5a] flex items-center gap-1.5 font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-[#d99b5a]" />
              Łączny przelew ({nextMonthName})
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#d99b5a]/20 text-[#f1c38e] font-mono border border-[#d99b5a]/30">
              Termin: {nextPaymentInfo.dateString}
            </span>
          </div>

          <div>
            <span className="text-xs text-[#c4b5a5] block font-medium">
              Łącznie na ratę + nadpłatę:
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl sm:text-4xl font-light text-[#f1c38e] font-mono privacy-mask">
                {nextTotalStandard.toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-sm text-[#d99b5a] font-mono font-medium">zł</span>
            </div>

            <div className="mt-3 p-3 rounded-2xl bg-[#140e0a] border border-[#2e231c] space-y-1.5 text-xs font-mono">
              <div className="flex justify-between text-[#c4b5a5]">
                <span>1. Rata banku (pobiera Pekao):</span>
                <span className="text-[#f5ede4] privacy-mask">{config.regularInstallment.toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} zł</span>
              </div>
              <div className="flex justify-between text-[#7ec29a]">
                <span>2. Nadpłata kapitału (poza ratą):</span>
                <span className="font-semibold privacy-mask">+{nextOverpaymentStandard.toLocaleString('pl-PL')} zł</span>
              </div>
              <div className="pt-2 border-t border-[#2e231c] flex justify-between font-semibold text-[#f1c38e]">
                <span>= Łącznie do przelania:</span>
                <span className="privacy-mask">{nextTotalStandard.toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} zł</span>
              </div>
            </div>

            {/* Informacja o zaliczce lub nadwyżce */}
            {hasSurplus && (
              <div className="mt-3 p-2.5 rounded-xl bg-[#1e2a20] border border-[#7ec29a]/30 text-[11px] text-[#9ee2b9] leading-relaxed">
                🎯 W {currentMonthName} masz <strong>+{currentMonthDiff.toLocaleString('pl-PL')} zł</strong> nadwyżki.
                <div className="text-[10px] text-[#7ec29a] mt-1 space-y-0.5">
                  <div>• Pełny przelew: <strong>{nextTotalStandard.toLocaleString('pl-PL', { minimumFractionDigits: 2 })} zł</strong> (rata + nadpłata {nextOverpaymentStandard.toLocaleString('pl-PL')} zł)</div>
                  <div>• Z zaliczką: <strong>{nextTotalMin.toLocaleString('pl-PL', { minimumFractionDigits: 2 })} zł</strong> (rata + nadpłata {nextOverpaymentMin.toLocaleString('pl-PL')} zł)</div>
                </div>
              </div>
            )}

            {hasGap && (
              <div className="mt-3 p-2.5 rounded-xl bg-[#2a1c18] border border-[#e07a68]/30 text-[11px] text-[#f19b8c] leading-relaxed">
                ⚠️ W {currentMonthName} brakuje {Math.abs(currentMonthDiff).toLocaleString('pl-PL')} zł do celu.
                <div className="text-[10px] text-[#e07a68] mt-0.5">
                  Łącznie z dopłatą wyrównującą: <strong>{nextTotalMin.toLocaleString('pl-PL', { minimumFractionDigits: 2 })} zł</strong>.
                </div>
              </div>
            )}
          </div>

          {/* Szybkie kopiowanie numeru konta Pekao */}
          <div className="pt-3 border-t border-[#2e231c] flex items-center justify-between gap-2">
            <div className="text-[11px] text-[#9e8f82] truncate font-mono">
              Pekao: <strong className="text-[#f5ede4]">{config.accountNumber ? `${config.accountNumber.slice(0, 14)}...` : '—'}</strong>
            </div>
            <button
              type="button"
              onClick={handleCopyAccount}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-[#2a1e16] hover:bg-[#382b20] text-[#f1c38e] border border-[#d99b5a]/40 transition-all active:scale-95 shrink-0"
              title="Kopiuj pełny numer rachunku do przelewu nadpłaty"
            >
              {copiedAccount ? <Check className="w-3.5 h-3.5 text-[#7ec29a]" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedAccount ? 'Skopiowano' : 'Kopiuj konto'}</span>
            </button>
          </div>
        </div>

        {/* KARTA 2: ILE ODSETEK OSZCZĘDZAM I ILE PŁACĘ */}
        <div className="p-5 sm:p-6 rounded-3xl border border-[#d99b5a]/40 bg-gradient-to-b from-[#201812]/90 to-[#140e0a]/95 shadow-xl flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#d99b5a] flex items-center gap-1.5 font-semibold">
              <TrendingUp className="w-3.5 h-3.5" />
              Bilans odsetek
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#7ec29a]/20 text-[#9ee2b9] font-mono border border-[#7ec29a]/30">
              -{Math.round((sim.totalInterestSaved / sim.baselineTotalInterest) * 100)}% odsetek
            </span>
          </div>

          <div>
            <span className="text-xs text-[#9e8f82] block">Zaoszczędzone odsetki (w kieszeni):</span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-3xl sm:text-4xl font-light text-[#7ec29a] font-mono privacy-mask">
                ~{sim.totalInterestSaved.toLocaleString('pl-PL')}
              </span>
              <span className="text-sm text-[#7ec29a] font-mono">zł</span>
            </div>

            {/* Wizualny pasek odsetek */}
            <div className="mt-3 space-y-1.5">
              <div className="w-full h-2 rounded-full bg-[#1e1713] overflow-hidden flex border border-[#2e231c]">
                <div
                  style={{ width: `${Math.max(4, (sim.totalInterestOverall / sim.baselineTotalInterest) * 100)}%` }}
                  className="bg-[#d99b5a] h-full"
                  title="Odsetki do zapłacenia w Twoim planie"
                />
                <div
                  style={{ width: `${Math.max(10, (sim.totalInterestSaved / sim.baselineTotalInterest) * 100)}%` }}
                  className="bg-[#7ec29a] h-full"
                  title="Odsetki zaoszczędzone"
                />
              </div>
              <div className="flex justify-between text-[10px] font-mono text-[#9e8f82]">
                <span>Płacisz: {Math.round((sim.totalInterestOverall / sim.baselineTotalInterest) * 100)}%</span>
                <span className="text-[#7ec29a]">Oszczędzasz: {Math.round((sim.totalInterestSaved / sim.baselineTotalInterest) * 100)}%</span>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-[#2e231c]/80 space-y-1.5 text-xs font-mono">
              <div className="flex justify-between text-[#c4b5a5]">
                <span>Odsetki łącznie w Twoim planie:</span>
                <strong className="text-[#f5ede4] privacy-mask">~{sim.totalInterestOverall.toLocaleString('pl-PL')} zł</strong>
              </div>
              <div className="flex justify-between text-[#9e8f82] text-[11px]">
                <span>• Spłacone dotychczas:</span>
                <span className="privacy-mask">{sim.alreadyPaidInterest.toLocaleString('pl-PL')} zł</span>
              </div>
              <div className="flex justify-between text-[#9e8f82] text-[11px]">
                <span>• Pozostało do spłaty:</span>
                <span className="privacy-mask">~{sim.totalInterestRemaining.toLocaleString('pl-PL')} zł</span>
              </div>
              <div className="pt-2 border-t border-[#2e231c]/60 flex justify-between text-xs text-[#9e8f82]">
                <span>Koszt w umowie bez nadpłat:</span>
                <span className="line-through text-[#e07a68]/80 privacy-mask">~{sim.baselineTotalInterest.toLocaleString('pl-PL')} zł</span>
              </div>
            </div>
          </div>

          <div className="pt-2 text-[11px] text-[#9ee2b9] flex items-center gap-1.5 font-mono">
            <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0 text-[#7ec29a]" />
            <span>Zamiast 729 tys. zł zapłacisz tylko 161 tys. zł!</span>
          </div>
        </div>

        {/* KARTA 3: ILE NADPŁATY, ABY TRZYMAĆ SIĘ TERMINU SPŁATY */}
        <div className="p-5 sm:p-6 rounded-3xl border border-[#2e231c] bg-gradient-to-b from-[#18120d]/90 to-[#120e0a]/95 shadow-xl flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#d99b5a] flex items-center gap-1.5 font-semibold">
              <Target className="w-3.5 h-3.5" />
              Stała nadpłata do celu
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#d99b5a]/20 text-[#f1c38e] font-mono border border-[#d99b5a]/30">
              Cel: {sim.payoffDateFormatted}
            </span>
          </div>

          <div>
            <span className="text-xs text-[#9e8f82] block">Wymagana stała nadpłata co miesiąc:</span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-3xl sm:text-4xl font-light text-[#f5ede4] font-mono privacy-mask">
                {requiredMonthlyOverpayment.toLocaleString('pl-PL')}
              </span>
              <span className="text-sm text-[#9e8f82]">zł / mc</span>
            </div>

            <div className="mt-3 pt-3 border-t border-[#2e231c]/80 space-y-2 text-xs font-mono">
              <div className="flex justify-between text-[#c4b5a5]">
                <span>Skrócenie umowy kredytowej:</span>
                <strong className="text-[#7ec29a]">o {sim.yearsReduced} lat!</strong>
              </div>
              <div className="flex justify-between text-[#c4b5a5]">
                <span>Liczba rat do końca:</span>
                <span className="text-[#f5ede4] font-semibold">{sim.monthsRemaining} rat</span>
              </div>
              <div className="flex justify-between text-[#c4b5a5]">
                <span>Termin spłaty:</span>
                <span className="text-[#f1c38e] font-semibold">{sim.payoffDateFormatted} (zamiast 2055)</span>
              </div>
              <div className="flex justify-between text-[#c4b5a5]">
                <span>Łączny koszt kredytu:</span>
                <span className="text-[#f5ede4] privacy-mask">~{sim.totalLoanCost.toLocaleString('pl-PL')} zł</span>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={handleApplyAsTarget}
              className="w-full py-2 px-3 rounded-xl bg-[#2a1e16] hover:bg-[#382b20] text-[#f1c38e] text-xs font-medium border border-[#d99b5a]/30 transition-all flex items-center justify-center gap-1.5"
            >
              <Target className="w-3.5 h-3.5 text-[#d99b5a]" />
              <span>Ustaw {requiredMonthlyOverpayment.toLocaleString('pl-PL')} zł jako stały cel</span>
            </button>
          </div>
        </div>
      </div>

      {/* SEKCJA ZWIJANA: PORÓWNANIE ZE STANDARDEM BANKOWYM (CZYTELNE, ZWIĘZŁE) */}
      <div className="glass-panel rounded-3xl border border-[#2e231c] overflow-hidden">
        <button
          onClick={() => setShowComparison(!showComparison)}
          className="w-full p-4 sm:p-5 flex items-center justify-between text-left hover:bg-[#1a1410]/50 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <Percent className="w-4 h-4 text-[#d99b5a]" />
            <div>
              <h3 className="text-sm font-medium text-[#f5ede4]">
                Porównanie: Standard banku (30 lat) vs Twój plan nadpłat ({sim.yearsRemaining} lat)
              </h3>
              <p className="text-xs text-[#9e8f82]">
                Zobacz ile zyskujesz nadpłacając kredyt zamiast płacić samą ratę do 2055 roku
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-[#d99b5a]">
            <span>{showComparison ? 'Zwiń' : 'Rozwiń'}</span>
            {showComparison ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>

        {showComparison && (
          <div className="p-5 pt-0 border-t border-[#2e231c]/60 space-y-4 animate-in fade-in duration-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono pt-4">
              {/* Kolumna 1: Umowa bankowa */}
              <div className="p-4 rounded-2xl bg-[#140e0a] border border-[#2e231c] space-y-2.5">
                <div className="flex items-center justify-between pb-2 border-b border-[#2e231c]">
                  <span className="text-[10px] uppercase text-[#9e8f82]">Wariant 1: Bez nadpłat (umowa)</span>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-[#2e231c] text-[#9e8f82]">Standard</span>
                </div>
                <div className="flex justify-between text-[#c4b5a5]">
                  <span>Czas trwania:</span>
                  <span className="text-[#f5ede4]">30 lat (do listopada 2055)</span>
                </div>
                <div className="flex justify-between text-[#c4b5a5]">
                  <span>Miesięczny przelew:</span>
                  <span className="text-[#f5ede4] privacy-mask">{config.regularInstallment.toLocaleString('pl-PL')} zł</span>
                </div>
                <div className="flex justify-between text-[#c4b5a5]">
                  <span>Łączne odsetki dla banku:</span>
                  <strong className="text-[#e07a68] privacy-mask">~{sim.baselineTotalInterest.toLocaleString('pl-PL')} zł</strong>
                </div>
                <div className="flex justify-between text-[#c4b5a5]">
                  <span>Całkowity koszt kredytu:</span>
                  <span className="text-[#e07a68] privacy-mask">~{(config.originalAmount + sim.baselineTotalInterest).toLocaleString('pl-PL')} zł</span>
                </div>
                <div className="flex justify-between text-[#c4b5a5]">
                  <span>Zaoszczędzone odsetki:</span>
                  <span className="text-[#9e8f82]">0 zł</span>
                </div>
              </div>

              {/* Kolumna 2: Twój plan nadpłat */}
              <div className="p-4 rounded-2xl bg-[#162118]/80 border border-[#7ec29a]/30 space-y-2.5">
                <div className="flex items-center justify-between pb-2 border-b border-[#7ec29a]/20">
                  <span className="text-[10px] uppercase text-[#7ec29a] font-semibold">Wariant 2: Twój plan nadpłat</span>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-[#7ec29a]/20 text-[#9ee2b9]">Aktywny</span>
                </div>
                <div className="flex justify-between text-[#c4b5a5]">
                  <span>Czas trwania:</span>
                  <strong className="text-[#7ec29a]">{sim.yearsRemaining} l. {sim.monthsRemainder} m. (do {sim.payoffDateFormatted})</strong>
                </div>
                <div className="flex justify-between text-[#c4b5a5]">
                  <span>Miesięczny przelew:</span>
                  <span className="text-[#f5ede4] privacy-mask">~{(config.regularInstallment + requiredMonthlyOverpayment).toLocaleString('pl-PL')} zł</span>
                </div>
                <div className="flex justify-between text-[#c4b5a5]">
                  <span>Łączne odsetki dla banku:</span>
                  <strong className="text-[#7ec29a] privacy-mask">~{sim.totalInterestOverall.toLocaleString('pl-PL')} zł</strong>
                </div>
                <div className="flex justify-between text-[#c4b5a5]">
                  <span>Całkowity koszt kredytu:</span>
                  <strong className="text-[#7ec29a] privacy-mask">~{sim.totalLoanCost.toLocaleString('pl-PL')} zł</strong>
                </div>
                <div className="flex justify-between text-[#c4b5a5] pt-1 border-t border-[#7ec29a]/20">
                  <span className="text-[#7ec29a] font-semibold">Zaoszczędzone odsetki w kieszeni:</span>
                  <strong className="text-[#7ec29a] font-semibold text-sm privacy-mask">~{sim.totalInterestSaved.toLocaleString('pl-PL')} zł</strong>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SEKCJA: HISTORIA OPERACJI PEKAO (CZYSTA, PRZEJRZYSTA) */}
      <div className="glass-panel rounded-3xl border border-[#2e231c] overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-[#2e231c] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-medium text-[#f5ede4]">
                Historia spłat i nadpłat (Bank Pekao)
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-[#d99b5a]/20 text-[#f1c38e] border border-[#d99b5a]/30">
                {payments.length} wpisów
              </span>
            </div>
            <span className="text-xs text-[#9e8f82] hidden sm:inline">•</span>
            <span className="text-xs text-[#9e8f82] hidden sm:inline">
              Suma nadpłat: <strong className="text-[#7ec29a] font-mono privacy-mask">{totalOverpaid.toLocaleString('pl-PL')} zł</strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="px-3 py-1.5 text-xs text-[#9e8f82] hover:text-[#f5ede4]"
            >
              {showHistory ? 'Zwiń tabelę' : 'Rozwiń tabelę'}
            </button>
            <button
              onClick={() => {
                setPaymentRegular(String(config.regularInstallment));
                setPaymentOverpayment(String(requiredMonthlyOverpayment));
                setIsAddPaymentOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#d99b5a] hover:bg-[#e6ab6e] text-[#120e0a] rounded-xl text-xs font-semibold shadow-md transition-all active:scale-95"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Dodaj wpłatę</span>
            </button>
          </div>
        </div>

        {showHistory && (
          <div className="overflow-x-auto">
            {payments.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#9e8f82]">
                Brak historii wpłat. Kliknij „Dodaj wpłatę”, aby zarejestrować ratę lub nadpłatę.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-[#140e0b] border-b border-[#2e231c] text-[#9e8f82] font-mono uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-4">Data</th>
                    <th className="py-2.5 px-4">Typ operacji</th>
                    <th className="py-2.5 px-4">Rata bankowa</th>
                    <th className="py-2.5 px-4 text-[#7ec29a]">Nadpłata kapitału</th>
                    <th className="py-2.5 px-4">Łącznie</th>
                    <th className="py-2.5 px-4">Uwagi</th>
                    <th className="py-2.5 px-4 text-right">Akcje</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2e231c]/60">
                  {payments.map((p) => {
                    const total = (p.regularInstallment || 0) + (p.overpayment || 0);
                    const isOverpaymentOnly = (p.regularInstallment || 0) === 0 && (p.overpayment || 0) > 0;
                    const isRegularOnly = (p.regularInstallment || 0) > 0 && (p.overpayment || 0) === 0;

                    return (
                      <tr key={p.id} className="hover:bg-[#1a1410]/50 transition-colors">
                        <td className="py-2.5 px-4 font-mono text-[#f5ede4]">
                          {p.date}
                        </td>
                        <td className="py-2.5 px-4">
                          {isOverpaymentOnly ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-[#7ec29a]/15 text-[#9ee2b9] border border-[#7ec29a]/30">
                              Spłata kapitału
                            </span>
                          ) : isRegularOnly ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-[#d99b5a]/15 text-[#f1c38e] border border-[#d99b5a]/30">
                              Spłata raty
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-[#f5ede4]/15 text-[#f5ede4] border border-[#f5ede4]/30">
                              Rata + Nadpłata
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-4 text-[#c4b5a5] font-mono">
                          {p.regularInstallment && p.regularInstallment > 0 ? (
                            <span className="privacy-mask">
                              {p.regularInstallment.toLocaleString('pl-PL', { minimumFractionDigits: 2 })} zł
                            </span>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="py-2.5 px-4 font-medium text-[#7ec29a] font-mono">
                          {p.overpayment && p.overpayment > 0 ? (
                            <span className="privacy-mask">
                              +{p.overpayment.toLocaleString('pl-PL', { minimumFractionDigits: 2 })} zł
                            </span>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="py-2.5 px-4 font-semibold text-[#f5ede4] font-mono">
                          <span className="privacy-mask">
                            {total.toLocaleString('pl-PL', { minimumFractionDigits: 2 })} zł
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-[#9e8f82] max-w-xs truncate">
                          {p.notes || '—'}
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          <button
                            onClick={() => handleDeletePayment(p.id)}
                            className="p-1 rounded-lg text-[#9e8f82] hover:text-[#f87171] hover:bg-[#2a1310] transition-colors"
                            title="Usuń wpis"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* MODAL: DODAJ NOWĄ WPŁATĘ */}
      {isAddPaymentOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md glass-panel rounded-3xl p-6 border border-[#3d2c20] shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-[#2e231c]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-2xl bg-[#d99b5a]/15 border border-[#d99b5a]/30 flex items-center justify-center text-[#d99b5a]">
                  <Plus className="w-4 h-4" />
                </div>
                <h3 className="text-base font-light text-[#f5ede4]">
                  Zarejestruj wpłatę / nadpłatę
                </h3>
              </div>
              <button onClick={() => setIsAddPaymentOpen(false)} className="text-[#9e8f82] hover:text-[#f5ede4]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddPayment} className="space-y-4 pt-4">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[#9e8f82] mb-1">
                  Data wpłaty *
                </label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full bg-[#120e0a] border border-[#382b20] focus:border-[#d99b5a] rounded-xl px-3 py-2 text-xs text-[#f5ede4] outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-[#9e8f82] mb-1">
                    Rata banku (zł)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={paymentRegular}
                    onChange={(e) => setPaymentRegular(e.target.value)}
                    className="w-full bg-[#120e0a] border border-[#382b20] focus:border-[#d99b5a] rounded-xl px-3 py-2 text-xs text-[#f5ede4] outline-none"
                  />
                  <span className="text-[10px] text-[#7a6b5e] block mt-0.5">Wpisz 0 dla samej nadpłaty</span>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-[#7ec29a] mb-1">
                    Nadpłata kapitału (zł)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={paymentOverpayment}
                    onChange={(e) => setPaymentOverpayment(e.target.value)}
                    className="w-full bg-[#120e0a] border border-[#7ec29a]/40 focus:border-[#7ec29a] rounded-xl px-3 py-2 text-xs text-[#f5ede4] outline-none"
                  />
                  <span className="text-[10px] text-[#7a6b5e] block mt-0.5">Wpisz 0 dla samej raty</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[#9e8f82] mb-1">
                  Notatka (opcjonalnie)
                </label>
                <input
                  type="text"
                  placeholder="np. Nadpłata kapitału w aplikacji Pekao"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  className="w-full bg-[#120e0a] border border-[#382b20] focus:border-[#d99b5a] rounded-xl px-3 py-2 text-xs text-[#f5ede4] outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#2e231c]">
                <button
                  type="button"
                  onClick={() => setIsAddPaymentOpen(false)}
                  className="px-4 py-2 text-xs text-[#9e8f82] hover:text-[#f5ede4]"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#d99b5a] hover:bg-[#e6ab6e] text-[#120e0a] font-semibold text-xs rounded-xl shadow-lg transition-all active:scale-95"
                >
                  Zapisz wpłatę
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: PARAMETRY KREDYTU */}
      {isEditConfigOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg glass-panel rounded-3xl p-6 border border-[#3d2c20] shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-[#2e231c]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-2xl bg-[#d99b5a]/15 border border-[#d99b5a]/30 flex items-center justify-center text-[#d99b5a]">
                  <Settings className="w-4 h-4" />
                </div>
                <h3 className="text-base font-light text-[#f5ede4]">
                  Parametry Kredytu Hipotecznego
                </h3>
              </div>
              <button onClick={() => setIsEditConfigOpen(false)} className="text-[#9e8f82] hover:text-[#f5ede4]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveConfig} className="space-y-4 pt-4">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[#9e8f82] mb-1">
                  Nazwa kredytu
                </label>
                <input
                  type="text"
                  value={tempConfig.loanName}
                  onChange={(e) => setTempConfig({ ...tempConfig, loanName: e.target.value })}
                  className="w-full bg-[#120e0a] border border-[#382b20] focus:border-[#d99b5a] rounded-xl px-3 py-2 text-xs text-[#f5ede4] outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-[#9e8f82] mb-1">
                    Kapitał początkowy (zł)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={tempConfig.originalAmount}
                    onChange={(e) => setTempConfig({ ...tempConfig, originalAmount: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-[#120e0a] border border-[#382b20] focus:border-[#d99b5a] rounded-xl px-3 py-2 text-xs text-[#f5ede4] outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-[#9e8f82] mb-1">
                    Aktualny kapitał pozostały (zł)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={tempConfig.currentRemainingCapital || 0}
                    onChange={(e) => setTempConfig({ ...tempConfig, currentRemainingCapital: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-[#120e0a] border border-[#382b20] focus:border-[#d99b5a] rounded-xl px-3 py-2 text-xs text-[#f5ede4] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-[#9e8f82] mb-1">
                    Rata banku (zł)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={tempConfig.regularInstallment}
                    onChange={(e) => setTempConfig({ ...tempConfig, regularInstallment: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-[#120e0a] border border-[#382b20] focus:border-[#d99b5a] rounded-xl px-3 py-2 text-xs text-[#f5ede4] outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-[#9e8f82] mb-1">
                    Oprocentowanie roczne (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={tempConfig.interestRate}
                    onChange={(e) => setTempConfig({ ...tempConfig, interestRate: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-[#120e0a] border border-[#382b20] focus:border-[#d99b5a] rounded-xl px-3 py-2 text-xs text-[#f5ede4] outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[#9e8f82] mb-1">
                  Numer rachunku Pekao do nadpłat
                </label>
                <input
                  type="text"
                  value={tempConfig.accountNumber || ''}
                  onChange={(e) => setTempConfig({ ...tempConfig, accountNumber: e.target.value })}
                  className="w-full bg-[#120e0a] border border-[#382b20] focus:border-[#d99b5a] rounded-xl px-3 py-2 text-xs text-[#f5ede4] outline-none font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#2e231c]">
                <button
                  type="button"
                  onClick={() => setIsEditConfigOpen(false)}
                  className="px-4 py-2 text-xs text-[#9e8f82] hover:text-[#f5ede4]"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#d99b5a] hover:bg-[#e6ab6e] text-[#120e0a] font-semibold text-xs rounded-xl shadow-lg transition-all active:scale-95"
                >
                  Zapisz parametry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
