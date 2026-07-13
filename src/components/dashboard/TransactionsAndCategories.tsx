import { Skeleton } from '../../components/ui/Skeleton';
import { formatCurrency, formatDate } from '../../utils/formatters';
import type { Expense, DashboardData } from '../../types';

interface TransactionsAndCategoriesProps {
  expenses: Expense[];
  dash: DashboardData | null;
  loading: boolean;
}

export const TransactionsAndCategories = ({ expenses, dash, loading }: TransactionsAndCategoriesProps) => {
  return (
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
  );
};
