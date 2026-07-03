import api from './api';
import { User, TokenResponse } from '../types';

export const authService = {
  async register(name: string, email: string, password: string, monthlyIncome: number): Promise<TokenResponse> {
    const { data } = await api.post<TokenResponse>('/register', { name, email, password, monthlyIncome });
    return data;
  },

  async login(email: string, password: string): Promise<TokenResponse> {
    const { data } = await api.post<TokenResponse>('/login', { email, password });
    return data;
  },

  async getMe(): Promise<User> {
    const { data } = await api.get<User>('/me');
    return data;
  },

  async updateProfile(payload: {
    name?: string;
    monthlyIncome?: number;
    currency?: string;
    country?: string;
  }): Promise<User> {
    const { data } = await api.put<User>('/profile', payload);
    return data;
  },
};
