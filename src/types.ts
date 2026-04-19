export type Currency = 'ETB';

export interface BudgetItem {
  id: string;
  name: string;
  planned: number;
  spent: number;
  type: 'expense' | 'income';
}

export interface BudgetCategory {
  id: string;
  name: string;
  items: BudgetItem[];
  type: 'expense' | 'income';
}

export interface Transaction {
  id: string;
  date: string;
  amount: number;
  description: string;
  budgetItemId: string;
  categoryName: string;
}

export interface MonthlyBudget {
  id: string;
  month: number; // 0-11
  year: number;
  categories: BudgetCategory[];
  transactions: Transaction[];
}

export interface AppState {
  budgets: MonthlyBudget[];
  currentBudgetId: string;
}
