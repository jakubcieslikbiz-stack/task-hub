import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { Task, Note, ViewMode, Status, MonthlyCosts, PortfolioProject } from './types';
import { INITIAL_TASKS, INITIAL_NOTES, CATEGORIES } from './data/initialData';
import { INITIAL_PORTFOLIO_PROJECTS } from './data/initialPortfolio';
import { Sidebar } from './components/Sidebar';
import { MobileQuickActions } from './components/MobileQuickActions';
import { Header } from './components/Header';
import { TaskCard } from './components/TaskCard';
import { TaskTable } from './components/TaskTable';
import { TimelineView } from './components/TimelineView';
import { FinancesView } from './components/FinancesView';
import { ImageConverterView } from './components/ImageConverterView';
import { DwgConverterView } from './components/DwgConverterView';
import { EmailOfferDrafterView } from './components/EmailOfferDrafterView';
import { PublicPortfolioView } from './components/PublicPortfolioView';
import { PortfolioManagerView } from './components/PortfolioManagerView';
import { PomodoroView } from './components/PomodoroView';
import { PomodoroFloatingWidget } from './components/PomodoroFloatingWidget';
import { RecentActivityAndGoals } from './components/RecentActivityAndGoals';
import { TaskModal } from './components/TaskModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AiAssistantBar } from './components/AiAssistantBar';
import { AiTaskModal } from './components/AiTaskModal';
import { ConnectPhoneModal } from './components/ConnectPhoneModal';
import { FinanceSummaryBoxes } from './components/FinanceSummaryBoxes';
import { LockScreen } from './components/LockScreen';
import { ChangePasswordModal } from './components/ChangePasswordModal';
import { SettingsView } from './components/SettingsView';
import {
  getStoredCredentials,
  saveStoredCredentials,
  isSessionAuthenticated,
  clearSessionAuthentication,
  type AuthCredentials,
} from './lib/auth';
import { Cloud, CloudOff, RefreshCw, Table, LayoutGrid, Lock, KeyRound, Loader2, Settings } from 'lucide-react';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import { checkAndAutoGenerateReports } from './lib/monthlyReport';
import { sortTasksByClosestDeadline } from './utils/taskSort';

const DEFAULT_API_KEY = (import.meta.env.VITE_OPENAI_API_KEY as string) || '';

const cleanAiNotes = (notes?: string): string | undefined => {
  if (!notes) return undefined;
  const cleaned = notes
    .replace(/(^|\s*•\s*|\s*\|\s*)Dodane przez Asystenta AI\s*(✨)?/gi, '')
    .trim();
  return cleaned.length > 0 ? cleaned : undefined;
};

const sanitizeTasks = (tasksList: Task[]): Task[] => {
  return tasksList.map((t) =>
    t.notes && /Dodane przez Asystenta AI/i.test(t.notes)
      ? { ...t, notes: cleanAiNotes(t.notes) }
      : t
  );
};

export function App() {
  // Tasks state
  const [tasks, setTasks] = useState<Task[]>(() => {
    try {
      const saved = localStorage.getItem('taskhub_tasks');
      const loaded = saved ? JSON.parse(saved) : INITIAL_TASKS;
      return sanitizeTasks(loaded);
    } catch {
      return sanitizeTasks(INITIAL_TASKS);
    }
  });

  // Notes state
  const [notes, setNotes] = useState<Note[]>(() => {
    try {
      const saved = localStorage.getItem('taskhub_notes');
      return saved ? JSON.parse(saved) : INITIAL_NOTES;
    } catch {
      return INITIAL_NOTES;
    }
  });

  // Costs state (from JC Studio)
  const [costs, setCosts] = useState<MonthlyCosts>(() => {
    try {
      const saved = localStorage.getItem('taskhub_costs');
      return saved ? JSON.parse(saved) : { zus: 1600, tax: 0 };
    } catch {
      return { zus: 1600, tax: 0 };
    }
  });

  // Client Portfolio projects state
  const [portfolioProjects, setPortfolioProjects] = useState<PortfolioProject[]>(() => {
    try {
      const saved = localStorage.getItem('taskhub_portfolio');
      return saved ? JSON.parse(saved) : INITIAL_PORTFOLIO_PROJECTS;
    } catch {
      return INITIAL_PORTFOLIO_PROJECTS;
    }
  });

  // OpenAI API Key
  const [apiKey, setApiKey] = useState<string>(() => {
    const saved = localStorage.getItem('openai_api_key');
    if (saved && saved.trim().length > 15) {
      return saved.trim();
    }
    if (DEFAULT_API_KEY) {
      localStorage.setItem('openai_api_key', DEFAULT_API_KEY);
    }
    return DEFAULT_API_KEY;
  });

  useEffect(() => {
    const current = localStorage.getItem('openai_api_key');
    if (!current || current.trim().length < 15) {
      localStorage.setItem('openai_api_key', DEFAULT_API_KEY);
      setApiKey(DEFAULT_API_KEY);
    }
  }, []);

  const [cloudSynced, setCloudSynced] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Navigation and Filter state
  const [currentView, setCurrentView] = useState<ViewMode>('today');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'in_progress' | 'done' | 'paid'>('all');
  const [tasksLayoutMode, setTasksLayoutMode] = useState<'table' | 'cards'>('table');

  // Modals state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false);
  const [defaultStatusForNewTask, setDefaultStatusForNewTask] = useState<Status>('in_progress');
  const [defaultCategoryForNewTask, setDefaultCategoryForNewTask] = useState<string>('work');
  const [autoReportNotice, setAutoReportNotice] = useState<string | null>(null);

  // Authentication & Security state (Haszowane hasło PBKDF2)
  const [authCredentials, setAuthCredentials] = useState<AuthCredentials | null>(() => getStoredCredentials());
  const [isInitialAuthChecked, setIsInitialAuthChecked] = useState<boolean>(() => {
    return !isSupabaseConfigured || getStoredCredentials() !== null;
  });
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const creds = getStoredCredentials();
    if (!creds) return false;
    return isSessionAuthenticated();
  });
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  const handleLockApp = () => {
    clearSessionAuthentication();
    setIsAuthenticated(false);
  };

  const handleAuthenticated = useCallback(() => {
    setIsAuthenticated(true);
  }, []);

  // Automated Monthly Report Generation (Runs on mount & checks periodically for 23:50 on last day of month)
  useEffect(() => {
    const runCheck = () => {
      const { generated } = checkAndAutoGenerateReports(tasks, costs);
      if (generated) {
        setAutoReportNotice(
          `Wygenerowano automatyczny raport miesięczny za ${generated.monthName} o godz. 23:50! 📑`
        );
      }
    };

    runCheck();
    const interval = setInterval(runCheck, 30000);
    return () => clearInterval(interval);
  }, [tasks, costs]);

  // Check and update scheduled email reminder statuses
  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();
      setTasks((prevTasks) => {
        let changed = false;
        const updated = prevTasks.map((t) => {
          if (
            t.remindByEmail &&
            !t.emailReminderSentAt &&
            t.emailReminderScheduledAt
          ) {
            const schedDate = new Date(t.emailReminderScheduledAt);
            if (now >= schedDate) {
              changed = true;
              return {
                ...t,
                emailReminderSentAt: now.toISOString(),
              };
            }
          }
          return t;
        });
        if (changed) {
          syncTasksToCloud(updated);
        }
        return changed ? updated : prevTasks;
      });
    };

    checkReminders();
    const interval = setInterval(checkReminders, 20000);
    return () => clearInterval(interval);
  }, []);

  // Gest przeciągnięcia na mobile (Swipe gesture: lewa -> prawa otwiera sidebar, prawa -> lewa zamyka)
  useEffect(() => {
    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;
    let isEligible = false;
    let hasTriggered = false;

    const handleTouchStart = (e: TouchEvent) => {
      // Tylko na ekranach mobilnych poniżej breakpointu md (768px)
      if (window.innerWidth >= 768) return;
      // Nie otwieraj podczas otwartych modali
      if (isTaskModalOpen || isAiModalOpen || isPhoneModalOpen) return;

      const touch = e.touches[0];
      if (!touch) return;

      touchStartX = touch.clientX;
      touchStartY = touch.clientY;
      touchStartTime = Date.now();
      hasTriggered = false;

      const target = e.target as HTMLElement | null;

      // Ignoruj gesty na polach formularzy (input, textarea, select)
      if (target?.closest('input, textarea, select, [contenteditable="true"]')) {
        isEligible = false;
        return;
      }

      // W strefie poziomego wykresu zezwalaj tylko na swipe z samej krawędzi (<= 35px)
      if (target?.closest('.touch-pan-x, [data-no-swipe]') && touchStartX > 35) {
        isEligible = false;
        return;
      }

      if (isMobileMenuOpen) {
        // Gdy sidebar jest otwarty, jakikolwiek poziomy ruch w lewo zamyka go
        isEligible = true;
      } else {
        // Gdy jest zamknięty, swipe musi startować z lewej strony ekranu (do 35% szerokości lub 120px)
        const leftZoneWidth = Math.max(100, window.innerWidth * 0.35);
        isEligible = touchStartX <= leftZoneWidth;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isEligible || hasTriggered) return;
      const touch = e.touches[0];
      if (!touch) return;

      const deltaX = touch.clientX - touchStartX;
      const deltaY = touch.clientY - touchStartY;
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);

      // Gest musi być dominująco poziomy (aby nie kolidować z pionowym przewijaniem)
      if (absX < 35 || absX <= absY * 1.25) return;

      if (!isMobileMenuOpen && deltaX > 35) {
        // Przeciągnięcie w prawo z lewej strony -> OTWÓRZ SIDEBAR
        hasTriggered = true;
        setIsMobileMenuOpen(true);
        if (navigator.vibrate) {
          try {
            navigator.vibrate(12);
          } catch (_) {}
        }
      } else if (isMobileMenuOpen && deltaX < -30) {
        // Przeciągnięcie w lewo przy otwartym -> ZAMKNIJ SIDEBAR
        hasTriggered = true;
        setIsMobileMenuOpen(false);
        if (navigator.vibrate) {
          try {
            navigator.vibrate(8);
          } catch (_) {}
        }
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!isEligible || hasTriggered) {
        isEligible = false;
        return;
      }

      const touch = e.changedTouches[0];
      if (!touch) return;

      const deltaX = touch.clientX - touchStartX;
      const deltaY = touch.clientY - touchStartY;
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);
      const elapsed = Date.now() - touchStartTime;

      // Szybki gest (flick pod palcem < 300ms) o drodze min. 25px
      if (elapsed < 300 && absX >= 25 && absX > absY) {
        if (!isMobileMenuOpen && deltaX > 25) {
          setIsMobileMenuOpen(true);
          if (navigator.vibrate) {
            try {
              navigator.vibrate(12);
            } catch (_) {}
          }
        } else if (isMobileMenuOpen && deltaX < -25) {
          setIsMobileMenuOpen(false);
          if (navigator.vibrate) {
            try {
              navigator.vibrate(8);
            } catch (_) {}
          }
        }
      }

      isEligible = false;
      hasTriggered = false;
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isMobileMenuOpen, isTaskModalOpen, isAiModalOpen, isPhoneModalOpen]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const isInitialRemoteLoad = useRef(true);

  // Local storage persistence
  useEffect(() => {
    localStorage.setItem('taskhub_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('taskhub_notes', JSON.stringify(notes));
  }, [notes]);

  useEffect(() => {
    localStorage.setItem('taskhub_costs', JSON.stringify(costs));
  }, [costs]);

  useEffect(() => {
    localStorage.setItem('taskhub_portfolio', JSON.stringify(portfolioProjects));
  }, [portfolioProjects]);

  useEffect(() => {
    if (apiKey) {
      localStorage.setItem('openai_api_key', apiKey);
    }
  }, [apiKey]);

  // Load from Supabase on mount
  useEffect(() => {
    if (!supabase) return;

    async function loadRemoteData() {
      setIsSyncing(true);
      try {
        const { data, error } = await supabase!
          .from('taskhub_state')
          .select('key, data');

        if (!error && data && data.length > 0) {
          const tasksRow = data.find((r) => r.key === 'tasks');
          const notesRow = data.find((r) => r.key === 'notes');
          const costsRow = data.find((r) => r.key === 'costs');
          const portfolioRow = data.find((r) => r.key === 'portfolio');
          const authRow = data.find((r) => r.key === 'auth');

          if (tasksRow && Array.isArray(tasksRow.data)) {
            const sanitized = sanitizeTasks(tasksRow.data);
            setTasks(sanitized);
            // Jeśli któreś miały starą notatkę AI, zaktualizuj też w chmurze
            if (JSON.stringify(sanitized) !== JSON.stringify(tasksRow.data)) {
              syncTasksToCloud(sanitized);
            }
          }
          if (notesRow && Array.isArray(notesRow.data)) {
            setNotes(notesRow.data);
          }
          if (costsRow && costsRow.data) {
            setCosts(costsRow.data);
          }
          if (portfolioRow && Array.isArray(portfolioRow.data)) {
            setPortfolioProjects(portfolioRow.data);
          }
          if (authRow && authRow.data && authRow.data.hash && authRow.data.salt) {
            setAuthCredentials(authRow.data);
            saveStoredCredentials(authRow.data);
          }
          setCloudSynced(true);
        } else if (data && data.length === 0) {
          await supabase!.from('taskhub_state').upsert([
            { key: 'tasks', data: tasks },
            { key: 'notes', data: notes },
            { key: 'costs', data: costs },
            { key: 'portfolio', data: portfolioProjects },
          ]);
          setCloudSynced(true);
        }
      } catch (err) {
        console.warn('Supabase sync notice:', err);
      } finally {
        setIsSyncing(false);
        setIsInitialAuthChecked(true);
        isInitialRemoteLoad.current = false;
      }
    }

    loadRemoteData();

    // Listen to real-time updates from other devices (e.g. phone <-> pc)
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'taskhub_state' },
        (payload: any) => {
          if (payload.new && payload.new.key === 'tasks' && Array.isArray(payload.new.data)) {
            setTasks(payload.new.data);
          }
          if (payload.new && payload.new.key === 'notes' && Array.isArray(payload.new.data)) {
            setNotes(payload.new.data);
          }
          if (payload.new && payload.new.key === 'costs' && payload.new.data) {
            setCosts(payload.new.data);
          }
          if (payload.new && payload.new.key === 'portfolio' && Array.isArray(payload.new.data)) {
            setPortfolioProjects(payload.new.data);
          }
          if (payload.new && payload.new.key === 'auth' && payload.new.data?.hash) {
            setAuthCredentials(payload.new.data);
            saveStoredCredentials(payload.new.data);
          }
        }
      )
      .subscribe();

    return () => {
      if (supabase) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  // Sync helpers
  const syncTasksToCloud = useCallback(async (updatedTasks: Task[]) => {
    if (!supabase || isInitialRemoteLoad.current) return;
    try {
      await supabase.from('taskhub_state').upsert({
        key: 'tasks',
        data: updatedTasks,
        updated_at: new Date().toISOString(),
      });
      setCloudSynced(true);
    } catch {
      // fallback to local
    }
  }, []);

  const syncNotesToCloud = useCallback(async (updatedNotes: Note[]) => {
    if (!supabase || isInitialRemoteLoad.current) return;
    try {
      await supabase.from('taskhub_state').upsert({
        key: 'notes',
        data: updatedNotes,
        updated_at: new Date().toISOString(),
      });
      setCloudSynced(true);
    } catch {
      // fallback to local
    }
  }, []);

  const syncCostsToCloud = useCallback(async (updatedCosts: MonthlyCosts) => {
    if (!supabase || isInitialRemoteLoad.current) return;
    try {
      await supabase.from('taskhub_state').upsert({
        key: 'costs',
        data: updatedCosts,
        updated_at: new Date().toISOString(),
      });
      setCloudSynced(true);
    } catch {
      // fallback to local
    }
  }, []);

  const syncPortfolioToCloud = useCallback(async (updatedPortfolio: PortfolioProject[]) => {
    if (!supabase || isInitialRemoteLoad.current) return;
    try {
      await supabase.from('taskhub_state').upsert({
        key: 'portfolio',
        data: updatedPortfolio,
        updated_at: new Date().toISOString(),
      });
      setCloudSynced(true);
    } catch {
      // fallback to local
    }
  }, []);

  const handleSavePortfolio = (updated: PortfolioProject[]) => {
    setPortfolioProjects(updated);
    syncPortfolioToCloud(updated);
  };

  // Financial summary calculation
  const currentYm = new Date().toISOString().slice(0, 7);
  const currentMonthTasks = tasks.filter((t) => {
    const ym = t.createdAt ? t.createdAt.slice(0, 7) : '';
    const dueYm = t.dueDate ? t.dueDate.slice(0, 7) : '';
    return ym === currentYm || dueYm === currentYm;
  });

  const monthlyIncome = currentMonthTasks.reduce((sum, t) => sum + (t.price || 0), 0);
  const monthlyPaid = currentMonthTasks
    .filter((t) => t.status === 'paid')
    .reduce((sum, t) => sum + (t.price || 0), 0);
  const monthlyTotalCosts = (costs.zus || 0) + (costs.tax || 0);
  const monthlyNet = monthlyPaid - monthlyTotalCosts;

  // AI Command Handlers (From JC Studio)
  const handleAiAddTask = (taskData: {
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
    description?: string;
    notes?: string;
    subtasks?: string[];
  }) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const category = taskData.category || (taskData.price ? 'work' : 'personal');

    const notesParts: string[] = [];
    if (taskData.notes) notesParts.push(taskData.notes);
    if (taskData.dueTime) notesParts.push(`Godzina: ${taskData.dueTime}`);
    if (taskData.reminderTime) notesParts.push(`Przypomnienie: ${taskData.reminderTime}`);

    const newTask: Task = {
      id: Date.now().toString(),
      title: taskData.name,
      description: taskData.description,
      price: taskData.price,
      startDate: taskData.startDate || todayStr,
      dueDate: taskData.endDate || todayStr,
      dueTime: taskData.dueTime,
      reminderTime: taskData.reminderTime,
      category,
      priority: 'high',
      status: 'in_progress',
      subtasks: (taskData.subtasks || []).map((st, i) => ({
        id: `${Date.now()}-${i}`,
        title: st,
        completed: false,
      })),
      notes: notesParts.length > 0 ? notesParts.join(' • ') : undefined,
      remindByEmail: taskData.remindByEmail,
      emailReminderScheduledAt: taskData.emailReminderScheduledAt,
      emailReminderSentAt: taskData.emailReminderSentAt,
      emailReminderId: taskData.emailReminderId,
      createdAt: new Date().toISOString(),
    };
    const updated = [newTask, ...tasks];
    setTasks(updated);
    syncTasksToCloud(updated);
  };

  const handleAiAddTodo = (text: string) => {
    const newNote: Note = {
      id: Date.now().toString(),
      title: `To-Do (${new Date().toLocaleDateString('pl-PL')})`,
      content: `• ${text}`,
      updatedAt: new Date().toISOString(),
    };
    const updated = [newNote, ...notes];
    setNotes(updated);
    syncNotesToCloud(updated);
  };

  const handleAiAddCost = (costData: { name: string; cost: number; type: 'business' | 'private' }) => {
    const updated = {
      ...costs,
      zus: costData.type === 'business' ? costs.zus + costData.cost : costs.zus,
    };
    setCosts(updated);
    syncCostsToCloud(updated);
  };

  const handleAiAddNoteToTask = (taskName: string, text: string): boolean => {
    const taskMatch = tasks.find((t) => t.title.toLowerCase().includes(taskName.toLowerCase()));
    if (!taskMatch) return false;

    const updated = tasks.map((t) =>
      t.id === taskMatch.id
        ? {
            ...t,
            notes: (t.notes ? `${t.notes} | ` : '') + text,
          }
        : t
    );
    setTasks(updated);
    syncTasksToCloud(updated);
    return true;
  };

  const handleGetFinancialSummary = () => {
    return {
      income: monthlyIncome,
      paid: monthlyPaid,
      expenses: monthlyTotalCosts,
      net: monthlyNet,
    };
  };

  // Task Actions
  const handleToggleStatus = (id: string) => {
    const updated = tasks.map((t) => {
      if (t.id === id) {
        // Cycle: in_progress -> done -> paid -> todo
        const nextStatus: Record<Status, Status> = {
          todo: 'in_progress',
          in_progress: 'done',
          done: 'paid',
          paid: 'in_progress',
        };
        const newStatus = nextStatus[t.status];
        return {
          ...t,
          status: newStatus,
          completedAt: newStatus === 'done' || newStatus === 'paid' ? new Date().toISOString() : undefined,
        };
      }
      return t;
    });
    setTasks(updated);
    syncTasksToCloud(updated);
  };

  const handleUpdateStatus = (id: string, status: Status) => {
    const updated = tasks.map((t) =>
      t.id === id
        ? {
            ...t,
            status,
            completedAt: status === 'done' || status === 'paid' ? new Date().toISOString() : undefined,
          }
        : t
    );
    setTasks(updated);
    syncTasksToCloud(updated);
  };

  const handleToggleWaitingForFeedback = (id: string) => {
    const updated = tasks.map((t) =>
      t.id === id ? { ...t, isWaitingForFeedback: !t.isWaitingForFeedback } : t
    );
    setTasks(updated);
    syncTasksToCloud(updated);
  };

  const handleToggleSubtask = (taskId: string, subtaskId: string) => {
    const updated = tasks.map((t) => {
      if (t.id === taskId) {
        const updatedSubtasks = t.subtasks.map((st) =>
          st.id === subtaskId ? { ...st, completed: !st.completed } : st
        );
        return { ...t, subtasks: updatedSubtasks };
      }
      return t;
    });
    setTasks(updated);
    syncTasksToCloud(updated);
  };

  const handleSaveTask = (taskData: Omit<Task, 'id' | 'createdAt'> & { id?: string }) => {
    let updated: Task[];
    if (taskData.id) {
      updated = tasks.map((t) => {
        if (t.id === taskData.id) {
          const isNewlyCompleted =
            (taskData.status === 'paid' || taskData.status === 'done') &&
            (!t.completedAt || t.status !== taskData.status);
          return {
            ...t,
            ...taskData,
            completedAt: isNewlyCompleted ? new Date().toISOString() : taskData.completedAt || t.completedAt,
          };
        }
        return t;
      });
    } else {
      const isPaidOrDone = taskData.status === 'paid' || taskData.status === 'done';
      const newTask: Task = {
        id: Date.now().toString(),
        title: taskData.title,
        description: taskData.description,
        price: taskData.price,
        startDate: taskData.startDate,
        dueDate: taskData.dueDate,
        category: taskData.category,
        priority: taskData.priority,
        status: defaultStatusForNewTask || taskData.status || 'in_progress',
        isWaitingForFeedback: Boolean(taskData.isWaitingForFeedback),
        notes: taskData.notes,
        remindByEmail: taskData.remindByEmail,
        emailReminderSentAt: taskData.emailReminderSentAt,
        emailReminderScheduledAt: taskData.emailReminderScheduledAt,
        emailReminderId: taskData.emailReminderId,
        subtasks: taskData.subtasks || [],
        createdAt: new Date().toISOString(),
        completedAt: isPaidOrDone ? new Date().toISOString() : undefined,
      };
      updated = [newTask, ...tasks];
    }
    setTasks(updated);
    syncTasksToCloud(updated);
  };

  const handleDeleteTask = (id: string) => {
    const updated = tasks.filter((t) => t.id !== id);
    setTasks(updated);
    syncTasksToCloud(updated);
  };

  const handleOpenEdit = (task: Task) => {
    if (!task) return;
    setEditingTask(task);
    setIsTaskModalOpen(true);
  };

  const handleOpenNew = (status: Status = 'in_progress', category?: string) => {
    setDefaultStatusForNewTask(status);
    setDefaultCategoryForNewTask(category || (currentView === 'personal' ? 'personal' : 'work'));
    setEditingTask(null);
    setIsTaskModalOpen(true);
  };

  // Costs Save
  const handleSaveCosts = (newCosts: MonthlyCosts) => {
    setCosts(newCosts);
    syncCostsToCloud(newCosts);
  };

  // Export / Import
  const handleExportData = () => {
    const backup = { tasks, notes, costs, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `jc-studio-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (Array.isArray(data.tasks)) {
          setTasks(data.tasks);
          syncTasksToCloud(data.tasks);
        }
        if (Array.isArray(data.notes)) {
          setNotes(data.notes);
          syncNotesToCloud(data.notes);
        }
        if (data.costs) {
          setCosts(data.costs);
          syncCostsToCloud(data.costs);
        }
        alert('Kopia zapasowa została pomyślnie zaimportowana!');
      } catch {
        alert('Błąd podczas odczytu pliku kopii zapasowej.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Filtering and sorting for views (domyślnie sortowane od najbliższego terminu DDL)
  const todayStr = new Date().toISOString().split('T')[0];
  const todayTasks = sortTasksByClosestDeadline(
    tasks.filter((t) => t.dueDate === todayStr || t.status === 'in_progress')
  );
  const completedToday = todayTasks.filter((t) => t.status === 'done' || t.status === 'paid').length;

  const filteredTasks = sortTasksByClosestDeadline(
    tasks.filter((task) => {
      if (currentView === 'today') {
        const isDueToday = task.dueDate === todayStr;
        const isInProgress = task.status === 'in_progress';
        if (!isDueToday && !isInProgress) return false;
      }

      if (currentView === 'all') {
        // Tylko zlecenia i projekty komercyjne - wykluczamy sprawy osobiste
        if (task.category === 'personal') return false;
      }

      if (currentView === 'personal') {
        // Tylko sprawy osobiste
        if (task.category !== 'personal') return false;
      }

      if (selectedCategory && task.category !== selectedCategory) {
        return false;
      }

      if (statusFilter === 'in_progress' && task.status !== 'in_progress') return false;
      if (statusFilter === 'done' && task.status !== 'done') return false;
      if (statusFilter === 'paid' && task.status !== 'paid') return false;

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchTitle = task.title.toLowerCase().includes(query);
        const matchDesc = task.description?.toLowerCase().includes(query);
        const matchNotes = task.notes?.toLowerCase().includes(query);
        const matchPrice = task.price?.toString().includes(query);
        const matchDate = task.dueDate?.includes(query);
        return matchTitle || matchDesc || matchNotes || matchPrice || matchDate;
      }

      return true;
    })
  );

  // Client public portfolio check: when visiting /portfolio or ?portfolio, only show public portfolio view
  const isPublicPortfolio =
    typeof window !== 'undefined' &&
    (window.location.pathname.toLowerCase().includes('/portfolio') ||
      window.location.search.toLowerCase().includes('portfolio') ||
      window.location.hash.toLowerCase().includes('portfolio'));

  if (isPublicPortfolio) {
    return <PublicPortfolioView projects={portfolioProjects} />;
  }

  // Jeśli nie mamy jeszcze poświadczeń z localStorage i trwa pierwsze odpytanie Supabase w chmurze
  if (!isInitialAuthChecked) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0c0907] text-[#f5ede4] select-none">
        <div className="w-16 h-16 rounded-2xl bg-[#1e1713] border border-[#423326] flex items-center justify-center text-[#d99b5a] shadow-inner mb-4 animate-pulse">
          <Lock className="w-8 h-8 text-[#d99b5a]" />
        </div>
        <span className="text-xs font-mono uppercase tracking-[0.2em] text-[#d99b5a] mb-2 font-semibold">
          JC Studio • Security
        </span>
        <p className="text-xs text-[#9e8f82] flex items-center gap-2">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-[#d99b5a]" />
          Weryfikowanie chmury...
        </p>
      </div>
    );
  }

  // Wymóg hasła z haszem PBKDF2: jeśli panel jest zablokowany lub nie ma jeszcze hasła, pokaż ekran blokady
  if (!isAuthenticated) {
    return (
      <LockScreen
        storedCredentials={authCredentials}
        onAuthenticated={handleAuthenticated}
        onSaveCredentials={async (newCreds) => {
          // Ochrona: jeśli hasło już istnieje, zablokuj podmianę na inne hasło
          if (authCredentials?.hash && authCredentials.hash !== newCreds.hash) {
            console.warn('Próba nadpisania istniejącego hasła została zablokowana.');
            return;
          }
          setAuthCredentials(newCreds);
          saveStoredCredentials(newCreds);
          if (supabase) {
            try {
              await supabase
                .from('taskhub_state')
                .upsert(
                  {
                    key: 'auth',
                    data: newCreds,
                    updated_at: new Date().toISOString(),
                  },
                  { onConflict: 'key' }
                );
            } catch (err) {
              console.error('Supabase auth save error:', err);
            }
          }
        }}
      />
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0c0907] font-sans text-[#f5ede4] relative selection:bg-[#d99b5a]/35 selection:text-[#f5ede4]">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImportFile}
        accept=".json"
        className="hidden"
      />

      {/* Floating Vertical Capsule Dock (Kindra style & Mobile Drawer) */}
      <Sidebar
        currentView={currentView}
        onViewChange={setCurrentView}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        todayCount={todayTasks.filter((t) => t.status !== 'done' && t.status !== 'paid').length}
        totalCount={tasks.filter((t) => t.status !== 'done' && t.status !== 'paid').length}
        personalCount={tasks.filter((t) => t.category === 'personal' && t.status !== 'done' && t.status !== 'paid').length}
        monthlyRevenue={monthlyPaid}
        onOpenPhoneModal={() => setIsPhoneModalOpen(true)}
        onExportData={handleExportData}
        onImportData={() => fileInputRef.current?.click()}
        onOpenNewTaskModal={() => handleOpenNew('in_progress', currentView === 'personal' ? 'personal' : 'work')}
        onToggleSearch={() => {
          const el = document.querySelector('input[placeholder*="Szukaj"]') as HTMLInputElement;
          el?.focus();
        }}
        mobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
        onLockApp={handleLockApp}
        onOpenChangePassword={() => setIsChangePasswordOpen(true)}
      />

      {/* Main Content Area with offset for the floating dock & iPhone notch */}
      <main className="flex-1 flex flex-col h-full overflow-y-auto pb-24 md:pb-8 md:pl-[84px]">
        <div className="max-w-6xl w-full mx-auto px-3 sm:px-6 lg:px-8 pb-3 sm:pb-6 lg:pb-8 pt-mobile-safe">
          {/* Cloud Sync Status Indicator Pill */}
          <div className="flex items-center justify-between mb-4 px-4 py-2 rounded-full glass-pill text-xs">
            <div className="flex items-center gap-2">
              {isSupabaseConfigured ? (
                cloudSynced ? (
                  <>
                    <Cloud className="w-4 h-4 text-[#7ec29a]" />
                    <span className="text-[#9ee2b9] font-medium">Chmura aktywna</span>
                    <span className="text-[#7a6b5e] hidden sm:inline">• Synchronizacja PC & Telefon na żywo</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 text-[#d99b5a] animate-spin" />
                    <span className="text-[#f1c38e] font-medium">Łączenie z bazą Supabase...</span>
                  </>
                )
              ) : (
                <>
                  <CloudOff className="w-4 h-4 text-[#7a6b5e]" />
                  <span className="text-[#9e8f82]">Pamięć lokalna (Offline)</span>
                </>
              )}
            </div>

            <div className="flex items-center gap-2">
              {isSyncing && (
                <span className="text-[11px] text-[#d99b5a] animate-pulse font-medium mr-1">
                  Aktualizowanie...
                </span>
              )}

              {/* Security & Settings Actions */}
              <button
                onClick={() => setCurrentView('settings')}
                title="Ustawienia panelu"
                className={`p-1 rounded-full transition-colors ${
                  currentView === 'settings'
                    ? 'text-[#d99b5a] bg-[#251b14]'
                    : 'text-[#9e8f82] hover:text-[#d99b5a] hover:bg-[#251b14]'
                }`}
              >
                <Settings className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsChangePasswordOpen(true)}
                title="Zmień hasło dostępu"
                className="p-1 rounded-full text-[#9e8f82] hover:text-[#d99b5a] hover:bg-[#251b14] transition-colors"
              >
                <KeyRound className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleLockApp}
                title="Zablokuj panel"
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#251b14] hover:bg-[#322319] border border-[#3d2f24] text-[11px] text-[#d99b5a] hover:text-[#f5ede4] transition-all active:scale-95"
              >
                <Lock className="w-3 h-3 text-[#d99b5a]" />
                <span className="hidden sm:inline font-medium">Zablokuj</span>
              </button>
            </div>
          </div>

          {/* Automated Monthly Report Alert Banner */}
          {autoReportNotice && (
            <div className="mb-4 p-4 rounded-2xl bg-[#d99b5a]/15 border border-[#d99b5a]/40 text-[#f5ede4] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xl animate-in fade-in duration-300">
              <div className="flex items-center gap-2.5 text-xs">
                <span className="text-lg">📑</span>
                <span className="font-medium text-[#f5ede4]">{autoReportNotice}</span>
              </div>
              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  onClick={() => {
                    setCurrentView('finances');
                    setAutoReportNotice(null);
                  }}
                  className="px-3.5 py-1.5 rounded-full bg-[#f5ede4] hover:bg-white text-[#120e0a] text-xs font-semibold shadow-sm transition-all active:scale-95"
                >
                  Zobacz w Finansach →
                </button>
                <button
                  onClick={() => setAutoReportNotice(null)}
                  className="p-1 rounded-lg text-[#9e8f82] hover:text-[#f5ede4] transition-colors"
                  title="Zamknij powiadomienie"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {/* AI Voice & Text Assistant Bar (from JC Studio) */}
          <AiAssistantBar
            apiKey={apiKey}
            onSaveApiKey={setApiKey}
            onAddTask={handleAiAddTask}
            onAddTodo={handleAiAddTodo}
            onAddCost={handleAiAddCost}
            onAddNoteToTask={handleAiAddNoteToTask}
            onGetFinancialSummary={handleGetFinancialSummary}
          />

          <Header
            currentView={currentView}
            onViewChange={setCurrentView}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onOpenNewTaskModal={() => handleOpenNew('in_progress')}
            onOpenAiModal={() => setIsAiModalOpen(true)}
            onOpenPhoneModal={() => setIsPhoneModalOpen(true)}
            completedTodayCount={completedToday}
            totalTodayCount={todayTasks.length}
            todayCount={todayTasks.filter((t) => t.status !== 'done' && t.status !== 'paid').length}
            totalCount={tasks.filter((t) => t.status !== 'done' && t.status !== 'paid').length}
            monthlyRevenue={monthlyPaid}
          />

          {/* Interactive Financial & Order Status KPI Boxes (Kindra Overview Dashboard) */}
          {currentView === 'today' && (
            <FinanceSummaryBoxes
              tasks={tasks}
              costs={costs}
              statusFilter={statusFilter}
              onFilterChange={setStatusFilter}
              onSaveCosts={handleSaveCosts}
              onOpenFinancesView={() => setCurrentView('finances')}
            />
          )}

          {/* Active Views */}
          <div key={currentView} className="animate-slide-up">
            {currentView === 'portfolio_manager' ? (
            <PortfolioManagerView
              projects={portfolioProjects}
              onSaveProjects={handleSavePortfolio}
              onOpenClientPreview={() => {
                window.open(`${window.location.origin}/portfolio`, '_blank');
              }}
            />
          ) : currentView === 'offers' ? (
            <EmailOfferDrafterView apiKey={apiKey} />
          ) : currentView === 'settings' ? (
            <SettingsView
              storedCredentials={authCredentials}
              onCredentialsUpdated={async (newCreds) => {
                setAuthCredentials(newCreds);
                saveStoredCredentials(newCreds);
                if (supabase) {
                  try {
                    await supabase.from('taskhub_state').upsert({
                      key: 'auth_credentials',
                      data: newCreds,
                      updated_at: new Date().toISOString(),
                    });
                  } catch {}
                }
              }}
              onLockApp={handleLockApp}
              apiKey={apiKey}
              onSaveApiKey={setApiKey}
              cloudSynced={cloudSynced}
              isSyncing={isSyncing}
              onForceSync={async () => {
                setIsSyncing(true);
                try {
                  await syncTasksToCloud(tasks);
                  await syncNotesToCloud(notes);
                  await syncCostsToCloud(costs);
                  await syncPortfolioToCloud(portfolioProjects);
                  setCloudSynced(true);
                } finally {
                  setIsSyncing(false);
                }
              }}
              localIp="192.168.0.179"
              onExportData={handleExportData}
              onImportData={() => fileInputRef.current?.click()}
              tasksCount={tasks.filter((t) => t.category !== 'personal').length}
              personalCount={tasks.filter((t) => t.category === 'personal').length}
              notesCount={notes.length}
              costs={costs}
              onSaveCosts={handleSaveCosts}
            />
          ) : currentView === 'converter' ? (
            <ImageConverterView />
          ) : currentView === 'dwg_converter' ? (
            <DwgConverterView />
          ) : currentView === 'finances' ? (
            <FinancesView
              tasks={tasks}
              costs={costs}
              onSaveCosts={handleSaveCosts}
            />
          ) : currentView === 'timeline' ? (
            <TimelineView
              tasks={tasks}
              onEditTask={handleOpenEdit}
            />
          ) : currentView === 'pomodoro' ? (
            <PomodoroView tasks={tasks} />
          ) : currentView === 'all' || currentView === 'personal' ? (
            <div className="space-y-4">
              {/* Filter pills: Status, Category & Layout Switcher */}
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-[#2e231c]">
                <div className="flex flex-wrap items-center gap-2">
                  {/* Status Pills */}
                  <div className="flex items-center gap-1 glass-pill p-1 rounded-full border border-[#2e231c] text-xs">
                    <button
                      onClick={() => setStatusFilter('all')}
                      className={`px-3 py-1 rounded-full transition-all ${
                        statusFilter === 'all'
                          ? 'bg-[#f5ede4] text-[#120e0a] font-medium shadow-sm'
                          : 'text-[#9e8f82] hover:text-[#f5ede4]'
                      }`}
                    >
                      Wszystkie
                    </button>
                    <button
                      onClick={() => setStatusFilter('in_progress')}
                      className={`px-3 py-1 rounded-full transition-all ${
                        statusFilter === 'in_progress'
                          ? 'bg-[#f5ede4] text-[#120e0a] font-medium shadow-sm'
                          : 'text-[#9e8f82] hover:text-[#f5ede4]'
                      }`}
                    >
                      W toku
                    </button>
                    <button
                      onClick={() => setStatusFilter('done')}
                      className={`px-3 py-1 rounded-full transition-all ${
                        statusFilter === 'done'
                          ? 'bg-[#f5ede4] text-[#120e0a] font-medium shadow-sm'
                          : 'text-[#9e8f82] hover:text-[#f5ede4]'
                      }`}
                    >
                      Gotowe
                    </button>
                    <button
                      onClick={() => setStatusFilter('paid')}
                      className={`px-3 py-1 rounded-full transition-all ${
                        statusFilter === 'paid'
                          ? 'bg-[#f5ede4] text-[#120e0a] font-medium shadow-sm'
                          : 'text-[#9e8f82] hover:text-[#f5ede4]'
                      }`}
                    >
                      Opłacone
                    </button>
                  </div>

                  {/* Layout Mode Switch: Tabela (Default) vs Karty */}
                  <div className="flex items-center gap-1 glass-pill p-1 rounded-full border border-[#2e231c] text-xs">
                    <button
                      onClick={() => setTasksLayoutMode('table')}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-full transition-all ${
                        tasksLayoutMode === 'table'
                          ? 'bg-[#f5ede4] text-[#120e0a] font-medium shadow-sm'
                          : 'text-[#9e8f82] hover:text-[#f5ede4]'
                      }`}
                      title="Widok tabeli"
                    >
                      <Table className="w-3.5 h-3.5" />
                      <span>Tabela</span>
                    </button>
                    <button
                      onClick={() => setTasksLayoutMode('cards')}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-full transition-all ${
                        tasksLayoutMode === 'cards'
                          ? 'bg-[#f5ede4] text-[#120e0a] font-medium shadow-sm'
                          : 'text-[#9e8f82] hover:text-[#f5ede4]'
                      }`}
                      title="Widok kafelków"
                    >
                      <LayoutGrid className="w-3.5 h-3.5" />
                      <span>Karty</span>
                    </button>
                  </div>
                </div>

                {/* Categories filter (only for Zlecenia & Projekty) */}
                {currentView === 'all' && (
                  <div className="flex items-center gap-1.5 overflow-x-auto max-w-full py-1">
                    <button
                      onClick={() => setSelectedCategory(null)}
                      className={`px-3 py-1 rounded-full text-xs font-medium border whitespace-nowrap transition-all ${
                        selectedCategory === null
                          ? 'bg-[#f5ede4] text-[#120e0a] border-[#f5ede4] font-semibold shadow-sm'
                          : 'glass-pill text-[#9e8f82] border-[#2e231c] hover:text-[#f5ede4] hover:bg-[#251b14]'
                      }`}
                    >
                      Wszystkie kategorie
                    </button>
                    {CATEGORIES.filter((c) => c.id !== 'personal').map((cat) => {
                      const isSelected = selectedCategory === cat.id;
                      return (
                        <button
                          key={cat.id}
                          onClick={() => setSelectedCategory(isSelected ? null : cat.id)}
                          className={`px-3 py-1 rounded-full text-xs font-medium border whitespace-nowrap transition-all ${
                            isSelected
                              ? 'bg-[#f5ede4] text-[#120e0a] border-[#f5ede4] font-semibold shadow-sm'
                              : `${cat.color} hover:opacity-100`
                          }`}
                        >
                          {cat.name}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* View Rendering: Table (Default) or Cards */}
              {tasksLayoutMode === 'table' ? (
                <TaskTable
                  tasks={filteredTasks}
                  onToggleStatus={handleToggleStatus}
                  onUpdateStatus={handleUpdateStatus}
                  onToggleSubtask={handleToggleSubtask}
                  onEdit={handleOpenEdit}
                  onDelete={handleDeleteTask}
                  onOpenNew={() => handleOpenNew('in_progress', currentView === 'personal' ? 'personal' : 'work')}
                  onToggleWaitingForFeedback={handleToggleWaitingForFeedback}
                />
              ) : filteredTasks.length === 0 ? (
                <div className="py-16 text-center flex flex-col items-center justify-center border border-dashed border-[#2e231c] rounded-3xl p-6">
                  <h3 className="text-base font-light text-[#f5ede4]">
                    {currentView === 'personal' ? 'Brak spraw osobistych' : 'Brak zleceń do wyświetlenia'}
                  </h3>
                  <p className="text-xs text-[#9e8f82] max-w-sm mt-1">
                    {currentView === 'personal'
                      ? 'Nie masz obecnie żadnych prywatnych spraw ani wizyt w tej sekcji.'
                      : 'Nie znaleziono zleceń spełniających wybrane kryteria filtrów.'}
                  </p>
                  <button
                    onClick={() => handleOpenNew('in_progress', currentView === 'personal' ? 'personal' : 'work')}
                    className="mt-4 flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#f5ede4] hover:bg-white text-[#120e0a] text-xs font-medium shadow-md transition-all active:scale-95"
                  >
                    + {currentView === 'personal' ? 'Dodaj sprawę osobistą' : 'Dodaj nowe zlecenie'}
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onToggleStatus={handleToggleStatus}
                      onUpdateStatus={handleUpdateStatus}
                      onToggleSubtask={handleToggleSubtask}
                      onEdit={handleOpenEdit}
                      onDelete={handleDeleteTask}
                      onToggleWaitingForFeedback={handleToggleWaitingForFeedback}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <RecentActivityAndGoals
                tasks={tasks}
                onNavigateToFinances={() => setCurrentView('finances')}
              />

              {/* Today's active tasks section */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between pb-2 border-b border-[#2e231c]">
                  <h3 className="text-sm font-medium text-[#f5ede4]">
                    Zlecenia w toku & na dziś ({todayTasks.length})
                  </h3>
                  <button
                    onClick={() => setCurrentView('all')}
                    className="text-xs text-[#d99b5a] hover:text-[#f1c38e] transition-colors"
                  >
                    Zobacz wszystkie zlecenia →
                  </button>
                </div>

                <TaskTable
                  tasks={todayTasks}
                  onToggleStatus={handleToggleStatus}
                  onUpdateStatus={handleUpdateStatus}
                  onToggleSubtask={handleToggleSubtask}
                  onEdit={handleOpenEdit}
                  onDelete={handleDeleteTask}
                  onOpenNew={() => handleOpenNew('in_progress')}
                  onToggleWaitingForFeedback={handleToggleWaitingForFeedback}
                />
              </div>
            </div>
          )}
          </div>
        </div>
      </main>

      {/* Mobile Floating Quick Action Capsule (FAB with Menu + Plus + Mic) */}
      <MobileQuickActions
        currentView={currentView}
        onOpenMobileMenu={() => setIsMobileMenuOpen((prev) => !prev)}
        onQuickAdd={() => handleOpenNew('in_progress')}
        apiKey={apiKey}
        onAddTask={handleAiAddTask}
        onAddTodo={handleAiAddTodo}
        onAddCost={handleAiAddCost}
        onAddNoteToTask={handleAiAddNoteToTask}
      />

      <ErrorBoundary
        fallbackMessage="Wystąpił problem podczas edycji zlecenia"
        onReset={() => {
          setIsTaskModalOpen(false);
          setEditingTask(null);
        }}
      >
        <TaskModal
          isOpen={isTaskModalOpen}
          onClose={() => {
            setIsTaskModalOpen(false);
            setEditingTask(null);
          }}
          onSave={handleSaveTask}
          initialTask={editingTask}
          defaultCategory={defaultCategoryForNewTask}
        />
      </ErrorBoundary>

      <AiTaskModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        onAddTask={handleSaveTask}
        savedApiKey={apiKey}
        onSaveApiKey={setApiKey}
      />

      <ConnectPhoneModal
        isOpen={isPhoneModalOpen}
        onClose={() => setIsPhoneModalOpen(false)}
        localIp="192.168.0.179"
      />

      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
        storedCredentials={authCredentials}
        onCredentialsUpdated={async (newCreds) => {
          setAuthCredentials(newCreds);
          saveStoredCredentials(newCreds);
          if (supabase) {
            try {
              await supabase
                .from('taskhub_state')
                .upsert(
                  {
                    key: 'auth',
                    data: newCreds,
                    updated_at: new Date().toISOString(),
                  },
                  { onConflict: 'key' }
                );
            } catch (err) {
              console.error('Supabase auth update error:', err);
            }
          }
        }}
      />

      {/* Floating Pomodoro Widget when working in other views */}
      <PomodoroFloatingWidget
        currentView={currentView}
        onNavigateToPomodoro={() => setCurrentView('pomodoro')}
        tasks={tasks}
      />
    </div>
  );
}

export default App;
