import { useEffect, useState } from 'react';
import { BarChart3, PiggyBank, Receipt, Target, TrendingUp } from 'lucide-react';
import { SummaryCard } from '../components/cards/SummaryCard';
import { SpendingChart } from '../components/charts/SpendingChart';
import { IncomeExpenseBar } from '../components/charts/IncomeExpenseBar';
import { GoalCard } from '../components/cards/GoalCard';
import { Skeleton } from '../components/ui/Skeleton';
import { analyticsService, type DashboardData } from '../services/analyticsService';
import { expenseService, type Expense } from '../services/expenseService';
import { goalService, type Goal } from '../services/goalService';
import { formatCurrency, formatDate } from '../utils/formatters';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { AIFinancialCoach } from '../components/dashboard/AIFinancialCoach';
import { FinancialHealthCard } from '../components/dashboard/FinancialHealthCard';
import { PotentialSavingsCard } from '../components/dashboard/PotentialSavingsCard';

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
      const url = refresh ? '/ai/dashboard-insights/refresh' : '/ai/dashboard-insights';
      const method = refresh ? 'post' : 'get';
      const { data } = await api[method](url);
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
        const [d, e, g, nRes] = await Promise.all([
          analyticsService.getDashboard(),
          expenseService.list({ limit: 5 }),
          goalService.list(),
          api.get('/notifications').catch(() => ({ data: [] })),
        ]);
        setDash(d);
        setExpenses(e.items ?? []);
        setGoals(g);
        setNotifications(nRes.data);
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



      {/* Summary Cards */}
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

      {/* Charts */}
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

      {/* Transactions + Category Breakdown */}
      <div className="grid gap-4 xl:grid-cols-3">
        <section className="glass rounded-card p-5 xl:col-span-2">
          <h2 className="mb-4 font-bold">Recent Transactions</h2>
          {loading ? (
            <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
          ) : expenses.length === 0 ? (
            <p className="text-secondary text-sm text-center py-8">No expenses yet. <a className="text-blue" href="/expenses">Add your first expense →</a></p>
          ) : (
            <div className="space-y-2">
              {expenses.slice(0, 8).map((e) => (
                <div key={e.id} className="flex items-center justify-between rounded border border-subtle bg-elevated/50 px-3 py-3">
                  <div>
                    <p className="font-semibold text-sm">{e.description}</p>
                    <p className="text-xs text-secondary">{e.category} · {formatDate(e.date)}</p>
                  </div>
                  <p className="amount text-rose font-semibold">-{formatCurrency(e.amount)}</p>
                </div>
              ))}
            </div>
          )}
        </section>
        <section className="glass rounded-card p-5">
          <h2 className="mb-4 font-bold">Category Breakdown</h2>
          {loading ? (
            <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-8" />)}</div>
          ) : dash?.categoryBreakdown?.length === 0 ? (
            <p className="text-secondary text-sm">No expense data yet.</p>
          ) : (
            <div className="space-y-2">
              {dash?.categoryBreakdown?.slice(0, 6).map((c) => (
                <div key={c.category} className="flex items-center justify-between text-sm">
                  <span className="text-secondary">{c.category}</span>
                  <span className="amount font-semibold">{formatCurrency(c.total)}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Goals */}
      {(goals.length > 0 || loading) && (
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
      )}

      {/* AI Financial Coach Section */}
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

      {/* Recent Notifications */}
      <section className="glass rounded-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold">Recent Notifications</h2>
          <span className="bg-rose/10 text-rose px-2 py-0.5 rounded text-xs font-bold">
            {notifications.filter(n => !n.isRead).length} Unread
          </span>
        </div>
        {loading ? (
          <Skeleton className="h-24" />
        ) : notifications.length === 0 ? (
          <p className="text-secondary text-sm">No recent alerts.</p>
        ) : (
          <div className="space-y-3">
            {notifications.slice(0, 3).map(n => (
              <div key={n.id} className="p-3 rounded border border-subtle bg-surface/50">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold text-sm">{n.title}</h3>
                  {n.type === 'ai' && <span className="bg-blue/10 text-blue px-2 py-0.5 rounded text-[10px] font-bold">AI Insight</span>}
                </div>
                <p className="text-sm text-secondary">{n.message}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
