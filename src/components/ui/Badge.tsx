import clsx from 'clsx';
import { ReactNode } from 'react';

const tones = {
  blue: 'border-blue/30 bg-blue/10 text-blue',
  emerald: 'border-emerald/30 bg-emerald/10 text-emerald',
  rose: 'border-rose/30 bg-rose/10 text-rose',
  amber: 'border-amber/30 bg-amber/10 text-amber',
  violet: 'border-violet/30 bg-violet/10 text-violet',
  slate: 'border-default bg-elevated text-secondary',
  pink: 'border-pink-400/30 bg-pink-400/10 text-pink-300',
};

export const Badge = ({ children, tone = 'slate' }: { children: ReactNode; tone?: keyof typeof tones }) => (
  <span className={clsx('inline-flex items-center rounded-pill border px-2.5 py-1 text-xs font-semibold', tones[tone])}>{children}</span>
);
