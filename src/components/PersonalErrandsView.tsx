import React, { useState } from 'react';
import type { Task, FixedBillItem, MonthlyBillsData, StickyNoteColor } from '../types';
import {
  POLISH_MONTH_NAMES,
} from '../lib/monthlyReport';
import {
  getBillStatus,
} from '../data/fixedBills';
import { sendTaskReminderEmail } from '../lib/email';
import {
  Home,
  Zap,
  Receipt,
  TrendingDown,
  Landmark,
  FileText,
  PiggyBank,
  Check,
  CheckCircle2,
  Bell,
  Calendar,
  Clock,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Mail,
  Sparkles,
  AlertCircle,
  X,
  Info,
  StickyNote as StickyIcon,
} from 'lucide-react';

interface PersonalErrandsViewProps {
  tasks: Task[];
  onAddTask: (task: {
    name: string;
    category?: string;
    dueDate?: string;
    dueTime?: string;
    notes?: string;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    remindByEmail?: boolean;
    stickyColor?: StickyNoteColor;
  }) => void;
  onUpdateTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
  onToggleStatus: (id: string) => void;
  fixedBills: FixedBillItem[];
  monthlyBills: MonthlyBillsData;
  onUpdateMonthlyBill: (
    monthKey: string,
    billId: string,
    entry: { amount?: number; paid?: boolean; paidAt?: string; notes?: string }
  ) => void;
  onAddFixedBill: (bill: FixedBillItem) => void;
  onDeleteFixedBill: (billId: string) => void;
}

const BILL_ICONS: Record<string, React.ReactNode> = {
  Home: <Home className="w-5 h-5" />,
  Zap: <Zap className="w-5 h-5" />,
  Receipt: <Receipt className="w-5 h-5" />,
  TrendingDown: <TrendingDown className="w-5 h-5" />,
  Landmark: <Landmark className="w-5 h-5" />,
  FileText: <FileText className="w-5 h-5" />,
  PiggyBank: <PiggyBank className="w-5 h-5" />,
};

const BILL_ACCENTS: Record<string, { color: string; bg: string; border: string }> = {
  rent: { color: '#d99b5a', bg: 'rgba(217, 155, 90, 0.12)', border: 'rgba(217, 155, 90, 0.35)' },
  electricity: { color: '#e8b84d', bg: 'rgba(232, 184, 77, 0.12)', border: 'rgba(232, 184, 77, 0.35)' },
  accounting: { color: '#7ec29a', bg: 'rgba(126, 194, 154, 0.12)', border: 'rgba(126, 194, 154, 0.35)' },
  mortgage_overpayment: { color: '#b49be2', bg: 'rgba(180, 155, 226, 0.12)', border: 'rgba(180, 155, 226, 0.35)' },
  taxes_zus: { color: '#6ba4cd', bg: 'rgba(107, 164, 205, 0.12)', border: 'rgba(107, 164, 205, 0.35)' },
};

const STICKY_COLOR_THEMES: Record<
  StickyNoteColor,
  {
    name: string;
    bg: string;
    border: string;
    accent: string;
    badgeBg: string;
    dotBg: string;
  }
> = {
  honey: {
    name: 'Ciepły Miód',
    bg: 'linear-gradient(135deg, rgba(42, 34, 21, 0.95) 0%, rgba(30, 24, 16, 0.95) 100%)',
    border: '#d99b5a55',
    accent: '#d99b5a',
    badgeBg: 'rgba(217, 155, 90, 0.18)',
    dotBg: '#d99b5a',
  },
  mint: {
    name: 'Świeża Mięta',
    bg: 'linear-gradient(135deg, rgba(24, 40, 29, 0.95) 0%, rgba(18, 30, 22, 0.95) 100%)',
    border: '#7ec29a55',
    accent: '#7ec29a',
    badgeBg: 'rgba(126, 194, 154, 0.18)',
    dotBg: '#7ec29a',
  },
  lavender: {
    name: 'Lawenda',
    bg: 'linear-gradient(135deg, rgba(36, 28, 44, 0.95) 0%, rgba(26, 20, 32, 0.95) 100%)',
    border: '#b49be255',
    accent: '#b49be2',
    badgeBg: 'rgba(180, 155, 226, 0.18)',
    dotBg: '#b49be2',
  },
  coral: {
    name: 'Brzoskwinia',
    bg: 'linear-gradient(135deg, rgba(46, 29, 26, 0.95) 0%, rgba(32, 20, 18, 0.95) 100%)',
    border: '#e07a6855',
    accent: '#e07a68',
    badgeBg: 'rgba(224, 122, 104, 0.18)',
    dotBg: '#e07a68',
  },
  azure: {
    name: 'Błękit',
    bg: 'linear-gradient(135deg, rgba(25, 36, 45, 0.95) 0%, rgba(18, 26, 32, 0.95) 100%)',
    border: '#6ba4cd55',
    accent: '#6ba4cd',
    badgeBg: 'rgba(107, 164, 205, 0.18)',
    dotBg: '#6ba4cd',
  },
  coffee: {
    name: 'Espresso',
    bg: 'linear-gradient(135deg, rgba(29, 22, 18, 0.95) 0%, rgba(20, 15, 12, 0.95) 100%)',
    border: '#9e8f8244',
    accent: '#f5ede4',
    badgeBg: 'rgba(158, 143, 130, 0.18)',
    dotBg: '#9e8f82',
  },
};

export const PersonalErrandsView: React.FC<PersonalErrandsViewProps> = ({
  tasks,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  onToggleStatus,
  fixedBills,
  monthlyBills,
  onUpdateMonthlyBill,
  onAddFixedBill,
  onDeleteFixedBill,
}) => {
  const now = new Date();
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(now.getMonth()); // 0-indexed

  const monthKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
  const isCurrentMonth = currentYear === now.getFullYear() && currentMonth === now.getMonth();

  // Active filter for sticky notes
  const [stickyFilter, setStickyFilter] = useState<'all' | 'todo' | 'done'>('all');

  // New sticky note state
  const [isAddingSticky, setIsAddingSticky] = useState(false);
  const [newStickyTitle, setNewStickyTitle] = useState('');
  const [newStickyDate, setNewStickyDate] = useState('');
  const [newStickyTime, setNewStickyTime] = useState('');
  const [newStickyNotes, setNewStickyNotes] = useState('');
  const [newStickyColor, setNewStickyColor] = useState<StickyNoteColor>('honey');
  const [newStickyEmailReminder, setNewStickyEmailReminder] = useState(false);

  // New custom fixed bill modal state
  const [isAddBillOpen, setIsAddBillOpen] = useState(false);
  const [newBillTitle, setNewBillTitle] = useState('');
  const [newBillDueDay, setNewBillDueDay] = useState('10');
  const [newBillReminderDay, setNewBillReminderDay] = useState('8');
  const [newBillNotes, setNewBillNotes] = useState('');

  // Notification feedback
  const [alertNotice, setAlertNotice] = useState<string | null>(null);

  // Active info popover for fixed bills
  const [activeInfoBillId, setActiveInfoBillId] = useState<string | null>(null);

  // Filter personal errands tasks
  const personalTasks = tasks.filter((t) => t.category === 'personal');
  const activePersonalTasks = personalTasks.filter((t) => t.status !== 'done' && t.status !== 'paid');
  const donePersonalTasks = personalTasks.filter((t) => t.status === 'done' || t.status === 'paid');

  const filteredStickyNotes =
    stickyFilter === 'todo'
      ? activePersonalTasks
      : stickyFilter === 'done'
      ? donePersonalTasks
      : personalTasks;

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

  const handleResetToCurrentMonth = () => {
    setCurrentYear(now.getFullYear());
    setCurrentMonth(now.getMonth());
  };

  // Fixed bills calculations for currently selected month
  const currentMonthEntries = monthlyBills[monthKey] || {};

  let totalDeclaredAmount = 0;
  let totalPaidAmount = 0;
  let paidCount = 0;
  const activeAlertBills: FixedBillItem[] = [];

  fixedBills.forEach((bill) => {
    const entry = currentMonthEntries[bill.id];
    const amount = entry?.amount || 0;
    totalDeclaredAmount += amount;
    if (entry?.paid) {
      totalPaidAmount += amount;
      paidCount++;
    } else if (isCurrentMonth) {
      const statusInfo = getBillStatus(bill, entry, currentYear, currentMonth);
      if (statusInfo.status === 'reminder_active' || statusInfo.status === 'overdue') {
        activeAlertBills.push(bill);
      }
    }
  });

  const unpaidAmount = Math.max(0, totalDeclaredAmount - totalPaidAmount);

  // Amount update handler
  const handleAmountChange = (billId: string, valStr: string) => {
    const parsed = parseFloat(valStr.replace(',', '.'));
    const cleanAmount = isNaN(parsed) || parsed < 0 ? 0 : parsed;
    onUpdateMonthlyBill(monthKey, billId, { amount: cleanAmount });
  };

  // Payment status toggle handler
  const handleTogglePaid = (billId: string) => {
    const currentEntry = currentMonthEntries[billId];
    const newPaid = !currentEntry?.paid;
    onUpdateMonthlyBill(monthKey, billId, {
      paid: newPaid,
      paidAt: newPaid ? new Date().toISOString() : undefined,
    });
  };

  // Immediate email reminder send for fixed bill
  const handleSendEmailReminder = async (bill: FixedBillItem) => {
    const entry = currentMonthEntries[bill.id];
    const amountText = entry?.amount ? `${entry.amount} zł` : 'kwota do uzupełnienia';
    try {
      setAlertNotice(`Wysyłanie przypomnienia dla: ${bill.title}...`);
      await sendTaskReminderEmail({
        title: `Stała opłata: ${bill.title}`,
        description: `Przypomnienie o opłaceniu: ${bill.title} za miesiąc ${POLISH_MONTH_NAMES[currentMonth]} ${currentYear}. Kwota: ${amountText}. ${bill.dueDayDescription}.`,
        dueDate: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${
          bill.dueDay === -1 ? 'ostatni dzień' : String(bill.dueDay).padStart(2, '0')
        }`,
        price: entry?.amount || 0,
        category: 'Sprawy Osobiste / Rachunki',
        notes: bill.notes,
        forceImmediate: true,
      });
      setAlertNotice(`Wysłano przypomnienie e-mail dla: ${bill.title}!`);
      setTimeout(() => setAlertNotice(null), 4000);
    } catch {
      setAlertNotice(`Nie udało się wysłać e-maila. Sprawdź konfigurację Resend.`);
      setTimeout(() => setAlertNotice(null), 4000);
    }
  };

  // Add new sticky note
  const handleCreateStickyNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStickyTitle.trim()) return;

    onAddTask({
      name: newStickyTitle.trim(),
      category: 'personal',
      dueDate: newStickyDate || undefined,
      dueTime: newStickyTime || undefined,
      notes: newStickyNotes.trim() || undefined,
      priority: 'medium',
      remindByEmail: newStickyEmailReminder,
      stickyColor: newStickyColor,
    });

    setNewStickyTitle('');
    setNewStickyDate('');
    setNewStickyTime('');
    setNewStickyNotes('');
    setNewStickyColor('honey');
    setNewStickyEmailReminder(false);
    setIsAddingSticky(false);
  };

  // Add custom fixed bill
  const handleCreateCustomBill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBillTitle.trim()) return;

    const dueDayNum = parseInt(newBillDueDay, 10);
    const reminderDayNum = parseInt(newBillReminderDay, 10);

    const newBill: FixedBillItem = {
      id: `custom_${Date.now()}`,
      title: newBillTitle.trim(),
      dueDayDescription:
        dueDayNum === -1
          ? 'W ostatni dzień każdego miesiąca'
          : `Do ${dueDayNum}. każdego miesiąca`,
      reminderDayDescription:
        reminderDayNum === -1
          ? 'Przypomnienie: W ostatni dzień miesiąca'
          : `Przypomnienie: ${reminderDayNum}. każdego miesiąca`,
      dueDay: isNaN(dueDayNum) ? 10 : dueDayNum,
      reminderDay: isNaN(reminderDayNum) ? 8 : reminderDayNum,
      category: 'other',
      iconName: 'FileText',
      notes: newBillNotes.trim() || undefined,
    };

    onAddFixedBill(newBill);
    setNewBillTitle('');
    setNewBillDueDay('10');
    setNewBillReminderDay('8');
    setNewBillNotes('');
    setIsAddBillOpen(false);
  };

  // Change sticky note color
  const handleChangeStickyColor = (task: Task, color: StickyNoteColor) => {
    onUpdateTask({
      ...task,
      stickyColor: color,
    });
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Alert toast if present */}
      {alertNotice && (
        <div className="fixed top-5 right-5 z-50 glass-panel border border-[#d99b5a]/60 bg-[#1f1610]/95 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 text-xs text-[#f5ede4] animate-in fade-in slide-in-from-top-3">
          <Sparkles className="w-4 h-4 text-[#d99b5a] flex-shrink-0 animate-pulse" />
          <span>{alertNotice}</span>
          <button
            onClick={() => setAlertNotice(null)}
            className="ml-2 text-[#9e8f82] hover:text-[#f5ede4]"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* SECTION 1 HEADER & MONTH CONTROLS */}
      <div className="glass-panel p-5 md:p-6 rounded-3xl border border-[#382b20] shadow-2xl relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#d99b5a]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#2e231c]">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#7ec29a]/15 text-[#7ec29a] border border-[#7ec29a]/30">
                Prywatne & Stałe
              </span>
              <span className="text-xs text-[#9e8f82]">Miesięczny plan opłat i spraw</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-light text-[#f5ede4] tracking-tight mt-1">
              Stałe Sprawy & Opłaty Comiesięczne
            </h1>
            <p className="text-xs md:text-sm text-[#9e8f82] mt-0.5">
              Wpisuj kwoty za dany miesiąc, monitoruj terminy i otrzymuj przypomnienia na czas
            </p>
          </div>

          {/* Month Selector Buttons */}
          <div className="flex items-center gap-2 self-start md:self-auto">
            <div className="flex items-center glass-pill rounded-full border border-[#382b20] p-1 bg-[#140f0c]/80 shadow-md">
              <button
                onClick={handlePrevMonth}
                className="p-1.5 rounded-full hover:bg-[#251b14] text-[#9e8f82] hover:text-[#f5ede4] transition-all"
                title="Poprzedni miesiąc"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="px-3 py-1 text-xs md:text-sm font-medium text-[#f5ede4] min-w-[130px] text-center font-mono">
                {POLISH_MONTH_NAMES[currentMonth]} {currentYear}
              </div>
              <button
                onClick={handleNextMonth}
                className="p-1.5 rounded-full hover:bg-[#251b14] text-[#9e8f82] hover:text-[#f5ede4] transition-all"
                title="Następny miesiąc"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {!isCurrentMonth && (
              <button
                onClick={handleResetToCurrentMonth}
                className="px-3 py-2 rounded-full text-xs font-medium bg-[#251b14] hover:bg-[#2e2016] text-[#d99b5a] border border-[#d99b5a]/30 transition-all active:scale-95"
              >
                Bieżący
              </button>
            )}

            <button
              onClick={() => setIsAddBillOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#f5ede4] hover:bg-white text-[#120e0a] text-xs font-medium shadow-md transition-all active:scale-95"
              title="Dodaj nową stałą opłatę"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span className="hidden sm:inline">Nowa stała opłata</span>
            </button>
          </div>
        </div>

        {/* Active Reminders Alert (if any bill is due or reminder is active in current month) */}
        {isCurrentMonth && activeAlertBills.length > 0 && (
          <div className="mt-4 p-3.5 rounded-2xl bg-[#d99b5a]/10 border border-[#d99b5a]/30 flex flex-wrap items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center gap-2.5">
              <Bell className="w-4 h-4 text-[#d99b5a] animate-bounce flex-shrink-0" />
              <div className="text-xs text-[#f5ede4]">
                <span className="font-semibold text-[#d99b5a]">Przypomnienie aktywne!</span>{' '}
                Masz {activeAlertBills.length}{' '}
                {activeAlertBills.length === 1 ? 'rachunek czekający' : 'rachunki czekające'} na
                opłacenie w tym miesiącu:{' '}
                <span className="font-medium text-white">
                  {activeAlertBills.map((b) => b.title).join(', ')}
                </span>
                .
              </div>
            </div>
            <span className="text-[11px] text-[#9e8f82] font-mono">
              Dzisiaj jest {now.getDate()}. dzień miesiąca
            </span>
          </div>
        )}

        {/* Financial Summary Cards for the Month */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-2">
          {/* Box 1: Łącznie kwota */}
          <div className="p-3.5 rounded-2xl bg-[#1a1410]/80 border border-[#2e231c]">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-[#9e8f82] block">
              Suma opłat stałych
            </span>
            <div className="text-lg md:text-xl font-bold font-mono text-[#f5ede4] mt-1">
              {totalDeclaredAmount.toLocaleString('pl-PL')} zł
            </div>
            <span className="text-[10px] text-[#7a6b5e]">
              wypełniono w {fixedBills.filter((b) => (currentMonthEntries[b.id]?.amount || 0) > 0).length}/{fixedBills.length}
            </span>
          </div>

          {/* Box 2: Opłacone */}
          <div className="p-3.5 rounded-2xl bg-[#1a1410]/80 border border-[#2e231c]">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-[#7ec29a] block">
              Opłacone
            </span>
            <div className="text-lg md:text-xl font-bold font-mono text-[#7ec29a] mt-1">
              {totalPaidAmount.toLocaleString('pl-PL')} zł
            </div>
            <span className="text-[10px] text-[#7ec29a]/80">
              {paidCount} z {fixedBills.length} rachunków
            </span>
          </div>

          {/* Box 3: Pozostało do opłacenia */}
          <div className="p-3.5 rounded-2xl bg-[#1a1410]/80 border border-[#2e231c]">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-[#d99b5a] block">
              Do zapłaty
            </span>
            <div className="text-lg md:text-xl font-bold font-mono text-[#d99b5a] mt-1">
              {unpaidAmount.toLocaleString('pl-PL')} zł
            </div>
            <span className="text-[10px] text-[#9e8f82]">
              {fixedBills.length - paidCount} pozostało
            </span>
          </div>
        </div>
      </div>

      {/* THE 5 FIXED BILL BOXES GRID */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[#9e8f82]">
            Karty opłat comiesięcznych ({fixedBills.length})
          </h2>
          <span className="text-xs text-[#7a6b5e]">
            Wpisz kwotę i zaznacz opłacenie za {POLISH_MONTH_NAMES[currentMonth]}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {fixedBills.map((bill) => {
            const entry = currentMonthEntries[bill.id];
            const isPaid = entry?.paid || false;
            const amount = entry?.amount ?? '';
            const statusInfo = getBillStatus(bill, entry, currentYear, currentMonth);
            const accent = BILL_ACCENTS[bill.id] || {
              color: '#d99b5a',
              bg: 'rgba(217,155,90,0.12)',
              border: 'rgba(217,155,90,0.35)',
            };
            const iconElement = BILL_ICONS[bill.iconName] || <FileText className="w-5 h-5" />;

            return (
              <div
                key={bill.id}
                className={`glass-panel p-5 rounded-3xl border transition-all duration-200 relative flex flex-col justify-between select-none ${
                  isPaid
                    ? 'border-[#7ec29a]/30 bg-[#161a16]/70 shadow-lg'
                    : statusInfo.status === 'reminder_active'
                    ? 'border-[#d99b5a]/50 bg-[#211812]/90 shadow-xl'
                    : statusInfo.status === 'overdue'
                    ? 'border-[#e07a68]/50 bg-[#251513]/90 shadow-xl'
                    : 'border-[#382b20] hover:border-[#4d3a2b] bg-[#140f0c]/90 shadow-md'
                }`}
              >
                {/* Header: Icon, Title & Status Pill */}
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform hover:scale-105"
                        style={{
                          backgroundColor: accent.bg,
                          color: accent.color,
                          border: `1px solid ${accent.border}`,
                        }}
                      >
                        {iconElement}
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-[#f5ede4] leading-tight">
                          {bill.title}
                        </h3>
                        {bill.notes && (
                          <span className="text-[11px] text-[#9e8f82] line-clamp-1 mt-0.5">
                            {bill.notes}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Top right corner: Info 'i' button & Delete for custom bills */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Info 'i' button with Popover & native tooltip */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setActiveInfoBillId(activeInfoBillId === bill.id ? null : bill.id)}
                          title={`Termin płatności: ${bill.dueDayDescription}\nPrzypomnienie: ${bill.reminderDayDescription}`}
                          className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                            activeInfoBillId === bill.id
                              ? 'bg-[#d99b5a]/25 text-[#d99b5a] border border-[#d99b5a]/50 shadow-sm'
                              : 'text-[#8c7b6d] hover:text-[#d99b5a] hover:bg-[#251b14] border border-[#382b20]/60'
                          }`}
                        >
                          <Info className="w-3.5 h-3.5" />
                        </button>

                        {/* Floating Info Popover */}
                        {activeInfoBillId === bill.id && (
                          <div
                            className="absolute right-0 top-8 z-30 w-64 p-3 rounded-2xl bg-[#140f0c]/98 backdrop-blur-xl border border-[#3d2c20] shadow-[0_12px_36px_rgba(0,0,0,0.85)] space-y-2 animate-in fade-in zoom-in-95 duration-150"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex items-center justify-between pb-1.5 border-b border-[#251b14]">
                              <span className="text-[10px] font-mono uppercase text-[#d99b5a] font-semibold flex items-center gap-1.5">
                                <Info className="w-3 h-3 text-[#d99b5a]" />
                                Harmonogram opłaty
                              </span>
                              <button
                                onClick={() => setActiveInfoBillId(null)}
                                className="text-[#7a6b5e] hover:text-[#f5ede4] p-0.5 rounded-full hover:bg-[#251b14]"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                            <div className="text-xs space-y-1.5 pt-0.5">
                              <div>
                                <span className="block text-[10px] uppercase font-mono text-[#7a6b5e]">Termin płatności:</span>
                                <span className="font-mono text-[#f5ede4] text-xs font-medium">
                                  {bill.dueDayDescription}
                                </span>
                              </div>
                              <div>
                                <span className="block text-[10px] uppercase font-mono text-[#7a6b5e]">Przypomnienie:</span>
                                <span className="font-mono text-[#d99b5a] text-xs font-medium">
                                  {bill.reminderDayDescription}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Delete button for custom bills */}
                      {bill.id.startsWith('custom_') && (
                        <button
                          onClick={() => onDeleteFixedBill(bill.id)}
                          className="p-1 rounded-full text-[#7a6b5e] hover:text-[#e07a68] transition-colors"
                          title="Usuń tę stałą opłatę"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="mb-3">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${
                        statusInfo.badgeStyle === 'paid'
                          ? 'bg-[#7ec29a]/15 text-[#7ec29a] border border-[#7ec29a]/30'
                          : statusInfo.badgeStyle === 'active'
                          ? 'bg-[#d99b5a]/20 text-[#f5ede4] border border-[#d99b5a]/50 animate-pulse'
                          : statusInfo.badgeStyle === 'overdue'
                          ? 'bg-[#e07a68]/20 text-[#f39585] border border-[#e07a68]/40'
                          : 'bg-[#251b14] text-[#9e8f82] border border-[#382b20]'
                      }`}
                    >
                      {statusInfo.badgeStyle === 'paid' ? (
                        <Check className="w-3 h-3 stroke-[2.5]" />
                      ) : statusInfo.badgeStyle === 'active' ? (
                        <Bell className="w-3 h-3 text-[#d99b5a]" />
                      ) : statusInfo.badgeStyle === 'overdue' ? (
                        <AlertCircle className="w-3 h-3 text-[#e07a68]" />
                      ) : (
                        <Clock className="w-3 h-3" />
                      )}
                      <span>{statusInfo.badgeText}</span>
                    </span>
                  </div>
                </div>

                {/* Amount Input & Actions */}
                <div className="pt-2 border-t border-[#2e231c] space-y-3">
                  <div>
                    <label className="text-[11px] uppercase tracking-wider text-[#9e8f82] font-semibold block mb-1">
                      Kwota za {POLISH_MONTH_NAMES[currentMonth].toLowerCase()} (PLN):
                    </label>
                    <div className="relative flex items-center">
                      <input
                        type="number"
                        step="any"
                        min="0"
                        placeholder="0.00"
                        value={amount}
                        onChange={(e) => handleAmountChange(bill.id, e.target.value)}
                        className="w-full bg-[#100c09] border border-[#382b20] focus:border-[#d99b5a] rounded-xl px-3 py-2 text-sm font-mono font-semibold text-[#f5ede4] placeholder-[#5a4c40] outline-none transition-all pr-10"
                      />
                      <span className="absolute right-3 text-xs text-[#7a6b5e] font-mono pointer-events-none">
                        zł
                      </span>
                    </div>
                  </div>

                  {/* Actions: Mark Paid toggle & Email reminder */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleTogglePaid(bill.id)}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-medium transition-all active:scale-95 ${
                        isPaid
                          ? 'bg-[#7ec29a]/20 text-[#7ec29a] border border-[#7ec29a]/40 hover:bg-[#7ec29a]/30'
                          : 'bg-[#251b14] hover:bg-[#2e2016] text-[#f5ede4] border border-[#382b20] hover:border-[#7ec29a]/50'
                      }`}
                    >
                      {isPaid ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-[#7ec29a]" />
                          <span>Opłacono ✓</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-3.5 h-3.5 text-[#9e8f82]" />
                          <span>Oznacz jako opłacone</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleSendEmailReminder(bill)}
                      title="Wyślij natychmiastowe przypomnienie e-mail"
                      className="p-2 rounded-xl bg-[#251b14] hover:bg-[#2e2016] text-[#9e8f82] hover:text-[#d99b5a] border border-[#382b20] transition-all active:scale-95 flex-shrink-0"
                    >
                      <Bell className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 2: STICKY NOTES FOR PERSONAL ERRANDS */}
      <div className="pt-6 border-t border-[#2e231c]">
        {/* Sticky Notes Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#d99b5a]/15 text-[#d99b5a] border border-[#d99b5a]/30">
                Prywatne zadania & Wizyty
              </span>
              <span className="text-xs text-[#9e8f82]">Karteczki samoprzylepne</span>
            </div>
            <h2 className="text-2xl font-light text-[#f5ede4] tracking-tight mt-1 flex items-center gap-2">
              <StickyIcon className="w-5 h-5 text-[#d99b5a]" />
              <span>Sprawy Bieżące & Notatki (Sticky Notes)</span>
            </h2>
            <p className="text-xs md:text-sm text-[#9e8f82] mt-0.5">
              Fryzjer, badania, zakupy, wizyty i codzienne prywatne plany w formie szybkich karteczek
            </p>
          </div>

          {/* Controls: Filter Tabs + New Sticky Note Button */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center glass-pill rounded-full border border-[#382b20] p-1 bg-[#140f0c] text-xs">
              <button
                onClick={() => setStickyFilter('all')}
                className={`px-3 py-1 rounded-full transition-all ${
                  stickyFilter === 'all'
                    ? 'bg-[#f5ede4] text-[#120e0a] font-medium shadow-sm'
                    : 'text-[#9e8f82] hover:text-[#f5ede4]'
                }`}
              >
                Wszystkie ({personalTasks.length})
              </button>
              <button
                onClick={() => setStickyFilter('todo')}
                className={`px-3 py-1 rounded-full transition-all ${
                  stickyFilter === 'todo'
                    ? 'bg-[#f5ede4] text-[#120e0a] font-medium shadow-sm'
                    : 'text-[#9e8f82] hover:text-[#f5ede4]'
                }`}
              >
                Do załatwienia ({activePersonalTasks.length})
              </button>
              <button
                onClick={() => setStickyFilter('done')}
                className={`px-3 py-1 rounded-full transition-all ${
                  stickyFilter === 'done'
                    ? 'bg-[#f5ede4] text-[#120e0a] font-medium shadow-sm'
                    : 'text-[#9e8f82] hover:text-[#f5ede4]'
                }`}
              >
                Załatwione ({donePersonalTasks.length})
              </button>
            </div>

            <button
              onClick={() => setIsAddingSticky((prev) => !prev)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#d99b5a] hover:bg-[#e6a867] text-[#120e0a] text-xs font-semibold shadow-lg shadow-[#d99b5a]/20 transition-all active:scale-95"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>+ Nowa sprawa</span>
            </button>
          </div>
        </div>

        {/* INLINE NEW STICKY NOTE FORM (when open) */}
        {isAddingSticky && (
          <form
            onSubmit={handleCreateStickyNote}
            className="mb-6 p-5 rounded-3xl border border-[#d99b5a]/50 bg-[#1e1712]/95 shadow-2xl relative overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300"
          >
            {/* Washi tape decoration */}
            <div className="w-20 h-4 bg-white/10 rounded-sm absolute -top-2 left-1/2 -translate-x-1/2 backdrop-blur-md shadow-sm border border-white/20 rotate-[-1deg]" />

            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#d99b5a]" />
                <h3 className="text-sm font-semibold text-[#f5ede4]">
                  Nowa karteczka osobista
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddingSticky(false)}
                className="text-[#9e8f82] hover:text-[#f5ede4]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <input
                  type="text"
                  required
                  placeholder="np. Fryzjer - piątek o 15:30, Badania okresowe..."
                  value={newStickyTitle}
                  onChange={(e) => setNewStickyTitle(e.target.value)}
                  className="w-full bg-[#120e0a] border border-[#382b20] focus:border-[#d99b5a] rounded-xl px-3.5 py-2.5 text-sm text-[#f5ede4] placeholder-[#6b5b4f] outline-none"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#9e8f82] flex-shrink-0" />
                  <input
                    type="date"
                    value={newStickyDate}
                    onChange={(e) => setNewStickyDate(e.target.value)}
                    className="w-full bg-[#120e0a] border border-[#382b20] focus:border-[#d99b5a] rounded-xl px-3 py-2 text-xs text-[#f5ede4] outline-none"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#9e8f82] flex-shrink-0" />
                  <input
                    type="time"
                    value={newStickyTime}
                    onChange={(e) => setNewStickyTime(e.target.value)}
                    className="w-full bg-[#120e0a] border border-[#382b20] focus:border-[#d99b5a] rounded-xl px-3 py-2 text-xs text-[#f5ede4] outline-none"
                  />
                </div>
              </div>

              <div>
                <textarea
                  rows={2}
                  placeholder="Notatka / szczegóły (opcjonalnie)..."
                  value={newStickyNotes}
                  onChange={(e) => setNewStickyNotes(e.target.value)}
                  className="w-full bg-[#120e0a] border border-[#382b20] focus:border-[#d99b5a] rounded-xl px-3.5 py-2 text-xs text-[#f5ede4] placeholder-[#6b5b4f] outline-none resize-none"
                />
              </div>

              {/* Color picker & Email reminder checkbox */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#2e231c]">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#9e8f82]">Kolor karteczki:</span>
                  <div className="flex items-center gap-1.5">
                    {(Object.keys(STICKY_COLOR_THEMES) as StickyNoteColor[]).map((col) => {
                      const theme = STICKY_COLOR_THEMES[col];
                      const isSelected = newStickyColor === col;
                      return (
                        <button
                          key={col}
                          type="button"
                          onClick={() => setNewStickyColor(col)}
                          className={`w-6 h-6 rounded-full transition-transform ${
                            isSelected ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-[#1e1712]' : 'hover:scale-110'
                          }`}
                          style={{ backgroundColor: theme.dotBg }}
                          title={theme.name}
                        />
                      );
                    })}
                  </div>
                </div>

                <label className="flex items-center gap-2 text-xs text-[#9e8f82] cursor-pointer hover:text-[#f5ede4]">
                  <input
                    type="checkbox"
                    checked={newStickyEmailReminder}
                    onChange={(e) => setNewStickyEmailReminder(e.target.checked)}
                    className="rounded border-[#382b20] bg-[#120e0a] text-[#d99b5a] focus:ring-0"
                  />
                  <span>Powiadom mnie e-mailem</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingSticky(false)}
                  className="px-4 py-2 rounded-xl text-xs text-[#9e8f82] hover:text-[#f5ede4]"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#d99b5a] hover:bg-[#e6a867] text-[#120e0a] text-xs font-semibold shadow-md active:scale-95 transition-all"
                >
                  Dodaj karteczkę
                </button>
              </div>
            </div>
          </form>
        )}

        {/* STICKY NOTES GRID */}
        {filteredStickyNotes.length === 0 ? (
          <div className="py-16 text-center flex flex-col items-center justify-center border border-dashed border-[#2e231c] rounded-3xl p-6 bg-[#140f0c]/40">
            <StickyIcon className="w-8 h-8 text-[#5a4a3e] mb-2" />
            <h3 className="text-sm font-medium text-[#f5ede4]">
              {stickyFilter === 'done'
                ? 'Brak załatwionych spraw'
                : stickyFilter === 'todo'
                ? 'Wszystkie sprawy załatwione! 🎉'
                : 'Brak spraw osobistych'}
            </h3>
            <p className="text-xs text-[#9e8f82] max-w-sm mt-1">
              Dodaj pierwszą karteczkę na fryzjera, wizytę, zakupy lub powiedz do asystenta:
              „Fryzjer za tydzień o 15”.
            </p>
            <button
              onClick={() => setIsAddingSticky(true)}
              className="mt-4 px-4 py-2 rounded-full bg-[#f5ede4] hover:bg-white text-[#120e0a] text-xs font-medium shadow-md transition-all active:scale-95"
            >
              + Dodaj pierwszą karteczkę
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredStickyNotes.map((task, idx) => {
              const colorKey: StickyNoteColor =
                task.stickyColor ||
                (idx % 6 === 0
                  ? 'honey'
                  : idx % 6 === 1
                  ? 'mint'
                  : idx % 6 === 2
                  ? 'lavender'
                  : idx % 6 === 3
                  ? 'coral'
                  : idx % 6 === 4
                  ? 'azure'
                  : 'coffee');

              const theme = STICKY_COLOR_THEMES[colorKey];
              const isDone = task.status === 'done' || task.status === 'paid';
              const tiltDegree = idx % 2 === 0 ? -1 : 1;

              return (
                <div
                  key={task.id}
                  style={{
                    background: theme.bg,
                    borderColor: theme.border,
                    transform: `rotate(${tiltDegree}deg)`,
                  }}
                  className={`group rounded-3xl border p-5 shadow-xl transition-all duration-300 hover:rotate-0 hover:scale-[1.02] hover:shadow-2xl relative flex flex-col justify-between select-none ${
                    isDone ? 'opacity-70 hover:opacity-100' : ''
                  }`}
                >
                  {/* Washi tape decoration at top */}
                  <div className="w-14 h-3.5 bg-white/10 rounded-sm absolute -top-1.5 left-1/2 -translate-x-1/2 backdrop-blur-md shadow-sm border border-white/15 rotate-[-0.5deg]" />

                  {/* Top bar: Checkbox, Color dots, Delete */}
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <button
                        onClick={() => onToggleStatus(task.id)}
                        className={`w-6 h-6 rounded-full flex items-center justify-center border transition-all active:scale-90 ${
                          isDone
                            ? 'bg-[#7ec29a] border-[#7ec29a] text-[#120e0a]'
                            : 'border-[#7a6b5e] hover:border-white text-transparent hover:text-[#7a6b5e]'
                        }`}
                        title={isDone ? 'Oznacz jako do zrobienia' : 'Oznacz jako załatwione'}
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </button>

                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {(Object.keys(STICKY_COLOR_THEMES) as StickyNoteColor[]).slice(0, 4).map((col) => (
                          <button
                            key={col}
                            type="button"
                            onClick={() => handleChangeStickyColor(task, col)}
                            className="w-3 h-3 rounded-full hover:scale-125 transition-transform"
                            style={{ backgroundColor: STICKY_COLOR_THEMES[col].dotBg }}
                            title={STICKY_COLOR_THEMES[col].name}
                          />
                        ))}
                      </div>

                      <button
                        onClick={() => onDeleteTask(task.id)}
                        className="p-1 rounded-full text-[#9e8f82] hover:text-[#e07a68] transition-colors"
                        title="Usuń sprawę"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Task Title */}
                    <h3
                      className={`text-base font-medium leading-snug transition-all ${
                        isDone
                          ? 'line-through text-[#9e8f82]'
                          : 'text-[#f5ede4]'
                      }`}
                    >
                      {task.title}
                    </h3>

                    {/* Task Notes / Description */}
                    {(task.description || task.notes) && (
                      <p className="text-xs text-[#b8a89a] mt-2 whitespace-pre-wrap leading-relaxed line-clamp-3">
                        {task.notes || task.description}
                      </p>
                    )}
                  </div>

                  {/* Bottom Footer: Date/Time & Badges */}
                  <div className="pt-4 mt-3 border-t border-white/10 flex items-center justify-between gap-2 text-[11px]">
                    <div className="flex items-center gap-1.5 text-[#d5c6b8] flex-wrap">
                      {task.dueDate && (
                        <span className="flex items-center gap-1 font-mono">
                          <Calendar className="w-3 h-3 text-[#d99b5a]" />
                          <span>
                            {new Date(task.dueDate).toLocaleDateString('pl-PL', {
                              day: 'numeric',
                              month: 'short',
                            })}
                          </span>
                        </span>
                      )}

                      {task.dueTime && (
                        <span className="flex items-center gap-1 font-mono">
                          <Clock className="w-3 h-3 text-[#7ec29a]" />
                          <span>{task.dueTime}</span>
                        </span>
                      )}

                      {task.remindByEmail && (
                        <span
                          className="flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px]"
                          style={{ backgroundColor: theme.badgeBg, color: theme.accent }}
                          title="Powiadomienie e-mail aktywne"
                        >
                          <Mail className="w-2.5 h-2.5" />
                          <span>E-mail</span>
                        </span>
                      )}
                    </div>

                    {isDone && (
                      <span className="text-[10px] uppercase font-bold tracking-wider text-[#7ec29a]">
                        Załatwione ✓
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL: ADD CUSTOM FIXED BILL */}
      {isAddBillOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="glass-panel w-full max-w-md p-6 rounded-3xl border border-[#382b20] shadow-2xl relative">
            <button
              onClick={() => setIsAddBillOpen(false)}
              className="absolute top-4 right-4 text-[#9e8f82] hover:text-[#f5ede4]"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-[#d99b5a]" />
              <h3 className="text-lg font-semibold text-[#f5ede4]">
                Dodaj nową stałą opłatę
              </h3>
            </div>
            <p className="text-xs text-[#9e8f82] mb-4">
              Wprowadź nazwę, dzień terminu oraz dzień przypomnienia w każdym miesiącu.
            </p>

            <form onSubmit={handleCreateCustomBill} className="space-y-4">
              <div>
                <label className="text-xs text-[#9e8f82] block mb-1">
                  Nazwa opłaty / sprawy:
                </label>
                <input
                  type="text"
                  required
                  placeholder="np. Internet światłowód, Telefon, Ubezpieczenie OC..."
                  value={newBillTitle}
                  onChange={(e) => setNewBillTitle(e.target.value)}
                  className="w-full bg-[#120e0a] border border-[#382b20] focus:border-[#d99b5a] rounded-xl px-3 py-2 text-sm text-[#f5ede4] outline-none"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[#9e8f82] block mb-1">
                    Termin płatności:
                  </label>
                  <select
                    value={newBillDueDay}
                    onChange={(e) => setNewBillDueDay(e.target.value)}
                    className="w-full bg-[#120e0a] border border-[#382b20] focus:border-[#d99b5a] rounded-xl px-3 py-2 text-xs text-[#f5ede4] outline-none"
                  >
                    <option value="-1">Ostatni dzień miesiąca</option>
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                      <option key={d} value={d}>
                        Do {d}. dnia miesiąca
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-[#9e8f82] block mb-1">
                    Dzień przypomnienia:
                  </label>
                  <select
                    value={newBillReminderDay}
                    onChange={(e) => setNewBillReminderDay(e.target.value)}
                    className="w-full bg-[#120e0a] border border-[#382b20] focus:border-[#d99b5a] rounded-xl px-3 py-2 text-xs text-[#f5ede4] outline-none"
                  >
                    <option value="-1">W ostatni dzień miesiąca</option>
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                      <option key={d} value={d}>
                        {d}. dnia miesiąca
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-[#9e8f82] block mb-1">
                  Dodatkowe uwagi / dane do przelewu (opcjonalnie):
                </label>
                <textarea
                  rows={2}
                  placeholder="np. nr umowy, numer konta..."
                  value={newBillNotes}
                  onChange={(e) => setNewBillNotes(e.target.value)}
                  className="w-full bg-[#120e0a] border border-[#382b20] focus:border-[#d99b5a] rounded-xl px-3 py-2 text-xs text-[#f5ede4] outline-none resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddBillOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-[#9e8f82] hover:text-[#f5ede4]"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#f5ede4] hover:bg-white text-[#120e0a] text-xs font-semibold shadow-md active:scale-95 transition-all"
                >
                  Dodaj opłatę
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
