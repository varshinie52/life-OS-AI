"use client";

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Target, Calendar as CalendarIcon, Flame, Trophy, ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './page.module.css';
import { useHabits } from '@/hooks/useHabits';
import { getToday, getDaysInMonth, MONTH_NAMES_SHORT, DAY_NAMES } from '@/lib/utils';
import Modal from '@/components/ui/Modal';
import { useAppContext } from '@/context/AppContext';

export default function HabitsPage() {
  const { isMounted } = useAppContext();
  const { habits, addHabit, toggleHabitCompletion, getHabitStats, deleteHabit } = useHabits();
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newHabitName, setNewHabitName] = useState('');
  const [newHabitIcon, setNewHabitIcon] = useState('🌟');
  const [newHabitColor, setNewHabitColor] = useState('#008080');

  // Today string for comparisons
  const todayStr = getToday();

  // Calendar logic
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = useMemo(() => getDaysInMonth(year, month), [year, month]);
  
  // We'll show the last 7 days including today in the main view for quick check-ins
  const last7Days = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(d.toISOString().split('T')[0]);
    }
    return days;
  }, []);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleAddHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newHabitName.trim()) {
      addHabit(newHabitName, newHabitIcon, newHabitColor);
      setNewHabitName('');
      setIsAddModalOpen(false);
    }
  };

  if (!isMounted) return null;

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Habit Tracker</h1>
          <p className={styles.subtitle}>Consistency is the key to mastery.</p>
        </div>
        <button className="btn-primary" onClick={() => setIsAddModalOpen(true)}>
          <Plus size={18} /> New Habit
        </button>
      </header>

      <div className={styles.grid}>
        
        {/* Main Check-in Table */}
        <div className={styles.mainContent}>
          <div className="glass-panel" style={{ padding: '24px', overflowX: 'auto' }}>
            <div className={styles.tableHeader}>
              <div className={styles.habitColumn}>Habit</div>
              <div className={styles.daysContainer}>
                {last7Days.map(dateStr => {
                  const d = new Date(dateStr + 'T00:00:00');
                  const isToday = dateStr === todayStr;
                  return (
                    <div key={dateStr} className={`${styles.dayHeader} ${isToday ? styles.todayHighlight : ''}`}>
                      <span className={styles.dayName}>{DAY_NAMES[d.getDay()]}</span>
                      <span className={styles.dayNumber}>{d.getDate()}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className={styles.habitList}>
              {habits.map(habit => (
                <div key={habit.id} className={styles.habitRow}>
                  <div className={styles.habitInfo}>
                    <div className={styles.habitIcon} style={{ background: `${habit.color}20`, color: habit.color }}>
                      {habit.icon}
                    </div>
                    <span className={styles.habitName}>{habit.name}</span>
                  </div>
                  
                  <div className={styles.daysContainer}>
                    {last7Days.map(dateStr => {
                      const isCompleted = habit.completedDates.includes(dateStr);
                      const isToday = dateStr === todayStr;
                      const isFuture = dateStr > todayStr;
                      
                      return (
                        <div key={dateStr} className={styles.checkboxWrapper}>
                          <button
                            className={`${styles.checkbox} ${isCompleted ? styles.checked : ''}`}
                            style={{ 
                              borderColor: isCompleted ? habit.color : 'var(--border-subtle)',
                              backgroundColor: isCompleted ? habit.color : 'transparent'
                            }}
                            onClick={() => !isFuture && toggleHabitCompletion(habit.id, dateStr)}
                            disabled={isFuture}
                          >
                            {isCompleted && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}><CheckCircle size={14} color="#fff" /></motion.div>}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
              
              {habits.length === 0 && (
                <div className={styles.emptyState}>
                  <Target size={48} className={styles.emptyIcon} />
                  <p>No habits yet. Start building good routines today!</p>
                </div>
              )}
            </div>
          </div>

          {/* Monthly Calendar View (Heatmap-style) */}
          <div className="glass-panel" style={{ padding: '24px', marginTop: '24px' }}>
            <div className={styles.calendarHeader}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CalendarIcon size={20} className="text-accent" /> 
                Monthly Overview
              </h3>
              <div className={styles.monthControls}>
                <button className={styles.iconBtn} onClick={handlePrevMonth}><ChevronLeft size={18} /></button>
                <span className={styles.currentMonth}>{MONTH_NAMES_SHORT[month]} {year}</span>
                <button className={styles.iconBtn} onClick={handleNextMonth} disabled={month >= new Date().getMonth() && year >= new Date().getFullYear()}><ChevronRight size={18} /></button>
              </div>
            </div>

            <div className={styles.calendarGrid}>
              {habits.map(habit => (
                <div key={habit.id} className={styles.calendarHabitRow}>
                  <div className={styles.calHabitName}>{habit.icon} {habit.name}</div>
                  <div className={styles.calDays}>
                    {daysInMonth.map(dateStr => {
                      const isCompleted = habit.completedDates.includes(dateStr);
                      const isFuture = dateStr > todayStr;
                      return (
                        <div 
                          key={dateStr}
                          className={styles.calDayBox}
                          style={{
                            background: isCompleted ? habit.color : 'var(--surface-solid)',
                            opacity: isFuture ? 0.2 : (isCompleted ? 1 : 0.5),
                            borderColor: isCompleted ? habit.color : 'var(--border-subtle)'
                          }}
                          title={`${dateStr}: ${isCompleted ? 'Completed' : 'Missed'}`}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar Stats */}
        <div className={styles.sidebar}>
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 className={styles.sidebarTitle}><Flame size={20} color="var(--color-warning)" /> Streak Stats</h3>
            
            <div className={styles.statsList}>
              {habits.map(habit => {
                const stats = getHabitStats(habit);
                return (
                  <div key={habit.id} className={styles.statCard}>
                    <div className={styles.statHeader}>
                      <span>{habit.icon} {habit.name}</span>
                      <button className={styles.deleteBtn} onClick={() => deleteHabit(habit.id)}>×</button>
                    </div>
                    <div className={styles.statMetrics}>
                      <div className={styles.metric}>
                        <span className={styles.metricLabel}>Current</span>
                        <span className={styles.metricValue}>{stats.currentStreak} <Flame size={14} color="var(--color-warning)"/></span>
                      </div>
                      <div className={styles.metric}>
                        <span className={styles.metricLabel}>Best</span>
                        <span className={styles.metricValue}>{stats.longestStreak} <Trophy size={14} color="var(--color-warning)"/></span>
                      </div>
                      <div className={styles.metric}>
                        <span className={styles.metricLabel}>Rate</span>
                        <span className={styles.metricValue}>{stats.completionRate}%</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Add Habit Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Create New Habit">
        <form onSubmit={handleAddHabit} className={styles.form}>
          <div>
            <label className="label">Habit Name</label>
            <input 
              type="text" 
              className="input-field" 
              placeholder="e.g. Read 10 Pages, Drink Water..." 
              value={newHabitName}
              onChange={(e) => setNewHabitName(e.target.value)}
              required
              autoFocus
            />
          </div>
          
          <div className={styles.formRow}>
            <div style={{ flex: 1 }}>
              <label className="label">Emoji Icon</label>
              <input 
                type="text" 
                className="input-field" 
                value={newHabitIcon}
                onChange={(e) => setNewHabitIcon(e.target.value)}
                maxLength={2}
                required
              />
            </div>
            <div style={{ flex: 1 }}>
              <label className="label">Color</label>
              <input 
                type="color" 
                className={styles.colorPicker} 
                value={newHabitColor}
                onChange={(e) => setNewHabitColor(e.target.value)}
              />
            </div>
          </div>

          <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '16px' }}>
            Create Habit
          </button>
        </form>
      </Modal>

    </main>
  );
}

const CheckCircle = ({ size, color }: { size: number, color: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
);
