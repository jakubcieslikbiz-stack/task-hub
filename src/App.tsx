import React, { useState, useEffect, useRef } from 'react';
import type { Task, Note, ViewMode, Status } from './types';
import { INITIAL_TASKS, INITIAL_NOTES, CATEGORIES } from './data/initialData';
import { Sidebar } from './components/Sidebar';
import { BottomNav } from './components/BottomNav';
import { Header } from './components/Header';
import { TaskCard } from './components/TaskCard';
import { KanbanBoard } from './components/KanbanBoard';
import { QuickNotes } from './components/QuickNotes';
import { TaskModal } from './components/TaskModal';
import { ConnectPhoneModal } from './components/ConnectPhoneModal';
import { Plus, CheckCircle2 } from 'lucide-react';

export function App() {
  // Load tasks from localStorage or initial
  const [tasks, setTasks] = useState<Task[]>(() => {
    try {
      const saved = localStorage.getItem('taskhub_tasks');
      return saved ? JSON.parse(saved) : INITIAL_TASKS;
    } catch {
      return INITIAL_TASKS;
    }
  });

  // Load notes from localStorage or initial
  const [notes, setNotes] = useState<Note[]>(() => {
    try {
      const saved = localStorage.getItem('taskhub_notes');
      return saved ? JSON.parse(saved) : INITIAL_NOTES;
    } catch {
      return INITIAL_NOTES;
    }
  });

  // Navigation and Filter state
  const [currentView, setCurrentView] = useState<ViewMode>('today');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'done'>('all');

  // Modals state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false);
  const [defaultStatusForNewTask, setDefaultStatusForNewTask] = useState<Status>('todo');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync tasks to LocalStorage
  useEffect(() => {
    localStorage.setItem('taskhub_tasks', JSON.stringify(tasks));
  }, [tasks]);

  // Sync notes to LocalStorage
  useEffect(() => {
    localStorage.setItem('taskhub_notes', JSON.stringify(notes));
  }, [notes]);

  // Date helpers
  const todayStr = new Date().toISOString().split('T')[0];
  const todayTasks = tasks.filter((t) => t.dueDate === todayStr || t.status === 'in_progress');
  const completedToday = todayTasks.filter((t) => t.status === 'done').length;

  // Task Actions
  const handleToggleStatus = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const isDone = t.status === 'done';
          return {
            ...t,
            status: isDone ? 'todo' : 'done',
            completedAt: !isDone ? new Date().toISOString() : undefined,
          };
        }
        return t;
      })
    );
  };

  const handleUpdateStatus = (id: string, status: Status) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              status,
              completedAt: status === 'done' ? new Date().toISOString() : undefined,
            }
          : t
      )
    );
  };

  const handleToggleSubtask = (taskId: string, subtaskId: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const updatedSubtasks = t.subtasks.map((st) =>
            st.id === subtaskId ? { ...st, completed: !st.completed } : st
          );
          return { ...t, subtasks: updatedSubtasks };
        }
        return t;
      })
    );
  };

  const handleSaveTask = (taskData: Omit<Task, 'id' | 'createdAt'> & { id?: string }) => {
    if (taskData.id) {
      // Edit existing
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskData.id
            ? {
                ...t,
                ...taskData,
              }
            : t
        )
      );
    } else {
      // Create new
      const newTask: Task = {
        id: Date.now().toString(),
        title: taskData.title,
        description: taskData.description,
        category: taskData.category,
        priority: taskData.priority,
        status: defaultStatusForNewTask || taskData.status || 'todo',
        dueDate: taskData.dueDate,
        subtasks: taskData.subtasks || [],
        createdAt: new Date().toISOString(),
      };
      setTasks((prev) => [newTask, ...prev]);
    }
  };

  const handleDeleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const handleOpenEdit = (task: Task) => {
    setEditingTask(task);
    setIsTaskModalOpen(true);
  };

  const handleOpenNew = (status: Status = 'todo') => {
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
    setNotes((prev) => [newNote, ...prev]);
  };

  const handleUpdateNote = (id: string, content: string, title: string) => {
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, content, title, updatedAt: new Date().toISOString() } : n))
    );
  };

  const handleDeleteNote = (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
  };

  // Export / Import Backup Data
  const handleExportData = () => {
    const backup = { tasks, notes, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `taskhub-backup-${todayStr}.json`;
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
        if (Array.isArray(data.tasks)) setTasks(data.tasks);
        if (Array.isArray(data.notes)) setNotes(data.notes);
        alert('Kopia zapasowa została pomyślnie zaimportowana!');
      } catch {
        alert('Błąd podczas odczytu pliku kopii zapasowej.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Filtering for views
  const filteredTasks = tasks.filter((task) => {
    // View filtering
    if (currentView === 'today') {
      const isDueToday = task.dueDate === todayStr;
      const isInProgress = task.status === 'in_progress';
      if (!isDueToday && !isInProgress) return false;
    }

    // Category filter
    if (selectedCategory && task.category !== selectedCategory) {
      return false;
    }

    // Status filter
    if (statusFilter === 'active' && task.status === 'done') return false;
    if (statusFilter === 'done' && task.status !== 'done') return false;

    // Search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchTitle = task.title.toLowerCase().includes(query);
      const matchDesc = task.description?.toLowerCase().includes(query);
      const matchDate = task.dueDate?.includes(query);
      return matchTitle || matchDesc || matchDate;
    }

    return true;
  });

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 font-sans text-slate-100">
      {/* Hidden file input for import */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImportFile}
        accept=".json"
        className="hidden"
      />

      {/* Desktop Sidebar */}
      <Sidebar
        currentView={currentView}
        onViewChange={setCurrentView}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        todayCount={todayTasks.filter((t) => t.status !== 'done').length}
        totalCount={tasks.filter((t) => t.status !== 'done').length}
        onOpenPhoneModal={() => setIsPhoneModalOpen(true)}
        onExportData={handleExportData}
        onImportData={() => fileInputRef.current?.click()}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-y-auto pb-24 md:pb-8">
        <div className="max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-8">
          <Header
            currentView={currentView}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onOpenNewTaskModal={() => handleOpenNew('todo')}
            onOpenPhoneModal={() => setIsPhoneModalOpen(true)}
            completedTodayCount={completedToday}
            totalTodayCount={todayTasks.length}
          />

          {/* Filter Pills (for 'all' or 'today' view) */}
          {currentView !== 'notes' && currentView !== 'kanban' && (
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-2 border-b border-slate-800/60">
              {/* Status pills */}
              <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-3 py-1 rounded-lg transition-colors ${
                    statusFilter === 'all' ? 'bg-indigo-600 text-white font-medium' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Wszystkie
                </button>
                <button
                  onClick={() => setStatusFilter('active')}
                  className={`px-3 py-1 rounded-lg transition-colors ${
                    statusFilter === 'active' ? 'bg-indigo-600 text-white font-medium' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Aktywne
                </button>
                <button
                  onClick={() => setStatusFilter('done')}
                  className={`px-3 py-1 rounded-lg transition-colors ${
                    statusFilter === 'done' ? 'bg-indigo-600 text-white font-medium' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Ukończone
                </button>
              </div>

              {/* Mobile Category chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto max-w-full py-1">
                {CATEGORIES.map((cat) => {
                  const isSelected = selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(isSelected ? null : cat.id)}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium border whitespace-nowrap transition-all ${
                        isSelected
                          ? 'bg-slate-200 text-slate-950 border-white'
                          : `${cat.color} opacity-80 hover:opacity-100`
                      }`}
                    >
                      {cat.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Render Active View */}
          {currentView === 'notes' ? (
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
            /* List View (Today or All) */
            <div className="space-y-3">
              {filteredTasks.length === 0 ? (
                <div className="py-20 text-center flex flex-col items-center justify-center border border-dashed border-slate-800 rounded-3xl p-6">
                  <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 mb-3">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-semibold text-slate-300">Brak zadań do wyświetlenia</h3>
                  <p className="text-xs text-slate-500 max-w-sm mt-1">
                    {currentView === 'today'
                      ? 'Wszystko zrobione na dzisiaj lub nie zaplanowałeś jeszcze zadań.'
                      : 'Nie znaleziono zadań spełniających wybrane kryteria.'}
                  </p>
                  <button
                    onClick={() => handleOpenNew('todo')}
                    className="mt-4 flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20"
                  >
                    <Plus className="w-4 h-4" />
                    Dodaj nowe zadanie
                  </button>
                </div>
              ) : (
                filteredTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onToggleStatus={handleToggleStatus}
                    onUpdateStatus={handleUpdateStatus}
                    onToggleSubtask={handleToggleSubtask}
                    onEdit={handleOpenEdit}
                    onDelete={handleDeleteTask}
                  />
                ))
              )}
            </div>
          )}
        </div>
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <BottomNav
        currentView={currentView}
        onViewChange={setCurrentView}
        onQuickAdd={() => handleOpenNew('todo')}
      />

      {/* Task Modal (Add/Edit) */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSave={handleSaveTask}
        initialTask={editingTask}
      />

      {/* Phone Connect Modal with QR */}
      <ConnectPhoneModal
        isOpen={isPhoneModalOpen}
        onClose={() => setIsPhoneModalOpen(false)}
        localIp="192.168.0.179"
      />
    </div>
  );
}

export default App;
