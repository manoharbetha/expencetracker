import { InputHTMLAttributes, ReactNode } from 'react';
import clsx from 'clsx';

type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'prefix'> & {
  label?: string;
  error?: string;
  prefix?: ReactNode;
  suffix?: ReactNode;
};

export const Input = ({ label, error, prefix, suffix, className, id, ...props }: InputProps) => {
  const inputId = id || `input-${label?.replace(/\s+/g, '-').toLowerCase() || Math.random().toString(36).substring(7)}`;
  return (
    <div className="block space-y-2">
      {label && <label htmlFor={inputId} className="text-sm font-medium text-secondary">{label}</label>}
      <span className={clsx('flex h-11 items-center gap-2 rounded border bg-card px-3 transition', error ? 'border-rose' : 'border-default focus-within:border-focus')}>
        {prefix && <span className="text-secondary">{prefix}</span>}
        <input id={inputId} className={clsx('w-full bg-transparent text-sm text-primary outline-none placeholder:text-tertiary', className)} {...props} />
        {suffix && <span className="text-secondary">{suffix}</span>}
      </span>
      {error && <span className="text-xs text-rose">{error}</span>}
    </div>
  );
};
