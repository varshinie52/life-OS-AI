'use client';

import { useLifeOS } from '@/context/LifeOSContext';
import { useMemo } from 'react';

export function useJournal() {
  const { journal, saveJournalEntry, deleteJournalEntry } = useLifeOS();

  const getEntryByDate = (date: string) => {
    return journal.find(e => e.date === date);
  };

  const totalEntries = journal.length;
  const moodData = useMemo(() => {
    const counts: Record<string, number> = {};
    journal.forEach(e => {
      counts[e.mood] = (counts[e.mood] || 0) + 1;
    });
    return counts;
  }, [journal]);

  return {
    entries: journal,
    getEntryByDate,
    saveEntry: saveJournalEntry,
    deleteEntry: deleteJournalEntry,
    totalEntries,
    moodData,
  };
}
