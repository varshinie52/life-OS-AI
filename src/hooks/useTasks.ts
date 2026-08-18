'use client';

import { useLocalStorage } from './useLocalStorage';
import { Task, TaskPriority, TaskStatus } from '@/lib/types';
import { generateId, getToday } from '@/lib/utils';
import { useMemo } from 'react';

const DEFAULT_TASKS: Task[] = [
  {
    id: 't1',
    title: 'Design Dashboard Hub',
    description: 'Create wireframes and high-fidelity mockups for the new dashboard.',
    priority: 'high',
    status: 'in-progress',
    category: 'Work',
    dueDate: getToday(),
    createdAt: getToday(),
    completedAt: null
  },
  {
    id: 't2',
    title: 'Review PR #42',
    description: 'Review the authentication flow pull request from Alex.',
    priority: 'medium',
    status: 'todo',
    category: 'Work',
    dueDate: getToday(),
    createdAt: getToday(),
    completedAt: null
  },
  {
    id: 't3',
    title: 'Buy groceries',
    description: 'Milk, eggs, bread, and coffee.',
    priority: 'low',
    status: 'todo',
    category: 'Personal',
    dueDate: null,
    createdAt: getToday(),
    completedAt: null
  }
];

export function useTasks() {
  const [tasks, setTasks] = useLocalStorage<Task[]>('lifeos_tasks', DEFAULT_TASKS);

  const addTask = (
    title: string, 
    description: string = '', 
    priority: TaskPriority = 'medium',
    category: string = 'General',
    dueDate: string | null = null
  ) => {
    const newTask: Task = {
      id: generateId(),
      title,
      description,
      priority,
      status: 'todo',
      category,
      dueDate,
      createdAt: new Date().toISOString(),
      completedAt: null
    };
    setTasks((prev) => [newTask, ...prev]);
  };

  const updateTask = (id: string, updates: Partial<Omit<Task, 'id' | 'createdAt'>>) => {
    setTasks((prev) => prev.map(t => {
      if (t.id === id) {
        const updated = { ...t, ...updates };
        // Automatically set completedAt if status changes to done
        if (updates.status === 'done' && t.status !== 'done') {
          updated.completedAt = new Date().toISOString();
        } else if (updates.status && updates.status !== 'done') {
          updated.completedAt = null;
        }
        return updated;
      }
      return t;
    }));
  };

  const deleteTask = (id: string) => {
    setTasks((prev) => prev.filter(t => t.id !== id));
  };

  const toggleTaskStatus = (id: string) => {
    setTasks((prev) => prev.map(t => {
      if (t.id !== id) return t;
      const isDone = t.status === 'done';
      return {
        ...t,
        status: isDone ? 'todo' : 'done',
        completedAt: isDone ? null : new Date().toISOString()
      };
    }));
  };

  // Helper selectors
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
