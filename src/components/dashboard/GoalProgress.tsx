import { Skeleton } from '../../components/ui/Skeleton';
import { GoalCard } from '../cards/GoalCard';
import type { Goal } from '../../services/goalService';

interface GoalProgressProps {
  goals: Goal[];
  loading: boolean;
}

export const GoalProgress = ({ goals, loading }: GoalProgressProps) => {
  if (goals.length === 0 && !loading) {
    return null;
  }

  return (
    <div>
      <h2 className="mb-4 font-bold text-lg">Your Goals</h2>
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-card" />)}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {goals.slice(0, 3).map((g) => <GoalCard key={g.id} goal={g} />)}
        </div>
      )}
    </div>
  );
};
