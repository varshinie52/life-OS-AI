'use client';

import { useLocalStorage } from './useLocalStorage';
import { Expense, ExpenseCategory } from '@/lib/types';
import { generateId, getToday } from '@/lib/utils';
import { useMemo } from 'react';

const DEFAULT_EXPENSES: Expense[] = [
  {
    id: 'ex1',
    amount: 15.50,
    category: 'food',
    description: 'Lunch with team',
    date: getToday(),
    createdAt: new Date().toISOString()
  },
  {
    id: 'ex2',
    amount: 45.00,
    category: 'transport',
    description: 'Gas station',
    date: getToday(),
    createdAt: new Date().toISOString()
  }
];

export function useExpenses() {
  const [expenses, setExpenses] = useLocalStorage<Expense[]>('lifeos_expenses', DEFAULT_EXPENSES);

  const addExpense = (amount: number, category: ExpenseCategory, description: string, date: string) => {
    const newExpense: Expense = {
      id: generateId(),
      amount,
      category,
      description,
      date,
      createdAt: new Date().toISOString()
    };
    setExpenses((prev) => [newExpense, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  };

  const deleteExpense = (id: string) => {
    setExpenses((prev) => prev.filter(e => e.id !== id));
  };

  const getExpensesByMonth = (year: number, month: number) => {
    const targetMonth = `${year}-${String(month + 1).padStart(2, '0')}`;
    return expenses.filter(e => e.date.startsWith(targetMonth));
  };

  const getCategoryBreakdown = (year: number, month: number) => {
    const monthExpenses = getExpensesByMonth(year, month);
    const breakdown: Record<string, number> = {};
    let total = 0;
    
    monthExpenses.forEach(e => {
      breakdown[e.category] = (breakdown[e.category] || 0) + e.amount;
      total += e.amount;
    });
    
    return { breakdown, total };
  };

  return {
    expenses,
    addExpense,
    deleteExpense,
    getExpensesByMonth,
    getCategoryBreakdown
  };
}
