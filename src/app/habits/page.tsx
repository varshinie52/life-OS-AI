'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Repeat, 
  Flame, 
  Check, 
  Trash2, 
  X, 
  Loader2, 
  CheckCircle2,
  TrendingUp
} from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import { useLifeOS } from '@/context/LifeOSContext';
import styles from './page.module.css';

const CATEGORIES = ['all', 'health', 'productivity', 'mindfulness', 'fitness', 'finance', 'learning', 'other'];
const EMOJI_PRESETS = ['🎯', '💧', '📚', '🧘', '🏃', '💪', '💻', '🌅', '🍎', '🎨', '⚡', '🧠'];
const COLOR_SWATCHES = ['#6B7F4E', '#1F3D2E', '#A2B5A0', '#DCC8A3', '#4C6A73', '#5A443A'];

export default function HabitsPage() {
  const { showToast } = useToast();
  const lifeOS = useLifeOS();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteAllModalOpen, setIsDeleteAllModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingHabitId, setEditingHabitId] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [category, setCategory] = useState<string>('productivity');
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'custom'>('daily');
  const [icon, setIcon] = useState('🎯');
  const [color, setColor] = useState('#6B7F4E');
  const [submitting, setSubmitting] = useState(false);

  const last7Days = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const isoDate = d.toISOString().split('T')[0];
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      const dayNum = d.getDate();
      days.push({ isoDate, dayName, dayNum, isToday: i === 0 });
    }
    return days;
  }, []);

  const handleToggleHabit = async (habitId: string, dateStr?: string) => {
    lifeOS.toggleHabitCompletion(habitId, dateStr);
    showToast('Habit status updated! 🔥', 'success');
  };

  const handleOpenCreateModal = () => {
    setModalMode('create');
    setEditingHabitId(null);
    setName('');
    setCategory('productivity');
    setFrequency('daily');
    setIcon('🎯');
    setColor('#6B7F4E');
    setIsModalOpen(true);
  };

  const handleSaveHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Please enter a habit name', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      if (modalMode === 'create') {
        lifeOS.addHabit(name.trim(), icon, color, category, frequency);
        showToast('Habit created! 🎉', 'success');
      } else if (editingHabitId) {
        lifeOS.updateHabit(editingHabitId, {
          name: name.trim(),
          icon,
          color,
        });
        showToast('Habit updated!', 'success');
      }
      setIsModalOpen(false);
    } catch {
      showToast('Error saving habit', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteHabit = async (id: string) => {
    if (!confirm('Are you sure you want to delete this habit?')) return;
    lifeOS.deleteHabit(id);
    showToast('Habit deleted', 'info');
  };

  const displayedHabits = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return lifeOS.habits
      .map((h) => ({
        ...h,
        _id: h.id,
        title: h.name,
        category: 'productivity' as const,
        frequency: 'daily' as const,
        completedToday: h.completedDates.includes(today),
        currentStreak: h.completedDates.length,
      }))
      .filter((h) => {
        if (selectedCategory !== 'all' && h.category !== selectedCategory) return false;
        if (search.trim()) {
          const q = search.toLowerCase().trim();
          return h.name.toLowerCase().includes(q);
        }
        return true;
      });
  }, [lifeOS.habits, selectedCategory, search]);

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Habit Tracker</h1>
          <p className={styles.subtitle}>Build routines, track streaks, and achieve daily mastery.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button
            onClick={() => {
              if (lifeOS.habits.length === 0) {
                showToast('No habits to delete.', 'info');
              } else {
                setIsDeleteAllModalOpen(true);
              }
            }}
            style={{
              background: 'rgba(184, 91, 73, 0.1)',
              color: '#B85B49',
              border: '1px solid rgba(184, 91, 73, 0.3)',
              padding: '0.6rem 1rem',
              borderRadius: '12px',
              fontWeight: 600,
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              cursor: 'pointer',
              opacity: lifeOS.habits.length === 0 ? 0.6 : 1,
            }}
            title="Delete All Habits"
          >
            <Trash2 size={16} /> Delete All
          </button>
          <button onClick={handleOpenCreateModal} className={styles.addBtn}>
            <Plus size={18} /> New Habit
          </button>
        </div>
      </div>

      {/* Analytics Metric Cards Header */}
      <div className={styles.analyticsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'rgba(76, 106, 115, 0.15)', color: '#4C6A73' }}>
            <Repeat size={22} />
          </div>
          <div>
            <div className={styles.statValue}>{lifeOS.metrics.habitsTotalToday}</div>
            <div className={styles.statLabel}>Active Habits</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'rgba(107, 127, 78, 0.15)', color: '#6B7F4E' }}>
            <CheckCircle2 size={22} />
          </div>
          <div>
            <div className={styles.statValue}>{lifeOS.metrics.habitsCompletedToday}</div>
            <div className={styles.statLabel}>Completed Today</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'rgba(220, 200, 163, 0.25)', color: '#DCC8A3' }}>
            <Flame size={22} />
          </div>
          <div>
            <div className={styles.statValue}>{lifeOS.metrics.currentHabitStreak} Days</div>
            <div className={styles.statLabel}>Best Streak</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'rgba(162, 181, 160, 0.15)', color: '#A2B5A0' }}>
            <TrendingUp size={22} />
          </div>
          <div>
            <div className={styles.statValue}>{lifeOS.metrics.habitCompletionRate}%</div>
            <div className={styles.statLabel}>Today's Success Rate</div>
          </div>
        </div>
      </div>

      {/* Toolbar: Category Filter Tabs, Search & Sort */}
      <div className={styles.toolbar}>
        <div className={styles.categories}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              className={`${styles.categoryTab} ${selectedCategory === cat ? styles.categoryTabActive : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className={styles.controls}>
          <input
            type="text"
            placeholder="Search habits..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.searchInput}
          />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className={styles.selectInput}
          >
            <option value="newest">Sort: Newest</option>
            <option value="alphabetical">Sort: A-Z</option>
            <option value="streak">Sort: Highest Streak</option>
          </select>
        </div>
      </div>

      {/* Habits Table / List */}
      <div className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <div>Habit</div>
          <div className={styles.daysRow}>
            {last7Days.map((d) => (
              <div key={d.isoDate} className={styles.dayCol}>
                <span className={styles.dayName}>{d.dayName}</span>
                <span className={`${styles.dayNum} ${d.isToday ? styles.dayToday : ''}`}>{d.dayNum}</span>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center' }}>Streak</div>
          <div style={{ textAlign: 'right' }}>Actions</div>
        </div>

        {displayedHabits.length > 0 ? (
          displayedHabits.map((habit) => {
            const hId = habit._id || habit.id;
            return (
              <div key={hId} className={styles.habitRow}>
                <div className={styles.habitInfo}>
                  <div
                    className={styles.habitIconWrapper}
                    style={{ backgroundColor: `${habit.color}20`, color: habit.color }}
                  >
                    {habit.icon}
                  </div>
                  <div>
                    <h3 className={styles.habitTitle}>{habit.name || habit.title}</h3>
                    <span className={styles.habitCategory}>{habit.category} • {habit.frequency}</span>
                  </div>
                </div>

                <div className={styles.daysRow}>
                  {last7Days.map((d) => {
                    const isChecked = habit.completedDates.includes(d.isoDate);
                    return (
                      <button
                        key={d.isoDate}
                        className={`${styles.checkinBtn} ${isChecked ? styles.checkinBtnChecked : ''}`}
                        style={{
                          backgroundColor: isChecked ? (habit.color || '#6B7F4E') : 'transparent',
                          borderColor: isChecked ? (habit.color || '#6B7F4E') : 'var(--border-color, #C8C0B0)',
                        }}
                        onClick={() => hId && handleToggleHabit(hId, d.isoDate)}
                        title={`Check in for ${d.dayName}`}
                      >
                        {isChecked && <Check size={16} color="#ffffff" strokeWidth={3} />}
                      </button>
                    );
                  })}
                </div>

                <div style={{ textAlign: 'center' }}>
                  <div className={styles.streakBadge} style={{ justifyContent: 'center' }}>
                    <Flame size={16} fill="var(--moss)" color="var(--moss)" /> {habit.currentStreak || 0}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <button
                    onClick={() => hId && handleDeleteHabit(hId)}
                    className={styles.actionBtn}
                    title="Delete habit"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className={styles.emptyState}>
            <Repeat size={44} style={{ opacity: 0.4, marginBottom: '12px' }} />
            <h3 style={{ margin: '0 0 4px', fontSize: '1.1rem' }}>No habits found</h3>
            <p style={{ margin: 0, fontSize: '0.9rem' }}>
              Get started by creating your first daily habit.
            </p>
          </div>
        )}
      </div>

      {/* Add / Edit Habit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            className={styles.modalBackdrop}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className={styles.modalContent}
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
            >
              <div className={styles.modalHeader}>
                <h2 className={styles.modalTitle}>
                  {modalMode === 'create' ? 'Create New Habit' : 'Edit Habit'}
                </h2>
                <button onClick={() => setIsModalOpen(false)} className={styles.closeBtn}>
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSaveHabit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500, display: 'block', marginBottom: '6px' }}>
                    Habit Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Read 20 pages, Drink Water..."
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      background: 'var(--surface-solid)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '12px',
                      color: 'var(--text-primary)',
                      outline: 'none',
                    }}
                    required
                    autoFocus
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500, display: 'block', marginBottom: '6px' }}>
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      background: 'var(--surface-solid)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '12px',
                      color: 'var(--text-primary)',
                      outline: 'none',
                      textTransform: 'capitalize',
                    }}
                  >
                    {CATEGORIES.filter((c) => c !== 'all').map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500, display: 'block', marginBottom: '6px' }}>
                    Emoji Icon
                  </label>
                  <div className={styles.emojiGrid}>
                    {EMOJI_PRESETS.map((e) => (
                      <button
                        key={e}
                        type="button"
                        className={`${styles.emojiBtn} ${icon === e ? styles.emojiBtnSelected : ''}`}
                        onClick={() => setIcon(e)}
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500, display: 'block', marginBottom: '6px' }}>
                    Color Accent
                  </label>
                  <div className={styles.colorSwatches}>
                    {COLOR_SWATCHES.map((c) => (
                      <button
                        key={c}
                        type="button"
                        className={`${styles.swatch} ${color === c ? styles.swatchSelected : ''}`}
                        style={{ backgroundColor: c }}
                        onClick={() => setColor(c)}
                      />
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    style={{
                      background: 'transparent',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-secondary)',
                      padding: '0.75rem 1.25rem',
                      borderRadius: '12px',
                      fontWeight: 500,
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    style={{
                      background: 'var(--moss)',
                      color: '#ffffff',
                      border: 'none',
                      padding: '0.75rem 1.75rem',
                      borderRadius: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    {submitting ? <Loader2 className={styles.spinning} size={18} /> : 'Save Habit'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirm Delete All Habits Modal */}
      <AnimatePresence>
        {isDeleteAllModalOpen && (
          <motion.div
            className={styles.modalBackdrop}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className={styles.modalContent}
              style={{ maxWidth: '440px', padding: '1.75rem' }}
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
            >
              <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(184, 91, 73, 0.15)', color: '#B85B49', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                  <Trash2 size={24} />
                </div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 6px 0', color: 'var(--text-primary)' }}>
                  Delete all habits?
                </h2>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                  This will permanently remove all habits from this LifeOS account. Tasks, notes, journal entries, and calendar events will remain untouched.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  onClick={() => setIsDeleteAllModalOpen(false)}
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-secondary)',
                    padding: '0.75rem 1rem',
                    borderRadius: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    lifeOS.clearSectionData('habits');
                    setIsDeleteAllModalOpen(false);
                    showToast('All habits deleted', 'info');
                  }}
                  style={{
                    flex: 1,
                    background: '#B85B49',
                    color: '#ffffff',
                    border: 'none',
                    padding: '0.75rem 1rem',
                    borderRadius: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Delete All
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
