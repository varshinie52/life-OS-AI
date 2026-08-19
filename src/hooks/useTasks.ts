'use client';

import { useLifeOS } from '@/context/LifeOSContext';
import { useMemo } from 'react';

export function useTasks() {
  const { tasks, addTask, updateTask, deleteTask, toggleTaskStatus } = useLifeOS();

  const activeTasks = useMemo(() => tasks.filter(t => t.status !== 'done'), [tasks]);
  const completedTasks = useMemo(() => tasks.filter(t => t.status === 'done'), [tasks]);
  const categories = useMemo(() => Array.from(new Set(tasks.map(t => t.category))), [tasks]);

  return {
    tasks,
    activeTasks,
    completedTasks,
    categories,
    addTask,
    updateTask,
    deleteTask,
    toggleTaskStatus,
  };
}
