import type { Task, Note } from '../types';

export const CATEGORIES = [
  { id: 'work', name: 'Praca', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  { id: 'personal', name: 'Osobiste', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  { id: 'learning', name: 'Nauka', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
  { id: 'health', name: 'Zdrowie', color: 'bg-rose-500/10 text-rose-400 border-rose-500/20' },
  { id: 'finance', name: 'Finanse', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
];

const todayStr = new Date().toISOString().split('T')[0];

export const INITIAL_TASKS: Task[] = [
  {
    id: '1',
    title: 'Przetestować aplikację TaskHub na telefonie',
    description: 'Zeskanować kod QR lub wejść przez lokalny adres IP w sieci Wi-Fi i sprawdzić wygodę obsługi.',
    category: 'learning',
    priority: 'urgent',
    status: 'in_progress',
    dueDate: todayStr,
    subtasks: [
      { id: 's1', title: 'Otworzyć TaskHub w przeglądarce telefonu', completed: false },
      { id: 's2', title: 'Dodać stronę do ekranu głównego (PWA)', completed: false },
      { id: 's3', title: 'Stworzyć pierwsze własne zadanie', completed: false },
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    title: 'Wdrożyć aplikację na darmowy hosting Vercel',
    description: 'Połączyć projekt z Vercel, aby mieć stały dostęp do zadań 24/7 z dowolnego miejsca.',
    category: 'work',
    priority: 'high',
    status: 'todo',
    dueDate: todayStr,
    subtasks: [
      { id: 's4', title: 'Założyć darmowe konto na vercel.com', completed: false },
      { id: 's5', title: 'Uruchomić komendę wdrożenia', completed: false },
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: '3',
    title: 'Zaplanować zadania na nadchodzący tydzień',
    description: 'Podzielić cele na mniejsze kroki i przypisać im odpowiednie priorytety.',
    category: 'personal',
    priority: 'medium',
    status: 'todo',
    subtasks: [],
    createdAt: new Date().toISOString(),
  },
  {
    id: '4',
    title: 'Skonfigurować środowisko i Tailwind CSS',
    description: 'Projekt został zainicjalizowany z pełnym wsparciem urządzeń mobilnych i desktopowych.',
    category: 'work',
    priority: 'low',
    status: 'done',
    completedAt: new Date().toISOString(),
    subtasks: [],
    createdAt: new Date().toISOString(),
  },
];

export const INITIAL_NOTES: Note[] = [
  {
    id: 'n1',
    title: 'Pomysły na rozwój TaskHub',
    content: '- Dodanie powiadomień push o zadaniach na dziś\n- Synchronizacja z kalendarzem Google\n- Tryb skupienia (timer Pomodoro 25 min)',
    updatedAt: new Date().toISOString(),
  },
];
