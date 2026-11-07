import React from 'react';
import type { ViewMode } from '../types';
import { CATEGORIES } from '../data/initialData';
import {
  Calendar,
  CheckSquare,
  Columns3,
  StickyNote,
  Smartphone,
  Download,
  Upload,
  CheckCircle2,
  Tag,
  Clock,
  DollarSign,
  Image as ImageIcon
} from 'lucide-react';

interface SidebarProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  selectedCategory: string | null;
  onSelectCategory: (catId: string | null) => void;
  todayCount: number;
  totalCount: number;
  monthlyRevenue: number;
  onOpenPhoneModal: () => void;
  onExportData: () => void;
  onImportData: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onViewChange,
  selectedCategory,
  onSelectCategory,
  todayCount,
  totalCount,
  monthlyRevenue,
  onOpenPhoneModal,
  onExportData,
  onImportData,
}) => {
  return (
    <aside className="w-64 bg-slate-900/60 border-r border-slate-800/80 flex flex-col justify-between p-5 select-none hidden md:flex">
      {/* Top section: Logo and Nav */}
      <div className="space-y-6">
        {/* Logo */}
        <div className="flex items-center gap-3 px-2">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <CheckCircle2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-base text-white tracking-tight">TaskHub</h1>
            <p className="text-[11px] text-indigo-400 font-medium">JC Studio Panel</p>
          </div>
        </div>

        {/* Navigation views */}
        <div className="space-y-1">
          <button
            onClick={() => {
              onViewChange('today');
              onSelectCategory(null);
            }}
            className={`flex items-center justify-between w-full px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              currentView === 'today'
                ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4" />
              <span>Mój Dzień</span>
            </div>
            {todayCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300">
                {todayCount}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              onViewChange('all');
              onSelectCategory(null);
            }}
            className={`flex items-center justify-between w-full px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              currentView === 'all' && selectedCategory === null
                ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <div className="flex items-center gap-3">
              <CheckSquare className="w-4 h-4" />
              <span>Zlecenia & Zadania</span>
            </div>
            <span className="px-2 py-0.5 rounded-full text-xs font-medium text-slate-400 bg-slate-800">
              {totalCount}
            </span>
          </button>

          <button
            onClick={() => {
              onViewChange('kanban');
              onSelectCategory(null);
            }}
            className={`flex items-center justify-between w-full px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              currentView === 'kanban'
                ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <div className="flex items-center gap-3">
              <Columns3 className="w-4 h-4" />
              <span>Tablica Kanban</span>
            </div>
          </button>

          {/* Timeline (from JC Studio) */}
          <button
            onClick={() => {
              onViewChange('timeline');
              onSelectCategory(null);
            }}
            className={`flex items-center justify-between w-full px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              currentView === 'timeline'
                ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <div className="flex items-center gap-3">
              <Clock className="w-4 h-4 text-indigo-400" />
              <span>Timeline (Tydzień)</span>
            </div>
          </button>

          {/* Finances (from JC Studio) */}
          <button
            onClick={() => {
              onViewChange('finances');
              onSelectCategory(null);
            }}
            className={`flex items-center justify-between w-full px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              currentView === 'finances'
                ? 'bg-emerald-600/15 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <div className="flex items-center gap-3">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              <span>Finanse & Koszty</span>
            </div>
            {monthlyRevenue > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300">
                {monthlyRevenue.toLocaleString('pl-PL')} zł
              </span>
            )}
          </button>

          <button
            onClick={() => {
              onViewChange('notes');
              onSelectCategory(null);
            }}
            className={`flex items-center justify-between w-full px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              currentView === 'notes'
                ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <div className="flex items-center gap-3">
              <StickyNote className="w-4 h-4" />
              <span>To-Do & Notatki</span>
            </div>
          </button>

          {/* Image Converter */}
          <button
            onClick={() => {
              onViewChange('converter');
              onSelectCategory(null);
            }}
            className={`flex items-center justify-between w-full px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              currentView === 'converter'
                ? 'bg-purple-600/15 text-purple-400 border border-purple-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <div className="flex items-center gap-3">
              <ImageIcon className="w-4 h-4 text-purple-400" />
              <span>Konwerter Grafiki</span>
            </div>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300">
              NOWOŚĆ
            </span>
          </button>
        </div>

        {/* Categories Section */}
        <div className="pt-2 border-t border-slate-800/60">
          <div className="px-2 mb-2 flex items-center justify-between text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            <span>Kategorie</span>
            <Tag className="w-3 h-3 text-slate-500" />
          </div>
          <div className="space-y-0.5">
            {CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    onViewChange('all');
                    onSelectCategory(isSelected ? null : cat.id);
                  }}
                  className={`flex items-center justify-between w-full px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    isSelected
                      ? 'bg-slate-800 text-white font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${cat.color.split(' ')[1]}`} />
                    {cat.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom section: Phone connect & Data actions */}
      <div className="space-y-3 pt-4 border-t border-slate-800/80">
        <button
          onClick={onOpenPhoneModal}
          className="flex items-center justify-center gap-2 w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-indigo-500/10 to-indigo-600/20 hover:from-indigo-500/20 hover:to-indigo-600/30 border border-indigo-500/30 text-indigo-300 text-xs font-semibold transition-all shadow-sm group"
        >
          <Smartphone className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
          <span>Otwórz na telefonie (QR)</span>
        </button>

        <div className="flex gap-2">
          <button
            onClick={onExportData}
            title="Pobierz kopię zapasową (JSON)"
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-slate-800/70 hover:bg-slate-700/80 text-[11px] text-slate-400 hover:text-slate-200 border border-slate-700/50 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Kopia</span>
          </button>
          <button
            onClick={onImportData}
            title="Wgraj kopię zapasową z pliku"
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-slate-800/70 hover:bg-slate-700/80 text-[11px] text-slate-400 hover:text-slate-200 border border-slate-700/50 transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Wgraj</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
