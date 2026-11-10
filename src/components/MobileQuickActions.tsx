import React, { useState, useRef, useEffect } from 'react';
import type { ViewMode } from '../types';
import {
  Menu,
  Plus,
  Mic,
  Loader2,
  Calendar,
  CheckSquare,
  Timer,
  Clock,
  DollarSign,
  MailCheck,
  Image as ImageIcon,
  DraftingCompass,
  Globe,
  Sparkles,
} from 'lucide-react';
import { executeAiCommand, speakText } from '../lib/ai';
import {
  sendTaskReminderEmail,
  calculateReminderTimestamp,
  formatScheduledReminder,
} from '../lib/email';

interface MobileQuickActionsProps {
  currentView: ViewMode;
  onOpenMobileMenu: () => void;
  onQuickAdd: () => void;
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
    emailReminderScheduledAt?: string;
    emailReminderSentAt?: string;
    emailReminderId?: string;
  }) => void;
  onAddTodo: (text: string) => void;
  onAddCost: (cost: { name: string; cost: number; type: 'business' | 'private' }) => void;
  onAddNoteToTask: (taskName: string, text: string) => boolean;
}

const VIEW_ICONS: Record<ViewMode, React.ReactNode> = {
  today: <Calendar className="w-4 h-4" />,
  all: <CheckSquare className="w-4 h-4" />,
  pomodoro: <Timer className="w-4 h-4" />,
  timeline: <Clock className="w-4 h-4" />,
  finances: <DollarSign className="w-4 h-4 text-[#7ec29a]" />,
  offers: <MailCheck className="w-4 h-4 text-[#d99b5a]" />,
  converter: <ImageIcon className="w-4 h-4" />,
  dwg_converter: <DraftingCompass className="w-4 h-4 text-[#d99b5a]" />,
  portfolio_manager: <Globe className="w-4 h-4" />,
};

export const MobileQuickActions: React.FC<MobileQuickActionsProps> = ({
  currentView,
  onOpenMobileMenu,
  onQuickAdd,
  apiKey,
  onAddTask,
  onAddTodo,
  onAddCost,
  onAddNoteToTask,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const transcriptAccumulatorRef = useRef('');
  const isManuallyStoppedRef = useRef(false);

  // Initialize SpeechRecognition with continuous: true (user controls when to stop)
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.lang = 'pl-PL';
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsRecording(true);
      };

      recognition.onresult = (event: any) => {
        let currentInterim = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            transcriptAccumulatorRef.current += event.results[i][0].transcript + ' ';
          } else {
            currentInterim += event.results[i][0].transcript;
          }
        }
        const fullText = (transcriptAccumulatorRef.current + currentInterim).trim();
        setTranscript(fullText);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition notice:', event.error);
        if (event.error !== 'no-speech') {
          setIsRecording(false);
        }
      };

      recognition.onend = () => {
        // If user didn't stop manually, we restart to keep listening until user taps stop
        if (!isManuallyStoppedRef.current && isRecording) {
          try {
            recognition.start();
          } catch {
            setIsRecording(false);
          }
        } else {
          setIsRecording(false);
        }
      };

      recognitionRef.current = recognition;
    }
  }, [apiKey]);

  // Handle voice command execution
  const processFinalSpeech = async (spokenText: string) => {
    if (!spokenText.trim()) return;

    if (!apiKey.trim()) {
      alert('Podaj klucz OpenAI API w ustawieniach Asystenta (ikona klucza 🔑)');
      return;
    }

    setIsProcessing(true);
    setFeedback('Przetwarzanie przez AI...');

    try {
      const result = await executeAiCommand(spokenText.trim(), apiKey.trim());

      switch (result.action) {
        case 'add_task': {
          const wantsEmail =
            Boolean(result.remindByEmail) ||
            /przypomnij.*(mail|e-mail|poczt)|wy[sś]lij.*(mail|e-mail|poczt)/i.test(spokenText);

          const taskCategory = result.category || (result.price ? 'work' : 'personal');
          const catName = taskCategory === 'personal' ? 'sprawę' : 'zlecenie';
          const timeMsg = result.dueTime ? ` na ${result.dueTime}` : '';
          const dateMsg = result.endDate ? ` (${result.endDate})` : '';

          let scheduledAtIso: string | undefined = undefined;
          let scheduledDateText: string | undefined = undefined;
          let emailReminderId: string | undefined = undefined;

          if (wantsEmail) {
            const reminderDate = calculateReminderTimestamp({
              dueDate: result.endDate || result.startDate,
              dueTime: result.dueTime,
              reminderTime: result.reminderTime,
            });

            if (reminderDate && reminderDate.getTime() > Date.now()) {
              scheduledAtIso = reminderDate.toISOString();
              scheduledDateText = formatScheduledReminder(reminderDate);

              const emailRes = await sendTaskReminderEmail({
                title: result.name || 'Nowe zadanie',
                dueDate: result.endDate,
                dueTime: result.dueTime,
                reminderTime: result.reminderTime,
                scheduledAt: scheduledAtIso,
                price: result.price,
                priority: 'high',
                category: taskCategory,
                notes: `Termin: ${result.endDate || 'dzisiaj'}${timeMsg}`,
              });
              if (emailRes.success) {
                emailReminderId = emailRes.id;
              }
            } else {
              const emailRes = await sendTaskReminderEmail({
                title: result.name || 'Nowe zadanie',
                dueDate: result.endDate,
                dueTime: result.dueTime,
                reminderTime: result.reminderTime,
                price: result.price,
                priority: 'high',
                category: taskCategory,
                notes: `Termin: ${result.endDate || 'dzisiaj'}${timeMsg}`,
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

          if (wantsEmail && scheduledDateText) {
            const reply = `Dodałam ${catName}: "${result.name}" i zaplanowałam maila na ${scheduledDateText}!`;
            speakText(reply);
            setFeedback(`✓ ${reply}`);
          } else if (wantsEmail) {
            const reply = `Dodałam ${catName}: "${result.name}" i wysłałam maila!`;
            speakText(reply);
            setFeedback(`✓ ${reply}`);
          } else {
            const reply = `Dodałam ${catName}: "${result.name}"${dateMsg}${timeMsg}`;
            speakText(reply);
            setFeedback(`✓ ${reply}`);
          }
          break;
        }

        case 'todo': {
          if (result.text) {
            onAddTodo(result.text);
            const reply = `Dodałam "${result.text}" do Twojej listy To-Do`;
            speakText(reply);
            setFeedback(`✓ ${reply}`);
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
            const reply = `Zapisałam wydatek: "${result.name}" (${result.cost} zł)`;
            speakText(reply);
            setFeedback(`✓ ${reply}`);
          }
          break;
        }

        case 'add_note': {
          if (result.taskName && result.text) {
            const ok = onAddNoteToTask(result.taskName, result.text);
            if (ok) {
              const reply = `Dodałam uwagę do projektu "${result.taskName}"`;
              speakText(reply);
              setFeedback(`✓ ${reply}`);
            } else {
              setFeedback(`Nie znaleziono projektu "${result.taskName}"`);
            }
          }
          break;
        }

        default: {
          setFeedback('Rozpoznano polecenie, ale nie dopasowano akcji.');
          break;
        }
      }
    } catch (err: any) {
      console.error('Voice AI Error:', err);
      setFeedback(`Błąd: ${err.message || 'Spróbuj ponownie'}`);
    } finally {
      setIsProcessing(false);
      setTimeout(() => {
        setFeedback(null);
        setTranscript('');
      }, 5000);
    }
  };

  // Toggle Microphone (Start -> Record -> User taps again to Stop & Execute)
  const handleToggleMic = () => {
    if (!recognitionRef.current) {
      alert('Rozpoznawanie mowy nie jest obsługiwane w tej przeglądarce.');
      return;
    }

    if (isRecording) {
      // User tapped to stop recording!
      isManuallyStoppedRef.current = true;
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      setIsRecording(false);

      const finalSpeech = transcriptAccumulatorRef.current.trim() || transcript.trim();
      if (finalSpeech) {
        processFinalSpeech(finalSpeech);
      } else {
        setTranscript('');
      }
    } else {
      // User tapped to start recording!
      isManuallyStoppedRef.current = false;
      transcriptAccumulatorRef.current = '';
      setTranscript('');
      setFeedback(null);

      try {
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (err) {
        console.warn('Start recognition retry:', err);
        try {
          recognitionRef.current.stop();
          setTimeout(() => recognitionRef.current?.start(), 150);
          setIsRecording(true);
        } catch {
          setIsRecording(false);
        }
      }
    }
  };

  return (
    <div className="md:hidden fixed bottom-5 right-4 z-40 flex flex-col items-end gap-2 pointer-events-none select-none">
      {/* Live Voice Recording Floating Card / Result Toast */}
      {(isRecording || isProcessing || feedback || transcript) && (
        <div className="pointer-events-auto max-w-[280px] p-3 rounded-2xl bg-[#140f0c]/95 backdrop-blur-xl border border-[#382b20] shadow-2xl space-y-1.5 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs font-medium text-[#f5ede4]">
              {isRecording ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-[#e07a68] animate-ping" />
                  <span className="text-[#e07a68]">Rejestruję mowę...</span>
                </>
              ) : isProcessing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 text-[#d99b5a] animate-spin" />
                  <span className="text-[#d99b5a]">Asystent przetwarza...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-[#7ec29a]" />
                  <span className="text-[#7ec29a]">Asystent JC Studio</span>
                </>
              )}
            </div>

            {isRecording && (
              <span className="text-[10px] text-[#9e8f82] font-mono">
                Kliknij mikrofon aby zakończyć
              </span>
            )}
          </div>

          {/* Spoken transcript or feedback */}
          <div className="text-xs text-[#f5ede4] font-light max-h-24 overflow-y-auto scrollbar-none">
            {transcript ? (
              <span className="italic">„{transcript}”</span>
            ) : isRecording ? (
              <span className="text-[#7a6b5e]">Mów teraz: np. „Fryzjer za tydzień o 15”</span>
            ) : null}
            {feedback && <div className="font-medium text-[#7ec29a] mt-1">{feedback}</div>}
          </div>
        </div>
      )}

      {/* Main Floating Capsule Dock (Menu + Plus + Mic) */}
      <div className="pointer-events-auto flex items-center gap-1.5 p-1.5 rounded-full bg-[#140f0c]/90 backdrop-blur-2xl border border-[#382b20] shadow-[0_10px_35px_rgba(0,0,0,0.8)]">
        {/* Menu / Sidebar Slide-out Trigger */}
        <button
          onClick={onOpenMobileMenu}
          title="Otwórz menu widoków"
          className="w-10 h-10 rounded-full flex items-center justify-center text-[#9e8f82] hover:text-[#f5ede4] hover:bg-[#251b14] active:scale-90 transition-all"
        >
          {VIEW_ICONS[currentView] || <Menu className="w-4 h-4" />}
        </button>

        {/* Divider */}
        <div className="w-[1px] h-5 bg-[#2e231c]" />

        {/* Quick Add (+) Button */}
        <button
          onClick={onQuickAdd}
          title="Dodaj nowe zlecenie"
          className="w-11 h-11 rounded-full bg-[#f5ede4] hover:bg-white text-[#120e0a] flex items-center justify-center shadow-lg active:scale-90 transition-transform"
        >
          <Plus className="w-5 h-5 stroke-[2.5]" />
        </button>

        {/* Divider */}
        <div className="w-[1px] h-5 bg-[#2e231c]" />

        {/* Quick Voice Mic Button (Click to start -> Speak -> Click to stop) */}
        <button
          onClick={handleToggleMic}
          disabled={isProcessing}
          title={isRecording ? 'Zatrzymaj nagrywanie i wykonaj' : 'Kliknij, powiedz polecenie i kliknij ponownie'}
          className={`w-11 h-11 rounded-full flex items-center justify-center transition-all active:scale-90 ${
            isRecording
              ? 'bg-[#e07a68] text-white animate-pulse shadow-[0_0_20px_rgba(224,122,104,0.6)]'
              : 'bg-[#251b14] border border-[#382b20] text-[#d99b5a] hover:text-[#f5ede4] hover:bg-[#2e2016]'
          }`}
        >
          {isProcessing ? (
            <Loader2 className="w-5 h-5 animate-spin text-[#d99b5a]" />
          ) : isRecording ? (
            <Mic className="w-5 h-5 stroke-[2.5]" />
          ) : (
            <Mic className="w-5 h-5" />
          )}
        </button>
      </div>
    </div>
  );
};
