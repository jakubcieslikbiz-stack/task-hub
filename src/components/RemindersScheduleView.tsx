import React, { useState, useEffect, useMemo } from 'react';
import type { Task, FixedBillItem, MonthlyBillsData } from '../types';
import {
  getStoredRecipientEmail,
  setStoredRecipientEmail,
  sendTaskReminderEmail,
  calculateReminderTimestamp,
  formatScheduledReminder,
  getTimeRemainingText,
  cancelScheduledTaskEmail,
  extractReminderOffsetFromText,
} from '../lib/email';
import { getInitialPreviewsInfo } from '../utils/initialPreviews';
import {
  Bell,
  Clock,
  Calendar,
  Send,
  CheckCircle2,
  AlertCircle,
  Search,
  Plus,
  Trash2,
  Edit2,
  Mail,
  User,
  CheckSquare,
  Landmark,
  X,
  Info,
} from 'lucide-react';

interface RemindersScheduleViewProps {
  tasks: Task[];
  fixedBills: FixedBillItem[];
  monthlyBills: MonthlyBillsData;
  onUpdateTask: (task: Task) => void;
  onAddTask: (task: any) => void;
  onNavigateToSettings?: () => void;
  onNavigateToPersonal?: () => void;
}

type ReminderFilter = 'all' | 'pending' | 'sent' | 'work' | 'personal' | 'bills';

export const RemindersScheduleView: React.FC<RemindersScheduleViewProps> = ({
  tasks,
  fixedBills,
  monthlyBills,
  onUpdateTask,
  onAddTask,
  onNavigateToSettings: _onNavigateToSettings,
  onNavigateToPersonal: _onNavigateToPersonal,
}) => {
  const [filter, setFilter] = useState<ReminderFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [recipientEmail, setRecipientEmail] = useState(getStoredRecipientEmail());
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [tempEmail, setTempEmail] = useState(recipientEmail);
  const [actionNotice, setActionNotice] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [isSendingTest, setIsSendingTest] = useState(false);

  // Modal "+ Nowe przypomnienie"
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<'personal' | 'work'>('personal');
  const [newDate, setNewDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [newTime, setNewTime] = useState('16:00');
  const [newOffsetMinutes, setNewOffsetMinutes] = useState<number>(60); // 1 godzina przed
  const [newNotes, setNewNotes] = useState('');
  const [newSendInstantTest, setNewSendInstantTest] = useState(false);

  // Edit reminder modal state
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');
  const [editNotes, setEditNotes] = useState('');

  // Ticker do odświeżania odliczania czasu co 30 sekund
  const [, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(timer);
  }, []);

  const showNotice = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setActionNotice({ text, type });
    setTimeout(() => setActionNotice(null), 5000);
  };

  const handleSaveEmail = () => {
    if (!tempEmail.trim() || !tempEmail.includes('@')) {
      showNotice('Podaj prawidłowy adres e-mail', 'error');
      return;
    }
    setStoredRecipientEmail(tempEmail.trim());
    setRecipientEmail(tempEmail.trim());
    setIsEditingEmail(false);
    showNotice(`Zaktualizowano adres odbiorcy na: ${tempEmail.trim()}`);
  };

  // Wysyłka błyskawicznego testu kontrolnego
  const handleSendTestPing = async () => {
    setIsSendingTest(true);
    try {
      const nowStr = new Date().toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
      const res = await sendTaskReminderEmail({
        title: `🔔 Test powiadomień JC Studio (${nowStr})`,
        dueDate: new Date().toISOString().split('T')[0],
        dueTime: nowStr,
        notes: 'Testowe sprawdzenie działania skrzynki pocztowej i integracji z Resend.',
        forceImmediate: true,
        priority: 'high',
        category: 'personal',
      });

      if (res.success) {
        showNotice(`Pomyślnie wysłano e-mail testowy na adres: ${recipientEmail}!`);
      } else {
        showNotice(`Błąd wysyłki: ${res.error || 'Sprawdź konfigurację Resend API'}`, 'error');
      }
    } catch (err: any) {
      showNotice(`Błąd wysyłki: ${err.message || 'Nieznany błąd'}`, 'error');
    } finally {
      setIsSendingTest(false);
    }
  };

  // Pobierz wszystkie pozycje z zadaniami mającymi powiadomienia lub przypomnienia
  const reminderItems = useMemo(() => {
    const list: Array<{
      id: string;
      source: 'task' | 'bill';
      taskRef?: Task;
      billRef?: FixedBillItem;
      title: string;
      category: 'work' | 'personal' | 'bills';
      appointmentDate?: string;
      appointmentTime?: string;
      scheduledAt?: string;
      sentAt?: string;
      ruleText: string;
      notes?: string;
      status: 'scheduled' | 'sent' | 'overdue' | 'pending_setup';
      timeRemaining?: { text: string; isPast: boolean };
    }> = [];

    // 1. Zlecenia i sprawy osobiste
    tasks.forEach((t) => {
      // Czy to zadanie ma włączone przypomnienie lub zaplanowaną datę lub w notatkach padło przypomnienie
      const hasReminder =
        Boolean(t.remindByEmail) ||
        Boolean(t.emailReminderScheduledAt) ||
        Boolean(t.emailReminderSentAt) ||
        /przypom/i.test(t.notes || '') ||
        /przypom/i.test(t.title || '');

      if (!hasReminder) return;

      // Wylicz lub pobierz datę zaplanowaną
      let scheduledAt = t.emailReminderScheduledAt;
      if (!scheduledAt && !t.emailReminderSentAt && (t.dueDate || t.dueTime || t.reminderTime || t.notes)) {
        const calculated = calculateReminderTimestamp({
          dueDate: t.dueDate,
          dueTime: t.dueTime,
          reminderTime: t.reminderTime,
          notes: t.notes || t.description,
        });
        if (calculated) {
          scheduledAt = calculated.toISOString();
        }
      }

      // Reguła wyprzedzenia
      let ruleText = t.reminderTime || '1 godzina przed';
      const offsetInfo = extractReminderOffsetFromText(t.reminderTime || t.notes || '');
      if (offsetInfo) {
        ruleText = offsetInfo.label;
      }

      let status: 'scheduled' | 'sent' | 'overdue' | 'pending_setup' = 'scheduled';
      let timeRemaining: { text: string; isPast: boolean } | undefined = undefined;

      if (t.emailReminderSentAt) {
        status = 'sent';
      } else if (scheduledAt) {
        timeRemaining = getTimeRemainingText(scheduledAt);
        if (timeRemaining.isPast) {
          status = 'overdue';
        } else {
          status = 'scheduled';
        }
      } else {
        status = 'pending_setup';
      }

      list.push({
        id: t.id,
        source: 'task',
        taskRef: t,
        title: t.title,
        category: t.category === 'personal' ? 'personal' : 'work',
        appointmentDate: t.dueDate,
        appointmentTime: t.dueTime,
        scheduledAt,
        sentAt: t.emailReminderSentAt,
        ruleText,
        notes: t.notes,
        status,
        timeRemaining,
      });
    });

    // 1b. Ujęcia wstępne dla aktywnych zleceń (w ostatni dzień z 3/4 dni roboczych)
    tasks.forEach((t) => {
      if (t.category === 'personal' || t.status === 'done') return;
      const previewInfo = getInitialPreviewsInfo(t);
      if (!previewInfo.isApplicable) return;

      const isSent = Boolean(t.previewReminderSentAt);
      const isPast = previewInfo.isPast && !isSent;
      const scheduledDate = new Date(`${previewInfo.previewDate}T09:00:00`);

      list.push({
        id: `preview-${t.id}`,
        source: 'task',
        taskRef: t,
        title: `📸 Ujęcia wstępne: ${t.title}`,
        category: 'work',
        appointmentDate: previewInfo.previewDate,
        appointmentTime: '09:00',
        scheduledAt: scheduledDate.toISOString(),
        sentAt: t.previewReminderSentAt,
        ruleText: `Ostatni (${previewInfo.businessDays}.) dzień roboczy ujęć wstępnych`,
        notes: `Wycena: ${t.price ? `${t.price.toLocaleString('pl-PL')} zł` : '—'} • Termin oddania ujęć wstępnych do klienta (${previewInfo.businessDays} dni robocze dla kwoty ${previewInfo.priceThresholdText}).`,
        status: isSent ? 'sent' : isPast ? 'overdue' : 'scheduled',
        timeRemaining: getTimeRemainingText(scheduledDate),
      });
    });

    // 2. Stałe comiesięczne opłaty (Czynsz, ZUS, Podatki itp.)
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const currentMonthKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
    const monthBillsData = monthlyBills[currentMonthKey] || {};

    fixedBills.forEach((b) => {
      const isPaid = monthBillsData[b.id]?.paid;
      // Oblicz datę terminu płatności i przypomnienia w bieżącym miesiącu
      const remDay = b.reminderDay > 0 ? b.reminderDay : 10;
      const remDate = new Date(currentYear, currentMonth, remDay, 9, 0, 0);
      const isPast = remDate.getTime() < now.getTime();

      list.push({
        id: `bill-${b.id}`,
        source: 'bill',
        billRef: b,
        title: b.title,
        category: 'bills',
        appointmentDate: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(b.dueDay > 0 ? b.dueDay : 10).padStart(2, '0')}`,
        appointmentTime: '09:00',
        scheduledAt: remDate.toISOString(),
        sentAt: isPaid ? monthBillsData[b.id]?.paidAt : undefined,
        ruleText: `${b.reminderDayDescription}`,
        notes: b.notes || `Termin płatności: ${b.dueDayDescription}`,
        status: isPaid ? 'sent' : isPast ? 'overdue' : 'scheduled',
        timeRemaining: getTimeRemainingText(remDate),
      });
    });

    // Sortuj chronologicznie: najpierw nadchodzące z najbliższym terminem wysyłki
    return list.sort((a, b) => {
      if (a.status === 'scheduled' && b.status !== 'scheduled') return -1;
      if (b.status === 'scheduled' && a.status !== 'scheduled') return 1;

      const timeA = a.scheduledAt ? new Date(a.scheduledAt).getTime() : 0;
      const timeB = b.scheduledAt ? new Date(b.scheduledAt).getTime() : 0;
      return timeA - timeB;
    });
  }, [tasks, fixedBills, monthlyBills]);

  // Statystyki
  const stats = useMemo(() => {
    const scheduled = reminderItems.filter((i) => i.status === 'scheduled');
    const sent = reminderItems.filter((i) => i.status === 'sent');
    const overdue = reminderItems.filter((i) => i.status === 'overdue');

    // Znajdź najbliższe nadchodzące przypomnienie
    const nextUpcoming = scheduled.length > 0 ? scheduled[0] : null;

    return {
      total: reminderItems.length,
      scheduledCount: scheduled.length,
      sentCount: sent.length,
      overdueCount: overdue.length,
      nextUpcoming,
    };
  }, [reminderItems]);

  // Przefiltrowane pozycje
  const filteredItems = useMemo(() => {
    return reminderItems.filter((item) => {
      // Filtr kategorii / stanu
      if (filter === 'pending' && item.status !== 'scheduled' && item.status !== 'pending_setup') return false;
      if (filter === 'sent' && item.status !== 'sent') return false;
      if (filter === 'work' && item.category !== 'work') return false;
      if (filter === 'personal' && item.category !== 'personal') return false;
      if (filter === 'bills' && item.category !== 'bills') return false;

      // Szukajka tekstowa
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesNotes = item.notes?.toLowerCase().includes(q);
        const matchesRule = item.ruleText.toLowerCase().includes(q);
        if (!matchesTitle && !matchesNotes && !matchesRule) return false;
      }

      return true;
    });
  }, [reminderItems, filter, searchQuery]);

  // Natychmiastowe wysłanie przypomnienia dla danego elementu
  const handleTriggerNow = async (item: typeof reminderItems[0]) => {
    if (item.source === 'task' && item.taskRef && item.id.startsWith('preview-')) {
      const previewInfo = getInitialPreviewsInfo(item.taskRef);
      try {
        const res = await sendTaskReminderEmail({
          title: `Ujęcia wstępne: ${item.taskRef.title}`,
          subject: `📸 [Ujęcia wstępne] Przypomnienie: Termin ujęć wstępnych dla "${item.taskRef.title}"`,
          dueDate: previewInfo.previewDate,
          dueTime: '09:00',
          notes: `Cześć Jakub! Mija ${previewInfo.businessDays}. dzień roboczy dla zlecenia "${item.taskRef.title}". Czas wrócić do klienta z ujęciami wstępnymi! Wycena: ${item.taskRef.price ? `${item.taskRef.price.toLocaleString('pl-PL')} zł` : 'brak'}.`,
          price: item.taskRef.price,
          priority: item.taskRef.priority,
          category: item.taskRef.category,
          forceImmediate: true,
        });

        if (res.success) {
          const nowIso = new Date().toISOString();
          onUpdateTask({
            ...item.taskRef,
            previewReminderSentAt: nowIso,
          });
          showNotice(`Wysłano powiadomienie o ujęciach wstępnych dla "${item.taskRef.title}" na adres: ${recipientEmail}!`);
        } else {
          showNotice(`Błąd: ${res.error || 'Nie udało się wysłać'}`, 'error');
        }
      } catch (err: any) {
        showNotice(`Błąd wysyłki: ${err.message}`, 'error');
      }
      return;
    } else if (item.source === 'task' && item.taskRef) {
      try {
        const res = await sendTaskReminderEmail({
          title: item.taskRef.title,
          dueDate: item.taskRef.dueDate,
          dueTime: item.taskRef.dueTime,
          notes: item.taskRef.notes,
          description: item.taskRef.description,
          price: item.taskRef.price,
          priority: item.taskRef.priority,
          category: item.taskRef.category,
          forceImmediate: true,
        });

        if (res.success) {
          const nowIso = new Date().toISOString();
          onUpdateTask({
            ...item.taskRef,
            emailReminderSentAt: nowIso,
          });
          showNotice(`Wysłano powiadomienie e-mail dla "${item.title}" na adres: ${recipientEmail}!`);
        } else {
          showNotice(`Błąd: ${res.error || 'Nie udało się wysłać'}`, 'error');
        }
      } catch (err: any) {
        showNotice(`Błąd wysyłki: ${err.message}`, 'error');
      }
    } else if (item.source === 'bill' && item.billRef) {
      try {
        const res = await sendTaskReminderEmail({
          title: `Stała opłata: ${item.billRef.title}`,
          dueDate: item.appointmentDate,
          dueTime: '09:00',
          notes: `Rachunek miesięczny. ${item.billRef.notes || ''}`,
          forceImmediate: true,
          category: 'bills',
        });
        if (res.success) {
          showNotice(`Wysłano przypomnienie o opłacie "${item.billRef.title}" na adres: ${recipientEmail}!`);
        } else {
          showNotice(`Błąd: ${res.error || 'Nie udało się wysłać'}`, 'error');
        }
      } catch (err: any) {
        showNotice(`Błąd wysyłki: ${err.message}`, 'error');
      }
    }
  };

  // Anulowanie / wyłączenie przypomnienia
  const handleCancelReminder = async (item: typeof reminderItems[0]) => {
    if (item.id.startsWith('preview-') && item.taskRef) {
      onUpdateTask({
        ...item.taskRef,
        previewReminderSentAt: new Date().toISOString(),
      });
      showNotice(`Wyłączono przypomnienie o ujęciach wstępnych dla "${item.taskRef.title}".`);
      return;
    }

    if (item.source === 'task' && item.taskRef) {
      if (item.taskRef.emailReminderId) {
        await cancelScheduledTaskEmail(item.taskRef.emailReminderId);
      }
      onUpdateTask({
        ...item.taskRef,
        remindByEmail: false,
        emailReminderScheduledAt: undefined,
        emailReminderId: undefined,
      });
      showNotice(`Wyłączono przypomnienie e-mail dla: "${item.title}"`);
    } else {
      showNotice(`Rachunki comiesięczne możesz edytować w sekcji "Moje Sprawy & Opłaty".`, 'info');
    }
  };

  // Utworzenie nowego przypomnienia z modala
  const handleCreateNewReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      showNotice('Podaj nazwę sprawy lub zlecenia', 'error');
      return;
    }

    const trimmedTitle = newTitle.trim();
    const [yearStr, monthStr, dayStr] = newDate.split('-');
    const [hourStr, minStr] = newTime.split(':');

    // Data spotkania / wizyty
    const appointmentDate = new Date(
      parseInt(yearStr, 10),
      parseInt(monthStr, 10) - 1,
      parseInt(dayStr, 10),
      parseInt(hourStr || '16', 10),
      parseInt(minStr || '0', 10),
      0
    );

    // Data wysyłki e-maila (odjęte minuty)
    const reminderDate = new Date(appointmentDate.getTime() - newOffsetMinutes * 60 * 1000);
    const scheduledIso = reminderDate.toISOString();

    let offsetLabel = '1 godzinę przed';
    if (newOffsetMinutes === 15) offsetLabel = '15 minut przed';
    if (newOffsetMinutes === 30) offsetLabel = '30 minut przed';
    if (newOffsetMinutes === 60) offsetLabel = '1 godzinę przed';
    if (newOffsetMinutes === 120) offsetLabel = '2 godziny przed';
    if (newOffsetMinutes === 1440) offsetLabel = '1 dzień przed';
    if (newOffsetMinutes === 0) offsetLabel = 'w momencie terminu';

    let reminderId: string | undefined = undefined;

    // Jeśli użytkownik zażądał natychmiastowego testu lub przypomnienie jest w przyszłości
    if (newSendInstantTest) {
      await sendTaskReminderEmail({
        title: `[POTWIERDZENIE] ${trimmedTitle}`,
        dueDate: newDate,
        dueTime: newTime,
        reminderTime: offsetLabel,
        notes: newNotes ? `${newNotes} • Wizyta zaplanowana na ${newDate} godz. ${newTime}` : `Wizyta zaplanowana na ${newDate} godz. ${newTime}`,
        forceImmediate: true,
        category: newCategory,
      });
    }

    // Zaplanuj w Resend
    if (reminderDate.getTime() > Date.now()) {
      const emailRes = await sendTaskReminderEmail({
        title: trimmedTitle,
        dueDate: newDate,
        dueTime: newTime,
        reminderTime: offsetLabel,
        notes: newNotes ? `${newNotes} • Przypomnienie ${offsetLabel}` : `Przypomnienie ${offsetLabel}`,
        scheduledAt: scheduledIso,
        category: newCategory,
      });
      if (emailRes.success) {
        reminderId = emailRes.id;
      }
    }

    onAddTask({
      name: trimmedTitle,
      category: newCategory,
      dueDate: newDate,
      dueTime: newTime,
      reminderTime: offsetLabel,
      remindByEmail: true,
      emailReminderScheduledAt: scheduledIso,
      emailReminderId: reminderId,
      notes: newNotes.trim() ? `${newNotes.trim()} • Przypomnienie: ${offsetLabel}` : `Przypomnienie: ${offsetLabel}`,
      stickyColor: 'honey',
    });

    showNotice(`Zaplanowano przypomnienie e-mail na: ${formatScheduledReminder(reminderDate)}!`);
    setIsNewModalOpen(false);
    setNewTitle('');
    setNewNotes('');
    setNewSendInstantTest(false);
  };

  // Edycja terminu
  const handleOpenEdit = (task: Task) => {
    setEditingTask(task);
    setEditDate(task.dueDate || new Date().toISOString().split('T')[0]);
    setEditTime(task.dueTime || '12:00');
    setEditNotes(task.notes || '');
  };

  const handleSaveEdit = async () => {
    if (!editingTask) return;

    // Przelicz nową datę przypomnienia
    const targetDate = calculateReminderTimestamp({
      dueDate: editDate,
      dueTime: editTime,
      notes: editNotes || editingTask.notes,
    });

    let newScheduledIso: string | undefined = undefined;
    let newId = editingTask.emailReminderId;

    if (targetDate && targetDate.getTime() > Date.now()) {
      newScheduledIso = targetDate.toISOString();
      if (editingTask.emailReminderId) {
        await cancelScheduledTaskEmail(editingTask.emailReminderId);
      }
      const res = await sendTaskReminderEmail({
        title: editingTask.title,
        dueDate: editDate,
        dueTime: editTime,
        notes: editNotes,
        scheduledAt: newScheduledIso,
        category: editingTask.category,
      });
      if (res.success) {
        newId = res.id;
      }
    }

    onUpdateTask({
      ...editingTask,
      dueDate: editDate,
      dueTime: editTime,
      notes: editNotes || undefined,
      emailReminderScheduledAt: newScheduledIso,
      emailReminderId: newId,
      emailReminderSentAt: undefined, // zresetuj stan wysłania po zmianie terminu
      remindByEmail: true,
    });

    showNotice(`Zaktualizowano termin powiadomienia dla: "${editingTask.title}"!`);
    setEditingTask(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Toast Alert Notice */}
      {actionNotice && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-md text-xs font-medium border animate-in slide-in-from-top-2 duration-200 ${
            actionNotice.type === 'error'
              ? 'bg-[#2a1310]/95 text-[#f87171] border-[#ef4444]/40'
              : actionNotice.type === 'info'
              ? 'bg-[#121c2a]/95 text-[#60a5fa] border-[#3b82f6]/40'
              : 'bg-[#152419]/95 text-[#4ade80] border-[#22c55e]/40'
          }`}
        >
          {actionNotice.type === 'error' ? (
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
          ) : actionNotice.type === 'info' ? (
            <Info className="w-4 h-4 flex-shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          )}
          <span>{actionNotice.text}</span>
          <button
            onClick={() => setActionNotice(null)}
            className="ml-2 text-white/50 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top 4 KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Next Upcoming Reminder */}
        <div className="glass-panel p-4 rounded-3xl border border-[#2e231c] relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#9e8f82] flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#d99b5a]" />
              Najbliższe powiadomienie
            </span>
            {stats.nextUpcoming && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#d99b5a]/20 text-[#f1c38e] border border-[#d99b5a]/40 animate-pulse">
                {stats.nextUpcoming.timeRemaining?.text || 'nadchodzi'}
              </span>
            )}
          </div>
          {stats.nextUpcoming ? (
            <div>
              <h3 className="text-sm font-medium text-[#f5ede4] line-clamp-1">
                {stats.nextUpcoming.title}
              </h3>
              <p className="text-xs text-[#d99b5a] mt-0.5 font-mono">
                {stats.nextUpcoming.appointmentDate} • {stats.nextUpcoming.appointmentTime || '09:00'}
              </p>
              <p className="text-[11px] text-[#9e8f82] mt-1 line-clamp-1">
                Reguła: {stats.nextUpcoming.ruleText}
              </p>
            </div>
          ) : (
            <div>
              <p className="text-xs text-[#9e8f82] italic">Brak zaplanowanych powiadomień</p>
              <p className="text-[10px] text-[#6b5b4f] mt-1">Dodaj wizytę lub zadanie z wyprzedzeniem</p>
            </div>
          )}
        </div>

        {/* Scheduled Count */}
        <div className="glass-panel p-4 rounded-3xl border border-[#2e231c] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#9e8f82] flex items-center gap-1.5">
              <Bell className="w-3.5 h-3.5 text-[#7ec29a]" />
              Aktywne (Oczekujące)
            </span>
            <span className="w-2 h-2 rounded-full bg-[#7ec29a] animate-ping" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-light text-[#f5ede4]">{stats.scheduledCount}</span>
            <span className="text-xs text-[#9e8f82]">w kolejce</span>
          </div>
          <p className="text-[11px] text-[#7ec29a]/80 mt-1">
            Automatycznie wysyłane przed czasem
          </p>
        </div>

        {/* Sent Count */}
        <div className="glass-panel p-4 rounded-3xl border border-[#2e231c] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#9e8f82] flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#9e8f82]" />
              Doręczone e-maile
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-light text-[#f5ede4]">{stats.sentCount}</span>
            <span className="text-xs text-[#9e8f82]">wysłanych</span>
          </div>
          <p className="text-[11px] text-[#9e8f82] mt-1">
            Zarchiwizowane potwierdzenia
          </p>
        </div>

        {/* Recipient Email & Quick Test */}
        <div className="glass-panel p-4 rounded-3xl border border-[#2e231c] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#9e8f82] flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-[#d99b5a]" />
              Adres odbiorcy
            </span>
            <button
              onClick={() => setIsEditingEmail(!isEditingEmail)}
              className="text-[10px] text-[#d99b5a] hover:underline"
            >
              {isEditingEmail ? 'Anuluj' : 'Zmień'}
            </button>
          </div>
          {isEditingEmail ? (
            <div className="flex items-center gap-1.5 mt-1">
              <input
                type="email"
                value={tempEmail}
                onChange={(e) => setTempEmail(e.target.value)}
                className="w-full bg-[#120e0a] border border-[#382b20] rounded-xl px-2.5 py-1 text-xs text-[#f5ede4] outline-none"
              />
              <button
                onClick={handleSaveEmail}
                className="px-2.5 py-1 bg-[#d99b5a] text-[#120e0a] text-xs font-semibold rounded-xl hover:bg-[#e6ab6e]"
              >
                Zapisz
              </button>
            </div>
          ) : (
            <div>
              <p className="text-xs font-medium text-[#f5ede4] truncate" title={recipientEmail}>
                {recipientEmail}
              </p>
              <div className="mt-2 flex items-center gap-2">
                <button
                  onClick={handleSendTestPing}
                  disabled={isSendingTest}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-medium bg-[#2a1e16] hover:bg-[#382b20] text-[#f1c38e] border border-[#d99b5a]/30 transition-all active:scale-95 disabled:opacity-50"
                  title="Wysyła testowego maila w 1 sekundę na Twoją skrzynkę"
                >
                  <Send className={`w-3 h-3 ${isSendingTest ? 'animate-spin' : ''}`} />
                  {isSendingTest ? 'Wysyłam...' : 'Wyślij test kontrolny'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Control Bar: Filters, Search, Add Button */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
        {/* Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
              filter === 'all'
                ? 'bg-[#f5ede4] text-[#120e0a]'
                : 'bg-[#1a1410] text-[#9e8f82] hover:text-[#f5ede4] border border-[#2e231c]'
            }`}
          >
            Wszystkie ({stats.total})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              filter === 'pending'
                ? 'bg-[#7ec29a] text-[#0a1810]'
                : 'bg-[#1a1410] text-[#9e8f82] hover:text-[#7ec29a] border border-[#2e231c]'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#7ec29a]" />
            Nadchodzące ({stats.scheduledCount})
          </button>
          <button
            onClick={() => setFilter('sent')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
              filter === 'sent'
                ? 'bg-[#f5ede4] text-[#120e0a]'
                : 'bg-[#1a1410] text-[#9e8f82] hover:text-[#f5ede4] border border-[#2e231c]'
            }`}
          >
            Wysłane ({stats.sentCount})
          </button>
          <button
            onClick={() => setFilter('personal')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap flex items-center gap-1 ${
              filter === 'personal'
                ? 'bg-[#f5ede4] text-[#120e0a]'
                : 'bg-[#1a1410] text-[#9e8f82] hover:text-[#f5ede4] border border-[#2e231c]'
            }`}
          >
            <User className="w-3 h-3 text-[#7ec29a]" />
            Osobiste
          </button>
          <button
            onClick={() => setFilter('work')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap flex items-center gap-1 ${
              filter === 'work'
                ? 'bg-[#f5ede4] text-[#120e0a]'
                : 'bg-[#1a1410] text-[#9e8f82] hover:text-[#f5ede4] border border-[#2e231c]'
            }`}
          >
            <CheckSquare className="w-3 h-3 text-[#d99b5a]" />
            Zlecenia 3D
          </button>
          <button
            onClick={() => setFilter('bills')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap flex items-center gap-1 ${
              filter === 'bills'
                ? 'bg-[#f5ede4] text-[#120e0a]'
                : 'bg-[#1a1410] text-[#9e8f82] hover:text-[#f5ede4] border border-[#2e231c]'
            }`}
          >
            <Landmark className="w-3 h-3 text-[#60a5fa]" />
            Rachunki stałe
          </button>
        </div>

        {/* Search & Add New button */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 text-[#9e8f82] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filtruj przypomnienia..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#16100c] border border-[#2e231c] rounded-2xl pl-8 pr-3 py-1.5 text-xs text-[#f5ede4] placeholder-[#6b5b4f] outline-none focus:border-[#d99b5a]/60"
            />
          </div>

          <button
            onClick={() => setIsNewModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#f5ede4] hover:bg-white text-[#120e0a] rounded-2xl text-xs font-medium shadow-md transition-all active:scale-95 whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Nowe przypomnienie</span>
          </button>
        </div>
      </div>

      {/* Main List / Table of Reminders */}
      <div className="space-y-3">
        {filteredItems.length === 0 ? (
          <div className="glass-panel p-10 rounded-3xl border border-[#2e231c] text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#2a1e16] border border-[#3d2c20] flex items-center justify-center mx-auto text-[#d99b5a]">
              <Bell className="w-6 h-6" />
            </div>
            <h3 className="text-base font-medium text-[#f5ede4]">
              Brak powiadomień w wybranym filtrze
            </h3>
            <p className="text-xs text-[#9e8f82] max-w-md mx-auto">
              Nie znaleziono żadnych przypomnień e-mail. Możesz kliknąć <strong>+ Nowe przypomnienie</strong>, aby zaplanować powiadomienie z wyprzedzeniem (np. 1h przed fryzjerem czy wizytą u lekarza).
            </p>
            <button
              onClick={() => setIsNewModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#d99b5a] text-[#120e0a] rounded-2xl text-xs font-semibold hover:bg-[#e6ab6e] transition-colors"
            >
              <Plus className="w-4 h-4" />
              Zaplanuj pierwsze przypomnienie
            </button>
          </div>
        ) : (
          filteredItems.map((item) => {
            const isPersonal = item.category === 'personal';
            const isBill = item.category === 'bills';

            return (
              <div
                key={item.id}
                className="glass-panel p-4 sm:p-5 rounded-3xl border border-[#2e231c] hover:border-[#3d2c20] transition-all relative overflow-hidden group"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Left Column: Icon, Title, Tags, Time */}
                  <div className="flex items-start gap-3.5 flex-1 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 border ${
                        isPersonal
                          ? 'bg-[#18261e] border-[#7ec29a]/30 text-[#7ec29a]'
                          : isBill
                          ? 'bg-[#121c2a] border-[#60a5fa]/30 text-[#60a5fa]'
                          : 'bg-[#2a1e16] border-[#d99b5a]/30 text-[#d99b5a]'
                      }`}
                    >
                      {isPersonal ? (
                        <User className="w-5 h-5" />
                      ) : isBill ? (
                        <Landmark className="w-5 h-5" />
                      ) : (
                        <CheckSquare className="w-5 h-5" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-sm font-medium text-[#f5ede4] truncate">
                          {item.title}
                        </span>

                        {/* Category badge */}
                        <span
                          className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${
                            isPersonal
                              ? 'bg-[#18261e] text-[#9ee2b9] border-[#7ec29a]/30'
                              : isBill
                              ? 'bg-[#121c2a] text-[#93c5fd] border-[#60a5fa]/30'
                              : 'bg-[#2a1e16] text-[#f1c38e] border-[#d99b5a]/30'
                          }`}
                        >
                          {isPersonal ? 'Osobiste / Wizyta' : isBill ? 'Stały rachunek' : 'Zlecenie 3D'}
                        </span>

                        {/* Status Badge */}
                        {item.status === 'sent' ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#18261e] text-[#4ade80] border border-[#22c55e]/30">
                            <CheckCircle2 className="w-3 h-3" />
                            Wysłano {item.sentAt ? `(${new Date(item.sentAt).toLocaleDateString('pl-PL')})` : ''}
                          </span>
                        ) : item.status === 'overdue' ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#2a1310] text-[#f87171] border border-[#ef4444]/30">
                            <AlertCircle className="w-3 h-3" />
                            Termin minął
                          </span>
                        ) : item.status === 'scheduled' ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#2a1e16] text-[#f1c38e] border border-[#d99b5a]/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#d99b5a] animate-pulse" />
                            {item.timeRemaining?.text || 'Zaplanowane'}
                          </span>
                        ) : (
                          <span className="text-[10px] text-[#9e8f82]">Oczekuje na termin</span>
                        )}
                      </div>

                      {/* Schedule details line */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#9e8f82] mt-1 font-mono">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-[#d99b5a]" />
                          Termin wizyty: <strong className="text-[#f5ede4] font-normal">{item.appointmentDate || 'Brak daty'}</strong>
                          {item.appointmentTime && <span>godz. {item.appointmentTime}</span>}
                        </span>

                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-[#7ec29a]" />
                          Wysyłka e-mail: <strong className="text-[#f5ede4] font-normal">{item.ruleText}</strong>
                        </span>

                        {item.scheduledAt && (
                          <span className="text-[11px] text-[#6b5b4f]">
                            (Dokładnie: {formatScheduledReminder(new Date(item.scheduledAt))})
                          </span>
                        )}
                      </div>

                      {/* Notes / Instructions if any */}
                      {item.notes && (
                        <div className="mt-2 text-xs text-[#b8a99a] bg-[#140e0b] px-3 py-1.5 rounded-xl border border-[#2e231c]/60 max-w-xl">
                          <span className="text-[#d99b5a] font-medium mr-1.5">Notatka:</span>
                          {item.notes}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Actions */}
                  <div className="flex items-center gap-2 self-end md:self-center flex-shrink-0">
                    {/* Send immediate test / trigger */}
                    <button
                      onClick={() => handleTriggerNow(item)}
                      title="Wyślij powiadomienie natychmiast jako test"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-[#2a1e16] hover:bg-[#382b20] text-[#f1c38e] border border-[#d99b5a]/30 transition-all active:scale-95"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Wyślij teraz (Test)</span>
                    </button>

                    {/* Edit date/time for task */}
                    {item.source === 'task' && item.taskRef && (
                      <button
                        onClick={() => handleOpenEdit(item.taskRef!)}
                        title="Zmień termin lub godzinę"
                        className="p-1.5 rounded-xl text-[#9e8f82] hover:text-[#f5ede4] hover:bg-[#251b14] border border-transparent hover:border-[#382b20] transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* Cancel reminder */}
                    {item.source === 'task' && (
                      <button
                        onClick={() => handleCancelReminder(item)}
                        title="Wyłącz powiadomienie e-mail"
                        className="p-1.5 rounded-xl text-[#9e8f82] hover:text-[#f87171] hover:bg-[#2a1310] border border-transparent hover:border-[#ef4444]/30 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Explanatory Help Card */}
      <div className="p-5 rounded-3xl border border-[#2e231c] bg-[#16100c]/80 flex items-start gap-4 text-xs text-[#9e8f82]">
        <div className="w-8 h-8 rounded-2xl bg-[#d99b5a]/10 border border-[#d99b5a]/20 flex items-center justify-center flex-shrink-0 text-[#d99b5a]">
          <Info className="w-4 h-4" />
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-medium text-[#f5ede4]">
            Jak działa inteligentny harmonogram powiadomień JC Studio?
          </h4>
          <p className="leading-relaxed">
            • <strong>Rozpoznawanie notatek:</strong> Gdy w notatkach zlecenia lub sprawy osobistej (np. <em>fryzjer</em>) wpiszesz <code>przypomnij mi godzinę przed</code> lub <code>30 minut wcześniej</code>, system automatycznie zaplanuje powiadomienie e-mail z dokładnym wyprzedzeniem.
          </p>
          <p className="leading-relaxed">
            • <strong>Wysyłka w chmurze (Resend):</strong> Wszystkie powiadomienia trafiają bezpośrednio na Twój adres <strong>{recipientEmail}</strong> z profesjonalną estetyką JC Studio.
          </p>
        </div>
      </div>

      {/* MODAL: + NOWE PRZYPOMNIENIE */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg glass-panel rounded-3xl p-6 border border-[#3d2c20] shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-[#2e231c]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-2xl bg-[#d99b5a]/15 border border-[#d99b5a]/30 flex items-center justify-center text-[#d99b5a]">
                  <Bell className="w-4 h-4" />
                </div>
                <h3 className="text-lg font-light text-[#f5ede4]">Nowe powiadomienie w harmonogramie</h3>
              </div>
              <button
                onClick={() => setIsNewModalOpen(false)}
                className="text-[#9e8f82] hover:text-[#f5ede4]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNewReminder} className="space-y-4 pt-4">
              {/* Nazwa */}
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[#9e8f82] mb-1">
                  Nazwa sprawy / zlecenia *
                </label>
                <input
                  type="text"
                  placeholder="np. Fryzjer, Wizyta u lekarza, Telefon do klienta..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-[#120e0a] border border-[#382b20] focus:border-[#d99b5a] rounded-2xl px-3.5 py-2.5 text-sm text-[#f5ede4] outline-none"
                  autoFocus
                />
              </div>

              {/* Kategoria */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setNewCategory('personal')}
                  className={`p-2.5 rounded-2xl border text-xs font-medium flex items-center justify-center gap-2 transition-colors ${
                    newCategory === 'personal'
                      ? 'bg-[#18261e] text-[#9ee2b9] border-[#7ec29a]'
                      : 'bg-[#120e0a] text-[#9e8f82] border-[#2e231c]'
                  }`}
                >
                  <User className="w-4 h-4" />
                  Sprawa osobista / Wizyta
                </button>
                <button
                  type="button"
                  onClick={() => setNewCategory('work')}
                  className={`p-2.5 rounded-2xl border text-xs font-medium flex items-center justify-center gap-2 transition-colors ${
                    newCategory === 'work'
                      ? 'bg-[#2a1e16] text-[#f1c38e] border-[#d99b5a]'
                      : 'bg-[#120e0a] text-[#9e8f82] border-[#2e231c]'
                  }`}
                >
                  <CheckSquare className="w-4 h-4" />
                  Zlecenie JC Studio
                </button>
              </div>

              {/* Data & Godzina terminu */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-[#9e8f82] mb-1">
                    Data terminu *
                  </label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full bg-[#120e0a] border border-[#382b20] focus:border-[#d99b5a] rounded-2xl px-3 py-2 text-xs text-[#f5ede4] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-[#9e8f82] mb-1">
                    Godzina terminu *
                  </label>
                  <input
                    type="time"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-full bg-[#120e0a] border border-[#382b20] focus:border-[#d99b5a] rounded-2xl px-3 py-2 text-xs text-[#f5ede4] outline-none"
                  />
                </div>
              </div>

              {/* Wyprzedzenie powiadomienia e-mail */}
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[#9e8f82] mb-1">
                  Kiedy wysłać przypomnienie e-mail?
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: '15 min przed', mins: 15 },
                    { label: '30 min przed', mins: 30 },
                    { label: '1h przed', mins: 60 },
                    { label: '2h przed', mins: 120 },
                    { label: '1 dzień przed', mins: 1440 },
                    { label: 'W momencie', mins: 0 },
                  ].map((opt) => (
                    <button
                      key={opt.mins}
                      type="button"
                      onClick={() => setNewOffsetMinutes(opt.mins)}
                      className={`p-2 rounded-xl text-xs font-medium border text-center transition-colors ${
                        newOffsetMinutes === opt.mins
                          ? 'bg-[#d99b5a] text-[#120e0a] border-[#d99b5a] font-semibold'
                          : 'bg-[#120e0a] text-[#9e8f82] border-[#2e231c] hover:text-[#f5ede4]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notatki */}
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[#9e8f82] mb-1">
                  Notatki / Szczegóły (opcjonalnie)
                </label>
                <textarea
                  rows={2}
                  placeholder="np. Adres salonu, dokumenty do zabrania..."
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full bg-[#120e0a] border border-[#382b20] focus:border-[#d99b5a] rounded-2xl px-3.5 py-2 text-xs text-[#f5ede4] placeholder-[#6b5b4f] outline-none resize-none"
                />
              </div>

              {/* Checkbox instant test */}
              <label className="flex items-center gap-2 text-xs text-[#9e8f82] cursor-pointer hover:text-[#f5ede4]">
                <input
                  type="checkbox"
                  checked={newSendInstantTest}
                  onChange={(e) => setNewSendInstantTest(e.target.checked)}
                  className="rounded border-[#382b20] bg-[#120e0a] text-[#d99b5a] focus:ring-0"
                />
                <span>Wyślij natychmiast kopię potwierdzającą na mój e-mail</span>
              </label>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#2e231c]">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-4 py-2 rounded-2xl text-xs text-[#9e8f82] hover:text-[#f5ede4]"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#d99b5a] hover:bg-[#e6ab6e] text-[#120e0a] font-semibold text-xs rounded-2xl shadow-lg transition-all active:scale-95"
                >
                  Zaplanuj w harmonogramie
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDYCJA TERMINU */}
      {editingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md glass-panel rounded-3xl p-6 border border-[#3d2c20] shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-[#2e231c]">
              <h3 className="text-base font-light text-[#f5ede4]">
                Zmień termin powiadomienia
              </h3>
              <button
                onClick={() => setEditingTask(null)}
                className="text-[#9e8f82] hover:text-[#f5ede4]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 pt-4">
              <div>
                <p className="text-xs text-[#9e8f82]">Zadanie:</p>
                <p className="text-sm font-medium text-[#f5ede4]">{editingTask.title}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-[#9e8f82] mb-1">
                    Nowa data
                  </label>
                  <input
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="w-full bg-[#120e0a] border border-[#382b20] focus:border-[#d99b5a] rounded-xl px-3 py-2 text-xs text-[#f5ede4] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-[#9e8f82] mb-1">
                    Godzina
                  </label>
                  <input
                    type="time"
                    value={editTime}
                    onChange={(e) => setEditTime(e.target.value)}
                    className="w-full bg-[#120e0a] border border-[#382b20] focus:border-[#d99b5a] rounded-xl px-3 py-2 text-xs text-[#f5ede4] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[#9e8f82] mb-1">
                  Uwagi / Instrukcja wyprzedzenia
                </label>
                <input
                  type="text"
                  placeholder="np. przypomnij mi 1h przed"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full bg-[#120e0a] border border-[#382b20] focus:border-[#d99b5a] rounded-xl px-3 py-2 text-xs text-[#f5ede4] outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#2e231c]">
                <button
                  type="button"
                  onClick={() => setEditingTask(null)}
                  className="px-4 py-2 rounded-xl text-xs text-[#9e8f82] hover:text-[#f5ede4]"
                >
                  Anuluj
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  className="px-4 py-2 bg-[#d99b5a] hover:bg-[#e6ab6e] text-[#120e0a] font-semibold text-xs rounded-xl"
                >
                  Zapisz zmiany
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
