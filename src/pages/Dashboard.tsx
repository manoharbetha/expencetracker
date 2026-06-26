import { useEffect, useState } from 'react';
import { TrendingUp, BarChart3 } from 'lucide-react';
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

import { analyticsService, type DashboardData } from '../services/analyticsService';
import { expenseService, type Expense } from '../services/expenseService';
import { goalService, type Goal } from '../services/goalService';
import { notificationService } from '../services/notificationService';
import { aiService } from '../services/aiService';
import { useAuth } from '../context/AuthContext';

export const Dashboard = () => {
  const { user } = useAuth();
  const [dash, setDash] = useState<DashboardData | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [aiData, setAiData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(true);

  const fetchAiInsights = async (refresh = false) => {
    setAiLoading(true);
    try {
      const data = await aiService.dashboardInsights(refresh);
      setAiData(data);
    } catch (e) {
      console.error(e);
    } finally {
      setAiLoading(false);
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        const results = await Promise.allSettled([
          analyticsService.getDashboard(),
          expenseService.list({ limit: 5 }),
          goalService.list(),
          notificationService.getNotifications(),
        ]);

        if (results[0].status === 'fulfilled') setDash(results[0].value);
        if (results[1].status === 'fulfilled') setExpenses(results[1].value.items ?? []);
        if (results[2].status === 'fulfilled') setGoals(results[2].value);
        if (results[3].status === 'fulfilled') setNotifications(results[3].value ?? []);
      } finally {
        setLoading(false);
      }
    };
    load();
    fetchAiInsights();
  }, []);

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

      <FinancialOverview dash={dash} loading={loading} />

      <CreditCardWidget dash={dash} loading={loading} />

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

      <TransactionsAndCategories expenses={expenses} dash={dash} loading={loading} />

      <GoalProgress goals={goals} loading={loading} />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <div className="xl:col-span-1 md:col-span-2">
          {aiLoading && !aiData ? (
            <Skeleton className="h-64 rounded-card" />
          ) : (
            <AIFinancialCoach 
              insights={aiData?.insights || []} 
              onRefresh={() => fetchAiInsights(true)} 
              loading={aiLoading} 
            />
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
