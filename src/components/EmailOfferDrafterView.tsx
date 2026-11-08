import React, { useState, useEffect, useRef } from 'react';
import { draftEmailWithOpenAI, type DraftEmailResult } from '../lib/ai';
import { sendCustomEmail } from '../lib/email';
import {
  Sparkles,
  Send,
  Copy,
  Check,
  Mic,
  MicOff,
  RefreshCw,
  Mail,
  FileText,
  DollarSign,
  Layers,
  Clock,
  History,
  Trash2,
  AlertCircle,
  MessageSquare,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface SavedDraft {
  id: string;
  date: string;
  presetTitle: string;
  subject: string;
  body: string;
}

const PRESETS = [
  {
    id: 'oferta_3d',
    title: 'Wycena & Oferta 3D',
    desc: 'Kompleksowa oferta: zakres, ujęcia, wycena w zł, terminy i poprawek',
    icon: DollarSign,
    color: 'from-blue-600 to-indigo-600',
    defaultPrompt: 'Wycena wizualizacji salonu z kuchnią za 2600 zł netto, 4 ujęcia 4K, czas realizacji 4 dni robocze, 2 tury poprawek w cenie, potrzebuję rzutów DWG.',
  },
  {
    id: 'szybka_odpowiedz',
    title: 'Szybka odpowiedź',
    desc: 'Konkretna, uprzejma informacja o dostępności lub potwierdzenie',
    icon: Clock,
    color: 'from-amber-600 to-orange-600',
    defaultPrompt: 'Mam wolny termin od przyszłego poniedziałku, chętnie zrealizuję zlecenie. Proszę o przesłanie szczegółów.',
  },
  {
    id: 'prosba_o_materialy',
    title: 'Prośba o rzuty i CAD',
    desc: 'Dyplomatyczne dopytanie o pliki DWG, modele mebli i wytyczne',
    icon: Layers,
    color: 'from-purple-600 to-pink-600',
    defaultPrompt: 'Aby rozpocząć pracę i przygotować dokładną wycenę, potrzebuję rzutów w formacie DWG/PDF oraz moodboardu lub zdjęć inspiracji.',
  },
  {
    id: 'wyslanie_renderow',
    title: 'Rendery do akceptacji',
    desc: 'Przesłanie plików poglądowych z prośbą o uwagi lub zatwierdzenie',
    icon: FileText,
    color: 'from-emerald-600 to-teal-600',
    defaultPrompt: 'Przesyłam w załączniku/linku ujęcia próbne do wglądu. Proszę o informację czy oświetlenie i kadry odpowiadają wytycznym.',
  },
  {
    id: 'monit_faktura',
    title: 'Monit o płatność',
    desc: 'Uprzejme przypomnienie o fakturze i terminie płatności',
    icon: Mail,
    color: 'from-rose-600 to-red-600',
    defaultPrompt: 'Przypomnienie o fakturze FV/12/2026 wystawionej w zeszłym tygodniu za wizualizacje wnętrz, termin minął 2 dni temu.',
  },
];

interface EmailOfferDrafterViewProps {
  apiKey: string;
}

export const EmailOfferDrafterView: React.FC<EmailOfferDrafterViewProps> = ({ apiKey }) => {
  const [selectedPreset, setSelectedPreset] = useState<string>('oferta_3d');
  const [clientMessage, setClientMessage] = useState<string>('');
  const [myNotes, setMyNotes] = useState<string>(PRESETS[0].defaultPrompt);
  const [tone, setTone] = useState<'professional' | 'friendly' | 'concise'>('professional');
  const [includeRevisions, setIncludeRevisions] = useState<boolean>(true);
  const [includeVat, setIncludeVat] = useState<boolean>(true);
  const [senderSignature, setSenderSignature] = useState<string>('Jakub Cieślik | JC Studio');

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [result, setResult] = useState<DraftEmailResult | null>(null);
  const [editedBody, setEditedBody] = useState<string>('');
  const [editedSubject, setEditedSubject] = useState<string>('');
  const [copiedSubject, setCopiedSubject] = useState<boolean>(false);
  const [copiedBody, setCopiedBody] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Direct send via Resend state
  const [recipientEmail, setRecipientEmail] = useState<string>('');
  const [isSendingViaResend, setIsSendingViaResend] = useState<boolean>(false);
  const [resendStatus, setResendStatus] = useState<{ success: boolean; msg: string } | null>(null);

  // Voice recording state for myNotes
  const [isListening, setIsListening] = useState<boolean>(false);
  const recognitionRef = useRef<any>(null);

  // History of generated drafts
  const [history, setHistory] = useState<SavedDraft[]>(() => {
    try {
      const saved = localStorage.getItem('taskhub_saved_offers');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('taskhub_saved_offers', JSON.stringify(history));
  }, [history]);

  // Speech Recognition for Notes
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
          setMyNotes((prev) => (prev ? `${prev} ${transcript}` : transcript));
        }
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) {
      alert('Rozpoznawanie mowy nie jest wspierane w tej przeglądarce.');
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        recognitionRef.current.start();
      } catch {
        recognitionRef.current.stop();
      }
    }
  };

  const handleSelectPreset = (presetId: string) => {
    setSelectedPreset(presetId);
    const p = PRESETS.find((pr) => pr.id === presetId);
    if (p && (!myNotes || PRESETS.some((other) => other.defaultPrompt === myNotes))) {
      setMyNotes(p.defaultPrompt);
    }
  };

  // Generate Email
  const handleGenerate = async (adjustmentInstruction?: string) => {
    if (!myNotes.trim() && !clientMessage.trim()) {
      setError('Wpisz swoje wytyczne lub wklej wiadomość od klienta.');
      return;
    }

    if (!apiKey.trim()) {
      setError('Brak klucza OpenAI API. Uzupełnij go w górnym pasku asystenta (ikona klucza 🔑).');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResendStatus(null);

    try {
      const draft = await draftEmailWithOpenAI(
        {
          preset: selectedPreset,
          clientMessage: clientMessage.trim() || undefined,
          myNotes: myNotes.trim(),
          tone,
          includeRevisions,
          includeVat,
          senderSignature,
          adjustmentInstruction,
        },
        apiKey.trim()
      );

      setResult(draft);
      setEditedSubject(draft.subject);
      setEditedBody(draft.body);

      // Add to history
      const newDraftItem: SavedDraft = {
        id: Date.now().toString(),
        date: new Date().toLocaleString('pl-PL', { dateStyle: 'short', timeStyle: 'short' }),
        presetTitle: PRESETS.find((p) => p.id === selectedPreset)?.title || 'Oferta',
        subject: draft.subject,
        body: draft.body,
      };
      setHistory((prev) => [newDraftItem, ...prev.slice(0, 19)]); // keep last 20

      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#6366f1', '#a855f7', '#10b981'],
      });
    } catch (err: any) {
      setError(err?.message || 'Wystąpił błąd podczas generowania wiadomości.');
    } finally {
      setIsLoading(false);
    }
  };

  // Copy Handlers
  const handleCopySubject = () => {
    if (!editedSubject) return;
    navigator.clipboard.writeText(editedSubject);
    setCopiedSubject(true);
    setTimeout(() => setCopiedSubject(false), 2000);
  };

  const handleCopyBody = () => {
    if (!editedBody) return;
    navigator.clipboard.writeText(editedBody);
    setCopiedBody(true);
    setTimeout(() => setCopiedBody(false), 2000);
  };

  // Direct Send via Resend
  const handleSendViaResend = async () => {
    if (!recipientEmail.trim() || !recipientEmail.includes('@')) {
      alert('Podaj poprawny adres e-mail klienta.');
      return;
    }

    setIsSendingViaResend(true);
    setResendStatus(null);

    // Format body as HTML paragraphs
    const formattedHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 15px; line-height: 1.6; color: #1e293b; max-width: 600px; padding: 10px;">
        ${editedBody.split('\n\n').map((p) => `<p style="margin-bottom: 14px;">${p.replace(/\n/g, '<br/>')}</p>`).join('')}
      </div>
    `;

    try {
      const res = await sendCustomEmail({
        to: recipientEmail,
        subject: editedSubject,
        html: formattedHtml,
      });

      if (res.success) {
        setResendStatus({ success: true, msg: `Wiadomość została wysłana do: ${recipientEmail}!` });
      } else {
        setResendStatus({ success: false, msg: res.error || 'Błąd wysyłki e-mail.' });
      }
    } catch (e: any) {
      setResendStatus({ success: false, msg: e.message || 'Nie udało się wysłać.' });
    } finally {
      setIsSendingViaResend(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-3xl glass-panel border border-[#2b211a] p-6 sm:p-7 shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#d99b5a]/15 text-[#f1c38e] border border-[#d99b5a]/30 mb-2.5">
              <Sparkles className="w-3.5 h-3.5 text-[#d99b5a]" />
              <span>Asystent Komunikacji Biznesowej JC Studio</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-light text-[#f5ede4] tracking-tight">
              Generator Ofert & Profesjonalnych Odpowiedzi E-mail
            </h2>
            <p className="text-xs sm:text-sm text-[#9e8f82] mt-1 max-w-xl font-light">
              Wklej zapytanie klienta lub podaj kilka słów wytycznych, a sztuczna inteligencja przygotuje elegancką ofertę z wyceną 3D, warunkami i terminem.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="px-3 py-1.5 rounded-full bg-[#140f0c] border border-[#2e231c] text-[#7ec29a] flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-[#7ec29a]" />
              Koszt: ułamek grosza za maila
            </span>
          </div>
        </div>
      </div>

      {/* Preset Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {PRESETS.map((preset) => {
          const Icon = preset.icon;
          const isSelected = selectedPreset === preset.id;
          return (
            <button
              key={preset.id}
              onClick={() => handleSelectPreset(preset.id)}
              className={`p-3.5 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                isSelected
                  ? 'bg-[#251b14] border-[#d99b5a] shadow-lg ring-1 ring-[#d99b5a]'
                  : 'glass-panel border-[#2b211a] hover:border-[#382b20] hover:bg-[#1a130f] text-[#9e8f82]'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-7 h-7 rounded-xl bg-[#1e1713] border border-[#2e231c] flex items-center justify-center text-[#d99b5a] shadow-md"
                >
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <span className={`text-xs font-medium ${isSelected ? 'text-[#f5ede4]' : 'text-[#c4b5a5]'}`}>
                  {preset.title}
                </span>
              </div>
              <p className="text-[11px] text-[#7a6b5e] line-clamp-2 leading-relaxed">
                {preset.desc}
              </p>
            </button>
          );
        })}
      </div>

      {/* Main Grid: Inputs vs Output */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Inputs Form (6 cols) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="glass-panel border border-[#2b211a] rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
            {/* Input 1: Client Message (optional) */}
            <div>
              <label className="block text-xs font-medium text-[#c4b5a5] mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-[#d99b5a]" />
                  Wiadomość / Zapytanie od klienta (opcjonalne)
                </span>
                <span className="text-[10px] text-[#7a6b5e] font-normal">Wklej e-mail, treść z OLX lub DM</span>
              </label>
              <textarea
                rows={3}
                placeholder="Np. 'Dzień dobry, szukam kogoś do wykonania wizualizacji salonu z kuchnią 35m2 w Warszawie. Ile by to kosztowało i jaki czas?'"
                value={clientMessage}
                onChange={(e) => setClientMessage(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-[#140f0c] border border-[#2e231c] text-[#f5ede4] placeholder-[#7a6b5e] text-xs focus:outline-none focus:border-[#d99b5a] resize-none"
              />
            </div>

            {/* Input 2: My Notes / Guidelines (with voice mic) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-[#c4b5a5] flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-[#7ec29a]" />
                  Twoje wytyczne do oferty (cena, termin, warunki)
                </label>
                <button
                  type="button"
                  onClick={toggleVoiceInput}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1 transition-all ${
                    isListening
                      ? 'bg-[#e07a68] text-white animate-pulse'
                      : 'bg-[#140f0c] hover:bg-[#1f1712] text-[#d99b5a] border border-[#2e231c]'
                  }`}
                  title="Dyktuj wytyczne przez mikrofon"
                >
                  {isListening ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
                  <span>{isListening ? 'Słucham...' : 'Dyktuj głosem'}</span>
                </button>
              </div>

              <textarea
                rows={4}
                placeholder="Np. Cena 2500 zł netto, termin realizacji 4 dni robocze, 2 tury poprawek w cenie, potrzebuję rzutów w DWG/PDF i listy mebli..."
                value={myNotes}
                onChange={(e) => setMyNotes(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-[#140f0c] border border-[#2e231c] text-[#f5ede4] placeholder-[#7a6b5e] text-xs focus:outline-none focus:border-[#d99b5a] resize-none font-mono"
              />
            </div>

            {/* Quick Option Toggles */}
            <div className="pt-2 border-t border-[#2e231c] space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                {/* Tone Selector */}
                <div>
                  <label className="block text-[11px] font-medium text-[#9e8f82] mb-1">
                    Ton wypowiedzi
                  </label>
                  <div className="flex items-center gap-1 bg-[#140f0c] p-1 rounded-xl border border-[#2e231c] text-xs">
                    {[
                      { id: 'professional', label: 'Elegancki' },
                      { id: 'friendly', label: 'Partnerski' },
                      { id: 'concise', label: 'Krótki' },
                    ].map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setTone(t.id as any)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                          tone === t.id
                            ? 'bg-[#f5ede4] text-[#120e0a] font-semibold shadow-sm'
                            : 'text-[#9e8f82] hover:text-[#f5ede4]'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sender Signature */}
                <div className="flex-1 min-w-[180px]">
                  <label className="block text-[11px] font-medium text-[#9e8f82] mb-1">
                    Podpis w mailu
                  </label>
                  <input
                    type="text"
                    value={senderSignature}
                    onChange={(e) => setSenderSignature(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl bg-[#140f0c] border border-[#2e231c] text-[#f5ede4] text-xs focus:outline-none focus:border-[#d99b5a]"
                  />
                </div>
              </div>

              {/* Checkboxes: Revisions & VAT */}
              <div className="flex flex-wrap items-center gap-4 pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-[#c4b5a5]">
                  <input
                    type="checkbox"
                    checked={includeRevisions}
                    onChange={(e) => setIncludeRevisions(e.target.checked)}
                    className="w-4 h-4 rounded text-[#d99b5a] focus:ring-0 bg-[#140f0c] border-[#2e231c] cursor-pointer accent-[#d99b5a]"
                  />
                  <span>Zawrzyj informację: <strong className="text-[#f5ede4]">2 tury poprawek w cenie</strong></span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs text-[#c4b5a5]">
                  <input
                    type="checkbox"
                    checked={includeVat}
                    onChange={(e) => setIncludeVat(e.target.checked)}
                    className="w-4 h-4 rounded text-[#d99b5a] focus:ring-0 bg-[#140f0c] border-[#2e231c] cursor-pointer accent-[#d99b5a]"
                  />
                  <span>Zaznacz: <strong className="text-[#f5ede4]">Kwoty netto (Faktura VAT)</strong></span>
                </label>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-[#e07a68]/10 border border-[#e07a68]/30 rounded-xl text-xs text-[#e07a68] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Generate Action Button */}
            <button
              onClick={() => handleGenerate()}
              disabled={isLoading}
              className="w-full py-3.5 rounded-2xl bg-[#f5ede4] hover:bg-white disabled:opacity-50 text-[#120e0a] text-sm font-semibold shadow-xl flex items-center justify-center gap-2 transition-all active:scale-98"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-[#120e0a]" />
                  <span>Tworzenie profesjonalnej odpowiedzi...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-[#120e0a]" />
                  <span>Wygeneruj eleganckiego maila AI</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Generated Output & Quick Edits (6 cols) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="glass-panel border border-[#2b211a] rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col justify-between min-h-[500px]">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-[#2e231c] mb-3">
                <span className="text-xs font-medium text-[#f5ede4] flex items-center gap-1.5">
                  <Mail className="w-4 h-4 text-[#d99b5a]" />
                  Gotowa treść wiadomości
                </span>
                {result && (
                  <span className="text-[11px] font-medium text-[#7ec29a] bg-[#7ec29a]/10 px-2 py-0.5 rounded-full border border-[#7ec29a]/20">
                    ✓ Wygenerowano
                  </span>
                )}
              </div>

              {result ? (
                <div className="space-y-3">
                  {/* Subject Row */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-medium text-[#9e8f82]">Temat wiadomości:</span>
                      <button
                        onClick={handleCopySubject}
                        className="text-[11px] text-[#d99b5a] hover:text-[#f1c38e] flex items-center gap-1 font-medium transition-colors"
                      >
                        {copiedSubject ? <Check className="w-3 h-3 text-[#7ec29a]" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedSubject ? 'Skopiowano temat!' : 'Kopiuj temat'}</span>
                      </button>
                    </div>
                    <input
                      type="text"
                      value={editedSubject}
                      onChange={(e) => setEditedSubject(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#140f0c] border border-[#2e231c] text-[#f5ede4] font-medium text-xs focus:outline-none focus:border-[#d99b5a]"
                    />
                  </div>

                  {/* Body Editor */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-medium text-[#9e8f82]">Treść e-maila:</span>
                      <button
                        onClick={handleCopyBody}
                        className="text-[11px] text-[#d99b5a] hover:text-[#f1c38e] flex items-center gap-1 font-medium transition-colors"
                      >
                        {copiedBody ? <Check className="w-3 h-3 text-[#7ec29a]" /> : <Copy className="w-3 h-3 text-[#d99b5a]" />}
                        <span>{copiedBody ? 'Skopiowano treść!' : 'Kopiuj całość'}</span>
                      </button>
                    </div>
                    <textarea
                      rows={14}
                      value={editedBody}
                      onChange={(e) => setEditedBody(e.target.value)}
                      className="w-full px-3.5 py-3 rounded-2xl bg-[#140f0c] border border-[#2e231c] text-[#f5ede4] text-xs sm:text-sm leading-relaxed focus:outline-none focus:border-[#d99b5a] font-sans resize-y"
                    />
                  </div>

                  {/* Quick Polish Refinements */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[11px] text-[#7a6b5e] mr-1">Szybkie poprawki:</span>
                    <button
                      onClick={() => handleGenerate('Skróć treść o połowę, pozostawiając tylko kluczowe punkty wyceny i termin')}
                      disabled={isLoading}
                      className="px-2.5 py-1 rounded-lg bg-[#1e1713] hover:bg-[#251b14] text-[#c4b5a5] text-[11px] border border-[#2e231c] transition-colors"
                    >
                      🤏 Skróć o połowę
                    </button>
                    <button
                      onClick={() => handleGenerate('Dodaj punkt informujący o zaliczce 30% przed rozpoczęciem prac')}
                      disabled={isLoading}
                      className="px-2.5 py-1 rounded-lg bg-[#1e1713] hover:bg-[#251b14] text-[#c4b5a5] text-[11px] border border-[#2e231c] transition-colors"
                    >
                      💰 Dodaj zaliczkę 30%
                    </button>
                    <button
                      onClick={() => handleGenerate('Uczyń ton jeszcze bardziej formalnym i ekskluzywnym')}
                      disabled={isLoading}
                      className="px-2.5 py-1 rounded-lg bg-[#1e1713] hover:bg-[#251b14] text-[#c4b5a5] text-[11px] border border-[#2e231c] transition-colors"
                    >
                      👔 Bardziej formalnie
                    </button>
                  </div>
                </div>
              ) : (
                <div className="h-64 flex flex-col items-center justify-center text-center p-6 border border-dashed border-[#2e231c] rounded-2xl">
                  <div className="w-12 h-12 rounded-2xl bg-[#140f0c] border border-[#2e231c] flex items-center justify-center text-[#d99b5a] mb-3 shadow-inner">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-medium text-[#f5ede4] mb-1">
                    Gotowy mail pojawi się w tym miejscu
                  </h4>
                  <p className="text-xs text-[#7a6b5e] max-w-xs">
                    Wybierz szablon, wpisz swoje punkty po lewej i kliknij <em>"Wygeneruj eleganckiego maila AI"</em>.
                  </p>
                </div>
              )}
            </div>

            {/* Direct Send via Resend Footer */}
            {result && (
              <div className="pt-4 border-t border-[#2e231c] mt-4 space-y-2">
                <div className="flex flex-col sm:flex-row items-center gap-2">
                  <div className="relative flex-1 w-full">
                    <input
                      type="email"
                      placeholder="Wpisz e-mail klienta (np. klient@firma.pl)..."
                      value={recipientEmail}
                      onChange={(e) => setRecipientEmail(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-[#140f0c] border border-[#2e231c] text-[#f5ede4] placeholder-[#7a6b5e] text-xs focus:outline-none focus:border-[#d99b5a]"
                    />
                  </div>
                  <button
                    onClick={handleSendViaResend}
                    disabled={isSendingViaResend || !recipientEmail.trim()}
                    className="w-full sm:w-auto px-4 py-2 rounded-xl bg-[#7ec29a] hover:bg-[#9ee2b9] disabled:opacity-40 text-[#120e0a] text-xs font-semibold shadow-md flex items-center justify-center gap-1.5 transition-all"
                  >
                    {isSendingViaResend ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                    <span>Wyślij przez TaskHub</span>
                  </button>
                </div>

                {resendStatus && (
                  <div
                    className={`p-2.5 rounded-xl border text-xs flex items-center gap-2 ${
                      resendStatus.success
                        ? 'bg-[#7ec29a]/10 border-[#7ec29a]/30 text-[#7ec29a]'
                        : 'bg-[#e07a68]/10 border-[#e07a68]/30 text-[#e07a68]'
                    }`}
                  >
                    {resendStatus.success ? (
                      <Check className="w-3.5 h-3.5 text-[#7ec29a]" />
                    ) : (
                      <AlertCircle className="w-3.5 h-3.5 text-[#e07a68]" />
                    )}
                    <span>{resendStatus.msg}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* History of Recent Drafts */}
      {history.length > 0 && (
        <div className="glass-panel border border-[#2b211a] rounded-3xl p-5 shadow-lg">
          <div className="flex items-center justify-between pb-3 border-b border-[#2e231c] mb-3">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-[#d99b5a]" />
              <span className="text-xs font-medium text-[#f5ede4] uppercase tracking-wider">
                Ostatnio wygenerowane oferty ({history.length})
              </span>
            </div>
            <button
              onClick={() => setHistory([])}
              className="text-xs text-[#7a6b5e] hover:text-[#e07a68] flex items-center gap-1 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Wyczyść historię</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {history.slice(0, 6).map((draft) => (
              <div
                key={draft.id}
                onClick={() => {
                  setEditedSubject(draft.subject);
                  setEditedBody(draft.body);
                  setResult({ subject: draft.subject, body: draft.body });
                }}
                className="p-3.5 rounded-2xl bg-[#140f0c] border border-[#2e231c] hover:border-[#d99b5a]/40 cursor-pointer transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-[11px] text-[#7a6b5e] mb-1">
                    <span className="font-medium text-[#d99b5a]">{draft.presetTitle}</span>
                    <span>{draft.date}</span>
                  </div>
                  <h5 className="text-xs font-medium text-[#f5ede4] group-hover:text-[#f1c38e] transition-colors truncate">
                    {draft.subject}
                  </h5>
                  <p className="text-[11px] text-[#9e8f82] line-clamp-3 mt-1 leading-relaxed">
                    {draft.body}
                  </p>
                </div>
                <div className="mt-2 pt-2 border-t border-[#2e231c] flex items-center justify-end text-[10px] text-[#d99b5a] font-medium group-hover:translate-x-0.5 transition-transform">
                  Wczytaj ofertę →
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
