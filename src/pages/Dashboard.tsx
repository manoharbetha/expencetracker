import { useEffect, useState } from 'react';
import { BarChart3, PiggyBank, Receipt, Target, TrendingUp, CreditCard as CardIcon } from 'lucide-react';
import { SummaryCard } from '../components/cards/SummaryCard';
import { SpendingChart } from '../components/charts/SpendingChart';
import { IncomeExpenseBar } from '../components/charts/IncomeExpenseBar';
import { GoalCard } from '../components/cards/GoalCard';
import { Skeleton } from '../components/ui/Skeleton';
import { Button } from '../components/ui/Button';
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
        const results = await Promise.allSettled([
          analyticsService.getDashboard(),
          expenseService.list({ limit: 5 }),
          goalService.list(),
          api.get('/notifications'),
        ]);

        if (results[0].status === 'fulfilled') setDash(results[0].value);
        if (results[1].status === 'fulfilled') setExpenses(results[1].value.items ?? []);
        if (results[2].status === 'fulfilled') setGoals(results[2].value);
        if (results[3].status === 'fulfilled') setNotifications(results[3].value.data ?? []);
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

      {/* Credit Card Widget */}
      {loading ? (
        <Skeleton className="h-64 rounded-card" />
      ) : !dash?.creditCard ? (
        <div className="glass rounded-card p-6 flex flex-col md:flex-row items-center justify-between gap-4 border border-white/5 bg-gradient-to-r from-blue-900/10 via-indigo-900/10 to-purple-900/10 hover:shadow-glow-primary transition duration-300">
          <div className="space-y-2 text-center md:text-left">
            <h2 className="text-xl font-bold flex items-center justify-center md:justify-start gap-2 text-primary">
              <CardIcon className="h-5 w-5 text-blue" /> Credit Card Overview
            </h2>
            <p className="text-sm text-secondary max-w-xl">
              Track utilization, calculate your Credit Health Score, monitor spending trends, and receive dynamic AI-powered insights. Fully secure & manual.
            </p>
          </div>
          <a href="/credit-card">
            <Button icon={<CardIcon className="h-4 w-4" />}>Configure Credit Card</Button>
          </a>
        </div>
      ) : (
        <div className="glass rounded-card p-6 border border-white/5 bg-gradient-to-br from-card/80 to-void/40">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-subtle pb-4 mb-6">
            <div>
              <h2 className="text-xl font-extrabold flex items-center gap-2 text-primary">
                <CardIcon className="h-5 w-5 text-blue animate-pulse" /> {dash.creditCard.cardName}
              </h2>
              <p className="text-xs text-secondary mt-0.5">
                Billing Cycle: Day {dash.creditCard.billingDate} · Due: Day {dash.creditCard.dueDate}
              </p>
            </div>
            
            {/* Due Date Reminder */}
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                dash.creditCard.daysUntilDue <= 3 && dash.creditCard.currentUsage > 0
                  ? 'bg-rose/10 text-rose border border-rose/20 animate-pulse'
                  : 'bg-hover text-secondary border border-subtle'
              }`}>
                {dash.creditCard.currentUsage === 0 
                  ? 'No outstanding balance' 
                  : dash.creditCard.daysUntilDue === 0
                    ? 'Payment is due TODAY'
                    : `Payment due in ${dash.creditCard.daysUntilDue} days`}
              </span>
              <a href="/credit-card">
                <Button size="sm" variant="ghost">Edit Details</Button>
              </a>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {/* 1. Progress / Usage Display */}
            <div className="space-y-4 flex flex-col justify-center">
              <div className="space-y-1">
                <p className="text-xs text-secondary font-semibold uppercase tracking-wider">Current Utilization</p>
                <div className="flex items-baseline gap-2">
                  <span className={`text-3xl font-extrabold font-mono ${
                    dash.creditCard.utilizationPercentage >= 90 ? 'text-rose' :
                    dash.creditCard.utilizationPercentage >= 70 ? 'text-amber' :
                    dash.creditCard.utilizationPercentage >= 50 ? 'text-yellow' :
                    'text-primary'
                  }`}>
                    {dash.creditCard.utilizationPercentage}%
                  </span>
                  <span className="text-xs text-tertiary">utilized</span>
                </div>
              </div>

              {/* Custom High-Fidelity Progress Bar */}
              <div className="space-y-1">
                <div className="h-3 w-full rounded-full bg-hover overflow-hidden p-[2px] border border-subtle">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      dash.creditCard.utilizationPercentage >= 90 ? 'bg-gradient-to-r from-red-600 to-rose-500' :
                      dash.creditCard.utilizationPercentage >= 70 ? 'bg-gradient-to-r from-orange-500 to-amber-500' :
                      dash.creditCard.utilizationPercentage >= 50 ? 'bg-gradient-to-r from-yellow-500 to-amber-400' :
                      'bg-gradient-to-r from-emerald-500 to-blue-500'
                    }`} 
                    style={{ width: `${Math.min(100, dash.creditCard.utilizationPercentage)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-secondary font-mono">
                  <span>{formatCurrency(dash.creditCard.currentUsage)} used</span>
                  <span>{formatCurrency(dash.creditCard.creditLimit)} limit</span>
                </div>
              </div>

              {/* Available & Spending metrics */}
              <div className="grid grid-cols-2 gap-4 border-t border-subtle pt-4">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Available Credit</p>
                  <p className="text-lg font-bold font-mono text-emerald">{formatCurrency(dash.creditCard.availableCredit)}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Month Spend</p>
                  <p className="text-lg font-bold font-mono text-primary">{formatCurrency(dash.creditCard.monthlySpending)}</p>
                </div>
              </div>
            </div>

            {/* 2. Credit Health Score Circular Indicator */}
            <div className="flex flex-col items-center justify-center border-t border-subtle md:border-t-0 md:border-x border-subtle py-4 md:py-0 px-6">
              <p className="text-xs text-secondary font-semibold uppercase tracking-wider mb-3">Credit Health Score</p>
              
              <div className="relative h-28 w-28 flex items-center justify-center">
                {/* SVG Progress Circle */}
                <svg className="absolute inset-0 h-full w-full transform -rotate-90">
                  <circle 
                    cx="56" cy="56" r="48" 
                    className="stroke-void fill-none" 
                    strokeWidth="8" 
                  />
                  <circle 
                    cx="56" cy="56" r="48" 
                    className={`fill-none transition-all duration-1000 ${
                      dash.creditCard.healthStatus === 'Excellent' ? 'stroke-emerald' :
                      dash.creditCard.healthStatus === 'Good' ? 'stroke-blue' :
                      dash.creditCard.healthStatus === 'Fair' ? 'stroke-yellow' :
                      dash.creditCard.healthStatus === 'High Usage' ? 'stroke-orange' :
                      'stroke-rose'
                    }`} 
                    strokeWidth="8" 
                    strokeDasharray={301.6} 
                    strokeDashoffset={301.6 - (301.6 * dash.creditCard.healthScore) / 100}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="text-center z-10">
                  <p className="text-2xl font-black font-display text-primary">{dash.creditCard.healthScore}</p>
                  <p className="text-[10px] text-tertiary font-bold font-mono">/ 100</p>
                </div>
              </div>

              <span className={`mt-3 px-3 py-0.5 rounded-full text-xs font-black uppercase tracking-widest ${
                dash.creditCard.healthStatus === 'Excellent' ? 'bg-emerald/10 text-emerald border border-emerald/20' :
                dash.creditCard.healthStatus === 'Good' ? 'bg-blue/10 text-blue border border-blue/20' :
                dash.creditCard.healthStatus === 'Fair' ? 'bg-yellow/10 text-yellow border border-yellow/20' :
                dash.creditCard.healthStatus === 'High Usage' ? 'bg-orange/10 text-orange border border-orange/20' :
                'bg-rose/10 text-rose border border-rose/20'
              }`}>
                {dash.creditCard.healthStatus}
              </span>
            </div>

            {/* 3. AI Insights List inside Widget */}
            <div className="flex flex-col space-y-2.5">
              <p className="text-xs text-secondary font-semibold uppercase tracking-wider">Automated Insights</p>
              <div className="space-y-2 overflow-y-auto max-h-[140px] pr-1">
                {dash.creditCard.insights.map((ins: any, idx: number) => (
                  <div 
                    key={idx} 
                    className={`flex items-start gap-2.5 p-2 rounded border text-xs leading-relaxed ${
                      ins.type === 'danger' ? 'bg-rose/5 border-rose/10 text-rose' :
                      ins.type === 'warning' ? 'bg-amber/5 border-amber/10 text-amber' :
                      ins.type === 'success' ? 'bg-emerald/5 border-emerald/10 text-emerald' :
                      'bg-blue/5 border-blue/10 text-blue'
                    }`}
                  >
                    <span className="text-sm shrink-0">{ins.icon}</span>
                    <span className="font-medium text-slate-200">{ins.message}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

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
