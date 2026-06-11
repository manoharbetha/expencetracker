import { ReactNode } from 'react';
import { Wallet, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export const AuthLayout = ({ children }: { children: ReactNode }) => (
  <div className="relative min-h-screen bg-[#050816] flex flex-col items-center justify-center p-4 overflow-hidden">
    
    {/* Animated background elements */}
    <div className="absolute top-0 w-full h-full overflow-hidden pointer-events-none">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/20 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-violet-500/20 blur-[120px] rounded-full" />
    </div>

    {/* Back to Home Navigation */}
    <Link 
      to="/" 
      className="absolute top-8 left-8 flex items-center gap-2 text-secondary hover:text-white transition-colors group z-10"
    >
      <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
      <span className="text-sm font-semibold">Back to Home</span>
    </Link>

    <motion.div 
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="relative w-full max-w-md z-10"
    >
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
    </motion.div>
  </div>
);
