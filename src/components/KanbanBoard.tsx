import React from 'react';
import type { Task, Status } from '../types';
import { TaskCard } from './TaskCard';
import { Circle, Clock, CheckCircle2, DollarSign, Plus } from 'lucide-react';

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
    id: 'in_progress',
    title: 'W toku',
    icon: <Clock className="w-4 h-4 text-[#d99b5a]" />,
    color: 'bg-[#d99b5a]/15 text-[#f1c38e]',
    border: 'border-[#d99b5a]/30',
  },
  {
    id: 'todo',
    title: 'Do zrobienia',
    icon: <Circle className="w-4 h-4 text-[#9e8f82]" />,
    color: 'bg-[#251b14] text-[#9e8f82]',
    border: 'border-[#382b20]',
  },
  {
    id: 'done',
    title: 'Gotowe',
    icon: <CheckCircle2 className="w-4 h-4 text-[#7ec29a]" />,
    color: 'bg-[#7ec29a]/15 text-[#9ee2b9]',
    border: 'border-[#7ec29a]/30',
  },
  {
    id: 'paid',
    title: 'Opłacone',
    icon: <DollarSign className="w-4 h-4 text-[#f5ede4]" />,
    color: 'bg-[#f5ede4]/15 text-[#f5ede4]',
    border: 'border-[#f5ede4]/30',
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
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      {COLUMNS.map((col) => {
        const columnTasks = tasks.filter((t) => t.status === col.id);
        const columnValue = columnTasks.reduce((sum, t) => sum + (t.price || 0), 0);

        return (
          <div
            key={col.id}
            className="flex flex-col rounded-3xl glass-panel p-4 min-h-[480px] shadow-2xl border border-[#2b211a]"
          >
            {/* Column header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#2e231c] mb-3">
              <div className="flex items-center gap-2">
                {col.icon}
                <h3 className="font-medium text-[#f5ede4] text-sm tracking-wide">
                  {col.title}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-[#251b14] text-[#9e8f82] border border-[#382b20]">
                  {columnTasks.length}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                {columnValue > 0 && (
                  <span className="text-[11px] font-mono text-[#7ec29a] font-medium pr-1">
                    {columnValue.toLocaleString('pl-PL')} zł
                  </span>
                )}
                <button
                  onClick={() => onAddNewWithStatus(col.id)}
                  className="p-1 rounded-lg text-[#9e8f82] hover:text-[#f5ede4] hover:bg-[#251b14] transition-colors"
                  title={`Dodaj do ${col.title}`}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Task cards list */}
            <div className="flex-1 space-y-3 overflow-y-auto pr-1">
              {columnTasks.length === 0 ? (
                <div className="h-32 flex flex-col items-center justify-center border border-dashed border-[#2e231c] rounded-2xl text-xs text-[#7a6b5e] text-center p-3">
                  Brak zleceń w tej kolumnie
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
