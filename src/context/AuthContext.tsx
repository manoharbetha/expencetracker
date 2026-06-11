import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { authService, type User } from '../services/authService';

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, monthlyIncome: number) => Promise<void>;
  logout: () => void;
  updateUser: (u: User) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const raw = localStorage.getItem('fintell_user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('fintell_token'));
  const [isLoading, setIsLoading] = useState(false);

  const persist = (u: User, t: string) => {
    setUser(u);
    setToken(t);
    localStorage.setItem('fintell_user', JSON.stringify(u));
    localStorage.setItem('fintell_token', t);
  };

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await authService.login(email, password);
      persist(res.user, res.access_token);
      toast.success(`Welcome back, ${res.user.name}!`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (name: string, email: string, password: string, monthlyIncome: number) => {
    setIsLoading(true);
    try {
      const res = await authService.register(name, email, password, monthlyIncome);
      persist(res.user, res.access_token);
      toast.success(`Account created! Welcome, ${res.user.name}!`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('fintell_token');
    localStorage.removeItem('fintell_user');
    toast.success('Logged out successfully');
    window.location.href = '/login';
  }, []);

  const updateUser = useCallback((u: User) => {
    setUser(u);
    localStorage.setItem('fintell_user', JSON.stringify(u));
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, token, isAuthenticated: !!token && !!user, isLoading, login, register, logout, updateUser }}
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
