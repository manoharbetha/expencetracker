import api from './api';
import { DashboardData, ReportData } from '../types';

export const analyticsService = {
  async getDashboard(): Promise<DashboardData> {
    const { data } = await api.get<DashboardData>('/dashboard');
    return data;
  },
};

export const reportService = {
  async getMonthly(): Promise<ReportData> {
    const { data } = await api.get<ReportData>('/reports/monthly');
    return data;
  },
  async getYearly(): Promise<ReportData> {
    const { data } = await api.get<ReportData>('/reports/yearly');
    return data;
  },
};
