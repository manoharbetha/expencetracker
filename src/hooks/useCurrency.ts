import { useLocalStorage } from './useLocalStorage';
import { formatCurrency } from '../utils/formatters';

export const useCurrency = () => {
  const [currency, setCurrency] = useLocalStorage('fintell-currency', 'INR');
  return { currency, setCurrency, format: formatCurrency };
};
