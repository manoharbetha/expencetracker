import { CreditCard as CardIcon } from 'lucide-react';
import { Skeleton } from '../../components/ui/Skeleton';
import { Button } from '../../components/ui/Button';
import { formatCurrency } from '../../utils/formatters';
import type { DashboardData } from '../../types';

interface CreditCardWidgetProps {
  dash: DashboardData | null;
  loading: boolean;
}

export const CreditCardWidget = ({ dash, loading }: CreditCardWidgetProps) => {
  if (loading) {
    return <Skeleton className="h-64 rounded-card" />;
  }

  if (!dash?.creditCard) {
    return (
      <div className="glass rounded-card p-6 flex flex-col md:flex-row items-center justify-between gap-4 border border-white/5 bg-gradient-to-r from-blue-900/10 via-indigo-900/10 to-purple-900/10 hover:shadow-glow-primary transition duration-300">
        <div className="space-y-2 text-center md:text-left">
          <h2 className="text-xl font-bold flex items-center justify-center md:justify-start gap-2 text-primary">
            <CardIcon className="h-5 w-5 text-blue" /> Credit Card Overview
          </h2>
          <p className="text-sm text-secondary max-w-xl">
            Track utilization, calculate your Credit Health Score, monitor spending trends, and receive dynamic AI-powered insights. Fully secure & manual.
          </p>
        </div>
        <a href="/credit-card">
          <Button icon={<CardIcon className="h-4 w-4" />}>Configure Credit Card</Button>
        </a>
      </div>
    );
  }

  const { creditCard } = dash;

  return (
    <div className="glass rounded-card p-6 border border-white/5 bg-gradient-to-br from-card/80 to-void/40">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-subtle pb-4 mb-6">
        <div>
          <h2 className="text-xl font-extrabold flex items-center gap-2 text-primary">
            <CardIcon className="h-5 w-5 text-blue animate-pulse" /> {creditCard.cardName}
          </h2>
          <p className="text-xs text-secondary mt-0.5">
            Billing Cycle: Day {creditCard.billingDate} · Due: Day {creditCard.dueDate}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
            creditCard.daysUntilDue <= 3 && creditCard.currentUsage > 0
              ? 'bg-rose/10 text-rose border border-rose/20 animate-pulse'
              : 'bg-hover text-secondary border border-subtle'
          }`}>
            {creditCard.currentUsage === 0 
              ? 'No outstanding balance' 
              : creditCard.daysUntilDue === 0
                ? 'Payment is due TODAY'
                : `Payment due in ${creditCard.daysUntilDue} days`}
          </span>
          <a href="/credit-card">
            <Button size="sm" variant="ghost">Edit Details</Button>
          </a>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Progress / Usage Display */}
        <div className="space-y-4 flex flex-col justify-center">
          <div className="space-y-1">
            <p className="text-xs text-secondary font-semibold uppercase tracking-wider">Current Utilization</p>
            <div className="flex items-baseline gap-2">
              <span className={`text-3xl font-extrabold font-mono ${
                creditCard.utilizationPercentage >= 90 ? 'text-rose' :
                creditCard.utilizationPercentage >= 70 ? 'text-amber' :
                creditCard.utilizationPercentage >= 50 ? 'text-yellow' :
                'text-primary'
              }`}>
                {creditCard.utilizationPercentage}%
              </span>
              <span className="text-xs text-tertiary">utilized</span>
            </div>
          </div>

          <div className="space-y-1">
            <div className="h-3 w-full rounded-full bg-hover overflow-hidden p-[2px] border border-subtle">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  creditCard.utilizationPercentage >= 90 ? 'bg-gradient-to-r from-red-600 to-rose-500' :
                  creditCard.utilizationPercentage >= 70 ? 'bg-gradient-to-r from-orange-500 to-amber-500' :
                  creditCard.utilizationPercentage >= 50 ? 'bg-gradient-to-r from-yellow-500 to-amber-400' :
                  'bg-gradient-to-r from-emerald-500 to-blue-500'
                }`} 
                style={{ width: `${Math.min(100, creditCard.utilizationPercentage)}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-secondary font-mono">
              <span>{formatCurrency(creditCard.currentUsage)} used</span>
              <span>{formatCurrency(creditCard.creditLimit)} limit</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 border-t border-subtle pt-4">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Available Credit</p>
              <p className="text-lg font-bold font-mono text-emerald">{formatCurrency(creditCard.availableCredit)}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Month Spend</p>
              <p className="text-lg font-bold font-mono text-primary">{formatCurrency(creditCard.monthlySpending)}</p>
            </div>
          </div>
        </div>

        {/* Credit Health Score Circular Indicator */}
        <div className="flex flex-col items-center justify-center border-t border-subtle md:border-t-0 md:border-x border-subtle py-4 md:py-0 px-6">
          <p className="text-xs text-secondary font-semibold uppercase tracking-wider mb-3">Credit Health Score</p>
          
          <div className="relative h-28 w-28 flex items-center justify-center">
            <svg className="absolute inset-0 h-full w-full transform -rotate-90">
              <circle 
                cx="56" cy="56" r="48" 
                className="stroke-void fill-none" 
                strokeWidth="8" 
              />
              <circle 
                cx="56" cy="56" r="48" 
                className={`fill-none transition-all duration-1000 ${
                  creditCard.healthStatus === 'Excellent' ? 'stroke-emerald' :
                  creditCard.healthStatus === 'Good' ? 'stroke-blue' :
                  creditCard.healthStatus === 'Fair' ? 'stroke-yellow' :
                  creditCard.healthStatus === 'High Usage' ? 'stroke-orange' :
                  'stroke-rose'
                }`} 
                strokeWidth="8" 
                strokeDasharray={301.6} 
                strokeDashoffset={301.6 - (301.6 * creditCard.healthScore) / 100}
                strokeLinecap="round"
              />
            </svg>
            <div className="text-center z-10">
              <p className="text-2xl font-black font-display text-primary">{creditCard.healthScore}</p>
              <p className="text-[10px] text-tertiary font-bold font-mono">/ 100</p>
            </div>
          </div>

          <span className={`mt-3 px-3 py-0.5 rounded-full text-xs font-black uppercase tracking-widest ${
            creditCard.healthStatus === 'Excellent' ? 'bg-emerald/10 text-emerald border border-emerald/20' :
            creditCard.healthStatus === 'Good' ? 'bg-blue/10 text-blue border border-blue/20' :
            creditCard.healthStatus === 'Fair' ? 'bg-yellow/10 text-yellow border border-yellow/20' :
            creditCard.healthStatus === 'High Usage' ? 'bg-orange/10 text-orange border border-orange/20' :
            'bg-rose/10 text-rose border border-rose/20'
          }`}>
            {creditCard.healthStatus}
          </span>
        </div>

        {/* AI Insights List inside Widget */}
        <div className="flex flex-col space-y-2.5">
          <p className="text-xs text-secondary font-semibold uppercase tracking-wider">Automated Insights</p>
          <div className="space-y-2 overflow-y-auto max-h-[140px] pr-1">
            {creditCard.insights.map((ins: any, idx: number) => (
              <div 
                key={idx} 
                className={`flex items-start gap-2.5 p-2 rounded border text-xs leading-relaxed ${
                  ins.type === 'danger' ? 'bg-rose/5 border-rose/10 text-rose' :
                  ins.type === 'warning' ? 'bg-amber/5 border-amber/10 text-amber' :
                  ins.type === 'success' ? 'bg-emerald/5 border-emerald/10 text-emerald' :
                  'bg-blue/5 border-blue/10 text-blue'
                }`}
              >
                <span className="text-sm shrink-0">{ins.icon}</span>
                <span className="font-medium text-slate-200">{ins.message}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
