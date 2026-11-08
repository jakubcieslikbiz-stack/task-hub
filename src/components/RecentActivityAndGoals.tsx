import React from 'react';
import type { Task, MonthlyCosts } from '../types';
import {
  ArrowDownLeft,
  Target,
  Layers,
  Cpu,
  Clock,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';

interface RecentActivityAndGoalsProps {
  tasks: Task[];
  costs: MonthlyCosts;
  onNavigateToPipeline: () => void;
  onNavigateToFinances: () => void;
}

export const RecentActivityAndGoals: React.FC<RecentActivityAndGoalsProps> = ({
  tasks,
  costs: _costs,
  onNavigateToPipeline,
  onNavigateToFinances,
}) => {
  // Build recent activity list from real tasks and costs
  const paidTasks = tasks.filter((t) => t.status === 'paid');
  const totalPaidRevenue = paidTasks.reduce((sum, t) => sum + (t.price || 0), 0);

  // Targets
  const q4RevenueTarget = 20000;
  const q4RevenueProgress = Math.min(100, Math.round((totalPaidRevenue / q4RevenueTarget) * 100));

  const monthlyProjectsTarget = 6;
  const completedProjectsCount = tasks.filter((t) => t.status === 'done' || t.status === 'paid').length;
  const monthlyProjectsProgress = Math.min(100, Math.round((completedProjectsCount / monthlyProjectsTarget) * 100));

  const hardwareFundTarget = 15000;
  const hardwareFundCurrent = Math.min(hardwareFundTarget, Math.round(totalPaidRevenue * 0.35));
  const hardwareFundProgress = Math.min(100, Math.round((hardwareFundCurrent / hardwareFundTarget) * 100));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mt-5">
      {/* Recent Activity Card (Kindra left bottom card - 7 cols) */}
      <div className="lg:col-span-7 glass-panel rounded-3xl p-6 shadow-2xl flex flex-col justify-between space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#2e231c]">
          <div>
            <span className="text-xs font-mono uppercase tracking-wider text-[#9e8f82] block">
              Recent activity
            </span>
            <h3 className="text-base font-medium text-[#f5ede4] mt-0.5">
              Ostatnia aktywność studia
            </h3>
          </div>
          <button
            onClick={onNavigateToPipeline}
            className="text-xs text-[#d99b5a] hover:text-[#f1c38e] font-medium flex items-center gap-1 transition-colors"
          >
            <span>Zobacz Pipeline</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Activity Items List */}
        <div className="space-y-3">
          {tasks.slice(0, 4).map((task) => {
            const isPaid = task.status === 'paid';
            const isInProgress = task.status === 'in_progress';

            return (
              <div
                key={task.id}
                onClick={onNavigateToPipeline}
                className="p-3.5 rounded-2xl bg-[#140f0c] border border-[#2e231c] hover:border-[#3d2f24] transition-all flex items-center justify-between gap-3 cursor-pointer group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      isPaid
                        ? 'bg-[#7ec29a]/15 text-[#7ec29a] border border-[#7ec29a]/30'
                        : isInProgress
                        ? 'bg-[#d99b5a]/15 text-[#d99b5a] border border-[#d99b5a]/30'
                        : 'bg-[#251b14] text-[#9e8f82] border border-[#382b20]'
                    }`}
                  >
                    {isPaid ? (
                      <ArrowDownLeft className="w-5 h-5" />
                    ) : isInProgress ? (
                      <Clock className="w-5 h-5" />
                    ) : (
                      <CheckCircle2 className="w-5 h-5" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <h4 className="text-xs sm:text-sm font-medium text-[#f5ede4] truncate group-hover:text-[#f1c38e] transition-colors">
                      {task.title}
                    </h4>
                    <div className="flex items-center gap-2 text-[11px] text-[#9e8f82] mt-0.5">
                      <span>{task.category === 'work' ? 'Zlecenie 3D' : 'Osobiste'}</span>
                      <span>•</span>
                      <span className={isPaid ? 'text-[#7ec29a]' : isInProgress ? 'text-[#d99b5a]' : 'text-[#9e8f82]'}>
                        {isPaid ? 'Opłacono' : isInProgress ? 'W toku' : 'Gotowe'}
                      </span>
                    </div>
                  </div>
                </div>

                {task.price && (
                  <div className="text-right flex-shrink-0 font-mono">
                    <div
                      className={`text-xs sm:text-sm font-medium ${
                        isPaid ? 'text-[#7ec29a]' : 'text-[#f5ede4]'
                      }`}
                    >
                      {isPaid ? '+' : ''}{task.price.toLocaleString('pl-PL')} zł
                    </div>
                    <span className="text-[10px] text-[#7a6b5e]">
                      {isPaid ? 'Przychód' : 'Wycena'}
                    </span>
                  </div>
                )}
              </div>
            );
          })}

          {tasks.length === 0 && (
            <div className="text-center py-6 text-xs text-[#7a6b5e]">
              Brak zarejestrowanej aktywności w tym miesiącu.
            </div>
          )}
        </div>

        <div className="pt-2 flex items-center justify-between text-xs text-[#9e8f82]">
          <span>Synchronizacja ze statusem w Pipeline</span>
          <button
            onClick={onNavigateToFinances}
            className="text-[11px] text-[#9e8f82] hover:text-[#f5ede4] transition-colors"
          >
            Przejdź do Finansów →
          </button>
        </div>
      </div>

      {/* Studio Goals Card (Kindra right bottom card - 5 cols) */}
      <div className="lg:col-span-5 glass-panel rounded-3xl p-6 shadow-2xl flex flex-col justify-between space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-[#2e231c]">
          <div>
            <span className="text-xs font-mono uppercase tracking-wider text-[#9e8f82] block">
              Studio goals
            </span>
            <h3 className="text-base font-medium text-[#f5ede4] mt-0.5">
              Cele biznesowe JC Studio
            </h3>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-mono uppercase text-[#7a6b5e] block">
              3 aktywne
            </span>
            <span className="text-sm font-medium text-[#7ec29a] font-mono">
              {q4RevenueProgress}%
            </span>
          </div>
        </div>

        {/* Goals Progress Bars */}
        <div className="space-y-4 my-auto">
          {/* Goal 1: Q4 Bookings / Przychody */}
          <div className="p-4 rounded-2xl bg-[#140f0c] border border-[#2e231c] space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#f5ede4] font-medium flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-[#d99b5a]" />
                Przychód miesięczny (JC Studio)
              </span>
              <span className="font-mono text-[#d99b5a] font-medium">
                {q4RevenueProgress}%
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full h-2 rounded-full bg-[#251b14] overflow-hidden">
              <div
                className="h-full rounded-full bg-[#f5ede4] transition-all duration-700 shadow-sm"
                style={{ width: `${q4RevenueProgress}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-[#9e8f82] font-mono pt-0.5">
              <span>{totalPaidRevenue.toLocaleString('pl-PL')} zł</span>
              <span>cel: {q4RevenueTarget.toLocaleString('pl-PL')} zł</span>
            </div>
          </div>

          {/* Goal 2: Zrealizowane projekty 3D */}
          <div className="p-4 rounded-2xl bg-[#140f0c] border border-[#2e231c] space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#f5ede4] font-medium flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[#7ec29a]" />
                Zrealizowane wizualizacje
              </span>
              <span className="font-mono text-[#7ec29a] font-medium">
                {completedProjectsCount} / {monthlyProjectsTarget}
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full h-2 rounded-full bg-[#251b14] overflow-hidden">
              <div
                className="h-full rounded-full bg-[#7ec29a] transition-all duration-700 shadow-sm"
                style={{ width: `${monthlyProjectsProgress}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-[#9e8f82] font-mono pt-0.5">
              <span>{completedProjectsCount} gotowe</span>
              <span>cel: {monthlyProjectsTarget} zleceń</span>
            </div>
          </div>

          {/* Goal 3: Hardware Fund (GPU RTX / Stacja renderująca) */}
          <div className="p-4 rounded-2xl bg-[#140f0c] border border-[#2e231c] space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#f5ede4] font-medium flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-[#f1c38e]" />
                Fundusz na sprzęt (GPU RTX)
              </span>
              <span className="font-mono text-[#f1c38e] font-medium">
                {hardwareFundProgress}%
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full h-2 rounded-full bg-[#251b14] overflow-hidden">
              <div
                className="h-full rounded-full bg-[#d99b5a] transition-all duration-700 shadow-sm"
                style={{ width: `${hardwareFundProgress}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-[#9e8f82] font-mono pt-0.5">
              <span>{hardwareFundCurrent.toLocaleString('pl-PL')} zł</span>
              <span>cel: {hardwareFundTarget.toLocaleString('pl-PL')} zł</span>
            </div>
          </div>
        </div>

        <div className="text-[11px] text-[#7a6b5e] pt-1 text-center font-mono">
          Automatyczna kalkulacja celów na podstawie wpłat
        </div>
      </div>
    </div>
  );
};
