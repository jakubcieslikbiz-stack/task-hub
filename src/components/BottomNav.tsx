import React from 'react';
import type { ViewMode } from '../types';
import { Calendar, CheckSquare, Clock, DollarSign, StickyNote, Plus, Image as ImageIcon } from 'lucide-react';

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
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 px-2 py-2 pb-safe flex items-center justify-around shadow-2xl">
      <button
        onClick={() => onViewChange('today')}
        className={`flex flex-col items-center gap-0.5 py-1 px-1.5 transition-colors ${
          currentView === 'today' ? 'text-indigo-400 font-bold' : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <Calendar className="w-4 h-4" />
        <span className="text-[9px]">Dziś</span>
      </button>

      <button
        onClick={() => onViewChange('all')}
        className={`flex flex-col items-center gap-0.5 py-1 px-1.5 transition-colors ${
          currentView === 'all' ? 'text-indigo-400 font-bold' : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <CheckSquare className="w-4 h-4" />
        <span className="text-[9px]">Zlecenia</span>
      </button>

      <button
        onClick={() => onViewChange('timeline')}
        className={`flex flex-col items-center gap-0.5 py-1 px-1.5 transition-colors ${
          currentView === 'timeline' ? 'text-indigo-400 font-bold' : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <Clock className="w-4 h-4" />
        <span className="text-[9px]">Timeline</span>
      </button>

      {/* Floating Center Action Button */}
      <div className="-mt-5">
        <button
          onClick={onQuickAdd}
          className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white shadow-xl shadow-indigo-500/40 border-4 border-slate-950 flex items-center justify-center active:scale-90 transition-transform"
          title="Dodaj zlecenie"
        >
          <Plus className="w-5 h-5 stroke-[2.5]" />
        </button>
      </div>

      <button
        onClick={() => onViewChange('finances')}
        className={`flex flex-col items-center gap-0.5 py-1 px-1.5 transition-colors ${
          currentView === 'finances' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <DollarSign className="w-4 h-4" />
        <span className="text-[9px]">Finanse</span>
      </button>

      <button
        onClick={() => onViewChange('notes')}
        className={`flex flex-col items-center gap-0.5 py-1 px-1.5 transition-colors ${
          currentView === 'notes' ? 'text-indigo-400 font-bold' : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <StickyNote className="w-4 h-4" />
        <span className="text-[9px]">Notatki</span>
      </button>

      <button
        onClick={() => onViewChange('converter')}
        className={`flex flex-col items-center gap-0.5 py-1 px-1.5 transition-colors ${
          currentView === 'converter' ? 'text-purple-400 font-bold' : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <ImageIcon className="w-4 h-4" />
        <span className="text-[9px]">Konwerter</span>
      </button>
    </nav>
  );
};
