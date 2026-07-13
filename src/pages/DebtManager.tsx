import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Trash2, Pencil, CreditCard, Calendar, TrendingDown } from 'lucide-react';
import { debtService } from '../services/debtService';
import { Debt, DebtCreate } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Skeleton } from '../components/ui/Skeleton';

const empty: DebtCreate = { title: '', amount: 0, interestRate: 0, emi: 0, dueDate: '', type: 'borrowed' };

export const DebtManager = () => {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Debt | null>(null);
  const [form, setForm] = useState<DebtCreate>(empty);
  const [saving, setSaving] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    try { setDebts(await debtService.list()); } finally { setLoading(false); }
  };
  useEffect(() => { fetchAll(); }, []);

  const openAdd = () => { setEditing(null); setForm(empty); setOpen(true); };
  const openEdit = (d: Debt) => {
    setEditing(d);
    setForm({ title: d.title, amount: d.amount, interestRate: d.interestRate, emi: d.emi, dueDate: d.dueDate?.slice(0, 10), type: d.type || 'borrowed' });
    setOpen(true);
  };

  const handleSave = async () => {
    if (!form.title || !form.amount || !form.emi || !form.dueDate) { toast.error('Fill all required fields'); return; }
    setSaving(true);
    try {
      if (editing) { await debtService.update(editing.id, form); toast.success('Debt updated'); }
      else { await debtService.create(form); toast.success('Debt added'); }
      setOpen(false); fetchAll();
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this debt?')) return;
    await debtService.remove(id);
    toast.success('Debt deleted');
    fetchAll();
  };

  const totalDebt = debts.reduce((s, d) => s + d.amount, 0);
  const totalEmi = debts.reduce((s, d) => s + d.emi, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-extrabold">Debt Manager</h1>
          <p className="text-secondary">Track EMIs, interest rates, and payment schedules.</p>
        </div>
        <Button icon={<Plus className="h-4 w-4" />} onClick={openAdd}>Add Debt</Button>
      </div>

      {/* Summary Bar */}
      {!loading && debts.length > 0 && (
        <div className="glass rounded-card p-4 grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-tertiary uppercase font-bold">Total Debt</p>
            <p className="amount text-rose text-xl font-bold">{formatCurrency(totalDebt)}</p>
          </div>
          <div>
            <p className="text-xs text-tertiary uppercase font-bold">Monthly EMI</p>
            <p className="amount text-amber text-xl font-bold">{formatCurrency(totalEmi)}</p>
          </div>
          <div>
            <p className="text-xs text-tertiary uppercase font-bold">Active Debts</p>
            <p className="text-xl font-bold">{debts.length}</p>
          </div>
        </div>
      )}

      {/* Debt Cards */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-44 rounded-card" />)}
        </div>
      ) : debts.length === 0 ? (
        <div className="glass rounded-card py-20 text-center">
          <CreditCard className="mx-auto mb-4 h-12 w-12 text-tertiary" />
          <p className="text-secondary mb-4">No debts tracked. Add your first loan or EMI.</p>
          <Button icon={<Plus className="h-4 w-4" />} onClick={openAdd}>Add Debt</Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {debts.map((d) => (
            <div key={d.id} className="glass rounded-card p-5 space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-lg bg-rose/10">
                    <TrendingDown className="h-5 w-5 text-rose" />
                  </div>
                  <div>
                    <h3 className="font-bold">{d.title} <span className="ml-2 rounded-full bg-surface px-2 py-0.5 text-[10px] uppercase font-bold text-secondary">{d.type || 'borrowed'}</span></h3>
                    <p className="text-xs text-secondary">Due: {formatDate(d.dueDate)}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" icon={<Pencil className="h-3.5 w-3.5" />} onClick={() => openEdit(d)} />
                  <Button variant="ghost" size="sm" icon={<Trash2 className="h-3.5 w-3.5 text-rose" />} onClick={() => handleDelete(d.id)} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div>
                  <p className="text-tertiary text-xs">Outstanding</p>
                  <p className="amount font-semibold text-rose">{formatCurrency(d.amount)}</p>
                </div>
                <div>
                  <p className="text-tertiary text-xs">Interest</p>
                  <p className="font-semibold text-amber">{d.interestRate}%</p>
                </div>
                <div>
                  <p className="text-tertiary text-xs">EMI/month</p>
                  <p className="amount font-semibold">{formatCurrency(d.emi)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={open} title={editing ? 'Edit Debt' : 'Add Debt'} onClose={() => setOpen(false)}>
        <div className="grid gap-4">
          <Input label="Title" placeholder="e.g. Home Loan" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground">Debt Type</label>
            <select
              className="w-full rounded-md border border-default bg-surface px-3 py-2 text-sm text-foreground focus:border-blue focus:outline-none"
              value={form.type || 'borrowed'}
              onChange={(e) => setForm({ ...form, type: e.target.value as 'borrowed' | 'lent' })}
            >
              <option value="borrowed">Borrowed (You Owe)</option>
              <option value="lent">Lent (Owed To You)</option>
            </select>
          </div>
          <Input label="Outstanding Amount (₹)" type="number" value={String(form.amount)} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} />
          <Input label="Interest Rate (%)" type="number" value={String(form.interestRate)} onChange={(e) => setForm({ ...form, interestRate: Number(e.target.value) })} />
          <Input label="EMI / Month (₹)" type="number" value={String(form.emi)} onChange={(e) => setForm({ ...form, emi: Number(e.target.value) })} />
          <Input label="Next Due Date" type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
          <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : editing ? 'Update Debt' : 'Add Debt'}</Button>
        </div>
      </Modal>
    </div>
  );
};
