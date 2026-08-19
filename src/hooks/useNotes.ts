'use client';

import { useLifeOS } from '@/context/LifeOSContext';
import { useMemo } from 'react';

export function useNotes() {
  const { notes, addNote, updateNote, deleteNote, togglePinNote } = useLifeOS();

  const folders = useMemo(() => {
    const f = new Set(notes.map(n => n.folder));
    return Array.from(f).sort();
  }, [notes]);

  const sortedNotes = useMemo(() => {
    return [...notes].sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }, [notes]);

  return {
    notes: sortedNotes,
    folders,
    addNote,
    updateNote,
    deleteNote,
    togglePin: togglePinNote,
  };
}
