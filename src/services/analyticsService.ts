import api from './api';

export interface CategoryBreakdown { category: string; total: number; }
export interface MonthlyTrend { month: string; total: number; }

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

export interface ReportData {
  period: string;
  expenseSummary: number;
  savingsSummary: number;
  spendingTrends: MonthlyTrend[];
  goalSummary?: any[];
  debtSummary?: any[];
}

export const analyticsService = {
  async getDashboard(): Promise<DashboardData> {
    const { data } = await api.get<DashboardData>('/dashboard');
    return data;
  },
};

export const reportService = {
  async getMonthly(): Promise<ReportData> {
    const { data } = await api.get<ReportData>('/reports/monthly');
    return data;
  },
  async getYearly(): Promise<ReportData> {
    const { data } = await api.get<ReportData>('/reports/yearly');
    return data;
  },
};
