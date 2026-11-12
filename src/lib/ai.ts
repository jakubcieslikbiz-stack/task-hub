import type { Priority, Status } from '../types';

export interface AiCommandResult {
  action: 'add_task' | 'todo' | 'add_cost' | 'add_note' | 'summary' | 'end_month' | 'unknown';
  name?: string;
  category?: 'work' | 'personal';
  startDate?: string;
  endDate?: string;
  dueTime?: string;
  reminderTime?: string;
  price?: number;
  type?: 'business' | 'private';
  cost?: number;
  taskName?: string;
  text?: string;
  remindByEmail?: boolean;
}

export interface ParsedAiTask {
  title: string;
  price?: number;
  category: string;
  priority: Priority;
  status: Status;
  startDate?: string;
  dueDate?: string;
  description?: string;
  notes?: string;
  subtasks: string[];
  remindByEmail?: boolean;
}

export function speakText(text: string, enabled: boolean = true) {
  if (!enabled) return;
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'pl-PL';
    const voices = window.speechSynthesis.getVoices();
    const plVoice = voices.find((v) => v.lang.includes('pl') || v.lang.includes('PL'));
    if (plVoice) utterance.voice = plVoice;
    window.speechSynthesis.speak(utterance);
  }
}

export async function executeAiCommand(
  rawText: string,
  apiKey: string
): Promise<AiCommandResult> {
  const todayStr = new Date().toISOString().split('T')[0];
  const dayName = new Date().toLocaleDateString('pl-PL', { weekday: 'long' });

  const systemPrompt = `Jesteś inteligentnym asystentem w aplikacji do zarządzania zadaniami, projektami i czasem JC Studio.
Dzisiejsza data: ${todayStr} (${dayName}).
Twoim zadaniem jest zamienienie komendy użytkownika w języku polskim na format JSON.
Nie dodawaj żadnego tekstu przed ani po JSON-ie. Odpowiedz TYLKO i wyłącznie obiektem JSON.

Dozwolone akcje (action) i struktury:
1. Dodanie nowego zadania / projektu / spotkania / sprawy codziennej:
   Obsługuj zarówno zlecenia graficzne/3D/architektoniczne, jak i wszelkie codzienne sprawy osobiste (np. fryzjer, lekarz, dentysta, zakupy, spotkanie, trening, przegląd auta, serwis).
   - Jeśli to zlecenie komercyjne/3D/architektoniczne -> "category": "work".
   - Jeśli to sprawa codzienna/prywatna (np. fryzjer, lekarz, zakupy) -> "category": "personal".
   - Jeśli podano termin relatywny (np. "za tydzień", "jutro", "w piątek", "za 3 dni"), precyzyjnie oblicz datę YYYY-MM-DD bazując na dzisiejszej dacie ${todayStr}.
   - Jeśli podano godzinę (np. "o 14:00", "na 11:30"), wyłuskaj "dueTime": "HH:MM".
   - Jeśli użytkownik mówi "przypomnij mailem", "przypomnij mi godzinę przed mailem", "wyślij powiadomienie na maila", ustaw "remindByEmail": true oraz wyłuskaj "reminderTime": np. "godzinę przed" lub inną podaną wartość.
   - Jeśli podano kwotę w zł -> "price": liczba.
   Format:
   {"action": "add_task", "name": "nazwa", "category": "work"|"personal", "startDate": "YYYY-MM-DD", "endDate": "YYYY-MM-DD", "dueTime": "HH:MM", "reminderTime": "opis", "price": liczba, "remindByEmail": true/false}

2. Dodanie do To-Do / Szybkich Notatek (np. "dodaj do to do kupić mleko", "muszę zadzwonić do klienta"):
   {"action": "todo", "text": "treść zadania"}

3. Dodanie kosztu (business = firmowy/biuro/ZUS/podatki/licencje, private = prywatny/dom):
   {"action": "add_cost", "type": "business" lub "private", "name": "nazwa kosztu", "cost": liczba}

4. Dodanie uwagi do istniejącego projektu (np. "dodaj uwagę do projektu X treść Y"):
   {"action": "add_note", "taskName": "nazwa projektu", "text": "treść uwagi"}

5. Bilans finansowy / podsumowanie:
   {"action": "summary"}

6. Zamknięcie miesiąca (raport):
   {"action": "end_month"}`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey.trim()}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: rawText },
      ],
      temperature: 0.0,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData?.error?.message || `Błąd OpenAI (${response.status})`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new Error('Pusta odpowiedź z OpenAI.');
  }

  return JSON.parse(content) as AiCommandResult;
}

export async function parseTaskWithOpenAI(
  userInput: string,
  apiKey: string
): Promise<ParsedAiTask> {
  const today = new Date().toISOString().split('T')[0];
  const dayOfWeek = new Date().toLocaleDateString('pl-PL', { weekday: 'long' });

  const systemPrompt = `Jesteś inteligentnym asystentem zarządzania zleceniami dla studia JC Studio.
Dzisiejsza data: ${today} (${dayOfWeek}).
Przekształć opis użytkownika w JSON:
- "title": (string)
- "price": (number lub null, kwota w zł)
- "category": ("work" | "personal", gdzie "work" to Zlecenia 3D, a "personal" to Osobiste)
- "priority": ("low" | "medium" | "high" | "urgent")
- "status": ("in_progress" | "todo" | "done" | "paid")
- "startDate": (string YYYY-MM-DD, domyślnie ${today})
- "dueDate": (string YYYY-MM-DD)
- "description": (string)
- "notes": (string)
- "subtasks": (tablica stringów)
- "remindByEmail": (boolean, ustaw true jeśli użytkownik prosi o przypomnienie mailem/na maila/powiadomienie mailowe)`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey.trim()}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userInput },
      ],
      temperature: 0.2,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData?.error?.message || `Błąd OpenAI (${response.status})`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('Pusta odpowiedź.');

  const parsed = JSON.parse(content);
  return {
    title: parsed.title || userInput,
    price: typeof parsed.price === 'number' ? parsed.price : undefined,
    category: parsed.category || 'work',
    priority: parsed.priority || 'high',
    status: parsed.status || 'in_progress',
    startDate: parsed.startDate || today,
    dueDate: parsed.dueDate || undefined,
    description: parsed.description || undefined,
    notes: parsed.notes || undefined,
    subtasks: Array.isArray(parsed.subtasks) ? parsed.subtasks : [],
  };
}

export interface ParsedEmailTask {
  title: string;
  client?: string;
  price?: number;
  category: 'work' | 'personal';
  priority: Priority;
  status: Status;
  startDate: string;
  dueDate?: string;
  description: string;
  notes?: string;
  subtasks: string[];
  confidenceSummary: string;
}

export async function parseEmailToTaskWithOpenAI(
  email: { sender?: string; subject?: string; body: string },
  apiKey: string
): Promise<ParsedEmailTask> {
  const today = new Date().toISOString().split('T')[0];
  const dayOfWeek = new Date().toLocaleDateString('pl-PL', { weekday: 'long' });

  const systemPrompt = `Jesteś inteligentnym asystentem pocztowym dla studia graficznego i architektonicznego JC Studio.
Dzisiejsza data: ${today} (${dayOfWeek}).
Twoim zadaniem jest przeanalizowanie otrzymanej wiadomości e-mail (od klienta, współpracownika lub prywatnej) i wyekstrahowanie konkretnego zadania/zlecenia do formatu JSON.

Zasady analizy:
1. "title": Zwięzły, konkretny tytuł projektu/zlecenia (np. "Wizualizacja wnętrz apartamentu — Mokotów", "Modelowanie 3D krzesła", "Wizyta u dentysty"). Jeśli to odpowiedź/przekazanie maila, usuń przedrostki typu "Fwd:", "Re:".
2. "client": Imię i nazwisko lub nazwa firmy klienta (wyciągnięte z pola Od/Sender lub podpisu na końcu maila).
3. "price": Budżet lub wycena w PLN jako liczba (np. 4200). Jeśli podano inną walutę (np. EUR), przelicz lub podaj wartość, a jeśli brak ceny -> null.
4. "category": "work" dla zleceń komercyjnych (3D, architektura, grafika, rendery) lub "personal" dla spraw prywatnych (fryzjer, lekarz, rachunki, zakupy).
5. "priority": "low" | "medium" | "high" | "urgent" (na podstawie tonu wiadomości, terminów i rangi sprawy).
6. "status": domyślnie "in_progress".
7. "startDate": "${today}".
8. "dueDate": Data końcowa w formacie YYYY-MM-DD. Jeśli w treści podano np. "do 28 listopada" lub "za 2 tygodnie", dokładnie oblicz datę YYYY-MM-DD bazując na ${today}. Jeśli brak terminu -> null.
9. "description": Zwięzłe 1-2 zdaniowe podsumowanie zakresu prac.
10. "notes": Kluczowe wytyczne, uwagi techniczne, linki lub ustalenia z maila (np. "Pliki DWG na dysku, 4 ujęcia w 4K, tonacja dzienna").
11. "subtasks": Tablica konkretnych kroków do wykonania (np. ["Sprawdzenie rzutów DWG", "Modelowanie bryły", "Oświetlenie i materiały", "Render próbny do akceptacji"]).
12. "confidenceSummary": 1 zdanie po polsku z krótkim wyjaśnieniem, co AI zrozumiało z maila.

Odpowiedz TYLKO i wyłącznie czystym obiektem JSON.`;

  const userContent = `OD (Nadawca): ${email.sender || 'Nieznany'}
TEMAT: ${email.subject || 'Brak tematu'}
TREŚĆ:
${email.body || '(Brak treści)'}`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey.trim()}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent },
      ],
      temperature: 0.1,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData?.error?.message || `Błąd OpenAI (${response.status})`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('Pusta odpowiedź z OpenAI.');

  const parsed = JSON.parse(content);
  return {
    title: parsed.title || email.subject || 'Nowe zlecenie z poczty',
    client: parsed.client || undefined,
    price: typeof parsed.price === 'number' ? parsed.price : undefined,
    category: parsed.category === 'personal' ? 'personal' : 'work',
    priority: parsed.priority || 'high',
    status: 'in_progress',
    startDate: parsed.startDate || today,
    dueDate: parsed.dueDate || undefined,
    description: parsed.description || 'Zadanie utworzone z przekazanego e-maila.',
    notes: parsed.notes || undefined,
    subtasks: Array.isArray(parsed.subtasks) ? parsed.subtasks : [],
    confidenceSummary: parsed.confidenceSummary || 'Pomyślnie przetworzono wiadomość e-mail.',
  };
}

export interface DraftEmailParams {
  preset: string;
  clientMessage?: string;
  myNotes: string;
  tone: 'professional' | 'friendly' | 'concise';
  includeRevisions?: boolean;
  includeVat?: boolean;
  senderSignature?: string;
  adjustmentInstruction?: string;
}

export interface DraftEmailResult {
  subject: string;
  body: string;
  summary?: string;
}

export async function draftEmailWithOpenAI(
  params: DraftEmailParams,
  apiKey: string
): Promise<DraftEmailResult> {
  const toneMap = {
    professional: 'elegancki, wysoce profesjonalny, uprzejmy, biznesowy',
    friendly: 'nowoczesny, serdeczny, bezpośredni, partnerski',
    concise: 'maksymalnie zwięzły, konkretny, oszczędny w słowach, bez zbędnych wstępów',
  };

  const systemPrompt = `Jesteś doradcą klienta i ekspertem komunikacji biznesowej w studiu wizualizacji i grafiki 3D "JC Studio" (prowadzonym przez Jakuba Cieślika).
Twoim zadaniem jest stworzenie perfekcyjnej, gotowej do wysłania wiadomości e-mail w języku polskim.

Wytyczne stylu:
- Ton wiadomości: ${toneMap[params.tone] || 'profesjonalny'}.
- Podpis na końcu wiadomości: ${params.senderSignature || 'Jakub Cieślik | JC Studio'}.
${params.includeRevisions ? '- Wyraźnie zaznacz, że w cenie zawarte są 2 tury poprawek.' : ''}
${params.includeVat ? '- Zaznacz, że podane ceny są kwotami netto i wystawiasz fakturę VAT.' : ''}
- Formatuj treść czytelnie: używaj akapitów, a w przypadku wycen, etapów lub listy potrzebnych materiałów stosuj eleganckie punktorowanie (•).
- Pisz naturalną, nienaganną polszczyzną bez sztucznych kalk językowych.
- Odpowiedz TYLKO I WYŁĄCZNIE poprawnym obiektem JSON z polami:
  "subject": (string) krótki, profesjonalny temat e-maila,
  "body": (string) pełna treść maila od powitania po podpis,
  "summary": (string) 1 krótkie zdanie podsumowujące ofertę/odpowiedź.`;

  const userPrompt = `Typ wiadomości: ${params.preset}
${params.clientMessage ? `Wiadomość / zapytanie od klienta:\n"""\n${params.clientMessage}\n"""\n` : ''}
Moje wytyczne i ustalenia do uwzględnienia:\n"""\n${params.myNotes}\n"""
${params.adjustmentInstruction ? `Dodatkowa instrukcja poprawki: ${params.adjustmentInstruction}` : ''}`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey.trim()}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData?.error?.message || `Błąd OpenAI (${response.status})`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('Pusta odpowiedź z OpenAI.');

  const parsed = JSON.parse(content);
  return {
    subject: parsed.subject || 'Wiadomość od JC Studio',
    body: parsed.body || '',
    summary: parsed.summary,
  };
}
