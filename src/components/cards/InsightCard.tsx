import { Sparkles, TriangleAlert, TrendingUp } from 'lucide-react';
import { Insight } from '../../types';

export const InsightCard = ({ insight }: { insight: Insight }) => {
  const icon = insight.type === 'warning' ? <TriangleAlert className="h-4 w-4" /> : insight.type === 'positive' ? <TrendingUp className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />;
  const color = insight.type === 'warning' ? 'text-amber' : insight.type === 'positive' ? 'text-emerald' : 'text-violet';
  return (
    <div className="rounded border border-white/5 bg-elevated/60 p-4">
      <div className={`mb-2 flex items-center gap-2 text-sm font-bold ${color}`}>{icon}{insight.title}</div>
      <p className="text-sm leading-6 text-secondary">{insight.message}</p>
    </div>
  );
};
