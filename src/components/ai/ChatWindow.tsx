import { useState } from 'react';
import { Paperclip, Send, Sparkles } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { PurchaseImpact } from './PurchaseImpact';

const prompts = ['How much did I spend on food this month?', 'Can I afford a ₹5000 keyboard?', "What's my biggest expense category?", 'How can I reach my MacBook goal faster?', 'Summarize my financial health'];

export const ChatWindow = () => {
  const [message, setMessage] = useState('');
  return (
    <div className="flex h-[calc(100vh-104px)] min-h-[620px] flex-col rounded-card border border-white/5 bg-card">
      <div className="flex items-center justify-between border-b border-subtle p-4">
        <div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded bg-violet/15 text-violet"><Sparkles /></div><div><p className="font-bold">FINTELL AI</p><p className="text-xs text-secondary">Powered by Gemini</p></div></div>
      </div>
      <div className="flex-1 space-y-4 overflow-auto p-4">
        <div className="max-w-[80%] rounded-card bg-elevated p-4 text-sm text-secondary">Ask me anything about your spending, goals, debt, or upcoming cash flow.</div>
        <div className="ml-auto max-w-[80%] rounded-card bg-blue p-4 text-sm text-white">Can I afford a ₹5000 keyboard?</div>
        <div className="max-w-[84%] space-y-3 rounded-card bg-elevated p-4 text-sm text-secondary">
          <p>Yes, but it tightens your next EMI window. I would wait until after June 15 or move ₹1,000 from entertainment.</p>
          <PurchaseImpact />
          <div className="flex gap-1"><span className="h-2 w-2 animate-bounceDots rounded-full bg-violet" /><span className="h-2 w-2 animate-bounceDots rounded-full bg-violet [animation-delay:.15s]" /><span className="h-2 w-2 animate-bounceDots rounded-full bg-violet [animation-delay:.3s]" /></div>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {prompts.map((prompt) => <button key={prompt} className="rounded border border-default bg-elevated p-3 text-left text-sm text-secondary transition hover:bg-hover hover:text-primary" onClick={() => setMessage(prompt)}>{prompt}</button>)}
        </div>
      </div>
      <div className="border-t border-subtle p-4">
        <div className="flex gap-2">
          <Button variant="secondary" icon={<Paperclip className="h-4 w-4" />} aria-label="Attach" />
          <Input value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Ask FINTELL AI..." />
          <Button icon={<Send className="h-4 w-4" />} aria-label="Send" />
        </div>
      </div>
    </div>
  );
};
