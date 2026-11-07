export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export type Status = 'todo' | 'in_progress' | 'done';

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  category: string;
  priority: Priority;
  status: Status;
  dueDate?: string;
  subtasks: Subtask[];
  createdAt: string;
  completedAt?: string;
}

export type ViewMode = 'today' | 'all' | 'kanban' | 'notes';

export interface Note {
  id: string;
  title: string;
  content: string;
  updatedAt: string;
}
