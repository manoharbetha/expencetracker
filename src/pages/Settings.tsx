import { useState } from 'react';
import { Save } from 'lucide-react';
import { Avatar } from '../components/ui/Avatar';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import { settingsService } from '../services/settingsService';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export const Settings = () => {
  const { theme, setTheme } = useTheme();
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  
  const [name, setName] = useState(user?.name || '');
  const [monthlyIncome, setMonthlyIncome] = useState(user?.monthlyIncome?.toString() || '0');
  const [isLoading, setIsLoading] = useState(false);
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);
  const [clearing, setClearing] = useState(false);

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

  const handleClearData = async () => {
    setClearing(true);
    try {
      await settingsService.clearData();
      toast.success('All your financial data has been successfully removed.');
      setClearConfirmOpen(false);
      navigate('/');
    } catch {
      toast.error('Failed to clear financial data');
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
      <aside className="glass rounded-card p-3">
        {['Profile', 'Income', 'Theme', 'Danger Zone'].map((item) => (
          <button key={item} className="block w-full rounded px-3 py-2 text-left text-sm text-secondary hover:bg-hover">
            {item}
          </button>
        ))}
      </aside>
      <section className="space-y-4">
        <div>
          <h1 className="font-display text-3xl font-extrabold">Settings</h1>
          <p className="text-secondary">Manage your Expense Tracker profile and preferences.</p>
        </div>
        
        <div className="glass rounded-card p-5">
          <h2 className="mb-4 font-bold">Profile</h2>
          <div className="mb-4 flex items-center gap-3">
            <Avatar name={user?.name || 'User'} size="lg" />
            <Button variant="secondary">Upload Avatar</Button>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} />
            <Input label="Email" value={user?.email || ''} readOnly />
          </div>
        </div>
        
        <div className="glass rounded-card p-5">
          <h2 className="mb-4 font-bold">Income</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Input label="Monthly income (INR)" type="number" value={monthlyIncome} onChange={(e) => setMonthlyIncome(e.target.value)} />
          </div>
        </div>
        
        <div className="glass rounded-card p-5">
          <h2 className="mb-4 font-bold">Theme</h2>
          <div className="flex gap-2">
            {(['dark', 'light', 'system'] as const).map((x) => (
              <Button key={x} variant={theme === x ? 'primary' : 'secondary'} onClick={() => setTheme(x)}>
                {x}
              </Button>
            ))}
          </div>
        </div>
        

        <div className="glass rounded-card p-5 border border-rose/30 bg-rose/5">
          <h2 className="mb-2 font-bold text-rose">Danger Zone</h2>
          <p className="text-secondary text-sm mb-4">Permanently clear all your personal financial data. Your account remains active.</p>
          <Button variant="danger" onClick={() => setClearConfirmOpen(true)}>
            Clear All My Data
          </Button>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={isLoading} icon={<Save className="h-4 w-4" />}>
            {isLoading ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </section>

      <Modal open={clearConfirmOpen} title="Clear All Data?" onClose={() => setClearConfirmOpen(false)}>
        <div className="space-y-4 text-primary">
          <p className="text-sm text-secondary font-semibold text-rose">
            This action cannot be undone.
          </p>
          <p className="text-sm text-secondary">
            The following data will be permanently removed:
          </p>
          <ul className="list-disc list-inside text-sm text-secondary space-y-1 pl-2">
            <li>Expenses</li>
            <li>Budgets (AI Suggestions)</li>
            <li>Goals</li>
            <li>Credit Card Configuration</li>
            <li>Notifications</li>
            <li>AI Insights History</li>
            <li>Imported Statements</li>
            <li>Financial Notes</li>
          </ul>
          <p className="text-sm text-secondary pt-2">
            Your account credentials and login details will remain active.
          </p>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="secondary" onClick={() => setClearConfirmOpen(false)} disabled={clearing}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleClearData} disabled={clearing}>
              {clearing ? 'Clearing everything...' : 'Yes, Delete Everything'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
