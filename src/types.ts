export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export type Status = 'todo' | 'in_progress' | 'done' | 'paid';

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  price?: number;        // Kwota zlecenia w PLN
  startDate?: string;    // Data rozpoczęcia (YYYY-MM-DD)
  dueDate?: string;      // Termin / Deadline (YYYY-MM-DD)
  category: string;
  priority: Priority;
  status: Status;        // todo | in_progress | done | paid
  notes?: string;        // Uwagi do projektu
  remindByEmail?: boolean; // Czy wysłać/oznaczyć przypomnienie e-mail
  emailReminderSentAt?: string; // Data i czas wysłania przypomnienia
  subtasks: Subtask[];
  createdAt: string;
  completedAt?: string;
}

export type ViewMode =
  | 'today'
  | 'all'
  | 'kanban'
  | 'timeline'
  | 'finances'
  | 'notes'
  | 'converter'
  | 'offers'
  | 'portfolio_manager';

export interface PortfolioProject {
  id: string;
  title: string;
  category: string;
  categoryLabel: string;
  description: string;
  imageUrl: string;
  client?: string;
  year?: string;
  tags: string[];
  featured?: boolean;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  updatedAt: string;
}

export interface CostItem {
  id: string;
  name: string;
  cost: number;
  type: 'business' | 'private';
  date: string;
}

export interface MonthlyCosts {
  zus: number;
  tax: number;
}
