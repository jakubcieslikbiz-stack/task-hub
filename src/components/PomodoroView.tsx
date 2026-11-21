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
  Headphones,
  Layers,
  Target,
  CheckCircle2,
} from 'lucide-react';

interface PomodoroViewProps {
  tasks: Task[];
}

export const PomodoroView: React.FC<PomodoroViewProps> = ({ tasks }) => {
  const {
    isRunning,
    selectedTaskId,
    soundEnabled,
    ambientSound,
    completedSessionsToday,
    totalFocusMinutesToday,
    progressPercent,
    formattedTime,
    themeColor,
    toggleRunning,
    reset,
    skip,
    setSelectedTaskId,
    setSoundEnabled,
    setAmbientSound,
  } = usePomodoro();

  // Circular SVG params
  const radius = 135;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  const selectedTask = tasks.find((t) => t.id === selectedTaskId);

  // Daily target: 6-8 h
  const targetMin = 6;
  const targetMax = 8;
  const slotsCount = 8;

  const hoursCompleted = Math.floor(totalFocusMinutesToday / 60);
  const minutesRemainder = totalFocusMinutesToday % 60;

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-in fade-in duration-200">
      {/* Main Card */}
      <div className="glass-panel border border-[#2b211a] rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col items-center justify-center relative overflow-hidden">
        {/* Soft radial background glow */}
        <div
          className="absolute inset-0 pointer-events-none opacity-15 blur-3xl transition-all duration-700"
          style={{
            background: `radial-gradient(circle at 50% 50%, ${themeColor}, transparent 65%)`,
          }}
        />

        {/* Top bar: Target indicator & Sound controls */}
        <div className="w-full relative z-10 flex items-center justify-between gap-3 mb-6 pb-4 border-b border-[#2e231c]">
          {/* Target indicator */}
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#140f0c] border border-[#2e231c] text-xs">
            <Target className="w-3.5 h-3.5 text-[#d99b5a]" />
            <span className="text-[#9e8f82]">Cel:</span>
            <span className="font-mono font-medium text-[#f5ede4]">6-8 h</span>
            <span className="text-[#382b20]">•</span>
            <span className="text-[#9e8f82]">Sesje:</span>
            <span className="font-mono font-semibold text-[#f1c38e]">{completedSessionsToday}</span>
          </div>

          {/* Audio Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setAmbientSound(!ambientSound)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border flex items-center gap-1.5 transition-all ${
                ambientSound
                  ? 'bg-[#d99b5a]/20 text-[#f1c38e] border-[#d99b5a]/40 shadow-sm'
                  : 'bg-[#140f0c] text-[#9e8f82] border-[#2e231c] hover:text-[#f5ede4]'
              }`}
              title="Szum w tle wspomagający skupienie"
            >
              <Headphones className="w-3.5 h-3.5" />
              <span>Szum {ambientSound ? '(Wł.)' : ''}</span>
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
        <div className="relative z-10 w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center my-2 select-none">
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

          {/* Centered Numbers */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <div className="text-5xl sm:text-6xl font-light text-[#f5ede4] tracking-tight font-mono">
              {formattedTime}
            </div>

            {selectedTask && (
              <div className="mt-3 max-w-[210px] truncate px-3 py-1 rounded-full bg-[#1e1713] border border-[#2e231c] text-[11px] text-[#f1c38e]">
                📍 {selectedTask.title}
              </div>
            )}
          </div>
        </div>

        {/* Action Controls Bar */}
        <div className="relative z-10 flex items-center gap-3 mt-6">
          <button
            onClick={reset}
            title="Resetuj do 60:00"
            className="p-3.5 rounded-full bg-[#140f0c] hover:bg-[#1f1712] text-[#9e8f82] hover:text-[#f5ede4] border border-[#2e231c] transition-all active:scale-95"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          <button
            onClick={toggleRunning}
            className={`px-8 py-3.5 rounded-full font-medium text-sm shadow-xl flex items-center gap-2.5 transition-all active:scale-95 ${
              isRunning
                ? 'bg-[#1e1713] text-[#f5ede4] border border-[#3d2c20] hover:bg-[#251b14]'
                : 'bg-[#f5ede4] hover:bg-white text-[#120e0a]'
            }`}
          >
            {isRunning ? (
              <>
                <Pause className="w-5 h-5 fill-current" />
                <span>Wstrzymaj</span>
              </>
            ) : (
              <>
                <Play className="w-5 h-5 fill-current ml-0.5" />
                <span>Rozpocznij (1h)</span>
              </>
            )}
          </button>

          <button
            onClick={skip}
            title="Nowa sesja 1h"
            className="p-3.5 rounded-full bg-[#140f0c] hover:bg-[#1f1712] text-[#9e8f82] hover:text-[#f5ede4] border border-[#2e231c] transition-all active:scale-95"
          >
            <SkipForward className="w-5 h-5" />
          </button>
        </div>

        {/* Session Count & 6-8h Target Visual Indicator */}
        <div className="relative z-10 w-full mt-7 pt-5 border-t border-[#2e231c]/70 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#9e8f82] font-mono">
              Sesje dzisiaj: <strong className="text-[#f5ede4]">{completedSessionsToday}</strong>
              <span className="text-[#7a6b5e] mx-1.5">•</span>
              Czas: <strong className="text-[#f5ede4]">{hoursCompleted}h {minutesRemainder}m</strong>
            </span>

            <span className="font-mono text-xs">
              {completedSessionsToday >= targetMin ? (
                <span className="inline-flex items-center gap-1 text-[#7ec29a]">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Cel osiągnięty ({completedSessionsToday}/{targetMin}-{targetMax}h)
                </span>
              ) : (
                <span className="text-[#d99b5a]">
                  Cel: {targetMin}-{targetMax} h (zostało {targetMin - completedSessionsToday}h)
                </span>
              )}
            </span>
          </div>

          {/* 8-slot capsule bar */}
          <div className="grid grid-cols-8 gap-1.5">
            {Array.from({ length: slotsCount }).map((_, idx) => {
              const sessionNum = idx + 1;
              const isCompleted = idx < completedSessionsToday;
              const isCurrent = idx === completedSessionsToday && isRunning;
              const isTargetZone = sessionNum >= targetMin && sessionNum <= targetMax;

              return (
                <div
                  key={idx}
                  title={`Sesja ${sessionNum}h ${isCompleted ? '(ukończona)' : isCurrent ? '(w toku)' : ''} ${isTargetZone ? '• Strefa celu 6-8h' : ''}`}
                  className={`h-4 rounded-full transition-all duration-300 flex items-center justify-center relative ${
                    isCompleted
                      ? 'bg-gradient-to-r from-[#d99b5a] to-[#f1c38e] shadow-sm shadow-[#d99b5a]/30'
                      : isCurrent
                      ? 'border border-[#d99b5a] bg-[#d99b5a]/30 animate-pulse'
                      : isTargetZone
                      ? 'bg-[#1e1713] border border-[#d99b5a]/30'
                      : 'bg-[#140f0c] border border-[#2e231c]'
                  }`}
                >
                  <span className={`text-[9px] font-mono ${isCompleted ? 'text-[#120e0a] font-bold' : isTargetZone ? 'text-[#d99b5a]/60' : 'text-[#524438]'}`}>
                    {sessionNum}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Task Assignment Section */}
      <div className="glass-panel border border-[#2b211a] rounded-3xl p-4 sm:p-5 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <label className="text-xs font-medium text-[#c4b5a5] flex items-center gap-2 flex-shrink-0 cursor-pointer">
          <Layers className="w-4 h-4 text-[#d99b5a]" />
          <span>Przypisanie sesji do zadania:</span>
        </label>
        <select
          value={selectedTaskId}
          onChange={(e) => setSelectedTaskId(e.target.value)}
          className="flex-1 max-w-md px-3.5 py-2 rounded-2xl bg-[#140f0c] border border-[#2e231c] text-[#f5ede4] text-xs focus:outline-none focus:border-[#d99b5a] cursor-pointer"
        >
          <option value="">-- Bez przypisania (ogólna praca) --</option>
          {tasks.map((task) => (
            <option key={task.id} value={task.id} className="bg-[#140f0c] text-[#f5ede4]">
              {task.title} {task.price ? `(${Number(task.price).toLocaleString('pl-PL')} zł)` : ''}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};
