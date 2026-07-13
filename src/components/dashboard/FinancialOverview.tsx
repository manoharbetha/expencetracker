import { PiggyBank, Receipt, BarChart3, Target } from 'lucide-react';
import { SummaryCard } from '../cards/SummaryCard';
import { Skeleton } from '../../components/ui/Skeleton';
import { formatCurrency } from '../../utils/formatters';
import type { DashboardData } from '../../types';

interface FinancialOverviewProps {
  dash: DashboardData | null;
  loading: boolean;
}

export const FinancialOverview = ({ dash, loading }: FinancialOverviewProps) => {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {loading ? (
        Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-card" />)
      ) : (
        <>
          <SummaryCard title="Monthly Income" value={formatCurrency(dash?.monthlyIncome ?? 0)} icon={<PiggyBank />} tone="emerald" change={dash?.monthlyIncome ? '₹/month' : 'Set income'} />
          <SummaryCard title="Total Expenses" value={formatCurrency(dash?.totalExpenses ?? 0)} icon={<Receipt />} tone="rose" change={`${dash?.categoryBreakdown?.length ?? 0} categories`} />
          <SummaryCard title="Net Savings" value={formatCurrency(dash?.totalSavings ?? 0)} icon={<BarChart3 />} tone="blue" change={dash?.monthlyIncome ? `${Math.round(((dash?.totalSavings ?? 0) / (dash?.monthlyIncome || 1)) * 100)}% saved` : '–'} />
          <SummaryCard title="Active Goals" value={String(dash?.activeGoals ?? 0)} icon={<Target />} tone="violet" change={`${dash?.activeDebts ?? 0} debts · ₹${dash?.totalEmi ?? 0}/mo EMI`} />
        </>
      )}
    </div>
  );
};
