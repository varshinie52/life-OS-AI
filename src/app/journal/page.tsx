'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Heart, 
  Smile, 
  Flame, 
  Sparkles, 
  Save, 
  Trash2, 
  Edit3, 
  Search, 
  Target, 
  Award, 
  AlertTriangle, 
  Loader2, 
  CheckCircle2, 
  Clock,
  Plus,
  Tag
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useLifeOS } from '@/context/LifeOSContext';
import { safeFormatDate } from '@/lib/utils';
import styles from './page.module.css';

interface JournalEntry {
  _id: string;
  id?: string;
  date: string;
  title?: string;
  content: string;
  mood: 'great' | 'good' | 'okay' | 'bad' | 'awful';
  moodScore: number;
  gratitude?: string[];
  wins?: string[];
  challenges?: string[];
  reflections?: string;
  tomorrowGoals?: string[];
  tags?: string[];
  updatedAt?: string;
}

interface JournalStats {
  totalEntries: number;
  streak: number;
  averageMoodScore: number;
  hasJournaledToday: boolean;
}

const MOOD_OPTIONS: { id: 'great' | 'good' | 'okay' | 'bad' | 'awful'; emoji: string; label: string }[] = [
  { id: 'great', emoji: '😃', label: 'Great' },
  { id: 'good', emoji: '😊', label: 'Good' },
  { id: 'okay', emoji: '😐', label: 'Okay' },
  { id: 'bad', emoji: '😔', label: 'Bad' },
  { id: 'awful', emoji: '😢', label: 'Awful' },
];

export default function JournalPage() {
  const { authFetch, isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const lifeOS = useLifeOS();

  const [currentDateStr, setCurrentDateStr] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [activeEntry, setActiveEntry] = useState<JournalEntry | null>(null);
  const [recentEntries, setRecentEntries] = useState<JournalEntry[]>([]);
  const [stats, setStats] = useState<JournalStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Editor form state
  const [title, setTitle] = useState('');
  const [mood, setMood] = useState<'great' | 'good' | 'okay' | 'bad' | 'awful'>('good');
  const [content, setContent] = useState('');
  const [gratitudeText, setGratitudeText] = useState('');
  const [winsText, setWinsText] = useState('');
  const [challengesText, setChallengesText] = useState('');
  const [tomorrowGoalsText, setTomorrowGoalsText] = useState('');
  const [tagsText, setTagsText] = useState('');

  // Sidebar filter
  const [searchQuery, setSearchQuery] = useState('');
  const [moodFilter, setMoodFilter] = useState('all');
  const [isDeleteAllModalOpen, setIsDeleteAllModalOpen] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

  // Helper to populate editor form state from entry or defaults
  const populateFormForEntry = (entry: JournalEntry | null, targetDateStr: string) => {
    if (entry) {
      setActiveEntry(entry);
      setTitle(entry.title || '');
      setMood(entry.mood || 'good');
      setContent(entry.content || '');
      setGratitudeText(entry.gratitude ? entry.gratitude.join('\n') : '');
      setWinsText(entry.wins ? entry.wins.join('\n') : '');
      setChallengesText(entry.challenges ? entry.challenges.join('\n') : '');
      setTomorrowGoalsText(entry.tomorrowGoals ? entry.tomorrowGoals.join('\n') : '');
      setTagsText(entry.tags ? entry.tags.join(', ') : '');
    } else {
      setActiveEntry(null);
      const formattedDate = safeFormatDate(targetDateStr, 'No date', { month: 'short', day: 'numeric' });
      setTitle(`Reflection for ${formattedDate}`);
      setMood('good');
      setContent('');
      setGratitudeText('');
      setWinsText('');
      setChallengesText('');
      setTomorrowGoalsText('');
      setTagsText('');
    }
  };

  // Unified load function: fetches stats & entries in 1 parallel request
  const loadJournalData = async (targetDateStr: string) => {
    setLoading(true);
    try {
      const [statsRes, entriesRes] = await Promise.all([
        authFetch(`${API_URL}/journal/stats`),
        authFetch(`${API_URL}/journal?limit=100`),
      ]);

      if (statsRes.ok) {
        const sData = await statsRes.json();
        if (sData.success) {
          setStats(sData.data.stats || null);
        }
      }

      if (entriesRes.ok) {
        const eData = await entriesRes.json();
        if (eData.success && Array.isArray(eData.data.entries)) {
          const entriesList: JournalEntry[] = eData.data.entries;
          setRecentEntries(entriesList);

          const matched = entriesList.find((e: JournalEntry) => {
            const eDate = new Date(e.date).toISOString().split('T')[0];
            return eDate === targetDateStr;
          });
          populateFormForEntry(matched || null, targetDateStr);
        }
      }
    } catch (err) {
      showToast('Error loading journal data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadJournalData(currentDateStr);
    }
  }, [isAuthenticated, currentDateStr]);

  const displayedEntries = recentEntries;

  const filteredRecentEntries = useMemo(() => {
    return displayedEntries.filter((e) => {
      const matchesSearch =
        !searchQuery.trim() ||
        e.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.tags?.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesMood = moodFilter === 'all' || e.mood === moodFilter;

      return matchesSearch && matchesMood;
    });
  }, [displayedEntries, searchQuery, moodFilter]);

  const handlePrevDay = () => {
    const d = new Date(currentDateStr);
    d.setDate(d.getDate() - 1);
    setCurrentDateStr(d.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const d = new Date(currentDateStr);
    d.setDate(d.getDate() + 1);
    const todayStr = new Date().toISOString().split('T')[0];
    if (d.toISOString().split('T')[0] <= todayStr) {
      setCurrentDateStr(d.toISOString().split('T')[0]);
    }
  };

  const handleJumpToday = () => {
    setCurrentDateStr(new Date().toISOString().split('T')[0]);
  };

  // Save / Update Journal Entry
  const handleSaveEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const moodEmoji = mood === 'great' ? '😃' : mood === 'good' ? '😊' : mood === 'okay' ? '😐' : mood === 'bad' ? '😔' : '😢';
      const gratitudeList = gratitudeText.split('\n').map((s) => s.trim()).filter(Boolean);
      lifeOS.saveJournalEntry(currentDateStr, content.trim() || 'Daily entry', moodEmoji as any, gratitudeList);
      showToast('Journal entry saved! 📓', 'success');
      loadJournalData(currentDateStr);
    } catch (err) {
      showToast('Error saving journal entry', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Delete Entry
  const handleDeleteEntry = async () => {
    if (!activeEntry) return;
    if (!confirm('Are you sure you want to delete this journal entry?')) return;

    try {
      const entryId = activeEntry._id || activeEntry.id;
      const res = await authFetch(`${API_URL}/journal/${entryId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast('Journal entry deleted', 'info');
        setActiveEntry(null);
        setContent('');
        setGratitudeText('');
        loadJournalData(currentDateStr);
      } else {
        showToast(data.message || 'Failed to delete entry', 'error');
      }
    } catch (err) {
      showToast('Error deleting entry', 'error');
    }
  };

  const isToday = currentDateStr === new Date().toISOString().split('T')[0];

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerTitleGroup}>
          <div className={styles.titleRow}>
            <div className={styles.titleIconBadge}>
              <BookOpen size={22} />
            </div>
            <h1 className={styles.title}>Journal</h1>
          </div>
          <p className={styles.subtitle}>Reflect on your day, practice gratitude, and track your emotional well-being.</p>
        </div>

        <div className={styles.headerActions}>
          <button
            onClick={() => {
              if (lifeOS.journal.length === 0 && recentEntries.length === 0) {
                showToast('No journal entries to delete.', 'info');
              } else {
                setIsDeleteAllModalOpen(true);
              }
            }}
            className={styles.deleteAllBtn}
            disabled={lifeOS.journal.length === 0 && recentEntries.length === 0}
            title="Delete All Journal Entries"
          >
            <Trash2 size={16} /> Delete All
          </button>

          <button
            onClick={() => {
              handleJumpToday();
              populateFormForEntry(null, new Date().toISOString().split('T')[0]);
            }}
            className={styles.newEntryBtn}
          >
            <Plus size={16} /> New Entry
          </button>
        </div>
      </div>

      {/* Stats Summary Cards */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'rgba(107, 127, 78, 0.15)', color: '#6B7F4E' }}>
            <Flame size={22} />
          </div>
          <div>
            <div className={styles.statValue}>{stats?.streak || 0} Days</div>
            <div className={styles.statLabel}>Writing Streak</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'rgba(0, 140, 140, 0.15)', color: '#008C8C' }}>
            <BookOpen size={22} />
          </div>
          <div>
            <div className={styles.statValue}>{stats?.totalEntries || recentEntries.length}</div>
            <div className={styles.statLabel}>Total Entries</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'rgba(220, 200, 163, 0.3)', color: '#8C6F56' }}>
            <Smile size={22} />
          </div>
          <div>
            <div className={styles.statValue}>{stats?.averageMoodScore ? `${stats.averageMoodScore} / 5` : '4.0 / 5'}</div>
            <div className={styles.statLabel}>Average Mood</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'rgba(162, 181, 160, 0.18)', color: '#5A7558' }}>
            <CheckCircle2 size={22} />
          </div>
          <div>
            <div className={styles.statValue} style={{ color: stats?.hasJournaledToday ? '#6B7F4E' : 'var(--text-secondary)' }}>
              {stats?.hasJournaledToday ? 'Done Today' : 'Pending'}
            </div>
            <div className={styles.statLabel}>Today's Status</div>
          </div>
        </div>
      </div>

      {/* Date Navigator Bar */}
      <div className={styles.dateBar}>
        <div className={styles.dateNav}>
          <button onClick={handlePrevDay} className={styles.navBtn} title="Previous Day">
            <ChevronLeft size={18} />
          </button>

          <div className={styles.dateTitle}>
            <CalendarIcon size={18} style={{ color: 'var(--accent-primary)' }} />
            <span>
              {new Date(currentDateStr).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
            {isToday && <span className={styles.todayBadge}>Today</span>}
          </div>

          <button onClick={handleNextDay} disabled={isToday} className={styles.navBtn} title="Next Day">
            <ChevronRight size={18} />
          </button>
        </div>

        {!isToday && (
          <button onClick={handleJumpToday} className={styles.jumpTodayBtn}>
            Jump to Today
          </button>
        )}
      </div>

      {/* Main Layout Grid */}
      <div className={styles.layoutGrid}>
        {/* Daily Journal Editor (Left Column) */}
        <form onSubmit={handleSaveEntry} className={styles.editorCard}>
          <div>
            <div className={styles.sectionLabel}>
              <Smile size={16} /> How are you feeling today?
            </div>
            <div className={styles.moodGrid}>
              {MOOD_OPTIONS.map((mOpt) => (
                <button
                  key={mOpt.id}
                  type="button"
                  onClick={() => setMood(mOpt.id)}
                  className={`${styles.moodCard} ${mood === mOpt.id ? styles.moodCardActive : ''}`}
                >
                  <span className={styles.moodEmoji}>{mOpt.emoji}</span>
                  <span>{mOpt.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className={styles.sectionLabel}>
              <Edit3 size={16} /> Reflection Title
            </div>
            <input
              type="text"
              placeholder="Title for today's reflection..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={styles.titleInput}
            />
          </div>

          <div>
            <div className={styles.sectionLabel}>
              <BookOpen size={16} /> Main Reflection / Brain Dump
            </div>
            <textarea
              placeholder="What happened today? What thoughts or ideas are on your mind?..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className={styles.textareaInput}
            />
          </div>

          <div>
            <div className={styles.sectionLabel}>
              <Heart size={16} style={{ color: '#ec4899' }} /> Gratitude Journal (1 item per line)
            </div>
            <textarea
              placeholder="1. I'm grateful for...&#10;2. A peaceful morning&#10;3. Progress on my goals"
              value={gratitudeText}
              onChange={(e) => setGratitudeText(e.target.value)}
              className={styles.listTextarea}
            />
          </div>

          <div className={styles.promptsGrid}>
            <div className={styles.promptCard}>
              <div className={styles.sectionLabel} style={{ color: '#6B7F4E' }}>
                <Award size={16} /> Today's Wins
              </div>
              <textarea
                placeholder="What went well today?..."
                value={winsText}
                onChange={(e) => setWinsText(e.target.value)}
                className={styles.listTextarea}
              />
            </div>

            <div className={styles.promptCard}>
              <div className={styles.sectionLabel} style={{ color: '#8C6F56' }}>
                <AlertTriangle size={16} /> Challenges
              </div>
              <textarea
                placeholder="What challenges did you navigate?..."
                value={challengesText}
                onChange={(e) => setChallengesText(e.target.value)}
                className={styles.listTextarea}
              />
            </div>
          </div>

          <div>
            <div className={styles.sectionLabel} style={{ color: 'var(--river)' }}>
              <Target size={16} /> Tomorrow's Key Goals
            </div>
            <textarea
              placeholder="Top priorities for tomorrow..."
              value={tomorrowGoalsText}
              onChange={(e) => setTomorrowGoalsText(e.target.value)}
              className={styles.listTextarea}
            />
          </div>

          <div className={styles.editorFooter}>
            <div className={styles.tagsInputWrapper}>
              <input
                type="text"
                placeholder="Tags (comma separated)..."
                value={tagsText}
                onChange={(e) => setTagsText(e.target.value)}
                className={styles.tagsInput}
              />
            </div>

            <div className={styles.actionBtnsGroup}>
              {activeEntry && (
                <button
                  type="button"
                  onClick={handleDeleteEntry}
                  className={styles.deleteEntryBtn}
                  title="Delete Entry"
                >
                  <Trash2 size={16} />
                </button>
              )}

              <button type="submit" disabled={saving} className={styles.saveBtn}>
                {saving ? (
                  <Loader2 className={styles.spinning} size={18} />
                ) : (
                  <>
                    <Save size={18} /> Save Entry
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        {/* Sidebar: Past Entries Timeline (Right Column) */}
        <div className={styles.sidebar}>
          <div className={styles.timelineCard}>
            <div className={styles.sectionLabel}>
              <Clock size={16} /> Journal History ({filteredRecentEntries.length})
            </div>

            <div className={styles.filterControls}>
              <input
                type="text"
                placeholder="Search past entries..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.searchInput}
              />

              <select
                value={moodFilter}
                onChange={(e) => setMoodFilter(e.target.value)}
                className={styles.selectInput}
              >
                <option value="all">Mood: All</option>
                <option value="great">😃 Great</option>
                <option value="good">😊 Good</option>
                <option value="okay">😐 Okay</option>
                <option value="bad">😔 Bad</option>
                <option value="awful">😢 Awful</option>
              </select>
            </div>

            <div className={styles.timelineList}>
              {filteredRecentEntries.length > 0 ? (
                filteredRecentEntries.map((e) => {
                  const itemDateStr = new Date(e.date).toISOString().split('T')[0];
                  const isSelected = itemDateStr === currentDateStr;
                  const matchedMood = MOOD_OPTIONS.find((m) => m.id === e.mood);

                  return (
                    <div
                      key={e._id || e.id}
                      onClick={() => setCurrentDateStr(itemDateStr)}
                      className={`${styles.timelineItem} ${isSelected ? styles.timelineItemActive : ''}`}
                    >
                      <div className={styles.timelineItemContent}>
                        <div className={styles.timelineItemTitle}>
                          {e.title || 'Journal Entry'}
                        </div>
                        <div className={styles.timelineItemDate}>
                          {safeFormatDate(e.date)}
                        </div>
                      </div>
                      <span className={styles.timelineEmojiBadge}>{matchedMood?.emoji || '😊'}</span>
                    </div>
                  );
                })
              ) : (
                <div className={styles.emptyStateCard}>
                  <div className={styles.emptyStateIcon}>
                    <Sparkles size={24} />
                  </div>
                  <h3 className={styles.emptyStateTitle}>No entries found</h3>
                  <p className={styles.emptyStateText}>
                    {searchQuery || moodFilter !== 'all'
                      ? 'No entries match your current search filters.'
                      : 'Your journal is empty. Capture your thoughts and reflections to get started.'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Confirm Delete All Journal Entries Modal */}
      <AnimatePresence>
        {isDeleteAllModalOpen && (
          <div className={styles.modalBackdrop} onClick={() => setIsDeleteAllModalOpen(false)}>
            <motion.div
              className={styles.modalContent}
              style={{ maxWidth: '440px', padding: '1.75rem' }}
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(184, 91, 73, 0.15)', color: '#B85B49', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                  <Trash2 size={24} />
                </div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 6px 0', color: 'var(--text-primary)' }}>
                  Delete all journal entries?
                </h2>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                  This will permanently remove all journal entries from this LifeOS account. Habits, tasks, notes, and calendar events will remain untouched.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  onClick={() => setIsDeleteAllModalOpen(false)}
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: '1px solid var(--border-color)',
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
                    lifeOS.clearSectionData('journal');
                    setIsDeleteAllModalOpen(false);
                    showToast('All journal entries deleted', 'info');
                  }}
                  style={{
                    flex: 1,
                    background: 'var(--color-error)',
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
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
