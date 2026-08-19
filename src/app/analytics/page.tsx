'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  CheckCircle2, 
  Target, 
  Flame, 
  Smile, 
  Activity, 
  BarChart2, 
  Zap, 
  Loader2,
  Calendar,
  Sparkles,
  BookOpen,
  Award,
  AlertCircle
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { useLifeOS } from '@/context/LifeOSContext';
import { safeFormatDate } from '@/lib/utils';
import styles from './page.module.css';

export default function AnalyticsPage() {
  const { metrics, habits, tasks, journal, isMounted } = useLifeOS();
  const [timeframe, setTimeframe] = useState<'7' | '30' | '90'>('30');

  // Compute live productivity trend data over selected timeframe
  const productivityTrend = useMemo(() => {
    const daysCount = parseInt(timeframe, 10);
    const trend = [];
    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const isoDate = d.toISOString().split('T')[0];
      const dateLabel = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      const dayTasks = tasks.filter(t => t.status === 'done' && t.completedAt && t.completedAt.startsWith(isoDate)).length;
      const dayHabits = habits.filter(h => h.completedDates.includes(isoDate)).length;
      const score = Math.min(100, Math.round((dayTasks * 25) + (dayHabits * 20)));

      trend.push({
        date: dateLabel,
        score,
        tasks: dayTasks,
        habits: dayHabits,
      });
    }
    return trend;
  }, [timeframe, tasks, habits]);

  // Compute multi-day mood trend from journal entries
  const moodTrend = useMemo(() => {
    const moodScoreMap: Record<string, number> = { '😄': 5, '😊': 4, '😐': 3, '😔': 2, '😢': 1 };
    
    // Sort journal entries chronologically
    const sorted = [...journal].sort((a, b) => (a.date || '').localeCompare(b.date || ''));

    if (sorted.length > 0) {
      return sorted.map(j => ({
        date: safeFormatDate(j.date, 'No date', { month: 'short', day: 'numeric' }),
        score: moodScoreMap[j.mood] || 4,
        mood: j.mood,
      }));
    }

    // Fallback populated demo multi-day trend if empty
    return [
      { date: 'Aug 12', score: 4, mood: '😊' },
      { date: 'Aug 13', score: 3, mood: '😐' },
      { date: 'Aug 14', score: 5, mood: '😄' },
      { date: 'Aug 15', score: 4, mood: '😊' },
      { date: 'Aug 16', score: 3, mood: '😐' },
      { date: 'Aug 17', score: 4, mood: '😊' },
      { date: 'Aug 18', score: 5, mood: '😄' },
    ];
  }, [journal]);

  // Top Habit Performance Breakdown
  const habitPerformance = useMemo(() => {
    return habits.map(h => ({
      name: h.name,
      completions: h.completedDates.length,
      rate: Math.min(100, Math.round((h.completedDates.length / 30) * 100)),
    })).sort((a, b) => b.completions - a.completions).slice(0, 6);
  }, [habits]);

  // Generate live 365-day heatmap grid with activity levels
  const heatmapColumns = useMemo(() => {
    const taskCounts = new Map<string, number>();
    tasks.forEach((t) => {
      if (t.status === 'done' && t.completedAt) {
        const d = t.completedAt.slice(0, 10);
        taskCounts.set(d, (taskCounts.get(d) || 0) + 1);
      }
    });

    const habitCounts = new Map<string, number>();
    habits.forEach((h) => {
      h.completedDates.forEach((d) => {
        habitCounts.set(d, (habitCounts.get(d) || 0) + 1);
      });
    });

    const journalCounts = new Map<string, number>();
    journal.forEach((j) => {
      if (j.date) {
        journalCounts.set(j.date, (journalCounts.get(j.date) || 0) + 1);
      }
    });

    const days = [];
    const today = new Date();
    for (let i = 364; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const isoDate = d.toISOString().split('T')[0];

      const count = (taskCounts.get(isoDate) || 0) + (habitCounts.get(isoDate) || 0) + (journalCounts.get(isoDate) || 0);
      let level = 0;
      if (count === 1) level = 1;
      else if (count === 2) level = 2;
      else if (count >= 3 && count <= 4) level = 3;
      else if (count >= 5 && count <= 6) level = 4;
      else if (count >= 7) level = 5;

      days.push({ date: isoDate, count, level });
    }

    interface HeatmapCell { date: string; count: number; level: number }
    const cols: HeatmapCell[][] = [];
    let currentCol: HeatmapCell[] = [];
    days.forEach((day, index) => {
      currentCol.push(day);
      if (currentCol.length === 7 || index === days.length - 1) {
        cols.push(currentCol);
        currentCol = [];
      }
    });
    return cols;
  }, [tasks, habits, journal]);

  // Derived Auto Insights calculated from live connected state
  const insights = useMemo(() => {
    const list = [];

    // Habit insight
    const topHabit = [...habits].sort((a, b) => b.completedDates.length - a.completedDates.length)[0];
    if (topHabit) {
      list.push({
        id: 'ins-1',
        icon: '🔥',
        title: 'Strongest Habit Streak',
        text: `Your "${topHabit.name}" habit is your most consistent with ${topHabit.completedDates.length} total logged completions.`,
        color: '#6B7F4E',
      });
    }

    // Task completion insight
    list.push({
      id: 'ins-2',
      icon: '✅',
      title: 'Weekly Task Completion',
      text: `You have completed ${metrics.taskCompletionRate}% of your total planned tasks (${metrics.tasksCompleted} done out of ${metrics.tasksTotal}).`,
      color: '#4C6A73',
    });

    // Mood insight
    if (journal.length > 0) {
      const avgMoodScore = moodTrend.reduce((acc, curr) => acc + curr.score, 0) / moodTrend.length;
      list.push({
        id: 'ins-3',
        icon: '😄',
        title: 'Emotional Well-Being Trend',
        text: `Your average logged mood rating is ${(avgMoodScore).toFixed(1)}/5 over recent entries. Mental clarity remains strong.`,
        color: '#DCC8A3',
      });
    }

    // Habit consistency recommendation
    const weakerHabit = [...habits].sort((a, b) => a.completedDates.length - b.completedDates.length)[0];
    if (weakerHabit && habits.length > 1) {
      list.push({
        id: 'ins-4',
        icon: '🎯',
        title: 'Habit Needing Attention',
        text: `"${weakerHabit.name}" has fewer recent completions. Focus on completing it tomorrow morning.`,
        color: '#A2B5A0',
      });
    }

    return list;
  }, [habits, metrics, journal, moodTrend]);

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>System Analytics</h1>
          <p className={styles.subtitle}>Comprehensive performance insights across your habits, tasks, mood, and consistency.</p>
        </div>

        <div className={styles.timeframeTabs}>
          <button
            className={`${styles.timeTab} ${timeframe === '7' ? styles.timeTabActive : ''}`}
            onClick={() => setTimeframe('7')}
          >
            7 Days
          </button>
          <button
            className={`${styles.timeTab} ${timeframe === '30' ? styles.timeTabActive : ''}`}
            onClick={() => setTimeframe('30')}
          >
            30 Days
          </button>
          <button
            className={`${styles.timeTab} ${timeframe === '90' ? styles.timeTabActive : ''}`}
            onClick={() => setTimeframe('90')}
          >
            90 Days
          </button>
        </div>
      </div>

      {!isMounted ? (
        <div style={{ padding: '6rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <Loader2 className={styles.spinning} size={36} style={{ margin: '0 auto 16px' }} />
          <p>Gathering system analytics...</p>
        </div>
      ) : (
        <>
          {/* Core KPI Overview Cards */}
          <div className={styles.kpiGrid}>
            <div className={styles.kpiCard}>
              <div className={styles.kpiIcon} style={{ background: 'rgba(76, 106, 115, 0.15)', color: '#4C6A73' }}>
                <Zap size={24} />
              </div>
              <div>
                <div className={styles.kpiValue}>{metrics.productivityScore}</div>
                <div className={styles.kpiLabel}>Productivity Score</div>
              </div>
            </div>

            <div className={styles.kpiCard}>
              <div className={styles.kpiIcon} style={{ background: 'rgba(107, 127, 78, 0.15)', color: '#6B7F4E' }}>
                <CheckCircle2 size={24} />
              </div>
              <div>
                <div className={styles.kpiValue}>{metrics.taskCompletionRate}%</div>
                <div className={styles.kpiLabel}>Task Completion</div>
              </div>
            </div>

            <div className={styles.kpiCard}>
              <div className={styles.kpiIcon} style={{ background: 'rgba(162, 181, 160, 0.15)', color: '#A2B5A0' }}>
                <Target size={24} />
              </div>
              <div>
                <div className={styles.kpiValue}>{metrics.habitCompletionRate}%</div>
                <div className={styles.kpiLabel}>Today's Habits</div>
              </div>
            </div>

            <div className={styles.kpiCard}>
              <div className={styles.kpiIcon} style={{ background: 'rgba(107, 127, 78, 0.15)', color: '#6B7F4E' }}>
                <Flame size={24} />
              </div>
              <div>
                <div className={styles.kpiValue}>{metrics.currentHabitStreak} Days</div>
                <div className={styles.kpiLabel}>Active Streak 🔥</div>
              </div>
            </div>
          </div>

          {/* Connected Data Auto-Insights */}
          <div className={styles.insightsSection}>
            <h3 className={styles.sectionHeaderTitle}>
              <Sparkles size={18} color="#6B7F4E" /> Automated System Insights
            </h3>
            <div className={styles.insightsGrid}>
              {insights.map((ins) => (
                <div key={ins.id} className={styles.insightCard} style={{ borderLeftColor: ins.color }}>
                  <span style={{ fontSize: '1.25rem' }}>{ins.icon}</span>
                  <div>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '0.9rem', fontWeight: 700 }}>{ins.title}</h4>
                    <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{ins.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recharts Analytics Grid */}
          <div className={styles.chartsGrid}>
            {/* Chart 1: Productivity Trend Curve */}
            <div className={styles.chartCard}>
              <div className={styles.chartHeader}>
                <h3 className={styles.chartTitle}>
                  <TrendingUp size={18} color="#4C6A73" /> Productivity Score Trend
                </h3>
              </div>
              <div style={{ width: '100%', height: 250 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={productivityTrend}>
                    <defs>
                      <linearGradient id="prodColor" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4C6A73" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#4C6A73" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={12} />
                    <YAxis stroke="var(--text-muted)" fontSize={12} domain={[0, 100]} />
                    <Tooltip
                      contentStyle={{ background: 'var(--surface-solid)', border: '1px solid var(--border-subtle)', borderRadius: '8px', color: 'var(--text-primary)' }}
                    />
                    <Area type="monotone" dataKey="score" stroke="#4C6A73" strokeWidth={3} fillOpacity={1} fill="url(#prodColor)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Weekly Output */}
            <div className={styles.chartCard}>
              <div className={styles.chartHeader}>
                <h3 className={styles.chartTitle}>
                  <BarChart2 size={18} color="#6B7F4E" /> Weekly Activity Output
                </h3>
              </div>
              <div style={{ width: '100%', height: 250 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={metrics.weeklyActivity}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="day" stroke="var(--text-muted)" fontSize={12} />
                    <YAxis stroke="var(--text-muted)" fontSize={12} />
                    <Tooltip
                      contentStyle={{ background: 'var(--surface-solid)', border: '1px solid var(--border-subtle)', borderRadius: '8px', color: 'var(--text-primary)' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                    <Bar dataKey="tasks" fill="#4C6A73" radius={[6, 6, 0, 0]} name="Tasks Completed" />
                    <Bar dataKey="habits" fill="#6B7F4E" radius={[6, 6, 0, 0]} name="Habits Completed" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 3: Mood Rating Trend */}
            <div className={styles.chartCard}>
              <div className={styles.chartHeader}>
                <h3 className={styles.chartTitle}>
                  <Smile size={18} color="#DCC8A3" /> Emotional Well-being & Mood Log (1-5)
                </h3>
              </div>
              <div style={{ width: '100%', height: 250 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={moodTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={12} />
                    <YAxis stroke="var(--text-muted)" fontSize={12} domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} />
                    <Tooltip
                      contentStyle={{ background: 'var(--surface-solid)', border: '1px solid var(--border-subtle)', borderRadius: '8px', color: 'var(--text-primary)' }}
                    />
                    <Line type="monotone" dataKey="score" stroke="#DCC8A3" strokeWidth={3} dot={{ r: 5, fill: '#DCC8A3' }} name="Mood Rating" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 4: Top Habit Consistency */}
            <div className={styles.chartCard}>
              <div className={styles.chartHeader}>
                <h3 className={styles.chartTitle}>
                  <Target size={18} color="#A2B5A0" /> Top Habit Consistency (%)
                </h3>
              </div>
              <div style={{ width: '100%', height: 250 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={habitPerformance} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis type="number" stroke="var(--text-muted)" fontSize={12} domain={[0, 100]} />
                    <YAxis type="category" dataKey="name" stroke="var(--text-muted)" fontSize={11} width={110} />
                    <Tooltip
                      contentStyle={{ background: 'var(--surface-solid)', border: '1px solid var(--border-subtle)', borderRadius: '8px', color: 'var(--text-primary)' }}
                    />
                    <Bar dataKey="rate" fill="#6B7F4E" radius={[0, 6, 6, 0]} name="30-Day Completion Rate (%)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* 365-Day Activity Heatmap */}
          <div className={styles.heatmapCard}>
            <div className={styles.heatmapHeader}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Activity size={18} color="#6B7F4E" /> 365-Day Activity Heatmap
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Less
                <span className={`${styles.cell} ${styles.level0}`} title="Level 0: 0 activities" />
                <span className={`${styles.cell} ${styles.level1}`} title="Level 1: 1 activity" />
                <span className={`${styles.cell} ${styles.level2}`} title="Level 2: 2 activities" />
                <span className={`${styles.cell} ${styles.level3}`} title="Level 3: 3-4 activities" />
                <span className={`${styles.cell} ${styles.level4}`} title="Level 4: 5-6 activities" />
                <span className={`${styles.cell} ${styles.level5}`} title="Level 5: 7+ activities" />
                More
              </div>
            </div>

            <div className={styles.heatmapGrid}>
              {heatmapColumns.map((col, cIdx) => (
                <div key={cIdx} className={styles.heatmapColumn}>
                  {col.map((day: any, rIdx: number) => (
                    <div
                      key={day.date || rIdx}
                      className={`${styles.cell} ${styles[`level${day.level || 0}`]}`}
                      title={`${day.date}: ${day.count} activities logged`}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
