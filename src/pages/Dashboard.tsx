import { useState } from 'react';
import { TrendingUp, BarChart3 } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { SpendingChart } from '../components/charts/SpendingChart';
import { IncomeExpenseBar } from '../components/charts/IncomeExpenseBar';
import { Skeleton } from '../components/ui/Skeleton';
import { FinancialOverview } from '../components/dashboard/FinancialOverview';
import { CreditCardWidget } from '../components/dashboard/CreditCardWidget';
import { TransactionsAndCategories } from '../components/dashboard/TransactionsAndCategories';
import { GoalProgress } from '../components/dashboard/GoalProgress';
import { AIFinancialCoach } from '../components/dashboard/AIFinancialCoach';
import { FinancialHealthCard } from '../components/dashboard/FinancialHealthCard';
import { PotentialSavingsCard } from '../components/dashboard/PotentialSavingsCard';
import { RecentNotifications } from '../components/dashboard/RecentNotifications';
import { ErrorBoundary } from '../components/ui/ErrorBoundary';

import { analyticsService, type DashboardData } from '../services/analyticsService';
import { expenseService } from '../services/expenseService';
import { goalService } from '../services/goalService';
import { notificationService } from '../services/notificationService';
import { aiService } from '../services/aiService';
import { useAuth } from '../context/AuthContext';

export const Dashboard = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [refreshingAi, setRefreshingAi] = useState(false);

  // Queries using React Query for automatic caching and background updates
  const { data: dash, isLoading: dashLoading } = useQuery<DashboardData>({
    queryKey: ['dashboard'],
    queryFn: analyticsService.getDashboard,
  });

  const { data: expensesData, isLoading: expensesLoading } = useQuery({
    queryKey: ['recentExpenses'],
    queryFn: () => expenseService.list({ limit: 5 }),
  });
  const expenses = expensesData?.items ?? [];

  const { data: goals = [], isLoading: goalsLoading } = useQuery({
    queryKey: ['goals'],
    queryFn: goalService.list,
  });

  const { data: notifications = [], isLoading: notificationsLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: notificationService.getNotifications,
  });

  const { data: aiData, isLoading: aiLoading } = useQuery({
    queryKey: ['aiInsights'],
    queryFn: () => aiService.dashboardInsights(false),
    staleTime: 1000 * 60 * 15, // AI coach insights change less frequently
  });

  const loading = dashLoading || expensesLoading || goalsLoading || notificationsLoading;

  const handleAiRefresh = async () => {
    setRefreshingAi(true);
    try {
      const data = await aiService.dashboardInsights(true);
      if (data.error) {
        toast.error(data.error);
      } else {
        toast.success("AI insights refreshed successfully!");
      }
      queryClient.setQueryData(['aiInsights'], data);
    } catch (e) {
      toast.error("Unable to refresh AI insights.");
      console.error(e);
    } finally {
      setRefreshingAi(false);
    }
  };

  const chartData = dash?.monthlySpendingTrends.map((t) => ({
    name: t.month,
    income: dash.monthlyIncome,
    expenses: t.total,
  })) ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-extrabold">Dashboard</h1>
        <p className="text-secondary">
          {user ? `Welcome back, ${user.name}! Here's your financial overview.` : 'Your financial cockpit.'}
        </p>
      </div>

      <FinancialOverview dash={dash ?? null} loading={loading} />

      <CreditCardWidget dash={dash ?? null} loading={loading} />

      <div className="grid gap-4 xl:grid-cols-2">
        <section className="glass rounded-card p-5">
          <h2 className="mb-3 font-bold flex items-center gap-2"><TrendingUp className="h-4 w-4 text-blue" /> Monthly Spending Trend</h2>
          {loading ? <Skeleton className="h-52" /> : <SpendingChart data={chartData} />}
        </section>
        <section className="glass rounded-card p-5">
          <h2 className="mb-3 font-bold flex items-center gap-2"><BarChart3 className="h-4 w-4 text-violet" /> Income vs Expenses</h2>
          {loading ? <Skeleton className="h-52" /> : <IncomeExpenseBar data={chartData} />}
        </section>
      </div>

      <TransactionsAndCategories expenses={expenses} dash={dash ?? null} loading={loading} />

      <GoalProgress goals={goals} loading={loading} />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <div className="xl:col-span-1 md:col-span-2">
          {aiLoading && !aiData ? (
            <Skeleton className="h-64 rounded-card" />
          ) : (
            <ErrorBoundary fallback={
              <div className="glass rounded-card p-5 text-sm text-rose text-center">
                Failed to load AI Coach insights.
              </div>
            }>
              <AIFinancialCoach 
                insights={aiData?.insights || []} 
                onRefresh={handleAiRefresh} 
                loading={aiLoading || refreshingAi} 
              />
            </ErrorBoundary>
          )}
        </div>
        <div className="xl:col-span-1">
          {aiLoading && !aiData ? (
            <Skeleton className="h-64 rounded-card" />
          ) : (
            <FinancialHealthCard health={aiData?.financialHealthScore} />
          )}
        </div>
        <div className="xl:col-span-1">
          {aiLoading && !aiData ? (
            <Skeleton className="h-64 rounded-card" />
          ) : (
            <PotentialSavingsCard savings={aiData?.potentialSavings} />
          )}
        </div>
      </div>

      <RecentNotifications notifications={notifications} loading={loading} />
    </div>
  );
};
