"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  CheckCircle,
  Sparkles,
  Calendar,
  Target,
  DollarSign,
  FileText,
  BookOpen,
  Smile,
  Coffee,
  Activity,
  ArrowRight
} from 'lucide-react';
import styles from './page.module.css';
import { useAppContext } from '@/context/AppContext';
import { getGreeting, formatTime12h, getRelativeTime, formatCurrency } from '@/lib/utils';

export default function Home() {
  const { settings, isMounted } = useAppContext();
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  useEffect(() => {
    setCurrentTime(new Date());
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!isMounted) return null;

  const dateString = currentTime ? currentTime.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : '...';
  const timeString = currentTime ? formatTime12h(`${currentTime.getHours()}:${currentTime.getMinutes()}`) : '...';
  const greeting = getGreeting();
  const userName = settings.userName;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  return (
    <main className={styles.main}>
      <motion.header 
        className={styles.hero}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div>
          <h1 className={styles.greeting}>{greeting}, {userName}.</h1>
          <p className={styles.motivational}>"Build your future one focused day at a time."</p>
        </div>
        <div className={styles.heroStats}>
          <div className={styles.heroStat}>
            <span className={styles.heroStatLabel}>Today</span>
            <span className={styles.heroStatValue}>{dateString}</span>
          </div>
          <div className={styles.heroStat}>
            <span className={styles.heroStatLabel}>Time</span>
            <span className={styles.heroStatValue}>{timeString}</span>
          </div>
          <div className={styles.heroStat}>
            <span className={styles.heroStatLabel}>Productivity Score</span>
            <span className={styles.heroStatValue} style={{ color: 'var(--color-success)' }}>85</span>
          </div>
        </div>
      </motion.header>

      <motion.div 
        className={styles.bentoGrid}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        
        {/* Today's Focus (Tasks) */}
        <motion.div variants={itemVariants} className={`${styles.widget} ${styles.span6}`}>
          <div className={styles.widgetHeader}>
            <div className={styles.widgetTitle}><CheckCircle size={20} className={styles.widgetIcon} /> Today's Focus</div>
            <Link href="/tasks" className={styles.widgetLink}>Open Tasks <ArrowRight size={14} /></Link>
          </div>
          <div className={styles.taskList}>
            <div className={styles.taskItem}>
              <div className={styles.taskItemContent}>
                <input type="checkbox" className={styles.checkbox} />
                <span>Design Dashboard Hub</span>
              </div>
              <span className={`${styles.badge} ${styles.badgeHigh}`}>High</span>
            </div>
            <div className={styles.taskItem}>
              <div className={styles.taskItemContent}>
                <input type="checkbox" className={styles.checkbox} />
                <span>Review PR #42</span>
              </div>
              <span className={`${styles.badge} ${styles.badgeMedium}`}>Medium</span>
            </div>
            <div className={styles.taskItem}>
              <div className={styles.taskItemContent}>
                <input type="checkbox" className={styles.checkbox} defaultChecked />
                <span className={styles.taskCompleted}>Morning Exercise</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* AI Assistant Preview */}
        <motion.div variants={itemVariants} className={`${styles.widget} ${styles.span6} ${styles.aiCard}`}>
          <div className={styles.widgetHeader}>
            <div className={styles.widgetTitle}><Sparkles size={20} className={styles.widgetIcon} style={{color: 'var(--color-warning)'}} /> AI Assistant Insights</div>
            <Link href="/ai" className={styles.widgetLink}>Chat <ArrowRight size={14} /></Link>
          </div>
          <p className={styles.aiText}>
            <strong>Suggestion:</strong> You have 2 high-priority tasks and 4 hours until your next meeting. I recommend starting a 90-minute Pomodoro session now to complete "Design Dashboard Hub".
          </p>
          <button className="btn-primary" style={{ marginTop: 'auto', alignSelf: 'flex-start' }}>Start Focus Session</button>
        </motion.div>

        {/* Calendar Preview */}
        <motion.div variants={itemVariants} className={`${styles.widget} ${styles.span4}`}>
          <div className={styles.widgetHeader}>
            <div className={styles.widgetTitle}><Calendar size={20} className={styles.widgetIcon} /> Schedule</div>
            <Link href="/calendar" className={styles.widgetLink}>View <ArrowRight size={14} /></Link>
          </div>
          <div className={styles.miniList}>
            <div className={styles.miniListItem}>
              <span className={styles.timeLabel}>10:00 AM</span>
              <div className={styles.eventItem} style={{ borderLeftColor: 'var(--accent-primary)' }}>Daily Standup</div>
            </div>
            <div className={styles.miniListItem}>
              <span className={styles.timeLabel}>1:30 PM</span>
              <div className={styles.eventItem} style={{ borderLeftColor: 'var(--color-error)' }}>Design Review</div>
            </div>
            <div className={styles.miniListItem}>
              <span className={styles.timeLabel}>3:00 PM</span>
              <div className={styles.eventItem} style={{ borderLeftColor: 'var(--color-info)' }}>1:1 with Alex</div>
            </div>
          </div>
        </motion.div>

        {/* Habits Preview */}
        <motion.div variants={itemVariants} className={`${styles.widget} ${styles.span4}`}>
          <div className={styles.widgetHeader}>
            <div className={styles.widgetTitle}><Target size={20} className={styles.widgetIcon} /> Habits</div>
            <Link href="/habits" className={styles.widgetLink}>View <ArrowRight size={14} /></Link>
          </div>
          <div className={styles.progressRingWrapper}>
            <div className={styles.progressRing}>
              <span>75%</span>
            </div>
          </div>
          <div className={styles.progressText}>
            3 of 4 completed today
          </div>
        </motion.div>

        {/* Expense Preview */}
        <motion.div variants={itemVariants} className={`${styles.widget} ${styles.span4}`}>
          <div className={styles.widgetHeader}>
            <div className={styles.widgetTitle}><DollarSign size={20} className={styles.widgetIcon} /> Expenses</div>
            <Link href="/expenses" className={styles.widgetLink}>View <ArrowRight size={14} /></Link>
          </div>
          <div className={styles.expenseLarge}>
            {formatCurrency(1250, settings.currency)}
          </div>
          <span className={styles.expenseLabel}>Spent Today</span>
          
          <div className={styles.progressBarContainer}>
            <motion.div 
              className={styles.progressBarFill} 
              initial={{ width: 0 }}
              animate={{ width: '25%' }}
              transition={{ duration: 1, delay: 0.5 }}
            />
          </div>
          <div className={styles.expenseFooter}>
            <span>{formatCurrency(12500, settings.currency)} spent</span>
            <span>{formatCurrency(settings.monthlyBudget, settings.currency)} budget</span>
          </div>
        </motion.div>

        {/* Notes Preview */}
        <motion.div variants={itemVariants} className={`${styles.widget} ${styles.span6}`}>
          <div className={styles.widgetHeader}>
            <div className={styles.widgetTitle}><FileText size={20} className={styles.widgetIcon} /> Recent Notes</div>
            <Link href="/notes" className={styles.widgetLink}>View <ArrowRight size={14} /></Link>
          </div>
          <div className={styles.miniList}>
            <div className={styles.noteCard}>
              <strong>Project Ideas</strong>
              <span className={styles.noteTime}>{getRelativeTime(new Date().toISOString())}</span>
            </div>
            <div className={styles.noteCard}>
              <strong>Weekly Meeting Notes</strong>
              <span className={styles.noteTime}>Yesterday</span>
            </div>
          </div>
        </motion.div>

        {/* Reading Tracker */}
        <motion.div variants={itemVariants} className={`${styles.widget} ${styles.span3}`}>
          <div className={styles.widgetHeader}>
            <div className={styles.widgetTitle}><BookOpen size={20} className={styles.widgetIcon} /> Reading</div>
          </div>
          <div className={styles.trackerTitle}>Atomic Habits</div>
          <span className={styles.trackerSubtitle}>Page 120 / 320</span>
          <div className={styles.progressBarContainer}>
            <motion.div 
              className={styles.progressBarFill} 
              initial={{ width: 0 }}
              animate={{ width: '38%' }}
              transition={{ duration: 1, delay: 0.6 }}
            />
          </div>
        </motion.div>

        {/* Goals Tracker */}
        <motion.div variants={itemVariants} className={`${styles.widget} ${styles.span3}`}>
          <div className={styles.widgetHeader}>
            <div className={styles.widgetTitle}><Target size={20} className={styles.widgetIcon} /> Goal</div>
          </div>
          <div className={styles.trackerTitle}>Launch SaaS MVP</div>
          <span className={styles.trackerSubtitle}>Milestone 2</span>
          <div className={styles.progressBarContainer}>
            <motion.div 
              className={styles.progressBarFill} 
              initial={{ width: 0 }}
              animate={{ width: '60%' }}
              transition={{ duration: 1, delay: 0.7 }}
            />
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div variants={itemVariants} className={`${styles.widget} ${styles.span4}`}>
          <div className={styles.widgetHeader}>
            <div className={styles.widgetTitle}>Quick Actions</div>
          </div>
          <div className={styles.quickActionsGrid}>
            <button className={styles.actionBtn}>+ Task</button>
            <button className={styles.actionBtn}>+ Note</button>
            <button className={styles.actionBtn}>+ Expense</button>
            <button className={styles.actionBtn}>+ Habit</button>
          </div>
        </motion.div>

        {/* Mood & Focus & Analytics Bottom Row */}
        <motion.div variants={itemVariants} className={`${styles.widget} ${styles.span4}`}>
          <div className={styles.widgetHeader}>
            <div className={styles.widgetTitle}><Coffee size={20} className={styles.widgetIcon} /> Focus Mode</div>
          </div>
          <div className={styles.timerDisplay}>25:00</div>
          <div className={styles.timerActions}>
            <button className="btn-primary" style={{ padding: '8px 24px' }}>Start</button>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className={`${styles.widget} ${styles.span4}`}>
          <div className={styles.widgetHeader}>
            <div className={styles.widgetTitle}><Smile size={20} className={styles.widgetIcon} /> Mood</div>
          </div>
          <div className={styles.moodSelector}>
            <button className={styles.moodBtnActive}>😊</button>
            <button className={styles.moodBtn}>😐</button>
            <button className={styles.moodBtn}>😔</button>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className={`${styles.widget} ${styles.span4}`}>
          <div className={styles.widgetHeader}>
            <div className={styles.widgetTitle}><Activity size={20} className={styles.widgetIcon} /> Activity</div>
          </div>
          <div className={styles.activityList}>
            <div className={styles.activityItem}>
              <span className={styles.activityDot} style={{ background: 'var(--color-success)' }}></span>
              Completed "Morning Exercise"
            </div>
            <div className={styles.activityItem}>
              <span className={styles.activityDot} style={{ background: 'var(--color-warning)' }}></span>
              Added Expense: Coffee ({formatCurrency(450, settings.currency)})
            </div>
            <div className={styles.activityItem}>
              <span className={styles.activityDot} style={{ background: 'var(--accent-primary)' }}></span>
              Finished 25m Focus Session
            </div>
          </div>
        </motion.div>

      </motion.div>
    </main>
  );
}
