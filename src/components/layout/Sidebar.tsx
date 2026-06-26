import { BarChart2, CreditCard, LayoutDashboard, LogOut, Receipt, Settings, Sparkles, Target, Wallet, FileDown, StickyNote, Coins } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import clsx from 'clsx';
import { Avatar } from '../ui/Avatar';
import { useAuth } from '../../context/AuthContext';

const nav = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Expenses', path: '/expenses', icon: Receipt },
  { label: 'Goals', path: '/goals', icon: Target },
  { label: 'Debt', path: '/debt', icon: Coins },
  { label: 'Credit Card', path: '/credit-card', icon: CreditCard },
  { label: 'Notepad', path: '/notepad', icon: StickyNote },
  { label: 'AI Assistant', path: '/ai-assistant', icon: Sparkles },
  { label: 'Statement Import', path: '/import', icon: FileDown },
];

export const Sidebar = () => {
  const { user, logout } = useAuth();

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 border-r border-subtle bg-void/90 p-4 backdrop-blur-xl lg:flex lg:flex-col">
        <NavLink to="/" className="mb-8 flex items-center gap-3 px-2">
          <div className="grid h-10 w-10 place-items-center rounded bg-[image:var(--gradient-ai)]">
            <Wallet className="h-5 w-5" />
          </div>
          <span className="font-display text-xl font-extrabold">Expence Tracker</span>
        </NavLink>

        <nav className="space-y-1">
          {nav.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                clsx('flex h-11 items-center gap-3 rounded px-3 text-sm font-semibold text-secondary transition hover:bg-hover hover:text-primary',
                  isActive && 'border-l-2 border-blue bg-blue/10 text-primary')
              }
            >
              <item.icon className="h-[18px] w-[18px]" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Mobile nav */}
      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-6 border-t border-subtle bg-void/95 px-2 py-2 backdrop-blur-xl lg:hidden">
        {nav.slice(0, 6).map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              clsx('grid place-items-center gap-1 rounded py-2 text-[10px] font-semibold text-secondary', isActive && 'bg-blue/10 text-blue')
            }
          >
            <item.icon className="h-5 w-5" />
            <span>{item.label.split(' ')[0]}</span>
          </NavLink>
        ))}
      </nav>
    </>
  );
};
