import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { authService } from '../services/authService';
import { User } from '../types';
import api from '../services/api';

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, monthlyIncome: number) => Promise<void>;
  logout: () => void;
  updateUser: (u: User) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Validate session on load
  useEffect(() => {
    const validateSession = async () => {
      const token = localStorage.getItem('fintell_token');
      if (!token) {
        setUser(null);
        setIsLoading(false);
        return;
      }
      try {
        const { data } = await api.get('/me');
        setUser(data);
      } catch (e) {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    validateSession();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await authService.login(email, password);
      if (res.access_token) {
        localStorage.setItem('fintell_token', res.access_token);
      }
      setUser(res.user);
      toast.success(`Welcome back, ${res.user.name}!`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (name: string, email: string, password: string, monthlyIncome: number) => {
    setIsLoading(true);
    try {
      const res = await authService.register(name, email, password, monthlyIncome);
      if (res.access_token) {
        localStorage.setItem('fintell_token', res.access_token);
      }
      setUser(res.user);
      toast.success(`Account created! Welcome, ${res.user.name}!`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/logout');
    } catch (e) {
      console.error(e);
    }
    localStorage.removeItem('fintell_token');
    setUser(null);
    toast.success('Logged out successfully');
    window.location.href = '/login';
  }, []);

  const updateUser = useCallback((u: User) => {
    setUser(u);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: !!user, isLoading, login, register, logout, updateUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
