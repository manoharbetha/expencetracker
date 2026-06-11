import api from './api';

export interface Goal {
  id: string;
  goalName: string;
  targetAmount: number;
  savedAmount: number;
  deadline: string;
  progressPercentage: number;
  remainingAmount: number;
  monthlySavingsNeeded: number;
}

export interface GoalCreate {
  goalName: string;
  targetAmount: number;
  savedAmount?: number;
  deadline: string;
}

export const goalService = {
  async list(): Promise<Goal[]> {
    const { data } = await api.get<Goal[]>('/goals');
    return data;
  },
  async create(payload: GoalCreate): Promise<Goal> {
    const { data } = await api.post<Goal>('/goals', payload);
    return data;
  },
  async update(id: string, payload: Partial<GoalCreate>): Promise<Goal> {
    const { data } = await api.put<Goal>(`/goals/${id}`, payload);
    return data;
  },
  async remove(id: string): Promise<void> {
    await api.delete(`/goals/${id}`);
  },
};
