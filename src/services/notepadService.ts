import api from './api';

export interface Note {
  id: string;
  title: string;
  estimatedPrice: number;
  priority: string;
  status: string;
  date?: string;
}

export const notepadService = {
  async list(): Promise<Note[]> {
    const { data } = await api.get('/notepad/');
    return data;
  },
  async create(note: Omit<Note, 'id' | 'date'>): Promise<Note> {
    const { data } = await api.post('/notepad/', note);
    return data;
  },
  async updateStatus(id: string, status: string): Promise<Note> {
    const { data } = await api.put(`/notepad/${id}`, { status });
    return data;
  },
  async remove(id: string): Promise<void> {
    await api.delete(`/notepad/${id}`);
  }
};
