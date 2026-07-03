import { User } from './user';

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, monthlyIncome: number) => Promise<void>;
  logout: () => void;
  updateUser: (u: User) => void;
}
