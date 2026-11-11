import React, { useState, useEffect } from 'react';
import type { Task } from '../types';
import { useAnimatedCounter } from '../hooks/useAnimatedCounter';
import {
  Target,
  Cpu,
  ChevronRight
} from 'lucide-react';

interface RecentActivityAndGoalsProps {
  tasks: Task[];
  onNavigateToFinances?: () => void;
  // Kept for backward compatibility
  costs?: any;
  onNavigateToPipeline?: () => void;
}

export const RecentActivityAndGoals: React.FC<RecentActivityAndGoalsProps> = ({
  tasks,
  onNavigateToFinances,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 60);
    return () => clearTimeout(timer);
  }, []);

  const paidTasks = tasks.filter((t) => t.status === 'paid');
  const totalPaidRevenue = paidTasks.reduce((sum, t) => sum + (t.price || 0), 0);

  // Targets
  const q4RevenueTarget = 20000;
  const q4RevenueProgress = Math.min(100, Math.round((totalPaidRevenue / q4RevenueTarget) * 100));

  const hardwareFundTarget = 15000;
  const hardwareFundCurrent = Math.min(hardwareFundTarget, Math.round(totalPaidRevenue * 0.35));
  const hardwareFundProgress = Math.min(100, Math.round((hardwareFundCurrent / hardwareFundTarget) * 100));

  const averageProgress = Math.round((q4RevenueProgress + hardwareFundProgress) / 2);

  // Animated counters for smooth ticking numbers
  const animAverageProgress = useAnimatedCounter(averageProgress, 1200);
  const animQ4Progress = useAnimatedCounter(q4RevenueProgress, 1200);
  const animTotalPaidRevenue = useAnimatedCounter(totalPaidRevenue, 1200);
  const animHardwareProgress = useAnimatedCounter(hardwareFundProgress, 1200);
  const animHardwareCurrent = useAnimatedCounter(hardwareFundCurrent, 1200);

  return (
    <div className="mt-5">
      {/* Studio Goals Card (Full Width) */}
      <div className="glass-panel rounded-3xl p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-[#2e231c]">
          <div>
            <span className="text-xs font-mono uppercase tracking-wider text-[#9e8f82] block">
              Studio goals
            </span>
            <h3 className="text-base font-medium text-[#f5ede4] mt-0.5">
              Cele biznesowe JC Studio
            </h3>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <span className="text-[10px] font-mono uppercase text-[#7a6b5e] block">
                2 aktywne cele
              </span>
              <span className="text-sm font-medium text-[#7ec29a] font-mono">
                {animAverageProgress}% średni postęp
              </span>
            </div>
            {onNavigateToFinances && (
              <button
                onClick={onNavigateToFinances}
                className="hidden sm:flex items-center gap-1 text-xs text-[#d99b5a] hover:text-[#f1c38e] font-medium transition-colors"
              >
                <span>Finanse</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* 2 Goals Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Goal 1: Q4 Bookings / Przychody */}
          <div className="p-4 rounded-2xl bg-[#140f0c] border border-[#2e231c] hover:border-[#3d2f24] space-y-2.5 flex flex-col justify-between transition-all duration-200 card-hover-lift stagger-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#f5ede4] font-medium flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-[#d99b5a]" />
                Przychód miesięczny
              </span>
              <span className="font-mono text-[#d99b5a] font-medium">
                {animQ4Progress}%
              </span>
            </div>

            {/* Animated filling progress bar with shimmer sweep */}
            <div className="w-full h-2.5 rounded-full bg-[#201712] overflow-hidden my-1 relative border border-[#2e231c]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#d99b5a]/70 via-[#f5ede4] to-white shadow-[0_0_12px_rgba(245,237,228,0.45)] relative overflow-hidden"
                style={{
                  width: isLoaded ? `${q4RevenueProgress}%` : '0%',
                  transition: 'width 1.3s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" />
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-[#9e8f82] font-mono pt-0.5">
              <span>{animTotalPaidRevenue.toLocaleString('pl-PL')} zł</span>
              <span>cel: {q4RevenueTarget.toLocaleString('pl-PL')} zł</span>
            </div>
          </div>

          {/* Goal 2: Hardware Fund (GPU RTX / Stacja renderująca) */}
          <div className="p-4 rounded-2xl bg-[#140f0c] border border-[#2e231c] hover:border-[#3d2f24] space-y-2.5 flex flex-col justify-between transition-all duration-200 card-hover-lift stagger-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#f5ede4] font-medium flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-[#f1c38e]" />
                Fundusz sprzętowy (GPU RTX)
              </span>
              <span className="font-mono text-[#f1c38e] font-medium">
                {animHardwareProgress}%
              </span>
            </div>

            {/* Animated filling progress bar with shimmer sweep */}
            <div className="w-full h-2.5 rounded-full bg-[#201712] overflow-hidden my-1 relative border border-[#2e231c]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#8a5223] via-[#d99b5a] to-[#f1c38e] shadow-[0_0_12px_rgba(217,155,90,0.4)] relative overflow-hidden"
                style={{
                  width: isLoaded ? `${hardwareFundProgress}%` : '0%',
                  transition: 'width 1.3s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" />
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-[#9e8f82] font-mono pt-0.5">
              <span>{animHardwareCurrent.toLocaleString('pl-PL')} zł</span>
              <span>cel: {hardwareFundTarget.toLocaleString('pl-PL')} zł</span>
            </div>
          </div>
        </div>

        <div className="text-[11px] text-[#7a6b5e] pt-1 text-center font-mono">
          Automatyczna kalkulacja celów studia na podstawie opłaconych zleceń
        </div>
      </div>
    </div>
  );
};
