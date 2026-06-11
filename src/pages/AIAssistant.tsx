import { useEffect, useRef, useState } from 'react';
import { Send, Bot, User, Sparkles, TrendingUp, ShoppingBag, AlertTriangle } from 'lucide-react';
import { aiService } from '../services/aiService';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';

interface Msg { role: 'user' | 'assistant'; text: string; }

const QuickAction = ({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) => (
  <button
    onClick={onClick}
    className="flex items-center gap-2 rounded-lg border border-subtle bg-elevated px-4 py-2.5 text-sm text-secondary transition hover:border-blue hover:text-primary"
  >
    {icon} {label}
  </button>
);

export const AIAssistant = () => {
  const [messages, setMessages] = useState<Msg[]>([
    { role: 'assistant', text: "Hi! I'm FINTELL AI, your personal financial assistant. Ask me anything about your spending, goals, or get personalized advice!" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const sendMsg = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: Msg = { role: 'user', text };
    setMessages((m) => [...m, userMsg]);
    setInput('');
    setLoading(true);
    try {
      const reply = await aiService.chat(text);
      setMessages((m) => [...m, { role: 'assistant', text: reply }]);
    } finally {
      setLoading(false);
    }
  };

  const runQuickAction = async (key: string, label: string, fn: () => Promise<string>) => {
    setActionLoading(key);
    setMessages((m) => [...m, { role: 'user', text: label }]);
    try {
      const reply = await fn();
      setMessages((m) => [...m, { role: 'assistant', text: reply }]);
    } finally {
      setActionLoading('');
    }
  };

  return (
    <div className="flex h-[calc(100vh-10rem)] flex-col gap-4">
      <div>
        <h1 className="font-display text-3xl font-extrabold flex items-center gap-2">
          <Sparkles className="h-7 w-7 text-violet" /> AI Assistant
        </h1>
        <p className="text-secondary">Powered by Gemini · Personalized to your financial data</p>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2">
        <QuickAction
          icon={<TrendingUp className="h-4 w-4 text-emerald" />}
          label="Budget Suggestions"
          onClick={() => runQuickAction('budget', 'Give me budget suggestions', aiService.budgetSuggestions)}
        />
        <QuickAction
          icon={<Sparkles className="h-4 w-4 text-violet" />}
          label="My Financial Story"
          onClick={() => runQuickAction('story', 'Tell me my financial story', aiService.storytelling)}
        />
        <QuickAction
          icon={<AlertTriangle className="h-4 w-4 text-amber" />}
          label="Debt Alerts"
          onClick={() => runQuickAction('debt', 'Show me debt alerts', aiService.debtAlert)}
        />
        <QuickAction
          icon={<ShoppingBag className="h-4 w-4 text-rose" />}
          label="Goal Conflicts"
          onClick={() => runQuickAction('goals', 'Check my goal conflicts', aiService.goalConflicts)}
        />
      </div>

      {/* Chat Area */}
      <div className="glass flex-1 overflow-y-auto rounded-card p-4 space-y-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {m.role === 'assistant' && (
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[image:var(--gradient-ai)]">
                <Bot className="h-4 w-4 text-white" />
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                m.role === 'user'
                  ? 'bg-blue/20 text-primary rounded-tr-sm'
                  : 'bg-elevated text-primary rounded-tl-sm'
              }`}
            >
              {m.text}
            </div>
            {m.role === 'user' && (
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-hover">
                <User className="h-4 w-4" />
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex gap-3">
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[image:var(--gradient-ai)]">
              <Bot className="h-4 w-4 text-white" />
            </div>
            <div className="flex items-center gap-1 rounded-2xl bg-elevated px-4 py-3">
              {[0, 1, 2].map((i) => (
                <span key={i} className="inline-block h-2 w-2 animate-bounce rounded-full bg-violet" style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form
        className="glass flex gap-2 rounded-card p-3"
        onSubmit={(e) => { e.preventDefault(); sendMsg(input); }}
      >
        <input
          className="flex-1 bg-transparent text-sm text-primary placeholder-tertiary outline-none"
          placeholder="Ask about your finances…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <Button type="submit" size="sm" icon={<Send className="h-4 w-4" />} disabled={loading || !input.trim()}>
          Send
        </Button>
      </form>
    </div>
  );
};
