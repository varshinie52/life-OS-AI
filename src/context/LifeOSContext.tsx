'use client';

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { Habit, Task, Note, JournalEntry, CalendarEvent, Goal, Expense, PomodoroSession, UserSettings } from '@/lib/types';
import { DEFAULT_SETTINGS, generateId, getToday, calculateStreak, safeFormatDate } from '@/lib/utils';
import { DEMO_HABITS, DEMO_TASKS, DEMO_JOURNAL, DEMO_CALENDAR_EVENTS, DEMO_NOTES } from '@/lib/demoData';

// List of legacy seed IDs to automatically purge from user local storage
const LEGACY_SEED_IDS = new Set([
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'h7', 'h8', 'h9', 'h10',
  't1', 't2', 't3', 't4', 't5', 't6', 't7',
  'n1', 'n2',
  'j1', 'j2', 'j3', 'j4', 'j5', 'j6', 'j7',
  'e1', 'e2', 'e3', 'e4', 'e5', 'e6', 'e7'
]);

export interface UnifiedActivityItem {
  id: string;
  type: 'habit' | 'task' | 'note' | 'journal' | 'calendar';
  title: string;
  time: string;
  timestamp: number;
}

export interface LifeOSContextType {
  // Core state
  habits: Habit[];
  tasks: Task[];
  notes: Note[];
  journal: JournalEntry[];
  events: CalendarEvent[];
  goals: Goal[];
  expenses: Expense[];
  pomodoroSessions: PomodoroSession[];
  settings: UserSettings;
  isMounted: boolean;

  // Demo Data & Section Management Actions
  loadDemoData: () => void;
  clearDemoData: () => void;
  clearSectionData: (section: 'habits' | 'tasks' | 'notes' | 'journal' | 'events') => void;

  // Habit Actions
  addHabit: (name: string, icon?: string, color?: string, category?: string, frequency?: string) => Habit;
  updateHabit: (id: string, updates: Partial<Omit<Habit, 'id' | 'createdAt'>>) => void;
  deleteHabit: (id: string) => void;
  toggleHabitCompletion: (id: string, date?: string) => void;
  clearAllHabits: () => void;

  // Task Actions
  addTask: (title: string, description?: string, priority?: Task['priority'], category?: string, dueDate?: string | null) => Task;
  updateTask: (id: string, updates: Partial<Omit<Task, 'id' | 'createdAt'>>) => void;
  deleteTask: (id: string) => void;
  toggleTaskStatus: (id: string) => void;
  clearAllTasks: () => void;

  // Note Actions
  addNote: (title: string, content?: string, folder?: string, color?: string) => Note;
  updateNote: (id: string, updates: Partial<Omit<Note, 'id' | 'createdAt'>>) => void;
  deleteNote: (id: string) => void;
  togglePinNote: (id: string) => void;
  clearAllNotes: () => void;

  // Journal Actions
  saveJournalEntry: (date: string, content: string, mood?: JournalEntry['mood'], gratitude?: string[]) => JournalEntry;
  deleteJournalEntry: (id: string) => void;
  clearAllJournalEntries: () => void;

  // Calendar Actions
  addCalendarEvent: (title: string, description?: string, date?: string, startTime?: string, endTime?: string, color?: string) => CalendarEvent;
  updateCalendarEvent: (id: string, updates: Partial<Omit<CalendarEvent, 'id' | 'createdAt'>>) => void;
  deleteCalendarEvent: (id: string) => void;
  clearAllEvents: () => void;

  // Settings Actions
  updateSettings: (newSettings: Partial<UserSettings>) => void;

  // Derived Live Metrics
  metrics: {
    habitsCompletedToday: number;
    habitsTotalToday: number;
    habitCompletionRate: number;
    currentHabitStreak: number;
    longestHabitStreak: number;

    tasksTotal: number;
    tasksCompleted: number;
    tasksPending: number;
    tasksOverdue: number;
    taskCompletionRate: number;
    todayTasks: Task[];
    upcomingTasks: Task[];

    notesTotal: number;
    notesPinned: number;
    recentNotes: Note[];

    journalTodayEntry: JournalEntry | undefined;
    latestJournalEntry: JournalEntry | undefined;

    todayEvents: CalendarEvent[];
    upcomingEvents: CalendarEvent[];

    productivityScore: number;
    weeklyActivity: Array<{ day: string; tasks: number; habits: number; score: number }>;
    recentActivity: UnifiedActivityItem[];
  };
}

const LifeOSContext = createContext<LifeOSContextType | undefined>(undefined);

const getItem = <T,>(key: string, defaultVal: T): T => {
  if (typeof window === 'undefined') return defaultVal;
  try {
    const item = window.localStorage.getItem(key);
    if (!item) return defaultVal;
    const parsed = JSON.parse(item);
    if (Array.isArray(parsed)) {
      return parsed.filter((x: any) => !x || !x.id || !LEGACY_SEED_IDS.has(x.id)) as unknown as T;
    }
    return parsed as T;
  } catch {
    return defaultVal;
  }
};

const setItem = <T,>(key: string, value: T): void => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Quota exceeded
  }
};

const getInitialCollection = <T,>(key: string, demoFallback: T[]): T[] => {
  if (typeof window === 'undefined') return demoFallback;
  try {
    const hasInitialized = window.localStorage.getItem('lifeos_has_demo_initialized');
    const raw = window.localStorage.getItem(key);
    
    // First time ever opening the app: if flag is missing or key is missing/empty, load demoFallback
    if (!hasInitialized) {
      if (!raw || raw === '[]' || raw === 'null') {
        window.localStorage.setItem(key, JSON.stringify(demoFallback));
        return demoFallback;
      }
    }

    if (!raw) return demoFallback;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      const filtered = parsed.filter((x: any) => !x || !x.id || !LEGACY_SEED_IDS.has(x.id)) as unknown as T[];
      if (!hasInitialized && filtered.length === 0) {
        window.localStorage.setItem(key, JSON.stringify(demoFallback));
        return demoFallback;
      }
      return filtered;
    }
    return parsed as T[];
  } catch {
    return demoFallback;
  }
};

export function LifeOSProvider({ children }: { children: React.ReactNode }) {
  const [isMounted, setIsMounted] = useState(false);

  // Lazy state initializers: Populated with DEMO dataset on first-time launch
  const [habits, setHabits] = useState<Habit[]>(() => getInitialCollection<Habit>('lifeos_habits', DEMO_HABITS));
  const [tasks, setTasks] = useState<Task[]>(() => getInitialCollection<Task>('lifeos_tasks', DEMO_TASKS));
  const [notes, setNotes] = useState<Note[]>(() => getInitialCollection<Note>('lifeos_notes', DEMO_NOTES));
  const [journal, setJournal] = useState<JournalEntry[]>(() => getInitialCollection<JournalEntry>('lifeos_journal', DEMO_JOURNAL));
  const [events, setEvents] = useState<CalendarEvent[]>(() => getInitialCollection<CalendarEvent>('lifeos_events', DEMO_CALENDAR_EVENTS));
  const [goals, setGoals] = useState<Goal[]>(() => getItem<Goal[]>('lifeos_goals', []));
  const [expenses, setExpenses] = useState<Expense[]>(() => getItem<Expense[]>('lifeos_expenses', []));
  const [pomodoroSessions, setPomodoroSessions] = useState<PomodoroSession[]>(() => getItem<PomodoroSession[]>('lifeos_pomodoro', []));
  const [settings, setSettings] = useState<UserSettings>(() => getItem<UserSettings>('lifeos_settings', DEFAULT_SETTINGS));

  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== 'undefined') {
      if (!window.localStorage.getItem('lifeos_has_demo_initialized')) {
        window.localStorage.setItem('lifeos_has_demo_initialized', 'true');
      }
      document.documentElement.setAttribute('data-theme', settings.theme);
    }
  }, [settings.theme]);

  // Sync state changes to localStorage
  useEffect(() => { if (isMounted) setItem('lifeos_habits', habits); }, [habits, isMounted]);
  useEffect(() => { if (isMounted) setItem('lifeos_tasks', tasks); }, [tasks, isMounted]);
  useEffect(() => { if (isMounted) setItem('lifeos_notes', notes); }, [notes, isMounted]);
  useEffect(() => { if (isMounted) setItem('lifeos_journal', journal); }, [journal, isMounted]);
  useEffect(() => { if (isMounted) setItem('lifeos_events', events); }, [events, isMounted]);
  useEffect(() => { if (isMounted) setItem('lifeos_goals', goals); }, [goals, isMounted]);
  useEffect(() => { if (isMounted) setItem('lifeos_expenses', expenses); }, [expenses, isMounted]);
  useEffect(() => { if (isMounted) setItem('lifeos_pomodoro', pomodoroSessions); }, [pomodoroSessions, isMounted]);
  // ── Demo Data & Section Management Actions ───────────────
  const loadDemoData = useCallback(() => {
    setHabits((prev) => {
      const existingIds = new Set(prev.map((h) => h.id));
      const newDemo = DEMO_HABITS.filter((h) => !existingIds.has(h.id));
      return [...newDemo, ...prev];
    });
    setTasks((prev) => {
      const existingIds = new Set(prev.map((t) => t.id));
      const newDemo = DEMO_TASKS.filter((t) => !existingIds.has(t.id));
      return [...newDemo, ...prev];
    });
    setNotes((prev) => {
      const existingIds = new Set(prev.map((n) => n.id));
      const newDemo = DEMO_NOTES.filter((n) => !existingIds.has(n.id));
      return [...newDemo, ...prev];
    });
    setJournal((prev) => {
      const existingDates = new Set(prev.map((j) => j.date));
      const newDemo = DEMO_JOURNAL.filter((j) => !existingDates.has(j.date));
      return [...newDemo, ...prev];
    });
    setEvents((prev) => {
      const existingIds = new Set(prev.map((e) => e.id));
      const newDemo = DEMO_CALENDAR_EVENTS.filter((e) => !existingIds.has(e.id));
      return [...newDemo, ...prev];
    });
  }, []);

  const clearDemoData = useCallback(() => {
    setHabits((prev) => prev.filter((h) => !h.isDemo && !h.id.startsWith('demo-')));
    setTasks((prev) => prev.filter((t) => !t.isDemo && !t.id.startsWith('demo-')));
    setNotes((prev) => prev.filter((n) => !n.isDemo && !n.id.startsWith('demo-')));
    setJournal((prev) => prev.filter((j) => !j.isDemo && !j.id.startsWith('demo-')));
    setEvents((prev) => prev.filter((e) => !e.isDemo && !e.id.startsWith('demo-')));
  }, []);

  const clearSectionData = useCallback((section: 'habits' | 'tasks' | 'notes' | 'journal' | 'events') => {
    if (section === 'habits') setHabits([]);
    else if (section === 'tasks') setTasks([]);
    else if (section === 'notes') setNotes([]);
    else if (section === 'journal') setJournal([]);
    else if (section === 'events') setEvents([]);
  }, []);

  // ── Habit Actions ──────────────────────────────────
  const addHabit = useCallback((name: string, icon = '🎯', color = '#6B7F4E') => {
    const newHabit: Habit = {
      id: generateId(),
      name,
      icon,
      color,
      createdAt: getToday(),
      completedDates: [],
    };
    setHabits((prev) => [newHabit, ...prev]);
    return newHabit;
  }, []);

  const updateHabit = useCallback((id: string, updates: Partial<Omit<Habit, 'id' | 'createdAt'>>) => {
    setHabits((prev) => prev.map((h) => (h.id === id || (h as any)._id === id ? { ...h, ...updates } : h)));
  }, []);

  const deleteHabit = useCallback((id: string) => {
    setHabits((prev) => prev.filter((h) => h.id !== id && (h as any)._id !== id));
  }, []);

  const toggleHabitCompletion = useCallback((id: string, date: string = getToday()) => {
    setHabits((prev) =>
      prev.map((h) => {
        if (h.id !== id && (h as any)._id !== id) return h;
        const exists = h.completedDates.includes(date);
        const nextDates = exists
          ? h.completedDates.filter((d) => d !== date)
          : [...h.completedDates, date];
        return { ...h, completedDates: nextDates };
      })
    );
  }, []);

  const clearAllHabits = useCallback(() => setHabits([]), []);

  // ── Task Actions ───────────────────────────────────
  const addTask = useCallback((
    title: string,
    description = '',
    priority: Task['priority'] = 'medium',
    category = 'General',
    dueDate: string | null = getToday()
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
      completedAt: null,
    };
    setTasks((prev) => [newTask, ...prev]);
    return newTask;
  }, []);

  const updateTask = useCallback((id: string, updates: Partial<Omit<Task, 'id' | 'createdAt'>>) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== id && (t as any)._id !== id) return t;
        const updated = { ...t, ...updates };
        if (updates.status === 'done' && t.status !== 'done') {
          updated.completedAt = new Date().toISOString();
        } else if (updates.status && updates.status !== 'done') {
          updated.completedAt = null;
        }
        return updated;
      })
    );
  }, []);

  const deleteTask = useCallback((id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id && (t as any)._id !== id));
  }, []);

  const toggleTaskStatus = useCallback((id: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== id && (t as any)._id !== id) return t;
        const isDone = t.status === 'done';
        return {
          ...t,
          status: isDone ? 'todo' : 'done',
          completedAt: isDone ? null : new Date().toISOString(),
        };
      })
    );
  }, []);

  const clearAllTasks = useCallback(() => setTasks([]), []);

  // ── Note Actions ───────────────────────────────────
  const addNote = useCallback((title: string, content = '', folder = 'General', color = '#4C6A73') => {
    const newNote: Note = {
      id: generateId(),
      title: title || 'Untitled Note',
      content,
      folder,
      color,
      isPinned: false,
      tags: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setNotes((prev) => [newNote, ...prev]);
    return newNote;
  }, []);

  const updateNote = useCallback((id: string, updates: Partial<Omit<Note, 'id' | 'createdAt'>>) => {
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, ...updates, updatedAt: new Date().toISOString() } : n))
    );
  }, []);

  const deleteNote = useCallback((id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const togglePinNote = useCallback((id: string) => {
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, isPinned: !n.isPinned } : n)));
  }, []);

  const clearAllNotes = useCallback(() => setNotes([]), []);

  // ── Journal Actions ────────────────────────────────
  const saveJournalEntry = useCallback((
    date: string = getToday(),
    content: string,
    mood: JournalEntry['mood'] = '😊',
    gratitude: string[] = []
  ) => {
    const id = generateId();
    const entry: JournalEntry = {
      id,
      date,
      content,
      mood,
      gratitude,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setJournal((prev) => {
      const idx = prev.findIndex((j) => j.date === date);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = {
          ...next[idx],
          content,
          mood,
          gratitude,
          updatedAt: new Date().toISOString(),
        };
        return next;
      } else {
        return [...prev, entry];
      }
    });
    return entry;
  }, []);

  const deleteJournalEntry = useCallback((id: string) => {
    setJournal((prev) => prev.filter((j) => j.id !== id));
  }, []);

  const clearAllJournalEntries = useCallback(() => setJournal([]), []);

  // ── Calendar Actions ───────────────────────────────
  const addCalendarEvent = useCallback((
    title: string,
    description = '',
    date: string = getToday(),
    startTime = '09:00',
    endTime = '10:00',
    color = '#4C6A73'
  ) => {
    const newEvent: CalendarEvent = {
      id: generateId(),
      title,
      description,
      date,
      startTime,
      endTime,
      color,
      createdAt: new Date().toISOString(),
    };
    setEvents((prev) => [...prev, newEvent]);
    return newEvent;
  }, []);

  const updateCalendarEvent = useCallback((id: string, updates: Partial<Omit<CalendarEvent, 'id' | 'createdAt'>>) => {
    setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, ...updates } : e)));
  }, []);

  const deleteCalendarEvent = useCallback((id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const clearAllEvents = useCallback(() => setEvents([]), []);

  // ── Settings Actions ───────────────────────────────
  const updateSettings = useCallback((newSettings: Partial<UserSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  }, []);

  // ── Calculated Live Metrics (High Efficiency) ─────────────
  const metrics = useMemo(() => {
    const today = getToday();

    // Habits calculation
    const habitsTotalToday = habits.length;
    const habitsCompletedToday = habits.filter((h) => h.completedDates.includes(today)).length;
    const habitCompletionRate = habitsTotalToday > 0 ? Math.round((habitsCompletedToday / habitsTotalToday) * 100) : 0;

    let maxCurrentStreak = 0;
    let maxLongestStreak = 0;
    habits.forEach((h) => {
      const { current, longest } = calculateStreak(h.completedDates);
      if (current > maxCurrentStreak) maxCurrentStreak = current;
      if (longest > maxLongestStreak) maxLongestStreak = longest;
    });

    // Tasks calculation
    const tasksTotal = tasks.length;
    const completedTasksList = tasks.filter((t) => t.status === 'done');
    const tasksCompleted = completedTasksList.length;
    const tasksPending = tasksTotal - tasksCompleted;

    // Fast string comparison avoids new Date() parsing in loop
    const tasksOverdue = tasks.filter((t) => t.status !== 'done' && t.dueDate && t.dueDate < today).length;
    const taskCompletionRate = tasksTotal > 0 ? Math.round((tasksCompleted / tasksTotal) * 100) : 0;

    const todayTasks = tasks.filter((t) => t.dueDate && t.dueDate.startsWith(today));

    const upcomingTasks = tasks
      .filter((t) => t.status !== 'done')
      .sort((a, b) => {
        const da = a.dueDate || '9999-12-31';
        const db = b.dueDate || '9999-12-31';
        return da.localeCompare(db);
      })
      .slice(0, 5);

    // Notes calculation
    const notesTotal = notes.length;
    const notesPinned = notes.filter((n) => n.isPinned).length;
    const recentNotes = [...notes]
      .sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''))
      .slice(0, 5);

    // Journal calculation
    const journalTodayEntry = journal.find((j) => j.date === today);
    const latestJournalEntry = [...journal]
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''))[0];

    // Events calculation
    const todayEvents = events
      .filter((e) => e.date === today)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));

    const upcomingEvents = events
      .filter((e) => e.date >= today)
      .sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime))
      .slice(0, 5);

    // Overall Productivity Score (0-100)
    const pTaskScore = taskCompletionRate * 0.5;
    const pHabitScore = habitCompletionRate * 0.4;
    const pJournalBonus = journalTodayEntry ? 10 : 0;
    const productivityScore = Math.min(100, Math.round(pTaskScore + pHabitScore + pJournalBonus));

    // Fast Weekly activity curve (last 7 days)
    const weeklyDays: string[] = [];
    const dayNames: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      weeklyDays.push(d.toISOString().split('T')[0]);
      dayNames.push(d.toLocaleDateString('en-US', { weekday: 'short' }));
    }

    const weeklyActivity = weeklyDays.map((isoDate, idx) => {
      const dayTasksCount = tasks.filter((t) => t.status === 'done' && t.completedAt && t.completedAt.startsWith(isoDate)).length;
      const dayHabitsCount = habits.filter((h) => h.completedDates.includes(isoDate)).length;
      const score = Math.min(100, (dayTasksCount * 25) + (dayHabitsCount * 20));
      return {
        day: dayNames[idx],
        tasks: dayTasksCount,
        habits: dayHabitsCount,
        score,
      };
    });

    // Unified real activity feed derived from actual user records
    const recentActivity: UnifiedActivityItem[] = [];

    habits.forEach((h) => {
      h.completedDates.forEach((dStr) => {
        const isToday = dStr === today;
        recentActivity.push({
          id: `act-h-${h.id}-${dStr}`,
          type: 'habit',
          title: `Completed habit: ${h.name}`,
          time: isToday ? 'Today' : safeFormatDate(dStr),
          timestamp: isToday ? Date.now() : new Date(dStr + 'T12:00:00').getTime(),
        });
      });
    });

    tasks.forEach((t) => {
      if (t.status === 'done' && t.completedAt) {
        recentActivity.push({
          id: `act-t-${t.id}`,
          type: 'task',
          title: `Finished task: ${t.title}`,
          time: safeFormatDate(t.completedAt),
          timestamp: new Date(t.completedAt).getTime(),
        });
      }
    });

    notes.forEach((n) => {
      const ts = n.updatedAt || n.createdAt;
      if (ts) {
        recentActivity.push({
          id: `act-n-${n.id}`,
          type: 'note',
          title: `Saved note: ${n.title}`,
          time: safeFormatDate(ts),
          timestamp: new Date(ts).getTime(),
        });
      }
    });

    journal.forEach((j) => {
      if (j.date) {
        const ts = j.updatedAt || j.createdAt || j.date;
        recentActivity.push({
          id: `act-j-${j.id}`,
          type: 'journal',
          title: `Logged journal entry (${j.mood || '😊'})`,
          time: safeFormatDate(j.date),
          timestamp: new Date(ts).getTime(),
        });
      }
    });

    events.forEach((e) => {
      const ts = e.createdAt || e.date;
      if (ts) {
        recentActivity.push({
          id: `act-e-${e.id}`,
          type: 'calendar',
          title: `Scheduled event: ${e.title}`,
          time: safeFormatDate(e.date),
          timestamp: new Date(ts).getTime(),
        });
      }
    });

    recentActivity.sort((a, b) => b.timestamp - a.timestamp);

    return {
      habitsCompletedToday,
      habitsTotalToday,
      habitCompletionRate,
      currentHabitStreak: maxCurrentStreak,
      longestHabitStreak: maxLongestStreak,

      tasksTotal,
      tasksCompleted,
      tasksPending,
      tasksOverdue,
      taskCompletionRate,
      todayTasks,
      upcomingTasks,

      notesTotal,
      notesPinned,
      recentNotes,

      journalTodayEntry,
      latestJournalEntry,

      todayEvents,
      upcomingEvents,

      productivityScore,
      weeklyActivity,
      recentActivity: recentActivity.slice(0, 6),
    };
  }, [habits, tasks, notes, journal, events]);

  // Memoized Context Value prevents unneeded consumer re-renders
  const contextValue = useMemo<LifeOSContextType>(
    () => ({
      habits,
      tasks,
      notes,
      journal,
      events,
      goals,
      expenses,
      pomodoroSessions,
      settings,
      isMounted,

      loadDemoData,
      clearDemoData,
      clearSectionData,

      addHabit,
      updateHabit,
      deleteHabit,
      toggleHabitCompletion,
      clearAllHabits,

      addTask,
      updateTask,
      deleteTask,
      toggleTaskStatus,
      clearAllTasks,

      addNote,
      updateNote,
      deleteNote,
      togglePinNote,
      clearAllNotes,

      saveJournalEntry,
      deleteJournalEntry,
      clearAllJournalEntries,

      addCalendarEvent,
      updateCalendarEvent,
      deleteCalendarEvent,
      clearAllEvents,

      updateSettings,
      metrics,
    }),
    [
      habits,
      tasks,
      notes,
      journal,
      events,
      goals,
      expenses,
      pomodoroSessions,
      settings,
      isMounted,
      loadDemoData,
      clearDemoData,
      clearSectionData,
      addHabit,
      updateHabit,
      deleteHabit,
      toggleHabitCompletion,
      clearAllHabits,
      addTask,
      updateTask,
      deleteTask,
      toggleTaskStatus,
      clearAllTasks,
      addNote,
      updateNote,
      deleteNote,
      togglePinNote,
      clearAllNotes,
      saveJournalEntry,
      deleteJournalEntry,
      clearAllJournalEntries,
      addCalendarEvent,
      updateCalendarEvent,
      deleteCalendarEvent,
      clearAllEvents,
      updateSettings,
      metrics,
    ]
  );

  return (
    <LifeOSContext.Provider value={contextValue}>
      {children}
    </LifeOSContext.Provider>
  );
}

export function useLifeOS() {
  const context = useContext(LifeOSContext);
  if (context === undefined) {
    throw new Error('useLifeOS must be used within a LifeOSProvider');
  }
  return context;
}

export function getLifeOSSnapshot(lifeOS: LifeOSContextType) {
  const { metrics, habits, tasks, notes, journal, events } = lifeOS;
  const today = getToday();

  return {
    habits: habits.map((h) => ({
      id: h.id,
      name: h.name,
      icon: h.icon,
      completedDates: h.completedDates,
      streak: calculateStreak(h.completedDates).current,
      bestStreak: calculateStreak(h.completedDates).longest,
      doneToday: h.completedDates.includes(today),
    })),
    completedHabitsToday: metrics.habitsCompletedToday,
    totalHabits: metrics.habitsTotalToday,
    habitCompletionRate: metrics.habitCompletionRate,
    currentStreak: metrics.currentHabitStreak,
    longestStreak: metrics.longestHabitStreak,

    tasks: tasks.map((t) => ({
      id: t.id,
      title: t.title,
      status: t.status,
      priority: t.priority,
      dueDate: t.dueDate,
      completedAt: t.completedAt,
    })),
    completedTasks: metrics.tasksCompleted,
    totalTasks: metrics.tasksTotal,
    pendingTasks: metrics.tasksPending,
    taskCompletionRate: metrics.taskCompletionRate,
    upcomingTasks: metrics.upcomingTasks,

    notes: notes.map((n) => ({
      id: n.id,
      title: n.title,
      folder: n.folder,
      isPinned: n.isPinned,
    })),
    notesTotal: metrics.notesTotal,
    pinnedNotes: metrics.notesPinned,

    journal: journal.map((j) => ({
      id: j.id,
      date: j.date,
      title: j.title,
      mood: j.mood,
    })),
    journalTodayEntry: metrics.journalTodayEntry,

    events: events.map((e) => ({
      id: e.id,
      title: e.title,
      date: e.date,
      startTime: e.startTime,
      endTime: e.endTime,
    })),
    upcomingEvents: metrics.upcomingEvents,

    productivityScore: metrics.productivityScore,
    weeklyActivity: metrics.weeklyActivity,
    recentActivity: metrics.recentActivity,
  };
}
