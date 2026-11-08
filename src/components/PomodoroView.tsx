import React, { useState, useEffect, useRef } from 'react';
import type { Task } from '../types';
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
  Sliders
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface PomodoroViewProps {
  tasks: Task[];
}

type PomodoroMode = 'focus' | 'short_break' | 'long_break';

interface Preset {
  id: string;
  name: string;
  desc: string;
  focus: number; // in minutes
  shortBreak: number;
  longBreak: number;
}

const PRESETS: Preset[] = [
  {
    id: 'classic',
    name: 'Klasyczne Pomodoro',
    desc: '25 min skupienia • 5 min odpoczynku',
    focus: 25,
    shortBreak: 5,
    longBreak: 15,
  },
  {
    id: 'deep_flow',
    name: 'Deep 3D Flow (Zalecane)',
    desc: '50 min modelowania i oświetlenia • 10 min przerwy',
    focus: 50,
    shortBreak: 10,
    longBreak: 20,
  },
  {
    id: 'sprint',
    name: 'Szybki Sprint',
    desc: '15 min na małe poprawki • 3 min przerwy',
    focus: 15,
    shortBreak: 3,
    longBreak: 10,
  },
];

export const PomodoroView: React.FC<PomodoroViewProps> = ({ tasks }) => {
  const [selectedPresetId, setSelectedPresetId] = useState<string>('classic');
  const [mode, setMode] = useState<PomodoroMode>('focus');
  const [activePreset, setActivePreset] = useState<Preset>(PRESETS[0]);
  
  // Timer state (seconds)
  const [timeLeft, setTimeLeft] = useState<number>(PRESETS[0].focus * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Focus ambient background noise (Web Audio API)
  const [ambientSound, setAmbientSound] = useState<boolean>(false);
  const ambientAudioCtxRef = useRef<AudioContext | null>(null);
  const ambientGainNodeRef = useRef<GainNode | null>(null);

  // Daily stats (stored in localStorage)
  const [completedSessionsToday, setCompletedSessionsToday] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('jc_pomodoro_sessions');
      const savedDate = localStorage.getItem('jc_pomodoro_date');
      const today = new Date().toISOString().slice(0, 10);
      if (savedDate === today && saved) {
        return Number(saved);
      }
      return 0;
    } catch {
      return 0;
    }
  });

  const [totalFocusMinutesToday, setTotalFocusMinutesToday] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('jc_pomodoro_minutes');
      const savedDate = localStorage.getItem('jc_pomodoro_date');
      const today = new Date().toISOString().slice(0, 10);
      if (savedDate === today && saved) {
        return Number(saved);
      }
      return 0;
    } catch {
      return 0;
    }
  });

  // Selected 3D Task
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');

  // Audio chime (Web Audio API synthetic Tibetan bowl / luxury chime)
  const playChime = () => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;

      // Warm crystalline harmony (C5, G5, E6)
      const freqs = [523.25, 783.99, 1318.51];
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);

        gain.gain.setValueAtTime(0.22 / (idx + 1), now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 2.5);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 2.6);
      });
    } catch (e) {
      console.warn('Audio chime could not be played:', e);
    }
  };

  // Toggle ambient focus brown noise generator
  useEffect(() => {
    if (ambientSound && isRunning) {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioCtx();
        ambientAudioCtxRef.current = ctx;

        // Generate gentle warm brown noise buffer
        const bufferSize = ctx.sampleRate * 2;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        let lastOut = 0.0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          data[i] = (lastOut + 0.02 * white) / 1.02;
          lastOut = data[i];
          data[i] *= 1.8; // warm boost
        }

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        noise.loop = true;

        // Soft lowpass filter to make it sound like gentle rain/studio silence
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(380, ctx.currentTime);

        const gainNode = ctx.createGain();
        gainNode.gain.setValueAtTime(0.06, ctx.currentTime);
        ambientGainNodeRef.current = gainNode;

        noise.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(ctx.destination);

        noise.start();
      } catch (e) {
        console.warn('Ambient noise error:', e);
      }
    } else {
      if (ambientAudioCtxRef.current) {
        ambientAudioCtxRef.current.close().catch(() => {});
        ambientAudioCtxRef.current = null;
      }
    }

    return () => {
      if (ambientAudioCtxRef.current) {
        ambientAudioCtxRef.current.close().catch(() => {});
        ambientAudioCtxRef.current = null;
      }
    };
  }, [ambientSound, isRunning]);

  // Handle Preset change
  const handleSelectPreset = (preset: Preset) => {
    setActivePreset(preset);
    setSelectedPresetId(preset.id);
    setIsRunning(false);

    if (mode === 'focus') {
      setTimeLeft(preset.focus * 60);
    } else if (mode === 'short_break') {
      setTimeLeft(preset.shortBreak * 60);
    } else {
      setTimeLeft(preset.longBreak * 60);
    }
  };

  // Switch Mode
  const handleSwitchMode = (newMode: PomodoroMode) => {
    setMode(newMode);
    setIsRunning(false);
    if (newMode === 'focus') {
      setTimeLeft(activePreset.focus * 60);
    } else if (newMode === 'short_break') {
      setTimeLeft(activePreset.shortBreak * 60);
    } else {
      setTimeLeft(activePreset.longBreak * 60);
    }
  };

  // Timer Tick
  useEffect(() => {
    let interval: any = null;

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      // Completed current session
      setIsRunning(false);
      playChime();

      if (mode === 'focus') {
        const newSessions = completedSessionsToday + 1;
        const newMinutes = totalFocusMinutesToday + activePreset.focus;
        setCompletedSessionsToday(newSessions);
        setTotalFocusMinutesToday(newMinutes);

        try {
          const today = new Date().toISOString().slice(0, 10);
          localStorage.setItem('jc_pomodoro_date', today);
          localStorage.setItem('jc_pomodoro_sessions', newSessions.toString());
          localStorage.setItem('jc_pomodoro_minutes', newMinutes.toString());
        } catch {}

        confetti({
          particleCount: 70,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#d99b5a', '#7ec29a', '#f5ede4'],
        });

        // Auto suggest break
        if (newSessions % 4 === 0) {
          handleSwitchMode('long_break');
        } else {
          handleSwitchMode('short_break');
        }
      } else {
        // Break finished, go back to focus
        handleSwitchMode('focus');
      }
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, timeLeft, mode, activePreset]);

  // Update document title with countdown
  useEffect(() => {
    const mins = Math.floor(timeLeft / 60);
    const secs = timeLeft % 60;
    const formatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    const modeLabel = mode === 'focus' ? 'Skupienie' : 'Przerwa';
    
    if (isRunning) {
      document.title = `(${formatted}) ${modeLabel} • JC Studio`;
    } else {
      document.title = 'JC Studio • Pomodoro Timer';
    }

    return () => {
      document.title = 'JC Studio TaskHub';
    };
  }, [timeLeft, isRunning, mode]);

  // Formatting
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  // Progress percentage
  const totalModeSeconds =
    mode === 'focus'
      ? activePreset.focus * 60
      : mode === 'short_break'
      ? activePreset.shortBreak * 60
      : activePreset.longBreak * 60;

  const progressPercent = ((totalModeSeconds - timeLeft) / totalModeSeconds) * 100;

  // Circular SVG params
  const radius = 135;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  const currentThemeColor =
    mode === 'focus'
      ? '#d99b5a'
      : mode === 'short_break'
      ? '#7ec29a'
      : '#e07a68';

  const selectedTask = tasks.find((t) => t.id === selectedTaskId);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Main Timer Display Card */}
      <div className="glass-panel border border-[#2b211a] rounded-3xl p-6 sm:p-10 shadow-2xl flex flex-col items-center justify-center relative overflow-hidden">
        {/* Soft radial background glow matching mode */}
        <div
          className="absolute inset-0 pointer-events-none opacity-15 blur-3xl transition-all duration-700"
          style={{
            background: `radial-gradient(circle at 50% 50%, ${currentThemeColor}, transparent 65%)`,
          }}
        />

        {/* Top Controls Bar: Mode Switcher & Audio Controls */}
        <div className="w-full relative z-10 flex flex-wrap items-center justify-between gap-3 mb-8 pb-4 border-b border-[#2e231c]">
          {/* Mode Switcher Tabs */}
          <div className="flex items-center gap-1 p-1 rounded-full bg-[#140f0c] border border-[#2e231c] shadow-lg">
            <button
              onClick={() => handleSwitchMode('focus')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                mode === 'focus'
                  ? 'bg-[#f5ede4] text-[#120e0a] font-semibold shadow-md'
                  : 'text-[#9e8f82] hover:text-[#f5ede4]'
              }`}
            >
              ⚡ Praca ({activePreset.focus}m)
            </button>
            <button
              onClick={() => handleSwitchMode('short_break')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                mode === 'short_break'
                  ? 'bg-[#7ec29a] text-[#120e0a] font-semibold shadow-md'
                  : 'text-[#9e8f82] hover:text-[#f5ede4]'
              }`}
            >
              ☕ Przerwa ({activePreset.shortBreak}m)
            </button>
            <button
              onClick={() => handleSwitchMode('long_break')}
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
              title="Szum brązowy / deszcz w tle wspomagający skupienie"
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
              stroke={currentThemeColor}
              strokeWidth="9"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              className="transition-all duration-500 ease-linear"
              style={{
                filter: `drop-shadow(0 0 8px ${currentThemeColor}44)`,
              }}
            />
          </svg>

          {/* Centered Numbers and Mode Name */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-[11px] font-mono tracking-widest uppercase text-[#9e8f82] mb-1">
              {mode === 'focus' ? 'Deep Focus Session' : mode === 'short_break' ? 'Short Rest' : 'Long Recovery'}
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
            onClick={() => {
              setIsRunning(false);
              if (mode === 'focus') setTimeLeft(activePreset.focus * 60);
              else if (mode === 'short_break') setTimeLeft(activePreset.shortBreak * 60);
              else setTimeLeft(activePreset.longBreak * 60);
            }}
            title="Zresetuj czas"
            className="p-3.5 rounded-full bg-[#140f0c] hover:bg-[#1f1712] text-[#9e8f82] hover:text-[#f5ede4] border border-[#2e231c] transition-all active:scale-95"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          {/* Large Main Play/Pause Button */}
          <button
            onClick={() => setIsRunning(!isRunning)}
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
            onClick={() => {
              setIsRunning(false);
              if (mode === 'focus') handleSwitchMode('short_break');
              else handleSwitchMode('focus');
            }}
            title="Przejdź do kolejnego etapu"
            className="p-3.5 rounded-full bg-[#140f0c] hover:bg-[#1f1712] text-[#9e8f82] hover:text-[#f5ede4] border border-[#2e231c] transition-all active:scale-95"
          >
            <SkipForward className="w-5 h-5" />
          </button>
        </div>

        {/* Cycle indicators (4 dots) */}
        <div className="relative z-10 flex items-center gap-2 mt-7">
          <span className="text-[11px] font-mono uppercase text-[#7a6b5e] mr-1">
            Cykl sesji:
          </span>
          {[0, 1, 2, 3].map((idx) => {
            const isCompleted = (completedSessionsToday % 4) > idx || (completedSessionsToday > 0 && completedSessionsToday % 4 === 0);
            return (
              <div
                key={idx}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  isCompleted
                    ? 'bg-[#d99b5a] shadow-sm shadow-[#d99b5a]/40 ring-2 ring-[#d99b5a]/20'
                    : 'bg-[#211812] border border-[#2e231c]'
                }`}
                title={`Sesja ${idx + 1} z 4`}
              />
            );
          })}
        </div>
      </div>

      {/* Bottom Grid: Preset Picker & Studio Stats */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        {/* Preset Selector (7 cols) */}
        <div className="md:col-span-7 glass-panel border border-[#2b211a] rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#2e231c]">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#d99b5a]" />
              <h3 className="text-sm font-medium text-[#f5ede4]">Tryby i długości sesji</h3>
            </div>
            <span className="text-xs text-[#9e8f82]">Wybierz rytm pracy</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {PRESETS.map((preset) => {
              const isSelected = selectedPresetId === preset.id;
              return (
                <button
                  key={preset.id}
                  onClick={() => handleSelectPreset(preset)}
                  className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'bg-[#251b14] border-[#d99b5a] ring-1 ring-[#d99b5a] shadow-lg'
                      : 'bg-[#140f0c] border-[#2e231c] hover:border-[#382b20] text-[#9e8f82]'
                  }`}
                >
                  <div>
                    <span className={`text-xs font-medium block mb-1 ${isSelected ? 'text-[#f5ede4]' : 'text-[#c4b5a5]'}`}>
                      {preset.name}
                    </span>
                    <span className="text-[11px] text-[#7a6b5e] leading-relaxed block">
                      {preset.desc}
                    </span>
                  </div>
                  <div className="mt-3 text-[10px] font-mono uppercase text-[#d99b5a] font-medium">
                    {preset.focus}m / {preset.shortBreak}m
                  </div>
                </button>
              );
            })}
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
                Ukończone sesje
              </span>
              <div className="text-2xl sm:text-3xl font-light text-[#f5ede4] font-mono">
                {completedSessionsToday}
              </div>
              <span className="text-[11px] text-[#7ec29a] block">
                cel: 8 sesji / dzień
              </span>
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
              <span>Pamiętaj o piciu wody i krótkiej przerwie dla wzroku!</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
