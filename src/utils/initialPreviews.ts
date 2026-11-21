import { isBankBusinessDay } from '../lib/mortgage';

export interface InitialPreviewsInfo {
  isApplicable: boolean;
  businessDays: number; // 3 or 4
  previewDate: string; // YYYY-MM-DD
  previewDateFormatted: string; // np. "24 lis"
  previewDateFullFormatted: string; // np. "24 listopada 2026 (wtorek)"
  previewDatesList: string[]; // Wszystkie dni należące do etapu ujęć wstępnych
  previewDatesSet: Set<string>; // Set ułatwiający szybkie sprawdzanie O(1) na Timeline
  isPast: boolean;
  isToday: boolean;
  priceThresholdText: string; // np. "< 1 500 zł" lub "≥ 1 500 zł"
}

const POLISH_MONTHS_SHORT = [
  'sty', 'lut', 'mar', 'kwi', 'maj', 'cze',
  'lip', 'sie', 'wrz', 'paź', 'lis', 'gru'
];

const POLISH_MONTHS_FULL = [
  'stycznia', 'lutego', 'marca', 'kwietnia', 'maja', 'czerwca',
  'lipca', 'sierpnia', 'września', 'października', 'listopada', 'grudnia'
];

/**
 * Oblicza termin i dni trwania etapu "Ujęcia wstępne":
 * - Kwota < 1500 zł -> 3 pierwsze dni robocze
 * - Kwota >= 1500 zł -> 4 pierwsze dni robocze
 * Dni robocze: od poniedziałku do piątku z pominięciem świąt ustawowo wolnych w Polsce.
 */
export function getInitialPreviewsInfo(task: {
  startDate?: string;
  createdAt?: string;
  dueDate?: string;
  price?: number;
  category?: string;
}): InitialPreviewsInfo {
  // Nie dotyczy spraw prywatnych / osobistych
  if (task.category === 'personal') {
    return {
      isApplicable: false,
      businessDays: 3,
      previewDate: '',
      previewDateFormatted: '',
      previewDateFullFormatted: '',
      previewDatesList: [],
      previewDatesSet: new Set(),
      isPast: false,
      isToday: false,
      priceThresholdText: '',
    };
  }

  const price = typeof task.price === 'number' ? task.price : 0;
  // Zasada: poniżej 1500 zł -> 3 dni robocze, od 1500 zł wzwyż -> 4 dni robocze
  const businessDays = price < 1500 ? 3 : 4;
  const priceThresholdText = price < 1500 ? '< 1 500 zł' : '≥ 1 500 zł';

  // Data początkowa (startDate > createdAt > dueDate)
  const rawStart = task.startDate || task.createdAt?.slice(0, 10) || task.dueDate;
  if (!rawStart || typeof rawStart !== 'string') {
    return {
      isApplicable: false,
      businessDays,
      previewDate: '',
      previewDateFormatted: '',
      previewDateFullFormatted: '',
      previewDatesList: [],
      previewDatesSet: new Set(),
      isPast: false,
      isToday: false,
      priceThresholdText,
    };
  }

  const [y, m, d] = rawStart.split('-').map((v) => parseInt(v, 10));
  if (!y || !m || !d) {
    return {
      isApplicable: false,
      businessDays,
      previewDate: '',
      previewDateFormatted: '',
      previewDateFullFormatted: '',
      previewDatesList: [],
      previewDatesSet: new Set(),
      isPast: false,
      isToday: false,
      priceThresholdText,
    };
  }

  const currentDate = new Date(y, m - 1, d, 12, 0, 0);

  // Jeśli start wypada w weekend/święto, przejdź do najbliższego dnia roboczego jako dnia 1
  while (!isBankBusinessDay(currentDate)) {
    currentDate.setDate(currentDate.getDate() + 1);
  }

  const previewDatesList: string[] = [];

  // Zbierz wymaganą liczbę dni roboczych (3 lub 4)
  while (previewDatesList.length < businessDays) {
    if (isBankBusinessDay(currentDate)) {
      const cy = currentDate.getFullYear();
      const cm = String(currentDate.getMonth() + 1).padStart(2, '0');
      const cd = String(currentDate.getDate()).padStart(2, '0');
      previewDatesList.push(`${cy}-${cm}-${cd}`);
    }

    if (previewDatesList.length < businessDays) {
      currentDate.setDate(currentDate.getDate() + 1);
    }
  }

  const lastPreviewDateStr = previewDatesList[previewDatesList.length - 1];
  const [py, pm, pd] = lastPreviewDateStr.split('-').map((v) => parseInt(v, 10));
  const finalPreviewDate = new Date(py, pm - 1, pd, 12, 0, 0);

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  const isToday = lastPreviewDateStr === todayStr;
  const isPast = lastPreviewDateStr < todayStr;

  const weekdayName = finalPreviewDate.toLocaleDateString('pl-PL', { weekday: 'long' });
  const previewDateFormatted = `${pd} ${POLISH_MONTHS_SHORT[pm - 1]}`;
  const previewDateFullFormatted = `${pd} ${POLISH_MONTHS_FULL[pm - 1]} ${py} (${weekdayName})`;

  return {
    isApplicable: true,
    businessDays,
    previewDate: lastPreviewDateStr,
    previewDateFormatted,
    previewDateFullFormatted,
    previewDatesList,
    previewDatesSet: new Set(previewDatesList),
    isPast,
    isToday,
    priceThresholdText,
  };
}
