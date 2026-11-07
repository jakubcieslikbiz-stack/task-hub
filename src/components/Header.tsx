import React from 'react';
import type { ViewMode } from '../types';
import { Search, Plus, Smartphone, Sparkles, X } from 'lucide-react';

interface HeaderProps {
  currentView: ViewMode;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenNewTaskModal: () => void;
  onOpenPhoneModal: () => void;
  completedTodayCount: number;
  totalTodayCount: number;
}

const VIEW_TITLES: Record<ViewMode, { title: string; subtitle: string }> = {
  today: { title: 'Mój Dzień', subtitle: 'Skup się na tym, co najważniejsze na dzisiaj' },
  all: { title: 'Wszystkie Zadania', subtitle: 'Pełny przegląd Twoich projektów i celów' },
  kanban: { title: 'Tablica Kanban', subtitle: 'Wizualizuj i przesuwaj postęp prac' },
  notes: { title: 'Szybkie Notatki', subtitle: 'Zapiski, linki i szkice w jednym miejscu' },
};

export const Header: React.FC<HeaderProps> = ({
  currentView,
  searchQuery,
  onSearchChange,
  onOpenNewTaskModal,
  onOpenPhoneModal,
  completedTodayCount,
  totalTodayCount,
}) => {
  const { title, subtitle } = VIEW_TITLES[currentView];
  const percent = totalTodayCount > 0 ? Math.round((completedTodayCount / totalTodayCount) * 100) : 0;

  return (
    <header className="space-y-4 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Title & Today stats */}
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {title}
            </h1>
            {currentView === 'today' && totalTodayCount > 0 && (
              <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Sparkles className="w-3.5 h-3.5" />
                {percent}% zrobione
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">{subtitle}</p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenPhoneModal}
            className="md:hidden flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 text-indigo-400 border border-slate-700 text-xs font-semibold active:scale-95 transition-all"
            title="Otwórz na telefonie"
          >
            <Smartphone className="w-4 h-4" />
            <span>Telefon</span>
          </button>

          <button
            onClick={onOpenNewTaskModal}
            className="hidden sm:flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-indigo-500/25 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Nowe zadanie</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      {currentView !== 'notes' && (
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Szukaj zadań po nazwie, opisie lub dacie..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-9 py-2 rounded-xl bg-slate-900/90 border border-slate-800 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
    </header>
  );
};
