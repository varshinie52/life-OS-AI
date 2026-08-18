'use client';

import { useLocalStorage } from './useLocalStorage';
import { CalendarEvent } from '@/lib/types';
import { generateId } from '@/lib/utils';
import { useMemo } from 'react';

const DEFAULT_EVENTS: CalendarEvent[] = [
  {
    id: 'e1',
    title: 'Daily Standup',
    description: 'Sync with the engineering team.',
    date: new Date().toISOString().split('T')[0],
    startTime: '10:00',
    endTime: '10:30',
    color: '#008080', // accent primary
    createdAt: new Date().toISOString()
  },
  {
    id: 'e2',
    title: 'Design Review',
    description: 'Review the new dashboard mockups.',
    date: new Date().toISOString().split('T')[0],
    startTime: '13:30',
    endTime: '14:30',
    color: '#EF4444', // error / red
    createdAt: new Date().toISOString()
  }
];

export function useCalendar() {
  const [events, setEvents] = useLocalStorage<CalendarEvent[]>('lifeos_events', DEFAULT_EVENTS);

  const addEvent = (
    title: string,
    description: string,
    date: string,
    startTime: string,
    endTime: string,
    color: string = '#3B82F6'
  ) => {
    const newEvent: CalendarEvent = {
      id: generateId(),
      title,
      description,
      date,
      startTime,
      endTime,
      color,
      createdAt: new Date().toISOString()
    };
    setEvents((prev) => [...prev, newEvent]);
  };

  const updateEvent = (id: string, updates: Partial<Omit<CalendarEvent, 'id' | 'createdAt'>>) => {
    setEvents((prev) => prev.map(e => {
      if (e.id === id) {
        return { ...e, ...updates };
      }
      return e;
    }));
  };

  const deleteEvent = (id: string) => {
    setEvents((prev) => prev.filter(e => e.id !== id));
  };

  const getEventsByDate = (date: string) => {
    return events.filter(e => e.date === date).sort((a, b) => a.startTime.localeCompare(b.startTime));
  };

  return {
    events,
    addEvent,
    updateEvent,
    deleteEvent,
    getEventsByDate
  };
}
