import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Check, Lock, Mail, User, Wallet, Eye, EyeOff } from 'lucide-react';
import { AuthLayout } from '../layouts/AuthLayout';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';

const strength = (pw: string) => {
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s;
};

const strengthColor = ['bg-rose', 'bg-amber', 'bg-amber', 'bg-emerald', 'bg-emerald'];
const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'];

export const Register = () => {
  const { register, isLoading } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [monthlyIncome, setMonthlyIncome] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const pw_strength = strength(password);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name || name.trim().length < 2) e.name = 'Name must be at least 2 characters';
    if (!email) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Invalid email';
    if (!password || password.length < 8) e.password = 'Password must be at least 8 characters';
    if (password !== confirmPw) e.confirmPw = 'Passwords do not match';
    if (!monthlyIncome || isNaN(Number(monthlyIncome)) || Number(monthlyIncome) <= 0) e.monthlyIncome = 'Enter a valid monthly income';
    if (!agreed) e.agreed = 'You must accept the terms';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    try {
      await register(name.trim(), email, password, Number(monthlyIncome));
      navigate('/dashboard');
    } catch {
      // error toast handled by axios interceptor
    }
  };

  return (
    <AuthLayout>
      <div className="mb-6 flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded bg-[image:var(--gradient-ai)]">
          <Wallet className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold">Create account</h1>
          <p className="text-sm text-secondary">Start your AI financial journey</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Input
          label="Full Name"
          prefix={<User className="h-4 w-4" />}
          placeholder="Aarav Mehta"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.name}
        />
        <Input
          label="Email"
          type="email"
          prefix={<Mail className="h-4 w-4" />}
          placeholder="aarav@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
        />
        <div>
          <div className="relative">
            <Input
              label="Password"
              type={showPw ? 'text' : 'password'}
              prefix={<Lock className="h-4 w-4" />}
              placeholder="Min. 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
            />
            <button
              type="button"
              onClick={() => setShowPw(!showPw)}
              className="absolute right-3 top-9 text-secondary hover:text-primary transition"
            >
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {password && (
            <div className="mt-2">
              <div className="grid grid-cols-4 gap-1">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={`h-1 rounded transition-all ${i < pw_strength ? strengthColor[pw_strength] : 'bg-hover'}`}
                  />
                ))}
              </div>
              <p className="mt-1 text-xs text-secondary">{strengthLabel[pw_strength]}</p>
            </div>
          )}
        </div>
        <Input
          label="Confirm Password"
          type="password"
          prefix={<Lock className="h-4 w-4" />}
          placeholder="••••••••"
          value={confirmPw}
          onChange={(e) => setConfirmPw(e.target.value)}
          error={errors.confirmPw}
        />
        <Input
          label="Primary Monthly Income (INR)"
          type="number"
          prefix={<Wallet className="h-4 w-4" />}
          placeholder="50000"
          value={monthlyIncome}
          onChange={(e) => setMonthlyIncome(e.target.value)}
          error={errors.monthlyIncome}
        />
        <div>
          <label className="flex items-center gap-2 text-sm text-secondary cursor-pointer">
            <input
              type="checkbox"
              className="accent-blue"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
            />
            I accept the terms & conditions
          </label>
          {errors.agreed && <p className="mt-1 text-xs text-rose">{errors.agreed}</p>}
        </div>

        <Button type="submit" className="w-full" icon={<Check className="h-4 w-4" />} disabled={isLoading}>
          {isLoading ? 'Creating account…' : 'Create Account'}
        </Button>

        <p className="text-center text-sm text-secondary">
          Already registered?{' '}
          <Link className="text-blue font-medium hover:underline" to="/login">
            Sign in
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
};
