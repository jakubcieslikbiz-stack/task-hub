import React, { useState } from 'react';
import type { Task, Priority, Status } from '../types';
import { CATEGORIES } from '../data/initialData';
import { sendTaskReminderEmail } from '../lib/email';
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
  ListTodo,
  DollarSign,
  Mail,
  Loader2,
  Check,
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
  urgent: { label: 'Pilne', color: 'text-[#e07a68]', badge: 'bg-[#e07a68]/15 text-[#f19b8c] border-[#e07a68]/30' },
  high: { label: 'Wysoki', color: 'text-[#d99b5a]', badge: 'bg-[#d99b5a]/15 text-[#f1c38e] border-[#d99b5a]/30' },
  medium: { label: 'Średni', color: 'text-[#8c9db5]', badge: 'bg-[#8c9db5]/15 text-[#b9cbe0] border-[#8c9db5]/30' },
  low: { label: 'Niski', color: 'text-[#9e8f82]', badge: 'bg-[#251b14] text-[#9e8f82] border-[#382b20]' },
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
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailSentStatus, setEmailSentStatus] = useState<string | null>(null);

  const isDone = task.status === 'done';
  const isPaid = task.status === 'paid';
  const category = CATEGORIES.find((c) => c.id === task.category);
  const priority = PRIORITY_CONFIG[task.priority];

  const completedSubtasks = task.subtasks.filter((s) => s.completed).length;
  const totalSubtasks = task.subtasks.length;
  const progressPercent = totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;

  const handleToggle = () => {
    if (!isDone && !isPaid) {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#f5ede4', '#d99b5a', '#7ec29a', '#c88d51'],
      });
    }
    onToggleStatus(task.id);
  };

  const handleQuickSendEmail = async () => {
    setIsSendingEmail(true);
    setEmailSentStatus(null);
    const res = await sendTaskReminderEmail({
      title: task.title,
      dueDate: task.dueDate,
      price: task.price,
      priority: task.priority,
      category: category?.name,
      notes: task.notes,
      description: task.description,
      subtasks: task.subtasks.map((s) => s.title),
    });
    setIsSendingEmail(false);
    if (res.success) {
      setEmailSentStatus('Wysłano!');
      setTimeout(() => setEmailSentStatus(null), 3500);
    } else {
      alert(`Błąd wysyłki e-mail: ${res.error || 'Nieznany błąd'}`);
    }
  };

  const isToday = task.dueDate === new Date().toISOString().split('T')[0];
  const isPast = task.dueDate && task.dueDate < new Date().toISOString().split('T')[0] && !isDone && !isPaid;

  return (
    <div
      className={`group relative rounded-3xl border transition-all duration-300 glass-panel p-4 sm:p-5 shadow-2xl hover:border-[#3d2f24] ${
        isPaid
          ? 'border-[#7ec29a]/40 bg-[#1e1913]/90'
          : isDone
          ? 'border-[#2e231c]/60 opacity-60 hover:opacity-90'
          : 'border-[#2b211a]'
      } ${showMenu ? 'z-40' : 'z-0'}`}
    >
      {/* Top row: Checkbox, Title, Price, Menu */}
      <div className="flex items-start gap-3">
        <button
          onClick={handleToggle}
          className="mt-0.5 flex-shrink-0 text-[#9e8f82] hover:text-[#f5ede4] transition-colors focus:outline-none"
          title={isPaid ? 'Opłacone' : isDone ? 'Oznacz jako niewykonane' : 'Oznacz jako zrobione'}
        >
          {isPaid ? (
            <CheckCircle2 className="w-6 h-6 text-[#7ec29a] fill-[#7ec29a]/20" />
          ) : isDone ? (
            <CheckCircle2 className="w-6 h-6 text-[#7ec29a] fill-[#7ec29a]/20" />
          ) : (
            <Circle className="w-6 h-6 hover:stroke-[#f5ede4] transition-transform active:scale-90" />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3
              className={`text-base font-medium leading-snug break-words transition-all ${
                isPaid
                  ? 'text-[#f5ede4]'
                  : isDone
                  ? 'line-through text-[#7a6b5e]'
                  : 'text-[#f5ede4]'
              }`}
            >
              {task.title}
            </h3>

            {/* Price Badge (Warm champagne / sage) */}
            {task.price !== undefined && (
              <span className="flex-shrink-0 inline-flex items-center gap-0.5 px-3 py-1 rounded-full text-xs font-medium font-mono bg-[#7ec29a]/15 text-[#9ee2b9] border border-[#7ec29a]/30">
                <DollarSign className="w-3 h-3 text-[#7ec29a] -mr-0.5" />
                {task.price.toLocaleString('pl-PL')} zł
              </span>
            )}
          </div>

          {task.description && (
            <p className="mt-1 text-sm text-[#9e8f82] line-clamp-2 leading-relaxed font-light">
              {task.description}
            </p>
          )}

          {task.notes && (
            <div className="mt-2 text-xs text-[#f5ede4] bg-[#251b14]/90 px-3 py-2 rounded-2xl border border-[#382b20]">
              💡 {task.notes}
            </div>
          )}

          {/* Badges and metadata */}
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
            {/* Status Badge */}
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full border text-[11px] font-medium ${
                isPaid
                  ? 'bg-[#7ec29a]/20 text-[#9ee2b9] border-[#7ec29a]/40'
                  : isDone
                  ? 'bg-[#251b14] text-[#9e8f82] border-[#382b20]'
                  : task.status === 'in_progress'
                  ? 'bg-[#d99b5a]/20 text-[#f1c38e] border-[#d99b5a]/40'
                  : 'bg-[#251b14] text-[#9e8f82] border-[#382b20]'
              }`}
            >
              {isPaid ? 'Opłacone ✓' : isDone ? 'Gotowe' : task.status === 'in_progress' ? 'W toku' : 'Do zrobienia'}
            </span>

            {/* Priority */}
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[11px] font-medium ${priority.badge}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${priority.color} bg-current`} />
              {priority.label}
            </span>

            {/* Category */}
            {category && (
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full border text-[11px] font-medium ${category.color}`}
              >
                {category.name}
              </span>
            )}

            {/* Due date */}
            {task.dueDate && (
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[11px] font-mono ${
                  isPast
                    ? 'bg-[#e07a68]/15 text-[#f19b8c] border-[#e07a68]/30 font-semibold'
                    : isToday
                    ? 'bg-[#d99b5a]/15 text-[#f1c38e] border-[#d99b5a]/30'
                    : 'bg-[#251b14] text-[#9e8f82] border-[#382b20]'
                }`}
              >
                {isPast ? <AlertCircle className="w-3.5 h-3.5" /> : <Calendar className="w-3.5 h-3.5" />}
                {isToday ? 'Dzisiaj' : task.dueDate}
              </span>
            )}

            {/* Email reminder badge */}
            {task.remindByEmail && (
              <span
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[11px] font-medium bg-[#251b14] text-[#d99b5a] border-[#382b20]"
                title="Powiadomienie e-mail skonfigurowane"
              >
                <Mail className="w-3 h-3 text-[#d99b5a]" />
                Mail
              </span>
            )}

            {/* Subtask count badge */}
            {totalSubtasks > 0 && (
              <button
                onClick={() => setShowSubtasks(!showSubtasks)}
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#251b14] hover:bg-[#322319] text-[#9e8f82] hover:text-[#f5ede4] border border-[#382b20] transition-colors text-[11px]"
              >
                <ListTodo className="w-3.5 h-3.5 text-[#d99b5a]" />
                <span>
                  {completedSubtasks}/{totalSubtasks}
                </span>
                {showSubtasks ? (
                  <ChevronUp className="w-3 h-3 text-[#9e8f82]" />
                ) : (
                  <ChevronDown className="w-3 h-3 text-[#9e8f82]" />
                )}
              </button>
            )}
          </div>

          {/* Subtasks progress bar */}
          {totalSubtasks > 0 && (
            <div className="mt-2.5 w-full bg-[#251b14] rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-[#f5ede4] h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          )}

          {/* Subtasks expand list */}
          {showSubtasks && totalSubtasks > 0 && (
            <div className="mt-3 space-y-1.5 pl-2 border-l border-[#382b20]">
              {task.subtasks.map((st) => (
                <div
                  key={st.id}
                  onClick={() => onToggleSubtask(task.id, st.id)}
                  className="flex items-center gap-2 text-xs text-[#9e8f82] cursor-pointer hover:text-[#f5ede4] py-0.5"
                >
                  <input
                    type="checkbox"
                    checked={st.completed}
                    onChange={() => {}}
                    className="rounded border-[#382b20] bg-[#251b14] text-[#d99b5a] focus:ring-0 cursor-pointer"
                  />
                  <span className={st.completed ? 'line-through text-[#7a6b5e]' : ''}>{st.title}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right action buttons: Quick Email & Menu */}
        <div className="flex items-center gap-1 relative">
          <button
            onClick={handleQuickSendEmail}
            disabled={isSendingEmail}
            className={`p-2 rounded-full transition-colors ${
              emailSentStatus
                ? 'bg-[#7ec29a]/20 text-[#7ec29a]'
                : 'text-[#9e8f82] hover:text-[#f5ede4] hover:bg-[#251b14]'
            }`}
            title={emailSentStatus || 'Wyślij przypomnienie e-mailem'}
          >
            {isSendingEmail ? (
              <Loader2 className="w-4 h-4 animate-spin text-[#d99b5a]" />
            ) : emailSentStatus ? (
              <Check className="w-4 h-4 text-[#7ec29a]" />
            ) : (
              <Mail className="w-4 h-4" />
            )}
          </button>

          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 rounded-full text-[#9e8f82] hover:text-[#f5ede4] hover:bg-[#251b14] transition-colors"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {showMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
              <div className="absolute right-0 top-9 z-50 w-52 rounded-2xl glass-panel border border-[#382b20] shadow-2xl py-1.5 text-xs text-[#f5ede4]">
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onEdit(task);
                  }}
                  className="flex items-center gap-2.5 w-full px-3.5 py-2 hover:bg-[#251b14] text-left transition-colors"
                >
                  <Edit2 className="w-4 h-4 text-[#9e8f82]" />
                  <span>Edytuj zlecenie</span>
                </button>

                <button
                  onClick={() => {
                    setShowMenu(false);
                    handleQuickSendEmail();
                  }}
                  disabled={isSendingEmail}
                  className="flex items-center gap-2.5 w-full px-3.5 py-2 hover:bg-[#251b14] text-left transition-colors text-[#d99b5a]"
                >
                  <Mail className="w-4 h-4 text-[#d99b5a]" />
                  <span>Wyślij e-mail</span>
                </button>

                <div className="border-t border-[#2e231c] my-1" />

                <div className="px-3.5 py-1 text-[10px] font-mono uppercase tracking-wider text-[#9e8f82]">
                  Zmień status
                </div>
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onUpdateStatus(task.id, 'todo');
                  }}
                  className={`w-full text-left px-3.5 py-1.5 hover:bg-[#251b14] ${
                    task.status === 'todo' ? 'text-[#f5ede4] font-semibold' : 'text-[#9e8f82]'
                  }`}
                >
                  Do zrobienia
                </button>
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onUpdateStatus(task.id, 'in_progress');
                  }}
                  className={`w-full text-left px-3.5 py-1.5 hover:bg-[#251b14] ${
                    task.status === 'in_progress' ? 'text-[#d99b5a] font-semibold' : 'text-[#9e8f82]'
                  }`}
                >
                  W toku
                </button>
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onUpdateStatus(task.id, 'done');
                  }}
                  className={`w-full text-left px-3.5 py-1.5 hover:bg-[#251b14] ${
                    task.status === 'done' ? 'text-[#7ec29a] font-semibold' : 'text-[#9e8f82]'
                  }`}
                >
                  Gotowe
                </button>
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onUpdateStatus(task.id, 'paid');
                  }}
                  className={`w-full text-left px-3.5 py-1.5 hover:bg-[#251b14] ${
                    task.status === 'paid' ? 'text-[#7ec29a] font-semibold' : 'text-[#9e8f82]'
                  }`}
                >
                  💰 Opłacone
                </button>

                <div className="border-t border-[#2e231c] my-1" />

                <button
                  onClick={() => {
                    setShowMenu(false);
                    onDelete(task.id);
                  }}
                  className="flex items-center gap-2.5 w-full px-3.5 py-2 hover:bg-[#e07a68]/15 text-[#e07a68] text-left transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Usuń zlecenie</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
