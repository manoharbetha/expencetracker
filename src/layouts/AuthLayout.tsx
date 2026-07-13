import { ReactNode } from 'react';
import { Wallet } from 'lucide-react';

export const AuthLayout = ({ children }: { children: ReactNode }) => (
  <div className="relative min-h-screen bg-[#050816] flex flex-col items-center justify-center p-4 overflow-hidden">
    
    {/* Animated background elements */}
    <div className="absolute top-0 w-full h-full overflow-hidden pointer-events-none">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/20 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-violet-500/20 blur-[120px] rounded-full" />
    </div>


    <div className="relative w-full max-w-md z-10 animate-auth-fade">
      {/* 21st dev style border trail effect */}
      <div className="absolute -inset-[1px] bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500 rounded-modal opacity-30 blur-sm" />
      
      <div className="relative glass-premium rounded-modal p-8 shadow-2xl backdrop-blur-xl border border-white/10 bg-[#0F172A]/80">
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-[image:var(--gradient-ai)] shadow-glow-primary">
              <Wallet className="text-white h-6 w-6" />
            </div>
            <span className="font-display text-3xl font-extrabold text-white tracking-tight">Expence Tracker</span>
          </div>
        </div>
        
        {children}
      </div>
    </div>
  </div>
);
