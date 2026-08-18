"use client";

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { BarChart2, TrendingUp, CheckCircle, Target, DollarSign, Calendar, Clock } from 'lucide-react';
import styles from './page.module.css';
import { useHabits } from '@/hooks/useHabits';
import { useTasks } from '@/hooks/useTasks';
import { useGoals } from '@/hooks/useGoals';
import { useExpenses } from '@/hooks/useExpenses';
import { useAppContext } from '@/context/AppContext';
import { formatCurrency } from '@/lib/utils';

export default function AnalyticsPage() {
  const { isMounted, settings } = useAppContext();
  
  const { habits } = useHabits();
  const { completedTasks, activeTasks } = useTasks();
  const { goals } = useGoals();
  const { expenses } = useExpenses();

  // Basic derived metrics
  const totalHabits = habits.length;
  const avgHabitStreak = habits.length ? Math.round(habits.reduce((acc, h) => acc + h.completedDates.length, 0) / habits.length) : 0;
  
  const totalTasks = completedTasks.length + activeTasks.length;
  const taskCompletionRate = totalTasks ? Math.round((completedTasks.length / totalTasks) * 100) : 0;
  
  const totalGoals = goals.length;
  const avgGoalProgress = goals.length ? Math.round(goals.reduce((acc, g) => acc + g.progress, 0) / goals.length) : 0;

  const currentMonth = new Date().toISOString().substring(0, 7);
  const monthExpenses = expenses.filter(e => e.date.startsWith(currentMonth));
  const totalSpentThisMonth = monthExpenses.reduce((acc, e) => acc + e.amount, 0);

  if (!isMounted) return null;

  const statCards = [
    { label: 'Task Completion', value: `${taskCompletionRate}%`, icon: <CheckCircle />, color: 'var(--color-success)' },
    { label: 'Avg Habit Streak', value: `${avgHabitStreak} days`, icon: <TrendingUp />, color: 'var(--color-warning)' },
    { label: 'Goal Progress', value: `${avgGoalProgress}%`, icon: <Target />, color: 'var(--accent-primary)' },
    { label: 'Spent This Month', value: formatCurrency(totalSpentThisMonth, settings.currency), icon: <DollarSign />, color: 'var(--color-error)' },
  ];

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Analytics</h1>
          <p className={styles.subtitle}>Insights into your life operating system.</p>
        </div>
      </header>

      <div className={styles.statsGrid}>
        {statCards.map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-panel"
            style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}
          >
            <div className={styles.iconWrapper} style={{ color: stat.color, backgroundColor: `${stat.color}20` }}>
              {stat.icon}
            </div>
            <div>
              <div className={styles.statLabel}>{stat.label}</div>
              <div className={styles.statValue}>{stat.value}</div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className={styles.chartsGrid}>
        {/* Placeholder for complex charts, right now using simple progress bars */}
        <div className="glass-panel" style={{ padding: '32px' }}>
          <h3 className={styles.chartTitle}><CheckCircle size={20} className="text-accent" /> Tasks Overview</h3>
          <div className={styles.chartArea}>
            <div className={styles.barRow}>
              <span className={styles.barLabel}>Completed ({completedTasks.length})</span>
              <div className={styles.barTrack}>
                <div className={styles.barFill} style={{ width: `${taskCompletionRate}%`, backgroundColor: 'var(--color-success)' }} />
              </div>
            </div>
            <div className={styles.barRow}>
              <span className={styles.barLabel}>Active ({activeTasks.length})</span>
              <div className={styles.barTrack}>
                <div className={styles.barFill} style={{ width: `${100 - taskCompletionRate}%`, backgroundColor: 'var(--color-warning)' }} />
              </div>
            </div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '32px' }}>
          <h3 className={styles.chartTitle}><Target size={20} className="text-accent" /> Goals Overview</h3>
          <div className={styles.chartArea}>
            {goals.map(goal => (
              <div key={goal.id} className={styles.barRow}>
                <span className={styles.barLabel}>{goal.title}</span>
                <div className={styles.barTrack}>
                  <div className={styles.barFill} style={{ width: `${goal.progress}%`, backgroundColor: 'var(--accent-primary)' }} />
                </div>
                <span className={styles.barValue}>{goal.progress}%</span>
              </div>
            ))}
            {goals.length === 0 && <p className={styles.emptyText}>No goals tracked yet.</p>}
          </div>
        </div>

      </div>
    </main>
  );
}
