import api from './api';

export const notificationService = {
  async getNotifications(): Promise<any[]> {
    const { data } = await api.get('/notifications');
    return data;
  }
};
