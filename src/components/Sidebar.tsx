import React from 'react';
import type { ViewMode } from '../types';
import { CATEGORIES } from '../data/initialData';
import {
  Calendar,
  Timer,
  Columns3,
  StickyNote,
  Smartphone,
  Download,
  Upload,
  Clock,
  DollarSign,
  Image as ImageIcon,
  MailCheck,
  Globe,
  Plus,
  Search,
  Tag,
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
  onOpenNewTaskModal?: () => void;
  onToggleSearch?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onViewChange,
  selectedCategory,
  onSelectCategory,
  todayCount,
  totalCount: _totalCount,
  monthlyRevenue: _monthlyRevenue,
  onOpenPhoneModal,
  onExportData,
  onImportData,
  onOpenNewTaskModal,
  onToggleSearch,
}) => {
  const [showCategoryMenu, setShowCategoryMenu] = React.useState(false);

  return (
    <aside className="fixed left-3 top-3 bottom-3 z-40 hidden md:flex flex-col justify-between items-center py-4 px-2.5 w-[66px] glass-panel rounded-full select-none shadow-2xl">
      {/* Top action icons */}
      <div className="flex flex-col items-center gap-2 w-full">
        {/* Search toggle */}
        <button
          onClick={onToggleSearch}
          title="Szukaj zleceń"
          className="group relative p-2.5 rounded-full text-[#9e8f82] hover:text-[#f5ede4] hover:bg-[#251b14] transition-all"
        >
          <Search className="w-4 h-4" />
          <span className="pointer-events-none absolute left-14 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-xl text-[11px] font-medium bg-[#1a1410] text-[#f5ede4] border border-[#382b20] shadow-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
            Szukaj
          </span>
        </button>

        {/* Plus / Add button (Kindra cream circle) */}
        {onOpenNewTaskModal && (
          <button
            onClick={onOpenNewTaskModal}
            title="Nowe zlecenie"
            className="group relative p-2.5 rounded-full bg-[#f5ede4] hover:bg-white text-[#120e0a] shadow-lg shadow-black/50 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span className="pointer-events-none absolute left-14 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-xl text-[11px] font-medium bg-[#1a1410] text-[#f5ede4] border border-[#382b20] shadow-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
              Nowe zlecenie
            </span>
          </button>
        )}

        {/* Subtle divider */}
        <div className="w-6 h-[1px] bg-[#2e231c] my-1" />

        {/* Navigation View Icons */}
        <button
          onClick={() => {
            onViewChange('today');
            onSelectCategory(null);
          }}
          title="Mój Dzień"
          className={`group relative p-2.5 rounded-full transition-all ${
            currentView === 'today'
              ? 'bg-[#2a1e16] text-[#f5ede4] border border-[#3d2c20]'
              : 'text-[#9e8f82] hover:text-[#f5ede4] hover:bg-[#221a14]/60'
          }`}
        >
          <Calendar className="w-4 h-4" />
          {todayCount > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#d99b5a]" />
          )}
          <span className="pointer-events-none absolute left-14 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-xl text-[11px] font-medium bg-[#1a1410] text-[#f5ede4] border border-[#382b20] shadow-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
            Mój Dzień ({todayCount})
          </span>
        </button>

        <button
          onClick={() => {
            onViewChange('kanban');
            onSelectCategory(null);
          }}
          title="Tablica Kanban"
          className={`group relative p-2.5 rounded-full transition-all ${
            currentView === 'kanban'
              ? 'bg-[#2a1e16] text-[#f5ede4] border border-[#3d2c20]'
              : 'text-[#9e8f82] hover:text-[#f5ede4] hover:bg-[#221a14]/60'
          }`}
        >
          <Columns3 className="w-4 h-4" />
          <span className="pointer-events-none absolute left-14 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-xl text-[11px] font-medium bg-[#1a1410] text-[#f5ede4] border border-[#382b20] shadow-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
            Tablica Kanban
          </span>
        </button>

        <button
          onClick={() => {
            onViewChange('pomodoro');
            onSelectCategory(null);
          }}
          title="Pomodoro Focus Timer"
          className={`group relative p-2.5 rounded-full transition-all ${
            currentView === 'pomodoro'
              ? 'bg-[#2a1e16] text-[#f5ede4] border border-[#3d2c20]'
              : 'text-[#9e8f82] hover:text-[#f5ede4] hover:bg-[#221a14]/60'
          }`}
        >
          <Timer className="w-4 h-4" />
          <span className="pointer-events-none absolute left-14 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-xl text-[11px] font-medium bg-[#1a1410] text-[#f5ede4] border border-[#382b20] shadow-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
            Pomodoro Focus
          </span>
        </button>

        <button
          onClick={() => {
            onViewChange('timeline');
            onSelectCategory(null);
          }}
          title="Timeline tygodnia"
          className={`group relative p-2.5 rounded-full transition-all ${
            currentView === 'timeline'
              ? 'bg-[#2a1e16] text-[#f5ede4] border border-[#3d2c20]'
              : 'text-[#9e8f82] hover:text-[#f5ede4] hover:bg-[#221a14]/60'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span className="pointer-events-none absolute left-14 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-xl text-[11px] font-medium bg-[#1a1410] text-[#f5ede4] border border-[#382b20] shadow-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
            Timeline (Tydzień)
          </span>
        </button>

        <button
          onClick={() => {
            onViewChange('finances');
            onSelectCategory(null);
          }}
          title="Finanse & Rozliczenia"
          className={`group relative p-2.5 rounded-full transition-all ${
            currentView === 'finances'
              ? 'bg-[#2a1e16] text-[#7ec29a] border border-[#7ec29a]/40'
              : 'text-[#9e8f82] hover:text-[#7ec29a] hover:bg-[#221a14]/60'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span className="pointer-events-none absolute left-14 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-xl text-[11px] font-medium bg-[#1a1410] text-[#f5ede4] border border-[#382b20] shadow-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
            Finanse & Koszty
          </span>
        </button>

        <button
          onClick={() => {
            onViewChange('offers');
            onSelectCategory(null);
          }}
          title="Asystent Ofert AI & E-mail"
          className={`group relative p-2.5 rounded-full transition-all ${
            currentView === 'offers'
              ? 'bg-[#2a1e16] text-[#d99b5a] border border-[#d99b5a]/40'
              : 'text-[#9e8f82] hover:text-[#d99b5a] hover:bg-[#221a14]/60'
          }`}
        >
          <MailCheck className="w-4 h-4" />
          <span className="pointer-events-none absolute left-14 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-xl text-[11px] font-medium bg-[#1a1410] text-[#f5ede4] border border-[#382b20] shadow-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
            Oferty & E-mail AI
          </span>
        </button>

        <button
          onClick={() => {
            onViewChange('converter');
            onSelectCategory(null);
          }}
          title="Konwerter Grafiki"
          className={`group relative p-2.5 rounded-full transition-all ${
            currentView === 'converter'
              ? 'bg-[#2a1e16] text-[#f5ede4] border border-[#3d2c20]'
              : 'text-[#9e8f82] hover:text-[#f5ede4] hover:bg-[#221a14]/60'
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          <span className="pointer-events-none absolute left-14 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-xl text-[11px] font-medium bg-[#1a1410] text-[#f5ede4] border border-[#382b20] shadow-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
            Konwerter Grafiki
          </span>
        </button>

        <button
          onClick={() => {
            onViewChange('notes');
            onSelectCategory(null);
          }}
          title="Notatki & To-Do"
          className={`group relative p-2.5 rounded-full transition-all ${
            currentView === 'notes'
              ? 'bg-[#2a1e16] text-[#f5ede4] border border-[#3d2c20]'
              : 'text-[#9e8f82] hover:text-[#f5ede4] hover:bg-[#221a14]/60'
          }`}
        >
          <StickyNote className="w-4 h-4" />
          <span className="pointer-events-none absolute left-14 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-xl text-[11px] font-medium bg-[#1a1410] text-[#f5ede4] border border-[#382b20] shadow-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
            To-Do & Notatki
          </span>
        </button>

        <button
          onClick={() => {
            onViewChange('portfolio_manager');
            onSelectCategory(null);
          }}
          title="Portfolio Klienta"
          className={`group relative p-2.5 rounded-full transition-all ${
            currentView === 'portfolio_manager'
              ? 'bg-[#2a1e16] text-[#f5ede4] border border-[#3d2c20]'
              : 'text-[#9e8f82] hover:text-[#f5ede4] hover:bg-[#221a14]/60'
          }`}
        >
          <Globe className="w-4 h-4" />
          <span className="pointer-events-none absolute left-14 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-xl text-[11px] font-medium bg-[#1a1410] text-[#f5ede4] border border-[#382b20] shadow-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
            Portfolio Klienta
          </span>
        </button>
      </div>

      {/* Bottom utilities */}
      <div className="flex flex-col items-center gap-2 w-full pt-2 border-t border-[#2e231c]">
        {/* Category Filter popover trigger */}
        <div className="relative">
          <button
            onClick={() => setShowCategoryMenu(!showCategoryMenu)}
            title="Kategorie zleceń"
            className={`p-2.5 rounded-full transition-all ${
              selectedCategory !== null
                ? 'bg-[#d99b5a]/20 text-[#f1c38e]'
                : 'text-[#9e8f82] hover:text-[#f5ede4] hover:bg-[#221a14]/60'
            }`}
          >
            <Tag className="w-4 h-4" />
          </button>

          {showCategoryMenu && (
            <div className="absolute left-14 bottom-0 w-44 glass-panel rounded-2xl p-2 shadow-2xl z-50 space-y-1">
              <div className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-[#9e8f82]">
                Kategorie
              </div>
              <button
                onClick={() => {
                  onSelectCategory(null);
                  setShowCategoryMenu(false);
                }}
                className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                  selectedCategory === null
                    ? 'bg-[#f5ede4] text-[#120e0a]'
                    : 'text-[#9e8f82] hover:text-[#f5ede4] hover:bg-[#251b14]'
                }`}
              >
                Wszystkie
              </button>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    onViewChange('kanban');
                    onSelectCategory(selectedCategory === cat.id ? null : cat.id);
                    setShowCategoryMenu(false);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                    selectedCategory === cat.id
                      ? 'bg-[#f5ede4] text-[#120e0a]'
                      : 'text-[#9e8f82] hover:text-[#f5ede4] hover:bg-[#251b14]'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Phone connect modal */}
        <button
          onClick={onOpenPhoneModal}
          title="Otwórz na telefonie (QR)"
          className="group relative p-2.5 rounded-full text-[#9e8f82] hover:text-[#f5ede4] hover:bg-[#221a14]/60 transition-all"
        >
          <Smartphone className="w-4 h-4" />
          <span className="pointer-events-none absolute left-14 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-xl text-[11px] font-medium bg-[#1a1410] text-[#f5ede4] border border-[#382b20] shadow-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
            Telefon (QR)
          </span>
        </button>

        {/* Export / Backup */}
        <button
          onClick={onExportData}
          title="Pobierz kopię zapasową"
          className="group relative p-2 rounded-full text-[#9e8f82] hover:text-[#f5ede4] hover:bg-[#221a14]/60 transition-all"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="pointer-events-none absolute left-14 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-xl text-[11px] font-medium bg-[#1a1410] text-[#f5ede4] border border-[#382b20] shadow-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
            Kopia zapasowa (JSON)
          </span>
        </button>

        {/* Import */}
        <button
          onClick={onImportData}
          title="Wgraj kopię zapasową"
          className="group relative p-2 rounded-full text-[#9e8f82] hover:text-[#f5ede4] hover:bg-[#221a14]/60 transition-all"
        >
          <Upload className="w-3.5 h-3.5" />
          <span className="pointer-events-none absolute left-14 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-xl text-[11px] font-medium bg-[#1a1410] text-[#f5ede4] border border-[#382b20] shadow-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
            Wgraj plik
          </span>
        </button>
      </div>
    </aside>
  );
};
