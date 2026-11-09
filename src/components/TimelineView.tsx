import React, { useState } from 'react';
import type { Task } from '../types';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react';

interface TimelineViewProps {
  tasks: Task[];
  onEditTask: (task: Task) => void;
}

const MONTH_NAMES = [
  'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
  'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'
];

const DAY_NAMES = ['Nd', 'Pn', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob'];

export const TimelineView: React.FC<TimelineViewProps> = ({ tasks, onEditTask }) => {
  const now = new Date();
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(now.getMonth()); // 0-indexed

  // Format date to local YYYY-MM-DD
  const toLocalDateStr = (d: Date): string => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const todayStr = toLocalDateStr(now);

  // Calculate days for the month (from 1st to the last day)
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const days: Date[] = [];
  for (let d = 1; d <= daysInMonth; d++) {
    days.push(new Date(currentYear, currentMonth, d));
  }

  const monthStart = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-01`;
  const monthEnd = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;

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

  const handleJumpToCurrent = () => {
    setCurrentYear(now.getFullYear());
    setCurrentMonth(now.getMonth());
  };

  const isCurrentMonth = currentYear === now.getFullYear() && currentMonth === now.getMonth();

  // Filter tasks that overlap with the current month (od 1 do ostatniego dnia)
  const relevantTasks = tasks.filter((task) => {
    const start = task.startDate || task.createdAt.slice(0, 10) || task.dueDate || '';
    const end = task.dueDate || start;
    if (!start && !end) return false;
    return start <= monthEnd && end >= monthStart;
  });

  const monthTotalValue = relevantTasks.reduce((sum, t) => sum + (Number(t.price) || 0), 0);
  const paidCount = relevantTasks.filter((t) => t.status === 'paid').length;

  return (
    <div className="space-y-4">
      {/* Header & Month Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 glass-panel p-5 rounded-3xl border border-[#2b211a] shadow-2xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#d99b5a] flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#d99b5a] animate-pulse" />
              Harmonogram miesięczny (1 – {daysInMonth} {MONTH_NAMES[currentMonth].slice(0, 3)})
            </span>
          </div>
          <h2 className="text-lg font-light text-[#f5ede4] flex items-center gap-2 mt-0.5">
            <Clock className="w-5 h-5 text-[#d99b5a]" />
            Timeline zleceń — {MONTH_NAMES[currentMonth]} {currentYear}
          </h2>
          <p className="text-xs text-[#9e8f82] font-light mt-0.5">
            Zlecenia i terminy rozłożone od 1 do {daysInMonth} dnia bieżącego miesiąca
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevMonth}
            className="p-2 rounded-xl text-[#9e8f82] hover:text-[#f5ede4] hover:bg-[#251b14] transition-colors"
            title="Poprzedni miesiąc"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <span className="px-4 py-1.5 rounded-full bg-[#1a1410] font-mono text-xs text-[#f5ede4] border border-[#2e231c] min-w-[170px] text-center shadow-inner font-medium">
            {MONTH_NAMES[currentMonth]} {currentYear}
          </span>

          <button
            onClick={handleNextMonth}
            className="p-2 rounded-xl text-[#9e8f82] hover:text-[#f5ede4] hover:bg-[#251b14] transition-colors"
            title="Następny miesiąc"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {!isCurrentMonth && (
            <button
              onClick={handleJumpToCurrent}
              className="text-xs text-[#d99b5a] hover:text-[#f1c38e] px-3 py-1.5 rounded-full border border-[#d99b5a]/30 bg-[#d99b5a]/10 ml-1 transition-colors font-medium"
            >
              Bieżący miesiąc
            </button>
          )}
        </div>
      </div>

      {/* Month Metrics Summary Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 rounded-2xl bg-[#140f0c] border border-[#2e231c] text-xs">
        <div className="flex items-center gap-4 text-[#9e8f82]">
          <span>
            Zleceń w miesiącu: <strong className="text-[#f5ede4] font-mono">{relevantTasks.length}</strong>
          </span>
          <span>•</span>
          <span>
            Opłacone: <strong className="text-[#7ec29a] font-mono">{paidCount}</strong>
          </span>
          <span>•</span>
          <span>
            Łączna wartość: <strong className="text-[#f5ede4] font-mono">{monthTotalValue.toLocaleString('pl-PL')} zł</strong>
          </span>
        </div>
        <div className="text-[11px] text-[#7a6b5e] font-mono">
          Przesuwaj w poziomie, aby zobaczyć cały miesiąc (1 – {daysInMonth})
        </div>
      </div>

      {/* Timeline Gantt Chart Table (Full Month 1 to last day) */}
      <div className="glass-panel rounded-3xl border border-[#2b211a] overflow-hidden shadow-2xl">
        <div className="overflow-x-auto select-none">
          <div className="min-w-[1100px] p-5">
            {/* Header row: Left title + Day 1..daysInMonth */}
            <div
              className="grid gap-1 pb-3 border-b border-[#2e231c] text-center font-medium text-xs"
              style={{
                gridTemplateColumns: `220px repeat(${daysInMonth}, minmax(32px, 1fr))`,
              }}
            >
              <div className="text-left pl-2 text-[#9e8f82] font-mono uppercase text-[10px] self-end pb-1">
                Zlecenie / Zadanie
              </div>

              {days.map((d, i) => {
                const dayNum = d.getDate();
                const dayOfWeek = DAY_NAMES[d.getDay()];
                const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                const ds = toLocalDateStr(d);
                const isToday = ds === todayStr;

                return (
                  <div
                    key={i}
                    className={`py-1.5 px-0.5 rounded-xl flex flex-col items-center justify-center transition-all ${
                      isToday
                        ? 'bg-[#d99b5a]/25 text-[#f1c38e] font-semibold border border-[#d99b5a]/50 shadow-sm'
                        : isWeekend
                        ? 'bg-[#15100d]/40 text-[#6d5e53]'
                        : 'text-[#9e8f82]'
                    }`}
                  >
                    <span className="text-[9px] uppercase font-mono">{dayOfWeek}</span>
                    <span
                      className={`text-xs mt-0.5 font-mono ${
                        isToday ? 'text-[#f5ede4] font-bold' : isWeekend ? 'text-[#857467]' : 'text-[#f5ede4]'
                      }`}
                    >
                      {dayNum}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Rows: Tasks */}
            {relevantTasks.length === 0 ? (
              <div className="py-20 text-center text-xs text-[#7a6b5e]">
                Brak zaplanowanych zleceń w wybranym miesiącu ({MONTH_NAMES[currentMonth]} {currentYear}).
              </div>
            ) : (
              <div className="divide-y divide-[#2e231c]/50">
                {relevantTasks.map((task) => {
                  const start = task.startDate || task.createdAt.slice(0, 10) || task.dueDate || '';
                  const end = task.dueDate || start;

                  const isPaid = task.status === 'paid';
                  const isDone = task.status === 'done';

                  return (
                    <div
                      key={task.id}
                      onClick={() => onEditTask(task)}
                      className="grid gap-1 py-3 items-center hover:bg-[#251b14]/50 rounded-2xl transition-colors cursor-pointer group"
                      style={{
                        gridTemplateColumns: `220px repeat(${daysInMonth}, minmax(32px, 1fr))`,
                      }}
                    >
                      {/* Task Name, Price & Status */}
                      <div className="pl-2 pr-2 truncate">
                        <div
                          className={`text-xs font-medium truncate ${
                            isPaid
                              ? 'text-[#7ec29a]'
                              : isDone
                              ? 'text-[#9e8f82] line-through'
                              : 'text-[#f5ede4]'
                          }`}
                          title={task.title}
                        >
                          {task.title}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-[10px] font-mono">
                          {task.price ? (
                            <span className="text-[#d99b5a]">
                              {task.price.toLocaleString('pl-PL')} zł
                            </span>
                          ) : (
                            <span className="text-[#6d5e53]">—</span>
                          )}
                          <span
                            className={`text-[9px] uppercase ${
                              isPaid ? 'text-[#7ec29a]' : isDone ? 'text-[#9e8f82]' : 'text-[#d99b5a]'
                            }`}
                          >
                            • {isPaid ? 'Opłacone' : isDone ? 'Gotowe' : 'W toku'}
                          </span>
                        </div>
                      </div>

                      {/* Days Slots (1 to daysInMonth) */}
                      {days.map((d, i) => {
                        const dayStr = toLocalDateStr(d);
                        const isInRange = dayStr >= start && dayStr <= end;
                        const isStartDay = dayStr === start || (i === 0 && start < monthStart && isInRange);
                        const isEndDay = dayStr === end || (i === daysInMonth - 1 && end > monthEnd && isInRange);
                        const isToday = dayStr === todayStr;

                        return (
                          <div
                            key={i}
                            className={`h-7 flex items-center justify-center relative ${
                              isToday ? 'bg-[#d99b5a]/5 rounded' : ''
                            }`}
                          >
                            {isInRange && (
                              <div
                                title={`${task.title} (${start} → ${end})`}
                                className={`h-4 w-full flex items-center justify-center text-[9px] font-bold transition-all shadow-sm ${
                                  isPaid
                                    ? 'bg-[#7ec29a] text-[#120e0a]'
                                    : isDone
                                    ? 'bg-[#5c4738] text-[#ebdcd0]'
                                    : 'bg-[#f5ede4] text-[#120e0a]'
                                } ${isStartDay ? 'rounded-l-full' : ''} ${isEndDay ? 'rounded-r-full' : ''}`}
                              >
                                {isEndDay && (
                                  <span className="truncate px-0.5 text-[8px] font-mono">
                                    {isPaid ? '✓' : isDone ? '✓' : '•'}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
