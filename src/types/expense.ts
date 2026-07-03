export type Category = 'Food' | 'Travel' | 'Shopping' | 'Bills' | 'Education' | 'Entertainment' | 'Health' | 'Other';
export type PaymentMethod = 'Bank' | 'UPI' | 'Credit Card' | 'Cash' | 'Debit Card' | 'Net Banking' | 'Other';

export interface Expense {
  id: string;
  amount: number;
  category: Category;
  description: string;
  paymentMethod: PaymentMethod;
  creditCardId?: string;
  date: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ExpenseCreate {
  amount: number;
  category: string;
  description: string;
  paymentMethod: string;
  creditCardId?: string;
  date: string;
}

export interface ExpenseListResponse {
  items: Expense[];
  total: number;
  skip: number;
  limit: number;
}
