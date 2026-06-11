export type Category = 'Food' | 'Travel' | 'Shopping' | 'Bills' | 'Education' | 'Entertainment';
export type PaymentMethod = 'UPI' | 'Credit Card' | 'Cash' | 'Debit Card' | 'Net Banking';
export type InsightType = 'positive' | 'warning' | 'suggestion';
export type DebtType = 'Loan' | 'Credit Card' | 'Borrowed' | 'Lent';

export interface Expense {
  id: string;
  date: string;
  description: string;
  category: Category;
  amount: number;
  method: PaymentMethod;
}

export interface Goal {
  id: string;
  name: string;
  category: string;
  target: number;
  saved: number;
  deadline: string;
  icon: string;
}

export interface Debt {
  id: string;
  name: string;
  institution: string;
  type: DebtType;
  principal: number;
  remaining: number;
  rate: number;
  emi: number;
  nextDue: string;
}

export interface Insight {
  id: string;
  type: InsightType;
  title: string;
  message: string;
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
