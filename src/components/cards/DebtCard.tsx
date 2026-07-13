import { Debt } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { Badge } from '../ui/Badge';

export const DebtCard = ({ debt }: { debt: Debt }) => (
  <div className="glass rounded-card p-5">
    <div className="flex items-start justify-between gap-4">
      <div>
        <h3 className="text-lg font-bold">{debt.title}</h3>
      </div>
      <Badge tone={debt.type === 'borrowed' ? 'rose' : 'blue'}>
        {debt.type === 'borrowed' ? 'Borrowed' : 'Lent'}
      </Badge>
    </div>
    <div className="mt-5 grid grid-cols-2 gap-4 text-sm">
      <div><p className="text-secondary">Outstanding</p><p className="amount mt-1 font-bold">{formatCurrency(debt.amount)}</p></div>
      <div><p className="text-secondary">EMI</p><p className="amount mt-1 font-bold">{formatCurrency(debt.emi)}</p></div>
      <div><p className="text-secondary">Interest Rate</p><p className="mt-1 font-bold">{debt.interestRate}%</p></div>
      <div><p className="text-secondary">Due Date</p><p className="mt-1 font-bold">{formatDate(debt.dueDate, 'dd MMM')}</p></div>
    </div>
  </div>
);
