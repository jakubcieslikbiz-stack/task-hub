import React from 'react';
import type { ViewMode } from '../types';
import {
  Search,
  Sparkles,
  X,
} from 'lucide-react';

interface HeaderProps {
  currentView: ViewMode;
  onViewChange?: (view: ViewMode) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenNewTaskModal?: () => void;
  onOpenAiModal?: () => void;
  onOpenPhoneModal?: () => void;
  completedTodayCount: number;
  totalTodayCount: number;
  todayCount?: number;
  totalCount?: number;
  monthlyRevenue?: number;
}

const VIEW_TITLES: Record<ViewMode, { title: string; subtitle: string; short: string }> = {
  today: { title: 'Mój Dzień', subtitle: 'Skup się na tym, co najważniejsze na dzisiaj', short: 'Overview' },
  all: { title: 'Zlecenia & Projekty', subtitle: 'Pełny przegląd zleceń, statusów i wycen JC Studio', short: 'Zlecenia' },
  pomodoro: { title: 'Pomodoro Focus Timer', subtitle: 'Sesje głębokiej pracy nad ujęciami 3D z regenerującymi przerwami dla wzroku', short: 'Pomodoro' },
  timeline: { title: 'Timeline tygodnia', subtitle: 'Wizualny harmonogram Gantta na poszczególne dni', short: 'Schedule' },
  finances: { title: 'Finanse & Koszty', subtitle: 'Rozliczenia zleceń, podatki i zysk netto na czysto', short: 'Finance' },
  converter: { title: 'Konwerter Grafiki', subtitle: 'Błyskawiczna konwersja PNG, JPG, WEBP, SVG bez wysyłania do sieci', short: 'Narzędzia' },
  dwg_converter: { title: 'Konwerter DWG & DXF → PDF', subtitle: 'Lokalna konwersja projektów CAD (DWG / DXF) do wektorowego PDF bez wysyłania plików na serwery', short: 'CAD & DWG' },
  offers: { title: 'Asystent Ofert & E-mail AI', subtitle: 'Twórz profesjonalne wyceny, oferty i odpowiedzi na zapytania klientów', short: 'Oferty AI' },
  portfolio_manager: { title: 'Zarządzaj Portfolio Klienta', subtitle: 'Dodawaj projekty i udostępniaj link do dedykowanej wizytówki JC Studio', short: 'Portfolio' },
};

export const Header: React.FC<HeaderProps> = ({
  currentView,
  searchQuery,
  onSearchChange,
  completedTodayCount,
  totalTodayCount,
}) => {
  const { title, subtitle, short } = VIEW_TITLES[currentView];
  const percent = totalTodayCount > 0 ? Math.round((completedTodayCount / totalTodayCount) * 100) : 0;

  const now = new Date();
  const dateFormatted = now.toLocaleDateString('pl-PL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const monthYearFormatted = now.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <header className="space-y-4 mb-6">
      {/* Main Title & Editorial Header Area */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pt-1">
        <div>
          <span className="text-[11px] font-mono tracking-[0.2em] uppercase text-[#9e8f82] block mb-1">
            Welcome back, Jakub • {short}
          </span>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-light text-[#f5ede4] tracking-tight">
              {title}
            </h1>
            {currentView === 'today' && totalTodayCount > 0 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#7ec29a]/15 text-[#9ee2b9] border border-[#7ec29a]/30">
                <Sparkles className="w-3.5 h-3.5 text-[#7ec29a]" />
                {percent}% ukończone ({completedTodayCount}/{totalTodayCount})
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-[#9e8f82] mt-1 font-light max-w-xl">
            {subtitle}
          </p>
        </div>

        {/* Date / Month display (Right aligned) */}
        <div className="text-left sm:text-right flex flex-col justify-end">
          <span className="text-xs sm:text-sm font-mono text-[#f5ede4] tracking-wide block">
            {monthYearFormatted}
          </span>
          <span className="text-[11px] text-[#7a6b5e] font-light capitalize block">
            {dateFormatted}
          </span>
        </div>
      </div>

      {/* Search Bar (Warm glass style) */}
      {currentView !== 'finances' && currentView !== 'timeline' && currentView !== 'pomodoro' && currentView !== 'converter' && currentView !== 'dwg_converter' && (
        <div className="relative pt-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9e8f82]" />
          <input
            type="text"
            placeholder="Szukaj zleceń po nazwie, uwagach, kwocie lub dacie..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-11 pr-10 py-2.5 rounded-2xl glass-input text-xs sm:text-sm placeholder-[#7a6b5e] transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9e8f82] hover:text-[#f5ede4]"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
    </header>
  );
};
