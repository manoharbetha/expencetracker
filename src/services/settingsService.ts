import api from './api';

export const settingsService = {
  async clearData(): Promise<{ message: string }> {
    const { data } = await api.delete<{ message: string }>('/settings/clear-data');
    return data;
  },
};
