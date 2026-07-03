export interface CreditCard {
  id?: string;
  cardName: string;
  bankName: string;
  creditLimit: number;
  currentUsage: number;
  availableLimit: number;
  outstanding: number;
  minimumDue: number;
  statementDate?: string;
  dueDate?: string;
  lastImported?: string;
  createdAt: string;
}

export interface CreditCardCreatePayload {
  cardName: string;
  bankName: string;
  creditLimit: number;
}
