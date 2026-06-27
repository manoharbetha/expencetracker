import api from './api';
import type { CreditCard } from '../types';

export interface CreditCardCreatePayload {
  cardName: string;
  bankName: string;
  creditLimit: number;
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

  async delete(cardId: string): Promise<{ message: string }> {
    const { data } = await api.delete<{ message: string }>(`/credit-card/${cardId}`);
    return data;
  },
};
