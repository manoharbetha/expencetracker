import { Goal } from '../types';

export const mockGoals: Goal[] = [
  { id: 'g1', goalName: 'MacBook Air', targetAmount: 100000, savedAmount: 62000, deadline: '2026-10-30', progressPercentage: 62, remainingAmount: 38000, monthlySavingsNeeded: 3800 },
  { id: 'g2', goalName: 'Emergency Fund', targetAmount: 300000, savedAmount: 255000, deadline: '2027-02-15', progressPercentage: 85, remainingAmount: 45000, monthlySavingsNeeded: 4500 },
  { id: 'g3', goalName: 'Goa Trip', targetAmount: 75000, savedAmount: 24000, deadline: '2026-09-12', progressPercentage: 32, remainingAmount: 51000, monthlySavingsNeeded: 5100 },
  { id: 'g4', goalName: 'New Phone', targetAmount: 85000, savedAmount: 17000, deadline: '2026-12-01', progressPercentage: 20, remainingAmount: 68000, monthlySavingsNeeded: 6800 },
  { id: 'g5', goalName: 'Skill Course', targetAmount: 45000, savedAmount: 31500, deadline: '2026-08-20', progressPercentage: 70, remainingAmount: 13500, monthlySavingsNeeded: 1350 }
];
