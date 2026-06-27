import api from './api';
import type { CreditCard } from '../types';

export interface CreditCardCreatePayload {
  cardName: string;
  creditLimit: number;
  billingDate: number;
  dueDate: number;
  bankName?: string;
  outstanding?: number;
  availableLimit?: number;
  minimumDue?: number;
  statementDate?: string;
  lastImported?: string;
}

export const creditCardService = {
  async list(): Promise<CreditCard[]> {
    const { data } = await api.get<CreditCard[]>('/credit-card');
    return data;
  },

  async upsert(payload: CreditCardCreatePayload): Promise<CreditCard> {
    const { data } = await api.post<CreditCard>('/credit-card', payload);
    return data;
  },

  async delete(): Promise<{ message: string }> {
    const { data } = await api.delete<{ message: string }>('/credit-card');
    return data;
  },
};
