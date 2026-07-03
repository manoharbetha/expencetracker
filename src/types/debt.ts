export type DebtType = 'borrowed' | 'lent';

export interface Debt {
  id: string;
  title: string;
  amount: number;
  interestRate: number;
  emi: number;
  dueDate: string;
  type?: DebtType;
}

export interface DebtCreate {
  title: string;
  amount: number;
  interestRate: number;
  emi: number;
  dueDate: string;
  type?: DebtType;
}
