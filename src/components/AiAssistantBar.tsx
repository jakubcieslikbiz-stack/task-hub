import React, { useState, useEffect, useRef } from 'react';
import { executeAiCommand, speakText } from '../lib/ai';
import {
  sendTaskReminderEmail,
  getStoredRecipientEmail,
  calculateReminderTimestamp,
  formatScheduledReminder,
} from '../lib/email';
import {
  Mic,
  MicOff,
  Send,
  Sparkles,
  Loader2,
  Check,
  AlertCircle,
} from 'lucide-react';

interface AiAssistantBarProps {
  apiKey: string;
  onSaveApiKey?: (key: string) => void;
  onAddTask: (task: {
    name: string;
    category?: string;
    price?: number;
    startDate?: string;
    endDate?: string;
    dueTime?: string;
    reminderTime?: string;
    remindByEmail?: boolean;
    emailReminderScheduledAt?: string;
    emailReminderSentAt?: string;
    emailReminderId?: string;
  }) => void;
  onAddTodo: (text: string) => void;
  onAddCost: (cost: { name: string; cost: number; type: 'business' | 'private' }) => void;
  onAddNoteToTask: (taskName: string, text: string) => boolean;
  onGetFinancialSummary: () => { income: number; paid: number; expenses: number; net: number };
}

export const AiAssistantBar: React.FC<AiAssistantBarProps> = ({
  apiKey,
  onAddTask,
  onAddTodo,
  onAddCost,
  onAddNoteToTask,
  onGetFinancialSummary,
}) => {
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState<boolean>(() => {
    return localStorage.getItem('taskhub_voice_enabled') !== 'false';
  });
  const [statusMessage, setStatusMessage] = useState<{ text: string; isError?: boolean } | null>(null);

  const recognitionRef = useRef<any>(null);

  // Sync voice preference from Settings
  useEffect(() => {
    const handleVoiceChange = () => {
      setVoiceEnabled(localStorage.getItem('taskhub_voice_enabled') !== 'false');
    };
    window.addEventListener('taskhub_voice_changed', handleVoiceChange);
    return () => window.removeEventListener('taskhub_voice_changed', handleVoiceChange);
  }, []);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.lang = 'pl-PL';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);

      recognition.onresult = (event: any) => {
        const transcript = event.results?.[0]?.[0]?.transcript;
        if (transcript) {
          setInputText(transcript);
          handleExecute(transcript);
        }
      };

      recognitionRef.current = recognition;
    }
  }, [apiKey, voiceEnabled]);

  const toggleMic = () => {
    if (!recognitionRef.current) {
      alert('Rozpoznawanie mowy nie jest obsługiwane w tej przeglądarce.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        recognitionRef.current.start();
      } catch (err) {
        recognitionRef.current.stop();
      }
    }
  };

  const handleExecute = async (commandText: string) => {
    if (!commandText.trim()) return;

    if (!apiKey.trim()) {
      setStatusMessage({ text: 'Podaj swój klucz OpenAI API w zakładce Ustawienia ⚙', isError: true });
      speakText('Brak klucza API. Uzupełnij go w zakładce Ustawienia.', voiceEnabled);
      return;
    }

    setIsLoading(true);
    setStatusMessage({ text: 'Asystent AI przetwarza polecenie...' });

    try {
      const result = await executeAiCommand(commandText.trim(), apiKey.trim());

      switch (result.action) {
        case 'add_task': {
          const wantsEmail =
            Boolean(result.remindByEmail) ||
            /przypomnij.*(mail|e-mail|poczt)|wy[sś]lij.*(mail|e-mail|poczt)/i.test(commandText);

          const taskCategory = result.category || (result.price ? 'work' : 'personal');
          const categoryDesc = taskCategory === 'personal' ? 'sprawę osobistą' : 'zlecenie';
          const timeDesc = result.dueTime ? ` na godz. ${result.dueTime}` : '';
          const dateDesc = result.endDate ? ` na ${result.endDate}` : '';
          const reminderDesc = result.reminderTime ? ` (${result.reminderTime})` : '';

          let scheduledAtIso: string | undefined = undefined;
          let scheduledTimeLabel: string | undefined = undefined;
          let emailReminderId: string | undefined = undefined;

          if (wantsEmail) {
            const reminderDate = calculateReminderTimestamp({
              dueDate: result.endDate || result.startDate,
              dueTime: result.dueTime,
              reminderTime: result.reminderTime,
            });

            if (reminderDate && reminderDate.getTime() > Date.now()) {
              scheduledAtIso = reminderDate.toISOString();
              scheduledTimeLabel = formatScheduledReminder(reminderDate);

              // Zaplanuj w Resend na dokładną godzinę
              const emailRes = await sendTaskReminderEmail({
                title: result.name || 'Nowe zadanie',
                dueDate: result.endDate,
                dueTime: result.dueTime,
                reminderTime: result.reminderTime,
                scheduledAt: scheduledAtIso,
                price: result.price,
                priority: 'high',
                category: taskCategory,
                notes: `Termin: ${result.endDate || 'dzisiaj'}${timeDesc}${reminderDesc}`,
              });
              if (emailRes.success) {
                emailReminderId = emailRes.id;
              }
            } else {
              // Wyślij natychmiast jeśli brak przyszłej godziny lub termin już minął
              const emailRes = await sendTaskReminderEmail({
                title: result.name || 'Nowe zadanie',
                dueDate: result.endDate,
                dueTime: result.dueTime,
                reminderTime: result.reminderTime,
                price: result.price,
                priority: 'high',
                category: taskCategory,
                notes: `Termin: ${result.endDate || 'dzisiaj'}${timeDesc}${reminderDesc}`,
              });
              if (emailRes.success) {
                emailReminderId = emailRes.id;
              }
            }
          }

          onAddTask({
            name: result.name || 'Nowe zadanie',
            category: taskCategory,
            price: result.price,
            startDate: result.startDate,
            endDate: result.endDate,
            dueTime: result.dueTime,
            reminderTime: result.reminderTime,
            remindByEmail: wantsEmail,
            emailReminderScheduledAt: scheduledAtIso,
            emailReminderSentAt: scheduledAtIso ? undefined : (wantsEmail ? new Date().toISOString() : undefined),
            emailReminderId,
          });

          if (wantsEmail && scheduledTimeLabel) {
            const reply = `Dodałam ${categoryDesc}: "${result.name}"${dateDesc}${timeDesc} i zaplanowałam przypomnienie e-mail na ${scheduledTimeLabel}!`;
            speakText(reply, voiceEnabled);
            setStatusMessage({
              text: `✓ ${reply} (✉️ e-mail przyjdzie o ${scheduledTimeLabel})`,
            });
          } else if (wantsEmail) {
            const reply = `Dodałam ${categoryDesc}: "${result.name}"${dateDesc}${timeDesc} i wysłałam przypomnienie e-mail!`;
            speakText(reply, voiceEnabled);
            setStatusMessage({
              text: `✓ ${reply} (✉️ wysłano na ${getStoredRecipientEmail()})`,
            });
          } else {
            const reply = `Dodałam ${categoryDesc}: "${result.name}"${result.price ? ` za ${result.price} zł` : ''}${dateDesc}${timeDesc}.`;
            speakText(reply, voiceEnabled);
            setStatusMessage({ text: `✓ ${reply}` });
          }
          break;
        }

        case 'todo': {
          if (result.text) {
            onAddTodo(result.text);
            const reply = `Dodałam "${result.text}" do Twojej listy To-Do.`;
            speakText(reply, voiceEnabled);
            setStatusMessage({ text: `✓ ${reply}` });
          }
          break;
        }

        case 'add_cost': {
          if (result.name && result.cost !== undefined) {
            onAddCost({
              name: result.name,
              cost: result.cost,
              type: result.type || 'business',
            });
            const typePl = result.type === 'business' ? 'firmowy' : 'prywatny';
            const reply = `Dodałam koszt ${typePl}: "${result.name}" (${result.cost} zł).`;
            speakText(reply, voiceEnabled);
            setStatusMessage({ text: `✓ ${reply}` });
          }
          break;
        }

        case 'add_note': {
          if (result.taskName && result.text) {
            const found = onAddNoteToTask(result.taskName, result.text);
            if (found) {
              const reply = `Dodałam uwagę do projektu "${result.taskName}".`;
              speakText(reply, voiceEnabled);
              setStatusMessage({ text: `✓ ${reply}` });
            } else {
              const reply = `Nie znalazłam projektu pasującego do "${result.taskName}".`;
              speakText(reply, voiceEnabled);
              setStatusMessage({ text: reply, isError: true });
            }
          }
          break;
        }

        case 'summary': {
          const s = onGetFinancialSummary();
          const reply = `Przychód w tym miesiącu to ${s.income.toFixed(0)} zł, opłacono ${s.paid.toFixed(0)} zł. Koszty to ${s.expenses.toFixed(0)} zł. Dochód na czysto wynosi ${s.net.toFixed(0)} zł.`;
          speakText(reply, voiceEnabled);
          setStatusMessage({
            text: `📊 Przychód: ${s.income} zł | Opłacono: ${s.paid} zł | Koszty: ${s.expenses} zł | Na czysto: ${s.net} zł`,
          });
          break;
        }

        default:
          setStatusMessage({ text: 'Wykonano komendę.', isError: false });
      }

      setInputText('');
    } catch (err: any) {
      const errMsg = err?.message || 'Błąd wykonania komendy AI';
      speakText('Wystąpił problem z wykonaniem komendy.', voiceEnabled);
      setStatusMessage({ text: errMsg, isError: true });
    } finally {
      setIsLoading(false);
      setTimeout(() => {
        setStatusMessage(null);
      }, 6000);
    }
  };

  return (
    <div className="mb-4 sm:mb-6 relative">
      {/* Main AI Bar - single sleek row on mobile & desktop */}
      <div className="glass-panel border border-[#2b211a] rounded-2xl sm:rounded-3xl p-1.5 sm:p-2.5 shadow-xl flex items-center gap-1.5 sm:gap-3">
        {/* Left AI Badge */}
        <div className="flex items-center gap-2 pl-1 sm:pl-1.5 flex-shrink-0">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-[#251b14] border border-[#382b20] flex items-center justify-center text-[#d99b5a] shadow-inner">
            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
          <span className="text-xs font-medium text-[#f5ede4] hidden lg:inline whitespace-nowrap">
            Asystent JC Studio
          </span>
        </div>

        {/* Text Input + Mic Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleExecute(inputText);
          }}
          className="flex-1 flex items-center gap-1.5 sm:gap-2 min-w-0"
        >
          <div className="relative flex-1 min-w-0">
            <input
              type="text"
              placeholder="Polecenie AI: np. Dodaj fryzjer za tydzień..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={isLoading}
              className="w-full pl-3 pr-8 sm:pl-4 sm:pr-9 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl glass-input text-xs sm:text-sm placeholder-[#7a6b5e] transition-all"
            />

            {/* Mic Button */}
            <button
              type="button"
              onClick={toggleMic}
              className={`absolute right-1 sm:right-1.5 top-1/2 -translate-y-1/2 p-1 sm:p-1.5 rounded-lg transition-all ${
                isListening
                  ? 'bg-[#e07a68] text-white animate-pulse'
                  : 'text-[#9e8f82] hover:text-[#f5ede4] hover:bg-[#251b14]'
              }`}
              title={isListening ? 'Słucham... kliknij aby zatrzymać' : 'Naciśnij i mów do mikrofonu'}
            >
              {isListening ? (
                <Mic className="w-3.5 h-3.5 text-white" />
              ) : (
                <MicOff className="w-3.5 h-3.5 text-[#9e8f82]" />
              )}
            </button>
          </div>

          {/* Send Button */}
          <button
            type="submit"
            disabled={isLoading || !inputText.trim()}
            className="p-2 sm:px-4 sm:py-2.5 rounded-xl sm:rounded-full bg-[#f5ede4] hover:bg-white disabled:opacity-40 text-[#120e0a] text-xs font-semibold shadow-md flex items-center justify-center gap-1.5 transition-all active:scale-95 flex-shrink-0"
            title="Wyślij polecenie"
          >
            {isLoading ? (
              <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin text-[#120e0a]" />
            ) : (
              <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#120e0a]" />
            )}
            <span className="hidden md:inline">Wyślij</span>
          </button>
        </form>
      </div>

      {/* Status Toast / Result Banner */}
      {statusMessage && (
        <div
          className={`mt-2 p-3 rounded-xl border text-xs flex items-center gap-2 animate-in fade-in duration-200 ${
            statusMessage.isError
              ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
          }`}
        >
          {statusMessage.isError ? (
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
          ) : (
            <Check className="w-4 h-4 flex-shrink-0 text-emerald-400" />
          )}
          <span className="flex-1">{statusMessage.text}</span>
        </div>
      )}
    </div>
  );
};
