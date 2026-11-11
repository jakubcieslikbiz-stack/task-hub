import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';

export type PomodoroMode = 'focus' | 'short_break' | 'long_break';

export interface Preset {
  id: string;
  name: string;
  desc: string;
  focus: number; // in minutes
  shortBreak: number;
  longBreak: number;
}

export const POMODORO_PRESETS: Preset[] = [
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

interface PomodoroContextType {
  mode: PomodoroMode;
  activePreset: Preset;
  selectedPresetId: string;
  timeLeft: number;
  isRunning: boolean;
  selectedTaskId: string;
  soundEnabled: boolean;
  ambientSound: boolean;
  completedSessionsToday: number;
  totalFocusMinutesToday: number;
  progressPercent: number;
  formattedTime: string;
  themeColor: string;
  // Actions
  start: () => void;
  pause: () => void;
  toggleRunning: () => void;
  reset: () => void;
  skip: () => void;
  selectPreset: (preset: Preset) => void;
  switchMode: (newMode: PomodoroMode) => void;
  setSelectedTaskId: (id: string) => void;
  setSoundEnabled: (enabled: boolean) => void;
  setAmbientSound: (enabled: boolean) => void;
}

const PomodoroContext = createContext<PomodoroContextType | null>(null);

const STORAGE_KEY_STATE = 'jc_pomodoro_active_state';
const STORAGE_KEY_SESSIONS = 'jc_pomodoro_sessions';
const STORAGE_KEY_MINUTES = 'jc_pomodoro_minutes';
const STORAGE_KEY_DATE = 'jc_pomodoro_date';

export const PomodoroProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load initial preset
  const [selectedPresetId, setSelectedPresetId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_STATE);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.presetId) return parsed.presetId;
      }
    } catch {}
    return 'classic';
  });

  const activePreset = POMODORO_PRESETS.find((p) => p.id === selectedPresetId) || POMODORO_PRESETS[0];

  const [mode, setMode] = useState<PomodoroMode>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_STATE);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.mode) return parsed.mode;
      }
    } catch {}
    return 'focus';
  });

  // Calculate default mode seconds
  const getModeSeconds = useCallback((m: PomodoroMode, preset: Preset) => {
    if (m === 'focus') return preset.focus * 60;
    if (m === 'short_break') return preset.shortBreak * 60;
    return preset.longBreak * 60;
  }, []);

  // Time left in seconds
  const [timeLeft, setTimeLeft] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_STATE);
      if (saved) {
        const parsed = JSON.parse(saved);
        // If it was running with targetEndTime
        if (parsed.isRunning && parsed.targetEndTime) {
          const diff = Math.max(0, Math.round((parsed.targetEndTime - Date.now()) / 1000));
          return diff;
        }
        if (typeof parsed.timeLeft === 'number') {
          return parsed.timeLeft;
        }
      }
    } catch {}
    return getModeSeconds('focus', activePreset);
  });

  const [isRunning, setIsRunning] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_STATE);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.isRunning && parsed.targetEndTime && parsed.targetEndTime > Date.now()) {
          return true;
        }
      }
    } catch {}
    return false;
  });

  // Target epoch time in ms for exact, drift-free background countdown
  const initialTargetEndTime = (() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_STATE);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.isRunning && parsed.targetEndTime && parsed.targetEndTime > Date.now()) {
          return parsed.targetEndTime as number;
        }
      }
    } catch {}
    return null;
  })();

  const targetEndTimeRef = useRef<number | null>(initialTargetEndTime);

  const [selectedTaskId, setSelectedTaskId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_STATE);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.selectedTaskId || '';
      }
    } catch {}
    return '';
  });

  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [ambientSound, setAmbientSound] = useState<boolean>(false);

  // Audio Context refs
  const ambientAudioCtxRef = useRef<AudioContext | null>(null);
  const ambientGainNodeRef = useRef<GainNode | null>(null);

  // Daily stats
  const [completedSessionsToday, setCompletedSessionsToday] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SESSIONS);
      const savedDate = localStorage.getItem(STORAGE_KEY_DATE);
      const today = new Date().toISOString().slice(0, 10);
      if (savedDate === today && saved) return Number(saved);
      return 0;
    } catch {
      return 0;
    }
  });

  const [totalFocusMinutesToday, setTotalFocusMinutesToday] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_MINUTES);
      const savedDate = localStorage.getItem(STORAGE_KEY_DATE);
      const today = new Date().toISOString().slice(0, 10);
      if (savedDate === today && saved) return Number(saved);
      return 0;
    } catch {
      return 0;
    }
  });

  // Play Tibetan bowl / luxury crystalline chime
  const playChime = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;

      // Warm crystalline harmony (C5, G5, E6)
      const freqs = [523.25, 783.99, 1318.51];
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);

        gain.gain.setValueAtTime(0.25 / (idx + 1), now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 2.5);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 2.6);
      });
    } catch (e) {
      console.warn('Audio chime could not be played:', e);
    }
  }, [soundEnabled]);

  // Request browser notification permission if not yet decided
  const requestNotificationPermission = useCallback(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission().catch(() => {});
      }
    }
  }, []);

  // Send desktop/phone notification when session completes
  const sendCompletionNotification = useCallback(
    (finishedMode: PomodoroMode) => {
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        try {
          if (finishedMode === 'focus') {
            new Notification('JC Studio: Czas na przerwę! ☕', {
              body: 'Świetna robota! Sesja skupienia zakończona. Odpocznij od monitora i napij się wody.',
              icon: '/favicon.svg',
            });
          } else {
            new Notification('JC Studio: Koniec przerwy! ⚡', {
              body: 'Czas wrócić do modelowania i ujęć 3D.',
              icon: '/favicon.svg',
            });
          }
        } catch {}
      }
    },
    []
  );

  // Switch Mode
  const switchMode = useCallback(
    (newMode: PomodoroMode) => {
      setMode(newMode);
      setIsRunning(false);
      targetEndTimeRef.current = null;
      const newSecs = getModeSeconds(newMode, activePreset);
      setTimeLeft(newSecs);
    },
    [activePreset, getModeSeconds]
  );

  // Start timer
  const start = useCallback(() => {
    requestNotificationPermission();
    const now = Date.now();
    targetEndTimeRef.current = now + timeLeft * 1000;
    setIsRunning(true);
  }, [timeLeft, requestNotificationPermission]);

  // Pause timer
  const pause = useCallback(() => {
    if (targetEndTimeRef.current) {
      const remaining = Math.max(0, Math.round((targetEndTimeRef.current - Date.now()) / 1000));
      setTimeLeft(remaining);
      targetEndTimeRef.current = null;
    }
    setIsRunning(false);
  }, []);

  const toggleRunning = useCallback(() => {
    if (isRunning) pause();
    else start();
  }, [isRunning, pause, start]);

  // Reset timer
  const reset = useCallback(() => {
    setIsRunning(false);
    targetEndTimeRef.current = null;
    setTimeLeft(getModeSeconds(mode, activePreset));
  }, [mode, activePreset, getModeSeconds]);

  // Skip to next stage
  const skip = useCallback(() => {
    setIsRunning(false);
    targetEndTimeRef.current = null;
    if (mode === 'focus') switchMode('short_break');
    else switchMode('focus');
  }, [mode, switchMode]);

  // Select Preset
  const selectPreset = useCallback(
    (preset: Preset) => {
      setSelectedPresetId(preset.id);
      setIsRunning(false);
      targetEndTimeRef.current = null;
      setTimeLeft(getModeSeconds(mode, preset));
    },
    [mode, getModeSeconds]
  );

  // Ambient sound management
  useEffect(() => {
    if (ambientSound && isRunning) {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        ambientAudioCtxRef.current = ctx;

        const bufferSize = ctx.sampleRate * 2;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        let lastOut = 0.0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          data[i] = (lastOut + 0.02 * white) / 1.02;
          lastOut = data[i];
          data[i] *= 1.8;
        }

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        noise.loop = true;

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

  // Main background tick effect - runs GLOBALLY across the whole app
  useEffect(() => {
    let interval: any = null;

    if (isRunning) {
      interval = setInterval(() => {
        if (!targetEndTimeRef.current) {
          targetEndTimeRef.current = Date.now() + timeLeft * 1000;
        }

        const remaining = Math.max(0, Math.round((targetEndTimeRef.current - Date.now()) / 1000));
        setTimeLeft(remaining);

        if (remaining <= 0) {
          clearInterval(interval);
          setIsRunning(false);
          targetEndTimeRef.current = null;

          playChime();
          sendCompletionNotification(mode);

          if (mode === 'focus') {
            const newSessions = completedSessionsToday + 1;
            const newMinutes = totalFocusMinutesToday + activePreset.focus;
            setCompletedSessionsToday(newSessions);
            setTotalFocusMinutesToday(newMinutes);

            try {
              const today = new Date().toISOString().slice(0, 10);
              localStorage.setItem(STORAGE_KEY_DATE, today);
              localStorage.setItem(STORAGE_KEY_SESSIONS, newSessions.toString());
              localStorage.setItem(STORAGE_KEY_MINUTES, newMinutes.toString());
            } catch {}

            try {
              confetti({
                particleCount: 70,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#d99b5a', '#7ec29a', '#f5ede4'],
              });
            } catch {}

            // Auto suggest break
            if (newSessions % 4 === 0) {
              setMode('long_break');
              setTimeLeft(activePreset.longBreak * 60);
            } else {
              setMode('short_break');
              setTimeLeft(activePreset.shortBreak * 60);
            }
          } else {
            // Break ended, prepare focus
            setMode('focus');
            setTimeLeft(activePreset.focus * 60);
          }
        }
      }, 500);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [
    isRunning,
    timeLeft,
    mode,
    activePreset,
    completedSessionsToday,
    totalFocusMinutesToday,
    playChime,
    sendCompletionNotification,
  ]);

  // Global document title update
  useEffect(() => {
    const mins = Math.floor(timeLeft / 60);
    const secs = timeLeft % 60;
    const formatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    const modeLabel = mode === 'focus' ? 'Skupienie' : 'Przerwa';

    if (isRunning) {
      document.title = `(${formatted}) ${modeLabel} • JC Studio`;
    } else {
      document.title = 'JC Studio TaskHub';
    }

    return () => {
      document.title = 'JC Studio TaskHub';
    };
  }, [timeLeft, isRunning, mode]);

  // Save active timer state in localStorage
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY_STATE,
        JSON.stringify({
          mode,
          presetId: selectedPresetId,
          timeLeft,
          isRunning,
          targetEndTime: targetEndTimeRef.current,
          selectedTaskId,
        })
      );
    } catch {}
  }, [mode, selectedPresetId, timeLeft, isRunning, selectedTaskId]);

  // Computed values
  const totalModeSeconds = getModeSeconds(mode, activePreset);
  const progressPercent = Math.min(100, Math.max(0, ((totalModeSeconds - timeLeft) / totalModeSeconds) * 100));

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const themeColor =
    mode === 'focus' ? '#d99b5a' : mode === 'short_break' ? '#7ec29a' : '#e07a68';

  const value: PomodoroContextType = {
    mode,
    activePreset,
    selectedPresetId,
    timeLeft,
    isRunning,
    selectedTaskId,
    soundEnabled,
    ambientSound,
    completedSessionsToday,
    totalFocusMinutesToday,
    progressPercent,
    formattedTime,
    themeColor,
    start,
    pause,
    toggleRunning,
    reset,
    skip,
    selectPreset,
    switchMode,
    setSelectedTaskId,
    setSoundEnabled,
    setAmbientSound,
  };

  return <PomodoroContext.Provider value={value}>{children}</PomodoroContext.Provider>;
};

export const usePomodoro = (): PomodoroContextType => {
  const ctx = useContext(PomodoroContext);
  if (!ctx) {
    throw new Error('usePomodoro must be used within a PomodoroProvider');
  }
  return ctx;
};
