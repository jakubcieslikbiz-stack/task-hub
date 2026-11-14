import React from 'react';
import { usePomodoro } from '../context/PomodoroContext';
import { Play, Pause } from 'lucide-react';
import type { Task } from '../types';

interface PomodoroFloatingWidgetProps {
  currentView: string;
  onNavigateToPomodoro: () => void;
  tasks: Task[];
}

export const PomodoroFloatingWidget: React.FC<PomodoroFloatingWidgetProps> = ({
  currentView,
  onNavigateToPomodoro,
}) => {
  const {
    mode,
    formattedTime,
    isRunning,
    toggleRunning,
    themeColor,
    activePreset,
    timeLeft,
  } = usePomodoro();

  // If user is currently on the pomodoro page, don't show the floating widget
  if (currentView === 'pomodoro') return null;

  // Total seconds for current mode to check if timer was touched
  const totalModeSeconds =
    mode === 'focus'
      ? activePreset.focus * 60
      : mode === 'short_break'
      ? activePreset.shortBreak * 60
      : activePreset.longBreak * 60;

  // Show only if it's currently running OR it's paused with progress (so user doesn't forget they started a session)
  const isTimerActive = isRunning || timeLeft < totalModeSeconds;
  if (!isTimerActive) return null;

  return (
    <aside
      aria-label="Aktywny stoper Pomodoro"
      className="fixed bottom-5 md:bottom-6 right-[186px] md:right-6 z-40 animate-in fade-in slide-in-from-bottom-2 duration-300"
    >
      <div
        className="glass-panel border rounded-full px-3 py-1.5 shadow-2xl flex items-center gap-2 backdrop-blur-xl transition-all hover:scale-105 select-none"
        style={{
          borderColor: `${themeColor}55`,
          boxShadow: `0 8px 32px -4px ${themeColor}25, 0 2px 10px 0 rgba(0,0,0,0.5)`,
          background: 'rgba(20, 15, 12, 0.94)',
        }}
      >
        {/* Clickable Area to Open Full Pomodoro View: Just the Timer */}
        <button
          onClick={onNavigateToPomodoro}
          className="flex items-center gap-1.5 text-left group focus:outline-none"
          title="Kliknij, aby otworzyć pełny stoper Pomodoro"
        >
          <span
            className={`w-2 h-2 rounded-full flex-shrink-0 ${isRunning ? 'animate-pulse' : ''}`}
            style={{ backgroundColor: themeColor }}
          />
          <span className="font-mono text-xs sm:text-sm font-semibold tracking-tight text-[#f5ede4] group-hover:text-white transition-colors">
            {formattedTime}
          </span>
        </button>

        {/* Vertical divider */}
        <div className="w-[1px] h-4 bg-[#382b20] flex-shrink-0" />

        {/* Play / Pause Toggle Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleRunning();
          }}
          className="p-1 rounded-full hover:bg-[#251b14] text-[#f5ede4] transition-all active:scale-90 flex-shrink-0"
          title={isRunning ? 'Wstrzymaj' : 'Wznów'}
        >
          {isRunning ? (
            <Pause className="w-3.5 h-3.5 fill-current text-[#d99b5a]" />
          ) : (
            <Play className="w-3.5 h-3.5 fill-current text-[#7ec29a] ml-0.5" />
          )}
        </button>
      </div>
    </aside>
  );
};
