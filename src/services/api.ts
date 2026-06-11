import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({
  baseURL: 'http://localhost:8000/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('fintell_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('fintell_token');
      localStorage.removeItem('fintell_user');
      window.location.href = '/login';
    }
    const msg = err.response?.data?.detail || 'Something went wrong';
    toast.error(typeof msg === 'string' ? msg : JSON.stringify(msg));
    return Promise.reject(err);
  }
);

export default api;
