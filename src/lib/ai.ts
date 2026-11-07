import type { Priority, Status } from '../types';

export interface AiCommandResult {
  action: 'add_task' | 'todo' | 'add_cost' | 'add_note' | 'summary' | 'end_month' | 'unknown';
  name?: string;
  startDate?: string;
  endDate?: string;
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

  const systemPrompt = `Jesteś inteligentnym asystentem w aplikacji do zarządzania projektami i finansami JC Studio.
Dzisiejsza data: ${todayStr} (${dayName}).
Twoim zadaniem jest zamienienie komendy użytkownika w języku polskim na format JSON.
Nie dodawaj żadnego tekstu przed ani po JSON-ie. Odpowiedz TYLKO i wyłącznie obiektem JSON.

Dozwolone akcje (action) i struktury:
1. Dodanie nowego zadania/projektu (jeśli brak dat start/end, przyjmij dzisiejszą datę. Wyłuskaj budżet w zł. Zostaw samą nazwę projektu. Jeśli użytkownik mówi "przypomnij mailem", "wyślij na maila", "przypomnij na maila", "wyślij powiadomienie na maila", dodaj "remindByEmail": true):
   {"action": "add_task", "name": "nazwa projektu", "startDate": "YYYY-MM-DD", "endDate": "YYYY-MM-DD", "price": liczba, "remindByEmail": true/false}

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
- "category": ("work" | "personal" | "learning" | "health" | "finance")
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
