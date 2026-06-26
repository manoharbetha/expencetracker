import api from './api';

export interface ChatMessage { role: 'user' | 'assistant'; message: string; created_at?: string; }

export const aiService = {
  async budgetSuggestions(): Promise<string> {
    const { data } = await api.post<{ result: string }>('/ai/budget-suggestions');
    return data.result;
  },
  async chat(message: string): Promise<string> {
    const { data } = await api.post<{ result: string }>('/ai/chat', { message });
    return data.result;
  },
  async chatHistory(): Promise<ChatMessage[]> {
    const { data } = await api.get<ChatMessage[]>('/ai/chat/history');
    return data;
  },
  async purchaseImpact(item: string, price: number): Promise<string> {
    const { data } = await api.post<{ result: string }>('/ai/purchase-impact', { item, price });
    return data.result;
  },
  async goalConflicts(): Promise<string> {
    const { data } = await api.post<{ result: string }>('/ai/goal-conflicts');
    return data.result;
  },
  async storytelling(): Promise<string> {
    const { data } = await api.post<{ result: string }>('/ai/storytelling');
    return data.result;
  },
  async debtAlert(): Promise<string> {
    const { data } = await api.post<{ result: string }>('/ai/debt-alert');
    return data.result;
  },
  async dashboardInsights(refresh = false): Promise<any> {
    const url = refresh ? '/ai/dashboard-insights/refresh' : '/ai/dashboard-insights';
    const method = refresh ? 'post' : 'get';
    const { data } = await api[method](url);
    return data;
  }
};
