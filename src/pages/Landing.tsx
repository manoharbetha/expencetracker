import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import Lenis from '@studio-freight/lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowRight, Bot, Target, Shield, Wallet, Zap, Brain, Sparkles, Receipt, CreditCard } from 'lucide-react';

import { Scene3D } from '../components/landing/Scene3D';
import { Hero3D } from '../components/landing/Hero3D';
import { MagneticButton } from '../components/landing/MagneticButton';
import { Button } from '../components/ui/Button';

gsap.registerPlugin(ScrollTrigger);

export const Landing = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize Lenis for buttery smooth scrolling
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    // GSAP Scroll Animations for Bento Grid
    const cards = gsap.utils.toArray('.bento-card');
    cards.forEach((card: any, i) => {
      gsap.fromTo(card, 
        { y: 100, opacity: 0, rotateX: -20 },
        {
          y: 0, 
          opacity: 1, 
          rotateX: 0,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: card,
            start: "top 85%",
          }
        }
      );
    });

    return () => {
      lenis.destroy();
      ScrollTrigger.getAll().forEach(t => t.kill());
    };
  }, []);

  return (
    <div ref={containerRef} className="bg-[#050816] text-white selection:bg-blue/30 overflow-hidden font-sans">
      
      {/* SECTION 1: HERO */}
      <section className="relative min-h-[150vh]">
        {/* 3D WebGL Aurora Background */}
        <Scene3D />
        
        {/* Navigation */}
        <nav className="absolute top-0 w-full z-50 flex items-center justify-between px-6 py-6 max-w-7xl mx-auto left-0 right-0 mix-blend-difference">
          <Link to="/" className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded bg-[image:var(--gradient-ai)]">
              <Wallet className="text-white" />
            </div>
            <span className="font-display text-xl font-extrabold text-white">Expence Tracker</span>
          </Link>
          <div className="flex gap-4 items-center">
            <Link to="/login" className="text-sm font-semibold text-secondary hover:text-white transition-colors">Sign In</Link>
            <Link to="/register">
              <button className="px-5 py-2 rounded-full border border-white/20 bg-white/5 backdrop-blur-md hover:bg-white/10 transition-colors text-sm font-bold">
                Start Free
              </button>
            </Link>
          </div>
        </nav>

        {/* Hero Content */}
        <div className="relative z-10 pt-32 px-6 text-center max-w-5xl mx-auto pointer-events-none">
          <motion.div 
            initial={{ opacity: 0, y: 30 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 1, ease: "easeOut" }}
          >
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-300 text-sm font-semibold mb-6">
              <Sparkles className="h-4 w-4" /> 
              Apple Vision Pro style OS
            </span>
            <h1 className="font-display text-6xl md:text-8xl font-extrabold leading-[1.1] tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60">
              Your Financial Future, <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-violet-400">Visualized.</span>
            </h1>
            <p className="mt-6 text-xl text-secondary max-w-2xl mx-auto leading-relaxed">
              Track spending. Understand habits. Predict outcomes. Grow wealth with AI.
            </p>
            
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4 pointer-events-auto">
              <MagneticButton to="/register">
                Start Exploring <ArrowRight className="h-4 w-4" />
              </MagneticButton>
              <Link to="/dashboard">
                <button className="px-8 py-4 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 transition-colors font-bold flex items-center gap-2">
                  Watch Live Demo
                </button>
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Floating Dashboard Layers */}
        <div className="pointer-events-auto relative z-20 -mt-32">
          <Hero3D />
        </div>
      </section>

      {/* SECTION 2: AI FINANCIAL INTELLIGENCE */}
      <section className="relative py-32 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-6xl font-display font-bold mb-6">Autonomous Intelligence</h2>
          <p className="text-xl text-secondary max-w-2xl mx-auto">Your personal AI coach works 24/7 to analyze, predict, and optimize your wealth.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon: Brain, title: "Pattern Recognition", desc: "AI automatically categorizes transactions and identifies hidden spending leaks before they become habits." },
            { icon: Zap, title: "Predictive Forecasting", desc: "See your end-of-month balance today. We simulate your upcoming bills and historical trends." },
            { icon: Shield, title: "Smart Alerts", desc: "Get instantly notified when you're about to break a budget or if an unusual charge appears." }
          ].map((item, i) => (
            <motion.div 
              key={i}
              className="bento-card glass-premium rounded-3xl p-8 hover:-translate-y-2 transition-transform duration-500"
            >
              <div className="h-12 w-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center mb-6 border border-indigo-500/30">
                <item.icon className="h-6 w-6 text-indigo-400" />
              </div>
              <h3 className="text-xl font-bold mb-3">{item.title}</h3>
              <p className="text-secondary leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* SECTION 3: EXPENSE TRACKING FEATURES (BENTO GRID) */}
      <section className="relative py-32 px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 auto-rows-[250px]">
          
          <div className="bento-card md:col-span-2 md:row-span-2 glass-premium rounded-3xl p-8 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <h3 className="text-3xl font-display font-bold mb-4 relative z-10">Real-time Sync</h3>
            <p className="text-secondary text-lg relative z-10 max-w-sm">Connect your accounts once. Watch your dashboard update instantly across all your devices.</p>
            <div className="absolute -bottom-10 -right-10 w-96 h-96 bg-blue-500/20 blur-3xl rounded-full" />
            <Receipt className="absolute bottom-8 right-8 h-32 w-32 text-blue-500/20 group-hover:scale-110 transition-transform duration-700" />
          </div>

          <div className="bento-card md:col-span-2 glass-premium rounded-3xl p-8 relative overflow-hidden">
            <h3 className="text-2xl font-bold mb-2">Automated Categorization</h3>
            <p className="text-secondary">Stop tagging receipts manually.</p>
          </div>

          <div className="bento-card glass-premium rounded-3xl p-8 relative overflow-hidden">
             <h3 className="text-xl font-bold mb-2">Multi-Currency</h3>
             <p className="text-sm text-secondary">Travel often? We handle conversions flawlessly.</p>
          </div>

          <div className="bento-card glass-premium rounded-3xl p-8 relative overflow-hidden group">
            <div className="absolute inset-0 bg-violet-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            <CreditCard className="h-10 w-10 text-violet-400 mb-4" />
            <h3 className="text-xl font-bold">Debt Strategies</h3>
          </div>

        </div>
      </section>

      {/* SECTION 4: PREDICTIONS */}
      <section className="relative py-32 border-y border-white/5 bg-white/[0.02]">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
          <div className="bento-card">
            <h2 className="text-4xl md:text-5xl font-display font-bold mb-6 leading-tight">Look forward, <br/>not just backward.</h2>
            <p className="text-xl text-secondary mb-8">Traditional apps tell you what you spent. We tell you what you *will* spend, so you can change the outcome today.</p>
            <ul className="space-y-4">
              {['Cashflow forecasting', 'EMI impact analysis', 'Dynamic goal adjusting'].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-white/80">
                  <div className="h-6 w-6 rounded-full bg-cyan-500/20 flex items-center justify-center">
                    <div className="h-2 w-2 rounded-full bg-cyan-400" />
                  </div>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          
          <div className="bento-card relative h-96 rounded-3xl glass-premium border border-cyan-500/20 overflow-hidden flex items-end shadow-glow-cyan">
             {/* Decorative Chart */}
             <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
               <path d="M0,100 L0,80 C20,70 40,90 60,60 C80,30 90,40 100,20 L100,100 Z" fill="rgba(6,182,212,0.1)" />
               <path d="M0,80 C20,70 40,90 60,60 C80,30 90,40 100,20" fill="none" stroke="#06B6D4" strokeWidth="2" strokeDasharray="4 4" />
             </svg>
             <div className="absolute top-1/4 right-1/4 bg-cyan-500 text-black font-bold text-sm px-3 py-1 rounded-full shadow-lg">
               Projected +₹45k
             </div>
          </div>
        </div>
      </section>



      {/* FOOTER */}
      <footer className="border-t border-white/10 px-6 py-12 text-center text-secondary text-sm">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Wallet className="h-5 w-5" /> <span className="font-bold text-white">Expence Tracker</span>
        </div>
        <p>© 2026 Obsidian Cosmos. All rights reserved.</p>
      </footer>

    </div>
  );
};
