import React from 'react';
import type { ViewMode } from '../types';
import { Calendar, CheckSquare, Timer, Clock, DollarSign, Plus, Image as ImageIcon, MailCheck } from 'lucide-react';

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
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#140f0c]/95 backdrop-blur-2xl border-t border-[#2e231c] px-2 py-2 pb-safe flex items-center justify-around shadow-2xl">
      <button
        onClick={() => onViewChange('today')}
        className={`flex flex-col items-center gap-0.5 py-1 px-1.5 transition-colors ${
          currentView === 'today' ? 'text-[#f5ede4] font-semibold' : 'text-[#9e8f82] hover:text-[#f5ede4]'
        }`}
      >
        <Calendar className="w-4 h-4" />
        <span className="text-[9px]">Dziś</span>
      </button>

      <button
        onClick={() => onViewChange('all')}
        className={`flex flex-col items-center gap-0.5 py-1 px-1.5 transition-colors ${
          currentView === 'all' ? 'text-[#f5ede4] font-semibold' : 'text-[#9e8f82] hover:text-[#f5ede4]'
        }`}
      >
        <CheckSquare className="w-4 h-4" />
        <span className="text-[9px]">Zlecenia</span>
      </button>

      <button
        onClick={() => onViewChange('pomodoro')}
        className={`flex flex-col items-center gap-0.5 py-1 px-1.5 transition-colors ${
          currentView === 'pomodoro' ? 'text-[#f5ede4] font-semibold' : 'text-[#9e8f82] hover:text-[#f5ede4]'
        }`}
      >
        <Timer className="w-4 h-4" />
        <span className="text-[9px]">Pomodoro</span>
      </button>

      {/* Floating Center Action Button (Warm bone cream) */}
      <div className="-mt-6">
        <button
          onClick={onQuickAdd}
          className="w-12 h-12 rounded-full bg-[#f5ede4] hover:bg-white text-[#120e0a] shadow-2xl border-4 border-[#0c0907] flex items-center justify-center active:scale-90 transition-transform"
          title="Dodaj zlecenie"
        >
          <Plus className="w-5 h-5 stroke-[2.5]" />
        </button>
      </div>

      <button
        onClick={() => onViewChange('timeline')}
        className={`flex flex-col items-center gap-0.5 py-1 px-1.5 transition-colors ${
          currentView === 'timeline' ? 'text-[#f5ede4] font-semibold' : 'text-[#9e8f82] hover:text-[#f5ede4]'
        }`}
      >
        <Clock className="w-4 h-4" />
        <span className="text-[9px]">Timeline</span>
      </button>

      <button
        onClick={() => onViewChange('finances')}
        className={`flex flex-col items-center gap-0.5 py-1 px-1.5 transition-colors ${
          currentView === 'finances' ? 'text-[#7ec29a] font-semibold' : 'text-[#9e8f82] hover:text-[#f5ede4]'
        }`}
      >
        <DollarSign className="w-4 h-4" />
        <span className="text-[9px]">Finanse</span>
      </button>

      <button
        onClick={() => onViewChange('converter')}
        className={`flex flex-col items-center gap-0.5 py-1 px-1.5 transition-colors ${
          currentView === 'converter' ? 'text-[#f5ede4] font-semibold' : 'text-[#9e8f82] hover:text-[#f5ede4]'
        }`}
      >
        <ImageIcon className="w-4 h-4" />
        <span className="text-[9px]">Grafika</span>
      </button>

      <button
        onClick={() => onViewChange('offers')}
        className={`flex flex-col items-center gap-0.5 py-1 px-1.5 transition-colors ${
          currentView === 'offers' ? 'text-[#d99b5a] font-semibold' : 'text-[#9e8f82] hover:text-[#f5ede4]'
        }`}
      >
        <MailCheck className="w-4 h-4" />
        <span className="text-[9px]">Oferty AI</span>
      </button>
    </nav>
  );
};
