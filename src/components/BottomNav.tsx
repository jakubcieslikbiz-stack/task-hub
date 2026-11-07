import React from 'react';
import type { ViewMode } from '../types';
import { Calendar, CheckSquare, Columns3, StickyNote, Plus } from 'lucide-react';

interface BottomNavProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  onQuickAdd: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentView,
  onViewChange,
  onQuickAdd,
}) => {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 px-4 py-2 pb-safe flex items-center justify-around shadow-2xl">
      <button
        onClick={() => onViewChange('today')}
        className={`flex flex-col items-center gap-1 py-1 px-2 transition-colors ${
          currentView === 'today' ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <Calendar className="w-5 h-5" />
        <span className="text-[10px] font-medium">Dziś</span>
      </button>

      <button
        onClick={() => onViewChange('all')}
        className={`flex flex-col items-center gap-1 py-1 px-2 transition-colors ${
          currentView === 'all' ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <CheckSquare className="w-5 h-5" />
        <span className="text-[10px] font-medium">Zadania</span>
      </button>

      {/* Floating Center Action Button */}
      <div className="-mt-6">
        <button
          onClick={onQuickAdd}
          className="w-13 h-13 p-3 rounded-full bg-gradient-to-tr from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white shadow-xl shadow-indigo-500/40 border-4 border-slate-950 flex items-center justify-center active:scale-90 transition-transform"
          title="Dodaj zadanie"
        >
          <Plus className="w-6 h-6 stroke-[2.5]" />
        </button>
      </div>

      <button
        onClick={() => onViewChange('kanban')}
        className={`flex flex-col items-center gap-1 py-1 px-2 transition-colors ${
          currentView === 'kanban' ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <Columns3 className="w-5 h-5" />
        <span className="text-[10px] font-medium">Tablica</span>
      </button>

      <button
        onClick={() => onViewChange('notes')}
        className={`flex flex-col items-center gap-1 py-1 px-2 transition-colors ${
          currentView === 'notes' ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <StickyNote className="w-5 h-5" />
        <span className="text-[10px] font-medium">Notatki</span>
      </button>
    </nav>
  );
};
