import React, { useState, useEffect, useRef } from 'react';
import {
  generateContractWithOpenAI,
  type GenerateContractParams,
  type GenerateContractResult,
} from '../lib/ai';
import {
  FileText,
  Sparkles,
  Copy,
  Check,
  Printer,
  Download,
  Mic,
  MicOff,
  History,
  Trash2,
  AlertCircle,
  Clock,
  ShieldCheck,
  Edit3,
  Building2,
  User,
  DollarSign,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface SavedContract {
  id: string;
  date: string;
  title: string;
  contractNumber: string;
  clientName: string;
  price: string;
  contractText: string;
}

interface ContractPreset {
  id: string;
  name: string;
  type: GenerateContractParams['contractType'];
  defaultScope: string;
  defaultDeadline: string;
  defaultPrice: string;
  defaultPaymentTerms: string;
}

const CONTRACT_PRESETS: ContractPreset[] = [
  {
    id: 'interior_3d',
    name: 'Wizualizacje Wnętrz 3D',
    type: 'dzielo_prawa',
    defaultScope:
      'Wykonanie fotorealistycznych wizualizacji 3D wnętrz: 6 ujęć w rozdzielczości 4K (strefa dzienna, kuchnia, sypialnia, łazienka) na podstawie dostarczonych przez Zamawiającego rzutów DWG, modeli mebli oraz wytycznych materiałowych.',
    defaultDeadline: '10 dni roboczych od momentu dostarczenia kompletnych materiałów wyjściowych oraz wpłaty zadatku.',
    defaultPrice: '3 600 zł netto (+ 23% VAT)',
    defaultPaymentTerms:
      'Płatność w 2 transzach: 30% zadatku przed rozpoczęciem prac, 70% po akceptacji ujęć poglądowych przed przekazaniem plików końcowych w pełnej rozdzielczości.',
  },
  {
    id: 'architecture_3d',
    name: 'Architektura & Elewacje 3D',
    type: 'wizualizacje_3d',
    defaultScope:
      'Wykonanie wizualizacji zewnętrznych budynku jednorodzinnego: 4 ujęcia 4K (2 ujęcia dzienne, 1 ujęcie zmierzchowe, 1 detal architektoniczny wraz z zagospodarowaniem terenu i zielenią).',
    defaultDeadline: '12 dni roboczych od akceptacji bryły 3D i terenu.',
    defaultPrice: '4 200 zł netto (+ 23% VAT)',
    defaultPaymentTerms:
      'Płatność w 2 transzach: 30% zadatek, 70% po ostatecznej akceptacji renderów.',
  },
  {
    id: 'b2b_generic',
    name: 'Umowa B2B (Faktura VAT)',
    type: 'b2b_uslugi',
    defaultScope:
      'Świadczenie usług graficznych i modelowania 3D zgodnie ze szczegółowym zleceniem przekazanym drogą elektroniczną, przygotowanie pakietu materiałów promocyjnych do druku i internetu.',
    defaultDeadline: '14 dni roboczych od daty zawarcia umowy.',
    defaultPrice: '5 000 zł netto (+ 23% VAT)',
    defaultPaymentTerms:
      'Faktura VAT z 7-dniowym terminem płatności wystawiona po odbiorze końcowym dzieła.',
  },
];

interface ContractGeneratorViewProps {
  apiKey: string;
}

export const ContractGeneratorView: React.FC<ContractGeneratorViewProps> = ({ apiKey }) => {
  const [selectedPresetId, setSelectedPresetId] = useState<string>('interior_3d');

  // Contract form parameters
  const [contractType, setContractType] = useState<GenerateContractParams['contractType']>('dzielo_prawa');
  const [contractTitle, setContractTitle] = useState('Wizualizacje 3D wnętrz');
  const [scope, setScope] = useState(CONTRACT_PRESETS[0].defaultScope);
  const [deadline, setDeadline] = useState(CONTRACT_PRESETS[0].defaultDeadline);
  const [price, setPrice] = useState(CONTRACT_PRESETS[0].defaultPrice);
  const [paymentTerms, setPaymentTerms] = useState(CONTRACT_PRESETS[0].defaultPaymentTerms);

  const [includeInitialPreviews, setIncludeInitialPreviews] = useState(true);
  const [revisionsCount, setRevisionsCount] = useState(2);
  const [includeCopyrightTransfer, setIncludeCopyrightTransfer] = useState(true);
  const [includePortfolioClause, setIncludePortfolioClause] = useState(true);

  // Client info
  const [clientName, setClientName] = useState('');
  const [clientDetails, setClientDetails] = useState('');

  // Contractor info (stored in localStorage)
  const [contractorName, setContractorName] = useState(() => {
    return localStorage.getItem('taskhub_contractor_name') || 'Jakub Cieślik - JC Studio';
  });
  const [contractorDetails, setContractorDetails] = useState(() => {
    return (
      localStorage.getItem('taskhub_contractor_details') ||
      'NIP: [Twój NIP], ul. [Twój Adres], 30-001 Kraków, e-mail: jakub@jcstudio.pl'
    );
  });
  const [city, setCity] = useState('Kraków');

  // Generation state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedContract, setGeneratedContract] = useState<GenerateContractResult | null>(null);
  const [editedText, setEditedText] = useState('');
  const [isEditingManually, setIsEditingManually] = useState(false);

  // Copy & Action toasts
  const [copied, setCopied] = useState(false);

  // Voice recording for scope
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  // History of generated contracts
  const [history, setHistory] = useState<SavedContract[]>(() => {
    try {
      const saved = localStorage.getItem('taskhub_saved_contracts');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('taskhub_saved_contracts', JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    localStorage.setItem('taskhub_contractor_name', contractorName);
  }, [contractorName]);

  useEffect(() => {
    localStorage.setItem('taskhub_contractor_details', contractorDetails);
  }, [contractorDetails]);

  // Speech Recognition setup
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
          setScope((prev) => (prev ? `${prev} ${transcript}` : transcript));
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

  const handleSelectPreset = (preset: ContractPreset) => {
    setSelectedPresetId(preset.id);
    setContractType(preset.type);
    setContractTitle(preset.name);
    setScope(preset.defaultScope);
    setDeadline(preset.defaultDeadline);
    setPrice(preset.defaultPrice);
    setPaymentTerms(preset.defaultPaymentTerms);
  };

  const handleGenerate = async () => {
    if (!scope.trim()) {
      setError('Wprowadź zakres prac (przedmiot umowy).');
      return;
    }
    if (!price.trim()) {
      setError('Wprowadź kwotę wynagrodzenia.');
      return;
    }
    if (!apiKey.trim()) {
      setError('Brak klucza OpenAI API. Uzupełnij go w ustawieniach asystenta (ikona klucza 🔑).');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await generateContractWithOpenAI(
        {
          contractType,
          contractTitle,
          scope: scope.trim(),
          deadline: deadline.trim(),
          price: price.trim(),
          paymentTerms: paymentTerms.trim(),
          includeInitialPreviewsClause: includeInitialPreviews,
          revisionsCount,
          includeCopyrightTransfer,
          includePortfolioClause,
          clientName: clientName.trim() || undefined,
          clientDetails: clientDetails.trim() || undefined,
          contractorName: contractorName.trim() || undefined,
          contractorDetails: contractorDetails.trim() || undefined,
          city: city.trim() || 'Kraków',
          date: new Date().toLocaleDateString('pl-PL'),
        },
        apiKey.trim()
      );

      setGeneratedContract(result);
      setEditedText(result.contractText);
      setIsEditingManually(false);

      // Save to history
      const newSavedItem: SavedContract = {
        id: Date.now().toString(),
        date: new Date().toLocaleString('pl-PL', { dateStyle: 'short', timeStyle: 'short' }),
        title: result.title,
        contractNumber: result.contractNumber,
        clientName: clientName.trim() || 'Klient',
        price: price.trim(),
        contractText: result.contractText,
      };
      setHistory((prev) => [newSavedItem, ...prev.slice(0, 19)]);

      confetti({
        particleCount: 55,
        spread: 65,
        origin: { y: 0.7 },
        colors: ['#d99b5a', '#7ec29a', '#f5ede4'],
      });
    } catch (err: any) {
      setError(err?.message || 'Wystąpił błąd podczas generowania umowy.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    const textToCopy = isEditingManually ? editedText : (generatedContract?.contractText || '');
    if (!textToCopy) return;

    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadDoc = () => {
    const text = isEditingManually ? editedText : (generatedContract?.contractText || '');
    if (!text) return;

    const element = document.createElement('a');
    const file = new Blob([text], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = `${(generatedContract?.contractNumber || 'umowa').replace(/\//g, '_')}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleLoadFromHistory = (item: SavedContract) => {
    setGeneratedContract({
      title: item.title,
      contractNumber: item.contractNumber,
      contractText: item.contractText,
      summary: `Załadowano umowę ${item.contractNumber} dla ${item.clientName}`,
      keyPoints: [item.price],
    });
    setEditedText(item.contractText);
    setIsEditingManually(false);
  };

  const handleDeleteHistory = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setHistory((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Nagłówek modułu umów */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#2e231c]">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider bg-[#d99b5a]/15 text-[#f1c38e] border border-[#d99b5a]/30 flex items-center gap-1.5">
              <FileText className="w-3 h-3 text-[#d99b5a]" />
              Generator Umów AI
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-light text-[#f5ede4] mt-1">
            Sporządź profesjonalną umowę z klientem
          </h2>
          <p className="text-xs text-[#9e8f82] mt-0.5">
            Podaj podstawowe wytyczne (zakres, termin, cenę), a sztuczna inteligencja przygotuje kompletny, prawnie zabezpieczony dokument z przeniesieniem praw autorskich.
          </p>
        </div>

        {/* Szybkie presety */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-[#140f0c] border border-[#2e231c] text-xs flex-wrap self-start sm:self-center">
          {CONTRACT_PRESETS.map((p) => (
            <button
              key={p.id}
              onClick={() => handleSelectPreset(p)}
              className={`px-3 py-1.5 rounded-xl font-mono text-[11px] transition-all ${
                selectedPresetId === p.id
                  ? 'bg-[#d99b5a] text-[#120e0a] font-semibold shadow-md'
                  : 'text-[#9e8f82] hover:text-[#f5ede4] hover:bg-[#251b14]'
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-2xl bg-[#2a1310] border border-[#e07a68]/40 text-[#f87171] text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Główny układ: Formularz parametrów (Lewa) vs Podgląd umowy (Prawa) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEWA KOLUMNA: FORMULARZ PARAMETRÓW */}
        <div className="lg:col-span-5 space-y-4">
          <div className="glass-panel p-5 rounded-3xl border border-[#2e231c] space-y-4">
            <h3 className="text-xs font-mono uppercase tracking-wider text-[#d99b5a] flex items-center gap-1.5 pb-2 border-b border-[#2e231c]">
              <Edit3 className="w-3.5 h-3.5" />
              1. Parametry zlecenia i warunki
            </h3>

            {/* Typ umowy */}
            <div>
              <label className="block text-xs font-mono uppercase text-[#9e8f82] mb-1">
                Typ umowy *
              </label>
              <select
                value={contractType}
                onChange={(e) => setContractType(e.target.value as any)}
                className="w-full bg-[#120e0a] border border-[#382b20] focus:border-[#d99b5a] text-[#f5ede4] text-xs rounded-xl px-3 py-2 outline-none cursor-pointer"
              >
                <option value="dzielo_prawa" className="bg-[#140f0c]">
                  Umowa o dzieło z przeniesieniem praw autorskich
                </option>
                <option value="wizualizacje_3d" className="bg-[#140f0c]">
                  Umowa o wykonanie wizualizacji 3D
                </option>
                <option value="b2b_uslugi" className="bg-[#140f0c]">
                  Umowa B2B / świadczenie usług (faktura VAT)
                </option>
              </select>
            </div>

            {/* Zakres prac */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-mono uppercase text-[#9e8f82]">
                  Zakres prac (Przedmiot umowy) *
                </label>
                <button
                  type="button"
                  onClick={toggleVoiceInput}
                  className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-lg border transition-all ${
                    isListening
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 animate-pulse'
                      : 'bg-[#1e1713] text-[#d99b5a] border-[#382b20] hover:border-[#d99b5a]'
                  }`}
                  title="Podyktuj zakres prac głosem"
                >
                  {isListening ? <MicOff className="w-3 h-3 text-rose-400" /> : <Mic className="w-3 h-3" />}
                  <span>{isListening ? 'Nagrywam...' : 'Podyktuj'}</span>
                </button>
              </div>
              <textarea
                rows={4}
                value={scope}
                onChange={(e) => setScope(e.target.value)}
                placeholder="np. Wykonanie 6 ujęć fotorealistycznych wnętrz domu 4K na podstawie rzutów DWG..."
                className="w-full bg-[#120e0a] border border-[#382b20] focus:border-[#d99b5a] rounded-xl p-3 text-xs text-[#f5ede4] outline-none leading-relaxed resize-y"
              />
            </div>

            {/* Cena i Termin */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-mono uppercase text-[#7ec29a] mb-1 flex items-center gap-1">
                  <DollarSign className="w-3 h-3" />
                  Wynagrodzenie *
                </label>
                <input
                  type="text"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="np. 3 600 zł netto"
                  className="w-full bg-[#120e0a] border border-[#382b20] focus:border-[#7ec29a] rounded-xl px-3 py-2 text-xs text-[#f5ede4] outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-[#f1c38e] mb-1 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Termin realizacji *
                </label>
                <input
                  type="text"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  placeholder="np. 10 dni roboczych"
                  className="w-full bg-[#120e0a] border border-[#382b20] focus:border-[#d99b5a] rounded-xl px-3 py-2 text-xs text-[#f5ede4] outline-none font-mono"
                />
              </div>
            </div>

            {/* Warunki płatności */}
            <div>
              <label className="block text-xs font-mono uppercase text-[#9e8f82] mb-1">
                Warunki płatności (zadatek / transze)
              </label>
              <input
                type="text"
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                placeholder="np. 30% zadatku przed startem, 70% po akceptacji"
                className="w-full bg-[#120e0a] border border-[#382b20] focus:border-[#d99b5a] rounded-xl px-3 py-2 text-xs text-[#f5ede4] outline-none"
              />
            </div>

            {/* Klauzule ochronne */}
            <div className="space-y-2 pt-2 border-t border-[#2e231c]/60 text-xs text-[#c4b5a5]">
              <label className="flex items-start gap-2.5 cursor-pointer hover:text-[#f5ede4] select-none">
                <input
                  type="checkbox"
                  checked={includeInitialPreviews}
                  onChange={(e) => setIncludeInitialPreviews(e.target.checked)}
                  className="rounded border-[#382b20] text-[#d99b5a] mt-0.5 focus:ring-0 cursor-pointer accent-[#d99b5a]"
                />
                <span>
                  <strong>Etap ujęć wstępnych:</strong> przekazanie próbnych kadrów/brył po pierwszych 3-4 dniach roboczych
                </span>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer hover:text-[#f5ede4] select-none">
                <input
                  type="checkbox"
                  checked={includeCopyrightTransfer}
                  onChange={(e) => setIncludeCopyrightTransfer(e.target.checked)}
                  className="rounded border-[#382b20] text-[#7ec29a] mt-0.5 focus:ring-0 cursor-pointer accent-[#7ec29a]"
                />
                <span>
                  <strong>Ochrona praw autorskich:</strong> prawa przechodzą na klienta <em>dopiero po opłaceniu 100% wynagrodzenia</em>
                </span>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer hover:text-[#f5ede4] select-none">
                <input
                  type="checkbox"
                  checked={includePortfolioClause}
                  onChange={(e) => setIncludePortfolioClause(e.target.checked)}
                  className="rounded border-[#382b20] text-[#d99b5a] mt-0.5 focus:ring-0 cursor-pointer accent-[#d99b5a]"
                />
                <span>
                  <strong>Prawo do portfolio:</strong> JC Studio ma prawo do prezentacji wizualizacji w swoim portfolio
                </span>
              </label>

              <div className="flex items-center justify-between pt-1">
                <span>Rundy poprawek w cenie:</span>
                <select
                  value={revisionsCount}
                  onChange={(e) => setRevisionsCount(parseInt(e.target.value, 10))}
                  className="bg-[#120e0a] border border-[#382b20] rounded-lg px-2 py-1 text-xs text-[#f5ede4] outline-none"
                >
                  <option value={1}>1 runda</option>
                  <option value={2}>2 rundy (zalecane)</option>
                  <option value={3}>3 rundy</option>
                </select>
              </div>
            </div>
          </div>

          {/* Dane Stron umowy */}
          <div className="glass-panel p-5 rounded-3xl border border-[#2e231c] space-y-4">
            <h3 className="text-xs font-mono uppercase tracking-wider text-[#d99b5a] flex items-center gap-1.5 pb-2 border-b border-[#2e231c]">
              <Building2 className="w-3.5 h-3.5" />
              2. Dane Stron (Klient & Wykonawca)
            </h3>

            {/* Dane Klienta */}
            <div className="space-y-2">
              <span className="text-[11px] font-mono text-[#9e8f82] uppercase flex items-center gap-1">
                <User className="w-3 h-3 text-[#d99b5a]" />
                Zamawiający (Klient):
              </span>
              <input
                type="text"
                placeholder="Imię i Nazwisko / Nazwa Firmy"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full bg-[#120e0a] border border-[#382b20] focus:border-[#d99b5a] rounded-xl px-3 py-2 text-xs text-[#f5ede4] outline-none"
              />
              <input
                type="text"
                placeholder="Adres, NIP / PESEL, e-mail (opcjonalnie)"
                value={clientDetails}
                onChange={(e) => setClientDetails(e.target.value)}
                className="w-full bg-[#120e0a] border border-[#382b20] focus:border-[#d99b5a] rounded-xl px-3 py-2 text-xs text-[#f5ede4] outline-none font-mono"
              />
            </div>

            {/* Dane Wykonawcy */}
            <div className="space-y-2 pt-2 border-t border-[#2e231c]/60">
              <span className="text-[11px] font-mono text-[#7ec29a] uppercase flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-[#7ec29a]" />
                Wykonawca (Ty):
              </span>
              <input
                type="text"
                value={contractorName}
                onChange={(e) => setContractorName(e.target.value)}
                className="w-full bg-[#120e0a] border border-[#382b20] focus:border-[#7ec29a] rounded-xl px-3 py-2 text-xs text-[#f5ede4] outline-none"
              />
              <input
                type="text"
                value={contractorDetails}
                onChange={(e) => setContractorDetails(e.target.value)}
                className="w-full bg-[#120e0a] border border-[#382b20] focus:border-[#7ec29a] rounded-xl px-3 py-2 text-xs text-[#f5ede4] outline-none font-mono"
              />
            </div>

            {/* Miejscowość */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-[#9e8f82]">Miejscowość zawarcia:</span>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-28 bg-[#120e0a] border border-[#382b20] rounded-xl px-2.5 py-1 text-xs text-[#f5ede4] outline-none text-right font-mono"
              />
            </div>
          </div>

          {/* Przycisk Generowania */}
          <button
            onClick={handleGenerate}
            disabled={isLoading}
            className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#d99b5a] to-[#e6ab6e] hover:from-[#e6ab6e] hover:to-[#f1c38e] text-[#120e0a] font-semibold text-sm shadow-xl shadow-[#d99b5a]/15 flex items-center justify-center gap-2.5 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <span className="w-4 h-4 border-2 border-[#120e0a] border-t-transparent rounded-full animate-spin" />
                <span>AI sporządza profesjonalną umowę...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 fill-current" />
                <span>Generuj umowę przez AI</span>
              </>
            )}
          </button>
        </div>

        {/* PRAWA KOLUMNA: PODGLĄD DOKUMENTU UMOWY */}
        <div className="lg:col-span-7 space-y-4">
          <div className="glass-panel p-5 rounded-3xl border border-[#2e231c] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#2e231c]">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#d99b5a]" />
                <h3 className="text-sm font-medium text-[#f5ede4]">
                  {generatedContract ? generatedContract.title : 'Podgląd dokumentu umowy'}
                </h3>
                {generatedContract && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-[#d99b5a]/20 text-[#f1c38e] border border-[#d99b5a]/30">
                    {generatedContract.contractNumber}
                  </span>
                )}
              </div>

              {generatedContract && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    onClick={() => setIsEditingManually(!isEditingManually)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono transition-all flex items-center gap-1.5 ${
                      isEditingManually
                        ? 'bg-[#7ec29a] text-[#120e0a] font-semibold'
                        : 'bg-[#1e1713] text-[#c4b5a5] hover:text-[#f5ede4] border border-[#382b20]'
                    }`}
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>{isEditingManually ? 'Gotowe' : 'Edytuj ręcznie'}</span>
                  </button>

                  <button
                    onClick={handleCopy}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#2a1e16] hover:bg-[#382b20] text-[#f1c38e] border border-[#d99b5a]/30 transition-all flex items-center gap-1.5 active:scale-95"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-[#7ec29a]" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Skopiowano!' : 'Kopiuj'}</span>
                  </button>

                  <button
                    onClick={handlePrint}
                    className="px-3 py-1.5 rounded-xl text-xs bg-[#1e1713] text-[#c4b5a5] hover:text-[#f5ede4] border border-[#382b20] transition-all flex items-center gap-1.5 active:scale-95"
                    title="Drukuj lub zapisz jako PDF"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Drukuj / PDF</span>
                  </button>

                  <button
                    onClick={handleDownloadDoc}
                    className="p-1.5 rounded-xl bg-[#1e1713] text-[#c4b5a5] hover:text-[#f5ede4] border border-[#382b20] transition-all"
                    title="Pobierz plik tekstowy"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Podsumowanie kluczowych punktów */}
            {generatedContract?.keyPoints && generatedContract.keyPoints.length > 0 && (
              <div className="p-3 rounded-2xl bg-[#18120e] border border-[#d99b5a]/30 space-y-1.5 text-xs">
                <span className="text-[10px] font-mono uppercase text-[#d99b5a] block font-semibold">
                  Kluczowe ustalenia umowy:
                </span>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11px] text-[#c4b5a5]">
                  {generatedContract.keyPoints.map((kp, idx) => (
                    <li key={idx} className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#7ec29a]" />
                      <span>{kp}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Obszar treści umowy */}
            {generatedContract ? (
              isEditingManually ? (
                <textarea
                  rows={26}
                  value={editedText}
                  onChange={(e) => setEditedText(e.target.value)}
                  className="w-full bg-[#120e0a] border border-[#382b20] focus:border-[#7ec29a] rounded-2xl p-4 text-xs font-mono text-[#f5ede4] outline-none leading-relaxed resize-y selection:bg-[#d99b5a]/30"
                />
              ) : (
                <div
                  id="printable-contract"
                  className="bg-[#120e0a] border border-[#2e231c] rounded-2xl p-6 text-xs text-[#ded5cb] font-serif leading-relaxed whitespace-pre-wrap max-h-[650px] overflow-y-auto selection:bg-[#d99b5a]/30 shadow-inner"
                >
                  {editedText || generatedContract.contractText}
                </div>
              )
            ) : (
              <div className="p-12 text-center rounded-2xl bg-[#120e0a]/50 border border-[#2e231c]/60 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-[#d99b5a]/10 border border-[#d99b5a]/25 flex items-center justify-center mx-auto text-[#d99b5a]">
                  <FileText className="w-6 h-6 stroke-[1.5]" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-medium text-[#f5ede4]">
                    Brak wygenerowanej umowy
                  </h4>
                  <p className="text-xs text-[#9e8f82] max-w-sm mx-auto">
                    Wybierz preset lub wprowadź zakres i cenę po lewej stronie, a następnie kliknij <strong>„Generuj umowę przez AI”</strong>.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Historia wygenerowanych umów */}
          {history.length > 0 && (
            <div className="glass-panel p-4 rounded-3xl border border-[#2e231c] space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#2e231c]">
                <span className="text-xs font-mono uppercase tracking-wider text-[#9e8f82] flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5 text-[#d99b5a]" />
                  Poprzednio wygenerowane umowy ({history.length})
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                {history.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleLoadFromHistory(item)}
                    className="p-2.5 rounded-xl bg-[#140e0b] hover:bg-[#1e1713] border border-[#2e231c] hover:border-[#d99b5a]/40 transition-all cursor-pointer flex items-center justify-between gap-2 text-xs group"
                  >
                    <div className="truncate">
                      <div className="font-medium text-[#f5ede4] truncate flex items-center gap-1.5">
                        <span>{item.clientName}</span>
                        <span className="text-[10px] text-[#7ec29a] font-mono">({item.price})</span>
                      </div>
                      <div className="text-[10px] text-[#9e8f82] font-mono">
                        {item.contractNumber} • {item.date}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => handleDeleteHistory(item.id, e)}
                      className="text-[#9e8f82] hover:text-[#f87171] p-1 rounded transition-colors opacity-0 group-hover:opacity-100"
                      title="Usuń z historii"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
