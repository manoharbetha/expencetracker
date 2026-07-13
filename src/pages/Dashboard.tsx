import { useState, lazy, Suspense, useEffect } from 'react';
import { TrendingUp, BarChart3 } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Skeleton } from '../components/ui/Skeleton';
import { ErrorBoundary } from '../components/ui/ErrorBoundary';

// Static import for top-of-the-fold summary card (optimal FCP/LCP)
import { FinancialOverview } from '../components/dashboard/FinancialOverview';

// Lazy load below-the-fold components
const SpendingChart = lazy(() => import('../components/charts/SpendingChart').then(m => ({ default: m.SpendingChart })));
const IncomeExpenseBar = lazy(() => import('../components/charts/IncomeExpenseBar').then(m => ({ default: m.IncomeExpenseBar })));
const CreditCardWidget = lazy(() => import('../components/dashboard/CreditCardWidget').then(m => ({ default: m.CreditCardWidget })));
const TransactionsAndCategories = lazy(() => import('../components/dashboard/TransactionsAndCategories').then(m => ({ default: m.TransactionsAndCategories })));
const GoalProgress = lazy(() => import('../components/dashboard/GoalProgress').then(m => ({ default: m.GoalProgress })));
const AIFinancialCoach = lazy(() => import('../components/dashboard/AIFinancialCoach').then(m => ({ default: m.AIFinancialCoach })));
const FinancialHealthCard = lazy(() => import('../components/dashboard/FinancialHealthCard').then(m => ({ default: m.FinancialHealthCard })));
const PotentialSavingsCard = lazy(() => import('../components/dashboard/PotentialSavingsCard').then(m => ({ default: m.PotentialSavingsCard })));
const RecentNotifications = lazy(() => import('../components/dashboard/RecentNotifications').then(m => ({ default: m.RecentNotifications })));

import { analyticsService } from '../services/analyticsService';
import { DashboardData } from '../types';
import { expenseService } from '../services/expenseService';
import { goalService } from '../services/goalService';
import { notificationService } from '../services/notificationService';
import { aiService } from '../services/aiService';
import { useAuth } from '../context/AuthContext';
import { trackEvent } from '../utils/analytics';

export const Dashboard = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [refreshingAi, setRefreshingAi] = useState(false);

  // Queries using React Query for automatic caching and background updates
  const { data: dash, isLoading: dashLoading } = useQuery<DashboardData>({
    queryKey: ['dashboard'],
    queryFn: analyticsService.getDashboard,
  });

  // Track dashboard viewed event upon successful API response
  useEffect(() => {
    if (dash) {
      trackEvent('dashboard_viewed');
    }
  }, [!!dash]);

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

  // Track AI insights generation event (without any PII content)
  useEffect(() => {
    if (aiData && !aiData.error) {
      trackEvent('ai_insights_generated', { insight_count: aiData.insights?.length || 0 });
    }
  }, [aiData]);

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

      <Suspense fallback={<Skeleton className="h-28 rounded-card animate-pulse" />}>
        <CreditCardWidget dash={dash ?? null} loading={loading} />
      </Suspense>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className="glass rounded-card p-5">
          <h2 className="mb-3 font-bold flex items-center gap-2"><TrendingUp className="h-4 w-4 text-blue" /> Monthly Spending Trend</h2>
          {loading ? <Skeleton className="h-52" /> : <Suspense fallback={<Skeleton className="h-52" />}><SpendingChart data={chartData} /></Suspense>}
        </section>
        <section className="glass rounded-card p-5">
          <h2 className="mb-3 font-bold flex items-center gap-2"><BarChart3 className="h-4 w-4 text-violet" /> Income vs Expenses</h2>
          {loading ? <Skeleton className="h-52" /> : <Suspense fallback={<Skeleton className="h-52" />}><IncomeExpenseBar data={chartData} /></Suspense>}
        </section>
      </div>

      <Suspense fallback={<Skeleton className="h-64 rounded-card animate-pulse" />}>
        <TransactionsAndCategories expenses={expenses} dash={dash ?? null} loading={loading} />
      </Suspense>

      <Suspense fallback={<Skeleton className="h-32 rounded-card animate-pulse" />}>
        <GoalProgress goals={goals} loading={loading} />
      </Suspense>

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
              <Suspense fallback={<Skeleton className="h-64 rounded-card" />}>
                <AIFinancialCoach 
                  insights={aiData?.insights || []} 
                  onRefresh={handleAiRefresh} 
                  loading={aiLoading || refreshingAi} 
                />
              </Suspense>
            </ErrorBoundary>
          )}
        </div>
        <div className="xl:col-span-1">
          {aiLoading && !aiData ? (
            <Skeleton className="h-64 rounded-card" />
          ) : (
            <Suspense fallback={<Skeleton className="h-64 rounded-card animate-pulse" />}>
              <FinancialHealthCard health={aiData?.financialHealthScore} />
            </Suspense>
          )}
        </div>
        <div className="xl:col-span-1">
          {aiLoading && !aiData ? (
            <Skeleton className="h-64 rounded-card" />
          ) : (
            <Suspense fallback={<Skeleton className="h-64 rounded-card animate-pulse" />}>
              <PotentialSavingsCard savings={aiData?.potentialSavings} />
            </Suspense>
          )}
        </div>
      </div>

      <Suspense fallback={<Skeleton className="h-48 rounded-card animate-pulse" />}>
        <RecentNotifications notifications={notifications} loading={loading} />
      </Suspense>
    </div>
  );
};
