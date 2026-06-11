import { format, parseISO } from 'date-fns';

export const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);

export const formatDate = (date: string, pattern = 'dd MMM yyyy') => format(parseISO(date), pattern);

export const formatPercent = (value: number) => `${Math.round(value)}%`;
