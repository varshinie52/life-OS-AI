"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Save, Calendar as CalendarIcon, Edit3, Heart } from 'lucide-react';
import styles from './page.module.css';
import { useJournal } from '@/hooks/useJournal';
import { Mood } from '@/lib/types';
import { getToday, formatDate } from '@/lib/utils';
import { useAppContext } from '@/context/AppContext';

const MOODS: { emoji: Mood; label: string }[] = [
  { emoji: '😄', label: 'Great' },
  { emoji: '😊', label: 'Good' },
  { emoji: '😐', label: 'Okay' },
  { emoji: '😔', label: 'Bad' },
  { emoji: '😢', label: 'Awful' }
];

export default function JournalPage() {
  const { isMounted } = useAppContext();
  const { getEntryByDate, saveEntry } = useJournal();
  
  const [currentDateStr, setCurrentDateStr] = useState(getToday());
  const [content, setContent] = useState('');
  const [mood, setMood] = useState<Mood>('😐');
  const [gratitude1, setGratitude1] = useState('');
  const [gratitude2, setGratitude2] = useState('');
  const [gratitude3, setGratitude3] = useState('');
  
  const [isSaved, setIsSaved] = useState(false);

  // Load entry when date changes
  useEffect(() => {
    const entry = getEntryByDate(currentDateStr);
    if (entry) {
      setContent(entry.content);
      setMood(entry.mood);
      setGratitude1(entry.gratitude[0] || '');
      setGratitude2(entry.gratitude[1] || '');
      setGratitude3(entry.gratitude[2] || '');
    } else {
      setContent('');
      setMood('😐');
      setGratitude1('');
      setGratitude2('');
      setGratitude3('');
    }
    setIsSaved(false);
  }, [currentDateStr]);

  const handlePrevDay = () => {
    const d = new Date(currentDateStr);
    d.setDate(d.getDate() - 1);
    setCurrentDateStr(d.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const d = new Date(currentDateStr);
    d.setDate(d.getDate() + 1);
    const newDateStr = d.toISOString().split('T')[0];
    if (newDateStr <= getToday()) {
      setCurrentDateStr(newDateStr);
    }
  };

  const handleSave = () => {
    const gratitudes = [gratitude1, gratitude2, gratitude3].filter(g => g.trim() !== '');
    saveEntry(currentDateStr, content, mood, gratitudes);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  if (!isMounted) return null;

  const isToday = currentDateStr === getToday();

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Daily Journal</h1>
          <p className={styles.subtitle}>Reflect on your day, practice gratitude.</p>
        </div>
        
        <div className={styles.dateControls}>
          <button className={styles.iconBtn} onClick={handlePrevDay}>
            <ChevronLeft size={20} />
          </button>
          <div className={styles.currentDateDisplay}>
            <CalendarIcon size={18} />
            <span>{formatDate(currentDateStr)}</span>
          </div>
          <button 
            className={styles.iconBtn} 
            onClick={handleNextDay}
            disabled={isToday}
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </header>

      <div className={styles.layout}>
        {/* Editor Area */}
        <div className={styles.editorArea}>
          <div className="glass-panel" style={{ padding: '32px', minHeight: '600px', display: 'flex', flexDirection: 'column' }}>
            
            <div className={styles.moodSection}>
              <h3 className={styles.sectionLabel}>How was your day?</h3>
              <div className={styles.moodSelector}>
                {MOODS.map(m => (
                  <button
                    key={m.emoji}
                    className={`${styles.moodBtn} ${mood === m.emoji ? styles.moodBtnActive : ''}`}
                    onClick={() => setMood(m.emoji)}
                    title={m.label}
                  >
                    {m.emoji}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.journalSection}>
              <h3 className={styles.sectionLabel}><Edit3 size={18} /> Brain Dump</h3>
              <textarea
                className={styles.journalTextarea}
                placeholder="Write whatever is on your mind... How are you feeling? What happened today?"
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <aside className={styles.sidebar}>
          <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
            <h3 className={styles.sectionLabel} style={{ marginBottom: '16px' }}>
              <Heart size={18} color="var(--color-error)" /> Gratitude
            </h3>
            <p className={styles.promptText}>What are 3 things you're grateful for today?</p>
            
            <div className={styles.gratitudeList}>
              <div className={styles.gratitudeInputWrapper}>
                <span className={styles.gratitudeNumber}>1.</span>
                <input 
                  type="text" 
                  className={styles.gratitudeInput} 
                  value={gratitude1}
                  onChange={(e) => setGratitude1(e.target.value)}
                  placeholder="I'm grateful for..."
                />
              </div>
              <div className={styles.gratitudeInputWrapper}>
                <span className={styles.gratitudeNumber}>2.</span>
                <input 
                  type="text" 
                  className={styles.gratitudeInput} 
                  value={gratitude2}
                  onChange={(e) => setGratitude2(e.target.value)}
                  placeholder="I'm grateful for..."
                />
              </div>
              <div className={styles.gratitudeInputWrapper}>
                <span className={styles.gratitudeNumber}>3.</span>
                <input 
                  type="text" 
                  className={styles.gratitudeInput} 
                  value={gratitude3}
                  onChange={(e) => setGratitude3(e.target.value)}
                  placeholder="I'm grateful for..."
                />
              </div>
            </div>
          </div>

          <button 
            className={`btn-primary ${styles.saveBtn} ${isSaved ? styles.saveBtnSuccess : ''}`}
            onClick={handleSave}
          >
            <AnimatePresence mode="wait">
              {isSaved ? (
                <motion.div key="saved" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Heart size={18} fill="currentColor" /> Saved!
                </motion.div>
              ) : (
                <motion.div key="save" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Save size={18} /> Save Entry
                </motion.div>
              )}
            </AnimatePresence>
          </button>
        </aside>
      </div>
    </main>
  );
}
