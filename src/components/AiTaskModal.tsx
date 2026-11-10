import React, { useState } from 'react';
import type { ParsedAiTask } from '../lib/ai';
import { parseTaskWithOpenAI } from '../lib/ai';
import type { Task, Subtask } from '../types';
import {
  sendTaskReminderEmail,
  calculateReminderTimestamp,
} from '../lib/email';
import { Sparkles, Key, X, CheckCircle2, AlertCircle, Loader2, Mail } from 'lucide-react';
import confetti from 'canvas-confetti';

interface AiTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTask: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  savedApiKey: string;
  onSaveApiKey: (key: string) => void;
}

export const AiTaskModal: React.FC<AiTaskModalProps> = ({
  isOpen,
  onClose,
  onAddTask,
  savedApiKey,
  onSaveApiKey,
}) => {
  const [prompt, setPrompt] = useState('');
  const [apiKey, setApiKey] = useState(savedApiKey);
  const [showKeyInput, setShowKeyInput] = useState(!savedApiKey);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewTask, setPreviewTask] = useState<ParsedAiTask | null>(null);
  const [remindByEmail, setRemindByEmail] = useState(false);

  if (!isOpen) return null;

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    if (!apiKey.trim()) {
      setError('Podaj swój klucz OpenAI API (sk-...)');
      setShowKeyInput(true);
      return;
    }

    setIsLoading(true);
    setError(null);
    setPreviewTask(null);

    try {
      onSaveApiKey(apiKey.trim());
      const parsed = await parseTaskWithOpenAI(prompt.trim(), apiKey.trim());
      setPreviewTask(parsed);
      const wantsMail =
        Boolean(parsed.remindByEmail) ||
        /przypomnij.*(mail|e-mail|poczt)|wy[sś]lij.*(mail|e-mail|poczt)/i.test(prompt);
      setRemindByEmail(wantsMail);
    } catch (err: any) {
      setError(err?.message || 'Wystąpił błąd podczas komunikacji z OpenAI.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!previewTask) return;

    let emailReminderScheduledAt: string | undefined = undefined;
    let emailReminderSentAt: string | undefined = undefined;
    let emailReminderId: string | undefined = undefined;

    if (remindByEmail) {
      const reminderDate = calculateReminderTimestamp({ dueDate: previewTask.dueDate });
      const isFuture = reminderDate && reminderDate.getTime() > Date.now();

      if (isFuture) {
        const schedIso = reminderDate.toISOString();
        const emailRes = await sendTaskReminderEmail({
          title: previewTask.title,
          dueDate: previewTask.dueDate,
          scheduledAt: schedIso,
          price: previewTask.price,
          priority: previewTask.priority,
          category: previewTask.category,
          notes: previewTask.notes,
          description: previewTask.description,
          subtasks: previewTask.subtasks,
        });
        if (emailRes.success) {
          emailReminderScheduledAt = schedIso;
          emailReminderId = emailRes.id;
        }
      } else {
        const emailRes = await sendTaskReminderEmail({
          title: previewTask.title,
          dueDate: previewTask.dueDate,
          price: previewTask.price,
          priority: previewTask.priority,
          category: previewTask.category,
          notes: previewTask.notes,
          description: previewTask.description,
          subtasks: previewTask.subtasks,
        });
        if (emailRes.success) {
          emailReminderSentAt = new Date().toISOString();
          emailReminderId = emailRes.id;
        }
      }
    }

    const subtasks: Subtask[] = previewTask.subtasks.map((st: string, i: number) => ({
      id: `${Date.now()}-${i}`,
      title: st,
      completed: false,
    }));

    onAddTask({
      title: previewTask.title,
      price: previewTask.price,
      category: previewTask.category,
      priority: previewTask.priority,
      status: previewTask.status,
      startDate: previewTask.startDate,
      dueDate: previewTask.dueDate,
      description: previewTask.description,
      notes: previewTask.notes,
      remindByEmail,
      emailReminderScheduledAt,
      emailReminderSentAt,
      emailReminderId,
      subtasks,
    });

    confetti({
      particleCount: 60,
      spread: 70,
      origin: { y: 0.7 },
      colors: ['#a855f7', '#6366f1', '#10b981'],
    });

    setPrompt('');
    setPreviewTask(null);
    onClose();
  };

  const examplePrompts = [
    'Wizualizacja apartamentu dla klienta X za 2800 zł na piątek, etapy: model 3D, materiały, rendering',
    'Projekt logo i identyfikacji dla JC Studio za 1500 zł termin do końca miesiąca',
    'Poprawki oświetlenia w scenie salonu dla p. Marka za 400 zł na jutro',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-xl bg-slate-900 border border-indigo-500/30 rounded-3xl shadow-2xl overflow-hidden p-6 relative max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-5 top-5 p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-500/25 text-white">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              Dodaj zlecenie przez AI
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                GPT-4o mini
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Napisz lub podyktuj luźne zdanie – AI ustawi cenę, termin i etapy prac.
            </p>
          </div>
        </div>

        {/* API Key Toggle Banner */}
        <div className="mb-4 bg-slate-950/50 p-3 rounded-2xl border border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <Key className="w-4 h-4 text-amber-400" />
            <span>
              {apiKey ? (
                <>Klucz API: <span className="font-mono text-slate-400">sk-...{apiKey.slice(-4)}</span></>
              ) : (
                <span className="text-amber-400 font-medium">Wymagany klucz OpenAI API</span>
              )}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowKeyInput(!showKeyInput)}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-medium underline"
          >
            {showKeyInput ? 'Ukryj pole' : 'Zmień klucz'}
          </button>
        </div>

        {showKeyInput && (
          <div className="mb-4 space-y-1.5 animate-in fade-in duration-150">
            <label className="block text-xs font-medium text-slate-300">
              Klucz OpenAI API (sk-...)
            </label>
            <input
              type="password"
              placeholder="sk-proj-..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-800 rounded-xl border border-slate-700 text-white text-xs font-mono focus:outline-none focus:border-indigo-500"
            />
            <p className="text-[11px] text-slate-500">
              Klucz zapisuje się wyłącznie w pamięci Twojej przeglądarki.
            </p>
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleGenerate} className="space-y-4 flex-1 overflow-y-auto pr-1">
          <div>
            <textarea
              rows={3}
              placeholder="np. Wizualizacja salonu dla p. Marka za 2400 zł na ten piątek. Zrobić model 3D, teksturowanie i render."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full p-3.5 bg-slate-800/80 rounded-2xl border border-slate-700 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none"
              autoFocus
            />
          </div>

          {/* Quick suggestions */}
          <div className="space-y-1.5">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Przykładowe szablony:
            </div>
            <div className="space-y-1">
              {examplePrompts.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setPrompt(p)}
                  className="w-full text-left text-xs text-slate-400 hover:text-indigo-300 bg-slate-800/40 hover:bg-slate-800/80 p-2 rounded-xl border border-slate-800 transition-colors truncate block"
                >
                  "{p}"
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-2 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Parsed Preview Card */}
          {previewTask && (
            <div className="p-4 bg-slate-800/60 rounded-2xl border border-indigo-500/40 space-y-2.5 animate-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
                  Rozpoznane przez AI:
                </span>
                {previewTask.price !== undefined && (
                  <span className="text-sm font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                    {previewTask.price} zł
                  </span>
                )}
              </div>

              <div className="font-semibold text-white text-sm">
                {previewTask.title}
              </div>

              <div className="flex flex-wrap gap-2 text-xs text-slate-400">
                {previewTask.dueDate && (
                  <span className="bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700">
                    📅 Termin: {previewTask.dueDate}
                  </span>
                )}
                <span className="bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700">
                  Priorytet: {previewTask.priority}
                </span>
              </div>

              {previewTask.subtasks.length > 0 && (
                <div className="pt-2 border-t border-slate-700/60">
                  <div className="text-[11px] text-slate-400 mb-1">Kroki / Checklist:</div>
                  <ul className="space-y-1 text-xs text-slate-300 pl-4 list-disc">
                    {previewTask.subtasks.map((st: string, i: number) => (
                      <li key={i}>{st}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Email reminder checkbox */}
              <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-indigo-300">
                  <Mail className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Wyślij przypomnienie na e-mail</span>
                </div>
                <input
                  type="checkbox"
                  checked={remindByEmail}
                  onChange={(e) => setRemindByEmail(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-0 bg-slate-900 border-slate-700 cursor-pointer accent-indigo-600"
                />
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-medium"
            >
              Anuluj
            </button>

            {previewTask ? (
              <button
                type="button"
                onClick={handleConfirm}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white text-xs font-semibold shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Zatwierdź i dodaj zlecenie</span>
              </button>
            ) : (
              <button
                type="submit"
                disabled={isLoading || !prompt.trim()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white text-xs font-semibold shadow-lg shadow-indigo-600/25 transition-all active:scale-95"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>AI przetwarza...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Wygeneruj zlecenie</span>
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
