'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { PomodoroSession } from '@/lib/types';
import { generateId } from '@/lib/utils';
import { useAppContext } from '@/context/AppContext';

export type TimerMode = 'work' | 'short-break' | 'long-break';

export function usePomodoro() {
  const { settings } = useAppContext();
  const [sessions, setSessions] = useLocalStorage<PomodoroSession[]>('lifeos_pomodoro', []);
  
  const [mode, setMode] = useState<TimerMode>('work');
  const [timeLeft, setTimeLeft] = useState(settings.pomodoroWork * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [completedSessions, setCompletedSessions] = useState(0);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Update timer if settings change and we're not running
  useEffect(() => {
    if (!isRunning) {
      if (mode === 'work') setTimeLeft(settings.pomodoroWork * 60);
      if (mode === 'short-break') setTimeLeft(settings.pomodoroShortBreak * 60);
      if (mode === 'long-break') setTimeLeft(settings.pomodoroLongBreak * 60);
    }
  }, [settings, mode, isRunning]);

  const switchMode = useCallback((newMode: TimerMode) => {
    setMode(newMode);
    setIsRunning(false);
    if (timerRef.current) clearInterval(timerRef.current);
    
    if (newMode === 'work') setTimeLeft(settings.pomodoroWork * 60);
    if (newMode === 'short-break') setTimeLeft(settings.pomodoroShortBreak * 60);
    if (newMode === 'long-break') setTimeLeft(settings.pomodoroLongBreak * 60);
  }, [settings]);

  const saveSession = useCallback(() => {
    const duration = mode === 'work' 
      ? settings.pomodoroWork 
      : mode === 'short-break' 
        ? settings.pomodoroShortBreak 
        : settings.pomodoroLongBreak;

    const session: PomodoroSession = {
      id: generateId(),
      type: mode,
      duration,
      completedAt: new Date().toISOString()
    };
    setSessions(prev => [...prev, session]);
  }, [mode, settings, setSessions]);

  const handleTimerComplete = useCallback(() => {
    setIsRunning(false);
    if (timerRef.current) clearInterval(timerRef.current);
    
    saveSession();
    
    // Play sound logic would go here
    const audio = new Audio('/notification.mp3');
    audio.play().catch(e => console.log('Audio play failed', e));

    if (mode === 'work') {
      const newCompleted = completedSessions + 1;
      setCompletedSessions(newCompleted);
      
      if (newCompleted % 4 === 0) {
        switchMode('long-break');
      } else {
        switchMode('short-break');
      }
    } else {
      switchMode('work');
    }
  }, [mode, completedSessions, saveSession, switchMode]);

  const toggleTimer = () => {
    if (isRunning) {
      setIsRunning(false);
      if (timerRef.current) clearInterval(timerRef.current);
    } else {
      setIsRunning(true);
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  };

  const resetTimer = () => {
    setIsRunning(false);
    if (timerRef.current) clearInterval(timerRef.current);
    switchMode(mode);
  };

  // Cleanup
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const progress = useMemo(() => {
    let total = 0;
    if (mode === 'work') total = settings.pomodoroWork * 60;
    if (mode === 'short-break') total = settings.pomodoroShortBreak * 60;
    if (mode === 'long-break') total = settings.pomodoroLongBreak * 60;
    return ((total - timeLeft) / total) * 100;
  }, [timeLeft, mode, settings]);

  return {
    mode,
    timeLeft,
    isRunning,
    progress,
    sessions,
    switchMode,
    toggleTimer,
    resetTimer
  };
}
