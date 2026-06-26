import api from './api';

export const statementService = {
  async upload(formData: FormData, onUploadProgress?: (progressEvent: any) => void): Promise<any> {
    const { data } = await api.post('/statements/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress
    });
    return data;
  },
  async confirm(payload: any): Promise<any> {
    const { data } = await api.post('/statements/confirm', payload);
    return data;
  }
};
