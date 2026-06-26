import { useState } from 'react';
import { UploadCloud, FileText, CheckCircle, Trash2, FileOutput } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { statementService } from '../services/statementService';
import { formatCurrency, formatDate } from '../utils/formatters';

interface ExtractedTxn {
  date: string;
  merchant: string;
  amount: number;
  description: string;
  category: string;
}

export const StatementImport = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [transactions, setTransactions] = useState<ExtractedTxn[]>([]);
  const [step, setStep] = useState<'upload' | 'preview' | 'success'>('upload');
  const [summary, setSummary] = useState('');
  const [progress, setProgress] = useState(0);

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
        console.error("Statement Import Failed:", data.debug);
        toast.error(data.message + " (Check console for detailed debug report)");
        setFile(null);
      } else {
        setTransactions(data.items);
        setStep('preview');
        toast.success(data.message);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to upload statement');
    } finally {
      setUploading(false);
    }
  };

  const handleConfirm = async () => {
    setUploading(true);
    try {
      const data = await statementService.confirm(transactions);
      setSummary(data.summary);
      setStep('success');
      toast.success(data.message);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Import failed');
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
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="font-bold">Preview Transactions ({transactions.length})</h2>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => { setStep('upload'); setFile(null); }}>Cancel</Button>
              <Button variant="primary" onClick={handleConfirm} disabled={uploading}>
                {uploading ? 'Importing...' : 'Confirm & Import'}
              </Button>
            </div>
          </div>
          
          <div className="bg-card rounded-card border border-subtle overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface border-b border-subtle">
                <tr>
                  <th className="px-4 py-3 font-semibold">Date</th>
                  <th className="px-4 py-3 font-semibold">Merchant / Description</th>
                  <th className="px-4 py-3 font-semibold">Category (AI)</th>
                  <th className="px-4 py-3 font-semibold">Amount</th>
                  <th className="px-4 py-3 font-semibold"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-subtle">
                {transactions.map((t, i) => (
                  <tr key={i} className="hover:bg-hover transition-colors">
                    <td className="px-4 py-3">
                      <Input type="date" value={t.date} onChange={(e) => updateTxn(i, 'date', e.target.value)} />
                    </td>
                    <td className="px-4 py-3">
                      <Input value={t.merchant} onChange={(e) => updateTxn(i, 'merchant', e.target.value)} />
                      <p className="text-xs text-tertiary mt-1 truncate max-w-[200px]">{t.description}</p>
                    </td>
                    <td className="px-4 py-3">
                      <select 
                        className="w-full rounded-md border border-default bg-surface px-3 py-2 text-sm text-foreground focus:border-blue focus:outline-none"
                        value={t.category} 
                        onChange={(e) => updateTxn(i, 'category', e.target.value)}
                      >
                        <option>Food</option>
                        <option>Travel</option>
                        <option>Shopping</option>
                        <option>Bills</option>
                        <option>Education</option>
                        <option>Entertainment</option>
                        <option>Healthcare</option>
                        <option>Investment</option>
                        <option>Other</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 font-bold text-rose">{formatCurrency(t.amount)}</td>
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
    </div>
  );
};
