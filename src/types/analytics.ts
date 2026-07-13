export interface CategoryBreakdown {
  category: string;
  total: number;
}

export interface MonthlyTrend {
  month: string;
  total: number;
}

export interface ChartDatum {
  name: string;
  income?: number;
  expenses?: number;
  savings?: number;
  Food?: number;
  Travel?: number;
  Shopping?: number;
  Bills?: number;
  Education?: number;
  Entertainment?: number;
  value?: number;
}

export type InsightType = 'positive' | 'warning' | 'suggestion';

export interface Insight {
  id: string;
  type: InsightType;
  title: string;
  message: string;
}
