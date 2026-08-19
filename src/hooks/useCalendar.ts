'use client';

import { useLifeOS } from '@/context/LifeOSContext';

export function useCalendar() {
  const { events, addCalendarEvent, updateCalendarEvent, deleteCalendarEvent } = useLifeOS();

  const getEventsByDate = (date: string) => {
    return events.filter(e => e.date === date).sort((a, b) => a.startTime.localeCompare(b.startTime));
  };

  return {
    events,
    addEvent: addCalendarEvent,
    updateEvent: updateCalendarEvent,
    deleteEvent: deleteCalendarEvent,
    getEventsByDate,
  };
}
