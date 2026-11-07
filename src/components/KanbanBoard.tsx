import React from 'react';
import type { Task, Status } from '../types';
import { TaskCard } from './TaskCard';
import { Circle, Clock, CheckCircle2, Plus } from 'lucide-react';

interface KanbanBoardProps {
  tasks: Task[];
  onToggleStatus: (id: string) => void;
  onUpdateStatus: (id: string, status: Status) => void;
  onToggleSubtask: (taskId: string, subtaskId: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onAddNewWithStatus: (status: Status) => void;
}

const COLUMNS: { id: Status; title: string; icon: React.ReactNode; color: string; border: string }[] = [
  {
    id: 'todo',
    title: 'Do zrobienia',
    icon: <Circle className="w-4 h-4 text-slate-400" />,
    color: 'bg-slate-800/40 text-slate-300',
    border: 'border-slate-800',
  },
  {
    id: 'in_progress',
    title: 'W trakcie',
    icon: <Clock className="w-4 h-4 text-amber-400" />,
    color: 'bg-amber-500/10 text-amber-300',
    border: 'border-amber-500/20',
  },
  {
    id: 'done',
    title: 'Zrobione',
    icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
    color: 'bg-emerald-500/10 text-emerald-300',
    border: 'border-emerald-500/20',
  },
];

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  tasks,
  onToggleStatus,
  onUpdateStatus,
  onToggleSubtask,
  onEdit,
  onDelete,
  onAddNewWithStatus,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {COLUMNS.map((col) => {
        const columnTasks = tasks.filter((t) => t.status === col.id);

        return (
          <div
            key={col.id}
            className="flex flex-col rounded-3xl bg-slate-900/40 border border-slate-800/80 p-4 min-h-[500px]"
          >
            {/* Column header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800/80 mb-4">
              <div className="flex items-center gap-2.5">
                {col.icon}
                <h3 className="font-semibold text-slate-200 text-sm tracking-wide">
                  {col.title}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-400">
                  {columnTasks.length}
                </span>
              </div>

              <button
                onClick={() => onAddNewWithStatus(col.id)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title={`Dodaj do ${col.title}`}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Task cards list */}
            <div className="flex-1 space-y-3 overflow-y-auto pr-1">
              {columnTasks.length === 0 ? (
                <div className="h-32 flex flex-col items-center justify-center border border-dashed border-slate-800 rounded-2xl text-xs text-slate-500 text-center p-4">
                  Brak zadań w tej kolumnie
                </div>
              ) : (
                columnTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onToggleStatus={onToggleStatus}
                    onUpdateStatus={onUpdateStatus}
                    onToggleSubtask={onToggleSubtask}
                    onEdit={onEdit}
                    onDelete={onDelete}
                  />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
