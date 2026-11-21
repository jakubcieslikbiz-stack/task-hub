import type { MortgageConfig, MortgagePaymentRecord } from '../types';
import { supabase } from './supabase';

export const STORAGE_KEY_MORTGAGE_CONFIG = 'jc_mortgage_config';
export const STORAGE_KEY_MORTGAGE_PAYMENTS = 'jc_mortgage_payments';

export const DEFAULT_MORTGAGE_CONFIG: MortgageConfig = {
  loanName: 'Kredyt mieszkaniowy - r. równe (Bank Pekao)',
  originalAmount: 624029.47,
  currentRemainingCapital: 568843.28,
  interestRate: 6.05,
  regularInstallment: 3759.64,
  targetMonthlyOverpayment: 4670, // Ustalony bazowy cel nadpłaty w miesiącu (średnia z dotychczasowych wpłat)
  startDate: '2025-12-04',
  loanTermMonths: 360, // 30 lat (360 miesięcy)
  accountNumber: '95 1240 1994 3111 0011 2295 0938',
  targetPayoffDate: '2033-10', // Docelowy termin całkowitej spłaty (październik 2033)
};

export const INITIAL_MORTGAGE_PAYMENTS: MortgagePaymentRecord[] = [
  {
    id: 'pekao-2026-11-03',
    date: '2026-11-03',
    regularInstallment: 0,
    overpayment: 5000.00,
    totalPaid: 5000.00,
    notes: 'Spłata kapitału (nadpłata)',
  },
  {
    id: 'pekao-2026-11-02',
    date: '2026-11-02',
    regularInstallment: 3759.64,
    overpayment: 0,
    totalPaid: 3759.64,
    notes: 'Spłata raty (przesunięta z 31.10 - weekend i 1.11)',
  },
  {
    id: 'pekao-2026-09-30',
    date: '2026-09-30',
    regularInstallment: 3759.64,
    overpayment: 0,
    totalPaid: 3759.64,
    notes: 'Spłata raty',
  },
  {
    id: 'pekao-2026-09-01',
    date: '2026-09-01',
    regularInstallment: 0,
    overpayment: 1940.36,
    totalPaid: 1940.36,
    notes: 'Spłata kapitału (nadpłata)',
  },
  {
    id: 'pekao-2026-08-31',
    date: '2026-08-31',
    regularInstallment: 3759.64,
    overpayment: 0,
    totalPaid: 3759.64,
    notes: 'Spłata raty',
  },
  {
    id: 'pekao-2026-08-03',
    date: '2026-08-03',
    regularInstallment: 0,
    overpayment: 4740.36,
    totalPaid: 4740.36,
    notes: 'Spłata kapitału (nadpłata po weekendzie)',
  },
  {
    id: 'pekao-2026-07-31',
    date: '2026-07-31',
    regularInstallment: 3759.64,
    overpayment: 0,
    totalPaid: 3759.64,
    notes: 'Spłata raty',
  },
  {
    id: 'pekao-2026-07-01',
    date: '2026-07-01',
    regularInstallment: 0,
    overpayment: 2340.36,
    totalPaid: 2340.36,
    notes: 'Spłata kapitału (nadpłata)',
  },
  {
    id: 'pekao-2026-06-30',
    date: '2026-06-30',
    regularInstallment: 3759.64,
    overpayment: 0,
    totalPaid: 3759.64,
    notes: 'Spłata raty',
  },
  {
    id: 'pekao-2026-06-02',
    date: '2026-06-02',
    regularInstallment: 0,
    overpayment: 2341.16,
    totalPaid: 2341.16,
    notes: 'Spłata kapitału (nadpłata)',
  },
  {
    id: 'pekao-2026-06-01',
    date: '2026-06-01',
    regularInstallment: 3759.64,
    overpayment: 0,
    totalPaid: 3759.64,
    notes: 'Spłata raty (przesunięta z 31.05 - niedziela)',
  },
  {
    id: 'pekao-2026-05-04',
    date: '2026-05-04',
    regularInstallment: 0,
    overpayment: 3240.00,
    totalPaid: 3240.00,
    notes: 'Spłata kapitału (nadpłata po majówce)',
  },
  {
    id: 'pekao-2026-04-30',
    date: '2026-04-30',
    regularInstallment: 3759.64,
    overpayment: 0,
    totalPaid: 3759.64,
    notes: 'Spłata raty',
  },
  {
    id: 'pekao-2026-04-01',
    date: '2026-04-01',
    regularInstallment: 0,
    overpayment: 6241.00,
    totalPaid: 6241.00,
    notes: 'Spłata kapitału (nadpłata)',
  },
  {
    id: 'pekao-2026-03-31',
    date: '2026-03-31',
    regularInstallment: 3759.64,
    overpayment: 0,
    totalPaid: 3759.64,
    notes: 'Spłata raty',
  },
  {
    id: 'pekao-2026-03-03',
    date: '2026-03-03',
    regularInstallment: 0,
    overpayment: 5240.00,
    totalPaid: 5240.00,
    notes: 'Spłata kapitału (nadpłata)',
  },
  {
    id: 'pekao-2026-03-02',
    date: '2026-03-02',
    regularInstallment: 3759.64,
    overpayment: 0,
    totalPaid: 3759.64,
    notes: 'Spłata raty (przesunięta z 28.02 - sobota)',
  },
  {
    id: 'pekao-2026-02-03',
    date: '2026-02-03',
    regularInstallment: 0,
    overpayment: 8080.00,
    totalPaid: 8080.00,
    notes: 'Spłata kapitału (nadpłata)',
  },
  {
    id: 'pekao-2026-02-02',
    date: '2026-02-02',
    regularInstallment: 3759.64,
    overpayment: 0,
    totalPaid: 3759.64,
    notes: 'Spłata raty (przesunięta z 31.01 - sobota)',
  },
  {
    id: 'pekao-2026-01-02',
    date: '2026-01-02',
    regularInstallment: 0,
    overpayment: 7500.00,
    totalPaid: 7500.00,
    notes: 'Spłata kapitału (nadpłata noworoczna)',
  },
  {
    id: 'pekao-2025-12-31',
    date: '2025-12-31',
    regularInstallment: 3759.64,
    overpayment: 0,
    totalPaid: 3759.64,
    notes: 'Pierwsza rata kredytu',
  },
];

/**
 * Oblicza datę Wielkanocy dla danego roku (algorytm Meeusa/Jonesa/Butchera)
 */
function getEasterSunday(year: number): { month: number; day: number } {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31); // 3 = marzec, 4 = kwiecień
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return { month: month - 1, day }; // month: 0-indexed
}

/**
 * Zwraca listę świąt ustawowo wolnych od pracy w Polsce dla danego roku
 */
export function getPolishHolidays(year: number): Set<string> {
  const holidays = new Set<string>();

  const addHoliday = (m: number, d: number) => {
    const mm = String(m + 1).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    holidays.add(`${year}-${mm}-${dd}`);
  };

  // Stałe święta w Polsce:
  addHoliday(0, 1);   // 1 stycznia - Nowy Rok
  addHoliday(0, 6);   // 6 stycznia - Trzech Króli
  addHoliday(4, 1);   // 1 maja - Święto Pracy
  addHoliday(4, 3);   // 3 maja - Święto Konstytucji
  addHoliday(7, 15);  // 15 sierpnia - Wniebowzięcie NMP / Wojska Polskiego
  addHoliday(10, 1);  // 1 listopada - Wszystkich Świętych
  addHoliday(10, 11); // 11 listopada - Święto Niepodległości
  addHoliday(11, 25); // 25 grudnia - Boże Narodzenie 1
  addHoliday(11, 26); // 26 grudnia - Boże Narodzenie 2

  // Ruchome święta wielkanocne:
  const easter = getEasterSunday(year);
  const easterDate = new Date(year, easter.month, easter.day);

  // Poniedziałek Wielkanocny (Wielkanoc + 1 dzień)
  const easterMonday = new Date(easterDate);
  easterMonday.setDate(easterMonday.getDate() + 1);
  addHoliday(easterMonday.getMonth(), easterMonday.getDate());

  // Boże Ciało (Wielkanoc + 60 dni)
  const corpusChristi = new Date(easterDate);
  corpusChristi.setDate(corpusChristi.getDate() + 60);
  addHoliday(corpusChristi.getMonth(), corpusChristi.getDate());

  return holidays;
}

/**
 * Sprawdza, czy dana data jest dniem roboczym bankowym (Pn-Pt i nie-święto)
 */
export function isBankBusinessDay(date: Date): boolean {
  const dayOfWeek = date.getDay();
  if (dayOfWeek === 0 || dayOfWeek === 6) return false; // Niedziela lub sobota

  const holidays = getPolishHolidays(date.getFullYear());
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const key = `${yyyy}-${mm}-${dd}`;

  return !holidays.has(key);
}

/**
 * Oblicza faktyczny dzień pobrania raty kredytu za dany miesiąc.
 * Kredyt pobierany jest zawsze na koniec miesiąca, lecz jeśli koniec miesiąca wypada
 * w weekend lub święto, bank pobiera ratę 1. lub 2. dnia roboczego kolejnego miesiąca!
 */
export function getMortgagePaymentDateForMonth(year: number, month: number): Date {
  const lastDayOfMonth = new Date(year, month + 1, 0, 12, 0, 0, 0);

  let current = new Date(lastDayOfMonth);
  while (!isBankBusinessDay(current)) {
    current.setDate(current.getDate() + 1);
  }

  return current;
}

/**
 * Zwraca informację o najbliższej nadchodzącej dacie pobrania raty kredytu
 */
export function getNextMortgagePaymentDate(refDate: Date = new Date()): {
  paymentDate: Date;
  dateString: string;
  formatted: string;
  daysLeft: number;
  isShiftedToNextMonth: boolean;
  shiftReason?: string;
} {
  const now = new Date(refDate.getFullYear(), refDate.getMonth(), refDate.getDate(), 12, 0, 0);

  let curPaymentDate = getMortgagePaymentDateForMonth(now.getFullYear(), now.getMonth());

  if (now.getTime() > curPaymentDate.getTime()) {
    let nextMonth = now.getMonth() + 1;
    let nextYear = now.getFullYear();
    if (nextMonth > 11) {
      nextMonth = 0;
      nextYear += 1;
    }
    curPaymentDate = getMortgagePaymentDateForMonth(nextYear, nextMonth);
  }

  const diffMs = curPaymentDate.getTime() - now.getTime();
  const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  const yyyy = curPaymentDate.getFullYear();
  const mm = String(curPaymentDate.getMonth() + 1).padStart(2, '0');
  const dd = String(curPaymentDate.getDate()).padStart(2, '0');
  const dateString = `${yyyy}-${mm}-${dd}`;

  const isShiftedToNextMonth = curPaymentDate.getDate() < 5;

  let shiftReason: string | undefined = undefined;
  if (isShiftedToNextMonth) {
    shiftReason = 'Koniec miesiąca wypadł w weekend lub święto – pobranie przesunięte na 1. dzień roboczy';
  }

  const polishMonths = [
    'stycznia', 'lutego', 'marca', 'kwietnia', 'maja', 'czerwca',
    'lipca', 'sierpnia', 'września', 'października', 'listopada', 'grudnia'
  ];
  const dayOfWeekName = curPaymentDate.toLocaleDateString('pl-PL', { weekday: 'long' });

  const formatted = `${curPaymentDate.getDate()} ${polishMonths[curPaymentDate.getMonth()]} ${curPaymentDate.getFullYear()} (${dayOfWeekName})`;

  return {
    paymentDate: curPaymentDate,
    dateString,
    formatted,
    daysLeft,
    isShiftedToNextMonth,
    shiftReason,
  };
}

/**
 * Oblicza średnią wielkość nadpłaty z zarejestrowanej historii
 */
export function calculateAverageOverpayment(payments: MortgagePaymentRecord[]): number {
  const overpayments = payments
    .map((p) => p.overpayment)
    .filter((v) => typeof v === 'number' && v > 0);

  if (overpayments.length === 0) return 0;
  const sum = overpayments.reduce((acc, curr) => acc + curr, 0);
  return Math.round(sum / overpayments.length);
}

/**
 * Zwraca łączną sumę wszystkich nadpłat w historii
 */
export function calculateTotalOverpayment(payments: MortgagePaymentRecord[]): number {
  return payments.reduce((acc, p) => acc + (p.overpayment || 0), 0);
}

/**
 * Sprawdza ile nadpłacono w danym miesiącu (np. '2026-11')
 */
export function calculateOverpaymentInMonth(payments: MortgagePaymentRecord[], yearMonthPrefix: string): number {
  return payments
    .filter((p) => p.date.startsWith(yearMonthPrefix))
    .reduce((acc, p) => acc + (p.overpayment || 0), 0);
}

/**
 * Analizuje bilans bieżącego miesiąca względem ustalonego pułapu bazowego
 */
export function analyzeOverpaymentStatus(params: {
  targetAmount: number;
  currentPaidThisMonth: number;
  regularInstallment: number;
}): {
  target: number;
  paidThisMonth: number;
  gap: number;
  surplus: number;
  isMet: boolean;
  suggestedTotalTransfer: number;
  progressPercent: number;
} {
  const { targetAmount, currentPaidThisMonth, regularInstallment } = params;
  const diff = currentPaidThisMonth - targetAmount;

  const gap = diff < 0 ? Math.abs(diff) : 0;
  const surplus = diff > 0 ? diff : 0;
  const isMet = diff >= 0;

  // Sugerowany przelew na koniec miesiąca: standardowa rata bankowa + brakująca kwota do pułapu
  const suggestedTotalTransfer = regularInstallment + gap;
  const progressPercent = targetAmount > 0 ? Math.min(100, Math.round((currentPaidThisMonth / targetAmount) * 100)) : 0;

  return {
    target: targetAmount,
    paidThisMonth: currentPaidThisMonth,
    gap,
    surplus,
    isMet,
    suggestedTotalTransfer,
    progressPercent,
  };
}

export interface MortgageSimulationResult {
  monthsRemaining: number;
  yearsRemaining: number;
  monthsRemainder: number;
  payoffDate: string; // YYYY-MM
  payoffDateFormatted: string; // e.g. "Październik 2033"
  totalInterestRemaining: number;
  totalInterestOverall: number;
  totalInterestSaved: number;
  monthsReduced: number;
  yearsReduced: number;
}

/**
 * Symuluje dokładny harmonogram spłaty kredytu miesiąc po miesiącu uwzględniając nadpłaty.
 */
export function simulateAmortizationSchedule(params: {
  currentBalance: number;
  annualInterestRate: number;
  regularInstallment: number;
  monthlyOverpayment: number;
  alreadyPaidInterest?: number;
  originalLoanAmount?: number;
  originalTermMonths?: number;
  startDateYear?: number;
  startDateMonth?: number; // 0-indexed
}): MortgageSimulationResult {
  const {
    currentBalance,
    annualInterestRate,
    regularInstallment,
    monthlyOverpayment,
    alreadyPaidInterest = 32833.09,
    originalLoanAmount = 624029.47,
    originalTermMonths = 360,
    startDateYear = 2026,
    startDateMonth = 10, // Listopad (0-indexed: 10)
  } = params;

  const monthlyRate = (annualInterestRate / 100) / 12;
  const totalMonthly = regularInstallment + monthlyOverpayment;

  // Całkowite odsetki w scenariuszu bazowym (bez żadnych nadpłat)
  const baselineTotalInterest = (regularInstallment * originalTermMonths) - originalLoanAmount;

  let balance = currentBalance;
  let months = 0;
  let totalInterestRemaining = 0;

  while (balance > 0 && months < 600) {
    months++;
    const interest = balance * monthlyRate;
    totalInterestRemaining += interest;
    const principalPayment = totalMonthly - interest;

    if (principalPayment <= 0) break;

    if (principalPayment >= balance) {
      balance = 0;
      break;
    } else {
      balance -= principalPayment;
    }
  }

  const payoffDateObj = new Date(startDateYear, startDateMonth + months, 1);
  const polishMonthsCap = [
    'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
    'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'
  ];

  const payoffDate = `${payoffDateObj.getFullYear()}-${String(payoffDateObj.getMonth() + 1).padStart(2, '0')}`;
  const payoffDateFormatted = `${polishMonthsCap[payoffDateObj.getMonth()]} ${payoffDateObj.getFullYear()}`;

  const totalInterestOverall = alreadyPaidInterest + totalInterestRemaining;
  const totalInterestSaved = Math.max(0, baselineTotalInterest - totalInterestOverall);

  // Od grudnia 2025 do listopada 2026 upłynęło 11 miesięcy
  const elapsedMonths = 11;
  const baselineRemainingMonths = Math.max(0, originalTermMonths - elapsedMonths);
  const monthsReduced = Math.max(0, baselineRemainingMonths - months);

  return {
    monthsRemaining: months,
    yearsRemaining: Math.floor(months / 12),
    monthsRemainder: months % 12,
    payoffDate,
    payoffDateFormatted,
    totalInterestRemaining: Math.round(totalInterestRemaining),
    totalInterestOverall: Math.round(totalInterestOverall),
    totalInterestSaved: Math.round(totalInterestSaved),
    monthsReduced,
    yearsReduced: Math.round((monthsReduced / 12) * 10) / 10,
  };
}

/**
 * Szacuje oszczędności na odsetkach i skrócenie okresu kredytu z tytułu nadpłat
 */
export function estimateMortgageSavings(
  totalOverpaid: number,
  interestRate: number,
  regularInstallment: number,
  currentBalance: number = 568843.28
): {
  estimatedInterestSaved: number;
  estimatedMonthsReduced: number;
} {
  if (totalOverpaid <= 0 || interestRate <= 0 || regularInstallment <= 0) {
    return { estimatedInterestSaved: 0, estimatedMonthsReduced: 0 };
  }

  const simPastOnly = simulateAmortizationSchedule({
    currentBalance,
    annualInterestRate: interestRate,
    regularInstallment,
    monthlyOverpayment: 0,
  });

  return {
    estimatedInterestSaved: simPastOnly.totalInterestSaved,
    estimatedMonthsReduced: simPastOnly.monthsReduced,
  };
}

export interface TargetPayoffCalculation {
  monthsRemaining: number;
  yearsRemaining: number;
  monthsRemainder: number;
  requiredMonthlyOverpayment: number;
  requiredTotalMonthly: number;
  payoffDate: string; // YYYY-MM
  payoffDateFormatted: string; // e.g. "Grudzień 2032"
  totalInterestOverall: number;
  totalInterestSaved: number;
  yearsReduced: number;
  isValid: boolean;
  errorMessage?: string;
}

/**
 * Oblicza wymaganą kwotę comiesięcznej nadpłaty, aby spłacić kredyt w wybranym przez użytkownika terminie (rok i miesiąc)
 */
export function calculateRequiredOverpaymentForTargetDate(params: {
  currentBalance: number;
  annualInterestRate: number;
  regularInstallment: number;
  targetYear: number;
  targetMonth: number; // 1-12
  fromYear?: number;
  fromMonth?: number; // 1-12
  alreadyPaidInterest?: number;
  originalLoanAmount?: number;
  originalTermMonths?: number;
}): TargetPayoffCalculation {
  const {
    currentBalance,
    annualInterestRate,
    regularInstallment,
    targetYear,
    targetMonth,
    fromYear = 2026,
    fromMonth = 11, // Listopad
    alreadyPaidInterest = 32833.09,
    originalLoanAmount = 624029.47,
    originalTermMonths = 360,
  } = params;

  const monthsRemaining = (targetYear - fromYear) * 12 + (targetMonth - fromMonth);

  const polishMonthsCap = [
    'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
    'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'
  ];
  const payoffDate = `${targetYear}-${String(targetMonth).padStart(2, '0')}`;
  const payoffDateFormatted = `${polishMonthsCap[targetMonth - 1] || 'Miesiąc'} ${targetYear}`;

  if (monthsRemaining <= 0) {
    return {
      monthsRemaining: 0,
      yearsRemaining: 0,
      monthsRemainder: 0,
      requiredMonthlyOverpayment: 0,
      requiredTotalMonthly: regularInstallment,
      payoffDate,
      payoffDateFormatted,
      totalInterestOverall: alreadyPaidInterest,
      totalInterestSaved: 0,
      yearsReduced: 0,
      isValid: false,
      errorMessage: 'Docelowy termin spłaty musi być w przyszłości.',
    };
  }

  const monthlyRate = (annualInterestRate / 100) / 12;

  // Wzór renty annuitetowej na łączną ratę: PMT_total = P * [ r * (1+r)^N ] / [ (1+r)^N - 1 ]
  const factor = Math.pow(1 + monthlyRate, monthsRemaining);
  const pmtTotal = currentBalance * ((monthlyRate * factor) / (factor - 1));

  const requiredMonthlyOverpayment = Math.max(0, Math.round((pmtTotal - regularInstallment) * 100) / 100);
  const requiredTotalMonthly = Math.round(pmtTotal * 100) / 100;

  // Dokładna symulacja harmonogramu dla tego scenariusza
  const sim = simulateAmortizationSchedule({
    currentBalance,
    annualInterestRate,
    regularInstallment,
    monthlyOverpayment: requiredMonthlyOverpayment,
    alreadyPaidInterest,
    originalLoanAmount,
    originalTermMonths,
    startDateYear: fromYear,
    startDateMonth: fromMonth - 1,
  });

  return {
    monthsRemaining,
    yearsRemaining: Math.floor(monthsRemaining / 12),
    monthsRemainder: monthsRemaining % 12,
    requiredMonthlyOverpayment,
    requiredTotalMonthly,
    payoffDate,
    payoffDateFormatted,
    totalInterestOverall: sim.totalInterestOverall,
    totalInterestSaved: sim.totalInterestSaved,
    yearsReduced: sim.yearsReduced,
    isValid: true,
  };
}

export interface MonthReconciliationItem {
  yearMonth: string;
  monthName: string;
  targetOverpayment: number;
  actualOverpayment: number;
  regularInstallmentPaid: number;
  totalPaid: number;
  diff: number; // actual - target
  status: 'surplus' | 'exact' | 'shortfall';
}

export interface RollingReconciliationResult {
  currentMonthItem: MonthReconciliationItem;
  previousMonthItem: MonthReconciliationItem | null;
  historySummary: MonthReconciliationItem[];
  cumulativeNetBalance: number;
  nextMonthRecommendation: {
    targetOverpayment: number;
    adjustedOverpayment: number;
    suggestedRegularInstallment: number;
    suggestedTotalTransfer: number;
    carryoverFromPrevious: number;
    statusBadge: 'on_track' | 'ahead' | 'catch_up';
    guidanceText: string;
  };
}

/**
 * Oblicza dynamiczne comiesięczne rozliczenie: porównuje faktyczne wpłaty z celem
 * i na kolejny miesiąc wyznacza czy trzeba dopłacić więcej, czy cel jest utrzymany.
 */
export function calculateRollingReconciliation(params: {
  payments: MortgagePaymentRecord[];
  targetOverpayment: number;
  regularInstallment: number;
  currentYear?: number;
  currentMonth?: number; // 1-12
}): RollingReconciliationResult {
  const {
    payments,
    targetOverpayment,
    regularInstallment,
    currentYear = new Date().getFullYear(),
    currentMonth = new Date().getMonth() + 1,
  } = params;

  const currentYm = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;

  let prevYear = currentYear;
  let prevMonth = currentMonth - 1;
  if (prevMonth < 1) {
    prevMonth = 12;
    prevYear -= 1;
  }
  const prevYm = `${prevYear}-${String(prevMonth).padStart(2, '0')}`;

  const polishMonths = [
    'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
    'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'
  ];

  const grouped: Record<string, { over: number; reg: number }> = {};
  for (const p of payments) {
    const ym = p.date.slice(0, 7);
    if (!grouped[ym]) grouped[ym] = { over: 0, reg: 0 };
    grouped[ym].over += p.overpayment || 0;
    grouped[ym].reg += p.regularInstallment || 0;
  }

  const allMonths = Object.keys(grouped).sort();
  const historySummary: MonthReconciliationItem[] = allMonths.map((ym) => {
    const [y, m] = ym.split('-').map(Number);
    const mName = `${polishMonths[m - 1] || 'Miesiąc'} ${y}`;
    const over = Math.round((grouped[ym].over || 0) * 100) / 100;
    const reg = Math.round((grouped[ym].reg || 0) * 100) / 100;
    const diff = Math.round((over - targetOverpayment) * 100) / 100;
    const status: 'surplus' | 'exact' | 'shortfall' =
      diff > 0 ? 'surplus' : diff === 0 ? 'exact' : 'shortfall';

    return {
      yearMonth: ym,
      monthName: mName,
      targetOverpayment,
      actualOverpayment: over,
      regularInstallmentPaid: reg,
      totalPaid: over + reg,
      diff,
      status,
    };
  });

  const curOver = Math.round((grouped[currentYm]?.over || 0) * 100) / 100;
  const curReg = Math.round((grouped[currentYm]?.reg || 0) * 100) / 100;
  const curDiff = Math.round((curOver - targetOverpayment) * 100) / 100;
  const currentMonthItem: MonthReconciliationItem = {
    yearMonth: currentYm,
    monthName: `${polishMonths[currentMonth - 1] || 'Miesiąc'} ${currentYear}`,
    targetOverpayment,
    actualOverpayment: curOver,
    regularInstallmentPaid: curReg,
    totalPaid: curOver + curReg,
    diff: curDiff,
    status: curDiff > 0 ? 'surplus' : curDiff === 0 ? 'exact' : 'shortfall',
  };

  const prevOver = Math.round((grouped[prevYm]?.over || 0) * 100) / 100;
  const prevReg = Math.round((grouped[prevYm]?.reg || 0) * 100) / 100;
  const prevDiff = Math.round((prevOver - targetOverpayment) * 100) / 100;
  const previousMonthItem: MonthReconciliationItem = {
    yearMonth: prevYm,
    monthName: `${polishMonths[prevMonth - 1] || 'Miesiąc'} ${prevYear}`,
    targetOverpayment,
    actualOverpayment: prevOver,
    regularInstallmentPaid: prevReg,
    totalPaid: prevOver + prevReg,
    diff: prevDiff,
    status: prevDiff > 0 ? 'surplus' : prevDiff === 0 ? 'exact' : 'shortfall',
  };

  const cumulativeNetBalance = historySummary.reduce((sum, item) => sum + item.diff, 0);

  let carryover = 0;
  let adjustedOverpayment = targetOverpayment;
  let statusBadge: 'on_track' | 'ahead' | 'catch_up' = 'on_track';
  let guidanceText = '';

  if (curDiff >= 0) {
    statusBadge = 'ahead';
    carryover = curDiff;
    adjustedOverpayment = targetOverpayment;
    guidanceText = `W bieżącym miesiącu cel zrealizowany z nadwyżką +${curDiff.toLocaleString('pl-PL')} zł! Na kolejny miesiąc możesz wpłacić standardowo ${targetOverpayment.toLocaleString('pl-PL')} zł lub odliczyć zaliczkę i wpłacić min. ${Math.max(0, targetOverpayment - curDiff).toLocaleString('pl-PL')} zł.`;
  } else {
    const shortfall = Math.abs(curDiff);
    statusBadge = 'catch_up';
    carryover = -shortfall;
    adjustedOverpayment = targetOverpayment + shortfall;
    guidanceText = `W tym miesiącu brakuje ${shortfall.toLocaleString('pl-PL')} zł do osiągnięcia celu. Aby utrzymać tempo w kolejnym miesiącu, zalecana nadpłata wyrównująca wynosi ${adjustedOverpayment.toLocaleString('pl-PL')} zł.`;
  }

  return {
    currentMonthItem,
    previousMonthItem,
    historySummary,
    cumulativeNetBalance: Math.round(cumulativeNetBalance * 100) / 100,
    nextMonthRecommendation: {
      targetOverpayment,
      adjustedOverpayment,
      suggestedRegularInstallment: regularInstallment,
      suggestedTotalTransfer: regularInstallment + adjustedOverpayment,
      carryoverFromPrevious: carryover,
      statusBadge,
      guidanceText,
    },
  };
}

/**
 * Odczyt konfiguracji kredytu (localStorage + chmura)
 */
export function getStoredMortgageConfig(): MortgageConfig {
  if (typeof window === 'undefined') return DEFAULT_MORTGAGE_CONFIG;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_MORTGAGE_CONFIG);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Migracja ze starej makiety testowej do realnych danych Pekao
      if (parsed.originalAmount === 420000 || parsed.regularInstallment === 2840 || !parsed.accountNumber?.includes('95 1240')) {
        saveStoredMortgageConfig(DEFAULT_MORTGAGE_CONFIG);
        return DEFAULT_MORTGAGE_CONFIG;
      }
      return { ...DEFAULT_MORTGAGE_CONFIG, ...parsed };
    }
  } catch {}
  saveStoredMortgageConfig(DEFAULT_MORTGAGE_CONFIG);
  return DEFAULT_MORTGAGE_CONFIG;
}

export function saveStoredMortgageConfig(config: MortgageConfig): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_MORTGAGE_CONFIG, JSON.stringify(config));
    if (supabase) {
      Promise.resolve(
        supabase
          .from('taskhub_state')
          .upsert(
            {
              key: 'mortgage_config',
              data: config,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'key' }
          )
      ).catch(() => {});
    }
  } catch {}
}

/**
 * Odczyt historii wpłat (localStorage + chmura)
 */
export function getStoredMortgagePayments(): MortgagePaymentRecord[] {
  if (typeof window === 'undefined') return INITIAL_MORTGAGE_PAYMENTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_MORTGAGE_PAYMENTS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Jeśli w pamięci przeglądarki są stare makiety z testowymi ID, migruj do realnych danych Pekao
        if (parsed.some((p: any) => p.id === 'pay-2026-08' || p.id === 'pay-2026-09' || p.regularInstallment === 2840)) {
          saveStoredMortgagePayments(INITIAL_MORTGAGE_PAYMENTS);
          return INITIAL_MORTGAGE_PAYMENTS;
        }
        return parsed;
      }
    }
  } catch {}
  saveStoredMortgagePayments(INITIAL_MORTGAGE_PAYMENTS);
  return INITIAL_MORTGAGE_PAYMENTS;
}

export function saveStoredMortgagePayments(payments: MortgagePaymentRecord[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_MORTGAGE_PAYMENTS, JSON.stringify(payments));
    if (supabase) {
      Promise.resolve(
        supabase
          .from('taskhub_state')
          .upsert(
            {
              key: 'mortgage_payments',
              data: payments,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'key' }
          )
      ).catch(() => {});
    }
  } catch {}
}
