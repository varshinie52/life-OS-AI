'use client';

import { useLocalStorage } from './useLocalStorage';
import { Habit, HabitStats } from '@/lib/types';
import { generateId, getToday, calculateStreak } from '@/lib/utils';
import { useMemo } from 'react';

// Default habits for new users
const DEFAULT_HABITS: Habit[] = [
  {
    id: 'h1',
    name: 'Morning Exercise',
    icon: '🏃‍♀️',
    color: '#10B981',
    createdAt: getToday(),
    completedDates: []
  },
  {
    id: 'h2',
    name: 'Read 10 Pages',
    icon: '📚',
    color: '#3B82F6',
    createdAt: getToday(),
    completedDates: []
  },
  {
    id: 'h3',
    name: 'Drink 2L Water',
    icon: '💧',
    color: '#06B6D4',
    createdAt: getToday(),
    completedDates: []
  }
];

export function useHabits() {
  const [habits, setHabits] = useLocalStorage<Habit[]>('lifeos_habits', DEFAULT_HABITS);

  const addHabit = (name: string, icon: string, color: string) => {
    const newHabit: Habit = {
      id: generateId(),
      name,
      icon,
      color,
      createdAt: getToday(),
      completedDates: [],
    };
    setHabits((prev) => [...prev, newHabit]);
  };

  const updateHabit = (id: string, updates: Partial<Omit<Habit, 'id' | 'createdAt' | 'completedDates'>>) => {
    setHabits((prev) => prev.map(h => (h.id === id ? { ...h, ...updates } : h)));
  };

  const deleteHabit = (id: string) => {
    setHabits((prev) => prev.filter(h => h.id !== id));
  };

  const toggleHabitCompletion = (id: string, date: string) => {
    setHabits((prev) => prev.map(h => {
      if (h.id !== id) return h;
      
      const isCompleted = h.completedDates.includes(date);
      let newDates = [];
      if (isCompleted) {
        newDates = h.completedDates.filter(d => d !== date);
      } else {
        newDates = [...h.completedDates, date];
      }
      
      return { ...h, completedDates: newDates };
    }));
  };

  const getHabitStats = (habit: Habit): HabitStats => {
    const { current, longest } = calculateStreak(habit.completedDates);
    
    // Calculate completion rate based on days since creation
    const createdDate = new Date(habit.createdAt + 'T00:00:00');
    const today = new Date(getToday() + 'T00:00:00');
    const daysSinceCreation = Math.max(1, Math.floor((today.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)) + 1);
    
    const rate = Math.round((habit.completedDates.length / daysSinceCreation) * 100);

    return {
      currentStreak: current,
      longestStreak: longest,
      totalCompletions: habit.completedDates.length,
      completionRate: Math.min(100, rate),
    };
  };

  // Calculate overall stats for all habits today
  const todayProgress = useMemo(() => {
    const today = getToday();
    if (habits.length === 0) return 0;
    const completedToday = habits.filter(h => h.completedDates.includes(today)).length;
    return Math.round((completedToday / habits.length) * 100);
  }, [habits]);

  return {
    habits,
    addHabit,
    updateHabit,
    deleteHabit,
    toggleHabitCompletion,
    getHabitStats,
    todayProgress,
  };
}
