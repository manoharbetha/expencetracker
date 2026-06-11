import { useRef } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { Bot, LineChart, PiggyBank, Target, ArrowDownRight, Wallet } from 'lucide-react';

export const Hero3D = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  // Expand layers on scroll
  const expandZ = useTransform(scrollYProgress, [0, 1], [0, 600]);
  const smoothExpand = useSpring(expandZ, { stiffness: 100, damping: 20 });

  // Rotate on mouse move
  const rotateX = useSpring(0, { stiffness: 100, damping: 30 });
  const rotateY = useSpring(0, { stiffness: 100, damping: 30 });

  const handleMouseMove = (e: React.MouseEvent) => {
    const { clientX, clientY } = e;
    const { innerWidth, innerHeight } = window;
    
    const x = (clientX / innerWidth - 0.5) * 20; // max rotation 20deg
    const y = (clientY / innerHeight - 0.5) * -20;
    
    rotateY.set(x);
    rotateX.set(y);
  };

  const handleMouseLeave = () => {
    rotateX.set(0);
    rotateY.set(0);
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-[150vh] flex items-start justify-center pt-32 perspective-1000"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <motion.div 
        className="sticky top-1/4 w-full max-w-5xl aspect-video preserve-3d"
        style={{ rotateX, rotateY }}
      >
        {/* Layer 1: Base Glass Panel */}
        <motion.div 
          className="absolute inset-0 rounded-2xl glass-premium border border-white/10 overflow-hidden"
          style={{ translateZ: useTransform(smoothExpand, z => -z * 0.2) }}
        >
          <div className="absolute inset-0 bg-grid-white opacity-20" />
          <div className="p-8">
            <div className="w-1/3 h-8 bg-white/5 rounded-md mb-8" />
            <div className="w-full h-full flex gap-6">
              <div className="w-2/3 h-64 bg-white/5 rounded-xl border border-white/5" />
              <div className="w-1/3 h-64 bg-white/5 rounded-xl border border-white/5" />
            </div>
          </div>
        </motion.div>

        {/* Layer 2: Balance Card */}
        <motion.div 
          className="absolute top-12 left-12 w-72 rounded-xl glass-premium p-6 shadow-glow-cyan"
          style={{ translateZ: smoothExpand }}
        >
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-cyan-500/20 rounded-lg"><Wallet className="text-cyan-400" /></div>
            <span className="text-xs font-bold text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded">+12.5%</span>
          </div>
          <p className="text-sm text-secondary">Total Balance</p>
          <p className="text-3xl font-bold font-display mt-1">₹ 2,45,890</p>
        </motion.div>

        {/* Layer 3: Expense Chart */}
        <motion.div 
          className="absolute bottom-12 left-12 w-[32rem] h-48 rounded-xl glass-premium p-6 shadow-glow-primary overflow-hidden"
          style={{ translateZ: useTransform(smoothExpand, z => z * 1.5) }}
        >
          <div className="flex items-center gap-2 mb-4">
            <LineChart className="text-indigo-400 h-5 w-5" />
            <h3 className="font-bold">Spending Velocity</h3>
          </div>
          {/* Animated SVG Path for chart */}
          <svg className="w-full h-full absolute bottom-0 left-0" viewBox="0 0 100 40" preserveAspectRatio="none">
            <motion.path 
              d="M0,40 C20,35 30,10 50,20 C70,30 80,5 100,10 L100,40 L0,40 Z" 
              fill="url(#gradient)" 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 0.2, y: 0 }}
            />
            <motion.path 
              d="M0,40 C20,35 30,10 50,20 C70,30 80,5 100,10" 
              fill="none" 
              stroke="#4F46E5" 
              strokeWidth="2"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 2, ease: "easeInOut" }}
            />
            <defs>
              <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4F46E5" stopOpacity="1" />
                <stop offset="100%" stopColor="#4F46E5" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>
        </motion.div>

        {/* Layer 4: AI Insights */}
        <motion.div 
          className="absolute top-24 right-12 w-80 rounded-xl glass-premium p-6 border-violet-500/30 shadow-[0_0_30px_-5px_rgba(139,92,246,0.3)]"
          style={{ translateZ: useTransform(smoothExpand, z => z * 2) }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Bot className="text-violet-400 h-5 w-5" />
            <h3 className="font-bold text-violet-100">AI Intelligence</h3>
          </div>
          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-surface/50 border border-white/5">
              <p className="text-sm">You're spending 15% less on dining this month. Great job!</p>
            </div>
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20">
              <p className="text-sm text-rose-200">Upcoming EMI of ₹12,500 in 3 days.</p>
            </div>
          </div>
        </motion.div>

        {/* Layer 5: Goals */}
        <motion.div 
          className="absolute bottom-24 right-20 w-64 rounded-xl glass-premium p-5"
          style={{ translateZ: useTransform(smoothExpand, z => z * 0.8) }}
        >
          <div className="flex justify-between items-center mb-3">
            <Target className="text-emerald-400 h-4 w-4" />
            <span className="text-xs text-secondary">Vacation Fund</span>
          </div>
          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-emerald-400" 
              initial={{ width: 0 }}
              animate={{ width: "65%" }}
              transition={{ delay: 0.5, duration: 1.5 }}
            />
          </div>
          <p className="text-right text-xs mt-2 text-secondary">65% Reached</p>
        </motion.div>
      </motion.div>
    </div>
  );
};
