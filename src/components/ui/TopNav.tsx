'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Settings, LogOut, Moon, Sun, ChevronDown } from 'lucide-react';
import styles from './TopNav.module.css';
import { useAppContext } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';

export default function TopNav() {
  const router = useRouter();
  const { settings, updateSettings, isMounted } = useAppContext();
  const { user, logout } = useAuth();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const toggleTheme = () => {
    updateSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' });
  };

  const isDark = isMounted ? settings.theme === 'dark' : false;

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  const getUserInitials = () => {
    if (!user?.name) return 'U';
    const parts = user.name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
  };

  const getAvatarUrl = (): string | undefined => {
    if (!user?.avatar) return undefined;
    if (typeof user.avatar === 'string') return user.avatar;
    if (typeof user.avatar === 'object' && user.avatar !== null && 'url' in user.avatar) {
      return (user.avatar as { url?: string }).url;
    }
    return undefined;
  };

  const avatarUrl = getAvatarUrl();

  const handleLogout = async () => {
    setIsDropdownOpen(false);
    await logout();
    router.push('/login');
  };

  return (
    <div className={styles.topNavWrapper}>
      <div className={styles.rightSection} ref={dropdownRef}>
        {/* Profile / Account Control Button */}
        <button
          className={styles.profileBtn}
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          aria-label="Account Profile"
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt={user?.name || 'User'} className={styles.avatarImg} />
          ) : (
            <div className={styles.avatarFallback}>{getUserInitials()}</div>
          )}
          <span className={styles.userName}>{user?.name || 'Account'}</span>
          <ChevronDown
            size={14}
            className={`${styles.chevron} ${isDropdownOpen ? styles.chevronOpen : ''}`}
          />
        </button>

        {/* Compact Apple/Linear/Notion-Style Popover */}
        <AnimatePresence>
          {isDropdownOpen && (
            <motion.div
              className={styles.popover}
              initial={{ opacity: 0, y: 8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
            >
              {/* User Identity Header */}
              <div className={styles.userInfoHeader}>
                <div className={styles.headerAvatar}>
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={user?.name || 'User'} className={styles.avatarImg} />
                  ) : (
                    getUserInitials()
                  )}
                </div>
                <div className={styles.headerDetails}>
                  <div className={styles.headerNameRow}>
                    <span className={styles.headerName}>{user?.name || 'Varsh Demo'}</span>
                    {user?.isEmailVerified && (
                      <span className={styles.verifiedBadge}>Verified</span>
                    )}
                  </div>
                  {user?.username && <div className={styles.headerUsername}>@{user.username}</div>}
                  <div className={styles.headerEmail}>{user?.email || 'demo@lifeos.local'}</div>
                </div>
              </div>

              <div className={styles.popoverDivider} />

              {/* Navigation Items */}
              <div className={styles.popoverMenu}>
                <Link
                  href="/profile"
                  className={styles.menuItem}
                  onClick={() => setIsDropdownOpen(false)}
                >
                  <User size={16} className={styles.menuIcon} />
                  <span>Profile</span>
                </Link>

                <Link
                  href="/settings"
                  className={styles.menuItem}
                  onClick={() => setIsDropdownOpen(false)}
                >
                  <Settings size={16} className={styles.menuIcon} />
                  <span>Settings</span>
                </Link>

                <button className={styles.menuItem} onClick={toggleTheme}>
                  {isDark ? <Sun size={16} className={styles.menuIcon} /> : <Moon size={16} className={styles.menuIcon} />}
                  <span>{isDark ? 'Light Theme' : 'Dark Theme'}</span>
                </button>
              </div>

              <div className={styles.popoverDivider} />

              {/* Logout Button */}
              <div className={styles.popoverFooter}>
                <button className={styles.logoutBtn} onClick={handleLogout}>
                  <LogOut size={16} />
                  <span>Log Out</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
