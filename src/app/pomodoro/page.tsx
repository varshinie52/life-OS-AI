"use client";

import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, Square, SkipForward, Coffee, Brain, Moon } from 'lucide-react';
import styles from './page.module.css';
import { usePomodoro, TimerMode } from '@/hooks/usePomodoro';
import { useAppContext } from '@/context/AppContext';

export default function PomodoroPage() {
  const { isMounted } = useAppContext();
  const { mode, timeLeft, isRunning, progress, switchMode, toggleTimer, resetTimer } = usePomodoro();

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Update document title with timer
  useEffect(() => {
    if (isRunning) {
      document.title = `${formatTime(timeLeft)} - ${mode === 'work' ? 'Focus' : 'Break'} | LifeOS`;
    } else {
      document.title = 'LifeOS';
    }
    return () => { document.title = 'LifeOS'; };
  }, [timeLeft, isRunning, mode]);

  if (!isMounted) return null;

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Pomodoro</h1>
          <p className={styles.subtitle}>Master your time with focused work sessions.</p>
        </div>
      </header>

      <div className={styles.timerContainer}>
        <div className={styles.timerWrapper}>
          
          {/* Mode Selector */}
          <div className={styles.modeSelector}>
            <button 
              className={`${styles.modeBtn} ${mode === 'work' ? styles.activeMode : ''}`}
              onClick={() => switchMode('work')}
            >
              <Brain size={18} /> Focus
            </button>
            <button 
              className={`${styles.modeBtn} ${mode === 'short-break' ? styles.activeMode : ''}`}
              onClick={() => switchMode('short-break')}
            >
              <Coffee size={18} /> Short Break
            </button>
            <button 
              className={`${styles.modeBtn} ${mode === 'long-break' ? styles.activeMode : ''}`}
              onClick={() => switchMode('long-break')}
            >
              <Moon size={18} /> Long Break
            </button>
          </div>

          {/* Circular Timer Display */}
          <div className={styles.circleContainer}>
            <svg className={styles.svgCircle} viewBox="0 0 100 100">
              {/* Background track */}
              <circle 
                cx="50" cy="50" r="45" 
                fill="none" 
                stroke="var(--border-subtle)" 
                strokeWidth="2"
              />
              {/* Progress ring */}
              <motion.circle 
                cx="50" cy="50" r="45" 
                fill="none" 
                stroke={mode === 'work' ? 'var(--color-error)' : 'var(--color-info)'} 
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray="283"
                initial={{ strokeDashoffset: 283 }}
                animate={{ strokeDashoffset: 283 - (283 * progress) / 100 }}
                transition={{ duration: 1, ease: 'linear' }}
                transform="rotate(-90 50 50)"
              />
            </svg>
            
            <div className={styles.timeDisplay}>
              {formatTime(timeLeft)}
            </div>
          </div>

          {/* Controls */}
          <div className={styles.controls}>
            <button className={styles.controlBtn} onClick={resetTimer} title="Stop & Reset">
              <Square size={24} fill="currentColor" />
            </button>
            
            <button className={styles.playBtn} onClick={toggleTimer}>
              {isRunning ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" style={{ marginLeft: '4px' }} />}
            </button>
            
            <button 
              className={styles.controlBtn} 
              onClick={() => switchMode(mode === 'work' ? 'short-break' : 'work')}
              title="Skip"
            >
              <SkipForward size={24} fill="currentColor" />
            </button>
          </div>

        </div>
      </div>
    </main>
  );
}
