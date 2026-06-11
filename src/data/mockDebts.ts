import { Debt } from '../types';

export const mockDebts: Debt[] = [
  { id: 'd1', name: 'Education Loan', institution: 'HDFC Bank', type: 'Loan', principal: 480000, remaining: 318000, rate: 9.2, emi: 14200, nextDue: '2026-06-15' },
  { id: 'd2', name: 'Platinum Credit Card', institution: 'ICICI Bank', type: 'Credit Card', principal: 85000, remaining: 31500, rate: 36, emi: 9000, nextDue: '2026-06-12' },
  { id: 'd3', name: 'Personal Loan', institution: 'Axis Bank', type: 'Loan', principal: 220000, remaining: 148000, rate: 12.5, emi: 11800, nextDue: '2026-06-22' }
];
