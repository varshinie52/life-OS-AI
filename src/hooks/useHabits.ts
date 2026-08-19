'use client';

import { useLifeOS } from '@/context/LifeOSContext';
import { Habit, HabitStats } from '@/lib/types';
import { getToday, calculateStreak } from '@/lib/utils';

export function useHabits() {
  const { habits, addHabit, updateHabit, deleteHabit, toggleHabitCompletion, metrics } = useLifeOS();

  const getHabitStats = (habit: Habit): HabitStats => {
    const { current, longest } = calculateStreak(habit.completedDates || []);
    const createdDate = new Date((habit.createdAt || getToday()) + 'T00:00:00');
    const today = new Date(getToday() + 'T00:00:00');
    const daysSinceCreation = Math.max(1, Math.floor((today.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)) + 1);
    const rate = Math.round(((habit.completedDates?.length || 0) / daysSinceCreation) * 100);

    return {
      currentStreak: current,
      longestStreak: longest,
      totalCompletions: habit.completedDates?.length || 0,
      completionRate: Math.min(100, rate),
    };
  };

  return {
    habits,
    addHabit,
    updateHabit,
    deleteHabit,
    toggleHabitCompletion,
    getHabitStats,
    todayProgress: metrics.habitCompletionRate,
  };
}
