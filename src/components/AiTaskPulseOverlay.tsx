import React, { useState, useEffect } from 'react';
import { AI_TASK_ADDED_EVENT } from '../lib/effects';
import { Sparkles, Check } from 'lucide-react';

export const AiTaskPulseOverlay: React.FC = () => {
  const [pulseKey, setPulseKey] = useState<number | null>(null);

  useEffect(() => {
    const handleTrigger = () => {
      setPulseKey(Date.now());
    };

    window.addEventListener(AI_TASK_ADDED_EVENT, handleTrigger);
    return () => window.removeEventListener(AI_TASK_ADDED_EVENT, handleTrigger);
  }, []);

  useEffect(() => {
    if (!pulseKey) return;
    const timer = setTimeout(() => {
      setPulseKey(null);
    }, 1500);
    return () => clearTimeout(timer);
  }, [pulseKey]);

  if (!pulseKey) return null;

  return (
    <div
      key={pulseKey}
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-[999999] overflow-hidden"
    >
      {/* Animowany kontener pulsujący na zielono */}
      <div className="absolute inset-0 animate-ai-green-pulse">
        {/* Subtelny ambient gradient w tonacji Kindra Sage / Emerald */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(circle at 50% 50%, rgba(126, 194, 154, 0.08) 0%, rgba(34, 197, 94, 0.16) 100%)',
            boxShadow:
              'inset 0 0 80px 25px rgba(126, 194, 154, 0.42), inset 0 0 180px 80px rgba(34, 197, 94, 0.22)',
          }}
        />

        {/* Lśniąca ramka krawędziowa */}
        <div className="absolute inset-0 border-2 border-[#7ec29a]/50 shadow-[0_0_30px_rgba(126,194,154,0.45)]" />

        {/* Górna i dolna linia neonowa */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#7ec29a] to-transparent shadow-[0_0_15px_#7ec29a]" />
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#7ec29a] to-transparent shadow-[0_0_15px_#7ec29a]" />

        {/* Dyskretna pigułka potwierdzenia na górze ekranu */}
        <div className="absolute top-4 sm:top-6 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#18120e]/95 border border-[#7ec29a]/60 text-[#7ec29a] text-xs font-medium shadow-2xl backdrop-blur-md animate-slide-up">
          <div className="w-4 h-4 rounded-full bg-[#7ec29a]/20 flex items-center justify-center text-[#7ec29a]">
            <Check className="w-3 h-3" />
          </div>
          <span>Zadanie dodane przez AI</span>
          <Sparkles className="w-3 h-3 text-[#d99b5a]" />
        </div>
      </div>
    </div>
  );
};
