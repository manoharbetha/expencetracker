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
        setStatementType(data.statement_type || 'bank');
        setCcDetails(data.cc_details || {});
        setImportSummary(data.summary || null);
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
      const data = await statementService.confirm({
        transactions,
        statement_type: statementType,
        cc_details: ccDetails,
        filename: file?.name
      });
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
        <div className="space-y-6">
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
                  <div>
                    <p className="text-xs text-tertiary">Card Name</p>
                    <p className="font-semibold text-sm">{ccDetails.card_name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-tertiary">Bank</p>
                    <p className="font-semibold text-sm">{ccDetails.bank_name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-tertiary">Due Date</p>
                    <p className="font-semibold text-sm">Day {ccDetails.due_date || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-tertiary">Credit Limit</p>
                    <p className="font-semibold text-sm">{formatCurrency(ccDetails.credit_limit || 0)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-tertiary">Outstanding</p>
                    <p className="font-semibold text-sm">{formatCurrency(ccDetails.outstanding || 0)}</p>
                  </div>
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
              <Button variant="primary" onClick={handleConfirm} disabled={uploading}>
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
    </div>
  );
};
