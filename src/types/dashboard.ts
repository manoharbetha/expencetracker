import { CategoryBreakdown, MonthlyTrend } from './analytics';

export interface DashboardData {
  monthlyIncome: number;
  totalExpenses: number;
  totalSavings: number;
  totalGoalsSaved: number;
  totalEmi: number;
  activeGoals: number;
  activeDebts: number;
  categoryBreakdown: CategoryBreakdown[];
  monthlySpendingTrends: MonthlyTrend[];
  recentExpenses: any[];
  creditCard?: any;
}
