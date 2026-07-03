export interface Goal {
  id: string;
  goalName: string;
  targetAmount: number;
  savedAmount: number;
  deadline: string;
  progressPercentage: number;
  remainingAmount: number;
  monthlySavingsNeeded: number;
}

export interface GoalCreate {
  goalName: string;
  targetAmount: number;
  savedAmount?: number;
  deadline: string;
}
