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
} from 'lucide-react';

export const MortgageView: React.FC = () => {
  const [config, setConfig] = useState<MortgageConfig>(() => getStoredMortgageConfig());
  const [payments, setPayments] = useState<MortgagePaymentRecord[]>(() => getStoredMortgagePayments());

  // Modal: Zarejestruj wpłatę / nadpłatę
  const [isAddPaymentOpen, setIsAddPaymentOpen] = useState(false);
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [paymentRegular, setPaymentRegular] = useState(String(config.regularInstallment));
  const [paymentOverpayment, setPaymentOverpayment] = useState('3000');
  const [paymentNotes, setPaymentNotes] = useState('');

  // Modal: Edycja parametrów kredytu
  const [isEditConfigOpen, setIsEditConfigOpen] = useState(false);
  const [tempConfig, setTempConfig] = useState<MortgageConfig>(config);

  // Quick edit target overpayment modal
  const [isEditingTarget, setIsEditingTarget] = useState(false);
  const [tempTarget, setTempTarget] = useState(String(config.targetMonthlyOverpayment));

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

    const savings = estimateMortgageSavings(totalOverpaid, config.interestRate, config.regularInstallment);

    return {
      averageOverpayment,
      totalOverpaid,
      overpaymentThisMonth,
      overpaymentAnalysis,
      savings,
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
      id: `pay-${Date.now()}`,
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
    showToast(`Zarejestrowano spłatę z nadpłatą ${overpaymentNum.toLocaleString('pl-PL')} zł!`);
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
              Rata regularna bankowa: <strong className="text-[#f5ede4] font-medium">{config.regularInstallment.toLocaleString('pl-PL')} zł</strong> • Kapitał początkowy: <strong className="text-[#f5ede4] font-medium">{config.originalAmount.toLocaleString('pl-PL')} zł</strong>
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
        {/* Karta 1: Najbliższa płatność (z obsługą świąt i weekendów) */}
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
                <span>Przesunięto na 1./2. dzień roboczy miesiąca</span>
              </p>
            )}
            <p className="text-[11px] text-[#9e8f82] mt-1">
              Pobranie raty na koniec miesiąca
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
              Średnia ze wszystkich wpłat w historii
            </p>
          </div>
        </div>

        {/* Karta 4: Bilans bieżącego miesiąca (Do dopłacenia / Nadwyżka) */}
        <div className="glass-panel p-4 rounded-3xl border border-[#2e231c] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#9e8f82] flex items-center gap-1.5">
              <PiggyBank className="w-3.5 h-3.5 text-[#d99b5a]" />
              Stan na ten miesiąc
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

      {/* Rekomendacja Przelewu na Koniec Miesiąca (Główny panel asystenta spłat) */}
      <div className="p-6 rounded-3xl border border-[#d99b5a]/40 bg-gradient-to-br from-[#1e1712]/95 via-[#18110c]/90 to-[#120e0a]/95 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider bg-[#d99b5a]/20 text-[#f1c38e] border border-[#d99b5a]/40">
                Plan najbliższego przelewu
              </span>
              <span className="text-xs text-[#9e8f82] font-mono">
                Termin: {nextPaymentInfo.dateString}
              </span>
            </div>

            <h3 className="text-xl sm:text-2xl font-light text-[#f5ede4]">
              Rekomendowany łączny przelew: <strong className="font-semibold text-[#f1c38e]">{stats.overpaymentAnalysis.suggestedTotalTransfer.toLocaleString('pl-PL')} zł</strong>
            </h3>

            <p className="text-xs text-[#c4b5a5] max-w-2xl leading-relaxed">
              {stats.overpaymentAnalysis.gap > 0 ? (
                <>
                  Aby utrzymać Twój <strong>pułap bazowy ({config.targetMonthlyOverpayment.toLocaleString('pl-PL')} zł)</strong>, przy najbliższym pobraniu raty należy przelać <strong>{config.regularInstallment.toLocaleString('pl-PL')} zł</strong> raty bankowej oraz <strong>{stats.overpaymentAnalysis.gap.toLocaleString('pl-PL')} zł</strong> brakującej nadpłaty.
                </>
              ) : (
                <>
                  Gratulacje! W tym miesiącu zrealizowałeś już zaplanowany pułap nadpłaty. Do banku wystarczy przelać standardową ratę <strong>{config.regularInstallment.toLocaleString('pl-PL')} zł</strong> (lub każdą dodatkową kwotę, która powiększy Twoją nadwyżkę).
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
              Rachunek do spłaty / nadpłat:
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

      {/* Kalkulator Oszczędności i Redukcji Kredytu */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        <div className="glass-panel p-4 rounded-3xl border border-[#2e231c] space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#9e8f82] block">
            Łącznie nadpłacony kapitał
          </span>
          <div className="text-2xl font-light text-[#f5ede4]">
            {stats.totalOverpaid.toLocaleString('pl-PL')} zł
          </div>
          <p className="text-[11px] text-[#7ec29a]">
            O tyle realnie pomniejszyłeś dług
          </p>
        </div>

        <div className="glass-panel p-4 rounded-3xl border border-[#2e231c] space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#9e8f82] block">
            Szacunkowo zaoszczędzone odsetki
          </span>
          <div className="text-2xl font-light text-[#7ec29a]">
            ~{stats.savings.estimatedInterestSaved.toLocaleString('pl-PL')} zł
          </div>
          <p className="text-[11px] text-[#9e8f82]">
            Pieniądze, które nie trafiły do banku
          </p>
        </div>

        <div className="glass-panel p-4 rounded-3xl border border-[#2e231c] space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#9e8f82] block">
            Szacunkowe skrócenie kredytu
          </span>
          <div className="text-2xl font-light text-[#f1c38e]">
            ~{stats.savings.estimatedMonthsReduced} miesięcy
          </div>
          <p className="text-[11px] text-[#9e8f82]">
            Szybsza wolność od zobowiązania
          </p>
        </div>
      </div>

      {/* Tabela / Historia Wpłat i Nadpłat */}
      <div className="glass-panel rounded-3xl border border-[#2e231c] overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-[#2e231c] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-medium text-[#f5ede4]">
              Historia wpłat i nadpłat rat kredytu
            </h3>
            <p className="text-xs text-[#9e8f82] mt-0.5">
              Rejestr wszystkich zrealizowanych rat wraz z dodatkowymi nadpłatami kapitału
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

        {payments.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#9e8f82]">
            Brak historii wpłat. Kliknij „Dodaj wpłatę”, aby zarejestrować pierwszą ratę lub nadpłatę.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#140e0b] border-b border-[#2e231c] text-[#9e8f82] font-mono uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">Data wpłaty</th>
                  <th className="py-3 px-4">Rata podstawowa</th>
                  <th className="py-3 px-4 text-[#d99b5a]">Kwota nadpłaty</th>
                  <th className="py-3 px-4">Razem wpłacone</th>
                  <th className="py-3 px-4">Notatka / Uwagi</th>
                  <th className="py-3 px-4 text-right">Akcje</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2e231c]/60">
                {payments.map((p) => {
                  const total = (p.regularInstallment || 0) + (p.overpayment || 0);
                  return (
                    <tr key={p.id} className="hover:bg-[#1a1410]/50 transition-colors">
                      <td className="py-3 px-4 font-mono text-[#f5ede4]">
                        {p.date}
                      </td>
                      <td className="py-3 px-4 text-[#c4b5a5]">
                        {p.regularInstallment?.toLocaleString('pl-PL')} zł
                      </td>
                      <td className="py-3 px-4 font-medium text-[#7ec29a]">
                        +{p.overpayment?.toLocaleString('pl-PL')} zł
                      </td>
                      <td className="py-3 px-4 font-semibold text-[#f5ede4]">
                        {total.toLocaleString('pl-PL')} zł
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
                    Rata banku (zł) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={paymentRegular}
                    onChange={(e) => setPaymentRegular(e.target.value)}
                    className="w-full bg-[#120e0a] border border-[#382b20] focus:border-[#d99b5a] rounded-xl px-3 py-2 text-xs text-[#f5ede4] outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-[#7ec29a] mb-1">
                    Nadpłata kapitału (zł) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={paymentOverpayment}
                    onChange={(e) => setPaymentOverpayment(e.target.value)}
                    className="w-full bg-[#120e0a] border border-[#7ec29a]/40 focus:border-[#7ec29a] rounded-xl px-3 py-2 text-xs text-[#f5ede4] outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[#9e8f82] mb-1">
                  Notatka / Uwagi (opcjonalnie)
                </label>
                <input
                  type="text"
                  placeholder="np. Rata listopadowa + premia"
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
                    onChange={(e) => setTempConfig({ ...tempConfig, loanTermMonths: parseInt(e.target.value, 10) || 300 })}
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
