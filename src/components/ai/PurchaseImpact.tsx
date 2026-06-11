import { AlertCircle } from 'lucide-react';
import { Badge } from '../ui/Badge';

export const PurchaseImpact = () => (
  <div className="rounded-card border border-amber/20 bg-amber/10 p-4">
    <div className="flex items-center gap-2 font-bold text-amber"><AlertCircle className="h-4 w-4" />Purchase Impact</div>
    <p className="mt-2 text-sm text-secondary">This ₹5,000 purchase delays your MacBook goal by 18 days.</p>
    <Badge tone="amber">Caution advised</Badge>
  </div>
);
