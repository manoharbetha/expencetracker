import { MonthlyTrend } from './analytics';

export interface ReportData {
  period: string;
  expenseSummary: number;
  savingsSummary: number;
  spendingTrends: MonthlyTrend[];
  goalSummary?: any[];
  debtSummary?: any[];
}
