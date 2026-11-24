import React from 'react';
import type { Task } from '../types';
import { Calendar, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';

interface UpcomingTasksWidgetProps {
  tasks: Task[];
  onEditTask: (task: Task) => void;
  onToggleStatus: (id: string) => void;
  onNavigateToAll: () => void;
}

export const UpcomingTasksWidget: React.FC<UpcomingTasksWidgetProps> = ({
  tasks,
  onEditTask,
  onToggleStatus,
  onNavigateToAll,
}) => {
  // 3 najbliższe zadania w toku do realizacji (ściśle aktywne: in_progress lub todo, bez zadań czekających na uwagi i bez zakończonych)
  const activeTasks = tasks.filter(
    (t) =>
      t.category !== 'personal' &&
      (t.status === 'in_progress' || t.status === 'todo') &&
      !t.completedAt &&
      !t.isWaitingForFeedback
  );

  const upcomingTasks = [...activeTasks]
    .sort((a, b) => {
      if (a.dueDate && b.dueDate) {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
      if (a.dueDate && !b.dueDate) return -1;
      if (!a.dueDate && b.dueDate) return 1;
      return Number(b.id) - Number(a.id);
    })
    .slice(0, 3);

  const formatDeadline = (dueDate?: string) => {
    if (!dueDate) return { label: 'Brak terminu', isUrgent: false, isOverdue: false };
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);

    const diffDays = Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return {
        label: `Po terminie (${Math.abs(diffDays)}d)`,
        isUrgent: true,
        isOverdue: true,
      };
    }
    if (diffDays === 0) return { label: 'Dzisiaj!', isUrgent: true, isOverdue: false };
    if (diffDays === 1) return { label: 'Jutro', isUrgent: true, isOverdue: false };
    if (diffDays <= 3) return { label: `Za ${diffDays} dni`, isUrgent: true, isOverdue: false };

    return {
      label: due.toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' }),
      isUrgent: false,
      isOverdue: false,
    };
  };

  return (
    <div className="glass-panel p-4 sm:p-5 rounded-3xl border border-[#2e231c] shadow-xl space-y-3.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#2a1e16] border border-[#d99b5a]/30 flex items-center justify-center text-[#d99b5a] shadow-sm">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-[#f5ede4] flex items-center gap-2">
              <span>3 najbliższe zadania do realizacji</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-[#d99b5a]/15 text-[#f1c38e] border border-[#d99b5a]/30">
                {activeTasks.length} w toku
              </span>
            </h3>
          </div>
        </div>

        <button
          onClick={onNavigateToAll}
          className="text-xs text-[#9e8f82] hover:text-[#d99b5a] flex items-center gap-1 transition-colors group"
        >
          <span>Wszystkie zlecenia</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {upcomingTasks.length === 0 ? (
        <div className="py-6 text-center border border-dashed border-[#2e231c] rounded-2xl text-xs text-[#9e8f82]">
          Brak aktywnych zleceń do realizacji 🎉
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {upcomingTasks.map((task) => {
            const dl = formatDeadline(task.dueDate);
            const isTodo = task.status === 'todo';

            return (
              <div
                key={task.id}
                onClick={() => onEditTask(task)}
                className="group relative p-3.5 rounded-2xl bg-[#140e0a] hover:bg-[#1c140e] border border-[#2e231c] hover:border-[#d99b5a]/40 transition-all cursor-pointer shadow-md flex flex-col justify-between space-y-2.5 active:scale-[0.99]"
              >
                <div className="flex items-start justify-between gap-2">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-mono flex items-center gap-1 ${
                      dl.isOverdue
                        ? 'bg-[#ef4444]/20 text-[#f87171] border border-[#ef4444]/30'
                        : dl.isUrgent
                        ? 'bg-[#d99b5a]/20 text-[#f1c38e] border border-[#d99b5a]/30'
                        : 'bg-[#251b14] text-[#9e8f82] border border-[#382b20]'
                    }`}
                  >
                    {dl.isOverdue && <AlertCircle className="w-3 h-3 text-[#f87171]" />}
                    {dl.label}
                  </span>

                  {task.price && (
                    <span className="text-xs font-mono font-medium text-[#7ec29a] privacy-mask">
                      {task.price.toLocaleString('pl-PL')} zł
                    </span>
                  )}
                </div>

                <div>
                  <h4 className="text-xs font-medium text-[#f5ede4] group-hover:text-[#f1c38e] transition-colors line-clamp-2 leading-relaxed">
                    {task.title}
                  </h4>
                  {task.subtasks && task.subtasks.length > 0 && (
                    <span className="text-[10px] text-[#9e8f82] font-mono block mt-0.5 truncate">
                      Podzadania: {task.subtasks.filter((s) => s.completed).length}/{task.subtasks.length}
                    </span>
                  )}
                </div>

                <div className="pt-2 border-t border-[#221813] flex items-center justify-between text-[10px]">
                  <span
                    className={`px-2 py-0.5 rounded-full font-mono ${
                      isTodo
                        ? 'bg-[#c084fc]/15 text-[#d8b4fe] border border-[#c084fc]/30'
                        : 'bg-[#7ec29a]/15 text-[#9ee2b9] border border-[#7ec29a]/30'
                    }`}
                  >
                    {isTodo ? '📋 Do decyzji' : '⚡ W toku'}
                  </span>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleStatus(task.id);
                    }}
                    className="p-1 rounded-lg text-[#7a6b5e] hover:text-[#7ec29a] hover:bg-[#251b14] transition-colors"
                    title="Oznacz jako ukończone"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
