"use client";

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Square, SkipForward, ArrowLeft, CheckCircle, Circle, Brain } from 'lucide-react';
import styles from './page.module.css';
import { usePomodoro } from '@/hooks/usePomodoro';
import { useTasks } from '@/hooks/useTasks';
import { useAppContext } from '@/context/AppContext';
import Link from 'next/link';

export default function FocusModePage() {
  const { isMounted } = useAppContext();
  const { mode, timeLeft, isRunning, progress, switchMode, toggleTimer, resetTimer } = usePomodoro();
  const { activeTasks, toggleTaskStatus } = useTasks();

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (isRunning) {
      document.title = `(Focus) ${formatTime(timeLeft)} | LifeOS`;
    } else {
      document.title = 'Focus Mode | LifeOS';
    }
    return () => { document.title = 'LifeOS'; };
  }, [timeLeft, isRunning]);

  if (!isMounted) return null;

  return (
    <main className={styles.main}>
      {/* Dynamic Background based on mode */}
      <div 
        className={styles.background} 
        style={{ 
          background: mode === 'work' 
            ? 'radial-gradient(circle at center, rgba(16, 185, 129, 0.05) 0%, transparent 70%)' 
            : 'radial-gradient(circle at center, rgba(59, 130, 246, 0.05) 0%, transparent 70%)'
        }} 
      />

      <Link href="/" className={styles.backBtn}>
        <ArrowLeft size={20} /> Exit Focus
      </Link>

      <div className={styles.layout}>
        {/* Timer Section */}
        <div className={styles.timerSection}>
          <div className={styles.modeIndicator}>
            <Brain size={20} /> {mode === 'work' ? 'Deep Work' : 'Break Time'}
          </div>

          <div className={styles.circleContainer}>
            <svg className={styles.svgCircle} viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="none" stroke="var(--border-subtle)" strokeWidth="1" />
              <motion.circle 
                cx="50" cy="50" r="45" 
                fill="none" 
                stroke={mode === 'work' ? 'var(--color-success)' : 'var(--color-info)'} 
                strokeWidth="2"
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

          <div className={styles.controls}>
            <button className={styles.controlBtn} onClick={resetTimer} title="Stop & Reset">
              <Square size={24} fill="currentColor" />
            </button>
            <button className={styles.playBtn} onClick={toggleTimer} style={{ background: mode === 'work' ? 'var(--color-success)' : 'var(--color-info)' }}>
              {isRunning ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" style={{ marginLeft: '4px' }} />}
            </button>
            <button className={styles.controlBtn} onClick={() => switchMode(mode === 'work' ? 'short-break' : 'work')} title="Skip">
              <SkipForward size={24} fill="currentColor" />
            </button>
          </div>
        </div>

        {/* Tasks Section */}
        <div className={styles.tasksSection}>
          <h2 className={styles.tasksTitle}>Priority Tasks</h2>
          <div className={styles.taskList}>
            <AnimatePresence>
              {activeTasks.slice(0, 5).map(task => (
                <motion.div 
                  key={task.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={styles.taskCard}
                >
                  <button className={styles.checkBtn} onClick={() => toggleTaskStatus(task.id)}>
                    <Circle size={24} className={styles.uncheckedIcon} />
                  </button>
                  <div className={styles.taskInfo}>
                    <span className={styles.taskTitle}>{task.title}</span>
                    {task.description && <span className={styles.taskDesc}>{task.description}</span>}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {activeTasks.length === 0 && (
              <p className={styles.emptyTasks}>No active tasks. You're all caught up!</p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
