'use client';

import { useLocalStorage } from './useLocalStorage';
import { Goal, GoalCategory, Milestone } from '@/lib/types';
import { generateId, getToday } from '@/lib/utils';
import { useMemo } from 'react';

const DEFAULT_GOALS: Goal[] = [
  {
    id: 'g1',
    title: 'Launch SaaS MVP',
    description: 'Design, build, and launch the v1 of LifeOS to the public.',
    category: 'career',
    deadline: '2027-01-01',
    progress: 40,
    milestones: [
      { id: 'm1', title: 'Complete Design System', completed: true },
      { id: 'm2', title: 'Build Frontend Modules', completed: true },
      { id: 'm3', title: 'Integrate Auth & Database', completed: false },
      { id: 'm4', title: 'Marketing Landing Page', completed: false }
    ],
    createdAt: getToday()
  }
];

export function useGoals() {
  const [goals, setGoals] = useLocalStorage<Goal[]>('lifeos_goals', DEFAULT_GOALS);

  const calculateProgress = (milestones: Milestone[]) => {
    if (milestones.length === 0) return 0;
    const completed = milestones.filter(m => m.completed).length;
    return Math.round((completed / milestones.length) * 100);
  };

  const addGoal = (title: string, description: string, category: GoalCategory, deadline: string | null) => {
    const newGoal: Goal = {
      id: generateId(),
      title,
      description,
      category,
      deadline,
      progress: 0,
      milestones: [],
      createdAt: new Date().toISOString()
    };
    setGoals((prev) => [...prev, newGoal]);
  };

  const deleteGoal = (id: string) => {
    setGoals((prev) => prev.filter(g => g.id !== id));
  };

  const addMilestone = (goalId: string, title: string) => {
    setGoals((prev) => prev.map(g => {
      if (g.id !== goalId) return g;
      const newMilestones = [...g.milestones, { id: generateId(), title, completed: false }];
      return { ...g, milestones: newMilestones, progress: calculateProgress(newMilestones) };
    }));
  };

  const toggleMilestone = (goalId: string, milestoneId: string) => {
    setGoals((prev) => prev.map(g => {
      if (g.id !== goalId) return g;
      const newMilestones = g.milestones.map(m => 
        m.id === milestoneId ? { ...m, completed: !m.completed } : m
      );
      return { ...g, milestones: newMilestones, progress: calculateProgress(newMilestones) };
    }));
  };

  const deleteMilestone = (goalId: string, milestoneId: string) => {
    setGoals((prev) => prev.map(g => {
      if (g.id !== goalId) return g;
      const newMilestones = g.milestones.filter(m => m.id !== milestoneId);
      return { ...g, milestones: newMilestones, progress: calculateProgress(newMilestones) };
    }));
  };

  return {
    goals,
    addGoal,
    deleteGoal,
    addMilestone,
    toggleMilestone,
    deleteMilestone
  };
}
