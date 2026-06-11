import { ReactNode } from 'react';
import { Wallet } from 'lucide-react';

export const AuthLayout = ({ children }: { children: ReactNode }) => (
  <div className="grid min-h-screen bg-void lg:grid-cols-2">
    <section className="mesh-bg relative hidden overflow-hidden lg:block">
      <div className="absolute inset-10 rounded-modal border border-white/10 bg-white/[0.02] p-8 backdrop-blur-sm">
        <div className="flex items-center gap-3"><div className="grid h-11 w-11 place-items-center rounded bg-[image:var(--gradient-ai)]"><Wallet /></div><span className="font-display text-2xl font-extrabold">FINTELL</span></div>
        <div className="absolute bottom-10 left-8 right-8">
          <p className="font-display text-5xl font-extrabold leading-tight">Financial clarity with AI calm.</p>
          <p className="mt-4 max-w-md text-secondary">Track, plan, and decide with a dashboard built for modern Indian money flows.</p>
        </div>
      </div>
    </section>
    <section className="grid place-items-center p-4">
      <div className="glass w-full max-w-md rounded-modal p-6">{children}</div>
    </section>
  </div>
);
