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

const DAY_NAMES = ['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Nd'];

export const TimelineView: React.FC<TimelineViewProps> = ({ tasks, onEditTask }) => {
  const [weekOffset, setWeekOffset] = useState(0);

  // Calculate the 7 days of the viewed week (Monday to Sunday)
  const getWeekDates = (offset: number) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dayOfWeek = (today.getDay() + 6) % 7; // Monday = 0
    const monday = new Date(today);
    monday.setDate(today.getDate() - dayOfWeek + offset * 7);

    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      days.push(d);
    }
    return days;
  };

  const days = getWeekDates(weekOffset);
  const todayStr = new Date().toISOString().split('T')[0];

  const firstDay = days[0];
  const lastDay = days[6];
  const weekLabel = `${firstDay.getDate()} ${MONTH_NAMES[firstDay.getMonth()].slice(0, 3)} – ${lastDay.getDate()} ${MONTH_NAMES[lastDay.getMonth()].slice(0, 3)} ${lastDay.getFullYear()}`;

  const weekStart = firstDay.toISOString().split('T')[0];
  const weekEnd = lastDay.toISOString().split('T')[0];

  // Filter tasks that overlap with this week
  const relevantTasks = tasks.filter((task) => {
    const start = task.startDate || task.createdAt.slice(0, 10) || task.dueDate || '';
    const end = task.dueDate || start;
    if (!start && !end) return false;
    return start <= weekEnd && end >= weekStart;
  });

  return (
    <div className="space-y-4">
      {/* Header and Week Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 glass-panel p-5 rounded-3xl border border-[#2b211a] shadow-2xl">
        <div>
          <h2 className="text-lg font-medium text-[#f5ede4] flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#d99b5a]" />
            Timeline tygodnia (JC Studio)
          </h2>
          <p className="text-xs text-[#9e8f82] font-light">
            Wizualny harmonogram zleceń i deadline'ów na poszczególne dni
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setWeekOffset((prev) => prev - 1)}
            className="p-2 rounded-xl text-[#9e8f82] hover:text-[#f5ede4] hover:bg-[#251b14] transition-colors"
            title="Poprzedni tydzień"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <span className="px-4 py-1.5 rounded-full bg-[#1a1410] font-mono text-xs text-[#f5ede4] border border-[#2e231c] min-w-[150px] text-center shadow-inner">
            {weekLabel}
          </span>

          <button
            onClick={() => setWeekOffset((prev) => prev + 1)}
            className="p-2 rounded-xl text-[#9e8f82] hover:text-[#f5ede4] hover:bg-[#251b14] transition-colors"
            title="Następny tydzień"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {weekOffset !== 0 && (
            <button
              onClick={() => setWeekOffset(0)}
              className="text-xs text-[#9e8f82] hover:text-[#f5ede4] px-3 py-1 rounded-full border border-[#2e231c] ml-1 transition-colors"
            >
              Bieżący
            </button>
          )}
        </div>
      </div>

      {/* Timeline Gantt Chart Table */}
      <div className="glass-panel rounded-3xl border border-[#2b211a] overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <div className="min-w-[700px] p-5">
            {/* Header row: Days */}
            <div className="grid grid-cols-8 gap-2 pb-3 border-b border-[#2e231c] text-center font-medium text-xs">
              <div className="text-left pl-2 text-[#9e8f82] font-mono uppercase text-[10px]">Zlecenie / Zadanie</div>
              {days.map((d, i) => {
                const ds = d.toISOString().split('T')[0];
                const isToday = ds === todayStr;
                return (
                  <div
                    key={i}
                    className={`py-2 rounded-2xl flex flex-col items-center justify-center transition-all ${
                      isToday
                        ? 'bg-[#d99b5a]/20 text-[#f1c38e] font-semibold border border-[#d99b5a]/40'
                        : 'text-[#9e8f82]'
                    }`}
                  >
                    <span className="text-[10px] uppercase font-mono">{DAY_NAMES[i]}</span>
                    <span className={`text-sm mt-0.5 font-mono ${isToday ? 'text-[#f5ede4] font-bold' : 'text-[#f5ede4]'}`}>
                      {d.getDate()}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Rows: Tasks */}
            {relevantTasks.length === 0 ? (
              <div className="py-16 text-center text-xs text-[#7a6b5e]">
                Brak zaplanowanych zleceń w tym tygodniu.
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
                      className="grid grid-cols-8 gap-2 py-3.5 items-center hover:bg-[#251b14]/50 rounded-2xl transition-colors cursor-pointer group"
                    >
                      {/* Task Name & Price */}
                      <div className="pl-2 pr-2 truncate">
                        <div className={`text-xs font-medium truncate ${isPaid ? 'text-[#7ec29a]' : isDone ? 'text-[#7a6b5e] line-through' : 'text-[#f5ede4]'}`}>
                          {task.title}
                        </div>
                        {task.price && (
                          <div className="text-[10px] font-mono text-[#7ec29a]">
                            {task.price.toLocaleString('pl-PL')} zł
                          </div>
                        )}
                      </div>

                      {/* 7 Day Slots for Gantt Bar */}
                      {days.map((d, i) => {
                        const dayStr = d.toISOString().split('T')[0];
                        const isInRange = dayStr >= start && dayStr <= end;
                        const isStartDay = dayStr === start;
                        const isEndDay = dayStr === end;

                        return (
                          <div key={i} className="h-7 flex items-center justify-center relative">
                            {isInRange && (
                              <div
                                className={`h-4 w-full flex items-center justify-center text-[10px] font-bold transition-all ${
                                  isPaid
                                    ? 'bg-[#7ec29a] text-[#120e0a]'
                                    : isDone
                                    ? 'bg-[#5c4738] text-[#ebdcd0]'
                                    : 'bg-[#f5ede4] text-[#120e0a]'
                                } ${isStartDay ? 'rounded-l-full' : ''} ${isEndDay ? 'rounded-r-full' : ''}`}
                              >
                                {isEndDay && (
                                  <span className="truncate px-1 text-[9px] font-mono">
                                    {isPaid ? '✓ Opłacone' : isDone ? '✓ Gotowe' : 'W toku'}
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
