import { Debt } from '../../types';
import { debtProgress } from '../../utils/calculations';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { Badge } from '../ui/Badge';
import { ProgressBar } from '../ui/ProgressBar';

export const DebtCard = ({ debt }: { debt: Debt }) => (
  <div className="glass rounded-card p-5">
    <div className="flex items-start justify-between gap-4">
      <div>
        <h3 className="text-lg font-bold">{debt.name}</h3>
        <p className="text-sm text-secondary">{debt.institution}</p>
      </div>
      <Badge tone={debt.type === 'Credit Card' ? 'rose' : 'blue'}>{debt.type}</Badge>
    </div>
    <div className="mt-5 grid grid-cols-2 gap-4 text-sm">
      <div><p className="text-secondary">Remaining</p><p className="amount mt-1 font-bold">{formatCurrency(debt.remaining)}</p></div>
      <div><p className="text-secondary">EMI</p><p className="amount mt-1 font-bold">{formatCurrency(debt.emi)}</p></div>
      <div><p className="text-secondary">Rate</p><p className="mt-1 font-bold">{debt.rate}%</p></div>
      <div><p className="text-secondary">Next due</p><p className="mt-1 font-bold">{formatDate(debt.nextDue, 'dd MMM')}</p></div>
    </div>
    <div className="mt-5">
      <ProgressBar value={debtProgress(debt)} color="bg-emerald" />
    </div>
  </div>
);
