import React from 'react';
import type { Task } from '../types';
import { usePomodoro } from '../context/PomodoroContext';
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  Volume2,
  VolumeX,
  Coffee,
  Layers,
  Award,
  Headphones,
  Clock,
} from 'lucide-react';

interface PomodoroViewProps {
  tasks: Task[];
}

export const PomodoroView: React.FC<PomodoroViewProps> = ({ tasks }) => {
  const {
    mode,
    activePreset,
    isRunning,
    selectedTaskId,
    soundEnabled,
    ambientSound,
    completedSessionsToday,
    completedSessionItems,
    totalFocusMinutesToday,
    progressPercent,
    formattedTime,
    themeColor,
    toggleRunning,
    reset,
    skip,
    switchMode,
    setSelectedTaskId,
    setSoundEnabled,
    setAmbientSound,
  } = usePomodoro();

  // Circular SVG params
  const radius = 135;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  const selectedTask = tasks.find((t) => t.id === selectedTaskId);

  const sessionList =
    completedSessionItems.length >= completedSessionsToday
      ? completedSessionItems
      : Array.from({ length: completedSessionsToday }).map((_, i) => completedSessionItems[i] || {
          id: `synth-${i}`,
          duration: 60,
          isLong: true,
          completedAt: new Date().toISOString(),
        });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Main Timer Display Card */}
      <div className="glass-panel border border-[#2b211a] rounded-3xl p-6 sm:p-10 shadow-2xl flex flex-col items-center justify-center relative overflow-hidden">
        {/* Soft radial background glow matching mode */}
        <div
          className="absolute inset-0 pointer-events-none opacity-15 blur-3xl transition-all duration-700"
          style={{
            background: `radial-gradient(circle at 50% 50%, ${themeColor}, transparent 65%)`,
          }}
        />

        {/* Top Controls Bar: Mode Switcher & Audio Controls */}
        <div className="w-full relative z-10 flex flex-wrap items-center justify-between gap-3 mb-8 pb-4 border-b border-[#2e231c]">
          {/* Mode Switcher Tabs */}
          <div className="flex items-center gap-1 p-1 rounded-full bg-[#140f0c] border border-[#2e231c] shadow-lg">
            <button
              onClick={() => switchMode('focus')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                mode === 'focus'
                  ? 'bg-[#f5ede4] text-[#120e0a] font-semibold shadow-md'
                  : 'text-[#9e8f82] hover:text-[#f5ede4]'
              }`}
            >
              ⚡ Praca 1h ({activePreset.focus}m)
            </button>
            <button
              onClick={() => switchMode('short_break')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                mode === 'short_break'
                  ? 'bg-[#7ec29a] text-[#120e0a] font-semibold shadow-md'
                  : 'text-[#9e8f82] hover:text-[#f5ede4]'
              }`}
            >
              ☕ Przerwa ({activePreset.shortBreak}m)
            </button>
            <button
              onClick={() => switchMode('long_break')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                mode === 'long_break'
                  ? 'bg-[#e07a68] text-[#120e0a] font-semibold shadow-md'
                  : 'text-[#9e8f82] hover:text-[#f5ede4]'
              }`}
            >
              🌿 Długa ({activePreset.longBreak}m)
            </button>
          </div>

          {/* Quick Audio Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setAmbientSound(!ambientSound)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border flex items-center gap-1.5 transition-all ${
                ambientSound
                  ? 'bg-[#d99b5a]/20 text-[#f1c38e] border-[#d99b5a]/40 shadow-sm'
                  : 'bg-[#140f0c] text-[#9e8f82] border-[#2e231c] hover:text-[#f5ede4]'
              }`}
              title="Szum brązowy / deszcz w tle wspomagający skupienie (działa także w tle)"
            >
              <Headphones className="w-3.5 h-3.5" />
              <span>Szum Focus {ambientSound ? '(Wł.)' : ''}</span>
            </button>

            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-1.5 rounded-full border transition-all ${
                soundEnabled
                  ? 'bg-[#140f0c] text-[#7ec29a] border-[#2e231c]'
                  : 'bg-[#140f0c] text-[#7a6b5e] border-[#2e231c]'
              }`}
              title={soundEnabled ? 'Dźwięk dzwonka włączony' : 'Wyciszony'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Circular SVG Timer */}
        <div className="relative z-10 w-72 h-72 sm:w-80 sm:h-80 flex items-center justify-center my-2 select-none">
          <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 320 320">
            {/* Background track circle */}
            <circle
              cx="160"
              cy="160"
              r={radius}
              stroke="#211812"
              strokeWidth="9"
              fill="transparent"
            />
            {/* Active progress stroke */}
            <circle
              cx="160"
              cy="160"
              r={radius}
              stroke={themeColor}
              strokeWidth="9"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              className="transition-all duration-500 ease-linear"
              style={{
                filter: `drop-shadow(0 0 8px ${themeColor}44)`,
              }}
            />
          </svg>

          {/* Centered Numbers and Mode Name */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-[11px] font-mono tracking-widest uppercase text-[#9e8f82] mb-1">
              {mode === 'focus'
                ? 'Sesja 1h (Deep 3D Flow)'
                : mode === 'short_break'
                ? 'Przerwa dla wzroku'
                : 'Długa regeneracja'}
            </span>

            <div className="text-5xl sm:text-6xl font-light text-[#f5ede4] tracking-tight font-mono">
              {formattedTime}
            </div>

            {selectedTask ? (
              <div className="mt-2.5 max-w-[200px] truncate px-3 py-1 rounded-full bg-[#1e1713] border border-[#2e231c] text-[11px] text-[#f1c38e]">
                📍 {selectedTask.title}
              </div>
            ) : (
              <div className="mt-2 text-xs text-[#7a6b5e] font-light">
                {mode === 'focus' ? 'Skup się na bieżącym ujęciu' : 'Odpocznij od monitora'}
              </div>
            )}
          </div>
        </div>

        {/* Action Controls Bar */}
        <div className="relative z-10 flex items-center gap-3 mt-8">
          <button
            onClick={reset}
            title="Zresetuj czas"
            className="p-3.5 rounded-full bg-[#140f0c] hover:bg-[#1f1712] text-[#9e8f82] hover:text-[#f5ede4] border border-[#2e231c] transition-all active:scale-95"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          {/* Large Main Play/Pause Button */}
          <button
            onClick={toggleRunning}
            className={`px-8 py-4 rounded-full font-medium text-sm shadow-xl flex items-center gap-2.5 transition-all active:scale-95 ${
              isRunning
                ? 'bg-[#1e1713] text-[#f5ede4] border border-[#3d2c20] hover:bg-[#251b14]'
                : 'bg-[#f5ede4] hover:bg-white text-[#120e0a]'
            }`}
          >
            {isRunning ? (
              <>
                <Pause className="w-5 h-5 fill-current" />
                <span>Wstrzymaj sesję</span>
              </>
            ) : (
              <>
                <Play className="w-5 h-5 fill-current ml-0.5" />
                <span>Rozpocznij {mode === 'focus' ? 'skupienie' : 'przerwę'}</span>
              </>
            )}
          </button>

          <button
            onClick={skip}
            title="Przejdź do kolejnego etapu"
            className="p-3.5 rounded-full bg-[#140f0c] hover:bg-[#1f1712] text-[#9e8f82] hover:text-[#f5ede4] border border-[#2e231c] transition-all active:scale-95"
          >
            <SkipForward className="w-5 h-5" />
          </button>
        </div>

        {/* Dynamic Session Accumulator (no 4-session limit - scales for 8-10h workdays) */}
        <div className="relative z-10 flex flex-col items-center justify-center mt-7 max-w-lg px-4 space-y-2.5">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="text-[11px] font-mono uppercase text-[#7a6b5e] tracking-wider">
              Sesje dzisiaj ({completedSessionsToday}):
            </span>

            <div className="flex flex-wrap items-center gap-1.5">
              {/* Completed sessions: 1h sessions as amber capsule dots */}
              {sessionList.map((item, idx) => {
                const isEndOfBlock = (idx + 1) % 4 === 0 && idx + 1 < sessionList.length;
                return (
                  <React.Fragment key={item.id || idx}>
                    <div
                      className="group relative w-6 h-3.5 rounded-full bg-gradient-to-r from-[#d99b5a] via-[#f1c38e] to-[#d99b5a] shadow-md shadow-[#d99b5a]/30 ring-2 ring-[#d99b5a]/40 transition-all duration-300 hover:scale-110 flex items-center justify-center cursor-pointer"
                      title={`Sesja ${idx + 1}: 1h głębokiej pracy 3D (${item.duration || 60} min)`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-[#120e0a] shadow-sm" />
                    </div>
                    {isEndOfBlock && (
                      <div className="w-[1px] h-3 bg-[#382b20] mx-1 opacity-70" />
                    )}
                  </React.Fragment>
                );
              })}

              {/* Current session in progress / upcoming */}
              {mode === 'focus' ? (
                <div
                  className={`w-6 h-3.5 rounded-full border transition-all duration-300 flex items-center justify-center ${
                    isRunning
                      ? 'border-[#d99b5a] bg-[#d99b5a]/30 animate-pulse shadow-sm shadow-[#d99b5a]/40 ring-2 ring-[#d99b5a]/30'
                      : 'border-dashed border-[#d99b5a]/70 bg-[#211812]'
                  }`}
                  title={`Sesja 1h nr ${completedSessionsToday + 1} (${activePreset.focus} min) - ${isRunning ? 'w toku' : 'oczekuje na start'}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${isRunning ? 'bg-[#d99b5a] animate-ping' : 'bg-[#d99b5a]/50'}`} />
                </div>
              ) : mode === 'long_break' ? (
                <div
                  className="w-6 h-3.5 rounded-full border border-[#e07a68] bg-[#e07a68]/25 animate-pulse transition-all duration-300 ring-2 ring-[#e07a68]/30 flex items-center justify-center"
                  title={`Długa przerwa regeneracyjna (${activePreset.longBreak} min)`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#e07a68]" />
                </div>
              ) : (
                <div
                  className="w-3.5 h-3.5 rounded-full border border-[#7ec29a] bg-[#7ec29a]/25 animate-pulse transition-all duration-300 flex items-center justify-center"
                  title={`Krótka przerwa (${activePreset.shortBreak} min)`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#7ec29a]" />
                </div>
              )}
            </div>
          </div>

          {/* Clean minimal legend */}
          <div className="flex items-center justify-center gap-2 text-[10px] font-mono text-[#8c7b6d] pt-0.5">
            <div className="flex items-center gap-1.5">
              <span className="w-5 h-3 rounded-full bg-gradient-to-r from-[#d99b5a] to-[#f1c38e] ring-1 ring-[#d99b5a]/50 flex items-center justify-center">
                <span className="w-1 h-1 rounded-full bg-[#120e0a]" />
              </span>
              <span className="text-[#f1c38e] font-medium">Sesja 1h (60 min głębokiej pracy 3D)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Grid: Session Details & Studio Stats */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        {/* Session Details (7 cols) */}
        <div className="md:col-span-7 glass-panel border border-[#2b211a] rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#2e231c]">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#d99b5a]" />
              <h3 className="text-sm font-medium text-[#f5ede4]">Wariant sesji: Praca 1h</h3>
            </div>
            <span className="text-xs text-[#d99b5a] font-mono">Stały tryb: 60 min</span>
          </div>

          <div className="p-4 rounded-2xl bg-[#140f0c] border border-[#2e231c] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium text-[#f5ede4]">
                  Sesja 1h (Deep 3D Flow)
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-[#d99b5a]/20 text-[#f1c38e] border border-[#d99b5a]/30">
                  Aktywny wariant
                </span>
              </div>
              <span className="text-xs text-[#9e8f82] leading-relaxed block">
                Pojedyncza sesja pracy trwa pełne 60 minut bez przerw i rozpraszaczy. Po każdej godzinie pracy następuje 10 min odpoczynku dla wzroku.
              </span>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0 self-start sm:self-center">
              <span className="px-2.5 py-1 rounded-xl text-xs font-mono font-medium bg-[#2a1e16] text-[#f1c38e] border border-[#d99b5a]/30">
                ⚡ 60m Praca
              </span>
              <span className="px-2.5 py-1 rounded-xl text-xs font-mono font-medium bg-[#18261e] text-[#9ee2b9] border border-[#7ec29a]/30">
                ☕ 10m Przerwa
              </span>
            </div>
          </div>

          {/* Project Link Selector */}
          <div className="pt-2">
            <label className="block text-xs font-medium text-[#c4b5a5] mb-1.5 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-[#d99b5a]" />
              Przypisz sesję do zlecenia 3D (opcjonalne)
            </label>
            <select
              value={selectedTaskId}
              onChange={(e) => setSelectedTaskId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#140f0c] border border-[#2e231c] text-[#f5ede4] text-xs focus:outline-none focus:border-[#d99b5a] cursor-pointer"
            >
              <option value="">-- Brak przypisanego zlecenia (ogólna praca 3D) --</option>
              {tasks.map((task) => (
                <option key={task.id} value={task.id}>
                  {task.title} {task.price ? `(${task.price} zł)` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Daily Stats Summary (5 cols) */}
        <div className="md:col-span-5 glass-panel border border-[#2b211a] rounded-3xl p-6 shadow-xl flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#2e231c]">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-[#7ec29a]" />
              <h3 className="text-sm font-medium text-[#f5ede4]">Dzisiejsza produktywność</h3>
            </div>
            <span className="text-[11px] font-mono text-[#7a6b5e]">JC Studio</span>
          </div>

          <div className="grid grid-cols-2 gap-3 my-auto">
            <div className="p-4 rounded-2xl bg-[#140f0c] border border-[#2e231c] space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#9e8f82] block">
                Ukończone sesje 1h
              </span>
              <div className="text-2xl sm:text-3xl font-light text-[#f5ede4] font-mono">
                {completedSessionsToday}
              </div>
              <div className="text-[10px] font-mono text-[#8c7b6d] flex items-center gap-1.5 flex-wrap">
                <span className="text-[#d99b5a]">{completedSessionsToday} godz.</span>
                {completedSessionsToday === 0 && (
                  <span className="text-[#7ec29a]">cel: 6-8h / dzień</span>
                )}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#140f0c] border border-[#2e231c] space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#9e8f82] block">
                Czas skupienia
              </span>
              <div className="text-2xl sm:text-3xl font-light text-[#f5ede4] font-mono">
                {Math.floor(totalFocusMinutesToday / 60)}h {totalFocusMinutesToday % 60}m
              </div>
              <span className="text-[11px] text-[#d99b5a] block">
                głębokiej pracy 3D
              </span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-[#18120e] border border-[#2e231c] flex items-center justify-between text-xs text-[#9e8f82]">
            <div className="flex items-center gap-2">
              <Coffee className="w-4 h-4 text-[#d99b5a]" />
              <span>Pamiętaj o piciu wody i odpoczynku dla wzroku!</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
