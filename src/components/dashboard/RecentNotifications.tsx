import { Skeleton } from '../../components/ui/Skeleton';

interface RecentNotificationsProps {
  notifications: any[];
  loading: boolean;
}

export const RecentNotifications = ({ notifications, loading }: RecentNotificationsProps) => {
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
            <div key={n.id} className="p-3 rounded border border-subtle bg-surface/50">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-semibold text-sm">{n.title}</h3>
                {n.type === 'ai' && <span className="bg-blue/10 text-blue px-2 py-0.5 rounded text-[10px] font-bold">AI Insight</span>}
              </div>
              <p className="text-sm text-secondary">{n.message}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
