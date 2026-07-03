import api from './api';
import { Expense, ExpenseCreate, ExpenseListResponse } from '../types';

export const expenseService = {
  async list(params?: {
    category?: string;
    search?: string;
    payment_method?: string;
    start_date?: string;
    end_date?: string;
    skip?: number;
    limit?: number;
  }): Promise<ExpenseListResponse> {
    const { data } = await api.get<ExpenseListResponse>('/expenses', { params });
    return data;
  },

  async get(id: string): Promise<Expense> {
    const { data } = await api.get<Expense>(`/expenses/${id}`);
    return data;
  },

  async create(payload: ExpenseCreate): Promise<Expense> {
    const { data } = await api.post<Expense>('/expenses', payload);
    return data;
  },

  async update(id: string, payload: Partial<ExpenseCreate>): Promise<Expense> {
    const { data } = await api.put<Expense>(`/expenses/${id}`, payload);
    return data;
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/expenses/${id}`);
  },
};
