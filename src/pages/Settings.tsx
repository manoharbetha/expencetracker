import { useState } from 'react';
import { Shield, Save } from 'lucide-react';
import { Avatar } from '../components/ui/Avatar';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import toast from 'react-hot-toast';

export const Settings = () => {
  const { theme, setTheme } = useTheme();
  const { user, updateUser } = useAuth();
  
  const [name, setName] = useState(user?.name || '');
  const [monthlyIncome, setMonthlyIncome] = useState(user?.monthlyIncome?.toString() || '0');
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const updatedUser = await authService.updateProfile({
        name,
        monthlyIncome: Number(monthlyIncome)
      });
      updateUser(updatedUser);
      toast.success('Settings saved successfully!');
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
      <aside className="glass rounded-card p-3">{['Profile', 'Income', 'Theme', 'Security'].map((item) => <button key={item} className="block w-full rounded px-3 py-2 text-left text-sm text-secondary hover:bg-hover">{item}</button>)}</aside>
      <section className="space-y-4">
        <div><h1 className="font-display text-3xl font-extrabold">Settings</h1><p className="text-secondary">Manage your Expence Tracker profile and preferences.</p></div>
        <div className="glass rounded-card p-5"><h2 className="mb-4 font-bold">Profile</h2><div className="mb-4 flex items-center gap-3"><Avatar name={user?.name || 'User'} size="lg" /><Button variant="secondary">Upload Avatar</Button></div><div className="grid gap-4 md:grid-cols-2"><Input label="Name" value={name} onChange={(e) => setName(e.target.value)} /><Input label="Email" value={user?.email || ''} readOnly /></div></div>
        <div className="glass rounded-card p-5"><h2 className="mb-4 font-bold">Income</h2><div className="grid gap-4 md:grid-cols-2"><Input label="Monthly income (INR)" type="number" value={monthlyIncome} onChange={(e) => setMonthlyIncome(e.target.value)} /></div></div>
        <div className="glass rounded-card p-5"><h2 className="mb-4 font-bold">Theme</h2><div className="flex gap-2">{(['dark', 'light', 'system'] as const).map((x) => <Button key={x} variant={theme === x ? 'primary' : 'secondary'} onClick={() => setTheme(x)}>{x}</Button>)}</div></div>
        <div className="glass rounded-card p-5">
          <h2 className="mb-4 font-bold">Notifications</h2>
          <p className="text-secondary text-sm mb-4">Receive alerts for goals, budget utilization, and AI insights.</p>
          <Button 
            variant="primary" 
            onClick={async () => {
              const { requestNotificationPermission } = await import('../services/fcm');
              const success = await requestNotificationPermission();
              if (success) toast.success('Notifications enabled!');
            }}
          >
            Enable Notifications
          </Button>
        </div>
        <div className="flex justify-end"><Button onClick={handleSave} disabled={isLoading} icon={<Save className="h-4 w-4" />}>{isLoading ? 'Saving...' : 'Save Settings'}</Button></div>
      </section>
    </div>
  );
};
