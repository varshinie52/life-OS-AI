'use client';

import { useLocalStorage } from './useLocalStorage';
import { JournalEntry, Mood } from '@/lib/types';
import { generateId, getToday } from '@/lib/utils';
import { useMemo } from 'react';

export function useJournal() {
  const [entries, setEntries] = useLocalStorage<JournalEntry[]>('lifeos_journal', []);

  // Get entry for a specific date, or undefined if it doesn't exist
  const getEntryByDate = (date: string) => {
    return entries.find(e => e.date === date);
  };

  const saveEntry = (date: string, content: string, mood: Mood, gratitude: string[]) => {
    setEntries((prev) => {
      const existingIndex = prev.findIndex(e => e.date === date);
      
      if (existingIndex >= 0) {
        // Update existing entry
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          content,
          mood,
          gratitude,
          updatedAt: new Date().toISOString()
        };
        return updated;
      } else {
        // Create new entry
        const newEntry: JournalEntry = {
          id: generateId(),
          date,
          content,
          mood,
          gratitude,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        return [...prev, newEntry];
      }
    });
  };

  // Helper selectors
  const totalEntries = entries.length;
  const moodData = useMemo(() => {
    const counts: Record<string, number> = {};
    entries.forEach(e => {
      counts[e.mood] = (counts[e.mood] || 0) + 1;
    });
    return counts;
  }, [entries]);

  return {
    entries,
    getEntryByDate,
    saveEntry,
    totalEntries,
    moodData
  };
}
