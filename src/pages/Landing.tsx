import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, BarChart3, Bot, Brain, CheckCircle, CreditCard, Github, Goal, Linkedin, Receipt, Shield, Twitter, Wallet } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';

const features = [
  ['Smart Expense Tracking', Receipt], ['AI Budget Coach', Bot], ['Goal Visualization', Goal],
  ['Debt Intelligence', CreditCard], ['Predictive Reports', BarChart3], ['Financial Memory', Brain],
];

export const Landing = () => (
  <div className="bg-void text-primary">
    <section className="mesh-bg relative min-h-screen overflow-hidden px-4 py-6">
      <nav className="mx-auto flex max-w-7xl items-center justify-between">
        <Link to="/" className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded bg-[image:var(--gradient-ai)]"><Wallet /></div><span className="font-display text-xl font-extrabold">Expence Tracker</span></Link>
        <div className="flex gap-2"><Link to="/login"><Button variant="ghost">Sign In</Button></Link><Link to="/register"><Button>Start Free</Button></Link></div>
      </nav>
      <div className="mx-auto grid max-w-7xl items-center gap-12 py-16 lg:min-h-[calc(100vh-88px)] lg:grid-cols-[0.9fr_1.1fr]">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <Badge tone="violet">AI-powered Indian finance OS</Badge>
          <h1 className="mt-6 font-display text-5xl font-extrabold leading-tight md:text-7xl">Track Smarter. Save Better.</h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-secondary">AI-powered financial intelligence for the modern Indian.</p>
          <div className="mt-8 flex flex-wrap gap-3"><Link to="/register"><Button size="lg" icon={<ArrowRight className="h-4 w-4" />}>Start for Free</Button></Link><Link to="/dashboard"><Button size="lg" variant="secondary">View Demo</Button></Link></div>
        </motion.div>
        <motion.div className="glass rounded-modal p-4 shadow-glow" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="rounded-card border border-subtle bg-base p-4">
            <div className="grid gap-3 sm:grid-cols-4">
              {['Income ₹1,24,500', 'Expenses ₹78,340', 'Savings ₹46,160', 'Goals 4'].map((item) => <div key={item} className="rounded bg-elevated p-4 text-sm font-bold">{item}</div>)}
            </div>
            <div className="mt-4 grid gap-4 lg:grid-cols-[1.5fr_1fr]"><div className="h-64 rounded bg-[linear-gradient(180deg,rgba(59,130,246,.25),rgba(59,130,246,.02))]" /><div className="space-y-3">{['Reduce shopping by ₹1,000', 'Goa fund needs ₹3,800/month', 'EMI window looks healthy'].map((x) => <div key={x} className="rounded border border-violet/20 bg-violet/10 p-4 text-sm text-secondary">{x}</div>)}</div></div>
          </div>
        </motion.div>
      </div>
    </section>
    <section className="mx-auto max-w-7xl px-4 py-20">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{features.map(([name, Icon]) => <motion.div key={name as string} className="glass rounded-card p-6" whileHover={{ scale: 1.01 }}><Icon className="h-6 w-6 text-blue" /><h3 className="mt-5 text-lg font-bold">{name as string}</h3><p className="mt-2 text-sm leading-6 text-secondary">Premium analytics, clear actions, and calm money decisions in one workflow.</p></motion.div>)}</div>
    </section>
    <section className="border-y border-subtle bg-base px-4 py-20"><div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-2"><div className="glass rounded-card p-5"><p className="text-sm text-secondary">Expence Tracker AI</p><div className="mt-4 space-y-3"><p className="rounded bg-elevated p-4">Can I afford a ₹5,000 keyboard?</p><p className="rounded bg-blue p-4 text-white">Yes, after your June 15 EMI. Buying today delays MacBook by 18 days.</p></div></div><div className="grid gap-4">{['Budget Suggestion', 'Goal Conflict Warning', 'Debt Alert'].map((x) => <div key={x} className="glass rounded-card p-5"><CheckCircle className="text-emerald" /><h3 className="mt-3 font-bold">{x}</h3></div>)}</div></div></section>
    <section className="mx-auto max-w-7xl px-4 py-20"><div className="grid gap-4 md:grid-cols-3">{['Priya Nair', 'Rohan Shah', 'Ananya Iyer'].map((name) => <div key={name} className="glass rounded-card p-5"><p className="text-secondary">“Expence Tracker made my spending patterns visible without making finance feel heavy.”</p><p className="mt-4 font-bold">{name}</p></div>)}</div></section>
    <section className="mx-auto max-w-4xl px-4 pb-20">{['Is Expence Tracker free?', 'Does it support INR?', 'Can AI analyze goals?', 'Can I export reports?', 'Is data private?', 'Does it work on mobile?'].map((q) => <details key={q} className="border-b border-subtle py-5"><summary className="cursor-pointer font-bold">{q}</summary><p className="mt-3 text-secondary">Yes. The demo frontend includes the complete workflow and production-ready interface patterns.</p></details>)}</section>
    <footer className="border-t border-subtle px-4 py-10"><div className="mx-auto grid max-w-7xl gap-6 md:grid-cols-4"><div><p className="font-display text-xl font-extrabold">Expence Tracker</p><p className="mt-2 text-sm text-secondary">Obsidian Cosmos finance intelligence.</p></div>{['Product', 'Company', 'Resources'].map((x) => <div key={x}><p className="font-bold">{x}</p><p className="mt-3 text-sm text-secondary">Dashboard<br />Reports<br />AI Assistant</p></div>)}<div className="flex gap-3"><Twitter /><Linkedin /><Github /></div></div></footer>
  </div>
);
