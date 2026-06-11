import { ReactNode } from 'react';

export const Tooltip = ({ label, children }: { label: string; children: ReactNode }) => (
  <span className="group relative inline-flex">
    {children}
    <span className="pointer-events-none absolute -top-9 left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded bg-elevated px-2 py-1 text-xs text-secondary opacity-0 shadow-glass transition group-hover:opacity-100">
      {label}
    </span>
  </span>
);
