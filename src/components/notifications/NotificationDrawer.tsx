import { useEffect, useState } from 'react';
import { X, Trash2, CheckCircle, Bell } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  unreadCount: number;
  setUnreadCount: (count: number) => void;
}

export const NotificationDrawer = ({ isOpen, onClose, unreadCount, setUnreadCount }: Props) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

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
      await api.put(`/notifications/${id}/read`);
      setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(Math.max(0, unreadCount - 1));
    } catch (error) {
      toast.error('Failed to mark as read');
    }
  };

  const deleteNotif = async (id: string) => {
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
          <button onClick={onClose} className="p-1.5 hover:bg-hover rounded-full transition-colors text-secondary hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {loading ? (
            <div className="text-center text-secondary py-8 text-sm">Loading...</div>
          ) : notifications.length === 0 ? (
            <div className="text-center text-secondary py-8 text-sm">No notifications yet.</div>
          ) : (
            notifications.map(n => (
              <div key={n.id} className={`p-3 rounded-lg border transition-colors ${n.isRead ? 'bg-surface/30 border-transparent' : 'bg-card border-blue/30 shadow-sm'}`}>
                <div className="flex justify-between items-start mb-1">
                  <h3 className={`font-semibold text-sm ${n.isRead ? 'text-secondary' : 'text-foreground'}`}>{n.title}</h3>
                  <span className="text-[10px] text-tertiary whitespace-nowrap ml-2">
                    {new Date(n.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className={`text-xs mb-2 leading-relaxed ${n.isRead ? 'text-tertiary' : 'text-secondary'}`}>{n.message}</p>
                <div className="flex justify-end gap-3 mt-2">
                  {!n.isRead && (
                    <button onClick={() => markAsRead(n.id)} className="text-[10px] flex items-center gap-1 text-blue hover:text-blue-400 transition-colors font-medium">
                      <CheckCircle className="h-3 w-3" /> Mark read
                    </button>
                  )}
                  <button onClick={() => deleteNotif(n.id)} className="text-[10px] flex items-center gap-1 text-rose hover:text-red-400 transition-colors font-medium">
                    <Trash2 className="h-3 w-3" /> Delete
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
