import React from 'react';
import { usePomodoro } from '../context/PomodoroContext';
import { Play, Pause, Maximize2, Coffee, Zap } from 'lucide-react';
import type { Task } from '../types';

interface PomodoroFloatingWidgetProps {
  currentView: string;
  onNavigateToPomodoro: () => void;
  tasks: Task[];
}

export const PomodoroFloatingWidget: React.FC<PomodoroFloatingWidgetProps> = ({
  currentView,
  onNavigateToPomodoro,
  tasks,
}) => {
  const {
    mode,
    formattedTime,
    isRunning,
    toggleRunning,
    selectedTaskId,
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

  const selectedTask = tasks.find((t) => t.id === selectedTaskId);
  const modeLabel = mode === 'focus' ? 'Skupienie' : 'Przerwa';

  return (
    <aside
      aria-label="Aktywny stoper Pomodoro"
      className="fixed bottom-5 md:bottom-6 right-[190px] md:right-6 z-40 max-w-[calc(100vw-204px)] md:max-w-none animate-in fade-in slide-in-from-bottom-2 duration-300"
    >
      <div
        className="glass-panel border rounded-full px-2.5 py-1.5 md:px-3.5 md:py-2 shadow-2xl flex items-center gap-2 md:gap-3 backdrop-blur-xl transition-all hover:scale-105 select-none"
        style={{
          borderColor: `${themeColor}55`,
          boxShadow: `0 8px 32px -4px ${themeColor}25, 0 2px 10px 0 rgba(0,0,0,0.5)`,
          background: 'rgba(20, 15, 12, 0.92)',
        }}
      >
        {/* Clickable Area to Open Full Pomodoro View */}
        <button
          onClick={onNavigateToPomodoro}
          className="flex items-center gap-2 md:gap-2.5 text-left group focus:outline-none min-w-0"
          title="Kliknij, aby otworzyć pełny widok Pomodoro"
        >
          {/* Pulsing Mode Icon */}
          <div
            className="w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-transform group-hover:rotate-12"
            style={{
              backgroundColor: `${themeColor}20`,
              color: themeColor,
              border: `1px solid ${themeColor}40`,
            }}
          >
            {mode === 'focus' ? (
              <Zap className={`w-3 h-3 md:w-4 md:h-4 ${isRunning ? 'animate-pulse' : ''}`} />
            ) : (
              <Coffee className="w-3 h-3 md:w-4 md:h-4" />
            )}
          </div>

          {/* Time & Task / Mode info */}
          <div className="flex flex-col pr-0.5 md:pr-1 min-w-0">
            <div className="flex items-center gap-1 md:gap-1.5">
              <span className="font-mono text-xs md:text-sm font-semibold tracking-tight text-[#f5ede4]">
                {formattedTime}
              </span>
              <span
                className="text-[9px] md:text-[10px] font-medium uppercase px-1 md:px-1.5 py-0.2 rounded flex-shrink-0"
                style={{
                  backgroundColor: `${themeColor}25`,
                  color: themeColor,
                }}
              >
                {modeLabel}
              </span>
            </div>

            {selectedTask ? (
              <span className="text-[9px] md:text-[10px] text-[#9e8f82] max-w-[65px] xs:max-w-[85px] sm:max-w-[110px] md:max-w-[130px] truncate leading-tight mt-0.5">
                {selectedTask.title}
              </span>
            ) : (
              <span className="text-[9px] md:text-[10px] text-[#7a6b5e] max-w-[65px] xs:max-w-[85px] sm:max-w-[110px] md:max-w-[130px] truncate leading-tight mt-0.5">
                JC Studio Focus
              </span>
            )}
          </div>
        </button>

        {/* Vertical divider */}
        <div className="w-[1px] h-4 md:h-6 bg-[#382b20] flex-shrink-0" />

        {/* Play / Pause Toggle Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleRunning();
          }}
          className="p-1 md:p-1.5 rounded-full hover:bg-[#251b14] text-[#f5ede4] transition-all active:scale-90 flex-shrink-0"
          title={isRunning ? 'Wstrzymaj' : 'Wznów'}
        >
          {isRunning ? (
            <Pause className="w-3.5 h-3.5 md:w-4 md:h-4 fill-current text-[#d99b5a]" />
          ) : (
            <Play className="w-3.5 h-3.5 md:w-4 md:h-4 fill-current text-[#7ec29a] ml-0.5" />
          )}
        </button>

        {/* Maximize to full view */}
        <button
          onClick={onNavigateToPomodoro}
          className="p-1 md:p-1.5 rounded-full hover:bg-[#251b14] text-[#9e8f82] hover:text-[#f5ede4] transition-all active:scale-90 flex-shrink-0"
          title="Pełny ekran Pomodoro"
        >
          <Maximize2 className="w-3 h-3 md:w-3.5 md:h-3.5" />
        </button>
      </div>
    </aside>
  );
};
