import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { Task, Note, ViewMode, Status, MonthlyCosts, PortfolioProject } from './types';
import { INITIAL_TASKS, INITIAL_NOTES } from './data/initialData';
import { INITIAL_PORTFOLIO_PROJECTS } from './data/initialPortfolio';
import { Sidebar } from './components/Sidebar';
import { BottomNav } from './components/BottomNav';
import { Header } from './components/Header';
import { KanbanBoard } from './components/KanbanBoard';
import { TimelineView } from './components/TimelineView';
import { FinancesView } from './components/FinancesView';
import { QuickNotes } from './components/QuickNotes';
import { ImageConverterView } from './components/ImageConverterView';
import { EmailOfferDrafterView } from './components/EmailOfferDrafterView';
import { PublicPortfolioView } from './components/PublicPortfolioView';
import { PortfolioManagerView } from './components/PortfolioManagerView';
import { PomodoroView } from './components/PomodoroView';
import { RecentActivityAndGoals } from './components/RecentActivityAndGoals';
import { TaskModal } from './components/TaskModal';
import { AiAssistantBar } from './components/AiAssistantBar';
import { AiTaskModal } from './components/AiTaskModal';
import { ConnectPhoneModal } from './components/ConnectPhoneModal';
import { FinanceSummaryBoxes } from './components/FinanceSummaryBoxes';
import { Cloud, CloudOff, RefreshCw } from 'lucide-react';
import { supabase, isSupabaseConfigured } from './lib/supabase';

const DEFAULT_API_KEY = '';

export function App() {
  // Tasks state
  const [tasks, setTasks] = useState<Task[]>(() => {
    try {
      const saved = localStorage.getItem('taskhub_tasks');
      return saved ? JSON.parse(saved) : INITIAL_TASKS;
    } catch {
      return INITIAL_TASKS;
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
    return localStorage.getItem('openai_api_key') || DEFAULT_API_KEY;
  });

  const [cloudSynced, setCloudSynced] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Navigation and Filter state
  const [currentView, setCurrentView] = useState<ViewMode>('today');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'in_progress' | 'done' | 'paid'>('all');

  // Modals state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false);
  const [defaultStatusForNewTask, setDefaultStatusForNewTask] = useState<Status>('in_progress');

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

          if (tasksRow && Array.isArray(tasksRow.data)) {
            setTasks(tasksRow.data);
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
    price?: number;
    startDate?: string;
    endDate?: string;
    remindByEmail?: boolean;
  }) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const newTask: Task = {
      id: Date.now().toString(),
      title: taskData.name,
      price: taskData.price,
      startDate: taskData.startDate || todayStr,
      dueDate: taskData.endDate || todayStr,
      category: 'work',
      priority: 'high',
      status: 'in_progress',
      subtasks: [],
      notes: 'Dodane przez Asystenta AI ✨',
      remindByEmail: taskData.remindByEmail,
      emailReminderSentAt: taskData.remindByEmail ? new Date().toISOString() : undefined,
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
      updated = tasks.map((t) =>
        t.id === taskData.id ? { ...t, ...taskData } : t
      );
    } else {
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
        notes: taskData.notes,
        remindByEmail: taskData.remindByEmail,
        emailReminderSentAt: taskData.emailReminderSentAt,
        subtasks: taskData.subtasks || [],
        createdAt: new Date().toISOString(),
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
    setEditingTask(task);
    setIsTaskModalOpen(true);
  };

  const handleOpenNew = (status: Status = 'in_progress') => {
    setDefaultStatusForNewTask(status);
    setEditingTask(null);
    setIsTaskModalOpen(true);
  };

  // Notes Actions
  const handleAddNote = (newNoteData: Omit<Note, 'id' | 'updatedAt'>) => {
    const newNote: Note = {
      id: Date.now().toString(),
      title: newNoteData.title,
      content: newNoteData.content,
      updatedAt: new Date().toISOString(),
    };
    const updated = [newNote, ...notes];
    setNotes(updated);
    syncNotesToCloud(updated);
  };

  const handleUpdateNote = (id: string, content: string, title: string) => {
    const updated = notes.map((n) =>
      n.id === id ? { ...n, content, title, updatedAt: new Date().toISOString() } : n
    );
    setNotes(updated);
    syncNotesToCloud(updated);
  };

  const handleDeleteNote = (id: string) => {
    const updated = notes.filter((n) => n.id !== id);
    setNotes(updated);
    syncNotesToCloud(updated);
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

  // Filtering for views
  const todayStr = new Date().toISOString().split('T')[0];
  const todayTasks = tasks.filter((t) => t.dueDate === todayStr || t.status === 'in_progress');
  const completedToday = todayTasks.filter((t) => t.status === 'done' || t.status === 'paid').length;

  const filteredTasks = tasks.filter((task) => {
    if (currentView === 'today') {
      const isDueToday = task.dueDate === todayStr;
      const isInProgress = task.status === 'in_progress';
      if (!isDueToday && !isInProgress) return false;
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
  });

  // Client public portfolio check: when visiting /portfolio or ?portfolio, only show public portfolio view
  const isPublicPortfolio =
    typeof window !== 'undefined' &&
    (window.location.pathname.toLowerCase().includes('/portfolio') ||
      window.location.search.toLowerCase().includes('portfolio') ||
      window.location.hash.toLowerCase().includes('portfolio'));

  if (isPublicPortfolio) {
    return <PublicPortfolioView projects={portfolioProjects} />;
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

      {/* Floating Vertical Capsule Dock (Kindra style) */}
      <Sidebar
        currentView={currentView}
        onViewChange={setCurrentView}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        todayCount={todayTasks.filter((t) => t.status !== 'done' && t.status !== 'paid').length}
        totalCount={tasks.filter((t) => t.status !== 'done' && t.status !== 'paid').length}
        monthlyRevenue={monthlyPaid}
        onOpenPhoneModal={() => setIsPhoneModalOpen(true)}
        onExportData={handleExportData}
        onImportData={() => fileInputRef.current?.click()}
        onOpenNewTaskModal={() => handleOpenNew('in_progress')}
        onToggleSearch={() => {
          const el = document.querySelector('input[placeholder*="Szukaj"]') as HTMLInputElement;
          el?.focus();
        }}
      />

      {/* Main Content Area with offset for the floating dock */}
      <main className="flex-1 flex flex-col h-full overflow-y-auto pb-24 md:pb-8 md:pl-[84px]">
        <div className="max-w-6xl w-full mx-auto p-3 sm:p-6 lg:p-8">
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

            {isSyncing && (
              <span className="text-[11px] text-[#d99b5a] animate-pulse font-medium">
                Aktualizowanie...
              </span>
            )}
          </div>

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
          ) : currentView === 'converter' ? (
            <ImageConverterView />
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
          ) : currentView === 'notes' ? (
            <QuickNotes
              notes={notes}
              onAddNote={handleAddNote}
              onUpdateNote={handleUpdateNote}
              onDeleteNote={handleDeleteNote}
            />
          ) : currentView === 'kanban' ? (
            <KanbanBoard
              tasks={filteredTasks}
              onToggleStatus={handleToggleStatus}
              onUpdateStatus={handleUpdateStatus}
              onToggleSubtask={handleToggleSubtask}
              onEdit={handleOpenEdit}
              onDelete={handleDeleteTask}
              onAddNewWithStatus={(status) => handleOpenNew(status)}
            />
          ) : (
            <RecentActivityAndGoals
              tasks={tasks}
              onNavigateToFinances={() => setCurrentView('finances')}
            />
          )}
        </div>
      </main>

      <BottomNav
        currentView={currentView}
        onViewChange={setCurrentView}
        onQuickAdd={() => handleOpenNew('in_progress')}
      />

      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSave={handleSaveTask}
        initialTask={editingTask}
      />

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
    </div>
  );
}

export default App;
