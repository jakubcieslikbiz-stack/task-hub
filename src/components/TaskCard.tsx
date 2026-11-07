import React, { useState } from 'react';
import type { Task, Priority, Status } from '../types';
import { CATEGORIES } from '../data/initialData';
import {
  CheckCircle2,
  Circle,
  Calendar,
  AlertCircle,
  MoreVertical,
  ChevronDown,
  ChevronUp,
  Trash2,
  Edit2,
  ListTodo
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface TaskCardProps {
  task: Task;
  onToggleStatus: (id: string) => void;
  onUpdateStatus: (id: string, status: Status) => void;
  onToggleSubtask: (taskId: string, subtaskId: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
}

const PRIORITY_CONFIG: Record<Priority, { label: string; color: string; badge: string }> = {
  urgent: { label: 'Pilne', color: 'text-rose-400', badge: 'bg-rose-500/15 text-rose-300 border-rose-500/30' },
  high: { label: 'Wysoki', color: 'text-amber-400', badge: 'bg-amber-500/15 text-amber-300 border-amber-500/30' },
  medium: { label: 'Średni', color: 'text-blue-400', badge: 'bg-blue-500/15 text-blue-300 border-blue-500/30' },
  low: { label: 'Niski', color: 'text-slate-400', badge: 'bg-slate-700/50 text-slate-300 border-slate-600/30' },
};

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onToggleStatus,
  onUpdateStatus,
  onToggleSubtask,
  onEdit,
  onDelete,
}) => {
  const [showSubtasks, setShowSubtasks] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const isDone = task.status === 'done';
  const category = CATEGORIES.find((c) => c.id === task.category);
  const priority = PRIORITY_CONFIG[task.priority];

  const completedSubtasks = task.subtasks.filter((s) => s.completed).length;
  const totalSubtasks = task.subtasks.length;
  const progressPercent = totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;

  const handleToggle = () => {
    if (!isDone) {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#6366f1', '#10b981', '#f59e0b', '#ec4899'],
      });
    }
    onToggleStatus(task.id);
  };

  const isToday = task.dueDate === new Date().toISOString().split('T')[0];
  const isPast = task.dueDate && task.dueDate < new Date().toISOString().split('T')[0] && !isDone;

  return (
    <div
      className={`group relative rounded-2xl border transition-all duration-200 bg-slate-900/80 backdrop-blur-sm p-4 sm:p-5 shadow-lg ${
        isDone
          ? 'border-slate-800/80 opacity-60 hover:opacity-90'
          : 'border-slate-800 hover:border-indigo-500/40 hover:shadow-indigo-500/5'
      }`}
    >
      {/* Top row: Checkbox, Title, Menu */}
      <div className="flex items-start gap-3">
        <button
          onClick={handleToggle}
          className="mt-0.5 flex-shrink-0 text-slate-400 hover:text-indigo-400 transition-colors focus:outline-none"
          title={isDone ? 'Oznacz jako niewykonane' : 'Oznacz jako zrobione'}
        >
          {isDone ? (
            <CheckCircle2 className="w-6 h-6 text-emerald-400 fill-emerald-500/20" />
          ) : (
            <Circle className="w-6 h-6 hover:stroke-indigo-400 transition-transform active:scale-90" />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <h3
            className={`text-base font-medium leading-snug break-words transition-all ${
              isDone ? 'line-through text-slate-400' : 'text-slate-100'
            }`}
          >
            {task.title}
          </h3>

          {task.description && (
            <p className="mt-1 text-sm text-slate-400 line-clamp-2 leading-relaxed">
              {task.description}
            </p>
          )}

          {/* Badges and metadata */}
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
            {/* Priority */}
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border font-medium ${priority.badge}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${priority.color} bg-current`} />
              {priority.label}
            </span>

            {/* Category */}
            {category && (
              <span
                className={`inline-flex items-center px-2.5 py-1 rounded-full border font-medium ${category.color}`}
              >
                {category.name}
              </span>
            )}

            {/* Due date */}
            {task.dueDate && (
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border ${
                  isPast
                    ? 'bg-rose-500/10 text-rose-400 border-rose-500/30 font-semibold'
                    : isToday
                    ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                {isPast ? <AlertCircle className="w-3.5 h-3.5" /> : <Calendar className="w-3.5 h-3.5" />}
                {isToday ? 'Dzisiaj' : task.dueDate}
              </span>
            )}

            {/* Subtask count badge */}
            {totalSubtasks > 0 && (
              <button
                onClick={() => setShowSubtasks(!showSubtasks)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700/80 text-slate-300 border border-slate-700 transition-colors"
              >
                <ListTodo className="w-3.5 h-3.5 text-indigo-400" />
                <span>
                  {completedSubtasks}/{totalSubtasks}
                </span>
                {showSubtasks ? (
                  <ChevronUp className="w-3 h-3 text-slate-400" />
                ) : (
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                )}
              </button>
            )}
          </div>

          {/* Subtasks progress bar */}
          {totalSubtasks > 0 && (
            <div className="mt-2.5 w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-indigo-500 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          )}

          {/* Subtasks expand list */}
          {showSubtasks && totalSubtasks > 0 && (
            <div className="mt-3 space-y-1.5 pl-2 border-l-2 border-slate-800">
              {task.subtasks.map((st) => (
                <div
                  key={st.id}
                  onClick={() => onToggleSubtask(task.id, st.id)}
                  className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer hover:text-white py-0.5"
                >
                  <input
                    type="checkbox"
                    checked={st.completed}
                    onChange={() => {}}
                    className="rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-0 cursor-pointer"
                  />
                  <span className={st.completed ? 'line-through text-slate-500' : ''}>{st.title}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right action button */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {showMenu && (
            <>
              <div className="fixed inset-0 z-20" onClick={() => setShowMenu(false)} />
              <div className="absolute right-0 top-8 z-30 w-44 rounded-xl bg-slate-800 border border-slate-700 shadow-2xl py-1 text-sm text-slate-200 backdrop-blur-md">
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onEdit(task);
                  }}
                  className="flex items-center gap-2.5 w-full px-3.5 py-2 hover:bg-slate-700/60 text-left transition-colors"
                >
                  <Edit2 className="w-4 h-4 text-slate-400" />
                  <span>Edytuj</span>
                </button>

                <div className="border-t border-slate-700/60 my-1" />

                <div className="px-3.5 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Zmień status
                </div>
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onUpdateStatus(task.id, 'todo');
                  }}
                  className={`w-full text-left px-3.5 py-1.5 text-xs hover:bg-slate-700/60 ${
                    task.status === 'todo' ? 'text-indigo-400 font-semibold' : ''
                  }`}
                >
                  Do zrobienia
                </button>
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onUpdateStatus(task.id, 'in_progress');
                  }}
                  className={`w-full text-left px-3.5 py-1.5 text-xs hover:bg-slate-700/60 ${
                    task.status === 'in_progress' ? 'text-amber-400 font-semibold' : ''
                  }`}
                >
                  W trakcie
                </button>
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onUpdateStatus(task.id, 'done');
                  }}
                  className={`w-full text-left px-3.5 py-1.5 text-xs hover:bg-slate-700/60 ${
                    task.status === 'done' ? 'text-emerald-400 font-semibold' : ''
                  }`}
                >
                  Zrobione
                </button>

                <div className="border-t border-slate-700/60 my-1" />

                <button
                  onClick={() => {
                    setShowMenu(false);
                    onDelete(task.id);
                  }}
                  className="flex items-center gap-2.5 w-full px-3.5 py-2 hover:bg-rose-500/10 text-rose-400 text-left transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Usuń zadanie</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
