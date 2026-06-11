import { differenceInCalendarDays, parseISO } from 'date-fns';
import { formatCurrency } from '../../utils/formatters';
import { Badge } from '../ui/Badge';

// Works with both API Goal type and old mock type
export interface GoalCardProps {
  id: string;
  goalName?: string;
  name?: string;
  targetAmount?: number;
  target?: number;
  savedAmount?: number;
  saved?: number;
  deadline: string;
  progressPercentage?: number;
  remainingAmount?: number;
  monthlySavingsNeeded?: number;
}

export const GoalCard = ({ goal }: { goal: GoalCardProps }) => {
  const name = goal.goalName ?? goal.name ?? 'Goal';
  const target = goal.targetAmount ?? goal.target ?? 0;
  const saved = goal.savedAmount ?? goal.saved ?? 0;
  const progress = goal.progressPercentage ?? (target > 0 ? Math.min(100, (saved / target) * 100) : 0);
  const days = Math.max(0, differenceInCalendarDays(parseISO(goal.deadline), new Date()));
  const circumference = 2 * Math.PI * 38;

  return (
    <div className="glass rounded-card p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xl font-bold">{name}</p>
          <p className="mt-1 text-sm text-secondary">Due in {days} days</p>
        </div>
        <Badge tone={progress > 80 ? 'emerald' : 'violet'}>{Math.round(progress)}%</Badge>
      </div>
      <div className="mt-6 flex items-center gap-5">
        <svg className="h-24 w-24 -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="38" fill="none" stroke="#1a2230" strokeWidth="9" />
          <circle
            cx="50" cy="50" r="38" fill="none" stroke="#8b5cf6" strokeWidth="9"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - (progress / 100) * circumference}
          />
        </svg>
        <div className="min-w-0 flex-1">
          <p className="amount text-lg font-bold">{formatCurrency(saved)}</p>
          <p className="text-sm text-secondary">of {formatCurrency(target)}</p>
          {goal.monthlySavingsNeeded != null && (
            <p className="mt-2 text-xs text-amber">₹{goal.monthlySavingsNeeded.toLocaleString('en-IN')}/mo needed</p>
          )}
        </div>
      </div>
    </div>
  );
};
