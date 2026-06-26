import axios from 'axios';
import toast from 'react-hot-toast';

const metaEnv = (import.meta as any).env || {};
const baseURL = metaEnv.VITE_API_URL || (metaEnv.DEV ? 'http://localhost:8000/api/v1' : '');

if (metaEnv.PROD && !metaEnv.VITE_API_URL) {
  console.warn("Production warning: VITE_API_URL environment variable is not defined. Defaulting to relative path.");
}

const api = axios.create({
  baseURL: baseURL || '/api/v1',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      const publicPaths = ['/login', '/register', '/'];
      if (!publicPaths.includes(window.location.pathname)) {
        window.location.href = '/login';
      }
    }
    const msg = err.response?.data?.detail || 'Something went wrong';
    
    // Suppress error toast for 401 Unauthorized on authentication check endpoints
    const isAuthCheck = err.response?.status === 401 && 
      (err.config?.url?.endsWith('/me') || err.config?.url?.endsWith('/logout'));
      
    if (!isAuthCheck) {
      toast.error(typeof msg === 'string' ? msg : JSON.stringify(msg));
    }
    return Promise.reject(err);
  }
);

export default api;
