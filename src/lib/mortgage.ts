import type { MortgageConfig, MortgagePaymentRecord } from '../types';
import { supabase } from './supabase';

export const STORAGE_KEY_MORTGAGE_CONFIG = 'jc_mortgage_config';
export const STORAGE_KEY_MORTGAGE_PAYMENTS = 'jc_mortgage_payments';

export const DEFAULT_MORTGAGE_CONFIG: MortgageConfig = {
  loanName: 'Kredyt Hipoteczny Mieszkanie',
  originalAmount: 420000,
  currentRemainingCapital: 385000,
  interestRate: 7.45,
  regularInstallment: 2840,
  targetMonthlyOverpayment: 3000, // Ustalony bazowy cel nadpłaty w miesiącu
  startDate: '2024-01-15',
  loanTermMonths: 300, // 25 lat
  accountNumber: 'PL 00 0000 0000 0000 0000 0000 0000',
};

export const INITIAL_MORTGAGE_PAYMENTS: MortgagePaymentRecord[] = [
  {
    id: 'pay-2026-08',
    date: '2026-08-31',
    regularInstallment: 2840,
    overpayment: 3000,
    totalPaid: 5840,
    notes: 'Rata sierpniowa + bazowa nadpłata',
  },
  {
    id: 'pay-2026-09',
    date: '2026-09-30',
    regularInstallment: 2840,
    overpayment: 2500,
    totalPaid: 5340,
    notes: 'Rata wrześniowa',
  },
  {
    id: 'pay-2026-10',
    date: '2026-11-02', // 31 października to sobota, 1 listopada to Wszystkich Świętych -> pobranie 2 listopada!
    regularInstallment: 2840,
    overpayment: 3500,
    totalPaid: 6340,
    notes: 'Pobranie po weekendzie i 1 listopada (nadpłata z premii)',
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
  // Ostatni dzień danego miesiąca (dzień 0 kolejnego miesiąca)
  const lastDayOfMonth = new Date(year, month + 1, 0, 12, 0, 0, 0);

  let current = new Date(lastDayOfMonth);
  // Jeśli to weekend lub święto, przesuwaj do przodu na pierwszy dzień roboczy
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

  // 1. Sprawdź termin dla bieżącego miesiąca
  let curPaymentDate = getMortgagePaymentDateForMonth(now.getFullYear(), now.getMonth());

  // Jeśli termin bieżącego miesiąca już minął, weź kolejny miesiąc
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

  const isShiftedToNextMonth = curPaymentDate.getDate() < 5; // pobranie 1. lub 2. dnia

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
 * Sprawdza ile nadpłacono w bieżącym miesiącu (np. '2026-11')
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
  gap: number; // ile brakuje (jeśli > 0)
  surplus: number; // ile nadwyżki (jeśli > 0)
  isMet: boolean;
  suggestedTotalTransfer: number; // zalecana kwota przelewu (rata + dopełnienie celu)
  progressPercent: number;
} {
  const { targetAmount, currentPaidThisMonth, regularInstallment } = params;
  const diff = currentPaidThisMonth - targetAmount;

  const gap = diff < 0 ? Math.abs(diff) : 0;
  const surplus = diff > 0 ? diff : 0;
  const isMet = diff >= 0;

  // Sugerowany przelew na koniec miesiąca: regularna rata + brakująca kwota do pułapu
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

/**
 * Szacuje oszczędności na odsetkach i skrócenie okresu kredytu z tytułu nadpłat
 */
export function estimateMortgageSavings(
  totalOverpaid: number,
  interestRate: number,
  regularInstallment: number
): {
  estimatedInterestSaved: number;
  estimatedMonthsReduced: number;
} {
  if (totalOverpaid <= 0 || interestRate <= 0 || regularInstallment <= 0) {
    return { estimatedInterestSaved: 0, estimatedMonthsReduced: 0 };
  }

  // Uproszczony model amortyzacji finansowej:
  // Każdy 1000 zł nadpłacony przy stopie np. 7.5% rocznie w horyzoncie 15-20 lat oszczędza ~1.2x - 1.8x swojej wartości w odsetkach
  const estimatedInterestSaved = Math.round(totalOverpaid * (interestRate / 100) * 12);
  const estimatedMonthsReduced = Math.round((totalOverpaid * 1.5) / regularInstallment);

  return {
    estimatedInterestSaved,
    estimatedMonthsReduced,
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
      return { ...DEFAULT_MORTGAGE_CONFIG, ...JSON.parse(raw) };
    }
  } catch {}
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
        return parsed;
      }
    }
  } catch {}
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
