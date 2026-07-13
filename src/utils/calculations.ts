import { Expense, Goal } from '../types';

export const totalExpenses = (expenses: Expense[]) => expenses.reduce((sum, item) => sum + item.amount, 0);
export const goalProgress = (goal: Goal) => Math.min(100, (goal.savedAmount / goal.targetAmount) * 100);

export const byCategory = (expenses: Expense[]) =>
  expenses.reduce<Record<string, number>>((acc, expense) => {
    acc[expense.category] = (acc[expense.category] ?? 0) + expense.amount;
    return acc;
  }, {});

export const savingsRate = (income: number, expenses: number) => ((income - expenses) / income) * 100;
