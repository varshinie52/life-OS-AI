// ============================================================
// LifeOS — Core TypeScript Types
// ============================================================

// ── Habit Tracker ──────────────────────────────────────────

export interface Habit {
  id: string;
  name: string;
  icon: string;          // emoji
  color: string;         // hex color
  createdAt: string;     // ISO date
  completedDates: string[]; // ISO date strings (YYYY-MM-DD)
}

export interface HabitStats {
  currentStreak: number;
  longestStreak: number;
  totalCompletions: number;
  completionRate: number; // 0-100
}

// ── Tasks / Todo ───────────────────────────────────────────

export type TaskPriority = 'high' | 'medium' | 'low';
export type TaskStatus = 'todo' | 'in-progress' | 'done';

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  category: string;
  dueDate: string | null;  // ISO date
  createdAt: string;
  completedAt: string | null;
}

// ── Notes ──────────────────────────────────────────────────

export interface Note {
  id: string;
  title: string;
  content: string;
  folder: string;
  color: string;
  isPinned: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

// ── Journal ────────────────────────────────────────────────

export type Mood = '😄' | '😊' | '😐' | '😔' | '😢';

export interface JournalEntry {
  id: string;
  date: string;           // YYYY-MM-DD (one per day)
  mood: Mood;
  content: string;
  gratitude: string[];
  createdAt: string;
  updatedAt: string;
}

// ── Calendar ───────────────────────────────────────────────

export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  date: string;            // YYYY-MM-DD
  startTime: string;       // HH:mm
  endTime: string;         // HH:mm
  color: string;
  createdAt: string;
}

// ── Goals ──────────────────────────────────────────────────

export interface Milestone {
  id: string;
  title: string;
  completed: boolean;
}

export type GoalCategory = 'health' | 'career' | 'finance' | 'education' | 'personal' | 'other';

export interface Goal {
  id: string;
  title: string;
  description: string;
  category: GoalCategory;
  deadline: string | null;
  progress: number;         // 0–100
  milestones: Milestone[];
  createdAt: string;
}

// ── Expense Tracker ────────────────────────────────────────

export type ExpenseCategory =
  | 'food'
  | 'transport'
  | 'shopping'
  | 'entertainment'
  | 'health'
  | 'education'
  | 'bills'
  | 'other';

export interface Expense {
  id: string;
  amount: number;
  category: ExpenseCategory;
  description: string;
  date: string;             // YYYY-MM-DD
  createdAt: string;
}

// ── Pomodoro ───────────────────────────────────────────────

export interface PomodoroSession {
  id: string;
  type: 'work' | 'short-break' | 'long-break';
  duration: number;          // minutes
  completedAt: string;
  taskId?: string;
}

// ── Settings ───────────────────────────────────────────────

export interface UserSettings {
  userName: string;
  theme: 'dark' | 'light';
  currency: '₹' | '$' | '€' | '£';
  pomodoroWork: number;      // minutes
  pomodoroShortBreak: number;
  pomodoroLongBreak: number;
  monthlyBudget: number;
}

// ── Analytics ──────────────────────────────────────────────

export interface DayData {
  date: string;
  value: number;            // 0-4 intensity levels for heatmap
}

// ── App State ──────────────────────────────────────────────

export interface AppData {
  habits: Habit[];
  tasks: Task[];
  notes: Note[];
  journal: JournalEntry[];
  events: CalendarEvent[];
  goals: Goal[];
  expenses: Expense[];
  pomodoroSessions: PomodoroSession[];
  settings: UserSettings;
}
