import { motion } from 'framer-motion';

const TONE_MAP: Record<string, string> = {
  blue: 'bg-blue',
  emerald: 'bg-emerald',
  rose: 'bg-rose',
  amber: 'bg-amber',
  violet: 'bg-violet',
};

export const ProgressBar = ({
  value,
  color,
  tone = 'blue',
}: {
  value: number;
  color?: string;
  tone?: string;
}) => (
  <div className="h-2 overflow-hidden rounded-full bg-hover">
    <motion.div
      className={`h-full rounded-full ${color ?? TONE_MAP[tone] ?? 'bg-blue'}`}
      initial={{ width: 0 }}
      animate={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
    />
  </div>
);
