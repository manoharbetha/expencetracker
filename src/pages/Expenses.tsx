import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Search, Trash2, Pencil } from 'lucide-react';
import { expenseService, type Expense, type ExpenseCreate } from '../services/expenseService';
import { formatCurrency, formatDate } from '../utils/formatters';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Skeleton } from '../components/ui/Skeleton';

const CATEGORIES = ['Food', 'Travel', 'Shopping', 'Bills', 'Education', 'Entertainment'];
const METHODS = ['Bank', 'UPI', 'Cash', 'Credit Card'];
const TONE: Record<string, any> = {
  Food: 'amber', Travel: 'blue', Shopping: 'violet', Bills: 'rose', Education: 'emerald', Entertainment: 'pink',
};

const empty: ExpenseCreate = {
  amount: 0, category: 'Food', description: '', paymentMethod: 'UPI', date: new Date().toISOString().slice(0, 10),
};

export const Expenses = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [form, setForm] = useState<ExpenseCreate>(empty);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');

  const fetchAll = async () => {
    setLoading(true);
    try {
      const resp = await expenseService.list({ category: catFilter || undefined, search: search || undefined, limit: 200 });
      setExpenses(resp.items ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, [catFilter, search]);

  const openAdd = () => { setEditing(null); setForm(empty); setOpen(true); };
  const openEdit = (e: Expense) => {
    setEditing(e);
    setForm({ amount: e.amount, category: e.category, description: e.description, paymentMethod: e.paymentMethod, date: e.date.slice(0, 10) });
    setOpen(true);
  };

  const handleSave = async () => {
    if (!form.description || !form.amount || !form.date) {
      toast.error('Please fill all fields');
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await expenseService.update(editing.id, form);
        toast.success('Expense updated');
      } else {
        await expenseService.create(form);
        toast.success('Expense added');
      }
      setOpen(false);
      fetchAll();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this expense?')) return;
    await expenseService.remove(id);
    toast.success('Expense deleted');
    fetchAll();
  };

  const totalShown = expenses.reduce((s, e) => s + e.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-extrabold">Expenses</h1>
          <p className="text-secondary">Track every rupee with category-level clarity.</p>
        </div>
        <Button icon={<Plus className="h-4 w-4" />} onClick={openAdd}>Add Expense</Button>
      </div>

      {/* Filters */}
      <div className="glass grid gap-3 rounded-card p-4 md:grid-cols-3">
        <Input
          prefix={<Search className="h-4 w-4" />}
          placeholder="Search expenses…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="h-11 rounded border border-default bg-card px-3 text-sm text-secondary"
          value={catFilter}
          onChange={(e) => setCatFilter(e.target.value)}
        >
          <option value="">All Categories</option>
          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
        <div className="flex items-center justify-end">
          <p className="text-sm text-secondary">
            {expenses.length} records · <span className="amount text-rose font-semibold">{formatCurrency(totalShown)}</span>
          </p>
        </div>
      </div>

      {/* Table */}
      <section className="glass overflow-hidden rounded-card">
        <div className="hidden grid-cols-[1fr_2fr_1fr_1fr_1fr_100px] border-b border-subtle px-4 py-3 text-xs font-bold uppercase text-tertiary md:grid">
          <span>Date</span><span>Description</span><span>Category</span><span>Amount</span><span>Method</span><span></span>
        </div>
        {loading ? (
          <div className="p-4 space-y-2">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14" />)}
          </div>
        ) : expenses.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-secondary">No expenses found.</p>
            <Button className="mt-4" icon={<Plus className="h-4 w-4" />} onClick={openAdd}>Add your first expense</Button>
          </div>
        ) : (
          expenses.map((e) => (
            <div key={e.id} className="grid gap-3 border-b border-subtle px-4 py-4 text-sm transition last:border-b-0 hover:bg-hover/40 md:grid-cols-[1fr_2fr_1fr_1fr_1fr_100px] md:items-center">
              <span className="text-secondary">{formatDate(e.date)}</span>
              <span className="font-semibold">{e.description}</span>
              <Badge tone={TONE[e.category]}>{e.category}</Badge>
              <span className="amount text-rose font-semibold">-{formatCurrency(e.amount)}</span>
              <span className="text-secondary">{e.paymentMethod}</span>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" icon={<Pencil className="h-3.5 w-3.5" />} onClick={() => openEdit(e)} />
                <Button variant="ghost" size="sm" icon={<Trash2 className="h-3.5 w-3.5 text-rose" />} onClick={() => handleDelete(e.id)} />
              </div>
            </div>
          ))
        )}
      </section>

      {/* Modal */}
      <Modal open={open} title={editing ? 'Edit Expense' : 'Add Expense'} onClose={() => setOpen(false)}>
        <div className="grid gap-4">
          <Input label="Date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          <Input label="Amount (₹)" type="number" value={String(form.amount)} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} />
          <div>
            <label className="mb-1 block text-sm font-medium text-secondary">Category</label>
            <select className="h-11 w-full rounded border border-default bg-card px-3 text-sm text-primary" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as any })}>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <Input label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <div>
            <label className="mb-1 block text-sm font-medium text-secondary">Payment Method</label>
            <select className="h-11 w-full rounded border border-default bg-card px-3 text-sm text-primary" value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value as any })}>
              {METHODS.map((m) => <option key={m}>{m}</option>)}
            </select>
          </div>
          <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : editing ? 'Update' : 'Save Expense'}</Button>
        </div>
      </Modal>
    </div>
  );
};
