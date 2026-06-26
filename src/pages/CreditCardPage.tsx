import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { CreditCard as CardIcon, Save, Calendar, Landmark } from 'lucide-react';
import { creditCardService, type CreditCardCreatePayload } from '../services/creditCardService';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { formatCurrency } from '../utils/formatters';

export const CreditCardPage = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  
  const [form, setForm] = useState<CreditCardCreatePayload>({
    cardName: '',
    creditLimit: 50000,
    billingDate: 15,
    dueDate: 5,
  });

  const fetchCard = async () => {
    setLoading(true);
    try {
      const card = await creditCardService.get();
      if (card) {
        setForm({
          cardName: card.cardName,
          creditLimit: card.creditLimit,
          billingDate: card.billingDate,
          dueDate: card.dueDate,
        });
        setIsEdit(true);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCard();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.cardName.trim()) {
      toast.error('Card Name is required');
      return;
    }
    if (form.creditLimit <= 0) {
      toast.error('Credit Limit must be greater than 0');
      return;
    }
    if (form.billingDate < 1 || form.billingDate > 31) {
      toast.error('Billing date must be between 1 and 31');
      return;
    }
    if (form.dueDate < 1 || form.dueDate > 31) {
      toast.error('Due date must be between 1 and 31');
      return;
    }

    setSaving(true);
    try {
      await creditCardService.upsert(form);
      toast.success(isEdit ? 'Credit Card updated' : 'Credit Card configured');
      setIsEdit(true);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="font-display text-3xl font-extrabold">Credit Card Tracker</h1>
        <p className="text-secondary">Set up and manage your credit limit, billing cycles, and AI insights.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Left Side: Real-time Glassmorphic Credit Card Preview */}
        <div className="flex flex-col items-center justify-center space-y-4">
          <p className="w-full text-left text-sm font-bold uppercase tracking-wider text-tertiary">Real-time Card Preview</p>
          
          <div className="relative aspect-[1.586/1] w-full overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-indigo-900/60 via-purple-900/50 to-slate-900/80 p-6 shadow-2xl backdrop-blur-xl transition-all duration-300 hover:shadow-glow-primary">
            {/* Card Glass Sheen Overlay */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 opacity-30 pointer-events-none" />
            
            {/* Card Content Layout */}
            <div className="flex h-full flex-col justify-between text-white">
              {/* Chip & Branding */}
              <div className="flex items-center justify-between">
                {/* Simulated EMV Chip */}
                <div className="h-9 w-12 rounded bg-gradient-to-r from-amber-400/90 to-yellow-500/80 p-1 opacity-80 shadow-inner">
                  <div className="h-full w-full rounded-sm border border-amber-600/30 grid grid-cols-3 grid-rows-3" />
                </div>
                {/* Branding Icon */}
                <div className="flex items-center gap-2">
                  <Landmark className="h-6 w-6 text-white/80" />
                  <span className="font-display text-sm font-bold tracking-widest uppercase text-white/90">FINTELL</span>
                </div>
              </div>

              {/* Card Limit Display */}
              <div className="space-y-1">
                <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">Credit Limit</p>
                <p className="font-mono text-2xl font-bold tracking-wider">{formatCurrency(form.creditLimit || 0)}</p>
              </div>

              {/* Card Name & Cycle Dates */}
              <div className="flex items-center justify-between border-t border-white/5 pt-3">
                <div>
                  <p className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Card Name</p>
                  <p className="truncate text-sm font-bold tracking-wide text-white/90 max-w-[180px]">
                    {form.cardName || 'YOUR CREDIT CARD'}
                  </p>
                </div>
                
                <div className="flex gap-4 text-right">
                  <div>
                    <p className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Bill Day</p>
                    <p className="font-mono text-xs font-bold text-white/90">{form.billingDate || '–'}</p>
                  </div>
                  <div>
                    <p className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Due Day</p>
                    <p className="font-mono text-xs font-bold text-white/90">{form.dueDate || '–'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Secure details disclaimer */}
          <div className="flex items-start gap-3 rounded-lg border border-blue/10 bg-blue/5 p-4 text-xs text-secondary">
            <CardIcon className="mt-0.5 h-4 w-4 shrink-0 text-blue" />
            <p>
              <strong>Privacy First:</strong> We do NOT collect your card number, CVV, expiry date, PIN, or banking passwords. Tracking is fully manual and secure.
            </p>
          </div>
        </div>

        {/* Right Side: Setup Form */}
        <section className="glass rounded-card p-6">
          <h2 className="mb-4 text-lg font-bold">{isEdit ? 'Update Credit Card Settings' : 'Configure Credit Card'}</h2>
          
          <form onSubmit={handleSave} className="space-y-4">
            <Input
              label="Credit Card Name"
              placeholder="e.g. HDFC Millennia, ICICI Amazon Pay"
              value={form.cardName}
              onChange={(e) => setForm({ ...form, cardName: e.target.value })}
              required
            />

            <Input
              label="Credit Limit (₹)"
              type="number"
              placeholder="e.g. 100000"
              value={form.creditLimit || ''}
              onChange={(e) => setForm({ ...form, creditLimit: Number(e.target.value) })}
              required
            />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-secondary">Billing Date</label>
                <select
                  className="h-11 w-full rounded border border-default bg-card px-3 text-sm text-primary transition focus:border-blue focus:outline-none"
                  value={form.billingDate}
                  onChange={(e) => setForm({ ...form, billingDate: Number(e.target.value) })}
                >
                  {Array.from({ length: 31 }).map((_, i) => (
                    <option key={i + 1} value={i + 1}>Day {i + 1}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-secondary">Due Date</label>
                <select
                  className="h-11 w-full rounded border border-default bg-card px-3 text-sm text-primary transition focus:border-blue focus:outline-none"
                  value={form.dueDate}
                  onChange={(e) => setForm({ ...form, dueDate: Number(e.target.value) })}
                >
                  {Array.from({ length: 31 }).map((_, i) => (
                    <option key={i + 1} value={i + 1}>Day {i + 1}</option>
                  ))}
                </select>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full mt-2"
              icon={<Save className="h-4 w-4" />}
              disabled={saving}
            >
              {saving ? 'Saving…' : isEdit ? 'Update Settings' : 'Save Configuration'}
            </Button>
          </form>
        </section>
      </div>
    </div>
  );
};
