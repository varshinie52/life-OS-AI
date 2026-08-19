"use client";

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, DollarSign, PieChart, Trash2, ChevronLeft, ChevronRight, TrendingUp } from 'lucide-react';
import styles from './page.module.css';
import { useExpenses } from '@/hooks/useExpenses';
import { ExpenseCategory } from '@/lib/types';
import { formatCurrency, getToday, MONTH_NAMES } from '@/lib/utils';
import Modal from '@/components/ui/Modal';
import { useAppContext } from '@/context/AppContext';

const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  food: '#6B7F4E',
  transport: '#4C6A73',
  entertainment: '#DCC8A3',
  shopping: '#A2B5A0',
  bills: '#5A443A',
  health: '#1F3D2E',
  education: '#6B7F4E',
  other: '#4C6A73'
};

export default function ExpensesPage() {
  const { isMounted, settings } = useAppContext();
  const { expenses, addExpense, deleteExpense, getCategoryBreakdown, getExpensesByMonth } = useExpenses();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('food');
  const [date, setDate] = useState(getToday());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount && !isNaN(Number(amount))) {
      addExpense(Number(amount), category, description, date);
      setAmount('');
      setDescription('');
      setIsAddModalOpen(false);
    }
  };

  const { breakdown, total } = useMemo(() => getCategoryBreakdown(year, month), [year, month, expenses]);
  const monthExpenses = useMemo(() => getExpensesByMonth(year, month), [year, month, expenses]);

  if (!isMounted) return null;

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Expense Tracker</h1>
          <p className={styles.subtitle}>Manage your finances and track spending.</p>
        </div>
        
        <button className="btn-primary" onClick={() => setIsAddModalOpen(true)}>
          <Plus size={18} /> Add Expense
        </button>
      </header>

      <div className={styles.layout}>
        {/* Main Content: Expense List */}
        <div className={styles.mainContent}>
          <div className="glass-panel" style={{ padding: '24px' }}>
            <div className={styles.monthHeader}>
              <h2 className={styles.monthTitle}>{MONTH_NAMES[month]} {year}</h2>
              <div className={styles.monthControls}>
                <button className={styles.iconBtn} onClick={handlePrevMonth}><ChevronLeft size={20} /></button>
                <button className={styles.iconBtn} onClick={handleNextMonth}><ChevronRight size={20} /></button>
              </div>
            </div>

            <div className={styles.expenseList}>
              <AnimatePresence>
                {monthExpenses.map(expense => (
                  <motion.div 
                    key={expense.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={styles.expenseCard}
                  >
                    <div className={styles.expenseIconWrapper} style={{ backgroundColor: `${CATEGORY_COLORS[expense.category]}20`, color: CATEGORY_COLORS[expense.category] }}>
                      <DollarSign size={20} />
                    </div>
                    
                    <div className={styles.expenseDetails}>
                      <h4 className={styles.expenseDesc}>{expense.description || 'No description'}</h4>
                      <div className={styles.expenseMeta}>
                        <span className={styles.expenseCategory}>{expense.category}</span>
                        <span className={styles.expenseDate}>{expense.date}</span>
                      </div>
                    </div>
                    
                    <div className={styles.expenseAmountWrapper}>
                      <span className={styles.expenseAmount}>{formatCurrency(expense.amount, settings.currency)}</span>
                      <button className={styles.deleteBtn} onClick={() => deleteExpense(expense.id)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {monthExpenses.length === 0 && (
                <div className={styles.emptyState}>
                  <DollarSign size={48} className={styles.emptyIcon} />
                  <p>No expenses recorded this month.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar: Summary & Chart */}
        <aside className={styles.sidebar}>
          <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
            <h3 className={styles.sidebarTitle}><TrendingUp size={20} className="text-accent" /> Total Spent</h3>
            <div className={styles.totalAmount}>
              {formatCurrency(total, settings.currency)}
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 className={styles.sidebarTitle}><PieChart size={20} className="text-accent" /> Breakdown</h3>
            
            {total > 0 ? (
              <div className={styles.breakdownList}>
                {Object.entries(breakdown)
                  .sort(([, a], [, b]) => b - a)
                  .map(([cat, amt]) => {
                    const percentage = Math.round((amt / total) * 100);
                    return (
                      <div key={cat} className={styles.breakdownItem}>
                        <div className={styles.breakdownHeader}>
                          <span className={styles.breakdownCat} style={{ color: CATEGORY_COLORS[cat as ExpenseCategory] }}>
                            {cat}
                          </span>
                          <span className={styles.breakdownAmt}>{formatCurrency(amt, settings.currency)}</span>
                        </div>
                        <div className={styles.progressBar}>
                          <div 
                            className={styles.progressFill} 
                            style={{ 
                              width: `${percentage}%`, 
                              backgroundColor: CATEGORY_COLORS[cat as ExpenseCategory] 
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <p className={styles.emptyText}>Add expenses to see the breakdown.</p>
            )}
          </div>
        </aside>
      </div>

      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add Expense">
        <form onSubmit={handleAddExpense} className={styles.form}>
          <div>
            <label className="label">Amount</label>
            <div className={styles.amountInputWrapper}>
              <span className={styles.currencySymbol}>{settings.currency}</span>
              <input 
                type="number" 
                step="0.01"
                min="0"
                className={`input-field ${styles.amountInput}`} 
                placeholder="0.00" 
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                autoFocus
              />
            </div>
          </div>
          
          <div>
            <label className="label">Description</label>
            <input 
              type="text" 
              className="input-field" 
              placeholder="e.g. Groceries, Uber, Coffee..." 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>
          
          <div className={styles.formRow}>
            <div style={{ flex: 1 }}>
              <label className="label">Category</label>
              <select 
                className="input-field"
                value={category}
                onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
              >
                <option value="food">Food & Dining</option>
                <option value="transport">Transportation</option>
                <option value="shopping">Shopping</option>
                <option value="entertainment">Entertainment</option>
                <option value="bills">Bills & Utilities</option>
                <option value="other">Other</option>
              </select>
            </div>
            
            <div style={{ flex: 1 }}>
              <label className="label">Date</label>
              <input 
                type="date" 
                className="input-field" 
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
          </div>

          <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '16px' }}>
            Save Expense
          </button>
        </form>
      </Modal>

    </main>
  );
}
