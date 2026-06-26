import { lazy, Suspense } from 'react';
import { Navigate, Outlet, RouteObject } from 'react-router-dom';
import { AppLayout } from '../layouts/AppLayout';
import { useAuth } from '../context/AuthContext';
import { Wallet } from 'lucide-react';

const Landing = lazy(() => import('../pages/Landing').then(m => ({ default: m.Landing })));
const Login = lazy(() => import('../pages/Login').then(m => ({ default: m.Login })));
const Register = lazy(() => import('../pages/Register').then(m => ({ default: m.Register })));
const Dashboard = lazy(() => import('../pages/Dashboard').then(m => ({ default: m.Dashboard })));
const Expenses = lazy(() => import('../pages/Expenses').then(m => ({ default: m.Expenses })));
const Goals = lazy(() => import('../pages/Goals').then(m => ({ default: m.Goals })));
const DebtManager = lazy(() => import('../pages/DebtManager').then(m => ({ default: m.DebtManager })));
const CreditCardPage = lazy(() => import('../pages/CreditCardPage').then(m => ({ default: m.CreditCardPage })));
const Notepad = lazy(() => import('../pages/Notepad').then(m => ({ default: m.Notepad })));
const AIAssistant = lazy(() => import('../pages/AIAssistant').then(m => ({ default: m.AIAssistant })));
const StatementImport = lazy(() => import('../pages/StatementImport').then(m => ({ default: m.StatementImport })));
const Settings = lazy(() => import('../pages/Settings').then(m => ({ default: m.Settings })));
const NotFound = lazy(() => import('../pages/NotFound').then(m => ({ default: m.NotFound })));

const SuspenseLoader = () => (
  <div className="flex min-h-screen items-center justify-center bg-void">
    <div className="grid h-16 w-16 place-items-center rounded-2xl bg-[image:var(--gradient-ai)] animate-pulse shadow-glow-primary">
      <Wallet className="h-8 w-8 text-white animate-bounce" />
    </div>
  </div>
);

const ProtectedLayout = () => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <SuspenseLoader />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return (
    <Suspense fallback={<SuspenseLoader />}>
      <AppLayout />
    </Suspense>
  );
};

const LazyRoute = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<SuspenseLoader />}>
    {children}
  </Suspense>
);

export const routes: RouteObject[] = [
  { path: '/', element: <LazyRoute><Landing /></LazyRoute> },
  { path: '/login', element: <LazyRoute><Login /></LazyRoute> },
  { path: '/register', element: <LazyRoute><Register /></LazyRoute> },
  {
    element: <ProtectedLayout />,
    children: [
      { path: '/app', element: <Navigate to="/dashboard" replace /> },
      { path: '/dashboard', element: <Dashboard /> },
      { path: '/expenses', element: <Expenses /> },
      { path: '/goals', element: <Goals /> },
      { path: '/debt', element: <DebtManager /> },
      { path: '/credit-card', element: <CreditCardPage /> },
      { path: '/notepad', element: <Notepad /> },
      { path: '/ai-assistant', element: <AIAssistant /> },
      { path: '/import', element: <StatementImport /> },
      { path: '/settings', element: <Settings /> },
      { path: '*', element: <NotFound /> },
    ],
  },
];
