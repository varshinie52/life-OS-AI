"use client";

import React, { useState } from 'react';
import { Save, User, Palette, Clock, Bell, LogOut, CheckCircle } from 'lucide-react';
import styles from './page.module.css';
import { useAppContext } from '@/context/AppContext';
import { DEFAULT_SETTINGS } from '@/lib/utils';
import { Theme, Currency } from '@/lib/types';
import { motion, AnimatePresence } from 'framer-motion';

export default function SettingsPage() {
  const { isMounted, settings, updateSettings, userName, updateUserName } = useAppContext();
  
  const [localName, setLocalName] = useState(userName);
  const [theme, setTheme] = useState<Theme>(settings.theme);
  const [currency, setCurrency] = useState<Currency>(settings.currency);
  const [pomoWork, setPomoWork] = useState(settings.pomodoroWork);
  const [pomoShort, setPomoShort] = useState(settings.pomodoroShortBreak);
  const [pomoLong, setPomoLong] = useState(settings.pomodoroLongBreak);
  
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = () => {
    updateUserName(localName);
    updateSettings({
      theme,
      currency,
      pomodoroWork: pomoWork,
      pomodoroShortBreak: pomoShort,
      pomodoroLongBreak: pomoLong
    });
    
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleReset = () => {
    setTheme(DEFAULT_SETTINGS.theme);
    setCurrency(DEFAULT_SETTINGS.currency);
    setPomoWork(DEFAULT_SETTINGS.pomodoroWork);
    setPomoShort(DEFAULT_SETTINGS.pomodoroShortBreak);
    setPomoLong(DEFAULT_SETTINGS.pomodoroLongBreak);
  };

  if (!isMounted) return null;

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Settings</h1>
          <p className={styles.subtitle}>Customize your LifeOS experience.</p>
        </div>
        
        <div className={styles.headerActions}>
          <button className="btn-secondary" onClick={handleReset}>Reset Defaults</button>
          <button 
            className={`btn-primary ${styles.saveBtn} ${isSaved ? styles.saved : ''}`}
            onClick={handleSave}
          >
            {isSaved ? <><CheckCircle size={18} /> Saved</> : <><Save size={18} /> Save Changes</>}
          </button>
        </div>
      </header>

      <div className={styles.layout}>
        {/* Profile Settings */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}><User size={20} /> Profile</h2>
          <div className="glass-panel" style={{ padding: '32px' }}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Display Name</label>
              <input 
                type="text" 
                className="input-field" 
                value={localName} 
                onChange={(e) => setLocalName(e.target.value)}
                placeholder="What should we call you?"
              />
              <p className={styles.helpText}>This name will be used to greet you on the dashboard.</p>
            </div>
            
            <div className={styles.profileDangerZone}>
              <button className={styles.dangerBtn}>
                <LogOut size={16} /> Sign Out (Demo)
              </button>
            </div>
          </div>
        </section>

        {/* Appearance Settings */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}><Palette size={20} /> Appearance & Region</h2>
          <div className="glass-panel" style={{ padding: '32px' }}>
            
            <div className={styles.formGroup}>
              <label className={styles.label}>Theme</label>
              <div className={styles.themeSelector}>
                <label className={`${styles.themeOption} ${theme === 'light' ? styles.themeActive : ''}`}>
                  <input type="radio" name="theme" value="light" checked={theme === 'light'} onChange={() => setTheme('light')} hidden />
                  <div className={styles.themePreviewLight}></div>
                  <span>Light</span>
                </label>
                <label className={`${styles.themeOption} ${theme === 'dark' ? styles.themeActive : ''}`}>
                  <input type="radio" name="theme" value="dark" checked={theme === 'dark'} onChange={() => setTheme('dark')} hidden />
                  <div className={styles.themePreviewDark}></div>
                  <span>Dark</span>
                </label>
                <label className={`${styles.themeOption} ${theme === 'system' ? styles.themeActive : ''}`}>
                  <input type="radio" name="theme" value="system" checked={theme === 'system'} onChange={() => setTheme('system')} hidden />
                  <div className={styles.themePreviewSystem}></div>
                  <span>System</span>
                </label>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Currency Symbol</label>
              <select className="input-field" value={currency} onChange={(e) => setCurrency(e.target.value as Currency)}>
                <option value="₹">₹ (INR)</option>
                <option value="$">$ (USD)</option>
                <option value="€">€ (EUR)</option>
                <option value="£">£ (GBP)</option>
                <option value="¥">¥ (JPY)</option>
              </select>
            </div>

          </div>
        </section>

        {/* Pomodoro Settings */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}><Clock size={20} /> Pomodoro Timer</h2>
          <div className="glass-panel" style={{ padding: '32px' }}>
            
            <div className={styles.gridForm}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Focus Session (minutes)</label>
                <input 
                  type="number" 
                  className="input-field" 
                  value={pomoWork}
                  onChange={(e) => setPomoWork(Number(e.target.value))}
                  min="5" max="120"
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Short Break (minutes)</label>
                <input 
                  type="number" 
                  className="input-field" 
                  value={pomoShort}
                  onChange={(e) => setPomoShort(Number(e.target.value))}
                  min="1" max="30"
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Long Break (minutes)</label>
                <input 
                  type="number" 
                  className="input-field" 
                  value={pomoLong}
                  onChange={(e) => setPomoLong(Number(e.target.value))}
                  min="5" max="60"
                />
              </div>
            </div>

          </div>
        </section>

      </div>
    </main>
  );
}
