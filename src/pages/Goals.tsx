import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Plus, Trash2, Pencil, Target } from 'lucide-react';
import { goalService } from '../services/goalService';
import { Goal, GoalCreate } from '../types';
import { formatCurrency } from '../utils/formatters';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Skeleton } from '../components/ui/Skeleton';
import { ProgressBar } from '../components/ui/ProgressBar';

const empty: GoalCreate = { goalName: '', targetAmount: 0, savedAmount: 0, deadline: '' };

export const Goals = () => {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Goal | null>(null);
  const [form, setForm] = useState<GoalCreate>(empty);

  const { data: goals = [], isLoading: loading } = useQuery({
    queryKey: ['goals'],
    queryFn: goalService.list,
  });

  const createMutation = useMutation({
    mutationFn: (newGoal: GoalCreate) => goalService.create(newGoal),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      toast.success('Goal created!');
      setOpen(false);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: GoalCreate }) => goalService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      toast.success('Goal updated');
      setOpen(false);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => goalService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      toast.success('Goal deleted');
    }
  });

  const saving = createMutation.isPending || updateMutation.isPending;

  const openAdd = () => { setEditing(null); setForm(empty); setOpen(true); };
  const openEdit = (g: Goal) => {
    setEditing(g);
    setForm({ goalName: g.goalName, targetAmount: g.targetAmount, savedAmount: g.savedAmount, deadline: g.deadline?.slice(0, 10) });
    setOpen(true);
  };

  const handleSave = () => {
    if (!form.goalName || !form.targetAmount || !form.deadline) { toast.error('Fill all fields'); return; }
    if (editing) {
      updateMutation.mutate({ id: editing.id, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const handleDelete = (id: string) => {
    if (!confirm('Delete this goal?')) return;
    deleteMutation.mutate(id);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-extrabold">Goals</h1>
          <p className="text-secondary">Visualize targets, deadlines, and contribution pace.</p>
        </div>
        <Button icon={<Plus className="h-4 w-4" />} onClick={openAdd}>Add Goal</Button>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-card" />)}
        </div>
      ) : goals.length === 0 ? (
        <div className="glass rounded-card py-20 text-center">
          <Target className="mx-auto mb-4 h-12 w-12 text-tertiary" />
          <p className="text-secondary mb-4">No goals yet. Set your first financial goal!</p>
          <Button icon={<Plus className="h-4 w-4" />} onClick={openAdd}>Create Goal</Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {goals.map((g) => (
            <div key={g.id} className="glass rounded-card p-5 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-lg">{g.goalName}</h3>
                  <p className="text-xs text-secondary">Due: {g.deadline?.slice(0, 10)}</p>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" icon={<Pencil className="h-3.5 w-3.5" />} onClick={() => openEdit(g)} />
                  <Button variant="ghost" size="sm" icon={<Trash2 className="h-3.5 w-3.5 text-rose" />} onClick={() => handleDelete(g.id)} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-secondary">Progress</span>
                  <span className="font-semibold text-emerald">{g.progressPercentage?.toFixed(1)}%</span>
                </div>
                <ProgressBar value={g.progressPercentage ?? 0} tone="emerald" />
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-tertiary text-xs">Saved</p>
                  <p className="amount font-semibold text-emerald">{formatCurrency(g.savedAmount)}</p>
                </div>
                <div>
                  <p className="text-tertiary text-xs">Target</p>
                  <p className="amount font-semibold">{formatCurrency(g.targetAmount)}</p>
                </div>
                <div>
                  <p className="text-tertiary text-xs">Remaining</p>
                  <p className="amount font-semibold text-rose">{formatCurrency(g.remainingAmount ?? 0)}</p>
                </div>
                <div>
                  <p className="text-tertiary text-xs">Monthly needed</p>
                  <p className="amount font-semibold text-amber">{formatCurrency(g.monthlySavingsNeeded ?? 0)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={open} title={editing ? 'Edit Goal' : 'New Goal'} onClose={() => setOpen(false)}>
        <div className="grid gap-4">
          <Input label="Goal Name" placeholder="e.g. Buy a MacBook" value={form.goalName} onChange={(e) => setForm({ ...form, goalName: e.target.value })} />
          <Input label="Target Amount (₹)" type="number" value={String(form.targetAmount)} onChange={(e) => setForm({ ...form, targetAmount: Number(e.target.value) })} />
          <Input label="Amount Already Saved (₹)" type="number" value={String(form.savedAmount)} onChange={(e) => setForm({ ...form, savedAmount: Number(e.target.value) })} />
          <Input label="Deadline" type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
          <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : editing ? 'Update Goal' : 'Create Goal'}</Button>
        </div>
      </Modal>
    </div>
  );
};
