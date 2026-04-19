import { BudgetCategory } from './types';
import { v4 as uuidv4 } from 'uuid';

export const INITIAL_CATEGORIES: BudgetCategory[] = [
  {
    id: uuidv4(),
    name: 'Income',
    type: 'income',
    items: [
      { id: uuidv4(), name: 'Main Salary', planned: 0, spent: 0, type: 'income' },
      { id: uuidv4(), name: 'Side Hustle', planned: 0, spent: 0, type: 'income' },
    ],
  },
  {
    id: uuidv4(),
    name: 'Housing',
    type: 'expense',
    items: [
      { id: uuidv4(), name: 'Rent', planned: 0, spent: 0, type: 'expense' },
      { id: uuidv4(), name: 'Electricity & Water', planned: 0, spent: 0, type: 'expense' },
      { id: uuidv4(), name: 'Internet/Home Fiber', planned: 0, spent: 0, type: 'expense' },
    ],
  },
  {
    id: uuidv4(),
    name: 'Food',
    type: 'expense',
    items: [
      { id: uuidv4(), name: 'Groceries / Merkato', planned: 0, spent: 0, type: 'expense' },
      { id: uuidv4(), name: 'Dining Out', planned: 0, spent: 0, type: 'expense' },
    ],
  },
  {
    id: uuidv4(),
    name: 'Transportation',
    type: 'expense',
    items: [
      { id: uuidv4(), name: 'Ride/Taxi', planned: 0, spent: 0, type: 'expense' },
      { id: uuidv4(), name: 'Fuel', planned: 0, spent: 0, type: 'expense' },
    ],
  },
  {
    id: uuidv4(),
    name: 'Personal',
    type: 'expense',
    items: [
      { id: uuidv4(), name: 'Charity/Giving', planned: 0, spent: 0, type: 'expense' },
      { id: uuidv4(), name: 'Entertainment', planned: 0, spent: 0, type: 'expense' },
      { id: uuidv4(), name: 'Savings/Iqub', planned: 0, spent: 0, type: 'expense' },
    ],
  },
];
