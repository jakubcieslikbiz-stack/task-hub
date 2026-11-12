import React, { useState } from 'react';
import type { Task, Priority, Status } from '../types';
import { CATEGORIES } from '../data/initialData';
import { sendTaskReminderEmail, formatScheduledReminder } from '../lib/email';
import {
  Pencil,
  Trash2,
  Check,
  ChevronDown,
  ChevronRight,
  Mail,
  Loader2,
  Plus,
  Clock,
  MessageSquare,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface TaskTableProps {
  tasks: Task[];
  onToggleStatus: (id: string) => void;
  onUpdateStatus: (id: string, status: Status) => void;
  onToggleSubtask: (taskId: string, subtaskId: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onOpenNew?: () => void;
  onToggleWaitingForFeedback?: (id: string) => void;
}

const PRIORITY_BADGES: Record<Priority, { label: string; className: string }> = {
  urgent: {
    label: 'PILNE',
    className: 'bg-[#e07a68]/15 text-[#f19b8c] border-[#e07a68]/30',
  },
  high: {
    label: 'WYSOKI',
    className: 'bg-[#d99b5a]/15 text-[#f1c38e] border-[#d99b5a]/30',
  },
  medium: {
    label: 'ŚREDNI',
    className: 'bg-[#d99b5a]/10 text-[#d99b5a] border-[#d99b5a]/30',
  },
  low: {
    label: 'NISKI',
    className: 'bg-[#251b14] text-[#9e8f82] border-[#382b20]',
  },
};

function getDaysRemainingInfo(
  dueDate?: string,
  dueTime?: string,
  isDone?: boolean,
  isPaid?: boolean
): { text: string; className: string } | null {
  if (isPaid) {
    return {
      text: dueTime ? `opłacone • godz. ${dueTime}` : 'opłacone',
      className: 'text-[#7ec29a]',
    };
  }
  if (isDone) {
    return {
      text: dueTime ? `gotowe • godz. ${dueTime}` : 'gotowe',
      className: 'text-[#7ec29a]',
    };
  }

  if (!dueDate) {
    if (dueTime) return { text: `godz. ${dueTime}`, className: 'text-[#d99b5a]' };
    return null;
  }

  const parts = dueDate.split('-').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) {
    if (dueTime) return { text: `godz. ${dueTime}`, className: 'text-[#d99b5a]' };
    return null;
  }

  const due = new Date(parts[0], parts[1] - 1, parts[2]);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffTime = due.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  let label = '';
  let colorClass = 'text-[#d99b5a]';

  if (diffDays < 0) {
    const abs = Math.abs(diffDays);
    label = abs === 1 ? '1 dzień po terminie' : `${abs} dni po terminie`;
    colorClass = 'text-[#e07a68]';
  } else if (diffDays === 0) {
    label = 'termin dzisiaj';
    colorClass = 'text-[#e07a68] font-semibold';
  } else if (diffDays === 1) {
    label = 'został 1 dzień (jutro)';
    colorClass = 'text-[#d99b5a] font-semibold';
  } else {
    const lastDigit = diffDays % 10;
    const lastTwo = diffDays % 100;
    if (lastDigit >= 2 && lastDigit <= 4 && (lastTwo < 10 || lastTwo >= 20)) {
      label = `zostały ${diffDays} dni`;
    } else {
      label = `zostało ${diffDays} dni`;
    }
    colorClass = 'text-[#d99b5a]';
  }

  if (dueTime) {
    label = `${label} • godz. ${dueTime}`;
  }

  return { text: label, className: colorClass };
}

export const TaskTable: React.FC<TaskTableProps> = ({
  tasks,
  onUpdateStatus,
  onToggleSubtask,
  onEdit,
  onDelete,
  onOpenNew,
  onToggleWaitingForFeedback,
}) => {
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const [sendingEmailId, setSendingEmailId] = useState<string | null>(null);
  const [emailSentStatus, setEmailSentStatus] = useState<Record<string, boolean>>({});
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  const toggleRowExpanded = (id: string) => {
    setExpandedRowId((prev) => (prev === id ? null : id));
  };

  const handleToggleDone = (task: Task) => {
    const isDone = task.status === 'done' || task.status === 'paid';
    if (!isDone) {
      confetti({
        particleCount: 40,
        spread: 50,
        origin: { y: 0.8 },
        colors: ['#f5ede4', '#7ec29a', '#d99b5a'],
      });
      onUpdateStatus(task.id, 'done');
    } else {
      onUpdateStatus(task.id, 'in_progress');
    }
  };

  const handleTogglePaid = (task: Task) => {
    const isPaid = task.status === 'paid';
    if (!isPaid) {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#f5ede4', '#d99b5a', '#7ec29a', '#c88d51'],
      });
      onUpdateStatus(task.id, 'paid');
    } else {
      onUpdateStatus(task.id, 'done');
    }
  };

  const handleQuickSendEmail = async (task: Task) => {
    setSendingEmailId(task.id);
    const res = await sendTaskReminderEmail({
      title: task.title,
      dueDate: task.dueDate,
      dueTime: task.dueTime,
      reminderTime: task.reminderTime,
      forceImmediate: true,
      price: task.price,
      priority: task.priority,
      category: task.category,
      notes: task.notes,
      description: task.description,
      subtasks: task.subtasks.map((s) => s.title),
    });
    setSendingEmailId(null);
    if (res.success) {
      setEmailSentStatus((prev) => ({ ...prev, [task.id]: true }));
      setTimeout(() => {
        setEmailSentStatus((prev) => ({ ...prev, [task.id]: false }));
      }, 3500);
    } else {
      alert(`Błąd wysyłki e-mail: ${res.error || 'Nieznany błąd'}`);
    }
  };

  if (tasks.length === 0) {
    return (
      <div className="py-16 text-center flex flex-col items-center justify-center border border-dashed border-[#2e231c] rounded-3xl p-6 glass-panel">
        <h3 className="text-base font-light text-[#f5ede4]">Brak zleceń do wyświetlenia</h3>
        <p className="text-xs text-[#9e8f82] max-w-sm mt-1">
          Nie znaleziono zleceń spełniających wybrane kryteria filtrów.
        </p>
        {onOpenNew && (
          <button
            onClick={onOpenNew}
            className="mt-4 flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#f5ede4] hover:bg-white text-[#120e0a] text-xs font-medium shadow-md transition-all active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            Dodaj nowe zlecenie
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="w-full glass-panel rounded-3xl border border-[#2e231c] shadow-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[840px] text-left border-collapse">
          {/* Table Header */}
          <thead>
            <tr className="border-b border-[#2e231c] bg-[#140f0c]/90 text-[11px] font-mono tracking-[0.14em] uppercase text-[#9e8f82]">
              <th className="py-4 pl-6 pr-4 font-normal">Projekt</th>
              <th className="py-4 px-4 font-normal">Priorytet</th>
              <th className="py-4 px-4 font-normal">Budżet</th>
              <th className="py-4 px-4 font-normal text-center">Gotowe</th>
              <th className="py-4 px-4 font-normal text-center">Opłacone</th>
              <th className="py-4 px-4 font-normal text-center">
                <span className="inline-flex items-center gap-1">
                  <MessageSquare className="w-3 h-3 text-[#c084fc]" />
                  Czekam na uwagi
                </span>
              </th>
              <th className="py-4 px-4 font-normal">
                <span className="inline-flex items-center gap-1 text-[#f5ede4]">
                  Termin (DDL)
                  <span className="text-[#d99b5a] text-[11px] font-bold" title="Posortowane od najbliższego terminu">
                    ↑
                  </span>
                </span>
              </th>
              <th className="py-4 px-4 font-normal">Uwagi</th>
              <th className="py-4 pl-4 pr-6 font-normal text-right">Akcje</th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-[#261d17]/80 text-xs">
            {tasks.map((task) => {
              const isDone = task.status === 'done' || task.status === 'paid';
              const isPaid = task.status === 'paid';
              const priorityConfig = PRIORITY_BADGES[task.priority] || PRIORITY_BADGES.medium;
              const category = CATEGORIES.find((c) => c.id === task.category);
              const budgetFormatted = (Number(task.price) || 0).toLocaleString('pl-PL', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              });

              // Date range representation (startDate -> dueDate)
              const hasStart = !!task.startDate;
              const hasDue = !!task.dueDate;
              let dateDisplay = '-';
              if (hasStart && hasDue) {
                dateDisplay = `${task.startDate} → ${task.dueDate}`;
              } else if (hasDue) {
                dateDisplay = task.dueDate || '-';
              } else if (hasStart) {
                dateDisplay = task.startDate || '-';
              }

              const completedSubtasks = task.subtasks.filter((s) => s.completed).length;
              const hasSubtasks = task.subtasks.length > 0;
              const isExpanded = expandedRowId === task.id;
              const isPersonal = task.category === 'personal';
              const daysRemainingInfo = getDaysRemainingInfo(
                task.dueDate || task.startDate,
                task.dueTime,
                isDone,
                isPaid
              );

              return (
                <React.Fragment key={task.id}>
                  <tr
                    className={`group transition-colors ${
                      task.isWaitingForFeedback && !isDone && !isPaid
                        ? 'bg-[#22162a]/90 hover:bg-[#2c1d36] border-l-4 border-l-[#a855f7]'
                        : isPersonal
                        ? isPaid
                          ? 'bg-[#2a2119]/85 hover:bg-[#352a20]'
                          : isDone
                          ? 'bg-[#261e17]/80 hover:bg-[#30261e]'
                          : 'bg-[#3b2d21]/95 hover:bg-[#493829]'
                        : isPaid
                        ? 'bg-[#15120e]/60 hover:bg-[#1a1410]'
                        : isDone
                        ? 'bg-[#121411]/50 hover:bg-[#161a15]'
                        : 'hover:bg-[#1c1611]/80'
                    }`}
                  >
                    {/* PROJEKT */}
                    <td
                      className={`py-3.5 pl-6 pr-4 transition-colors ${
                        isPersonal ? 'border-l-4 border-l-[#7ec29a]' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {hasSubtasks && (
                          <button
                            onClick={() => toggleRowExpanded(task.id)}
                            className="p-1 rounded text-[#9e8f82] hover:text-[#f5ede4] hover:bg-[#251b14] transition-colors -ml-2"
                            title={isExpanded ? 'Zwiń podzadania' : 'Rozwiń podzadania'}
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-3.5 h-3.5 text-[#d99b5a]" />
                            ) : (
                              <ChevronRight className="w-3.5 h-3.5" />
                            )}
                          </button>
                        )}
                        <div className="space-y-0.5">
                          <span
                            className={`text-sm font-medium tracking-tight block ${
                              isPaid
                                ? 'text-[#9e8f82] line-through decoration-[#7a6b5e]'
                                : isDone
                                ? 'text-[#9e8f82]'
                                : 'text-[#f5ede4] group-hover:text-white'
                            }`}
                          >
                            {task.title}
                          </span>
                          <div className="flex items-center gap-2">
                            {category && (
                              <span
                                className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                                  isPersonal
                                    ? 'bg-[#7ec29a]/20 text-[#9ee2b9] border border-[#7ec29a]/35'
                                    : 'text-[#7a6b5e]'
                                }`}
                              >
                                {category.name}
                              </span>
                            )}
                            {hasSubtasks && (
                              <span className="text-[10px] font-mono text-[#d99b5a]">
                                • {completedSubtasks}/{task.subtasks.length} podzadań
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* PRIORYTET */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wider uppercase border shadow-sm ${priorityConfig.className}`}
                      >
                        {priorityConfig.label}
                      </span>
                    </td>

                    {/* BUDŻET */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="font-mono text-sm font-medium text-[#f5ede4]">
                        {budgetFormatted} zł
                      </span>
                    </td>

                    {/* GOTOWE */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleToggleDone(task)}
                        title={isDone ? 'Oznacz jako w toku' : 'Oznacz jako gotowe'}
                        className={`w-5 h-5 rounded-md border inline-flex items-center justify-center transition-all duration-150 active:scale-90 hover:scale-110 ${
                          isDone
                            ? 'bg-[#7ec29a] border-[#7ec29a] text-[#0c0907] shadow-sm shadow-[#7ec29a]/30'
                            : 'border-[#3d2f24] bg-[#140f0c] hover:border-[#7ec29a]/70 hover:bg-[#1a1410]'
                        }`}
                      >
                        {isDone && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </button>
                    </td>

                    {/* OPŁACONE */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleTogglePaid(task)}
                        title={isPaid ? 'Cofnij status opłacone' : 'Oznacz jako opłacone'}
                        className={`w-5 h-5 rounded-md border inline-flex items-center justify-center transition-all duration-150 active:scale-90 hover:scale-110 ${
                          isPaid
                            ? 'bg-[#d99b5a] border-[#d99b5a] text-[#0c0907] shadow-sm shadow-[#d99b5a]/30'
                            : 'border-[#3d2f24] bg-[#140f0c] hover:border-[#d99b5a]/70 hover:bg-[#1a1410]'
                        }`}
                      >
                        {isPaid && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </button>
                    </td>

                    {/* CZEKAM NA UWAGI */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      {!isDone && !isPaid && onToggleWaitingForFeedback ? (
                        <button
                          type="button"
                          onClick={() => onToggleWaitingForFeedback(task.id)}
                          title={
                            task.isWaitingForFeedback
                              ? 'Włączone: Czekam na uwagi klienta (kliknij, aby wyłączyć)'
                              : 'Włącz: Czekam na uwagi klienta (zlecenie poleci na dół listy w toku)'
                          }
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 transition-all duration-200 ease-in-out focus:outline-none active:scale-90 ${
                            task.isWaitingForFeedback
                              ? 'bg-[#9333ea] border-[#a855f7] shadow-sm shadow-[#9333ea]/30'
                              : 'bg-[#201813] border-[#382b20] hover:border-[#a855f7]/50'
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out mt-[1px] ml-[1px] ${
                              task.isWaitingForFeedback ? 'translate-x-4' : 'translate-x-0 bg-[#857567]'
                            }`}
                          />
                        </button>
                      ) : (
                        <span className="text-[#45372d] text-xs">—</span>
                      )}
                    </td>

                    {/* TERMIN */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`font-mono text-xs ${
                              !isDone && task.dueDate && task.dueDate < todayStr
                                ? 'text-[#e07a68] font-semibold'
                                : !isDone && task.dueDate === todayStr
                                ? 'text-[#d99b5a] font-semibold'
                                : 'text-[#9e8f82]'
                            }`}
                          >
                            {dateDisplay}
                          </span>
                          {!isDone && task.dueDate && task.dueDate < todayStr && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono uppercase bg-[#e07a68]/20 text-[#f19b8c] border border-[#e07a68]/30">
                              Po terminie
                            </span>
                          )}
                          {!isDone && task.dueDate === todayStr && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono uppercase bg-[#d99b5a]/20 text-[#f1c38e] border border-[#d99b5a]/30">
                              Dziś
                            </span>
                          )}
                        </div>
                        {daysRemainingInfo && (
                          <span
                            className={`text-[10px] font-mono mt-0.5 block ${daysRemainingInfo.className}`}
                          >
                            {daysRemainingInfo.text}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* UWAGI */}
                    <td className="py-3.5 px-4 max-w-[220px]">
                      {task.notes ? (
                        <span
                          className="italic text-xs text-[#9e8f82] truncate block"
                          title={task.notes}
                        >
                          {task.notes}
                        </span>
                      ) : (
                        <span className="text-[#55463c] text-xs">-</span>
                      )}
                    </td>

                    {/* AKCJE */}
                    <td className="py-3.5 pl-4 pr-6 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Ikona koperty / zaplanowanego powiadomienia */}
                        {(() => {
                          const isScheduled = Boolean(
                            task.remindByEmail && task.emailReminderScheduledAt && !task.emailReminderSentAt
                          );
                          const isSent = Boolean(task.emailReminderSentAt);

                          const tooltip = emailSentStatus[task.id]
                            ? 'Wysłano przypomnienie e-mail!'
                            : isScheduled
                            ? `⏱️ Zaplanowano wysyłkę na: ${formatScheduledReminder(
                                new Date(task.emailReminderScheduledAt!)
                              )}. Kliknij, aby wysłać natychmiast.`
                            : isSent
                            ? `✓ Przypomnienie e-mail wysłane (${new Date(task.emailReminderSentAt!).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}). Kliknij, aby wysłać ponownie.`
                            : 'Wyślij przypomnienie e-mail';

                          return (
                            <button
                              onClick={() => handleQuickSendEmail(task)}
                              disabled={sendingEmailId === task.id}
                              title={tooltip}
                              className={`p-1.5 rounded-lg transition-all active:scale-90 disabled:opacity-50 ${
                                emailSentStatus[task.id]
                                  ? 'bg-[#7ec29a]/20 text-[#7ec29a]'
                                  : isScheduled
                                  ? 'bg-[#d99b5a]/15 text-[#d99b5a] hover:bg-[#d99b5a]/25 border border-[#d99b5a]/30'
                                  : isSent
                                  ? 'bg-[#7ec29a]/10 text-[#7ec29a] hover:bg-[#7ec29a]/20'
                                  : 'text-[#9e8f82] hover:text-[#7ec29a] hover:bg-[#251b14]'
                              }`}
                            >
                              {sendingEmailId === task.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#d99b5a]" />
                              ) : emailSentStatus[task.id] ? (
                                <Check className="w-3.5 h-3.5 text-[#7ec29a]" />
                              ) : isScheduled ? (
                                <Clock className="w-3.5 h-3.5 text-[#d99b5a] animate-pulse" />
                              ) : isSent ? (
                                <Check className="w-3.5 h-3.5 text-[#7ec29a]" />
                              ) : (
                                <Mail className="w-3.5 h-3.5" />
                              )}
                            </button>
                          );
                        })()}

                        <button
                          onClick={() => onEdit(task)}
                          title="Edytuj zlecenie"
                          className="p-1.5 rounded-lg text-[#9e8f82] hover:text-[#d99b5a] hover:bg-[#251b14] transition-all duration-150 active:scale-90 hover:scale-110"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`Czy na pewno usunąć zlecenie "${task.title}"?`)) {
                              onDelete(task.id);
                            }
                          }}
                          title="Usuń zlecenie"
                          className="p-1.5 rounded-lg text-[#9e8f82] hover:text-[#e07a68] hover:bg-[#2a1714] transition-all duration-150 active:scale-90 hover:scale-110"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* Expanded Subtasks Row */}
                  {isExpanded && hasSubtasks && (
                    <tr
                      className={`border-b ${
                        isPersonal
                          ? 'bg-[#2b221a]/95 border-[#3d2f24]'
                          : 'bg-[#120e0b]/90 border-[#2e231c]'
                      }`}
                    >
                      <td
                        colSpan={8}
                        className={`py-3 pl-12 pr-6 ${
                          isPersonal ? 'border-l-4 border-l-[#7ec29a]' : ''
                        }`}
                      >
                        <div
                          className={`p-3.5 rounded-2xl border space-y-2 ${
                            isPersonal
                              ? 'bg-[#231a13] border-[#3d2f24]'
                              : 'bg-[#17110d] border-[#2e231c]'
                          }`}
                        >
                          <span className="text-[10px] font-mono uppercase tracking-wider text-[#9e8f82] block">
                            Etapy i podzadania ({completedSubtasks}/{task.subtasks.length}):
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                            {task.subtasks.map((st) => (
                              <label
                                key={st.id}
                                className="flex items-center gap-2 p-2 rounded-xl bg-[#1c1510] border border-[#2e231c] hover:border-[#3d2f24] transition-colors cursor-pointer select-none"
                              >
                                <input
                                  type="checkbox"
                                  checked={st.completed}
                                  onChange={() => onToggleSubtask(task.id, st.id)}
                                  className="w-3.5 h-3.5 rounded border-[#3d2f24] bg-[#120e0a] text-[#7ec29a] focus:ring-0 focus:ring-offset-0 cursor-pointer"
                                />
                                <span
                                  className={`text-xs ${
                                    st.completed
                                      ? 'line-through text-[#7a6b5e]'
                                      : 'text-[#f5ede4]'
                                  }`}
                                >
                                  {st.title}
                                </span>
                              </label>
                            ))}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
