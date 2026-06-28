import { Bell, Menu, Search, Settings, LogOut } from 'lucide-react';
import { NotificationDrawer } from '../notifications/NotificationDrawer';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { Avatar } from '../ui/Avatar';
import api from '../../services/api';
import { formatCurrency } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';

export const Navbar = () => {
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  
  const [dropdownOpen, setDropdownOpen] = useState(false);
  
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const label = location.pathname === '/' ? 'Home' : location.pathname.split('/').filter(Boolean).join(' / ');

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    try {
      const { data } = await api.get('/notifications');
      setNotifications(data);
      setUnreadCount(data.filter((n: any) => !n.read && !n.isRead).length);
    } catch {}
  };

  useEffect(() => { 
    fetchNotifications();
  }, []);

  const handleSearch = async (val: string) => {
    setQuery(val);
    if (val.length > 2) {
      try {
        const { data } = await api.get(`/expenses?search=${val}&limit=5`);
        setResults(data.items);
      } catch {}
    } else {
      setResults([]);
    }
  };

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-subtle bg-base/75 px-4 backdrop-blur-xl lg:px-6">
      <Button variant="ghost" size="sm" icon={<Menu className="h-4 w-4" />} className="lg:hidden" />
      <p className="hidden text-sm font-semibold capitalize text-secondary sm:block">{label || 'Dashboard'}</p>
      
      <button onClick={() => setSearchOpen(true)} className="mx-auto flex h-10 w-full max-w-xl items-center gap-3 rounded border border-default bg-card px-3 text-left text-sm text-tertiary transition hover:bg-hover">
        <Search className="h-4 w-4" /> Search transactions... <span className="ml-auto rounded border border-default px-1.5 py-0.5 text-[10px]">⌘K</span>
      </button>
      
      <div className="relative">
        <Button variant="ghost" size="sm" icon={<Bell className="h-4 w-4" />} onClick={() => setNotifOpen(true)} />
        {unreadCount > 0 && <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-rose flex items-center justify-center text-[8px] text-white font-bold">{unreadCount}</span>}
        <NotificationDrawer isOpen={notifOpen} onClose={() => { setNotifOpen(false); fetchNotifications(); }} unreadCount={unreadCount} setUnreadCount={setUnreadCount} />
      </div>

      <div className="relative">
        <button onClick={() => setDropdownOpen(!dropdownOpen)} className="focus:outline-none">
          <Avatar name={user?.name || 'User'} size="sm" />
        </button>
        {dropdownOpen && (
          <div className="absolute right-0 mt-2 w-48 rounded border border-subtle bg-card p-2 shadow-lg z-50">
            <div className="px-3 py-2 border-b border-subtle mb-1">
              <p className="text-sm font-bold text-primary">{user?.name || 'User'}</p>
              <p className="text-xs text-secondary truncate">{user?.email || ''}</p>
            </div>
            <button 
              onClick={() => { setDropdownOpen(false); navigate('/settings'); }}
              className="w-full flex items-center gap-2 rounded px-3 py-2 text-sm font-semibold text-secondary hover:bg-hover hover:text-primary transition"
            >
              <Settings className="h-4 w-4" /> Settings
            </button>
            <button 
              onClick={() => { setDropdownOpen(false); logout(); }}
              className="w-full flex items-center gap-2 rounded px-3 py-2 text-sm font-semibold text-rose hover:bg-rose/10 transition mt-1"
            >
              <LogOut className="h-4 w-4" /> Sign Out
            </button>
          </div>
        )}
      </div>
      
      <Modal open={searchOpen} title="Search Transactions" onClose={() => setSearchOpen(false)}>
        <Input prefix={<Search className="h-4 w-4" />} placeholder="Search descriptions..." autoFocus value={query} onChange={(e) => handleSearch(e.target.value)} />
        <div className="mt-4 space-y-2 text-sm">
          {results.length > 0 ? results.map((item) => (
            <div key={item.id} className="rounded border border-subtle bg-card p-3 flex justify-between">
              <div>
                <p className="font-semibold">{item.description}</p>
                <p className="text-xs text-secondary">{item.date} • {item.category}</p>
              </div>
              <p className="font-bold text-rose">{formatCurrency(item.amount)}</p>
            </div>
          )) : query.length > 2 ? (
            <p className="text-secondary">No results found.</p>
          ) : (
            <p className="text-secondary">Type at least 3 characters to search.</p>
          )}
        </div>
      </Modal>
    </header>
  );
};
