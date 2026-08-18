"use client";

import React from 'react';
import { Search, Bell, Moon, Sun } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './TopNav.module.css';
import { useAppContext } from '@/context/AppContext';

export default function TopNav() {
  const { settings, updateSettings, isMounted } = useAppContext();

  const toggleTheme = () => {
    updateSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' });
  };

  const isDark = isMounted ? settings.theme === 'dark' : true;

  return (
    <div className={styles.topNavWrapper}>
      <header className={styles.actionsBox}>
        <button className={styles.actionBtn} aria-label="Search">
          <Search size={20} />
        </button>

        <button 
          className={styles.actionBtn} 
          onClick={toggleTheme}
          aria-label="Toggle Theme"
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={isDark ? 'dark' : 'light'}
              initial={{ y: -20, opacity: 0, rotate: -90 }}
              animate={{ y: 0, opacity: 1, rotate: 0 }}
              exit={{ y: 20, opacity: 0, rotate: 90 }}
              transition={{ duration: 0.2 }}
            >
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </motion.div>
          </AnimatePresence>
        </button>
        
        <button className={styles.actionBtn} aria-label="Notifications">
          <Bell size={20} />
          <span className={styles.notificationBadge}></span>
        </button>
      </header>
    </div>
  );
}
