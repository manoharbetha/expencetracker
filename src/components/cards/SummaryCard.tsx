import { ReactNode } from 'react';
import { Badge } from '../ui/Badge';

export const SummaryCard = ({ title, value, icon, tone, change }: { title: string; value: string; icon: ReactNode; tone: 'emerald' | 'rose' | 'blue' | 'violet'; change: string }) => (
  <div className="glass rounded-card p-5 transition-all duration-250 hover:scale-[1.01] hover:border-white/10">
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm text-secondary">{title}</p>
        <p className="amount mt-3 text-2xl font-bold">{value}</p>
      </div>
      <div className={{
        emerald: 'grid h-10 w-10 place-items-center rounded bg-emerald/15 text-emerald',
        rose: 'grid h-10 w-10 place-items-center rounded bg-rose/15 text-rose',
        blue: 'grid h-10 w-10 place-items-center rounded bg-blue/15 text-blue',
        violet: 'grid h-10 w-10 place-items-center rounded bg-violet/15 text-violet',
      }[tone]}>{icon}</div>
    </div>
    <div className="mt-5 flex items-center justify-between">
      <Badge tone={tone}>{change}</Badge>
      <svg viewBox="0 0 120 36" className="h-9 w-24 text-current opacity-80">
        <path d="M2 26 C 18 4, 28 30, 42 16 S 70 12, 82 20 S 105 30, 118 8" fill="none" stroke="currentColor" strokeWidth="3" />
      </svg>
    </div>
  </div>
);
