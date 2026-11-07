import React, { useState, useEffect, useRef } from 'react';
import { executeAiCommand, speakText } from '../lib/ai';
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
  AlertCircle
} from 'lucide-react';

interface AiAssistantBarProps {
  apiKey: string;
  onSaveApiKey: (key: string) => void;
  onAddTask: (task: { name: string; price?: number; startDate?: string; endDate?: string }) => void;
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
          onAddTask({
            name: result.name || 'Nowy projekt',
            price: result.price,
            startDate: result.startDate,
            endDate: result.endDate,
          });
          const reply = `Dodałam projekt: "${result.name}"${result.price ? ` za ${result.price} zł` : ''}${result.endDate ? ` do ${result.endDate}` : ''}.`;
          speakText(reply, voiceEnabled);
          setStatusMessage({ text: `✓ ${reply}` });
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
    setShowSettings(false);
  };

  return (
    <div className="mb-6 relative">
      {/* Main AI Bar */}
      <div className="bg-slate-900/90 border border-indigo-500/30 rounded-2xl p-2.5 sm:p-3 shadow-xl backdrop-blur-md flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
        {/* Left AI Badge / Voice Status */}
        <div className="flex items-center gap-2 px-1">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/25">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold text-white hidden md:inline">
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
              className="w-full pl-3.5 pr-9 py-2 bg-slate-950/60 rounded-xl border border-slate-800 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />

            {/* Mic Button */}
            <button
              type="button"
              onClick={toggleMic}
              className={`absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-all ${
                isListening
                  ? 'bg-rose-500 text-white animate-pulse'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
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
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 flex items-center gap-1.5 transition-all active:scale-95 flex-shrink-0"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            <span className="hidden sm:inline">Wyślij</span>
          </button>
        </form>

        {/* Right utility buttons: Sound & Settings */}
        <div className="flex items-center gap-1.5 self-end sm:self-center">
          <button
            type="button"
            onClick={() => setVoiceEnabled(!voiceEnabled)}
            className={`p-2 rounded-xl text-xs transition-colors ${
              voiceEnabled ? 'bg-indigo-600/20 text-indigo-300' : 'bg-slate-800 text-slate-500'
            }`}
            title={voiceEnabled ? 'Odpowiedzi głosowe włączone' : 'Odpowiedzi głosowe wyciszone'}
          >
            {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Ustawienia klucza API"
          >
            <Key className="w-4 h-4 text-amber-400" />
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

      {/* Quick Prompt Pill Shortcuts */}
      <div className="flex items-center gap-1.5 overflow-x-auto py-2 text-[11px] text-slate-400">
        <span className="text-slate-500 whitespace-nowrap pl-1">Szybkie komendy:</span>
        <button
          onClick={() => handleExecute('Podsumowanie finansowe')}
          className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 whitespace-nowrap transition-colors"
        >
          💰 Podsumowanie finansowe
        </button>
        <button
          onClick={() => handleExecute('Dodaj projekt Wizualizacja salonu za 2500 zł do piątku')}
          className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 whitespace-nowrap transition-colors"
        >
          + Projekt za 2500 zł
        </button>
        <button
          onClick={() => handleExecute('Dodaj do to do wysłać fakturę do klienta')}
          className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 whitespace-nowrap transition-colors"
        >
          ✓ Dodaj do To-Do
        </button>
      </div>

      {/* API Key Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
              <Key className="w-4 h-4 text-amber-400" />
              Klucz OpenAI API
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Klucz jest zapisany w pamięci Twojej przeglądarki i używany do obsługi komend asystenta głosowego i tekstowego.
            </p>

            <form onSubmit={handleSaveKey} className="space-y-4">
              <div>
                <input
                  type="password"
                  placeholder="sk-proj-..."
                  value={tempApiKey}
                  onChange={(e) => setTempApiKey(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 rounded-xl border border-slate-700 text-white text-xs font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowSettings(false)}
                  className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-white text-xs"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
                >
                  Zapisz klucz
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
