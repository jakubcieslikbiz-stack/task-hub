import React, { useState, useEffect, useRef } from 'react';
import { executeAiCommand, speakText } from '../lib/ai';
import {
  sendTaskReminderEmail,
  sendTestEmail,
  getStoredResendKey,
  setStoredResendKey,
  getStoredRecipientEmail,
  setStoredRecipientEmail,
} from '../lib/email';
import {
  Mic,
  MicOff,
  Send,
  Sparkles,
  Volume2,
  VolumeX,
  Key,
  Loader2,
  Check,
  AlertCircle,
  Mail,
} from 'lucide-react';

interface AiAssistantBarProps {
  apiKey: string;
  onSaveApiKey: (key: string) => void;
  onAddTask: (task: {
    name: string;
    category?: string;
    price?: number;
    startDate?: string;
    endDate?: string;
    dueTime?: string;
    reminderTime?: string;
    remindByEmail?: boolean;
  }) => void;
  onAddTodo: (text: string) => void;
  onAddCost: (cost: { name: string; cost: number; type: 'business' | 'private' }) => void;
  onAddNoteToTask: (taskName: string, text: string) => boolean;
  onGetFinancialSummary: () => { income: number; paid: number; expenses: number; net: number };
}

export const AiAssistantBar: React.FC<AiAssistantBarProps> = ({
  apiKey,
  onSaveApiKey,
  onAddTask,
  onAddTodo,
  onAddCost,
  onAddNoteToTask,
  onGetFinancialSummary,
}) => {
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [statusMessage, setStatusMessage] = useState<{ text: string; isError?: boolean } | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [tempApiKey, setTempApiKey] = useState(apiKey);
  const [tempResendKey, setTempResendKey] = useState(getStoredResendKey());
  const [tempRecipientEmail, setTempRecipientEmail] = useState(getStoredRecipientEmail());
  const [isTestingEmail, setIsTestingEmail] = useState(false);
  const [testEmailResult, setTestEmailResult] = useState<{ success: boolean; message: string } | null>(null);

  const recognitionRef = useRef<any>(null);

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
      setStatusMessage({ text: 'Podaj swój klucz OpenAI API w ustawieniach (ikona klucza 🔑)', isError: true });
      speakText('Brak klucza API. Uzupełnij go w ustawieniach.', voiceEnabled);
      setShowSettings(true);
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

          onAddTask({
            name: result.name || 'Nowe zadanie',
            category: taskCategory,
            price: result.price,
            startDate: result.startDate,
            endDate: result.endDate,
            dueTime: result.dueTime,
            reminderTime: result.reminderTime,
            remindByEmail: wantsEmail,
          });

          const categoryDesc = taskCategory === 'personal' ? 'sprawę osobistą' : 'zlecenie';
          const timeDesc = result.dueTime ? ` na godz. ${result.dueTime}` : '';
          const dateDesc = result.endDate ? ` na ${result.endDate}` : '';
          const reminderDesc = result.reminderTime ? ` (${result.reminderTime})` : '';

          if (wantsEmail) {
            const emailRes = await sendTaskReminderEmail({
              title: result.name || 'Nowe zadanie',
              dueDate: result.endDate,
              price: result.price,
              priority: 'high',
              category: taskCategory,
              notes: `Termin: ${result.endDate || 'dzisiaj'}${timeDesc}${reminderDesc}`,
            });
            if (emailRes.success) {
              const reply = `Dodałam ${categoryDesc}: "${result.name}"${dateDesc}${timeDesc} i wysłałam przypomnienie na Twój e-mail!`;
              speakText(reply, voiceEnabled);
              setStatusMessage({
                text: `✓ ${reply} (✉️ wysłano na ${getStoredRecipientEmail()})`,
              });
            } else {
              const reply = `Dodałam ${categoryDesc}: "${result.name}", ale wystąpił problem z wysyłką e-mail.`;
              speakText(reply, voiceEnabled);
              setStatusMessage({
                text: `✓ Dodałam ${categoryDesc}, błąd e-mail: ${emailRes.error}`,
                isError: true,
              });
            }
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

  const handleSaveKey = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveApiKey(tempApiKey.trim());
    setStoredResendKey(tempResendKey.trim());
    setStoredRecipientEmail(tempRecipientEmail.trim());
    setShowSettings(false);
  };

  const handleTestEmail = async () => {
    setStoredResendKey(tempResendKey.trim());
    setStoredRecipientEmail(tempRecipientEmail.trim());
    setIsTestingEmail(true);
    setTestEmailResult(null);

    const res = await sendTestEmail();
    setIsTestingEmail(false);
    if (res.success) {
      setTestEmailResult({
        success: true,
        message: `Wysłano pomyślnie test na: ${tempRecipientEmail.trim() || 'Twój adres'}!`,
      });
    } else {
      setTestEmailResult({
        success: false,
        message: res.error || 'Błąd wysyłki e-mail.',
      });
    }
  };

  return (
    <div className="mb-6 relative">
      {/* Main AI Bar */}
      <div className="glass-panel border border-[#2b211a] rounded-3xl p-3 sm:p-3.5 shadow-2xl flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
        {/* Left AI Badge / Voice Status */}
        <div className="flex items-center gap-2 px-1">
          <div className="w-8 h-8 rounded-xl bg-[#251b14] border border-[#382b20] flex items-center justify-center text-[#d99b5a] shadow-inner">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="text-xs font-medium text-[#f5ede4] hidden md:inline">
            Asystent JC Studio
          </span>
        </div>

        {/* Text Input + Mic Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleExecute(inputText);
          }}
          className="flex-1 flex items-center gap-2 w-full"
        >
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Powiedz lub napisz: np. Dodaj projekt Wizualizacja za 2500 zł do piątku..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={isLoading}
              className="w-full pl-4 pr-10 py-2.5 rounded-2xl glass-input text-xs sm:text-sm placeholder-[#7a6b5e] transition-all"
            />

            {/* Mic Button */}
            <button
              type="button"
              onClick={toggleMic}
              className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-xl transition-all ${
                isListening
                  ? 'bg-[#e07a68] text-white animate-pulse'
                  : 'text-[#9e8f82] hover:text-[#f5ede4] hover:bg-[#251b14]'
              }`}
              title={isListening ? 'Słucham... kliknij aby zatrzymać' : 'Naciśnij i mów do mikrofonu'}
            >
              {isListening ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
            </button>
          </div>

          {/* Send Button */}
          <button
            type="submit"
            disabled={isLoading || !inputText.trim()}
            className="px-5 py-2.5 rounded-full bg-[#f5ede4] hover:bg-white disabled:opacity-40 text-[#120e0a] text-xs font-semibold shadow-md flex items-center gap-1.5 transition-all active:scale-95 flex-shrink-0"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin text-[#120e0a]" /> : <Send className="w-4 h-4 text-[#120e0a]" />}
            <span className="hidden sm:inline">Wyślij</span>
          </button>
        </form>

        {/* Right utility buttons: Sound & Settings */}
        <div className="flex items-center gap-1.5 self-end sm:self-center">
          <button
            type="button"
            onClick={() => setVoiceEnabled(!voiceEnabled)}
            className={`p-2 rounded-xl text-xs transition-colors ${
              voiceEnabled ? 'bg-[#251b14] text-[#d99b5a] border border-[#382b20]' : 'text-[#7a6b5e] hover:bg-[#251b14]'
            }`}
            title={voiceEnabled ? 'Odpowiedzi głosowe włączone' : 'Odpowiedzi głosowe wyciszone'}
          >
            {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 rounded-xl text-[#9e8f82] hover:text-[#f5ede4] hover:bg-[#251b14] transition-colors"
            title="Ustawienia klucza API"
          >
            <Key className="w-4 h-4 text-[#d99b5a]" />
          </button>
        </div>
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

      {/* Settings Modal (OpenAI + Resend Email) */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5">
            <div>
              <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
                <Key className="w-4 h-4 text-amber-400" />
                Klucz OpenAI API (Głos i Asystent)
              </h3>
              <p className="text-xs text-slate-400 mb-2.5">
                Obsługuje rozpoznawanie komend języka naturalnego oraz odpowiedzi głosowe.
              </p>
              <input
                type="password"
                placeholder="sk-proj-..."
                value={tempApiKey}
                onChange={(e) => setTempApiKey(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-800 rounded-xl border border-slate-700 text-white text-xs font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="border-t border-slate-800 pt-4">
              <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
                <Mail className="w-4 h-4 text-indigo-400" />
                Powiadomienia E-mail (Resend)
              </h3>
              <p className="text-xs text-slate-400 mb-3">
                Wysyła powiadomienia na e-mail po dodaniu zadania ze słowem <em>"przypomnij mailem"</em>.
              </p>

              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">
                    Twój adres e-mail (odbiorca)
                  </label>
                  <input
                    type="email"
                    placeholder="np. jakub.cieslik.biz@gmail.com"
                    value={tempRecipientEmail}
                    onChange={(e) => setTempRecipientEmail(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-800 rounded-xl border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">
                    Klucz Resend API
                  </label>
                  <input
                    type="password"
                    placeholder="re_..."
                    value={tempResendKey}
                    onChange={(e) => setTempResendKey(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-800 rounded-xl border border-slate-700 text-white text-xs font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={handleTestEmail}
                    disabled={isTestingEmail}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 text-xs font-medium border border-indigo-500/30 flex items-center gap-1.5 transition-all"
                  >
                    {isTestingEmail ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Mail className="w-3.5 h-3.5" />
                    )}
                    <span>{isTestingEmail ? 'Wysyłanie testu...' : 'Wyślij e-mail testowy'}</span>
                  </button>
                </div>

                {testEmailResult && (
                  <div
                    className={`p-2.5 rounded-xl border text-xs flex items-center gap-2 ${
                      testEmailResult.success
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                        : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                    }`}
                  >
                    {testEmailResult.success ? (
                      <Check className="w-3.5 h-3.5 flex-shrink-0 text-emerald-400" />
                    ) : (
                      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 text-rose-400" />
                    )}
                    <span>{testEmailResult.message}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setTestEmailResult(null);
                  setShowSettings(false);
                }}
                className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-medium"
              >
                Anuluj
              </button>
              <button
                type="button"
                onClick={handleSaveKey}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all active:scale-95"
              >
                Zapisz ustawienia
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
