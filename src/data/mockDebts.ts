import { Debt } from '../types';

export const mockDebts: Debt[] = [
  { id: 'd1', title: 'Education Loan', type: 'borrowed', amount: 318000, interestRate: 9.2, emi: 14200, dueDate: '2026-06-15' },
  { id: 'd2', title: 'Platinum Credit Card', type: 'borrowed', amount: 31500, interestRate: 36, emi: 9000, dueDate: '2026-06-12' },
  { id: 'd3', title: 'Personal Loan', type: 'borrowed', amount: 148000, interestRate: 12.5, emi: 11800, dueDate: '2026-06-22' }
];
