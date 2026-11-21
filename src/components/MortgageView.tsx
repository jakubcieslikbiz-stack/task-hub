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
  Clock,
  Sparkles,
  TrendingDown,
  ShieldCheck,
} from 'lucide-react';

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

  // Quick edit target overpayment modal
  const [isEditingTarget, setIsEditingTarget] = useState(false);
  const [tempTarget, setTempTarget] = useState(String(config.targetMonthlyOverpayment));

  // Aktywny widok scenariusza symulacji
  const [selectedScenario, setSelectedScenario] = useState<'average' | 'target' | 'past_only'>('average');

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

    return {
      averageOverpayment,
      totalOverpaid,
      overpaymentThisMonth,
      overpaymentAnalysis,
      savings,
      simPastOnly,
      simAverage,
      simTarget,
    };
  }, [payments, config, currentYm]);

  // Kopiowanie numeru subkonta
  const handleCopyAccount = () => {
    if (!config.accountNumber) return;
    navigator.clipboard.writeText(config.accountNumber.replace(/\s+/g, ''));
    setCopiedAccount(true);
    showToast('Skopiowano numer rachunku do schowka!');
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

  const activeSimulation =
    selectedScenario === 'average'
      ? stats.simAverage
      : selectedScenario === 'target'
      ? stats.simTarget
      : stats.simPastOnly;

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
              Rata regularna bankowa: <strong className="text-[#f5ede4] font-medium">{config.regularInstallment.toLocaleString('pl-PL')} zł</strong> • Kapitał początkowy: <strong className="text-[#f5ede4] font-medium">{config.originalAmount.toLocaleString('pl-PL')} zł</strong> • Rachunek: <span className="font-mono text-[#d99b5a]">{config.accountNumber}</span>
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
              Kwota najbliższej spłaty: <strong className="text-[#f5ede4]">{config.regularInstallment.toLocaleString('pl-PL')} zł</strong>
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

      {/* GŁÓWNY PANEL: PROGNOZA TERMINU SPŁATY I OSZCZĘDNOŚCI (AMORTYZACJA PEKAO) */}
      <div className="p-6 sm:p-7 rounded-3xl border border-[#d99b5a]/40 bg-gradient-to-br from-[#1e1712]/95 via-[#18110c]/90 to-[#120e0a]/95 shadow-2xl relative overflow-hidden space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#2e231c]">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider bg-[#d99b5a]/20 text-[#f1c38e] border border-[#d99b5a]/40 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-[#d99b5a]" />
                Kalkulator terminu spłaty i oszczędności odsetkowych
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-light text-[#f5ede4]">
              Prognoza całkowitej spłaty kredytu: <strong className="font-semibold text-[#f1c38e]">{activeSimulation.payoffDateFormatted}</strong>
            </h3>
            <p className="text-xs text-[#9e8f82]">
              Zamiast planowanego harmonogramu bazowego: <strong>Grudzień 2055</strong> (skrócenie o <strong>{activeSimulation.yearsReduced} lat</strong>!)
            </p>
          </div>

          {/* Wybór scenariusza */}
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-[#140f0c] border border-[#2e231c] text-xs self-start md:self-center">
            <button
              onClick={() => setSelectedScenario('average')}
              className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
                selectedScenario === 'average'
                  ? 'bg-[#d99b5a] text-[#120e0a] shadow-sm'
                  : 'text-[#9e8f82] hover:text-[#f5ede4]'
              }`}
            >
              Średnia nadpłata ({stats.averageOverpayment} zł)
            </button>
            <button
              onClick={() => setSelectedScenario('target')}
              className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
                selectedScenario === 'target'
                  ? 'bg-[#d99b5a] text-[#120e0a] shadow-sm'
                  : 'text-[#9e8f82] hover:text-[#f5ede4]'
              }`}
            >
              Cel bazowy ({config.targetMonthlyOverpayment} zł)
            </button>
            <button
              onClick={() => setSelectedScenario('past_only')}
              className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
                selectedScenario === 'past_only'
                  ? 'bg-[#d99b5a] text-[#120e0a] shadow-sm'
                  : 'text-[#9e8f82] hover:text-[#f5ede4]'
              }`}
            >
              Tylko obecny stan (0 zł nadpłat)
            </button>
          </div>
        </div>

        {/* 3 Kluczowe wskaźniki wybranego scenariusza */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-[#140e0a]/90 border border-[#2e231c] space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#9e8f82] flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#d99b5a]" />
              Pozostały czas do spłaty
            </span>
            <div className="text-2xl font-light text-[#f5ede4] font-mono">
              {activeSimulation.yearsRemaining} lat {activeSimulation.monthsRemainder} mies.
            </div>
            <p className="text-[11px] text-[#7ec29a]">
              Zaledwie {activeSimulation.monthsRemaining} rat miesięcznych
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#140e0a]/90 border border-[#2e231c] space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#9e8f82] flex items-center gap-1.5">
              <TrendingDown className="w-3.5 h-3.5 text-[#7ec29a]" />
              Zaoszczędzone odsetki bankowe
            </span>
            <div className="text-2xl font-light text-[#7ec29a] font-mono">
              {activeSimulation.totalInterestSaved.toLocaleString('pl-PL')} zł
            </div>
            <p className="text-[11px] text-[#9ee2b9]">
              Tyle pieniędzy zostaje w Twojej kieszeni!
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#140e0a]/90 border border-[#2e231c] space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#9e8f82] flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#f1c38e]" />
              Skrócenie umowy kredytowej
            </span>
            <div className="text-2xl font-light text-[#f1c38e] font-mono">
              o {activeSimulation.yearsReduced} lat ({activeSimulation.monthsReduced} mies.)
            </div>
            <p className="text-[11px] text-[#9e8f82]">
              Koniec w {activeSimulation.payoffDateFormatted} zamiast 2055 r.
            </p>
          </div>
        </div>

        {/* Porównanie 3 wariantów w zwięzłej tabelce */}
        <div className="pt-2">
          <div className="text-xs font-medium text-[#c4b5a5] mb-2">
            Porównanie wariantów spłaty kredytu:
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
            <div
              onClick={() => setSelectedScenario('average')}
              className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                selectedScenario === 'average'
                  ? 'bg-[#2a1e16] border-[#d99b5a]/60 ring-1 ring-[#d99b5a]/30'
                  : 'bg-[#140f0c] border-[#2e231c] hover:border-[#382b20]'
              }`}
            >
              <div className="font-semibold text-[#f1c38e] mb-1">
                ⚡ Średnia nadpłata (+{stats.averageOverpayment} zł/mc)
              </div>
              <div className="text-[#f5ede4]">Spłata: <strong>{stats.simAverage.payoffDateFormatted}</strong></div>
              <div className="text-[#9e8f82]">Czas: {stats.simAverage.yearsRemaining} lat {stats.simAverage.monthsRemainder} mies.</div>
              <div className="text-[#7ec29a] font-semibold mt-1">Zaoszczędzisz: {stats.simAverage.totalInterestSaved.toLocaleString('pl-PL')} zł</div>
            </div>

            <div
              onClick={() => setSelectedScenario('target')}
              className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                selectedScenario === 'target'
                  ? 'bg-[#2a1e16] border-[#d99b5a]/60 ring-1 ring-[#d99b5a]/30'
                  : 'bg-[#140f0c] border-[#2e231c] hover:border-[#382b20]'
              }`}
            >
              <div className="font-semibold text-[#7ec29a] mb-1">
                🎯 Twój cel bazowy (+{config.targetMonthlyOverpayment} zł/mc)
              </div>
              <div className="text-[#f5ede4]">Spłata: <strong>{stats.simTarget.payoffDateFormatted}</strong></div>
              <div className="text-[#9e8f82]">Czas: {stats.simTarget.yearsRemaining} lat {stats.simTarget.monthsRemainder} mies.</div>
              <div className="text-[#7ec29a] font-semibold mt-1">Zaoszczędzisz: {stats.simTarget.totalInterestSaved.toLocaleString('pl-PL')} zł</div>
            </div>

            <div
              onClick={() => setSelectedScenario('past_only')}
              className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                selectedScenario === 'past_only'
                  ? 'bg-[#2a1e16] border-[#d99b5a]/60 ring-1 ring-[#d99b5a]/30'
                  : 'bg-[#140f0c] border-[#2e231c] hover:border-[#382b20]'
              }`}
            >
              <div className="font-semibold text-[#9e8f82] mb-1">
                🛡️ Bez kolejnych nadpłat (tylko to co wpłacono)
              </div>
              <div className="text-[#f5ede4]">Spłata: <strong>{stats.simPastOnly.payoffDateFormatted}</strong></div>
              <div className="text-[#9e8f82]">Czas: {stats.simPastOnly.yearsRemaining} lat {stats.simPastOnly.monthsRemainder} mies.</div>
              <div className="text-[#7ec29a] font-semibold mt-1">Już zyskałeś: {stats.simPastOnly.totalInterestSaved.toLocaleString('pl-PL')} zł</div>
            </div>
          </div>
        </div>
      </div>

      {/* Rekomendacja Przelewu na Koniec Miesiąca */}
      <div className="p-6 rounded-3xl border border-[#2e231c] glass-panel shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider bg-[#d99b5a]/20 text-[#f1c38e] border border-[#d99b5a]/40">
                Plan najbliższego przelewu
              </span>
              <span className="text-xs text-[#9e8f82] font-mono">
                Termin: {nextPaymentInfo.dateString} (30 listopada 2026)
              </span>
            </div>

            <h3 className="text-xl sm:text-2xl font-light text-[#f5ede4]">
              Rekomendowany przelew na koniec miesiąca: <strong className="font-semibold text-[#f1c38e]">{stats.overpaymentAnalysis.suggestedTotalTransfer.toLocaleString('pl-PL')} zł</strong>
            </h3>

            <p className="text-xs text-[#c4b5a5] max-w-2xl leading-relaxed">
              {stats.overpaymentAnalysis.gap > 0 ? (
                <>
                  Aby utrzymać Twój <strong>pułap bazowy ({config.targetMonthlyOverpayment.toLocaleString('pl-PL')} zł)</strong>, przy najbliższym pobraniu raty należy przelać <strong>{config.regularInstallment.toLocaleString('pl-PL')} zł</strong> raty bankowej oraz <strong>{stats.overpaymentAnalysis.gap.toLocaleString('pl-PL')} zł</strong> brakującej nadpłaty.
                </>
              ) : (
                <>
                  Świetnie! W listopadzie pułap nadpłaty został już w całości zrealizowany (dnia 03.11.2026 wpłaciłeś <strong>5 000,00 zł</strong> nadpłaty kapitału, uzyskując <strong>+{stats.overpaymentAnalysis.surplus.toLocaleString('pl-PL')} zł nadwyżki</strong>). Na dzień 30 listopada wystarczy przelać samą standardową ratę <strong>{config.regularInstallment.toLocaleString('pl-PL')} zł</strong>.
                </>
              )}
            </p>

            {/* Pasek postępu pułapu nadpłaty w tym miesiącu */}
            <div className="pt-2 max-w-lg">
              <div className="flex items-center justify-between text-xs text-[#9e8f82] mb-1 font-mono">
                <span>Postęp pułapu w tym miesiącu:</span>
                <span className="text-[#f5ede4]">
                  {stats.overpaymentThisMonth.toLocaleString('pl-PL')} / {config.targetMonthlyOverpayment.toLocaleString('pl-PL')} zł ({stats.overpaymentAnalysis.progressPercent}%)
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-[#120e0a] overflow-hidden border border-[#2e231c]">
                <div
                  className="h-full bg-gradient-to-r from-[#d99b5a] to-[#7ec29a] transition-all duration-500 rounded-full"
                  style={{ width: `${Math.min(100, stats.overpaymentAnalysis.progressPercent)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Box konta do przelewu */}
          <div className="p-4 rounded-2xl bg-[#120e0a]/80 border border-[#2e231c] flex flex-col justify-between gap-3 min-w-[280px]">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#9e8f82]">
              Rachunek kredytowy do spłat (Pekao):
            </span>
            <div className="font-mono text-xs text-[#f5ede4] break-all bg-[#1a1410] p-2.5 rounded-xl border border-[#2e231c]">
              {config.accountNumber || 'Brak wpisanego numeru subkonta'}
            </div>
            <button
              onClick={handleCopyAccount}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-[#2a1e16] hover:bg-[#382b20] text-[#f1c38e] border border-[#d99b5a]/30 transition-all active:scale-95"
            >
              {copiedAccount ? <Check className="w-3.5 h-3.5 text-[#7ec29a]" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedAccount ? 'Skopiowano!' : 'Kopiuj numer konta'}</span>
            </button>
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

        {/* 3 Plakietki podsumowania salda z aplikacji Pekao */}
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

      {/* MODAL: DODAJ NOWĄ WPŁATĘ / NADPŁATĘ */}
      {isAddPaymentOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md glass-panel rounded-3xl p-6 border border-[#3d2c20] shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-[#2e231c]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-2xl bg-[#d99b5a]/15 border border-[#d99b5a]/30 flex items-center justify-center text-[#d99b5a]">
                  <Plus className="w-4 h-4" />
                </div>
                <h3 className="text-base font-light text-[#f5ede4]">
                  Zarejestruj spłatę raty / nadpłatę
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
                  placeholder="np. Spłata kapitału (nadpłata)"
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
