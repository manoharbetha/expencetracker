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
    <div
      className={`h-full rounded-full animate-progress transition-[width] duration-500 ease-out ${color ?? TONE_MAP[tone] ?? 'bg-blue'}`}
      style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
    />
  </div>
);
