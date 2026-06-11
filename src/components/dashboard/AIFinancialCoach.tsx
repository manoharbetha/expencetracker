import { Bot, RefreshCw } from 'lucide-react';

interface Insight {
  priority: 'high' | 'medium' | 'low';
  type: string;
  title: string;
  message: string;
}

interface Props {
  insights: Insight[];
  onRefresh: () => void;
  loading: boolean;
}

const getPriorityColor = (p: string) => {
  if (p === 'high') return 'text-rose bg-rose/10';
  if (p === 'medium') return 'text-amber bg-amber/10';
  return 'text-emerald bg-emerald/10';
};

const getPriorityDot = (p: string) => {
  if (p === 'high') return '🔴';
  if (p === 'medium') return '🟡';
  return '🟢';
};

export const AIFinancialCoach = ({ insights, onRefresh, loading }: Props) => {
  return (
    <section className="glass rounded-card p-5 relative overflow-hidden">
      {/* Decorative background element */}
      <div className="absolute top-0 right-0 p-8 opacity-5">
        <Bot size={120} />
      </div>
      
      <div className="flex items-center justify-between mb-4 relative z-10">
        <h2 className="font-display font-bold flex items-center gap-2 text-xl">
          <Bot className="h-6 w-6 text-blue" />
          AI Financial Coach
        </h2>
        <button 
          onClick={onRefresh} 
          disabled={loading}
          className="p-2 hover:bg-hover rounded-full transition-colors disabled:opacity-50"
          title="Refresh Insights"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="space-y-3 relative z-10">
        {insights.length === 0 && !loading ? (
          <p className="text-secondary text-sm text-center py-4">No insights available right now.</p>
        ) : (
          insights.map((insight, idx) => (
            <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-surface/50 border border-subtle">
              <span className="mt-0.5 flex-shrink-0 text-sm" title={`${insight.priority} priority`}>
                {getPriorityDot(insight.priority)}
              </span>
              <div>
                <h3 className="font-semibold text-sm mb-1">{insight.title}</h3>
                <p className="text-sm text-secondary leading-relaxed">{insight.message}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
};
