import React, { useState, useEffect, useRef } from 'react';
import { parseEmailToTaskWithOpenAI, type ParsedEmailTask } from '../lib/ai';
import {
  Mail,
  Inbox,
  Sparkles,
  Copy,
  Check,
  RefreshCw,
  Send,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  FileText,
  Clock,
  DollarSign,
  User,
  ListTodo,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Play,
  RotateCw,
} from 'lucide-react';

interface EmailInboxTestViewProps {
  apiKey: string;
  onAddTask: (task: {
    name: string;
    category?: string;
    price?: number;
    startDate?: string;
    endDate?: string;
    dueTime?: string;
    reminderTime?: string;
    remindByEmail?: boolean;
    description?: string;
    notes?: string;
    subtasks?: string[];
  }) => void;
  onNavigateToTasks: () => void;
}

interface ReceivedEmail {
  id: string;
  createdAt: string;
  sender: string;
  subject: string;
  body: string;
  rawType?: string;
}

export const EmailInboxTestView: React.FC<EmailInboxTestViewProps> = ({
  apiKey,
  onAddTask,
  onNavigateToTasks,
}) => {
  // Token state for webhook.site free mailbox
  const [token, setToken] = useState<string>(() => {
    return localStorage.getItem('taskhub_email_inbox_token') || '3ea55cc0-1fdb-4894-abaf-a6f06adedb6b';
  });

  const [inboxEmail, setInboxEmail] = useState<string>(() => {
    const savedToken = localStorage.getItem('taskhub_email_inbox_token') || '3ea55cc0-1fdb-4894-abaf-a6f06adedb6b';
    return `${savedToken}@email.webhook.site`;
  });

  const [messages, setMessages] = useState<ReceivedEmail[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Analysis state
  const [analyzingEmailId, setAnalyzingEmailId] = useState<string | null>(null);
  const [parsedTask, setParsedTask] = useState<ParsedEmailTask | null>(null);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [taskAddedSuccess, setTaskAddedSuccess] = useState(false);

  // Direct paste/simulator state
  const [showSimulator, setShowSimulator] = useState(false);
  const [pasteSender, setPasteSender] = useState('klient@architektura-design.pl');
  const [pasteSubject, setPasteSubject] = useState('Nowe zlecenie: Wizualizacje 3D osiedla domów');
  const [pasteBody, setPasteBody] = useState(
    'Cześć Jakub,\n\nPrzesyłam rzuty do nowego projektu osiedla w Gdyni. Potrzebujemy 3 ujęcia zewnętrzne domów w wysokiej rozdzielczości.\n\nTermin wykonania: do 25 listopada 2026.\nNasz budżet na to zlecenie to 3800 zł netto.\n\nW załącznikach przesyłam modele brył i specyfikację elewacji.\n\nPozdrawiam serdecznie,\nAnna Nowak\nStudio Architektoniczne'
  );
  const [expandedEmailId, setExpandedEmailId] = useState<string | null>(null);
  const [showPermanentGuide, setShowPermanentGuide] = useState(false);

  // Auto-refresh interval ref
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize or fetch on mount
  useEffect(() => {
    if (token) {
      fetchMessages(token, false);
    }
  }, [token]);

  // Handle auto-refresh every 8 seconds
  useEffect(() => {
    if (!autoRefresh || !token) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      fetchMessages(token, true);
    }, 8000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [autoRefresh, token]);

  const handleCreateNewInbox = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/inbox?action=create');
      const data = await res.json();
      if (!res.ok || !data.token) {
        throw new Error(data.error || 'Nie udało się utworzyć adresu');
      }
      setToken(data.token);
      setInboxEmail(data.email);
      localStorage.setItem('taskhub_email_inbox_token', data.token);
      setMessages([]);
      setSuccessNotice('Utworzono nowy, unikalny adres testowy poczty!');
      setTimeout(() => setSuccessNotice(null), 4000);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Błąd generowania skrzynki');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMessages = async (targetToken: string, isSilent = false) => {
    if (!isSilent) setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch(`/api/inbox?action=get&token=${encodeURIComponent(targetToken)}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Błąd pobierania wiadomości');
      }
      if (Array.isArray(data.messages)) {
        setMessages(data.messages);
      }
    } catch (err: any) {
      if (!isSilent) {
        setErrorMessage(err?.message || 'Nie udało się połączyć ze skrzynką');
      }
    } finally {
      if (!isSilent) setIsLoading(false);
    }
  };

  const handleCopyEmail = () => {
    if (!inboxEmail) return;
    navigator.clipboard.writeText(inboxEmail);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  const handleSimulateSend = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/inbox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'simulate',
          token,
          sample: {
            from: pasteSender,
            subject: pasteSubject,
            content: pasteBody,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Błąd symulacji');

      setSuccessNotice('Wysłano próbną wiadomość! Za chwilę pojawi się w skrzynce.');
      setTimeout(() => setSuccessNotice(null), 4000);
      await fetchMessages(token, false);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Błąd symulacji');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnalyzeEmail = async (email: { sender: string; subject: string; body: string; id?: string }) => {
    if (!apiKey) {
      setErrorMessage('Brak skonfigurowanego klucza OpenAI API.');
      return;
    }
    if (email.id) setAnalyzingEmailId(email.id);
    setErrorMessage(null);
    setTaskAddedSuccess(false);

    try {
      const result = await parseEmailToTaskWithOpenAI(
        { sender: email.sender, subject: email.subject, body: email.body },
        apiKey
      );
      setParsedTask(result);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Błąd analizy maila przez AI.');
    } finally {
      setAnalyzingEmailId(null);
    }
  };

  const handleConfirmAddTask = () => {
    if (!parsedTask) return;
    setIsAddingTask(true);

    try {
      onAddTask({
        name: parsedTask.title,
        category: parsedTask.category,
        price: parsedTask.price,
        startDate: parsedTask.startDate,
        endDate: parsedTask.dueDate,
        description: parsedTask.description,
        notes: parsedTask.notes,
        subtasks: parsedTask.subtasks,
      });

      setTaskAddedSuccess(true);
      setTimeout(() => {
        setTaskAddedSuccess(false);
        setParsedTask(null);
      }, 3500);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Błąd dodawania zadania');
    } finally {
      setIsAddingTask(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-16 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1c140e] via-[#150f0b] to-[#0d0907] border border-[#3d2c20]/80 p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-[#d99b5a]/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[#2a1c12] text-[#d99b5a] border border-[#d99b5a]/30 shadow-inner">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              <span>TEST SKRZYNKI POCZTOWEJ AI</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#7ec29a] animate-ping" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#f5ede4]">
              Przekształcaj Maile w Zlecenia & Zadania
            </h1>
            <p className="text-sm text-[#a89687] max-w-2xl leading-relaxed">
              Przekaż dowolną wiadomość od klienta ze swojej poczty na poniższy adres. Sztuczna inteligencja automatycznie wyciągnie kluczowe wytyczne, terminy oraz wycenę i utworzy gotowe zlecenie.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto bg-[#1a120c]/80 border border-[#38281d] rounded-2xl p-2.5">
            <ShieldCheck className="w-5 h-5 text-[#7ec29a]" />
            <div className="text-xs">
              <div className="font-semibold text-[#f5ede4]">100% Darmowe & Bezpieczne</div>
              <div className="text-[#8c7b6d]">Brak dostępu do Twojej skrzynki</div>
            </div>
          </div>
        </div>

        {/* Address Card */}
        <div className="mt-6 pt-6 border-t border-[#2e2117] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#9e8f82]">
              <Inbox className="w-3.5 h-3.5 text-[#d99b5a]" />
              <span>Twój dedykowany adres do przekazywania maili:</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="px-4 py-2.5 rounded-2xl bg-[#0c0806] border border-[#422f22] font-mono text-sm sm:text-base text-[#f5ede4] select-all flex items-center gap-2 shadow-inner">
                <span className="text-[#d99b5a] font-bold">✉</span>
                <span>{inboxEmail}</span>
              </div>
              <button
                onClick={handleCopyEmail}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs font-medium bg-[#f5ede4] hover:bg-white text-[#120e0a] transition-all duration-150 active:scale-95 shadow-lg"
              >
                {isCopied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
                    <span>Skopiowano!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Kopiuj adres</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => fetchMessages(token, false)}
              disabled={isLoading}
              title="Sprawdź nowe wiadomości"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-medium bg-[#251b13] hover:bg-[#302319] text-[#f5ede4] border border-[#3d2c20] transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#d99b5a]' : ''}`} />
              <span>Sprawdź pocztę</span>
            </button>

            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-medium transition-colors border ${
                autoRefresh
                  ? 'bg-[#18261b] text-[#7ec29a] border-[#7ec29a]/30'
                  : 'bg-[#1c140e] text-[#8c7b6d] border-[#2e2117]'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-[#7ec29a] animate-pulse' : 'bg-zinc-600'}`} />
              <span>{autoRefresh ? 'Autoodświeżanie: WŁ' : 'Autoodświeżanie: WYŁ'}</span>
            </button>

            <button
              onClick={handleCreateNewInbox}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs text-[#8c7b6d] hover:text-[#f5ede4] hover:bg-[#251b13] transition-colors"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>Nowy adres</span>
            </button>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {successNotice && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-[#142318] border border-[#7ec29a]/40 text-[#7ec29a] text-xs animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successNotice}</span>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-[#2b1212] border border-red-500/40 text-red-300 text-xs animate-in fade-in duration-200">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Step by step test guide cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-[#17100b] border border-[#2e2117] space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#d99b5a]">
            <span className="w-5 h-5 rounded-full bg-[#d99b5a]/20 flex items-center justify-center text-[11px]">1</span>
            <span>Przekaż maila od klienta</span>
          </div>
          <p className="text-xs text-[#9e8f82] leading-relaxed">
            Skopiuj powyższy adres i prześlij na niego dowolnego maila ze swojej prywatnej skrzynki pocztowej.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-[#17100b] border border-[#2e2117] space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#d99b5a]">
            <span className="w-5 h-5 rounded-full bg-[#d99b5a]/20 flex items-center justify-center text-[11px]">2</span>
            <span>AI analizuje treść</span>
          </div>
          <p className="text-xs text-[#9e8f82] leading-relaxed">
            Model gpt-4o-mini natychmiast odczyta wiadomość, identyfikując zakres prac, budżet, terminy i wytyczne.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-[#17100b] border border-[#2e2117] space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#7ec29a]">
            <span className="w-5 h-5 rounded-full bg-[#7ec29a]/20 flex items-center justify-center text-[11px]">3</span>
            <span>1-kliknięcie i w bazie</span>
          </div>
          <p className="text-xs text-[#9e8f82] leading-relaxed">
            Zatwierdź podsumowanie jednym kliknięciem – zlecenie od razu pojawi się w Twojej tabeli zleceń i kalendarzu.
          </p>
        </div>
      </div>

      {/* Quick Test Simulator Button */}
      <div className="p-4 rounded-2xl bg-[#140e0a] border border-[#2a1d14] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-[#d99b5a]/10 text-[#d99b5a]">
            <Play className="w-4 h-4 fill-current" />
          </div>
          <div>
            <div className="text-xs font-semibold text-[#f5ede4]">
              Nie chcesz teraz wchodzić na pocztę?
            </div>
            <div className="text-xs text-[#8c7b6d]">
              Wyślij przykładowe zlecenie klienta (wizualizacje 3D, budżet 3800 zł) jednym przyciskiem.
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSimulator(!showSimulator)}
            className="px-3 py-1.5 rounded-xl text-xs font-medium bg-[#221710] hover:bg-[#2c1e15] text-[#d99b5a] border border-[#3d2c20] transition-colors"
          >
            {showSimulator ? 'Ukryj edytor' : 'Edytuj treść próbną'}
          </button>
          <button
            onClick={handleSimulateSend}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-[#d99b5a] hover:bg-[#e2aa6e] text-[#120e0a] transition-all shadow-md active:scale-95"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Wyślij próbnego maila</span>
          </button>
        </div>
      </div>

      {/* Simulator form dropdown */}
      {showSimulator && (
        <div className="p-5 rounded-2xl bg-[#160f0a] border border-[#3a281c] space-y-4 animate-in slide-in-from-top-2 duration-200">
          <div className="text-xs font-semibold text-[#f5ede4] flex items-center gap-2">
            <FileText className="w-3.5 h-3.5 text-[#d99b5a]" />
            <span>Edytor próbnej wiadomości e-mail do testu:</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-mono text-[#8c7b6d] uppercase mb-1">Od kogo (Nadawca):</label>
              <input
                type="text"
                value={pasteSender}
                onChange={(e) => setPasteSender(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#0c0806] border border-[#332317] text-xs text-[#f5ede4] focus:outline-none focus:border-[#d99b5a]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-mono text-[#8c7b6d] uppercase mb-1">Temat maila:</label>
              <input
                type="text"
                value={pasteSubject}
                onChange={(e) => setPasteSubject(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#0c0806] border border-[#332317] text-xs text-[#f5ede4] focus:outline-none focus:border-[#d99b5a]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-mono text-[#8c7b6d] uppercase mb-1">Treść wiadomości:</label>
            <textarea
              rows={5}
              value={pasteBody}
              onChange={(e) => setPasteBody(e.target.value)}
              className="w-full p-3 rounded-xl bg-[#0c0806] border border-[#332317] text-xs text-[#f5ede4] focus:outline-none focus:border-[#d99b5a] font-mono"
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              onClick={() => handleAnalyzeEmail({ sender: pasteSender, subject: pasteSubject, body: pasteBody })}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#2a1d13] text-[#f5ede4] hover:bg-[#38271a] border border-[#4a3424] transition-colors"
            >
              Przeanalizuj bezpośrednio (bez wysyłki)
            </button>
            <button
              onClick={handleSimulateSend}
              disabled={isLoading}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#d99b5a] text-[#120e0a] hover:bg-[#e2aa6e] transition-colors"
            >
              Wyślij do skrzynki testowej
            </button>
          </div>
        </div>
      )}

      {/* AI Task Preview & Confirmation Card */}
      {parsedTask && (
        <div className="p-6 rounded-3xl bg-gradient-to-br from-[#1c1524] via-[#16101c] to-[#0f0b13] border-2 border-[#a855f7]/60 shadow-[0_0_30px_rgba(168,85,247,0.15)] space-y-5 animate-in zoom-in-95 duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#3b274c]">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-[#a855f7]/20 text-[#c084fc] border border-[#a855f7]/30">
                <Sparkles className="w-5 h-5 animate-spin" style={{ animationDuration: '6s' }} />
              </div>
              <div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-[#c084fc] font-semibold">
                  Rozpoznano nowe zlecenie przez AI
                </span>
                <h3 className="text-lg font-bold text-[#f5ede4]">{parsedTask.title}</h3>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setParsedTask(null)}
                className="px-3 py-1.5 rounded-xl text-xs text-[#9e8f82] hover:text-[#f5ede4] hover:bg-[#251b2a] transition-colors"
              >
                Odrzuć
              </button>
              {taskAddedSuccess ? (
                <button
                  onClick={onNavigateToTasks}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/40 transition-all active:scale-95"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Dodano! Zobacz zlecenia →</span>
                </button>
              ) : (
                <button
                  onClick={handleConfirmAddTask}
                  disabled={isAddingTask}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-[#a855f7] hover:bg-[#b56af9] text-white shadow-lg shadow-purple-900/40 transition-all active:scale-95"
                >
                  <PlusIcon className="w-4 h-4" />
                  <span>Zatwierdź i dodaj do TaskHub</span>
                </button>
              )}
            </div>
          </div>

          <p className="text-xs text-[#d8b4fe] italic bg-[#261735]/60 p-3 rounded-xl border border-[#4c2d6b]">
            💡 {parsedTask.confidenceSummary}
          </p>

          {/* Details grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-[#120b17] border border-[#2e1d3d]">
              <div className="text-[10px] font-mono text-[#9e8f82] uppercase flex items-center gap-1.5">
                <User className="w-3 h-3 text-[#c084fc]" />
                Klient
              </div>
              <div className="font-semibold text-[#f5ede4] mt-1">{parsedTask.client || 'Klient z maila'}</div>
            </div>

            <div className="p-3 rounded-xl bg-[#120b17] border border-[#2e1d3d]">
              <div className="text-[10px] font-mono text-[#9e8f82] uppercase flex items-center gap-1.5">
                <DollarSign className="w-3 h-3 text-[#7ec29a]" />
                Budżet
              </div>
              <div className="font-semibold text-[#7ec29a] mt-1">
                {parsedTask.price ? `${parsedTask.price} zł` : 'Do uzgodnienia'}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#120b17] border border-[#2e1d3d]">
              <div className="text-[10px] font-mono text-[#9e8f82] uppercase flex items-center gap-1.5">
                <Clock className="w-3 h-3 text-[#f59e0b]" />
                Termin
              </div>
              <div className="font-semibold text-[#f5ede4] mt-1">{parsedTask.dueDate || 'Brak terminu'}</div>
            </div>

            <div className="p-3 rounded-xl bg-[#120b17] border border-[#2e1d3d]">
              <div className="text-[10px] font-mono text-[#9e8f82] uppercase flex items-center gap-1.5">
                <ListTodo className="w-3 h-3 text-[#38bdf8]" />
                Kategoria
              </div>
              <div className="font-semibold text-[#f5ede4] mt-1">
                {parsedTask.category === 'personal' ? 'Sprawa Osobista' : 'Zlecenie 3D'}
              </div>
            </div>
          </div>

          {/* Subtasks */}
          {parsedTask.subtasks && parsedTask.subtasks.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-semibold text-[#c084fc] flex items-center gap-1.5">
                <ListTodo className="w-3.5 h-3.5" />
                <span>Wyodrębnione etapy pracy ({parsedTask.subtasks.length}):</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {parsedTask.subtasks.map((st, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 p-2 rounded-xl bg-[#120b17] border border-[#2e1d3d] text-xs text-[#e4d4f5]"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#c084fc]" />
                    <span>{st}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {parsedTask.notes && (
            <div className="p-3 rounded-xl bg-[#120b17] border border-[#2e1d3d] text-xs space-y-1">
              <span className="font-mono text-[10px] text-[#9e8f82] uppercase">Wytyczne & Notatki klienta:</span>
              <p className="text-[#d5c2e8] whitespace-pre-line leading-relaxed">{parsedTask.notes}</p>
            </div>
          )}
        </div>
      )}

      {/* Received Emails List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-bold text-[#f5ede4]">
            <Mail className="w-4 h-4 text-[#d99b5a]" />
            <span>Odebrane wiadomości w testowej skrzynce ({messages.length})</span>
          </div>

          {messages.length > 0 && (
            <button
              onClick={() => {
                fetch(`/api/inbox?action=clear&token=${token}`).then(() => setMessages([]));
              }}
              className="text-xs text-[#8c7b6d] hover:text-red-400 transition-colors"
            >
              Wyczyść listę
            </button>
          )}
        </div>

        {messages.length === 0 ? (
          <div className="p-10 rounded-3xl bg-[#140e0a] border border-[#2e2117] text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#221710] text-[#d99b5a] flex items-center justify-center mx-auto">
              <Inbox className="w-6 h-6 stroke-[1.5]" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-[#f5ede4]">Skrzynka oczekuje na pierwszą wiadomość</h4>
              <p className="text-xs text-[#8c7b6d] max-w-md mx-auto leading-relaxed">
                Prześlij maila ze swojej poczty na adres <span className="font-mono text-[#d99b5a]">{inboxEmail}</span>{' '}
                lub kliknij przycisk „Wyślij próbnego maila” powyżej, aby przetestować system od ręki.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((msg) => {
              const isExpanded = expandedEmailId === msg.id;
              const isAnalyzing = analyzingEmailId === msg.id;

              return (
                <div
                  key={msg.id}
                  className="rounded-2xl bg-[#17100b] border border-[#302217] p-4 space-y-3 hover:border-[#453122] transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-xs text-[#f5ede4]">{msg.subject}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#251b14] text-[#a89687]">
                          {msg.createdAt || 'Przed chwilą'}
                        </span>
                      </div>
                      <div className="text-xs text-[#8c7b6d] flex items-center gap-1.5">
                        <User className="w-3 h-3 text-[#d99b5a]" />
                        <span>Od: {msg.sender}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleAnalyzeEmail(msg)}
                        disabled={isAnalyzing}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#2a1d13] hover:bg-[#3d2a1c] text-[#d99b5a] border border-[#d99b5a]/30 transition-all active:scale-95"
                      >
                        <Sparkles className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-spin' : ''}`} />
                        <span>{isAnalyzing ? 'Analizuję...' : 'Przeanalizuj przez AI'}</span>
                      </button>

                      <button
                        onClick={() => setExpandedEmailId(isExpanded ? null : msg.id)}
                        className="p-1.5 rounded-lg text-[#8c7b6d] hover:text-[#f5ede4] hover:bg-[#251b14] transition-colors"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Body Preview */}
                  {isExpanded ? (
                    <div className="p-3 rounded-xl bg-[#0d0906] border border-[#2a1d14] font-mono text-xs text-[#d5c5b5] whitespace-pre-wrap leading-relaxed animate-in fade-in duration-150">
                      {msg.body}
                    </div>
                  ) : (
                    <p className="text-xs text-[#8c7b6d] line-clamp-2 leading-relaxed">
                      {msg.body.replace(/\\n/g, ' ')}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Permanent Solution Guide (Cloudflare Email Routing) */}
      <div className="rounded-3xl bg-[#120d09] border border-[#2b1d14] overflow-hidden">
        <button
          onClick={() => setShowPermanentGuide(!showPermanentGuide)}
          className="w-full p-4 sm:p-5 flex items-center justify-between text-left text-xs text-[#a89687] hover:text-[#f5ede4] transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <HelpCircle className="w-4 h-4 text-[#d99b5a]" />
            <span className="font-medium text-[#f5ede4]">
              Jak to rozwiązanie będzie działać na stałe w 100% za darmo bez limitów?
            </span>
          </div>
          {showPermanentGuide ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showPermanentGuide && (
          <div className="px-5 pb-5 text-xs text-[#9e8f82] space-y-3 border-t border-[#221710] pt-4 animate-in fade-in duration-150 leading-relaxed">
            <p>
              Obecna skrzynka testowa działa na darmowym silniku webhooków i jest w pełni gotowa do testów.
              Gdy zdecydujesz, że chcesz korzystać z tego rozwiązania na co dzień:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-[#d5c5b5]">
              <li>
                <strong className="text-[#f5ede4]">Cloudflare Email Routing (0 zł / na zawsze):</strong> Pozwala utworzyć adres we własnej domenie (np. <span className="font-mono text-[#d99b5a]">zadania@twojadomena.pl</span>).
              </li>
              <li>
                <strong className="text-[#f5ede4]">Bezpieczeństwo skrzynki:</strong> Nie dajesz TaskHubowi żadnych uprawnień do czytania Twojego głównego konta pocztowego. Aplikacja widzi wyłącznie te maile, które sam zdecydujesz się jej przekazać.
              </li>
              <li>
                <strong className="text-[#f5ede4]">Koszt OpenAI:</strong> Ponieważ przetwarzany jest tylko tekst konkretnego maila w lekkim modelu GPT-4o mini, koszt to około 0,0005 zł (ułamek grosza) za jedno przetworzone zlecenie.
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  );
}
