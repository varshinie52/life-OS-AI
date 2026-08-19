'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  CheckSquare, 
  Repeat, 
  FileText, 
  Flame, 
  TrendingUp, 
  Clock, 
  Sparkles, 
  ArrowUpRight, 
  Plus, 
  RefreshCw, 
  CheckCircle2, 
  Circle, 
  Calendar as CalendarIcon,
  ChevronRight,
  Zap,
  Activity,
  Brain,
  ExternalLink,
  Loader2
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip 
} from 'recharts';
import { useAuth } from '@/context/AuthContext';
import { useLifeOS, getLifeOSSnapshot } from '@/context/LifeOSContext';
import MarkdownRenderer from '@/components/ui/AIChatWidget/MarkdownRenderer';
import styles from './page.module.css';

const MOTIVATIONAL_QUOTES = [
  { quote: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { quote: "It always seems impossible until it's done.", author: "Nelson Mandela" },
  { quote: "Small daily improvements over time lead to stunning results.", author: "Robin Sharma" },
  { quote: "Focus on being productive instead of busy.", author: "Tim Ferriss" },
  { quote: "You don't have to be great to start, but you have to start to be great.", author: "Zig Ziglar" },
  { quote: "Action is the foundational key to all success.", author: "Pablo Picasso" },
  { quote: "Your future is created by what you do today, not tomorrow.", author: "Robert Kiyosaki" },
  { quote: "Done is better than perfect.", author: "Sheryl Sandberg" }
];

const LiveTimeClock = React.memo(function LiveTimeClock({ className }: { className?: string }) {
  const [time, setTime] = useState('');
  useEffect(() => {
    const update = () => {
      setTime(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);
  return <span className={className} style={{ fontFamily: 'var(--font-mono, monospace)' }}>{time || '--:--:--'}</span>;
});

export default function DashboardPage() {
  const { user, authFetch } = useAuth();
  const lifeOS = useLifeOS();
  const { metrics, toggleTaskStatus, isMounted } = lifeOS;

  const [quoteIndex, setQuoteIndex] = useState(0);
  const [dailyBrief, setDailyBrief] = useState<string | null>(null);
  const [briefLoading, setBriefLoading] = useState(false);
  const [briefExpanded, setBriefExpanded] = useState(false);

  const currentDate = useMemo(() => {
    return new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  }, []);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

  const fetchDailyBrief = useCallback(async () => {
    if (dailyBrief || briefLoading) return;
    setBriefLoading(true);
    try {
      const snapshot = getLifeOSSnapshot(lifeOS);
      const res = await authFetch(`${API_URL}/ai/daily-brief`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context: snapshot }),
      });
      if (res.ok) {
        const d = await res.json();
        if (d.success) setDailyBrief(d.data.briefing);
      }
    } catch {
      // Fallback AI brief computed locally from live metrics
      setDailyBrief(
        `### Today's LifeOS Brief ☀️\n\n` +
        `* **Tasks:** You have completed **${metrics.tasksCompleted}** of **${metrics.tasksTotal}** tasks (${metrics.taskCompletionRate}% completion).\n` +
        `* **Habits:** **${metrics.habitsCompletedToday}** of **${metrics.habitsTotalToday}** habits logged today.\n` +
        `* **Streak:** Active habit streak is **${metrics.currentHabitStreak} days** 🔥.\n` +
        `* **Focus Tip:** Tackle your highest priority upcoming task next to maintain velocity!`
      );
    } finally {
      setBriefLoading(false);
    }
  }, [authFetch, dailyBrief, briefLoading, API_URL, metrics, lifeOS]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const handleNextQuote = () => {
    setQuoteIndex((prev) => (prev + 1) % MOTIVATIONAL_QUOTES.length);
  };

  const currentQuote = MOTIVATIONAL_QUOTES[quoteIndex];
  const userName = user?.name || 'User';

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1, 
      transition: { duration: 0.15 } 
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 8 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: 'easeOut' as const } }
  };

  return (
    <main className={styles.main}>
      {/* Hero Section */}
      <motion.div 
        className={styles.hero}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div>
          <h1 className={styles.greeting}>
            {getGreeting()}, {userName.split(' ')[0]} 👋
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.25rem' }}>
            <span className={styles.motivational}>
              <Clock size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: '-2px', color: 'var(--accent-primary)' }} />
              {currentDate}
            </span>
          </div>
        </div>

        <div className={styles.heroStats}>
          <div className={styles.heroStat}>
            <span className={styles.heroStatLabel}>Live Time</span>
            <LiveTimeClock className={styles.heroStatValue} />
          </div>
          <div className={styles.heroStat}>
            <span className={styles.heroStatLabel}>Current Streak</span>
            <span className={styles.heroStatValue} style={{ color: 'var(--moss)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Flame size={20} fill="var(--moss)" /> {metrics.currentHabitStreak} Days
            </span>
          </div>
        </div>
      </motion.div>

      {/* Motivational Quote Banner */}
      <motion.div 
        className={`${styles.widget} ${styles.aiCard}`}
        style={{ marginBottom: '24px', background: 'var(--sand)', color: 'var(--forest)', border: 'none' }}
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <div className={styles.widgetHeader} style={{ marginBottom: '8px' }}>
          <span className={styles.widgetTitle} style={{ fontSize: '0.9rem', color: 'var(--forest)' }}>
            <Sparkles size={16} /> Daily Inspiration
          </span>
          <button 
            onClick={handleNextQuote} 
            className={styles.widgetLink} 
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--forest)' }}
            title="Get another quote"
          >
            <RefreshCw size={14} /> Refresh Quote
          </button>
        </div>
        <p className={styles.aiText} style={{ fontSize: '1.05rem', fontStyle: 'italic', marginBottom: '4px', fontWeight: 500, color: 'var(--forest)' }}>
          "{currentQuote.quote}"
        </p>
        <span style={{ fontSize: '0.85rem', color: 'var(--earth)', fontWeight: 600 }}>
          — {currentQuote.author}
        </span>
      </motion.div>

      {/* Daily AI Brief */}
      <motion.div
        className={`${styles.widget} ${styles.aiCard}`}
        style={{ marginBottom: '24px' }}
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: 0.15 }}
      >
        <div className={styles.widgetHeader} style={{ marginBottom: '8px' }}>
          <span className={styles.widgetTitle} style={{ fontSize: '0.9rem', color: 'var(--moss)' }}>
            <Brain size={16} /> Daily AI Brief
          </span>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {dailyBrief && (
              <button
                onClick={() => setBriefExpanded((v) => !v)}
                className={styles.widgetLink}
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              >
                {briefExpanded ? 'Collapse' : 'Expand'}
              </button>
            )}
            <Link href="/ai" className={styles.widgetLink} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              Full AI <ExternalLink size={12} />
            </Link>
            {!dailyBrief && (
              <button
                onClick={fetchDailyBrief}
                className={styles.widgetLink}
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                disabled={briefLoading}
              >
                {briefLoading ? (
                  <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                ) : (
                  <>✨ Generate</>
                )}
              </button>
            )}
          </div>
        </div>

        {!dailyBrief && !briefLoading && (
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', margin: 0 }}>
            Click <strong>Generate</strong> for an AI-powered brief based on your real data today.
          </p>
        )}

        {briefLoading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            <Loader2 size={16} style={{ animation: 'spin 1s linear infinite', color: 'var(--accent-primary)' }} />
            Analyzing your LifeOS data…
          </div>
        )}

        {dailyBrief && (
          <div style={{ maxHeight: briefExpanded ? 'none' : '80px', overflow: 'hidden', position: 'relative' }}>
            <MarkdownRenderer content={dailyBrief} />
            {!briefExpanded && (
              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                height: '32px',
                background: 'linear-gradient(transparent, var(--surface-card))',
              }} />
            )}
          </div>
        )}
      </motion.div>

      <motion.div 
        className={styles.bentoGrid}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Metric Card 1: Today's Tasks */}
        <motion.div className={`${styles.widget} ${styles.span3}`} variants={cardVariants}>
          <div className={styles.widgetHeader}>
            <span className={styles.widgetTitle}>
              <CheckSquare size={20} className={styles.widgetIcon} /> Tasks
            </span>
            <Link href="/tasks" className={styles.widgetLink}>
              View All <ArrowUpRight size={14} />
            </Link>
          </div>
          {!isMounted ? (
            <div style={{ height: '60px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', animation: 'pulse 1.5s infinite' }} />
          ) : (
            <>
              <div style={{ fontSize: '2.2rem', fontWeight: 700, margin: '4px 0' }}>
                {metrics.tasksCompleted} / {metrics.tasksTotal}
              </div>
              <span className={styles.trackerSubtitle}>Tasks completed ({metrics.taskCompletionRate}%)</span>
              <div className={styles.progressBarContainer}>
                <div 
                  className={styles.progressBarFill} 
                  style={{ width: `${metrics.taskCompletionRate}%` }} 
                />
              </div>
            </>
          )}
        </motion.div>

        {/* Metric Card 2: Today's Habits */}
        <motion.div className={`${styles.widget} ${styles.span3}`} variants={cardVariants}>
          <div className={styles.widgetHeader}>
            <span className={styles.widgetTitle}>
              <Repeat size={20} className={styles.widgetIcon} /> Habits
            </span>
            <Link href="/habits" className={styles.widgetLink}>
              Track <ArrowUpRight size={14} />
            </Link>
          </div>
          {!isMounted ? (
            <div style={{ height: '60px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', animation: 'pulse 1.5s infinite' }} />
          ) : (
            <>
              <div style={{ fontSize: '2.2rem', fontWeight: 700, margin: '4px 0' }}>
                {metrics.habitsCompletedToday} / {metrics.habitsTotalToday}
              </div>
              <span className={styles.trackerSubtitle}>Habits logged today</span>
              <div className={styles.progressBarContainer}>
                <div 
                  className={styles.progressBarFill} 
                  style={{ 
                    width: `${metrics.habitCompletionRate}%`,
                    backgroundColor: 'var(--moss)'
                  }} 
                />
              </div>
            </>
          )}
        </motion.div>

        {/* Metric Card 3: Notes Summary */}
        <motion.div className={`${styles.widget} ${styles.span3}`} variants={cardVariants}>
          <div className={styles.widgetHeader}>
            <span className={styles.widgetTitle}>
              <FileText size={20} className={styles.widgetIcon} /> Notes
            </span>
            <Link href="/notes" className={styles.widgetLink}>
              Open <ArrowUpRight size={14} />
            </Link>
          </div>
          {!isMounted ? (
            <div style={{ height: '60px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', animation: 'pulse 1.5s infinite' }} />
          ) : (
            <>
              <div style={{ fontSize: '2.2rem', fontWeight: 700, margin: '4px 0' }}>
                {metrics.notesTotal}
              </div>
              <span className={styles.trackerSubtitle}>
                {metrics.notesPinned} Pinned Notes
              </span>
            </>
          )}
        </motion.div>

        {/* Metric Card 4: Streak Tracker */}
        <motion.div className={`${styles.widget} ${styles.span3}`} variants={cardVariants}>
          <div className={styles.widgetHeader}>
            <span className={styles.widgetTitle}>
              <Flame size={20} style={{ color: 'var(--moss)' }} /> Active Streak
            </span>
          </div>
          {!isMounted ? (
            <div style={{ height: '60px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', animation: 'pulse 1.5s infinite' }} />
          ) : (
            <>
              <div style={{ fontSize: '2.2rem', fontWeight: 700, color: 'var(--moss)', margin: '4px 0' }}>
                {metrics.currentHabitStreak} Days 🔥
              </div>
              <span className={styles.trackerSubtitle}>
                Longest: {metrics.longestHabitStreak} Days
              </span>
            </>
          )}
        </motion.div>

        {/* Weekly Productivity Area Chart */}
        <motion.div className={`${styles.widget} ${styles.span8}`} variants={cardVariants}>
          <div className={styles.widgetHeader}>
            <span className={styles.widgetTitle}>
              <Activity size={20} className={styles.widgetIcon} /> Weekly Activity Curve
            </span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Past 7 Days Live Output
            </span>
          </div>

          <div style={{ width: '100%', height: 220, marginTop: '8px' }}>
            {!isMounted ? (
              <div style={{ height: '100%', width: '100%', background: 'rgba(255,255,255,0.03)', borderRadius: '16px' }} />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={metrics.weeklyActivity}>
                  <defs>
                    <linearGradient id="taskColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4C6A73" stopOpacity={0.6}/>
                      <stop offset="95%" stopColor="#4C6A73" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="habitColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6B7F4E" stopOpacity={0.6}/>
                      <stop offset="95%" stopColor="#6B7F4E" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" stroke="var(--text-muted)" fontSize={12} tickLine={false} />
                  <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'var(--surface-solid, #1e293b)', 
                      borderColor: 'rgba(255,255,255,0.1)', 
                      borderRadius: '12px',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.3)' 
                    }}
                  />
                  <Area type="monotone" dataKey="tasks" stroke="#4C6A73" fillOpacity={1} fill="url(#taskColor)" strokeWidth={2} name="Tasks" />
                  <Area type="monotone" dataKey="habits" stroke="#6B7F4E" fillOpacity={1} fill="url(#habitColor)" strokeWidth={2} name="Habits" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>

        {/* Quick Actions Panel */}
        <motion.div className={`${styles.widget} ${styles.span4}`} variants={cardVariants}>
          <div className={styles.widgetHeader}>
            <span className={styles.widgetTitle}>
              <Zap size={20} className={styles.widgetIcon} /> Quick Actions
            </span>
          </div>
          
          <div className={styles.quickActionsGrid}>
            <Link href="/tasks" className={styles.actionBtn} style={{ display: 'flex', flexDirection: 'column', gap: '8px', textDecoration: 'none' }}>
              <Plus size={20} /> Add Task
            </Link>
            <Link href="/habits" className={styles.actionBtn} style={{ display: 'flex', flexDirection: 'column', gap: '8px', textDecoration: 'none' }}>
              <Repeat size={20} /> Add Habit
            </Link>
            <Link href="/notes" className={styles.actionBtn} style={{ display: 'flex', flexDirection: 'column', gap: '8px', textDecoration: 'none' }}>
              <FileText size={20} /> New Note
            </Link>
            <Link href="/journal" className={styles.actionBtn} style={{ display: 'flex', flexDirection: 'column', gap: '8px', textDecoration: 'none' }}>
              <CalendarIcon size={20} /> Journal
            </Link>
          </div>
        </motion.div>

        {/* Upcoming Tasks Section */}
        <motion.div className={`${styles.widget} ${styles.span6}`} variants={cardVariants}>
          <div className={styles.widgetHeader}>
            <span className={styles.widgetTitle}>
              <CheckSquare size={20} className={styles.widgetIcon} /> Pending & Upcoming Tasks
            </span>
            <Link href="/tasks" className={styles.widgetLink}>
              View All <ChevronRight size={14} />
            </Link>
          </div>

          <div className={styles.taskList}>
            {!isMounted ? (
              <div style={{ height: '120px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px' }} />
            ) : metrics.upcomingTasks && metrics.upcomingTasks.length > 0 ? (
              metrics.upcomingTasks.map((task) => (
                <div key={task.id} className={styles.taskItem}>
                  <div className={styles.taskItemContent}>
                    <button 
                      onClick={() => toggleTaskStatus(task.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                      title="Toggle task completion"
                    >
                      <Circle size={18} style={{ color: 'var(--text-muted)' }} />
                    </button>
                    <span>{task.title}</span>
                  </div>
                  {task.priority && (
                    <span className={`${styles.badge} ${task.priority === 'high' ? styles.badgeHigh : styles.badgeMedium}`}>
                      {task.priority}
                    </span>
                  )}
                </div>
              ))
            ) : (
              <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                <CheckCircle2 size={36} color="var(--moss)" style={{ margin: '0 auto 8px', opacity: 0.8 }} />
                <p style={{ margin: 0, fontWeight: 500 }}>All tasks complete for today!</p>
                <Link href="/tasks" style={{ fontSize: '0.85rem', color: 'var(--accent-primary)', marginTop: '4px', display: 'inline-block' }}>
                  + Create a new task
                </Link>
              </div>
            )}
          </div>
        </motion.div>

        {/* Recent Activity Section */}
        <motion.div className={`${styles.widget} ${styles.span6}`} variants={cardVariants}>
          <div className={styles.widgetHeader}>
            <span className={styles.widgetTitle}>
              <TrendingUp size={20} className={styles.widgetIcon} /> Recent Activity
            </span>
          </div>

          <div className={styles.activityList}>
            {!isMounted ? (
              <div style={{ height: '120px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px' }} />
            ) : metrics.recentActivity && metrics.recentActivity.length > 0 ? (
              metrics.recentActivity.map((act) => (
                <div key={act.id} className={styles.activityItem}>
                  <div 
                    className={styles.activityDot} 
                    style={{ 
                      backgroundColor: act.type === 'habit' ? 'var(--moss)' : act.type === 'task' ? 'var(--river)' : 'var(--sand)' 
                    }} 
                  />
                  <span style={{ flex: 1 }}>{act.title}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{act.time}</span>
                </div>
              ))
            ) : (
              <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                <Activity size={32} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
                <p style={{ margin: '0 0 12px', fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                  Your recent activity will appear here as you start using LifeOS.
                </p>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <Link
                    href="/habits"
                    style={{
                      fontSize: '0.8rem',
                      color: 'var(--moss)',
                      textDecoration: 'none',
                      background: 'rgba(107, 127, 78, 0.15)',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      fontWeight: 600,
                    }}
                  >
                    + Add your first habit
                  </Link>
                  <Link
                    href="/tasks"
                    style={{
                      fontSize: '0.8rem',
                      color: '#4C6A73',
                      textDecoration: 'none',
                      background: 'rgba(76, 106, 115, 0.15)',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      fontWeight: 600,
                    }}
                  >
                    + Create your first task
                  </Link>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </main>
  );
}
