import React, { useState, useRef, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock
} from 'lucide-react';

interface MiniCalendarPickerProps {
  label?: string;
  value: string; // Format 'YYYY-MM-DD'
  onChange: (val: string) => void;
  placeholder?: string;
  align?: 'left' | 'right';
}

const MONTH_NAMES_PL = [
  'Styczeń',
  'Luty',
  'Marzec',
  'Kwiecień',
  'Maj',
  'Czerwiec',
  'Lipiec',
  'Sierpień',
  'Wrzesień',
  'Październik',
  'Listopad',
  'Grudzień',
];

const WEEKDAYS_SHORT_PL = ['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'Sb', 'Nd'];

const toYMD = (year: number, monthIndex: number, day: number): string => {
  const m = String(monthIndex + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
};

export const MiniCalendarPicker: React.FC<MiniCalendarPickerProps> = ({
  label,
  value,
  onChange,
  placeholder = 'Wybierz termin...',
  align = 'left',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse current value or fallback to today
  const parseInitialDate = () => {
    if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const parts = value.split('-').map(Number);
      return new Date(parts[0], parts[1] - 1, parts[2]);
    }
    return new Date();
  };

  const initialDate = parseInitialDate();
  const [viewYear, setViewYear] = useState(initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialDate.getMonth());

  // Keep view synchronized when value changes externally
  useEffect(() => {
    if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const parts = value.split('-').map(Number);
      setViewYear(parts[0]);
      setViewMonth(parts[1] - 1);
    }
  }, [value]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleSelectDay = (ymd: string) => {
    onChange(ymd);
    setIsOpen(false);
  };

  // Preset shortcuts
  const handleQuickPreset = (type: 'today' | 'tomorrow' | 'plus7' | 'endOfMonth') => {
    const now = new Date();
    const curYear = now.getFullYear();
    const curMonth = now.getMonth();
    const curDate = now.getDate();

    let targetDate: Date;
    if (type === 'today') {
      targetDate = new Date(curYear, curMonth, curDate);
    } else if (type === 'tomorrow') {
      targetDate = new Date(curYear, curMonth, curDate + 1);
    } else if (type === 'plus7') {
      targetDate = new Date(curYear, curMonth, curDate + 7);
    } else {
      // end of month
      targetDate = new Date(curYear, curMonth + 1, 0);
    }

    const ymd = toYMD(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    onChange(ymd);
    setViewYear(targetDate.getFullYear());
    setViewMonth(targetDate.getMonth());
    setIsOpen(false);
  };

  // Generate calendar days
  const today = new Date();
  const todayYMD = toYMD(today.getFullYear(), today.getMonth(), today.getDate());

  const firstDayOfMonth = new Date(viewYear, viewMonth, 1);
  const startBlanks = (firstDayOfMonth.getDay() + 6) % 7; // Monday = 0
  const daysInCurrentMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

  // Days list
  const calendarCells: {
    day: number;
    isCurrentMonth: boolean;
    ymd: string;
    isToday: boolean;
    isSelected: boolean;
  }[] = [];

  // Previous month padding
  for (let i = startBlanks - 1; i >= 0; i--) {
    const d = daysInPrevMonth - i;
    const prevMonthIdx = viewMonth === 0 ? 11 : viewMonth - 1;
    const prevYear = viewMonth === 0 ? viewYear - 1 : viewYear;
    const ymd = toYMD(prevYear, prevMonthIdx, d);
    calendarCells.push({
      day: d,
      isCurrentMonth: false,
      ymd,
      isToday: ymd === todayYMD,
      isSelected: ymd === value,
    });
  }

  // Current month days
  for (let d = 1; d <= daysInCurrentMonth; d++) {
    const ymd = toYMD(viewYear, viewMonth, d);
    calendarCells.push({
      day: d,
      isCurrentMonth: true,
      ymd,
      isToday: ymd === todayYMD,
      isSelected: ymd === value,
    });
  }

  // Next month padding to fill a complete 35 or 42 grid
  const remainingCells = (7 - (calendarCells.length % 7)) % 7;
  for (let d = 1; d <= remainingCells; d++) {
    const nextMonthIdx = viewMonth === 11 ? 0 : viewMonth + 1;
    const nextYear = viewMonth === 11 ? viewYear + 1 : viewYear;
    const ymd = toYMD(nextYear, nextMonthIdx, d);
    calendarCells.push({
      day: d,
      isCurrentMonth: false,
      ymd,
      isToday: ymd === todayYMD,
      isSelected: ymd === value,
    });
  }

  // Format trigger display text
  const formatDisplay = () => {
    if (!value || typeof value !== 'string') return placeholder;
    try {
      if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        const parts = value.split('-').map(Number);
        const d = new Date(parts[0], parts[1] - 1, parts[2]);
        if (!isNaN(d.getTime())) {
          return d.toLocaleDateString('pl-PL', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            weekday: 'short',
          });
        }
      }
      return String(value);
    } catch {
      return placeholder;
    }
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      {label && (
        <label className="block text-xs font-mono uppercase text-[#9e8f82] mb-1.5">
          {label}
        </label>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-3.5 py-2.5 rounded-2xl glass-input text-left text-xs sm:text-sm flex items-center justify-between gap-2 border transition-all ${
          isOpen
            ? 'border-[#d99b5a] shadow-lg ring-1 ring-[#d99b5a]/40 bg-[#1e1713]'
            : 'border-[#382b20] hover:border-[#4d3a2c] bg-[#140f0c]'
        }`}
      >
        <div className="flex items-center gap-2.5 truncate">
          <CalendarIcon className="w-4 h-4 text-[#d99b5a] flex-shrink-0" />
          <span className={value ? 'text-[#f5ede4] font-medium' : 'text-[#7a6b5e]'}>
            {formatDisplay()}
          </span>
        </div>

        {value && (
          <span className="text-[10px] font-mono text-[#9e8f82] bg-[#251b14] px-2 py-0.5 rounded-md hidden sm:inline-block">
            {value}
          </span>
        )}
      </button>

      {/* Mini Calendar Popup */}
      {isOpen && (
        <div
          className={`absolute top-full mt-2 z-50 w-72 sm:w-80 bg-[#140f0c] border border-[#382b20] rounded-2xl p-3.5 shadow-2xl backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-150 ${
            align === 'right' ? 'right-0' : 'left-0 sm:left-auto sm:right-0 md:left-0'
          }`}
          style={{ minWidth: '280px' }}
        >
          {/* Calendar Header: Month, Year, Arrows */}
          <div className="flex items-center justify-between pb-2.5 border-b border-[#2e231c]">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1 rounded-lg text-[#9e8f82] hover:text-[#f5ede4] hover:bg-[#251b14] transition-all"
              title="Poprzedni miesiąc"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="text-xs font-semibold text-[#f5ede4] font-mono tracking-wide">
              {MONTH_NAMES_PL[viewMonth]} {viewYear}
            </span>

            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1 rounded-lg text-[#9e8f82] hover:text-[#f5ede4] hover:bg-[#251b14] transition-all"
              title="Następny miesiąc"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Presets Bar */}
          <div className="grid grid-cols-4 gap-1 py-2 border-b border-[#261d17]">
            <button
              type="button"
              onClick={() => handleQuickPreset('today')}
              className="py-1 px-1.5 rounded-lg bg-[#1f1712] hover:bg-[#2a1f18] text-[#f5ede4] text-[10px] font-medium transition-all text-center border border-[#2e231c]"
            >
              Dziś
            </button>
            <button
              type="button"
              onClick={() => handleQuickPreset('tomorrow')}
              className="py-1 px-1.5 rounded-lg bg-[#1f1712] hover:bg-[#2a1f18] text-[#f5ede4] text-[10px] font-medium transition-all text-center border border-[#2e231c]"
            >
              Jutro
            </button>
            <button
              type="button"
              onClick={() => handleQuickPreset('plus7')}
              className="py-1 px-1.5 rounded-lg bg-[#1f1712] hover:bg-[#2a1f18] text-[#d99b5a] text-[10px] font-medium transition-all text-center border border-[#2e231c]"
            >
              +7 dni
            </button>
            <button
              type="button"
              onClick={() => handleQuickPreset('endOfMonth')}
              className="py-1 px-1.5 rounded-lg bg-[#1f1712] hover:bg-[#2a1f18] text-[#7ec29a] text-[10px] font-medium transition-all text-center border border-[#2e231c]"
            >
              Koniec m-ca
            </button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 pt-2 pb-1 text-center">
            {WEEKDAYS_SHORT_PL.map((wd, i) => (
              <span
                key={wd}
                className={`text-[10px] font-mono uppercase ${
                  i >= 5 ? 'text-[#d99b5a]' : 'text-[#7a6b5e]'
                }`}
              >
                {wd}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {calendarCells.map((cell, idx) => {
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectDay(cell.ymd)}
                  className={`h-7 sm:h-8 rounded-lg text-xs font-mono flex items-center justify-center transition-all relative ${
                    cell.isSelected
                      ? 'bg-[#f5ede4] text-[#120e0a] font-bold shadow-md scale-105 z-10'
                      : cell.isToday
                      ? 'border border-[#d99b5a] text-[#d99b5a] font-semibold bg-[#251b14]/50 hover:bg-[#d99b5a] hover:text-[#120e0a]'
                      : cell.isCurrentMonth
                      ? 'text-[#f5ede4] hover:bg-[#251b14] hover:text-white'
                      : 'text-[#4d3a2c] hover:bg-[#1c1510] hover:text-[#7a6b5e]'
                  }`}
                >
                  {cell.day}
                  {cell.isToday && !cell.isSelected && (
                    <span className="absolute bottom-0.5 w-1 h-1 rounded-full bg-[#d99b5a]" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Bottom helper */}
          <div className="pt-2.5 mt-2 border-t border-[#261d17] flex items-center justify-between text-[10px] text-[#7a6b5e]">
            <span className="flex items-center gap-1 font-mono">
              <Clock className="w-3 h-3 text-[#d99b5a]" />
              Kliknij dzień, aby ustawić
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-[#9e8f82] hover:text-[#f5ede4] px-1.5 py-0.5 rounded transition-colors"
            >
              Zamknij
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
