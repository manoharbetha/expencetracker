import { Activity, CheckCircle2, AlertTriangle, XCircle, ChevronRight } from 'lucide-react';

interface Breakdown {
  [key: string]: string;
}

interface FinancialHealth {
  score: number;
  grade: string;
  breakdown: Breakdown;
}

interface Props {
  health: FinancialHealth | null;
}

const getGradeColor = (score: number) => {
  if (score >= 75) return 'text-emerald';
  if (score >= 60) return 'text-amber';
  return 'text-rose';
};

const getStatusIcon = (status: string) => {
  const s = status.toLowerCase();
  if (s.includes('excellent') || s.includes('good')) {
    return <CheckCircle2 className="h-4 w-4 text-emerald" />;
  }
  if (s.includes('moderate') || s.includes('average')) {
    return <AlertTriangle className="h-4 w-4 text-amber" />;
  }
  return <XCircle className="h-4 w-4 text-rose" />;
};

export const FinancialHealthCard = ({ health }: Props) => {
  if (!health || health.score === undefined) return null;

  const colorClass = getGradeColor(health.score);

  return (
    <section className="glass rounded-card p-5 relative overflow-hidden flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-bold flex items-center gap-2">
          <Activity className="h-5 w-5 text-blue" />
          Financial Health Score
        </h2>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center mb-6">
        <div className="relative flex items-center justify-center w-32 h-32 mb-4">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle
              className="text-subtle stroke-current"
              strokeWidth="8"
              cx="50"
              cy="50"
              r="40"
              fill="transparent"
            ></circle>
            <circle
              className={`${colorClass} stroke-current transition-all duration-1000 ease-out`}
              strokeWidth="8"
              strokeLinecap="round"
              cx="50"
              cy="50"
              r="40"
              fill="transparent"
              strokeDasharray={`${2 * Math.PI * 40}`}
              strokeDashoffset={`${2 * Math.PI * 40 * (1 - health.score / 100)}`}
            ></circle>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-4xl font-display font-bold ${colorClass}`}>{health.score}</span>
            <span className="text-xs text-secondary">/ 100</span>
          </div>
        </div>
        <div className={`px-4 py-1 rounded-full bg-surface border border-subtle font-semibold text-sm ${colorClass}`}>
          Grade: {health.grade}
        </div>
      </div>

      <div className="space-y-2 mt-auto">
        <h3 className="text-xs uppercase tracking-wider text-secondary font-semibold mb-3">Breakdown</h3>
        {Object.entries(health.breakdown).map(([key, value]) => (
          <div key={key} className="flex items-center justify-between text-sm p-2 rounded bg-surface/50">
            <span className="capitalize text-secondary">
              {key.replace(/([A-Z])/g, ' $1').trim()}
            </span>
            <div className="flex items-center gap-2 font-medium">
              {value}
              {getStatusIcon(value)}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
