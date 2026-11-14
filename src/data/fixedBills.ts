import type { FixedBillItem, MonthlyBillsData, MonthlyBillEntry } from '../types';

export const STORAGE_KEY_FIXED_BILLS = 'taskhub_personal_fixed_bills';
export const STORAGE_KEY_MONTHLY_BILLS = 'taskhub_personal_monthly_bills';

export const DEFAULT_FIXED_BILLS: FixedBillItem[] = [
  {
    id: 'rent',
    title: 'Czynsz',
    dueDayDescription: 'Zawsze do 10. każdego miesiąca',
    reminderDayDescription: 'Przypomnienie: 8. każdego miesiąca',
    dueDay: 10,
    reminderDay: 8,
    category: 'home',
    iconName: 'Home',
    notes: 'Opłata za mieszkanie / lokal',
  },
  {
    id: 'electricity',
    title: 'Prąd',
    dueDayDescription: 'Do końca każdego miesiąca',
    reminderDayDescription: 'Przypomnienie: 25. każdego miesiąca',
    dueDay: -1, // ostatni dzień miesiąca
    reminderDay: 25,
    category: 'utilities',
    iconName: 'Zap',
    notes: 'Energia elektryczna (prognoza / rozliczenie)',
  },
  {
    id: 'accounting',
    title: 'Księgowość',
    dueDayDescription: 'Zawsze do 10. każdego miesiąca',
    reminderDayDescription: 'Przypomnienie: 9. każdego miesiąca',
    dueDay: 10,
    reminderDay: 9,
    category: 'business',
    iconName: 'Receipt',
    notes: 'Faktura za biuro rachunkowe JC Studio',
  },
  {
    id: 'mortgage_overpayment',
    title: 'Dyspozycja nadpłaty kredytu',
    dueDayDescription: 'W ostatni dzień każdego miesiąca',
    reminderDayDescription: 'Przypomnienie: W ostatni dzień miesiąca',
    dueDay: -1, // ostatni dzień miesiąca
    reminderDay: -1, // ostatni dzień miesiąca
    category: 'finance',
    iconName: 'TrendingDown',
    notes: 'Złożenie w banku dyspozycji nadpłaty kapitału',
  },
  {
    id: 'taxes_zus',
    title: 'Podatki i ZUS',
    dueDayDescription: 'Zazwyczaj do 20. każdego miesiąca',
    reminderDayDescription: 'Przypomnienie: 18. każdego miesiąca',
    dueDay: 20,
    reminderDay: 18,
    category: 'business',
    iconName: 'Landmark',
    notes: 'Składka ZUS oraz zaliczka PIT / VAT',
  },
];

/**
 * Oblicza dni dla danego rachunku w konkretnym miesiącu i roku
 */
export function getBillDaysInfo(bill: FixedBillItem, year: number, monthIndex: number) {
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const actualDueDay = bill.dueDay === -1 ? daysInMonth : Math.min(bill.dueDay, daysInMonth);
  const actualReminderDay = bill.reminderDay === -1 ? daysInMonth : Math.min(bill.reminderDay, daysInMonth);
  return { daysInMonth, actualDueDay, actualReminderDay };
}

/**
 * Zwraca status płatności rachunku dla wybranego miesiąca
 */
export type BillPaymentStatus = 'paid' | 'reminder_active' | 'overdue' | 'upcoming';

export function getBillStatus(
  bill: FixedBillItem,
  record: MonthlyBillEntry | undefined,
  year: number,
  monthIndex: number
): {
  status: BillPaymentStatus;
  badgeText: string;
  badgeStyle: 'paid' | 'active' | 'overdue' | 'upcoming';
  daysLeft?: number;
} {
  if (record?.paid) {
    const paidAtFormatted = record.paidAt
      ? new Date(record.paidAt).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' })
      : '';
    return {
      status: 'paid',
      badgeText: paidAtFormatted ? `Opłacone (${paidAtFormatted})` : 'Opłacone',
      badgeStyle: 'paid',
    };
  }

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const currentDay = now.getDate();

  const isCurrentMonth = year === currentYear && monthIndex === currentMonth;
  const isPastMonth = year < currentYear || (year === currentYear && monthIndex < currentMonth);

  const { actualDueDay, actualReminderDay } = getBillDaysInfo(bill, year, monthIndex);

  if (isPastMonth) {
    return {
      status: 'overdue',
      badgeText: `Zaległe (termin: ${actualDueDay}.)`,
      badgeStyle: 'overdue',
    };
  }

  if (isCurrentMonth) {
    if (currentDay > actualDueDay) {
      const daysOver = currentDay - actualDueDay;
      return {
        status: 'overdue',
        badgeText: `Po terminie ${daysOver > 1 ? `o ${daysOver} dni` : 'o 1 dzień'}!`,
        badgeStyle: 'overdue',
      };
    }
    if (currentDay >= actualReminderDay) {
      return {
        status: 'reminder_active',
        badgeText: `Czas opłacić! (przypomnienie z ${actualReminderDay}.)`,
        badgeStyle: 'active',
      };
    }
    const daysUntilReminder = actualReminderDay - currentDay;
    return {
      status: 'upcoming',
      badgeText: `Przypomnienie za ${daysUntilReminder} dni (${actualReminderDay}.)`,
      badgeStyle: 'upcoming',
      daysLeft: daysUntilReminder,
    };
  }

  // Future month
  return {
    status: 'upcoming',
    badgeText: `Termin: ${actualDueDay}. dnia`,
    badgeStyle: 'upcoming',
  };
}

/**
 * Storage helpers
 */
export function getStoredFixedBills(): FixedBillItem[] {
  if (typeof window === 'undefined') return DEFAULT_FIXED_BILLS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_FIXED_BILLS);
    if (!raw) return DEFAULT_FIXED_BILLS;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
  } catch {}
  return DEFAULT_FIXED_BILLS;
}

export function saveStoredFixedBills(bills: FixedBillItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_FIXED_BILLS, JSON.stringify(bills));
  } catch {}
}

export function getStoredMonthlyBills(): MonthlyBillsData {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY_MONTHLY_BILLS);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (typeof parsed === 'object' && parsed !== null) return parsed;
  } catch {}
  return {};
}

export function saveStoredMonthlyBills(data: MonthlyBillsData): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_MONTHLY_BILLS, JSON.stringify(data));
  } catch {}
}
