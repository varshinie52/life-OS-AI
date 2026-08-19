'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Palette, 
  Globe, 
  Bell, 
  Shield, 
  Download, 
  Trash2, 
  Save, 
  Moon, 
  Sun, 
  Laptop, 
  Check, 
  AlertTriangle, 
  Loader2, 
  Lock, 
  UserCheck 
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useLifeOS } from '@/context/LifeOSContext';
import styles from './page.module.css';

interface NotificationSettings {
  email: boolean;
  push: boolean;
  dailyDigest: boolean;
  habitReminders: boolean;
  taskReminders: boolean;
}

interface PrivacySettings {
  publicProfile: boolean;
  shareAnalytics: boolean;
}

interface UserSettings {
  theme: 'light' | 'dark' | 'system';
  accentColor: string;
  language: string;
  timeZone: string;
  dateFormat: string;
  notifications: NotificationSettings;
  privacy: PrivacySettings;
}

const ACCENT_COLORS = [
  { hex: '#6B7F4E', label: 'Moss Green' },
  { hex: '#1F3D2E', label: 'Forest Shade' },
  { hex: '#A2B5A0', label: 'Sage Mist' },
  { hex: '#DCC8A3', label: 'Sand Beige' },
  { hex: '#4C6A73', label: 'River Blue' },
  { hex: '#5A443A', label: 'Earth Brown' },
];

export default function SettingsPage() {
  const { authFetch, isAuthenticated, logout } = useAuth();
  const { showToast } = useToast();
  const lifeOS = useLifeOS();

  const [activeTab, setActiveTab] = useState<'appearance' | 'preferences' | 'notifications' | 'privacy' | 'data'>('appearance');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Settings State
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('dark');
  const [accentColor, setAccentColor] = useState('#6B7F4E');
  const [language, setLanguage] = useState('en');
  const [timeZone, setTimeZone] = useState('Asia/Kolkata');
  const [dateFormat, setDateFormat] = useState('YYYY-MM-DD');

  const [notifications, setNotifications] = useState<NotificationSettings>({
    email: true,
    push: true,
    dailyDigest: true,
    habitReminders: true,
    taskReminders: true,
  });

  const [privacy, setPrivacy] = useState<PrivacySettings>({
    publicProfile: false,
    shareAnalytics: false,
  });

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

  // Fetch Settings
  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await authFetch(`${API_URL}/settings`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data.settings) {
          const s = data.data.settings;
          setTheme(s.theme || 'dark');
          setAccentColor(s.accentColor || '#6B7F4E');
          setLanguage(s.language || 'en');
          setTimeZone(s.timeZone || 'Asia/Kolkata');
          setDateFormat(s.dateFormat || 'YYYY-MM-DD');
          if (s.notifications) setNotifications(s.notifications);
          if (s.privacy) setPrivacy(s.privacy);
        }
      }
    } catch (err) {
      showToast('Error loading user settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchSettings();
    }
  }, [isAuthenticated]);

  // Save Settings Changes
  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      const payload = {
        theme,
        accentColor,
        language,
        timeZone,
        dateFormat,
        notifications,
        privacy,
      };

      const res = await authFetch(`${API_URL}/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast('Settings saved successfully! ⚙️', 'success');
      } else {
        showToast(data.message || 'Failed to save settings', 'error');
      }
    } catch (err) {
      showToast('Error saving settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Export User Data JSON
  const handleExportData = async () => {
    setExporting(true);
    try {
      const res = await authFetch(`${API_URL}/settings/export`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        const jsonStr = JSON.stringify(data.data.exportData || data, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `lifeos-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        showToast('User data exported successfully!', 'success');
      } else {
        showToast('Failed to export data', 'error');
      }
    } catch (err) {
      showToast('Error exporting data', 'error');
    } finally {
      setExporting(false);
    }
  };

  // Permanently Delete Account
  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      const res = await authFetch(`${API_URL}/settings/account`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Account deleted. Redirecting...', 'info');
        logout();
      } else {
        const data = await res.json();
        showToast(data.message || 'Failed to delete account', 'error');
      }
    } catch (err) {
      showToast('Error deleting account', 'error');
    } finally {
      setDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

  const toggleNotification = (key: keyof NotificationSettings) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const togglePrivacy = (key: keyof PrivacySettings) => {
    setPrivacy((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>System Settings</h1>
          <p className={styles.subtitle}>Customize your application preferences, notifications, theme, and data security.</p>
        </div>

        <button onClick={handleSaveSettings} disabled={saving} className={styles.saveBtn}>
          {saving ? <Loader2 className={styles.spinning} size={18} /> : <><Save size={18} /> Save Settings</>}
        </button>
      </div>

      {/* Tabs Navigation */}
      <div className={styles.tabsRow}>
        <button
          className={`${styles.tabBtn} ${activeTab === 'appearance' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('appearance')}
        >
          <Palette size={16} /> Appearance
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === 'preferences' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('preferences')}
        >
          <Globe size={16} /> Region & Preferences
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === 'notifications' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('notifications')}
        >
          <Bell size={16} /> Notifications
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === 'privacy' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('privacy')}
        >
          <Shield size={16} /> Privacy & Security
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === 'data' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('data')}
        >
          <Download size={16} /> Data & Account
        </button>
      </div>

      {/* Main Settings Body */}
      {loading ? (
        <div style={{ padding: '5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <Loader2 className={styles.spinning} size={32} style={{ margin: '0 auto 12px' }} />
          <p>Loading your settings...</p>
        </div>
      ) : (
        <div className={styles.settingsCard}>
          {/* TAB 1: APPEARANCE */}
          {activeTab === 'appearance' && (
            <>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Theme Mode</label>
                <p className={styles.formDesc}>Select your preferred interface color mode.</p>

                <div className={styles.themeGrid}>
                  <div
                    onClick={() => setTheme('dark')}
                    className={`${styles.themeOption} ${theme === 'dark' ? styles.themeOptionActive : ''}`}
                  >
                    <Moon size={24} />
                    <span>Dark</span>
                  </div>

                  <div
                    onClick={() => setTheme('light')}
                    className={`${styles.themeOption} ${theme === 'light' ? styles.themeOptionActive : ''}`}
                  >
                    <Sun size={24} />
                    <span>Light</span>
                  </div>

                  <div
                    onClick={() => setTheme('system')}
                    className={`${styles.themeOption} ${theme === 'system' ? styles.themeOptionActive : ''}`}
                  >
                    <Laptop size={24} />
                    <span>System</span>
                  </div>
                </div>
              </div>

              <div className={styles.formGroup} style={{ marginTop: '1rem' }}>
                <label className={styles.formLabel}>Accent Color</label>
                <p className={styles.formDesc}>Choose your personal brand primary accent color.</p>

                <div className={styles.swatchRow}>
                  {ACCENT_COLORS.map((c) => (
                    <button
                      key={c.hex}
                      type="button"
                      className={`${styles.swatch} ${accentColor === c.hex ? styles.swatchSelected : ''}`}
                      style={{ backgroundColor: c.hex }}
                      onClick={() => setAccentColor(c.hex)}
                      title={c.label}
                    />
                  ))}
                </div>
              </div>
            </>
          )}

          {/* TAB 2: PREFERENCES */}
          {activeTab === 'preferences' && (
            <>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>System Language</label>
                <select value={language} onChange={(e) => setLanguage(e.target.value)} className={styles.selectInput}>
                  <option value="en">English (US)</option>
                  <option value="es">Español (Spanish)</option>
                  <option value="fr">Français (French)</option>
                  <option value="de">Deutsch (German)</option>
                  <option value="ja">日本語 (Japanese)</option>
                  <option value="hi">हिंदी (Hindi)</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Time Zone</label>
                <select value={timeZone} onChange={(e) => setTimeZone(e.target.value)} className={styles.selectInput}>
                  <option value="Asia/Kolkata">(UTC+05:30) India Standard Time - Kolkata</option>
                  <option value="UTC">(UTC+00:00) UTC Time Zone</option>
                  <option value="America/New_York">(UTC-05:00) Eastern Time - New York</option>
                  <option value="America/Los_Angeles">(UTC-08:00) Pacific Time - Los Angeles</option>
                  <option value="Europe/London">(UTC+00:00) Greenwich Mean Time - London</option>
                  <option value="Asia/Tokyo">(UTC+09:00) Japan Standard Time - Tokyo</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Date Display Format</label>
                <select value={dateFormat} onChange={(e) => setDateFormat(e.target.value)} className={styles.selectInput}>
                  <option value="YYYY-MM-DD">YYYY-MM-DD (2026-08-07)</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY (08/07/2026)</option>
                  <option value="DD/MM/YYYY">DD/MM/YYYY (07/08/2026)</option>
                </select>
              </div>
            </>
          )}

          {/* TAB 3: NOTIFICATIONS */}
          {activeTab === 'notifications' && (
            <div>
              <div className={styles.toggleRow}>
                <div>
                  <div className={styles.formLabel}>Email Notifications</div>
                  <div className={styles.formDesc}>Receive email updates and digest reports.</div>
                </div>
                <div
                  className={`${styles.toggleSwitch} ${notifications.email ? styles.toggleActive : ''}`}
                  onClick={() => toggleNotification('email')}
                >
                  <div className={styles.toggleThumb} />
                </div>
              </div>

              <div className={styles.toggleRow}>
                <div>
                  <div className={styles.formLabel}>Browser Push Notifications</div>
                  <div className={styles.formDesc}>Get real-time browser popups for task due dates.</div>
                </div>
                <div
                  className={`${styles.toggleSwitch} ${notifications.push ? styles.toggleActive : ''}`}
                  onClick={() => toggleNotification('push')}
                >
                  <div className={styles.toggleThumb} />
                </div>
              </div>

              <div className={styles.toggleRow}>
                <div>
                  <div className={styles.formLabel}>Daily Digest Email</div>
                  <div className={styles.formDesc}>A morning summary of upcoming tasks & habits.</div>
                </div>
                <div
                  className={`${styles.toggleSwitch} ${notifications.dailyDigest ? styles.toggleActive : ''}`}
                  onClick={() => toggleNotification('dailyDigest')}
                >
                  <div className={styles.toggleThumb} />
                </div>
              </div>

              <div className={styles.toggleRow}>
                <div>
                  <div className={styles.formLabel}>Habit Check-in Reminders</div>
                  <div className={styles.formDesc}>Evening reminders for incomplete daily habits.</div>
                </div>
                <div
                  className={`${styles.toggleSwitch} ${notifications.habitReminders ? styles.toggleActive : ''}`}
                  onClick={() => toggleNotification('habitReminders')}
                >
                  <div className={styles.toggleThumb} />
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: PRIVACY */}
          {activeTab === 'privacy' && (
            <div>
              <div className={styles.toggleRow}>
                <div>
                  <div className={styles.formLabel}>Public Profile Visibility</div>
                  <div className={styles.formDesc}>Allow others to view your profile banner & streak stats.</div>
                </div>
                <div
                  className={`${styles.toggleSwitch} ${privacy.publicProfile ? styles.toggleActive : ''}`}
                  onClick={() => togglePrivacy('publicProfile')}
                >
                  <div className={styles.toggleThumb} />
                </div>
              </div>

              <div className={styles.toggleRow}>
                <div>
                  <div className={styles.formLabel}>Share Anonymous System Analytics</div>
                  <div className={styles.formDesc}>Help improve LifeOS by sharing anonymous usage metrics.</div>
                </div>
                <div
                  className={`${styles.toggleSwitch} ${privacy.shareAnalytics ? styles.toggleActive : ''}`}
                  onClick={() => togglePrivacy('shareAnalytics')}
                >
                  <div className={styles.toggleThumb} />
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: DATA & ACCOUNT */}
          {activeTab === 'data' && (
            <div>
              {/* Demo Data Management */}
              <div className={styles.formGroup} style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1.5rem', marginBottom: '1.5rem' }}>
                <label className={styles.formLabel}>Demo Data Controls</label>
                <p className={styles.formDesc}>
                  Populate your LifeOS instance with ~15 realistic demo items per module for presentation and testing. Demo records are flagged separately (`isDemo: true`) and will not touch your real user records when cleared.
                </p>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
                  <button
                    type="button"
                    onClick={() => {
                      lifeOS.loadDemoData();
                      showToast('Demo data loaded successfully! 🚀', 'success');
                    }}
                    style={{
                      background: 'var(--moss)',
                      color: '#ffffff',
                      border: 'none',
                      padding: '0.75rem 1.25rem',
                      borderRadius: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Load Demo Data
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      lifeOS.clearDemoData();
                      showToast('Demo data cleared!', 'info');
                    }}
                    style={{
                      background: 'transparent',
                      color: 'var(--text-secondary)',
                      border: '1px solid var(--border-subtle)',
                      padding: '0.75rem 1.25rem',
                      borderRadius: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Clear Demo Data Only
                  </button>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Export System Data</label>
                <p className={styles.formDesc}>Download a copy of all your Tasks, Habits, Notes, Journal entries, and Events in JSON format.</p>
                <button
                  type="button"
                  onClick={handleExportData}
                  disabled={exporting}
                  style={{
                    background: 'rgba(107, 127, 78, 0.15)',
                    color: 'var(--moss)',
                    border: '1px solid rgba(107, 127, 78, 0.3)',
                    padding: '0.75rem 1.25rem',
                    borderRadius: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    width: 'fit-content',
                  }}
                >
                  {exporting ? <Loader2 className={styles.spinning} size={18} /> : <><Download size={18} /> Download Export JSON</>}
                </button>
              </div>

              <div className={styles.dangerZone}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#ef4444', margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <AlertTriangle size={18} /> Danger Zone
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0 0 1rem' }}>
                  Permanently delete your account and remove all personal data across all modules. This action is irreversible.
                </p>
                <button type="button" onClick={() => setIsDeleteModalOpen(true)} className={styles.dangerBtn}>
                  <Trash2 size={16} /> Delete Account & Wipe Data
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Delete Account Modal */}
      <AnimatePresence>
        {isDeleteModalOpen && (
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
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ef4444', margin: '0 0 0.5rem' }}>
                Are you absolutely sure?
              </h2>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1.5rem' }}>
                This will permanently delete your user profile, tasks, habit logs, notes, journal entries, and calendar events. You will not be able to recover this data.
              </p>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  style={{
                    background: 'transparent',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: 'var(--text-secondary)',
                    padding: '0.65rem 1.25rem',
                    borderRadius: '10px',
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleting}
                  style={{
                    background: '#ef4444',
                    color: '#ffffff',
                    border: 'none',
                    padding: '0.65rem 1.5rem',
                    borderRadius: '10px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  {deleting ? <Loader2 className={styles.spinning} size={18} /> : 'Yes, Delete My Account'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
