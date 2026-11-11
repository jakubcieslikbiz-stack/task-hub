import React, { useState, useEffect } from 'react';
import type { Task, Priority, Status, Subtask } from '../types';
import { CATEGORIES } from '../data/initialData';
import {
  getStoredRecipientEmail,
  sendTaskReminderEmail,
  calculateReminderTimestamp,
  formatScheduledReminder,
  cancelScheduledTaskEmail,
} from '../lib/email';
import { MiniCalendarPicker } from './MiniCalendarPicker';
import { X, Plus, Trash, DollarSign, Mail } from 'lucide-react';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Omit<Task, 'id' | 'createdAt'> & { id?: string }) => void;
  initialTask?: Task | null;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialTask,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<string>('');
  const [category, setCategory] = useState(CATEGORIES[0].id);
  const [priority, setPriority] = useState<Priority>('medium');
  const [status, setStatus] = useState<Status>('in_progress');
  const [startDate, setStartDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [remindByEmail, setRemindByEmail] = useState(false);
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (initialTask) {
      setTitle(initialTask.title || '');
      setDescription(initialTask.description || '');
      setPrice(
        initialTask.price !== undefined && initialTask.price !== null
          ? String(initialTask.price)
          : ''
      );
      setCategory(initialTask.category || CATEGORIES[0].id);
      setPriority(initialTask.priority || 'medium');
      setStatus(initialTask.status || 'in_progress');
      setStartDate(typeof initialTask.startDate === 'string' ? initialTask.startDate : '');
      setDueDate(typeof initialTask.dueDate === 'string' ? initialTask.dueDate : '');
      setNotes(initialTask.notes || '');
      setRemindByEmail(Boolean(initialTask.remindByEmail));
      setSubtasks(
        Array.isArray(initialTask.subtasks)
          ? initialTask.subtasks.map((st: any, i: number) => {
              if (typeof st === 'string') {
                return { id: `st-${Date.now()}-${i}`, title: st, completed: false };
              }
              return {
                id: String(st?.id || `st-${Date.now()}-${i}`),
                title: typeof st?.title === 'string' ? st.title : String(st?.title || ''),
                completed: Boolean(st?.completed),
              };
            })
          : []
      );
    } else {
      setTitle('');
      setDescription('');
      setPrice('');
      setCategory(CATEGORIES[0].id);
      setPriority('medium');
      setStatus('in_progress');
      setStartDate(todayStr);
      setDueDate(todayStr);
      setNotes('');
      setRemindByEmail(false);
      setSubtasks([]);
    }
    setNewSubtaskTitle('');
  }, [initialTask, isOpen]);

  if (!isOpen) return null;

  const handleAddSubtask = () => {
    if (!newSubtaskTitle.trim()) return;
    setSubtasks([
      ...subtasks,
      { id: Date.now().toString(), title: newSubtaskTitle.trim(), completed: false },
    ]);
    setNewSubtaskTitle('');
  };

  const handleRemoveSubtask = (id: string) => {
    setSubtasks(subtasks.filter((s) => s.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    let emailReminderScheduledAt = initialTask?.emailReminderScheduledAt;
    let emailReminderSentAt = initialTask?.emailReminderSentAt;
    let emailReminderId = initialTask?.emailReminderId;

    if (remindByEmail) {
      const reminderDate = calculateReminderTimestamp({ dueDate });
      const isFuture = reminderDate && reminderDate.getTime() > Date.now();

      if (isFuture) {
        if (initialTask?.emailReminderId) {
          await cancelScheduledTaskEmail(initialTask.emailReminderId);
        }
        const schedIso = reminderDate.toISOString();
        const emailRes = await sendTaskReminderEmail({
          title: title.trim(),
          dueDate: dueDate || undefined,
          scheduledAt: schedIso,
          price: price.trim() !== '' ? Number(price) : undefined,
          priority,
          category,
          notes: notes.trim() || undefined,
          description: description.trim() || undefined,
          subtasks: subtasks.map((s) => s.title),
        });
        if (emailRes.success) {
          emailReminderScheduledAt = schedIso;
          emailReminderSentAt = undefined;
          emailReminderId = emailRes.id;
        }
      } else if (!emailReminderSentAt) {
        const emailRes = await sendTaskReminderEmail({
          title: title.trim(),
          dueDate: dueDate || undefined,
          price: price.trim() !== '' ? Number(price) : undefined,
          priority,
          category,
          notes: notes.trim() || undefined,
          description: description.trim() || undefined,
          subtasks: subtasks.map((s) => s.title),
        });
        if (emailRes.success) {
          emailReminderSentAt = new Date().toISOString();
          emailReminderScheduledAt = undefined;
          emailReminderId = emailRes.id;
        }
      }
    } else if (initialTask?.emailReminderId && !initialTask?.emailReminderSentAt) {
      await cancelScheduledTaskEmail(initialTask.emailReminderId);
      emailReminderScheduledAt = undefined;
      emailReminderSentAt = undefined;
      emailReminderId = undefined;
    }

    onSave({
      id: initialTask?.id,
      title: title.trim(),
      description: description.trim() || undefined,
      price: price.trim() !== '' ? Number(price) : undefined,
      category,
      priority,
      status,
      startDate: startDate || undefined,
      dueDate: dueDate || undefined,
      notes: notes.trim() || undefined,
      remindByEmail,
      emailReminderScheduledAt,
      emailReminderSentAt,
      emailReminderId,
      subtasks,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg glass-panel border border-[#3d2f24] rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#2e231c] flex items-center justify-between">
          <h2 className="text-base font-medium text-[#f5ede4]">
            {initialTask ? 'Edytuj zlecenie / zadanie' : 'Nowe zlecenie (JC Studio)'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-[#9e8f82] hover:text-[#f5ede4] hover:bg-[#251b14] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Title */}
          <div>
            <label className="block text-xs font-mono uppercase text-[#9e8f82] mb-1.5">
              Nazwa zlecenia / zadania *
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder="np. Wizualizacja salonu dla klienta X"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-2xl glass-input text-sm placeholder-[#7a6b5e]"
            />
          </div>

          {/* Price (Cena w zł) & Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono uppercase text-[#9e8f82] mb-1.5 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-[#7ec29a]" />
                Cena zlecenia (zł)
              </label>
              <input
                type="number"
                min="0"
                step="50"
                placeholder="np. 2500"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full px-3.5 py-2 rounded-2xl glass-input font-mono text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-[#9e8f82] mb-1.5">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as Status)}
                className="w-full px-3.5 py-2 rounded-2xl glass-input text-sm"
              >
                <option value="in_progress" className="bg-[#140f0c]">W toku</option>
                <option value="done" className="bg-[#140f0c]">Gotowe</option>
                <option value="paid" className="bg-[#140f0c]">💰 Opłacone</option>
                <option value="todo" className="bg-[#140f0c]">Do zrobienia</option>
              </select>
            </div>
          </div>

          {/* Dates: Start Date & Deadline with MiniCalendarPicker */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <MiniCalendarPicker
              label="Data rozpoczęcia"
              value={startDate}
              onChange={setStartDate}
              placeholder="Wybierz start..."
              align="left"
            />

            <MiniCalendarPicker
              label="Termin / Deadline"
              value={dueDate}
              onChange={setDueDate}
              placeholder="Wybierz deadline..."
              align="right"
            />
          </div>

          {/* Category & Priority Row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono uppercase text-[#9e8f82] mb-1.5">
                Kategoria
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2 rounded-2xl glass-input text-sm"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id} className="bg-[#140f0c]">
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-[#9e8f82] mb-1.5">
                Priorytet
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="w-full px-3.5 py-2 rounded-2xl glass-input text-sm"
              >
                <option value="urgent" className="bg-[#140f0c]">🚨 Pilne</option>
                <option value="high" className="bg-[#140f0c]">⚡ Wysoki</option>
                <option value="medium" className="bg-[#140f0c]">🔹 Średni</option>
                <option value="low" className="bg-[#140f0c]">☕ Niski</option>
              </select>
            </div>
          </div>

          {/* Notes (Uwagi z JC Studio) */}
          <div>
            <label className="block text-xs font-mono uppercase text-[#9e8f82] mb-1.5">
              Uwagi / Wymagania klienta
            </label>
            <textarea
              rows={2}
              placeholder="Wymagania, wytyczne, kontakt do klienta..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-2xl glass-input text-sm resize-none placeholder-[#7a6b5e]"
            />
          </div>

          {/* Subtasks checklist */}
          <div>
            <label className="block text-xs font-mono uppercase text-[#9e8f82] mb-1.5">
              Etapy / Kroki do wykonania
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                placeholder="Dodaj kolejny krok..."
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSubtask();
                  }
                }}
                className="flex-1 px-3 py-2 rounded-2xl glass-input text-xs"
              />
              <button
                type="button"
                onClick={handleAddSubtask}
                className="px-3.5 py-2 rounded-full bg-[#251b14] hover:bg-[#322319] text-[#f5ede4] border border-[#382b20] flex items-center gap-1 text-xs font-medium transition-colors"
              >
                <Plus className="w-4 h-4" />
                Dodaj
              </button>
            </div>

            {Array.isArray(subtasks) && subtasks.length > 0 && (
              <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                {subtasks.map((st) => (
                  <div
                    key={st.id}
                    className="flex items-center justify-between gap-2 px-3 py-2 bg-[#1a1410] rounded-xl text-xs text-[#f5ede4] border border-[#2e231c]"
                  >
                    <span>{st.title}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSubtask(st.id)}
                      className="text-[#9e8f82] hover:text-[#e07a68] transition-colors"
                    >
                      <Trash className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Email Reminder Toggle */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#251b14] border border-[#382b20]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#322319] border border-[#423326] flex items-center justify-center text-[#d99b5a]">
                <Mail className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-medium text-[#f5ede4] block">
                  Wyślij przypomnienie e-mailem
                </span>
                <span className="text-[11px] text-[#9e8f82] block">
                  Powiadomienie na: {getStoredRecipientEmail()}
                </span>
                {remindByEmail && dueDate && (() => {
                  try {
                    const target = calculateReminderTimestamp({ dueDate });
                    const formatted = target ? formatScheduledReminder(target) : '';
                    return (
                      <span className="text-[10px] text-[#d99b5a] block mt-0.5">
                        ⏱️ Zostanie zaplanowane na: {formatted || `${dueDate} (godz. 09:00)`}
                      </span>
                    );
                  } catch {
                    return (
                      <span className="text-[10px] text-[#d99b5a] block mt-0.5">
                        ⏱️ Zostanie zaplanowane na: {dueDate}
                      </span>
                    );
                  }
                })()}
              </div>
            </div>
            <input
              type="checkbox"
              checked={remindByEmail}
              onChange={(e) => setRemindByEmail(e.target.checked)}
              className="w-5 h-5 rounded-md text-[#d99b5a] focus:ring-0 bg-[#140f0c] border-[#382b20] cursor-pointer accent-[#d99b5a]"
            />
          </div>

          {/* Footer Submit */}
          <div className="pt-3 border-t border-[#2e231c] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-full text-[#9e8f82] hover:text-[#f5ede4] text-xs font-medium transition-colors"
            >
              Anuluj
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-full bg-[#f5ede4] hover:bg-white text-[#120e0a] text-xs font-semibold shadow-md transition-all active:scale-95"
            >
              {initialTask ? 'Zapisz zmiany' : 'Utwórz zlecenie'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
