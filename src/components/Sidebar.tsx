import React from 'react';
import type { ViewMode } from '../types';
import { CATEGORIES } from '../data/initialData';
import { usePomodoro } from '../context/PomodoroContext';
import {
  Calendar,
  CheckSquare,
  Timer,
  Smartphone,
  Download,
  Upload,
  Clock,
  DollarSign,
  Image as ImageIcon,
  DraftingCompass,
  MailCheck,
  Globe,
  Plus,
  Search,
  Tag,
  Lock,
  KeyRound,
  User,
} from 'lucide-react';

interface SidebarProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  selectedCategory: string | null;
  onSelectCategory: (catId: string | null) => void;
  todayCount: number;
  totalCount: number;
  personalCount?: number;
  monthlyRevenue: number;
  onOpenPhoneModal: () => void;
  onExportData: () => void;
  onImportData: () => void;
  onOpenNewTaskModal?: () => void;
  onToggleSearch?: () => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
  onLockApp?: () => void;
  onOpenChangePassword?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onViewChange,
  selectedCategory,
  onSelectCategory,
  todayCount,
  totalCount: _totalCount,
  personalCount = 0,
  monthlyRevenue: _monthlyRevenue,
  onOpenPhoneModal,
  onExportData,
  onImportData,
  onOpenNewTaskModal,
  onToggleSearch,
  mobileOpen = false,
  onCloseMobile,
  onLockApp,
  onOpenChangePassword,
}) => {
  const [showCategoryMenu, setShowCategoryMenu] = React.useState(false);
  const { isRunning: isPomodoroRunning, formattedTime: pomodoroTime, mode: pomodoroMode } = usePomodoro();

  const handleNav = (view: ViewMode) => {
    onViewChange(view);
    onSelectCategory(null);
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-50 bg-[#0c0907]/80 backdrop-blur-sm md:hidden animate-in fade-in duration-200"
        />
      )}

      <aside
        className={`fixed left-3 top-mobile-safe bottom-3 z-50 flex flex-col justify-between items-center py-4 px-2.5 w-[66px] glass-panel rounded-full select-none shadow-2xl transition-all duration-300 ease-out ${
          mobileOpen
            ? 'translate-x-0 opacity-100 pointer-events-auto'
            : '-translate-x-32 opacity-0 pointer-events-none md:pointer-events-auto md:translate-x-0 md:opacity-100'
        }`}
      >
      {/* Top action icons */}
      <div className="flex flex-col items-center gap-2 w-full">
        {/* Search toggle */}
        <button
          onClick={onToggleSearch}
          title="Szukaj zleceń"
          className="group relative p-2.5 rounded-full text-[#9e8f82] hover:text-[#f5ede4] hover:bg-[#251b14] transition-all duration-150 hover:scale-105 active:scale-95"
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
            className="group relative p-2.5 rounded-full bg-[#f5ede4] hover:bg-white text-[#120e0a] shadow-lg shadow-black/50 hover:scale-110 active:scale-90 transition-all duration-150"
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
          onClick={() => handleNav('today')}
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
          onClick={() => handleNav('all')}
          title="Wszystkie zlecenia"
          className={`group relative p-2.5 rounded-full transition-all ${
            currentView === 'all'
              ? 'bg-[#2a1e16] text-[#f5ede4] border border-[#3d2c20]'
              : 'text-[#9e8f82] hover:text-[#f5ede4] hover:bg-[#221a14]/60'
          }`}
        >
          <CheckSquare className="w-4 h-4" />
          <span className="pointer-events-none absolute left-14 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-xl text-[11px] font-medium bg-[#1a1410] text-[#f5ede4] border border-[#382b20] shadow-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
            Zlecenia & Projekty
          </span>
        </button>

        <button
          onClick={() => handleNav('personal')}
          title="Sprawy Osobiste"
          className={`group relative p-2.5 rounded-full transition-all ${
            currentView === 'personal'
              ? 'bg-[#2a1e16] text-[#7ec29a] border border-[#7ec29a]/40 shadow-sm'
              : 'text-[#9e8f82] hover:text-[#7ec29a] hover:bg-[#221a14]/60'
          }`}
        >
          <User className="w-4 h-4" />
          {personalCount > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#7ec29a]" />
          )}
          <span className="pointer-events-none absolute left-14 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-xl text-[11px] font-medium bg-[#1a1410] text-[#f5ede4] border border-[#382b20] shadow-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
            Sprawy Osobiste {personalCount > 0 ? `(${personalCount})` : ''}
          </span>
        </button>

        <button
          onClick={() => handleNav('pomodoro')}
          title="Pomodoro Focus Timer"
          className={`group relative p-2.5 rounded-full transition-all ${
            currentView === 'pomodoro'
              ? 'bg-[#2a1e16] text-[#f5ede4] border border-[#3d2c20]'
              : isPomodoroRunning
              ? 'text-[#d99b5a] bg-[#2a1e16]/80 border border-[#d99b5a]/40'
              : 'text-[#9e8f82] hover:text-[#f5ede4] hover:bg-[#221a14]/60'
          }`}
        >
          <Timer className={`w-4 h-4 ${isPomodoroRunning ? 'animate-pulse' : ''}`} />
          {isPomodoroRunning && (
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#d99b5a] shadow-[0_0_6px_#d99b5a]" />
          )}
          <span className="pointer-events-none absolute left-14 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-xl text-[11px] font-medium bg-[#1a1410] text-[#f5ede4] border border-[#382b20] shadow-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
            {isPomodoroRunning
              ? `Pomodoro (${pomodoroTime} • ${pomodoroMode === 'focus' ? 'Praca' : 'Przerwa'})`
              : 'Pomodoro Focus'}
          </span>
        </button>

        <button
          onClick={() => handleNav('timeline')}
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
          onClick={() => handleNav('finances')}
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
          onClick={() => handleNav('offers')}
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
          onClick={() => handleNav('converter')}
          title="Konwerter Grafiki & PDF"
          className={`group relative p-2.5 rounded-full transition-all ${
            currentView === 'converter'
              ? 'bg-[#2a1e16] text-[#f5ede4] border border-[#3d2c20]'
              : 'text-[#9e8f82] hover:text-[#f5ede4] hover:bg-[#221a14]/60'
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          <span className="pointer-events-none absolute left-14 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-xl text-[11px] font-medium bg-[#1a1410] text-[#f5ede4] border border-[#382b20] shadow-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
            Konwerter Grafiki & PDF
          </span>
        </button>

        <button
          onClick={() => handleNav('dwg_converter')}
          title="Konwerter DWG & DXF → PDF"
          className={`group relative p-2.5 rounded-full transition-all ${
            currentView === 'dwg_converter'
              ? 'bg-[#2a1e16] text-[#d99b5a] border border-[#d99b5a]/50 shadow-[0_0_15px_rgba(217,155,90,0.2)]'
              : 'text-[#9e8f82] hover:text-[#d99b5a] hover:bg-[#221a14]/60'
          }`}
        >
          <DraftingCompass className="w-4 h-4" />
          <span className="pointer-events-none absolute left-14 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-xl text-[11px] font-medium bg-[#1a1410] text-[#f5ede4] border border-[#382b20] shadow-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
            Konwerter DWG → PDF
          </span>
        </button>

        <button
          onClick={() => handleNav('portfolio_manager')}
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
                    onViewChange('all');
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

        {/* Change password modal trigger */}
        {onOpenChangePassword && (
          <button
            onClick={() => {
              if (onCloseMobile) onCloseMobile();
              onOpenChangePassword();
            }}
            title="Zmień hasło dostępu"
            className="group relative p-2 rounded-full text-[#9e8f82] hover:text-[#d99b5a] hover:bg-[#221a14]/60 transition-all"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span className="pointer-events-none absolute left-14 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-xl text-[11px] font-medium bg-[#1a1410] text-[#f5ede4] border border-[#382b20] shadow-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
              Zmień hasło
            </span>
          </button>
        )}

        {/* Lock app button */}
        {onLockApp && (
          <button
            onClick={() => {
              if (onCloseMobile) onCloseMobile();
              onLockApp();
            }}
            title="Zablokuj panel"
            className="group relative p-2 rounded-full text-[#9e8f82] hover:text-[#e07a68] hover:bg-[#2a1411]/60 transition-all"
          >
            <Lock className="w-3.5 h-3.5" />
            <span className="pointer-events-none absolute left-14 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-xl text-[11px] font-medium bg-[#1a1410] text-[#e07a68] border border-[#4d231c] shadow-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
              Zablokuj
            </span>
          </button>
        )}
      </div>
    </aside>
    </>
  );
};
