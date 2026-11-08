import type { Task, Note } from '../types';

export const CATEGORIES = [
  { id: 'work', name: 'Zlecenia 3D', color: 'bg-[#d99b5a]/15 text-[#f1c38e] border-[#d99b5a]/30' },
  { id: 'personal', name: 'Osobiste', color: 'bg-[#7ec29a]/15 text-[#9ee2b9] border-[#7ec29a]/30' },
];

const todayStr = new Date().toISOString().split('T')[0];

export const INITIAL_TASKS: Task[] = [
  {
    id: '1',
    title: 'Wizualizacja apartamentu dla p. Marka',
    description: 'Przygotowanie ujęć salonu, sypialni oraz kuchni w wysokiej rozdzielczości.',
    price: 2800,
    startDate: todayStr,
    dueDate: todayStr,
    category: 'work',
    priority: 'urgent',
    status: 'in_progress',
    notes: 'Klient prosił o ciepłe oświetlenie popołudniowe.',
    subtasks: [
      { id: 's1', title: 'Modelowanie 3D i dobór mebli', completed: true },
      { id: 's2', title: 'Oświetlenie sceny i tekstury', completed: false },
      { id: 's3', title: 'Rendery końcowe i postprodukcja', completed: false },
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    title: 'Model 3D elewacji osiedla Lipowa',
    description: 'Wizualizacja zewnętrzna budynków z otoczeniem zieleni i małej architektury.',
    price: 4500,
    startDate: todayStr,
    dueDate: todayStr,
    category: 'work',
    priority: 'high',
    status: 'paid',
    notes: 'Faktura wystawiona i opłacona przelewem.',
    subtasks: [
      { id: 's4', title: 'Import bryły CAD', completed: true },
      { id: 's5', title: 'Rendery z drona', completed: true },
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: '3',
    title: 'Postprodukcja i animacja wnętrza',
    description: 'Krótki spacer wideo po apartamencie (format 4K 60fps).',
    price: 1800,
    startDate: todayStr,
    dueDate: todayStr,
    category: 'work',
    priority: 'medium',
    status: 'done',
    notes: 'Czeka na akceptację klienta przed wystawieniem faktury.',
    subtasks: [],
    createdAt: new Date().toISOString(),
  },
];

export const INITIAL_NOTES: Note[] = [
  {
    id: 'n1',
    title: 'To-Do & Zapiski JC Studio',
    content: '• Wystawić fakturę za osiedle Lipowa\n• Zaktualizować portfolio o nowe rendery wnętrz\n• Sprawdzić rozliczenie ZUS na bieżący miesiąc',
    updatedAt: new Date().toISOString(),
  },
];
