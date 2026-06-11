import { PiggyBank, ArrowDownRight } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

interface SavingsRecommendation {
  category: string;
  amount: number;
}

interface PotentialSavings {
  amount: number;
  recommendations: SavingsRecommendation[];
}

interface Props {
  savings: PotentialSavings | null;
}

export const PotentialSavingsCard = ({ savings }: Props) => {
  if (!savings || savings.amount === undefined) return null;

  return (
    <section className="glass rounded-card p-5 relative overflow-hidden flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-bold flex items-center gap-2">
          <PiggyBank className="h-5 w-5 text-emerald" />
          Potential Savings
        </h2>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center mb-6">
        <div className="p-4 rounded-2xl bg-emerald/10 border border-emerald/20 text-center w-full">
          <p className="text-secondary text-sm mb-1">Monthly Potential</p>
          <p className="text-3xl font-display font-bold text-emerald">
            {formatCurrency(savings.amount)}
          </p>
        </div>
      </div>

      <div className="space-y-2 mt-auto">
        <h3 className="text-xs uppercase tracking-wider text-secondary font-semibold mb-3">Opportunities</h3>
        {savings.recommendations.length === 0 ? (
          <p className="text-sm text-secondary text-center py-4">You're completely optimized!</p>
        ) : (
          savings.recommendations.map((rec, idx) => (
            <div key={idx} className="flex items-center justify-between text-sm p-3 rounded bg-surface/50 border border-subtle">
              <span className="font-medium text-foreground">{rec.category}</span>
              <div className="flex items-center gap-1 text-emerald font-semibold">
                <ArrowDownRight className="h-3 w-3" />
                {formatCurrency(rec.amount)}
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
};
