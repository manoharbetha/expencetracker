import { Sparkles } from 'lucide-react';

export const InsightBanner = ({ text }: { text: string }) => (
  <div className="glass flex items-center gap-3 rounded-card p-4">
    <div className="grid h-10 w-10 place-items-center rounded bg-violet/15 text-violet"><Sparkles className="h-5 w-5" /></div>
    <p className="text-sm text-secondary">{text}</p>
  </div>
);
