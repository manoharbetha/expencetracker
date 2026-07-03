import { useEffect, useState } from 'react';
import { X, Trash2, Bell, DollarSign, CreditCard, TrendingUp, Target, Brain, Settings, Check } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { trackEvent } from '../../utils/analytics';
import { Notification } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  unreadCount: number;
  setUnreadCount: (count: number) => void;
}

export const NotificationDrawer = ({ isOpen, onClose, unreadCount, setUnreadCount }: Props) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/notifications');
      setNotifications(data);
      setUnreadCount(data.filter((n: Notification) => !n.isRead).length);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      // Optimistically update UI
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(Math.max(0, unreadCount - 1));
      
      // Update backend
      await api.put(`/notifications/${id}/read`);
    } catch (error) {
      // Rollback on error
      fetchNotifications();
      toast.error('Failed to mark as read');
    }
  };

  const handleNotificationClick = async (n: Notification) => {
    // Track notification opened event (only metadata, strictly no PII message/title)
    trackEvent('notification_opened', {
      notification_id: n.id,
      category: n.category,
      type: n.type,
      priority: n.priority
    });

    if (!n.isRead) {
      await markAsRead(n.id);
    }
    onClose();
    
    const category = (n.category || '').toLowerCase();
    const type = (n.type || '').toLowerCase();
    
    if (type === 'budget' || category === 'budget') {
      navigate('/dashboard');
    } else if (type === 'credit_card' || category === 'credit card' || category === 'creditcard') {
      navigate('/credit-card');
    } else if (type === 'goal' || category === 'goals') {
      navigate('/goals');
    } else if (type === 'statement' || n.title.toLowerCase().includes('statement')) {
      navigate('/import');
    } else if (type === 'debt' || category === 'debt') {
      navigate('/debt');
    } else {
      navigate('/dashboard');
    }
  };

  const markAllRead = async () => {
    try {
      // Optimistically update UI
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
      
      // Update backend
      await api.put('/notifications/read-all');
      toast.success('All notifications marked as read');
    } catch (error) {
      fetchNotifications();
      toast.error('Failed to mark all as read');
    }
  };

  const deleteNotif = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent trigger click-to-read when deleting
    try {
      await api.delete(`/notifications/${id}`);
      const deletedNotif = notifications.find(n => n.id === id);
      if (deletedNotif && !deletedNotif.isRead) {
        setUnreadCount(Math.max(0, unreadCount - 1));
      }
      setNotifications(notifications.filter(n => n.id !== id));
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const getCategoryIcon = (category: string) => {
    const c = (category || 'Finance').toLowerCase();
    switch (c) {
      case 'finance':
        return <DollarSign className="h-4 w-4 text-emerald" />;
      case 'credit card':
      case 'creditcard':
        return <CreditCard className="h-4 w-4 text-blue" />;
      case 'budget':
        return <TrendingUp className="h-4 w-4 text-amber" />;
      case 'goals':
        return <Target className="h-4 w-4 text-indigo" />;
      case 'ai insights':
      case 'aiinsights':
      case 'ai':
        return <Brain className="h-4 w-4 text-purple" />;
      case 'system':
        return <Settings className="h-4 w-4 text-secondary" />;
      default:
        return <Bell className="h-4 w-4 text-secondary" />;
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Invisible backdrop to detect clicks outside */}
      <div className="fixed inset-0 z-40" onClick={onClose} />
      
      {/* Floating Dropdown */}
      <div 
        className="absolute right-0 top-full mt-2 w-80 sm:w-96 max-h-[80vh] bg-card border border-subtle shadow-2xl rounded-xl z-50 flex flex-col overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
      >
        <div className="flex items-center justify-between p-4 border-b border-subtle bg-surface/50">
          <h2 className="font-bold flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </h2>
          <div className="flex items-center gap-3">
            {unreadCount > 0 && (
              <button 
                onClick={markAllRead} 
                className="text-xs text-blue hover:text-blue/80 hover:underline transition-colors font-medium flex items-center gap-1"
              >
                <Check className="h-3 w-3" /> Mark all read
              </button>
            )}
            <button onClick={onClose} className="p-1.5 hover:bg-hover rounded-full transition-colors text-secondary hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {loading && notifications.length === 0 ? (
            <div className="text-center text-secondary py-8 text-sm">Loading...</div>
          ) : notifications.length === 0 ? (
            <div className="text-center text-secondary py-8 text-sm">No notifications yet.</div>
          ) : (
            notifications.map(n => (
              <div 
                key={n.id} 
                onClick={() => handleNotificationClick(n)}
                className={`p-3 rounded-lg border transition-all duration-200 cursor-pointer ${
                  n.isRead 
                    ? 'bg-surface/10 border-transparent hover:bg-surface/20 opacity-70' 
                    : 'bg-surface border-blue/20 hover:border-blue/40 shadow-glow-primary/5'
                }`}
              >
                <div className="flex justify-between items-start mb-1.5">
                  <div className="flex items-center gap-2">
                    {getCategoryIcon(n.category)}
                    <h3 className={`font-bold text-sm ${n.isRead ? 'text-secondary' : 'text-foreground'}`}>
                      {n.title}
                    </h3>
                    {!n.isRead && (
                      <span className="h-1.5 w-1.5 rounded-full bg-rose animate-pulse" title="Unread" />
                    )}
                  </div>
                  <span className="text-[10px] text-tertiary whitespace-nowrap ml-2">
                    {new Date(n.createdAt).toLocaleDateString()}
                  </span>
                </div>
                
                <p className={`text-xs mb-2 leading-relaxed ${n.isRead ? 'text-tertiary' : 'text-secondary'}`}>
                  {n.message}
                </p>
                
                <div className="flex justify-between items-center mt-2 pt-1.5 border-t border-subtle/30">
                  <span className={`text-[9px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded-md ${
                    n.priority === 'High' 
                      ? 'bg-rose/10 text-rose' 
                      : 'bg-blue/10 text-blue'
                  }`}>
                    {n.priority}
                  </span>
                  
                  <button 
                    onClick={(e) => deleteNotif(n.id, e)} 
                    className="text-tertiary hover:text-rose p-1 hover:bg-hover rounded transition-colors"
                    title="Delete Notification"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
};
