import React, { useState, useEffect } from 'react';
import type { Task, Priority, Status, Subtask } from '../types';
import { CATEGORIES } from '../data/initialData';
import { getStoredRecipientEmail, sendTaskReminderEmail } from '../lib/email';
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
      setTitle(initialTask.title);
      setDescription(initialTask.description || '');
      setPrice(initialTask.price !== undefined ? initialTask.price.toString() : '');
      setCategory(initialTask.category);
      setPriority(initialTask.priority);
      setStatus(initialTask.status);
      setStartDate(initialTask.startDate || '');
      setDueDate(initialTask.dueDate || '');
      setNotes(initialTask.notes || '');
      setRemindByEmail(initialTask.remindByEmail || false);
      setSubtasks(initialTask.subtasks || []);
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (remindByEmail) {
      sendTaskReminderEmail({
        title: title.trim(),
        dueDate: dueDate || undefined,
        price: price.trim() !== '' ? Number(price) : undefined,
        priority,
        category,
        notes: notes.trim() || undefined,
        description: description.trim() || undefined,
        subtasks: subtasks.map((s) => s.title),
      });
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
      emailReminderSentAt: remindByEmail
        ? (initialTask?.emailReminderSentAt || new Date().toISOString())
        : undefined,
      subtasks,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">
            {initialTask ? 'Edytuj zlecenie / zadanie' : 'Nowe zlecenie (JC Studio)'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Nazwa zlecenia / zadania *
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder="np. Wizualizacja salonu dla klienta X"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm"
            />
          </div>

          {/* Price (Cena w zł) & Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                Cena zlecenia (zł)
              </label>
              <input
                type="number"
                min="0"
                step="50"
                placeholder="np. 2500"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-white font-mono text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as Status)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-sm focus:outline-none focus:border-indigo-500"
              >
                <option value="in_progress" className="bg-slate-900">W toku</option>
                <option value="done" className="bg-slate-900">Gotowe</option>
                <option value="paid" className="bg-slate-900">💰 Opłacone</option>
                <option value="todo" className="bg-slate-900">Do zrobienia</option>
              </select>
            </div>
          </div>

          {/* Dates: Start Date & Deadline */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Data rozpoczęcia
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Termin / Deadline
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Category & Priority Row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Kategoria
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-sm focus:outline-none focus:border-indigo-500"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id} className="bg-slate-900">
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Priorytet
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-sm focus:outline-none focus:border-indigo-500"
              >
                <option value="urgent" className="bg-slate-900">🚨 Pilne</option>
                <option value="high" className="bg-slate-900">⚡ Wysoki</option>
                <option value="medium" className="bg-slate-900">🔹 Średni</option>
                <option value="low" className="bg-slate-900">☕ Niski</option>
              </select>
            </div>
          </div>

          {/* Notes (Uwagi z JC Studio) */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Uwagi / Wymagania klienta
            </label>
            <textarea
              rows={2}
              placeholder="Wymagania, wytyczne, kontakt do klienta..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm resize-none"
            />
          </div>

          {/* Subtasks checklist */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
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
                className="flex-1 px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500"
              />
              <button
                type="button"
                onClick={handleAddSubtask}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-400 border border-slate-700 flex items-center gap-1 text-xs font-medium transition-colors"
              >
                <Plus className="w-4 h-4" />
                Dodaj
              </button>
            </div>

            {subtasks.length > 0 && (
              <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                {subtasks.map((st) => (
                  <div
                    key={st.id}
                    className="flex items-center justify-between gap-2 px-3 py-1.5 bg-slate-800/50 rounded-lg text-xs text-slate-300 border border-slate-800"
                  >
                    <span>{st.title}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSubtask(st.id)}
                      className="text-slate-500 hover:text-rose-400 transition-colors"
                    >
                      <Trash className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Email Reminder Toggle */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-indigo-950/30 border border-indigo-500/20">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <Mail className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-semibold text-white block">
                  Wyślij przypomnienie e-mailem
                </span>
                <span className="text-[11px] text-slate-400 block">
                  Powiadomienie na: {getStoredRecipientEmail()}
                </span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={remindByEmail}
              onChange={(e) => setRemindByEmail(e.target.checked)}
              className="w-5 h-5 rounded-md text-indigo-600 focus:ring-0 bg-slate-800 border-slate-700 cursor-pointer accent-indigo-600"
            />
          </div>

          {/* Footer Submit */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 text-sm font-medium transition-colors"
            >
              Anuluj
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white text-sm font-semibold shadow-lg shadow-indigo-500/25 transition-all active:scale-95"
            >
              {initialTask ? 'Zapisz zmiany' : 'Utwórz zlecenie'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
