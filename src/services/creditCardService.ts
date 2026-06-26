import api from './api';
import type { CreditCard } from '../types';

export interface CreditCardCreatePayload {
  cardName: string;
  creditLimit: number;
  billingDate: number;
  dueDate: number;
}

export const creditCardService = {
  async get(): Promise<CreditCard | null> {
    const { data } = await api.get<CreditCard | null>('/credit-card');
    return data;
  },

  async upsert(payload: CreditCardCreatePayload): Promise<CreditCard> {
    const { data } = await api.post<CreditCard>('/credit-card', payload);
    return data;
  },
};
