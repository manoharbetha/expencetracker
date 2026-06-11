import api from './api';

export interface Debt {
  id: string;
  title: string;
  amount: number;
  interestRate: number;
  emi: number;
  dueDate: string;
  type?: 'borrowed' | 'lent';
}

export interface DebtCreate {
  title: string;
  amount: number;
  interestRate: number;
  emi: number;
  dueDate: string;
  type?: 'borrowed' | 'lent';
}

export const debtService = {
  async list(): Promise<Debt[]> {
    const { data } = await api.get<Debt[]>('/debts');
    return data;
  },
  async create(payload: DebtCreate): Promise<Debt> {
    const { data } = await api.post<Debt>('/debts', payload);
    return data;
  },
  async update(id: string, payload: Partial<DebtCreate>): Promise<Debt> {
    const { data } = await api.put<Debt>(`/debts/${id}`, payload);
    return data;
  },
  async remove(id: string): Promise<void> {
    await api.delete(`/debts/${id}`);
  },
};
