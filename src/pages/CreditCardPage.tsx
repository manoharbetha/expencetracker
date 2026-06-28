import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { CreditCard as CardIcon, Save, Plus, Landmark, Calendar, AlertCircle, Trash2 } from 'lucide-react';
import { creditCardService, type CreditCardCreatePayload } from '../services/creditCardService';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { formatCurrency, formatDate } from '../utils/formatters';
import type { CreditCard } from '../types';

export const CreditCardPage = () => {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [cardToDelete, setCardToDelete] = useState<string | null>(null);
  
  const [form, setForm] = useState<any>({
    cardName: '',
    bankName: '',
    creditLimit: '',
  });

  const { data: cards = [], isLoading: loading } = useQuery({
    queryKey: ['credit-cards'],
    queryFn: creditCardService.list,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => creditCardService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credit-cards'] });
      toast.success('Credit Card deleted successfully');
      setCardToDelete(null);
    },
    onError: () => toast.error('Failed to delete credit card')
  });

  const upsertMutation = useMutation({
    mutationFn: (data: CreditCardCreatePayload) => creditCardService.upsert(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credit-cards'] });
      toast.success('Credit Card saved successfully');
      setShowForm(false);
      setForm({ cardName: '', bankName: '', creditLimit: '' });
    },
    onError: (err: any) => toast.error(err.response?.data?.detail || 'Failed to save configuration')
  });

  const saving = upsertMutation.isPending;
  const deleting = deleteMutation.isPending;
  
  const handleDeleteCard = () => {
    if (!cardToDelete) return;
    deleteMutation.mutate(cardToDelete);
  };
  
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.cardName.trim()) {
      toast.error('Card Name is required');
      return;
    }
    if (!form.bankName.trim()) {
      toast.error('Bank Name is required');
      return;
    }
    if (Number(form.creditLimit) <= 0) {
      toast.error('Credit Limit must be greater than 0');
      return;
    }
    upsertMutation.mutate({ ...form, creditLimit: Number(form.creditLimit) });
  };

  if (loading && cards.length === 0) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-extrabold">Credit Cards</h1>
          <p className="text-secondary mt-1">Manage your credit cards, limits, and statement cycles.</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} icon={showForm ? undefined : <Plus className="h-4 w-4" />}>
          {showForm ? 'Cancel' : 'Add New Card'}
        </Button>
      </div>

      {showForm && (
        <section className="glass rounded-card p-6 animate-in slide-in-from-top-4 fade-in">
          <h2 className="mb-4 text-lg font-bold">Configure New Credit Card</h2>
          <form onSubmit={handleSave} className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <Input
                label="Credit Card Name"
                placeholder="e.g. HDFC Millennia"
                value={form.cardName}
                onChange={(e) => setForm({ ...form, cardName: e.target.value })}
                required
              />
              <Input
                label="Bank Name"
                placeholder="e.g. SBI, HDFC"
                value={form.bankName}
                onChange={(e) => setForm({ ...form, bankName: e.target.value })}
                required
              />
            </div>
            <div className="space-y-4">
              <Input
                label="Credit Limit (₹)"
                type="number"
                placeholder="e.g. 100000"
                value={form.creditLimit || ''}
                onChange={(e) => setForm({ ...form, creditLimit: e.target.value })}
                required
              />
            </div>
            <div className="col-span-full mt-4 flex justify-end">
              <Button type="submit" icon={<Save className="h-4 w-4" />} disabled={saving}>
                {saving ? 'Saving...' : 'Save Configuration'}
              </Button>
            </div>
          </form>
        </section>
      )}

      {cards.length === 0 && !showForm ? (
        <div className="flex h-64 flex-col items-center justify-center rounded-card border border-dashed border-default bg-card/50 text-center">
          <CardIcon className="mb-4 h-12 w-12 text-secondary opacity-50" />
          <h3 className="text-lg font-bold">No Credit Cards Found</h3>
          <p className="mt-2 text-sm text-secondary max-w-md">
            Add a credit card to track usage, monitor outstanding balances, and import statements directly.
          </p>
          <Button className="mt-6" onClick={() => setShowForm(true)}>Add Your First Card</Button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
          {cards.map((card) => {
            const usagePercent = card.creditLimit > 0 ? (card.currentUsage / card.creditLimit) * 100 : 0;
            const outstanding = card.outstanding || 0;
            const availableLimit = card.availableLimit || (card.creditLimit - card.currentUsage);

            return (
              <div key={card.id} className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-6 shadow-xl text-white group">
                <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                
                <div className="relative z-10 flex flex-col h-full justify-between space-y-6">
                  {/* Header */}
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-display text-xl font-bold tracking-wide">{card.cardName}</h3>
                      <p className="text-sm text-slate-400 font-medium flex items-center gap-1 mt-1">
                        <Landmark className="h-3 w-3" />
                        {card.bankName || 'Unknown Bank'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setCardToDelete(card.id!);
                        }}
                        className="rounded p-1.5 text-slate-400 hover:bg-white/10 hover:text-rose-400 transition"
                        title="Delete Card"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      <div className="h-8 w-12 rounded bg-gradient-to-r from-amber-400/80 to-yellow-600/80 p-1 opacity-90 shadow-inner">
                        <div className="h-full w-full rounded-sm border border-amber-600/30 grid grid-cols-3 grid-rows-3" />
                      </div>
                    </div>
                  </div>

                  {/* Limit & Outstanding */}
                  <div className="grid grid-cols-2 gap-4 border-y border-white/10 py-4">
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold mb-1">Total Limit</p>
                      <p className="font-mono text-xl font-bold">{formatCurrency(card.creditLimit)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold mb-1">Available Limit</p>
                      <p className="font-mono text-xl font-bold text-emerald-400">{formatCurrency(availableLimit)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold mb-1">Current Usage</p>
                      <p className="font-mono text-lg font-bold text-rose-300">{formatCurrency(card.currentUsage)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold mb-1">Outstanding</p>
                      <p className="font-mono text-lg font-bold text-rose-400">{formatCurrency(outstanding)}</p>
                    </div>
                  </div>

                  {/* Usage Bar */}
                  <div>
                    <div className="flex justify-between text-xs mb-2">
                      <span className="text-slate-300">Usage Progress</span>
                      <span className="font-bold">{usagePercent.toFixed(1)}%</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                      <div
                        className={`h-full rounded-full transition-all duration-1000 ${
                          usagePercent > 80 ? 'bg-rose-500' : usagePercent > 50 ? 'bg-amber-400' : 'bg-emerald-400'
                        }`}
                        style={{ width: `${Math.min(usagePercent, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Dates Footer */}
                  <div className="flex items-center justify-between text-xs text-slate-400 pt-2">
                    <div className="flex flex-col gap-1">
                      <span className="flex items-center gap-1"><Calendar className="h-3 w-3"/> Statement: {card.statementDate ? formatDate(card.statementDate) : '-'}</span>
                      <span className="flex items-center gap-1"><AlertCircle className="h-3 w-3"/> Min Due: {formatCurrency(card.minimumDue || 0)}</span>
                    </div>
                    <div className="flex flex-col gap-1 text-right">
                      <span className="font-semibold text-rose-300">Due: {card.dueDate ? card.dueDate : '-'}</span>
                      <span className="text-[10px]">Imported: {card.lastImported ? formatDate(card.lastImported) : 'Never'}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal open={!!cardToDelete} title="Delete Credit Card?" onClose={() => setCardToDelete(null)}>
        <div className="space-y-4 text-primary">
          <p className="text-sm text-secondary">
            This will remove your credit card configuration.
          </p>
          <p className="text-sm text-secondary">
            Your expense history will <strong className="text-primary">NOT</strong> be deleted.
          </p>
          <p className="text-sm text-slate-300">
            Credit card analytics and usage will be reset.
          </p>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="secondary" onClick={() => setCardToDelete(null)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDeleteCard} disabled={deleting}>
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
