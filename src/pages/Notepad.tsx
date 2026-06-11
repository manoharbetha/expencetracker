import { useState, useEffect } from 'react';
import { Plus, Trash2, CheckCircle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import api from '../services/api';
import { formatCurrency } from '../utils/formatters';

interface Note {
  id: string;
  title: string;
  estimatedPrice: number;
  priority: string;
  status: string;
}

export const Notepad = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [priority, setPriority] = useState('Medium');

  const fetchNotes = async () => {
    try {
      const { data } = await api.get('/notepad/');
      setNotes(data);
    } catch (err) {
      toast.error('Failed to load wishlist items');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return toast.error('Title is required');
    
    try {
      const { data } = await api.post('/notepad/', {
        title,
        estimatedPrice: Number(price) || 0,
        priority
      });
      setNotes([data, ...notes]);
      setTitle('');
      setPrice('');
      setPriority('Medium');
      toast.success('Added to wishlist');
    } catch (err) {
      toast.error('Failed to add item');
    }
  };

  const handleToggleStatus = async (note: Note) => {
    const newStatus = note.status === 'Pending' ? 'Bought' : 'Pending';
    try {
      const { data } = await api.put(`/notepad/${note.id}`, { status: newStatus });
      setNotes(notes.map(n => n.id === note.id ? data : n));
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/notepad/${id}`);
      setNotes(notes.filter(n => n.id !== id));
      toast.success('Item deleted');
    } catch (err) {
      toast.error('Failed to delete item');
    }
  };

  const pendingNotes = notes.filter(n => n.status === 'Pending');
  const boughtNotes = notes.filter(n => n.status === 'Bought');
  const estimatedTotal = pendingNotes.reduce((acc, curr) => acc + curr.estimatedPrice, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-foreground">Wishlist Notepad</h1>
          <p className="text-secondary">Keep track of items you want to buy this month.</p>
        </div>
        <div className="bg-card border border-subtle px-4 py-2 rounded-lg text-center">
          <p className="text-xs text-secondary font-semibold uppercase tracking-wider">Estimated Total Cost</p>
          <p className="text-xl font-bold text-rose">{formatCurrency(estimatedTotal)}</p>
        </div>
      </div>

      <div className="bg-card border border-subtle p-4 sm:p-6 rounded-card">
        <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-3">
          <Input 
            placeholder="What do you want to buy?" 
            value={title} 
            onChange={e => setTitle(e.target.value)} 
            className="flex-1"
          />
          <Input 
            type="number" 
            placeholder="Price" 
            value={price} 
            onChange={e => setPrice(e.target.value)} 
            className="w-full sm:w-32"
          />
          <select 
            value={priority} 
            onChange={e => setPriority(e.target.value)}
            className="rounded-md border border-default bg-surface px-3 py-2 text-sm text-foreground focus:border-blue focus:outline-none w-full sm:w-32"
          >
            <option value="High">High Priority</option>
            <option value="Medium">Medium Priority</option>
            <option value="Low">Low Priority</option>
          </select>
          <Button type="submit" variant="primary" icon={<Plus className="h-4 w-4" />} className="whitespace-nowrap">
            Add Item
          </Button>
        </form>
      </div>

      {loading ? (
        <div className="text-center py-10 text-secondary">Loading...</div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Pending Column */}
          <div className="space-y-4">
            <h2 className="font-bold text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue" />
              Pending ({pendingNotes.length})
            </h2>
            {pendingNotes.length === 0 ? (
              <div className="p-6 text-center text-secondary border border-dashed border-subtle rounded-card bg-surface/50">
                No pending items.
              </div>
            ) : (
              <div className="space-y-3">
                {pendingNotes.map(note => (
                  <div key={note.id} className="flex items-center justify-between p-4 bg-card border border-subtle rounded-lg hover:border-blue transition-colors">
                    <div className="flex items-center gap-4 flex-1">
                      <button 
                        onClick={() => handleToggleStatus(note)}
                        className="h-6 w-6 rounded-full border-2 border-subtle hover:border-emerald flex items-center justify-center transition-colors shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="font-semibold truncate">{note.title}</p>
                        <div className="flex gap-2 items-center text-xs text-tertiary">
                          <span className="font-medium text-foreground">{formatCurrency(note.estimatedPrice)}</span>
                          <span>•</span>
                          <span className={
                            note.priority === 'High' ? 'text-rose' : 
                            note.priority === 'Medium' ? 'text-orange-500' : 'text-emerald'
                          }>{note.priority} Priority</span>
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" icon={<Trash2 className="h-4 w-4 text-tertiary hover:text-rose" />} onClick={() => handleDelete(note.id)} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bought Column */}
          <div className="space-y-4">
            <h2 className="font-bold text-lg flex items-center gap-2 text-emerald">
              <CheckCircle className="h-5 w-5" />
              Bought ({boughtNotes.length})
            </h2>
            {boughtNotes.length === 0 ? (
              <div className="p-6 text-center text-secondary border border-dashed border-subtle rounded-card bg-surface/50">
                You haven't bought anything yet.
              </div>
            ) : (
              <div className="space-y-3">
                {boughtNotes.map(note => (
                  <div key={note.id} className="flex items-center justify-between p-4 bg-surface border border-subtle/50 rounded-lg opacity-75">
                    <div className="flex items-center gap-4 flex-1">
                      <button 
                        onClick={() => handleToggleStatus(note)}
                        className="h-6 w-6 rounded-full bg-emerald text-white flex items-center justify-center shrink-0"
                      >
                        <CheckCircle className="h-4 w-4" />
                      </button>
                      <div className="min-w-0">
                        <p className="font-semibold line-through text-secondary truncate">{note.title}</p>
                        <p className="text-xs text-tertiary">{formatCurrency(note.estimatedPrice)}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" icon={<Trash2 className="h-4 w-4 text-tertiary hover:text-rose" />} onClick={() => handleDelete(note.id)} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
