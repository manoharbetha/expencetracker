import { ButtonHTMLAttributes, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import clsx from 'clsx';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: ReactNode;
};

export const Button = ({ variant = 'primary', size = 'md', loading, icon, className, children, disabled, ...props }: ButtonProps) => (
  <button
    className={clsx(
      'focus-ring inline-flex items-center justify-center gap-2 rounded px-4 font-semibold transition disabled:cursor-not-allowed disabled:opacity-60',
      size === 'sm' && 'h-9 text-sm',
      size === 'md' && 'h-10 text-sm',
      size === 'lg' && 'h-12 text-base',
      variant === 'primary' && 'bg-[image:var(--gradient-ai)] text-white shadow-glow hover:brightness-110',
      variant === 'secondary' && 'border border-default bg-elevated text-primary hover:bg-hover',
      variant === 'ghost' && 'text-secondary hover:bg-hover hover:text-primary',
      variant === 'danger' && 'bg-rose text-white hover:brightness-110',
      className
    )}
    disabled={disabled || loading}
    {...props}
  >
    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}
    {children}
  </button>
);
