import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Skeleton } from '../../components/ui/Skeleton';

interface RecentNotificationsProps {
  notifications: any[];
  loading: boolean;
}

export const RecentNotifications = ({ notifications, loading }: RecentNotificationsProps) => {
  const queryClient = useQueryClient();
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleRead = async (id: string, isRead: boolean) => {
    if (isRead) return;
    setUpdatingId(id);
    try {
      // Optimistic cache update
      queryClient.setQueryData(['notifications'], (old: any) => {
        if (!old) return old;
        return old.map((n: any) => n.id === id ? { ...n, isRead: true } : n);
      });
      // Invalidate queries so Navbar and Dashboard counts sync up
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      
      await api.put(`/notifications/${id}/read`);
    } catch {
      toast.error('Failed to mark notification as read');
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <section className="glass rounded-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold">Recent Notifications</h2>
        <span className="bg-rose/10 text-rose px-2 py-0.5 rounded text-xs font-bold">
          {notifications.filter(n => !n.isRead).length} Unread
        </span>
      </div>
      {loading ? (
        <Skeleton className="h-24" />
      ) : notifications.length === 0 ? (
        <p className="text-secondary text-sm">No recent alerts.</p>
      ) : (
        <div className="space-y-3">
          {notifications.slice(0, 3).map(n => (
            <div 
              key={n.id} 
              onClick={() => handleRead(n.id, n.isRead)}
              className={`p-3 rounded border transition-all duration-200 ${
                n.isRead 
                  ? 'border-subtle bg-surface/30 opacity-70 cursor-default' 
                  : 'border-blue/30 bg-surface/70 hover:border-blue/50 cursor-pointer shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <h3 className={`font-semibold text-sm ${n.isRead ? 'text-secondary' : 'text-foreground'}`}>
                    {n.title}
                  </h3>
                  {!n.isRead && (
                    <span className="h-1.5 w-1.5 rounded-full bg-rose animate-pulse" title="Unread" />
                  )}
                </div>
                {n.type === 'ai' && <span className="bg-blue/10 text-blue px-2 py-0.5 rounded text-[10px] font-bold">AI Insight</span>}
              </div>
              <p className={`text-xs ${n.isRead ? 'text-tertiary' : 'text-secondary'}`}>{n.message}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
