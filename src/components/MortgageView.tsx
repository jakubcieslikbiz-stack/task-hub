import React, { useState, useMemo } from 'react';
import type { MortgageConfig, MortgagePaymentRecord } from '../types';
import {
  getStoredMortgageConfig,
  saveStoredMortgageConfig,
  getStoredMortgagePayments,
  saveStoredMortgagePayments,
  getNextMortgagePaymentDate,
  calculateAverageOverpayment,
  calculateTotalOverpayment,
  calculateOverpaymentInMonth,
  analyzeOverpaymentStatus,
  estimateMortgageSavings,
  simulateAmortizationSchedule,
  calculateRequiredOverpaymentForTargetDate,
  calculateRollingReconciliation,
} from '../lib/mortgage';
import {
  Landmark,
  Calendar,
  TrendingUp,
  Target,
  Plus,
  Trash2,
  CheckCircle2,
  PiggyBank,
  Copy,
  Check,
  Settings,
  X,
  Info,
  CalendarDays,
  Calculator,
  Sparkles,
} from 'lucide-react';

const POLISH_MONTHS = [
  'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
  'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'
];

export const MortgageView: React.FC = () => {
  const [config, setConfig] = useState<MortgageConfig>(() => getStoredMortgageConfig());
  const [payments, setPayments] = useState<MortgagePaymentRecord[]>(() => getStoredMortgagePayments());

  // Modal: Zarejestruj wpłatę / nadpłatę
  const [isAddPaymentOpen, setIsAddPaymentOpen] = useState(false);
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [paymentRegular, setPaymentRegular] = useState(String(config.regularInstallment));
  const [paymentOverpayment, setPaymentOverpayment] = useState('4670');
  const [paymentNotes, setPaymentNotes] = useState('');

  // Modal: Edycja parametrów kredytu
  const [isEditConfigOpen, setIsEditConfigOpen] = useState(false);
  const [tempConfig, setTempConfig] = useState<MortgageConfig>(config);

  // Dynamiczna symulacja dla parametrów w modalu edycji
  const liveSimModal = useMemo(() => {
    return simulateAmortizationSchedule({
      currentBalance: tempConfig.currentRemainingCapital || 568843.28,
      annualInterestRate: tempConfig.interestRate || 6.05,
      regularInstallment: tempConfig.regularInstallment || 3759.64,
      monthlyOverpayment: tempConfig.targetMonthlyOverpayment || 0,
      originalLoanAmount: tempConfig.originalAmount || 624029.47,
      originalTermMonths: tempConfig.loanTermMonths || 360,
    });
  }, [tempConfig]);

  // Quick edit target overpayment modal
  const [isEditingTarget, setIsEditingTarget] = useState(false);
  const [tempTarget, setTempTarget] = useState(String(config.targetMonthlyOverpayment));

  // Własny docelowy termin spłaty wprowadzany przez użytkownika
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

  // Copy toast state
  const [copiedAccount, setCopiedAccount] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Najbliższa data pobrania raty kredytu (z uwzględnieniem świąt i weekendów)
  const nextPaymentInfo = useMemo(() => {
    return getNextMortgagePaymentDate();
  }, []);

  // Aktualny miesiąc YYYY-MM
  const now = new Date();
  const currentYm = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  // Statystyki z historii
  const stats = useMemo(() => {
    const averageOverpayment = calculateAverageOverpayment(payments);
    const totalOverpaid = calculateTotalOverpayment(payments);
    const overpaymentThisMonth = calculateOverpaymentInMonth(payments, currentYm);

    const overpaymentAnalysis = analyzeOverpaymentStatus({
      targetAmount: config.targetMonthlyOverpayment,
      currentPaidThisMonth: overpaymentThisMonth,
      regularInstallment: config.regularInstallment,
    });

    const savings = estimateMortgageSavings(
      totalOverpaid,
      config.interestRate,
      config.regularInstallment,
      config.currentRemainingCapital || 568843.28
    );

    // 1. Scenariusz A: Tylko dotychczasowe nadpłaty (0 przyszłych nadpłat)
    const simPastOnly = simulateAmortizationSchedule({
      currentBalance: config.currentRemainingCapital || 568843.28,
      annualInterestRate: config.interestRate,
      regularInstallment: config.regularInstallment,
      monthlyOverpayment: 0,
      originalLoanAmount: config.originalAmount,
      originalTermMonths: config.loanTermMonths || 360,
    });

    // 2. Scenariusz B: Kontynuacja średniej nadpłaty z historii
    const simAverage = simulateAmortizationSchedule({
      currentBalance: config.currentRemainingCapital || 568843.28,
      annualInterestRate: config.interestRate,
      regularInstallment: config.regularInstallment,
      monthlyOverpayment: averageOverpayment,
      originalLoanAmount: config.originalAmount,
      originalTermMonths: config.loanTermMonths || 360,
    });

    // 3. Scenariusz C: Kontynuacja ustalonego celu bazowego
    const simTarget = simulateAmortizationSchedule({
      currentBalance: config.currentRemainingCapital || 568843.28,
      annualInterestRate: config.interestRate,
      regularInstallment: config.regularInstallment,
      monthlyOverpayment: config.targetMonthlyOverpayment,
      originalLoanAmount: config.originalAmount,
      originalTermMonths: config.loanTermMonths || 360,
    });

    // 4. Scenariusz D: Własny docelowy termin spłaty wprowadzony przez użytkownika (Kalkulator zwrotny)
    const simCustom = calculateRequiredOverpaymentForTargetDate({
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

    // Dynamiczne miesięczne rozliczenie z przeniesieniem nadwyżki/niedopłaty
    const rollingReconciliation = calculateRollingReconciliation({
      payments,
      targetOverpayment: config.targetMonthlyOverpayment,
      regularInstallment: config.regularInstallment,
      currentYear: now.getFullYear(),
      currentMonth: now.getMonth() + 1,
    });

    return {
      averageOverpayment,
      totalOverpaid,
      overpaymentThisMonth,
      overpaymentAnalysis,
      savings,
      simPastOnly,
      simAverage,
      simTarget,
      simCustom,
      rollingReconciliation,
    };
  }, [payments, config, currentYm, customTargetYear, customTargetMonth]);

  // Kopiowanie numeru subkonta
  const handleCopyAccount = () => {
    if (!config.accountNumber) return;
    navigator.clipboard.writeText(config.accountNumber.replace(/\s+/g, ''));
    setCopiedAccount(true);
    showToast('Skopiowano numer rachunku do schowka!');
    setTimeout(() => setCopiedAccount(false), 2500);
  };

  // Ustawienie wyliczonej nadpłaty z własnego terminu jako pułap bazowy
  const handleApplyCustomOverpaymentAsTarget = () => {
    if (!stats.simCustom.isValid) return;
    const newTarget = Math.round(stats.simCustom.requiredMonthlyOverpayment);
    const targetDateStr = `${customTargetYear}-${String(customTargetMonth).padStart(2, '0')}`;
    const updated = {
      ...config,
      targetMonthlyOverpayment: newTarget,
      targetPayoffDate: targetDateStr,
    };
    setConfig(updated);
    saveStoredMortgageConfig(updated);
    setTempTarget(String(newTarget));
    showToast(`Ustawiono ${newTarget.toLocaleString('pl-PL')} zł/mc jako Twój bazowy cel (spłata do ${stats.simCustom.payoffDateFormatted})!`);
  };

  // Szybki wybór docelowego terminu (np. 5, 7, 8, 10 lat)
  const handleSetQuickTerm = (years: number) => {
    const targetDate = new Date(now.getFullYear() + years, now.getMonth(), 1);
    setCustomTargetYear(targetDate.getFullYear());
    setCustomTargetMonth(targetDate.getMonth() + 1);
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
    showToast(`Zarejestrowano wpłatę z nadpłatą ${overpaymentNum.toLocaleString('pl-PL')} zł!`);
  };

  // Usuwanie wpisu z historii
  const handleDeletePayment = (id: string) => {
    if (!window.confirm('Czy na pewno chcesz usunąć ten wpis z historii płatności?')) return;
    const updated = payments.filter((p) => p.id !== id);
    setPayments(updated);
    saveStoredMortgagePayments(updated);
    showToast('Usunięto wpis z historii.');
  };

  // Zapis nowej konfiguracji parametrów kredytu
  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    setConfig(tempConfig);
    saveStoredMortgageConfig(tempConfig);
    setIsEditConfigOpen(false);
    showToast('Zaktualizowano parametry kredytu hipotecznego!');
  };

  // Szybki zapis pułapu bazowego
  const handleSaveTarget = () => {
    const val = parseFloat(tempTarget);
    if (isNaN(val) || val < 0) {
      showToast('Podaj poprawną kwotę pułapu');
      return;
    }
    const updated = { ...config, targetMonthlyOverpayment: val };
    setConfig(updated);
    saveStoredMortgageConfig(updated);
    setIsEditingTarget(false);
    showToast(`Ustalono nowy pułap bazowy nadpłaty: ${val.toLocaleString('pl-PL')} zł / mc!`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-[#18261e]/95 text-[#4ade80] border border-[#22c55e]/40 shadow-2xl backdrop-blur-md text-xs font-medium animate-in slide-in-from-top-2 duration-200">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="ml-2 text-white/50 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Header Bar: Nazwa kredytu, Oprocentowanie & Przycisk edycji parametrów */}
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
                Oprocentowanie: {config.interestRate}%
              </span>
            </div>
            <p className="text-xs text-[#9e8f82] mt-1 font-light">
              Rata regularna: <strong className="text-[#f5ede4] font-medium">{config.regularInstallment.toLocaleString('pl-PL')} zł</strong> • Kapitał początkowy: <strong className="text-[#f5ede4] font-medium">{config.originalAmount.toLocaleString('pl-PL')} zł</strong> • Rachunek Pekao: <span className="font-mono text-[#d99b5a]">{config.accountNumber}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-end md:self-center">
          <button
            onClick={() => {
              setTempConfig(config);
              setIsEditConfigOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-medium bg-[#1e1712] hover:bg-[#2b2019] text-[#d99b5a] border border-[#d99b5a]/30 transition-all active:scale-95 shadow-sm"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Parametry kredytu</span>
          </button>

          <button
            onClick={() => {
              setPaymentRegular(String(config.regularInstallment));
              setIsAddPaymentOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#f5ede4] hover:bg-white text-[#120e0a] rounded-2xl text-xs font-semibold shadow-md transition-all active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Zarejestruj wpłatę</span>
          </button>
        </div>
      </div>

      {/* 4 Kluczowe Karty KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Karta 1: Najbliższa płatność */}
        <div className="glass-panel p-4 rounded-3xl border border-[#2e231c] flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#9e8f82] flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#d99b5a]" />
              Najbliższa data pobrania
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#d99b5a]/20 text-[#f1c38e] border border-[#d99b5a]/40">
              za {nextPaymentInfo.daysLeft} dni
            </span>
          </div>

          <div>
            <div className="text-sm font-semibold text-[#f5ede4]">
              {nextPaymentInfo.formatted}
            </div>
            {nextPaymentInfo.isShiftedToNextMonth && (
              <p className="text-[10px] text-[#e07a68] mt-1 flex items-center gap-1">
                <Info className="w-3 h-3 flex-shrink-0" />
                <span>Pobranie przesunięte na 1./2. dzień roboczy</span>
              </p>
            )}
            <p className="text-[11px] text-[#9e8f82] mt-1 font-mono">
              Kwota raty: <strong className="text-[#f5ede4]">{config.regularInstallment.toLocaleString('pl-PL')} zł</strong>
            </p>
          </div>
        </div>

        {/* Karta 2: Ustalony pułap bazowy nadpłaty */}
        <div className="glass-panel p-4 rounded-3xl border border-[#2e231c] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#9e8f82] flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-[#7ec29a]" />
              Pułap bazowy nadpłaty
            </span>
            <button
              onClick={() => {
                setTempTarget(String(config.targetMonthlyOverpayment));
                setIsEditingTarget(true);
              }}
              className="text-[10px] text-[#d99b5a] hover:underline"
            >
              Zmień cel
            </button>
          </div>

          {isEditingTarget ? (
            <div className="flex items-center gap-1.5 mt-1">
              <input
                type="number"
                value={tempTarget}
                onChange={(e) => setTempTarget(e.target.value)}
                className="w-full bg-[#120e0a] border border-[#382b20] rounded-xl px-2.5 py-1 text-xs text-[#f5ede4] outline-none"
              />
              <button
                onClick={handleSaveTarget}
                className="px-2.5 py-1 bg-[#d99b5a] text-[#120e0a] text-xs font-semibold rounded-xl hover:bg-[#e6ab6e]"
              >
                OK
              </button>
            </div>
          ) : (
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-light text-[#f5ede4]">
                  {config.targetMonthlyOverpayment.toLocaleString('pl-PL')}
                </span>
                <span className="text-xs text-[#9e8f82]">zł / mc</span>
              </div>
              <p className="text-[11px] text-[#7ec29a] mt-1">
                Docelowy miesięczny pułap redukcji
              </p>
            </div>
          )}
        </div>

        {/* Karta 3: Średnia wielkość nadpłaty z historii */}
        <div className="glass-panel p-4 rounded-3xl border border-[#2e231c] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#9e8f82] flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-[#d99b5a]" />
              Średnia nadpłata z historii
            </span>
          </div>

          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-light text-[#f5ede4]">
                {stats.averageOverpayment.toLocaleString('pl-PL')}
              </span>
              <span className="text-xs text-[#9e8f82]">zł</span>
            </div>
            <p className="text-[11px] text-[#9e8f82] mt-1">
              Średnia z 10 spłat kapitału w Pekao
            </p>
          </div>
        </div>

        {/* Karta 4: Bilans bieżącego miesiąca */}
        <div className="glass-panel p-4 rounded-3xl border border-[#2e231c] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#9e8f82] flex items-center gap-1.5">
              <PiggyBank className="w-3.5 h-3.5 text-[#d99b5a]" />
              Stan na ten miesiąc (XI 2026)
            </span>
            {stats.overpaymentAnalysis.isMet ? (
              <span className="w-2 h-2 rounded-full bg-[#7ec29a]" />
            ) : (
              <span className="w-2 h-2 rounded-full bg-[#d99b5a]" />
            )}
          </div>

          <div>
            {stats.overpaymentAnalysis.isMet ? (
              <div>
                <div className="text-sm font-semibold text-[#7ec29a]">
                  Pułap bazowy osiągnięty! 🎯
                </div>
                {stats.overpaymentAnalysis.surplus > 0 ? (
                  <p className="text-xs text-[#9ee2b9] mt-0.5 font-mono">
                    Nadwyżka: +{stats.overpaymentAnalysis.surplus.toLocaleString('pl-PL')} zł
                  </p>
                ) : (
                  <p className="text-[11px] text-[#9e8f82] mt-0.5">
                    Wpłacono dokładnie ustalony pułap
                  </p>
                )}
                <p className="text-[10px] text-[#9e8f82] mt-0.5">
                  Wpłacono 5 000 zł (03.11.2026)
                </p>
              </div>
            ) : (
              <div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl sm:text-3xl font-light text-[#e6ab6e]">
                    {stats.overpaymentAnalysis.gap.toLocaleString('pl-PL')}
                  </span>
                  <span className="text-xs text-[#9e8f82]">zł</span>
                </div>
                <p className="text-[11px] text-[#e07a68] mt-0.5">
                  Brakuje do pułapu bazowego
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* GŁÓWNY PANEL: KALKULATOR WŁASNEGO TERMINU SPŁATY (NOWY TERMIN -> PRZELICZENIE NADPŁATY) */}
      <div className="p-6 sm:p-7 rounded-3xl border border-[#d99b5a]/40 bg-gradient-to-br from-[#1e1712]/95 via-[#18110c]/90 to-[#120e0a]/95 shadow-2xl relative overflow-hidden space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#2e231c]">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider bg-[#d99b5a]/20 text-[#f1c38e] border border-[#d99b5a]/40 flex items-center gap-1">
                <Calculator className="w-3 h-3 text-[#d99b5a]" />
                Kalkulator terminu spłaty (wprowadź własny termin)
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-light text-[#f5ede4]">
              Wybierz kiedy chcesz całkowicie zamknąć kredyt
            </h3>
            <p className="text-xs text-[#9e8f82]">
              Wprowadź docelowy rok i miesiąc, a system precyzyjnie obliczy wymaganą miesięczną nadpłatę oraz zaoszczędzone odsetki.
            </p>
          </div>

          {/* Szybkie skróty w latach */}
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-[#140f0c] border border-[#2e231c] text-xs self-start md:self-center flex-wrap">
            <button
              onClick={() => handleSetQuickTerm(5)}
              className="px-2.5 py-1 rounded-xl text-[#9e8f82] hover:text-[#f5ede4] hover:bg-[#251b14] transition-all font-mono"
            >
              5 lat (2031)
            </button>
            <button
              onClick={() => handleSetQuickTerm(7)}
              className="px-2.5 py-1 rounded-xl text-[#9e8f82] hover:text-[#f5ede4] hover:bg-[#251b14] transition-all font-mono"
            >
              7 lat (2033)
            </button>
            <button
              onClick={() => handleSetQuickTerm(10)}
              className="px-2.5 py-1 rounded-xl text-[#9e8f82] hover:text-[#f5ede4] hover:bg-[#251b14] transition-all font-mono"
            >
              10 lat (2036)
            </button>
            <button
              onClick={() => handleSetQuickTerm(15)}
              className="px-2.5 py-1 rounded-xl text-[#9e8f82] hover:text-[#f5ede4] hover:bg-[#251b14] transition-all font-mono"
            >
              15 lat (2041)
            </button>
          </div>
        </div>

        {/* Inputy wyboru docelowego terminu */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#140e0a]/90 border border-[#2e231c] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 text-xs font-mono text-[#c4b5a5]">
              <CalendarDays className="w-4 h-4 text-[#d99b5a]" />
              <span>Docelowy termin:</span>
            </div>

            {/* Miesiąc */}
            <select
              value={customTargetMonth}
              onChange={(e) => {
                setCustomTargetMonth(parseInt(e.target.value, 10));
              }}
              className="bg-[#1c140f] border border-[#382b20] focus:border-[#d99b5a] text-[#f5ede4] text-xs rounded-xl px-3 py-1.5 outline-none cursor-pointer"
            >
              {POLISH_MONTHS.map((m, idx) => (
                <option key={idx} value={idx + 1} className="bg-[#140f0c]">
                  {m}
                </option>
              ))}
            </select>

            {/* Rok */}
            <select
              value={customTargetYear}
              onChange={(e) => {
                setCustomTargetYear(parseInt(e.target.value, 10));
              }}
              className="bg-[#1c140f] border border-[#382b20] focus:border-[#d99b5a] text-[#f5ede4] text-xs font-mono rounded-xl px-3 py-1.5 outline-none cursor-pointer"
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

            <span className="text-xs text-[#9e8f82] font-mono">
              (za {stats.simCustom.yearsRemaining} lat {stats.simCustom.monthsRemainder} mies. • {stats.simCustom.monthsRemaining} rat)
            </span>
          </div>

          {/* Przycisk zastosowania jako cel bazowy */}
          {stats.simCustom.isValid && (
            <button
              onClick={handleApplyCustomOverpaymentAsTarget}
              className="flex items-center gap-2 px-4 py-2 bg-[#d99b5a] hover:bg-[#e6ab6e] text-[#120e0a] text-xs font-semibold rounded-xl shadow-lg transition-all active:scale-95 self-start md:self-center"
              title="Zapisz tę wyliczoną kwotę jako Twój stały miesięczny cel nadpłaty"
            >
              <Target className="w-3.5 h-3.5" />
              <span>Ustaw {Math.round(stats.simCustom.requiredMonthlyOverpayment).toLocaleString('pl-PL')} zł jako mój cel bazowy</span>
            </button>
          )}
        </div>

        {/* Wyniki kalkulacji dla wybranego terminu */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          <div className="p-4 rounded-2xl bg-[#140e0b] border border-[#2e231c] space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#7ec29a] block">
              Wymagana nadpłata miesięczna
            </span>
            <div className="text-2xl font-light text-[#7ec29a] font-mono">
              {stats.simCustom.requiredMonthlyOverpayment.toLocaleString('pl-PL', { minimumFractionDigits: 2 })} zł
            </div>
            <p className="text-[11px] text-[#9ee2b9]">
              Dodatkowo do raty każdego miesiąca
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#140e0b] border border-[#2e231c] space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#d99b5a] block">
              Łączny przelew co miesiąc
            </span>
            <div className="text-2xl font-light text-[#f5ede4] font-mono">
              {stats.simCustom.requiredTotalMonthly.toLocaleString('pl-PL', { minimumFractionDigits: 2 })} zł
            </div>
            <p className="text-[11px] text-[#9e8f82]">
              Rata {config.regularInstallment.toLocaleString('pl-PL')} zł + Nadpłata
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#140e0b] border border-[#d99b5a]/40 space-y-1 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#d99b5a] block">
                Szacunkowe łączne odsetki
              </span>
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#d99b5a]/20 text-[#f1c38e] font-mono">
                cały okres
              </span>
            </div>
            <div className="text-2xl font-light text-[#f5ede4] font-mono">
              ~{stats.simCustom.totalInterestOverall.toLocaleString('pl-PL')} zł
            </div>
            <p className="text-[11px] text-[#9e8f82]">
              {stats.simCustom.alreadyPaidInterest.toLocaleString('pl-PL')} zł spłacone • ~{stats.simCustom.totalInterestRemaining.toLocaleString('pl-PL')} zł pozostało
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#140e0b] border border-[#2e231c] space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#7ec29a] block">
              Oszczędność na odsetkach
            </span>
            <div className="text-2xl font-light text-[#7ec29a] font-mono">
              ~{stats.simCustom.totalInterestSaved.toLocaleString('pl-PL')} zł
            </div>
            <p className="text-[11px] text-[#9e8f82]">
              Zaoszczędzone vs ~{stats.simCustom.baselineTotalInterest.toLocaleString('pl-PL')} zł z umowy
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#140e0b] border border-[#2e231c] space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#f1c38e] block">
              Skrócenie umowy kredytowej
            </span>
            <div className="text-2xl font-light text-[#f1c38e] font-mono">
              o {stats.simCustom.yearsReduced} lat
            </div>
            <p className="text-[11px] text-[#9e8f82]">
              Spłata w {stats.simCustom.payoffDateFormatted} (zamiast 2055 r.)
            </p>
          </div>
        </div>

        {/* Wizualny pasek struktury łącznych kosztów i odsetek */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#140e0a]/90 border border-[#2e231c] space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
            <span className="text-[#c4b5a5]">
              Całkowity koszt kredytu (Kapitał + Łączne odsetki):{' '}
              <strong className="text-[#f5ede4] font-mono font-medium">
                ~{stats.simCustom.totalLoanCost.toLocaleString('pl-PL')} zł
              </strong>{' '}
              <span className="text-[#9e8f82]">
                (zamiast {(config.originalAmount + stats.simCustom.baselineTotalInterest).toLocaleString('pl-PL')} zł w standardzie)
              </span>
            </span>
            <span className="text-[#7ec29a] font-mono font-semibold">
              Oszczędzasz {Math.round((stats.simCustom.totalInterestSaved / stats.simCustom.baselineTotalInterest) * 100)}% wszystkich odsetek!
            </span>
          </div>

          {/* Kolorowy pasek podziału */}
          <div className="w-full h-2.5 rounded-full bg-[#1e1713] overflow-hidden flex border border-[#2e231c]/60">
            <div
              style={{ width: `${Math.max(2, (stats.simCustom.alreadyPaidInterest / stats.simCustom.baselineTotalInterest) * 100)}%` }}
              className="bg-[#d99b5a] h-full"
              title={`Spłacone dotychczas odsetki: ${stats.simCustom.alreadyPaidInterest.toLocaleString('pl-PL')} zł`}
            />
            <div
              style={{ width: `${Math.max(4, (stats.simCustom.totalInterestRemaining / stats.simCustom.baselineTotalInterest) * 100)}%` }}
              className="bg-[#e6ab6e]/70 h-full"
              title={`Pozostałe odsetki w tym planie: ~${stats.simCustom.totalInterestRemaining.toLocaleString('pl-PL')} zł`}
            />
            <div
              style={{ width: `${Math.max(8, (stats.simCustom.totalInterestSaved / stats.simCustom.baselineTotalInterest) * 100)}%` }}
              className="bg-[#7ec29a] h-full"
              title={`Zaoszczędzone odsetki: ~${stats.simCustom.totalInterestSaved.toLocaleString('pl-PL')} zł`}
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] text-[#9e8f82] font-mono">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#d99b5a]" />
              <span>Odsetki już spłacone: <strong className="text-[#f5ede4]">{stats.simCustom.alreadyPaidInterest.toLocaleString('pl-PL')} zł</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#e6ab6e]/70" />
              <span>Odsetki pozostałe do spłaty: <strong className="text-[#f5ede4]">~{stats.simCustom.totalInterestRemaining.toLocaleString('pl-PL')} zł</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#7ec29a]" />
              <span>Zaoszczędzone odsetki w kieszeni: <strong className="text-[#7ec29a]">~{stats.simCustom.totalInterestSaved.toLocaleString('pl-PL')} zł</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* DYNAMICZNY PANEL: MIESIĘCZNE ROZLICZENIE CELU I BILANS NA KOLEJNY MIESIĄC */}
      <div className="p-6 rounded-3xl border border-[#2e231c] glass-panel shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#2e231c]">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-medium text-[#f5ede4]">
                Rozliczenie spłat i bilans na kolejny miesiąc
              </h3>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono uppercase font-semibold ${
                stats.rollingReconciliation.nextMonthRecommendation.statusBadge === 'ahead'
                  ? 'bg-[#7ec29a]/20 text-[#9ee2b9] border border-[#7ec29a]/30'
                  : stats.rollingReconciliation.nextMonthRecommendation.statusBadge === 'on_track'
                  ? 'bg-[#d99b5a]/20 text-[#f1c38e] border border-[#d99b5a]/30'
                  : 'bg-[#e07a68]/20 text-[#f19b8c] border border-[#e07a68]/30'
              }`}>
                {stats.rollingReconciliation.nextMonthRecommendation.statusBadge === 'ahead'
                  ? '✓ Wyprzedzasz cel (Nadwyżka)'
                  : stats.rollingReconciliation.nextMonthRecommendation.statusBadge === 'on_track'
                  ? '✓ Trzymasz się celu'
                  : '⚠️ Wymagana dopłata wyrównująca'}
              </span>
            </div>
            <p className="text-xs text-[#9e8f82]">
              Na koniec miesiąca podajesz ile finalnie wpłaciłeś, a system wylicza rekomendację na kolejny okres
            </p>
          </div>

          <button
            onClick={() => {
              setPaymentRegular(String(config.regularInstallment));
              setIsAddPaymentOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-semibold bg-[#2a1e16] hover:bg-[#382b20] text-[#f1c38e] border border-[#d99b5a]/30 transition-all active:scale-95 self-start sm:self-center"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Wprowadź kwotę z końca miesiąca</span>
          </button>
        </div>

        {/* 2 Kolumny: Bilans obecnego miesiąca vs Zalecenia na kolejny miesiąc */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Kolumna 1: Stan bieżącego miesiąca (Listopad 2026) */}
          <div className="p-4 rounded-2xl bg-[#140e0a] border border-[#2e231c] space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#2e231c]/60">
              <span className="font-mono text-[#9e8f82]">Bieżący miesiąc: <strong>{stats.rollingReconciliation.currentMonthItem.monthName}</strong></span>
              <span className="text-[11px] font-mono text-[#7ec29a] font-semibold">
                {stats.rollingReconciliation.currentMonthItem.diff >= 0 ? `+${stats.rollingReconciliation.currentMonthItem.diff.toLocaleString('pl-PL')} zł` : `${stats.rollingReconciliation.currentMonthItem.diff.toLocaleString('pl-PL')} zł`}
              </span>
            </div>

            <div className="space-y-1.5 font-mono">
              <div className="flex justify-between text-[#c4b5a5]">
                <span>Ustalony cel nadpłaty:</span>
                <span className="text-[#f5ede4]">{stats.rollingReconciliation.currentMonthItem.targetOverpayment.toLocaleString('pl-PL')} zł</span>
              </div>
              <div className="flex justify-between text-[#c4b5a5]">
                <span>Faktycznie nadpłacono dotychczas:</span>
                <span className="text-[#7ec29a] font-semibold">{stats.rollingReconciliation.currentMonthItem.actualOverpayment.toLocaleString('pl-PL')} zł</span>
              </div>
              <div className="flex justify-between text-[#c4b5a5]">
                <span>Rata podstawowa banku:</span>
                <span className="text-[#f5ede4]">{config.regularInstallment.toLocaleString('pl-PL')} zł</span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-[#1e1713] border border-[#2e231c] text-[11px] text-[#c4b5a5] leading-relaxed">
              💡 {stats.rollingReconciliation.nextMonthRecommendation.guidanceText}
            </div>
          </div>

          {/* Kolumna 2: Rekomendacja na kolejny miesiąc (Grudzień 2026 / kolejny termin) */}
          <div className="p-4 rounded-2xl bg-[#140e0a] border border-[#2e231c] space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#2e231c]/60">
              <span className="font-mono text-[#9e8f82]">Plan na kolejną płatność:</span>
              <span className="text-[11px] font-mono text-[#d99b5a]">Termin: {nextPaymentInfo.dateString}</span>
            </div>

            <div className="space-y-1.5 font-mono">
              <div className="flex justify-between text-[#c4b5a5]">
                <span>Rata regularna banku:</span>
                <span className="text-[#f5ede4]">{config.regularInstallment.toLocaleString('pl-PL')} zł</span>
              </div>
              <div className="flex justify-between text-[#c4b5a5]">
                <span>Bazowa nadpłata kapitału:</span>
                <span className="text-[#f1c38e]">{config.targetMonthlyOverpayment.toLocaleString('pl-PL')} zł</span>
              </div>
              {stats.rollingReconciliation.nextMonthRecommendation.carryoverFromPrevious !== 0 && (
                <div className="flex justify-between text-[#c4b5a5]">
                  <span>Rozliczenie nadwyżki / zaległości:</span>
                  <span className={stats.rollingReconciliation.nextMonthRecommendation.carryoverFromPrevious > 0 ? 'text-[#7ec29a]' : 'text-[#e07a68]'}>
                    {stats.rollingReconciliation.nextMonthRecommendation.carryoverFromPrevious > 0
                      ? `-${stats.rollingReconciliation.nextMonthRecommendation.carryoverFromPrevious.toLocaleString('pl-PL')} zł (zaliczka)`
                      : `+${Math.abs(stats.rollingReconciliation.nextMonthRecommendation.carryoverFromPrevious).toLocaleString('pl-PL')} zł (dopłata)`}
                  </span>
                </div>
              )}
              <div className="pt-2 border-t border-[#2e231c] flex justify-between text-sm font-semibold text-[#f5ede4]">
                <span>Zalecany łączny przelew:</span>
                <span className="text-[#f1c38e]">{stats.overpaymentAnalysis.suggestedTotalTransfer.toLocaleString('pl-PL')} zł</span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-[#1e1713] border border-[#2e231c] text-[11px] text-[#9e8f82] flex items-center justify-between gap-2">
              <div className="truncate">
                <span>Rachunek Pekao: </span>
                <strong className="text-[#f5ede4] font-mono">{config.accountNumber}</strong>
              </div>
              <button
                type="button"
                onClick={handleCopyAccount}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-medium bg-[#2a1e16] hover:bg-[#382b20] text-[#f1c38e] border border-[#d99b5a]/30 transition-all active:scale-95 shrink-0"
                title="Kopiuj numer konta"
              >
                {copiedAccount ? <Check className="w-3 h-3 text-[#7ec29a]" /> : <Copy className="w-3 h-3" />}
                <span>{copiedAccount ? 'Skopiowano!' : 'Kopiuj'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* PORÓWNANIE WARIANTÓW SPŁATY I ŁĄCZNYCH ODSETEK DLA USTAWIONYCH PARAMETRÓW */}
      <div className="p-6 rounded-3xl border border-[#2e231c] glass-panel shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#2e231c]">
          <div>
            <h3 className="text-base font-medium text-[#f5ede4] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#d99b5a]" />
              Szacunkowe łączne odsetki w zależności od parametrów
            </h3>
            <p className="text-xs text-[#9e8f82] mt-0.5">
              Porównanie całkowitych odsetek zapłaconych bankowi w pełnym cyklu życia kredytu dla 3 strategii
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {/* Wariant 1: Bez nadpłat (harmonogram bankowy) */}
          <div className="p-4 rounded-2xl bg-[#140e0a] border border-[#2e231c] space-y-3 flex flex-col justify-between">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#9e8f82]">Wariant 1: Bankowy</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#2e231c] text-[#9e8f82]">Brak nadpłat</span>
              </div>
              <h4 className="text-sm font-medium text-[#f5ede4]">Harmonogram umowy (30 lat)</h4>
              <p className="text-[11px] text-[#9e8f82]">Tylko standardowa rata bankowa {config.regularInstallment.toLocaleString('pl-PL')} zł/mc do 2055 r.</p>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-[#2e231c]/60 text-xs font-mono">
              <div className="flex justify-between text-[#c4b5a5]">
                <span>Łączne odsetki:</span>
                <strong className="text-[#e07a68]">~{stats.simPastOnly.baselineTotalInterest.toLocaleString('pl-PL')} zł</strong>
              </div>
              <div className="flex justify-between text-[#c4b5a5]">
                <span>Pozostało odsetek:</span>
                <span className="text-[#f5ede4]">~{(stats.simPastOnly.baselineTotalInterest - stats.simPastOnly.alreadyPaidInterest).toLocaleString('pl-PL')} zł</span>
              </div>
              <div className="flex justify-between text-[#c4b5a5]">
                <span>Termin spłaty:</span>
                <span className="text-[#9e8f82]">Listopad 2055 r.</span>
              </div>
              <div className="flex justify-between text-[#c4b5a5]">
                <span>Oszczędność:</span>
                <span className="text-[#9e8f82]">0 zł (baza)</span>
              </div>
            </div>
          </div>

          {/* Wariant 2: Twój stały cel bazowy */}
          <div className="p-4 rounded-2xl bg-[#140e0a] border border-[#2e231c] space-y-3 flex flex-col justify-between">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#d99b5a]">Wariant 2: Twój cel</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#d99b5a]/20 text-[#f1c38e]">Aktywny cel</span>
              </div>
              <h4 className="text-sm font-medium text-[#f5ede4]">Stały pułap {config.targetMonthlyOverpayment.toLocaleString('pl-PL')} zł/mc</h4>
              <p className="text-[11px] text-[#9e8f82]">Łączny przelew {(config.regularInstallment + config.targetMonthlyOverpayment).toLocaleString('pl-PL')} zł każdego miesiąca</p>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-[#2e231c]/60 text-xs font-mono">
              <div className="flex justify-between text-[#c4b5a5]">
                <span>Łączne odsetki:</span>
                <strong className="text-[#7ec29a]">~{stats.simTarget.totalInterestOverall.toLocaleString('pl-PL')} zł</strong>
              </div>
              <div className="flex justify-between text-[#c4b5a5]">
                <span>Pozostało odsetek:</span>
                <span className="text-[#f5ede4]">~{stats.simTarget.totalInterestRemaining.toLocaleString('pl-PL')} zł</span>
              </div>
              <div className="flex justify-between text-[#c4b5a5]">
                <span>Termin spłaty:</span>
                <span className="text-[#f1c38e]">{stats.simTarget.payoffDateFormatted} ({stats.simTarget.yearsRemaining} l. {stats.simTarget.monthsRemainder} m.)</span>
              </div>
              <div className="flex justify-between text-[#c4b5a5]">
                <span>Oszczędność odsetek:</span>
                <span className="text-[#7ec29a] font-semibold">~{stats.simTarget.totalInterestSaved.toLocaleString('pl-PL')} zł</span>
              </div>
            </div>
          </div>

          {/* Wariant 3: Wybrany termin w kalkulatorze */}
          <div className="p-4 rounded-2xl bg-[#140e0a] border border-[#d99b5a]/40 space-y-3 flex flex-col justify-between relative overflow-hidden">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#7ec29a]">Wariant 3: Własny termin</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#7ec29a]/20 text-[#9ee2b9]">Ustawiany termin</span>
              </div>
              <h4 className="text-sm font-medium text-[#f5ede4]">Spłata do {stats.simCustom.payoffDateFormatted}</h4>
              <p className="text-[11px] text-[#9e8f82]">Wymaga nadpłaty {stats.simCustom.requiredMonthlyOverpayment.toLocaleString('pl-PL')} zł/mc</p>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-[#2e231c]/60 text-xs font-mono">
              <div className="flex justify-between text-[#c4b5a5]">
                <span>Łączne odsetki:</span>
                <strong className="text-[#7ec29a]">~{stats.simCustom.totalInterestOverall.toLocaleString('pl-PL')} zł</strong>
              </div>
              <div className="flex justify-between text-[#c4b5a5]">
                <span>Pozostało odsetek:</span>
                <span className="text-[#f5ede4]">~{stats.simCustom.totalInterestRemaining.toLocaleString('pl-PL')} zł</span>
              </div>
              <div className="flex justify-between text-[#c4b5a5]">
                <span>Termin spłaty:</span>
                <span className="text-[#f1c38e]">{stats.simCustom.payoffDateFormatted} (za {stats.simCustom.yearsRemaining} l. {stats.simCustom.monthsRemainder} m.)</span>
              </div>
              <div className="flex justify-between text-[#c4b5a5]">
                <span>Oszczędność odsetek:</span>
                <span className="text-[#7ec29a] font-semibold">~{stats.simCustom.totalInterestSaved.toLocaleString('pl-PL')} zł</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabela / Historia Wpłat i Nadpłat z podsumowaniem Banku Pekao */}
      <div className="glass-panel rounded-3xl border border-[#2e231c] overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-[#2e231c] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-medium text-[#f5ede4]">
                Historia operacji i spłat kredytu (Bank Pekao)
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-[#d99b5a]/20 text-[#f1c38e] border border-[#d99b5a]/30">
                {payments.length} wpisów
              </span>
            </div>
            <p className="text-xs text-[#9e8f82] mt-0.5">
              Pełny rejestr rat równych oraz spłat kapitału zgodnie z wyciągiem mobilnym
            </p>
          </div>

          <button
            onClick={() => {
              setPaymentRegular(String(config.regularInstallment));
              setIsAddPaymentOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#d99b5a] hover:bg-[#e6ab6e] text-[#120e0a] rounded-2xl text-xs font-semibold shadow-md transition-all active:scale-95 self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Dodaj wpłatę</span>
          </button>
        </div>

        {/* 4 Plakietki podsumowania salda z aplikacji Pekao */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 p-4 bg-[#140e0b] border-b border-[#2e231c] text-xs font-mono">
          <div className="p-2.5 rounded-xl bg-[#1c140f] border border-[#2e231c]">
            <span className="text-[10px] uppercase text-[#9e8f82] block">Pozostały kapitał:</span>
            <span className="text-sm font-semibold text-[#f5ede4]">
              {(config.currentRemainingCapital || 568843.28).toLocaleString('pl-PL', { minimumFractionDigits: 2 })} zł
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-[#1c140f] border border-[#2e231c]">
            <span className="text-[10px] uppercase text-[#9e8f82] block">Kapitał spłacony:</span>
            <span className="text-sm font-semibold text-[#7ec29a]">
              55 186,19 zł
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-[#1c140f] border border-[#2e231c]">
            <span className="text-[10px] uppercase text-[#9e8f82] block">Odsetki spłacone:</span>
            <span className="text-sm font-semibold text-[#e6ab6e]">
              32 833,09 zł
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-[#1c140f] border border-[#2e231c]">
            <span className="text-[10px] uppercase text-[#9e8f82] block">Suma nadpłat kapitału:</span>
            <span className="text-sm font-semibold text-[#f1c38e]">
              {stats.totalOverpaid.toLocaleString('pl-PL', { minimumFractionDigits: 2 })} zł
            </span>
          </div>
        </div>

        {payments.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#9e8f82]">
            Brak historii wpłat. Kliknij „Dodaj wpłatę”, aby zarejestrować ratę lub nadpłatę.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#140e0b] border-b border-[#2e231c] text-[#9e8f82] font-mono uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">Data operacji</th>
                  <th className="py-3 px-4">Typ operacji</th>
                  <th className="py-3 px-4">Rata podstawowa</th>
                  <th className="py-3 px-4 text-[#7ec29a]">Spłata kapitału (nadpłata)</th>
                  <th className="py-3 px-4">Łącznie</th>
                  <th className="py-3 px-4">Uwagi</th>
                  <th className="py-3 px-4 text-right">Akcje</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2e231c]/60">
                {payments.map((p) => {
                  const total = (p.regularInstallment || 0) + (p.overpayment || 0);
                  const isOverpaymentOnly = (p.regularInstallment || 0) === 0 && (p.overpayment || 0) > 0;
                  const isRegularOnly = (p.regularInstallment || 0) > 0 && (p.overpayment || 0) === 0;

                  return (
                    <tr key={p.id} className="hover:bg-[#1a1410]/50 transition-colors">
                      <td className="py-3 px-4 font-mono text-[#f5ede4]">
                        {p.date}
                      </td>
                      <td className="py-3 px-4">
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
                      <td className="py-3 px-4 text-[#c4b5a5]">
                        {p.regularInstallment && p.regularInstallment > 0
                          ? `${p.regularInstallment.toLocaleString('pl-PL', { minimumFractionDigits: 2 })} zł`
                          : '—'}
                      </td>
                      <td className="py-3 px-4 font-medium text-[#7ec29a]">
                        {p.overpayment && p.overpayment > 0
                          ? `+${p.overpayment.toLocaleString('pl-PL', { minimumFractionDigits: 2 })} zł`
                          : '—'}
                      </td>
                      <td className="py-3 px-4 font-semibold text-[#f5ede4] font-mono">
                        {total.toLocaleString('pl-PL', { minimumFractionDigits: 2 })} zł
                      </td>
                      <td className="py-3 px-4 text-[#9e8f82] max-w-xs truncate">
                        {p.notes || '—'}
                      </td>
                      <td className="py-3 px-4 text-right">
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
          </div>
        )}
      </div>

      {/* MODAL: DODAJ NOWĄ WPŁATĘ / ROZLICZENIE KOŃCA MIESIĄCA */}
      {isAddPaymentOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md glass-panel rounded-3xl p-6 border border-[#3d2c20] shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-[#2e231c]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-2xl bg-[#d99b5a]/15 border border-[#d99b5a]/30 flex items-center justify-center text-[#d99b5a]">
                  <Plus className="w-4 h-4" />
                </div>
                <h3 className="text-base font-light text-[#f5ede4]">
                  Zarejestruj wpłatę / rozliczenie miesiąca
                </h3>
              </div>
              <button onClick={() => setIsAddPaymentOpen(false)} className="text-[#9e8f82] hover:text-[#f5ede4]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddPayment} className="space-y-4 pt-4">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[#9e8f82] mb-1">
                  Data pobrania / wpłaty *
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
                  Notatka / Uwagi (opcjonalnie)
                </label>
                <input
                  type="text"
                  placeholder="np. Spłata kapitału na koniec miesiąca"
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

      {/* MODAL: EDYCJA PARAMETRÓW KREDYTU */}
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
                    Kwota zaciągnięta (zł)
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
                    Aktualny kapitał (zł)
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
                    Rata regularna banku (zł)
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-[#7ec29a] mb-1">
                    Bazowy pułap nadpłaty (zł/mc)
                  </label>
                  <input
                    type="number"
                    value={tempConfig.targetMonthlyOverpayment}
                    onChange={(e) => setTempConfig({ ...tempConfig, targetMonthlyOverpayment: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-[#120e0a] border border-[#7ec29a]/40 focus:border-[#7ec29a] rounded-xl px-3 py-2 text-xs text-[#f5ede4] outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-[#9e8f82] mb-1">
                    Okres kredytu (miesiące)
                  </label>
                  <input
                    type="number"
                    value={tempConfig.loanTermMonths}
                    onChange={(e) => setTempConfig({ ...tempConfig, loanTermMonths: parseInt(e.target.value, 10) || 360 })}
                    className="w-full bg-[#120e0a] border border-[#382b20] focus:border-[#d99b5a] rounded-xl px-3 py-2 text-xs text-[#f5ede4] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[#9e8f82] mb-1">
                  Numer rachunku do nadpłat
                </label>
                <input
                  type="text"
                  placeholder="np. PL 00 0000 0000 0000 0000 0000 0000"
                  value={tempConfig.accountNumber || ''}
                  onChange={(e) => setTempConfig({ ...tempConfig, accountNumber: e.target.value })}
                  className="w-full bg-[#120e0a] border border-[#382b20] focus:border-[#d99b5a] rounded-xl px-3 py-2 text-xs text-[#f5ede4] outline-none font-mono"
                />
              </div>

              {/* Dynamiczny podgląd łącznych odsetek dla ustawianych parametrów */}
              <div className="p-3.5 rounded-2xl bg-[#140e0b] border border-[#d99b5a]/30 space-y-2 text-xs font-mono">
                <div className="flex items-center justify-between text-[#d99b5a]">
                  <span className="text-[10px] uppercase tracking-wider font-semibold">
                    Dynamiczny podgląd łącznych odsetek (na żywo):
                  </span>
                  <span className="text-[10px] text-[#9e8f82]">
                    Stopa: {tempConfig.interestRate}%
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2 rounded-xl bg-[#1c140f] border border-[#2e231c]">
                    <span className="text-[10px] text-[#9e8f82] block">Bez nadpłat (bank):</span>
                    <strong className="text-[#e07a68]">~{liveSimModal.baselineTotalInterest.toLocaleString('pl-PL')} zł</strong>
                  </div>
                  <div className="p-2 rounded-xl bg-[#1c140f] border border-[#7ec29a]/30">
                    <span className="text-[10px] text-[#7ec29a] block">Z Twoją nadpłatą ({tempConfig.targetMonthlyOverpayment.toLocaleString('pl-PL')} zł):</span>
                    <strong className="text-[#7ec29a]">~{liveSimModal.totalInterestOverall.toLocaleString('pl-PL')} zł</strong>
                  </div>
                </div>
                <div className="flex justify-between items-center text-[11px] text-[#c4b5a5] pt-1 border-t border-[#2e231c]">
                  <span>Szacunkowa oszczędność na odsetkach:</span>
                  <strong className="text-[#7ec29a] font-semibold">~{liveSimModal.totalInterestSaved.toLocaleString('pl-PL')} zł (o {liveSimModal.yearsReduced} lat szybciej)</strong>
                </div>
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
