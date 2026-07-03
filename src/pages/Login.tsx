import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Wallet, Eye, EyeOff } from 'lucide-react';
import { AuthLayout } from '../layouts/AuthLayout';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { trackEvent } from '../utils/analytics';

export const Login = () => {
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validate = () => {
    const e: typeof errors = {};
    if (!email) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Invalid email';
    if (!password) e.password = 'Password is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    try {
      await login(email, password);
      // Track successful login (strictly no PII)
      trackEvent('login_success');
      navigate('/dashboard');
    } catch {
      // error toast handled by axios interceptor
    }
  };

  return (
    <AuthLayout>
      <div className="mb-6 text-center">
        <h1 className="font-display text-2xl font-bold text-white">Welcome back</h1>
        <p className="text-sm text-secondary mt-1">Sign in to your Expence Tracker workspace</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Input
          label="Email"
          type="email"
          prefix={<Mail className="h-4 w-4" />}
          placeholder="aarav@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
        />
        <div className="relative">
          <Input
            label="Password"
            type={showPw ? 'text' : 'password'}
            prefix={<Lock className="h-4 w-4" />}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
          />
          <button
            type="button"
            onClick={() => setShowPw(!showPw)}
            className="absolute right-3 top-9 text-secondary hover:text-primary transition"
            aria-label={showPw ? "Hide password" : "Show password"}
          >
            {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Signing in…' : 'Sign In'}
        </Button>

        <p className="text-center text-sm text-secondary">
          Don't have an account?{' '}
          <Link className="text-blue font-medium hover:underline" to="/register">
            Register
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
};
