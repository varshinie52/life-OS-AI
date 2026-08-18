'use client';

import { useLocalStorage } from './useLocalStorage';
import { Note } from '@/lib/types';
import { generateId } from '@/lib/utils';
import { useMemo } from 'react';

const DEFAULT_NOTES: Note[] = [
  {
    id: 'n1',
    title: 'Project Ideas 2026',
    content: '1. AI-powered habit tracker\n2. Next-gen personal CRM\n3. Markdown-based writing tool\n\nNeed to research the market for these before starting.',
    folder: 'Ideas',
    color: '#008080',
    isPinned: true,
    tags: ['startup', 'planning'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'n2',
    title: 'Weekly Meeting Notes',
    content: 'Discussed Q3 roadmap. Key priorities:\n- Launch new dashboard\n- Refactor auth system\n- Hire 2 more frontend devs',
    folder: 'Work',
    color: '#3B82F6',
    isPinned: false,
    tags: ['meeting', 'q3'],
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString()
  }
];

export function useNotes() {
  const [notes, setNotes] = useLocalStorage<Note[]>('lifeos_notes', DEFAULT_NOTES);

  const addNote = (title: string, content: string, folder: string = 'General', color: string = '#008080') => {
    const newNote: Note = {
      id: generateId(),
      title: title || 'Untitled Note',
      content,
      folder,
      color,
      isPinned: false,
      tags: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setNotes((prev) => [newNote, ...prev]);
  };

  const updateNote = (id: string, updates: Partial<Omit<Note, 'id' | 'createdAt'>>) => {
    setNotes((prev) => prev.map(n => {
      if (n.id === id) {
        return { ...n, ...updates, updatedAt: new Date().toISOString() };
      }
      return n;
    }));
  };

  const deleteNote = (id: string) => {
    setNotes((prev) => prev.filter(n => n.id !== id));
  };

  const togglePin = (id: string) => {
    setNotes((prev) => prev.map(n => n.id === id ? { ...n, isPinned: !n.isPinned } : n));
  };

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
    togglePin
  };
}
