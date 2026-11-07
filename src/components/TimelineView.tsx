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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-400" />
            Timeline tygodnia (JC Studio)
          </h2>
          <p className="text-xs text-slate-400">
            Wizualny harmonogram zleceń i deadline'ów na dany tydzień
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setWeekOffset((prev) => prev - 1)}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Poprzedni tydzień"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <span className="px-3 py-1.5 rounded-xl bg-slate-950 font-medium text-xs text-indigo-300 border border-slate-800 min-w-[140px] text-center">
            {weekLabel}
          </span>

          <button
            onClick={() => setWeekOffset((prev) => prev + 1)}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Następny tydzień"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {weekOffset !== 0 && (
            <button
              onClick={() => setWeekOffset(0)}
              className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded-lg border border-slate-800 ml-1"
            >
              Bieżący
            </button>
          )}
        </div>
      </div>

      {/* Timeline Gantt Chart Table */}
      <div className="bg-slate-900/80 rounded-3xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <div className="min-w-[700px] p-4">
            {/* Header row: Days */}
            <div className="grid grid-cols-8 gap-2 pb-3 border-b border-slate-800/80 text-center font-medium text-xs">
              <div className="text-left pl-2 text-slate-400">Zlecenie / Zadanie</div>
              {days.map((d, i) => {
                const ds = d.toISOString().split('T')[0];
                const isToday = ds === todayStr;
                return (
                  <div
                    key={i}
                    className={`py-1.5 rounded-xl flex flex-col items-center justify-center ${
                      isToday
                        ? 'bg-indigo-600/20 text-indigo-400 font-bold border border-indigo-500/30'
                        : 'text-slate-400'
                    }`}
                  >
                    <span>{DAY_NAMES[i]}</span>
                    <span className={`text-sm mt-0.5 ${isToday ? 'text-white font-extrabold' : 'text-slate-300'}`}>
                      {d.getDate()}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Rows: Tasks */}
            {relevantTasks.length === 0 ? (
              <div className="py-16 text-center text-xs text-slate-500">
                Brak zaplanowanych zleceń w tym tygodniu.
              </div>
            ) : (
              <div className="divide-y divide-slate-800/50">
                {relevantTasks.map((task) => {
                  const start = task.startDate || task.createdAt.slice(0, 10) || task.dueDate || '';
                  const end = task.dueDate || start;

                  const isPaid = task.status === 'paid';
                  const isDone = task.status === 'done';

                  return (
                    <div
                      key={task.id}
                      onClick={() => onEditTask(task)}
                      className="grid grid-cols-8 gap-2 py-3.5 items-center hover:bg-slate-800/40 rounded-xl transition-colors cursor-pointer group"
                    >
                      {/* Task Name & Price */}
                      <div className="pl-2 pr-2 truncate">
                        <div className="text-xs font-semibold text-slate-200 group-hover:text-indigo-300 transition-colors truncate">
                          {task.title}
                        </div>
                        {task.price !== undefined && (
                          <div className="text-[11px] text-emerald-400 font-medium">
                            {task.price} zł
                          </div>
                        )}
                      </div>

                      {/* 7 Day Cells */}
                      {days.map((d, i) => {
                        const ds = d.toISOString().split('T')[0];
                        const inRange = start && end && ds >= start && ds <= end;
                        const isStart = start === ds;
                        const isEnd = end === ds;
                        const isDeadline = task.dueDate === ds;

                        return (
                          <div
                            key={i}
                            className="h-9 flex items-center justify-center relative"
                          >
                            {inRange && (
                              <div
                                className={`w-full h-6 transition-all flex items-center justify-center px-1 text-[10px] font-medium text-white shadow-sm ${
                                  isPaid
                                    ? 'bg-purple-600/80 hover:bg-purple-600'
                                    : isDone
                                    ? 'bg-emerald-600/80 hover:bg-emerald-600'
                                    : 'bg-indigo-600/80 hover:bg-indigo-600'
                                } ${isStart && isEnd ? 'rounded-xl' : isStart ? 'rounded-l-xl' : isEnd ? 'rounded-r-xl' : ''}`}
                                title={`${task.title} (${start} do ${end})`}
                              >
                                {isStart && (
                                  <span className="truncate max-w-[50px]">
                                    {task.title.split(' ')[0]}
                                  </span>
                                )}
                              </div>
                            )}

                            {isDeadline && (
                              <span
                                className="absolute right-1 top-1 w-2 h-2 rounded-full bg-rose-400 ring-2 ring-slate-900"
                                title={`Termin: ${task.dueDate}`}
                              />
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
