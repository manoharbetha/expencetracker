import { Expense, Goal, Debt } from '../types';

export const totalExpenses = (expenses: Expense[]) => expenses.reduce((sum, item) => sum + item.amount, 0);
export const goalProgress = (goal: Goal) => Math.min(100, (goal.saved / goal.target) * 100);
export const debtProgress = (debt: Debt) => Math.min(100, ((debt.principal - debt.remaining) / debt.principal) * 100);

export const byCategory = (expenses: Expense[]) =>
  expenses.reduce<Record<string, number>>((acc, expense) => {
    acc[expense.category] = (acc[expense.category] ?? 0) + expense.amount;
    return acc;
  }, {});

export const savingsRate = (income: number, expenses: number) => ((income - expenses) / income) * 100;
