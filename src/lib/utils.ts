// ============================================================
// LifeOS — Utility Functions
// ============================================================

/** Generate a unique ID */
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

/** Get today's date as YYYY-MM-DD */
export function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

/** Safe date formatting helper to guarantee NO 'Invalid Date' output */
export function safeFormatDate(
  dateInput: string | number | Date | null | undefined,
  fallback = 'No date',
  options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' }
): string {
  if (!dateInput) return fallback;
  try {
    let dateObj: Date;
    if (dateInput instanceof Date) {
      dateObj = dateInput;
    } else if (typeof dateInput === 'number') {
      dateObj = new Date(dateInput);
    } else if (typeof dateInput === 'string') {
      const trimmed = dateInput.trim();
      if (!trimmed) return fallback;
      
      // Check for YYYY-MM-DD
      if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
        const [y, m, d] = trimmed.split('-').map(Number);
        dateObj = new Date(y, m - 1, d);
      } else if (/^\d{2}:\d{2}/.test(trimmed)) {
        // Pure time string like "09:00"
        return formatTime12h(trimmed);
      } else {
        dateObj = new Date(trimmed);
      }
    } else {
      return fallback;
    }

    if (isNaN(dateObj.getTime())) {
      return fallback;
    }
    return dateObj.toLocaleDateString('en-US', options);
  } catch {
    return fallback;
  }
}

/** Format date to readable string */
export function formatDate(dateStr: string | null | undefined): string {
  return safeFormatDate(dateStr, 'No date', { month: 'short', day: 'numeric', year: 'numeric' });
}

/** Format date to short string */
export function formatDateShort(dateStr: string | null | undefined): string {
  return safeFormatDate(dateStr, 'No date', { month: 'short', day: 'numeric' });
}

/** Get time-based greeting */
export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

/** Format time (HH:mm or ISO) safely to 12h */
export function formatTime12h(timeInput: string | null | undefined): string {
  if (!timeInput) return 'No time';
  try {
    const trimmed = timeInput.trim();
    if (trimmed.includes('T')) {
      const d = new Date(trimmed);
      if (!isNaN(d.getTime())) {
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
    }
    if (trimmed.includes(':')) {
      const parts = trimmed.split(':');
      const h = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10);
      if (!isNaN(h) && !isNaN(m)) {
        const period = h >= 12 ? 'PM' : 'AM';
        const hour12 = h % 12 || 12;
        return `${hour12}:${m.toString().padStart(2, '0')} ${period}`;
      }
    }
    return trimmed;
  } catch {
    return 'No time';
  }
}

/** Calculate streak from array of date strings */
export function calculateStreak(dates: string[]): { current: number; longest: number } {
  if (dates.length === 0) return { current: 0, longest: 0 };

  const sorted = [...dates].sort().reverse();
  const today = getToday();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  let current = 0;
  let longest = 0;
  let tempStreak = 1;

  // Current streak: must include today or yesterday
  if (sorted[0] === today || sorted[0] === yesterdayStr) {
    current = 1;
    for (let i = 1; i < sorted.length; i++) {
      const prev = new Date(sorted[i - 1] + 'T00:00:00');
      const curr = new Date(sorted[i] + 'T00:00:00');
      const diff = (prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24);
      if (diff === 1) {
        current++;
      } else {
        break;
      }
    }
  }

  // Longest streak
  const ascending = [...dates].sort();
  tempStreak = 1;
  longest = 1;
  for (let i = 1; i < ascending.length; i++) {
    const prev = new Date(ascending[i - 1] + 'T00:00:00');
    const curr = new Date(ascending[i] + 'T00:00:00');
    const diff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
    if (diff === 1) {
      tempStreak++;
      longest = Math.max(longest, tempStreak);
    } else if (diff > 1) {
      tempStreak = 1;
    }
  }

  return { current, longest: Math.max(longest, current) };
}

/** Get all dates in a month as YYYY-MM-DD */
export function getDaysInMonth(year: number, month: number): string[] {
  const days: string[] = [];
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    days.push(date.toISOString().split('T')[0]);
  }
  return days;
}

/** Get the day of week (0=Sun) for first day of month */
export function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

/** Get week number of year */
export function getWeekNumber(dateStr: string): number {
  const date = new Date(dateStr + 'T00:00:00');
  const start = new Date(date.getFullYear(), 0, 1);
  const diff = date.getTime() - start.getTime();
  const oneWeek = 1000 * 60 * 60 * 24 * 7;
  return Math.ceil((diff / oneWeek) + 1);
}

/** Format currency */
export function formatCurrency(amount: number, currency: string = '₹'): string {
  return `${currency}${amount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

/** Get relative time string */
export function getRelativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diff = now.getTime() - date.getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return formatDateShort(dateStr.split('T')[0]);
}

/** Clamp number between min and max */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** Get last N days as YYYY-MM-DD array */
export function getLastNDays(n: number): string[] {
  const days: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().split('T')[0]);
  }
  return days;
}

/** Day names short */
export const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** Month names */
export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

/** Month names short */
export const MONTH_NAMES_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

/** Expense category config */
export const EXPENSE_CATEGORIES: Record<string, { icon: string; color: string }> = {
  food: { icon: '🍕', color: '#f97316' },
  transport: { icon: '🚗', color: '#3b82f6' },
  shopping: { icon: '🛍️', color: '#ec4899' },
  entertainment: { icon: '🎮', color: '#8b5cf6' },
  health: { icon: '💊', color: '#10b981' },
  education: { icon: '📚', color: '#06b6d4' },
  bills: { icon: '📄', color: '#f59e0b' },
  other: { icon: '📦', color: '#6b7280' },
};

import { Theme, Currency } from './types';

/** Default user settings */
export const DEFAULT_SETTINGS = {
  userName: 'User',
  theme: 'dark' as Theme,
  currency: '₹' as Currency,
  pomodoroWork: 25,
  pomodoroShortBreak: 5,
  pomodoroLongBreak: 15,
  monthlyBudget: 50000,
};
