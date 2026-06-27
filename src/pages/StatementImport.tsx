import { useState } from 'react';
import { UploadCloud, FileText, CheckCircle, Trash2, FileOutput, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { statementService } from '../services/statementService';
import { creditCardService } from '../services/creditCardService';
import { formatCurrency } from '../utils/formatters';
import type { CreditCard } from '../types';

interface ExtractedTxn {
  date: string;
  merchant: string;
  amount: number;
  description: string;
  category: string;
  is_credit?: boolean;
  status?: string;
}

export const StatementImport = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [transactions, setTransactions] = useState<ExtractedTxn[]>([]);
  const [step, setStep] = useState<'upload' | 'preview' | 'success'>('upload');
  const [summary, setSummary] = useState('');
  const [progress, setProgress] = useState(0);
  const [statementType, setStatementType] = useState('bank');
  const [ccDetails, setCcDetails] = useState<any>(null);
  const [importSummary, setImportSummary] = useState<any>(null);
  
  const [cards, setCards] = useState<CreditCard[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<string>('');
  const [showCreateCard, setShowCreateCard] = useState(false);
  const [newCardForm, setNewCardForm] = useState({ bankName: '', cardName: '', creditLimit: '' });
  const [conflictOpen, setConflictOpen] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files?.length) {
      const f = e.dataTransfer.files[0];
      if (f.type === 'application/pdf') setFile(f);
      else toast.error('Only PDF files are supported.');
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setProgress(0);
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const data = await statementService.upload(formData, (progressEvent: any) => {
        if (progressEvent.total) setProgress(Math.round((progressEvent.loaded * 100) / progressEvent.total));
      });
      
      if (data.items.length === 0) {
        toast.error(data.message + " (Check console for detailed debug report)");
        setFile(null);
      } else {
        setTransactions(data.items);
        setStatementType(data.statement_type || 'bank');
        setCcDetails(data.cc_details || {});
        setImportSummary(data.summary || null);
        
        if (data.statement_type === 'credit_card') {
          const existingCards = await creditCardService.list();
          setCards(existingCards);
          if (existingCards.length === 1) {
            setSelectedCardId(existingCards[0].id!);
          } else if (existingCards.length === 0) {
            setNewCardForm({
              bankName: data.cc_details?.bank_name || '',
              cardName: data.cc_details?.card_name || '',
              creditLimit: data.cc_details?.credit_limit || ''
            });
            setShowCreateCard(true);
          }
        }
        
        setStep('preview');
        toast.success(data.message);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to upload statement');
    } finally {
      setUploading(false);
    }
  };

  const handleCreateCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCardForm.bankName || !newCardForm.cardName || Number(newCardForm.creditLimit) <= 0) {
      toast.error("Please fill all fields correctly.");
      return;
    }
    setUploading(true);
    try {
      const newCard = await creditCardService.upsert({
        ...newCardForm,
        creditLimit: Number(newCardForm.creditLimit)
      });
      setCards([...cards, newCard]);
      setSelectedCardId(newCard.id!);
      setShowCreateCard(false);
      toast.success('Credit card created!');
    } catch (err: any) {
      toast.error('Failed to create credit card');
    } finally {
      setUploading(false);
    }
  };

  const handleConfirm = async (conflictResolution?: 'replace' | 'append') => {
    if (statementType === 'credit_card' && !selectedCardId && !showCreateCard) {
      toast.error("Please select a credit card");
      return;
    }
    
    setUploading(true);
    try {
      const payload: any = {
        transactions,
        statement_type: statementType,
        cc_details: ccDetails,
        filename: file?.name
      };
      if (statementType === 'credit_card') {
        payload.credit_card_id = selectedCardId;
      }
      if (conflictResolution) {
        payload.conflict_resolution = conflictResolution;
      }
      
      const data = await statementService.confirm(payload);
      setSummary(data.summary);
      setStep('success');
      setConflictOpen(false);
      toast.success(data.message);
    } catch (err: any) {
      if (err.response?.status === 409) {
        setConflictOpen(true);
      } else {
        toast.error(err.response?.data?.detail || 'Import failed');
      }
    } finally {
      setUploading(false);
    }
  };

  const updateTxn = (idx: number, field: keyof ExtractedTxn, val: string) => {
    const next = [...transactions];
    (next[idx] as any)[field] = val;
    setTransactions(next);
  };

  const deleteTxn = (idx: number) => {
    setTransactions(transactions.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-extrabold text-foreground">Statement Import</h1>
        <p className="text-secondary">Upload your bank statement and let AI categorize your expenses automatically.</p>
      </div>

      {step === 'upload' && (
        <div 
          className="border-2 border-dashed border-default rounded-card bg-surface p-12 text-center transition-colors hover:bg-hover hover:border-blue flex flex-col items-center justify-center cursor-pointer"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => document.getElementById('file-upload')?.click()}
        >
          <input 
            id="file-upload" 
            type="file" 
            accept="application/pdf" 
            className="hidden" 
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) setFile(f);
            }} 
          />
          <UploadCloud className="h-16 w-16 text-tertiary mb-4" />
          <h3 className="text-lg font-bold mb-2">{file ? file.name : "Drag & drop PDF statement here"}</h3>
          <p className="text-sm text-secondary mb-6">Supports Paytm, PhonePe, and major bank statements</p>
          
          <Button 
            variant="primary" 
            disabled={!file || uploading} 
            onClick={(e) => { e.stopPropagation(); handleUpload(); }}
          >
            {uploading ? 'Processing AI...' : 'Extract & Categorize'}
          </Button>
        </div>
      )}

      {step === 'preview' && (
        <div className="space-y-6">
          {/* Card Selection or Creation Logic */}
          {statementType === 'credit_card' && (
            <div className="bg-surface rounded-card p-6 border border-subtle mb-6 animate-in fade-in slide-in-from-top-4">
              {showCreateCard ? (
                <div>
                  <h2 className="font-bold text-lg mb-2 text-rose">No Credit Card Configured</h2>
                  <p className="text-sm text-secondary mb-4">Before importing this statement, please configure your credit card.</p>
                  <form onSubmit={handleCreateCard} className="grid gap-4 md:grid-cols-3">
                    <Input label="Bank Name" required value={newCardForm.bankName} onChange={e => setNewCardForm({...newCardForm, bankName: e.target.value})} />
                    <Input label="Card Name" required value={newCardForm.cardName} onChange={e => setNewCardForm({...newCardForm, cardName: e.target.value})} />
                    <Input label="Credit Limit (₹)" type="number" required value={newCardForm.creditLimit} onChange={e => setNewCardForm({...newCardForm, creditLimit: e.target.value})} />
                    <div className="col-span-full mt-2">
                      <Button type="submit" variant="primary" disabled={uploading}>Create Credit Card</Button>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="flex flex-col gap-2 max-w-md">
                  <label className="text-sm font-bold">Select the card this statement belongs to</label>
                  <select 
                    className="h-11 rounded border border-default bg-card px-3 text-sm text-primary transition focus:border-blue focus:outline-none"
                    value={selectedCardId}
                    onChange={(e) => setSelectedCardId(e.target.value)}
                  >
                    <option value="" disabled>Select a card</option>
                    {cards.map(c => (
                      <option key={c.id} value={c.id}>{c.bankName} - {c.cardName}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* Summary Section */}
          <div className="bg-surface rounded-card p-6 border border-subtle">
            <h2 className="font-bold text-lg mb-4">Statement Overview</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-tertiary">Type</p>
                <p className="font-semibold text-sm capitalize">{statementType.replace('_', ' ')}</p>
              </div>
              {statementType === 'credit_card' && ccDetails && (
                <>
                  {ccDetails.statement_period && (
                    <div className="col-span-2">
                      <p className="text-xs text-tertiary">Statement Period</p>
                      <p className="font-semibold text-sm">{ccDetails.statement_period}</p>
                    </div>
                  )}
                  {ccDetails.due_date && (
                    <div>
                      <p className="text-xs text-tertiary">Payment Due Date</p>
                      <p className="font-semibold text-sm">{ccDetails.due_date}</p>
                    </div>
                  )}
                  {ccDetails.credit_limit && (
                    <div>
                      <p className="text-xs text-tertiary">Extracted Limit</p>
                      <p className="font-semibold text-sm">{formatCurrency(ccDetails.credit_limit)}</p>
                    </div>
                  )}
                  {ccDetails.outstanding && (
                    <div>
                      <p className="text-xs text-tertiary">Outstanding Amount</p>
                      <p className="font-semibold text-sm">{formatCurrency(ccDetails.outstanding)}</p>
                    </div>
                  )}
                </>
              )}
              {importSummary && (
                <>
                  <div>
                    <p className="text-xs text-tertiary">Found</p>
                    <p className="font-semibold text-sm">{importSummary.transactions_found}</p>
                  </div>
                  <div>
                    <p className="text-xs text-emerald">New</p>
                    <p className="font-semibold text-sm text-emerald">{importSummary.new}</p>
                  </div>
                  <div>
                    <p className="text-xs text-rose">Duplicates (Skipped)</p>
                    <p className="font-semibold text-sm text-rose">{importSummary.duplicate}</p>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="flex justify-between items-center">
            <div>
              <h2 className="font-bold">Preview Transactions ({transactions.length})</h2>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => { setStep('upload'); setFile(null); }}>Cancel</Button>
              <Button variant="primary" onClick={() => handleConfirm()} disabled={uploading || showCreateCard || (statementType === 'credit_card' && !selectedCardId)}>
                {uploading ? 'Importing...' : 'Confirm & Import'}
              </Button>
            </div>
          </div>
          
          <div className="bg-card rounded-card border border-subtle overflow-hidden overflow-x-auto">
            <table className="w-full text-left text-sm min-w-[800px]">
              <thead className="bg-surface border-b border-subtle">
                <tr>
                  <th className="px-4 py-3 font-semibold w-[120px]">Date</th>
                  <th className="px-4 py-3 font-semibold">Merchant / Description</th>
                  <th className="px-4 py-3 font-semibold">Payment Source</th>
                  <th className="px-4 py-3 font-semibold">Category (AI)</th>
                  <th className="px-4 py-3 font-semibold text-right">Amount</th>
                  <th className="px-4 py-3 font-semibold text-center">Status</th>
                  <th className="px-4 py-3 font-semibold"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-subtle">
                {transactions.map((t, i) => (
                  <tr key={i} className={`transition-colors ${t.status === 'Duplicate' ? 'opacity-50 bg-surface' : 'hover:bg-hover'}`}>
                    <td className="px-4 py-3">
                      <Input type="date" value={t.date} onChange={(e) => updateTxn(i, 'date', e.target.value)} />
                    </td>
                    <td className="px-4 py-3">
                      <Input value={t.merchant} onChange={(e) => updateTxn(i, 'merchant', e.target.value)} />
                      <p className="text-xs text-tertiary mt-1 truncate max-w-[200px]" title={t.description}>{t.description}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
                        statementType === 'credit_card' ? 'bg-blue/10 text-blue border border-blue/20' : 'bg-emerald/10 text-emerald border border-emerald/20'
                      }`}>
                        {statementType === 'credit_card' ? `💳 ${ccDetails?.card_name || 'Credit Card'}` : 'Bank'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <select 
                        className="w-full rounded-md border border-subtle bg-card px-3 py-2 text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors hover:bg-surface cursor-pointer"
                        value={t.category} 
                        onChange={(e) => updateTxn(i, 'category', e.target.value)}
                      >
                        <option value="Food" className="bg-card text-foreground">Food</option>
                        <option value="Travel" className="bg-card text-foreground">Travel</option>
                        <option value="Shopping" className="bg-card text-foreground">Shopping</option>
                        <option value="Bills" className="bg-card text-foreground">Bills</option>
                        <option value="Education" className="bg-card text-foreground">Education</option>
                        <option value="Entertainment" className="bg-card text-foreground">Entertainment</option>
                        <option value="Healthcare" className="bg-card text-foreground">Healthcare</option>
                        <option value="Investment" className="bg-card text-foreground">Investment</option>
                        <option value="Other" className="bg-card text-foreground">Other</option>
                      </select>
                    </td>
                    <td className={`px-4 py-3 font-bold text-right ${t.is_credit ? 'text-emerald' : 'text-rose'}`}>
                      {t.is_credit ? '+' : '-'}{formatCurrency(t.amount)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold ${
                        t.status === 'New' ? 'bg-emerald/10 text-emerald' : 
                        t.status === 'Duplicate' ? 'bg-rose/10 text-rose' : 'bg-surface text-tertiary'
                      }`}>
                        {t.status || 'Unknown'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="ghost" size="sm" icon={<Trash2 className="h-4 w-4 text-tertiary hover:text-rose" />} onClick={() => deleteTxn(i)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {step === 'success' && (
        <div className="bg-card border border-subtle rounded-card p-12 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald/10 mb-6">
            <CheckCircle className="h-8 w-8 text-emerald" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Import Successful!</h2>
          <p className="text-secondary mb-6">{summary}</p>
          <div className="flex justify-center gap-4">
            <Button variant="secondary" icon={<FileText className="h-4 w-4" />} onClick={() => { setStep('upload'); setFile(null); }}>Import Another</Button>
            <Button variant="primary" icon={<FileOutput className="h-4 w-4" />} onClick={() => window.location.href = '/'}>Go to Dashboard</Button>
          </div>
        </div>
      )}

      <Modal open={conflictOpen} title="Duplicate Statement Detected" onClose={() => setConflictOpen(false)}>
        <div className="space-y-4 text-primary">
          <p className="text-sm text-secondary">
            This statement period has already been imported for this card.
          </p>
          <div className="flex flex-col gap-3 mt-6">
            <Button variant="danger" onClick={() => handleConfirm('replace')}>
              Replace Existing Import
            </Button>
            <Button variant="secondary" onClick={() => handleConfirm('append')}>
              Import Anyway (Append)
            </Button>
            <Button variant="ghost" onClick={() => setConflictOpen(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
