import { Navigate, Outlet, RouteObject } from 'react-router-dom';
import { AppLayout } from '../layouts/AppLayout';
import { useAuth } from '../context/AuthContext';
import { Landing } from '../pages/Landing';
import { Login } from '../pages/Login';
import { Register } from '../pages/Register';
import { Dashboard } from '../pages/Dashboard';
import { Expenses } from '../pages/Expenses';
import { Goals } from '../pages/Goals';
import { DebtManager } from '../pages/DebtManager';
import { Notepad } from '../pages/Notepad';
import { AIAssistant } from '../pages/AIAssistant';
import { StatementImport } from '../pages/StatementImport';
import { Settings } from '../pages/Settings';
import { NotFound } from '../pages/NotFound';

const ProtectedLayout = () => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <AppLayout />;
};

export const routes: RouteObject[] = [
  { path: '/', element: <Landing /> },
  { path: '/login', element: <Login /> },
  { path: '/register', element: <Register /> },
  {
    element: <ProtectedLayout />,
    children: [
      { path: '/app', element: <Navigate to="/dashboard" replace /> },
      { path: '/dashboard', element: <Dashboard /> },
      { path: '/expenses', element: <Expenses /> },
      { path: '/goals', element: <Goals /> },
      { path: '/debt', element: <DebtManager /> },
      { path: '/notepad', element: <Notepad /> },
      { path: '/ai-assistant', element: <AIAssistant /> },
      { path: '/import', element: <StatementImport /> },
      { path: '/settings', element: <Settings /> },
      { path: '*', element: <NotFound /> },
    ],
  },
];
