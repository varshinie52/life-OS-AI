"use client";

import React, { useState, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  CheckSquare, 
  Repeat, 
  FileText, 
  BookOpen,
  Calendar as CalendarIcon,
  BarChart2,
  Sparkles,
  Settings, 
  Activity,
  User,
  LogOut
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import styles from './Sidebar.module.css';

const TOP_NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', href: '/', icon: LayoutDashboard },
  { id: 'tasks', label: 'Tasks', href: '/tasks', icon: CheckSquare },
  { id: 'habits', label: 'Habits', href: '/habits', icon: Repeat },
  { id: 'notes', label: 'Notes', href: '/notes', icon: FileText },
  { id: 'journal', label: 'Journal', href: '/journal', icon: BookOpen },
  { id: 'calendar', label: 'Calendar', href: '/calendar', icon: CalendarIcon },
  { id: 'analytics', label: 'Analytics', href: '/analytics', icon: BarChart2 },
  { id: 'ai', label: 'AI', href: '/ai', icon: Sparkles },
];

const BOTTOM_NAV_ITEMS = [
  { id: 'settings', label: 'Settings', href: '/settings', icon: Settings },
  { id: 'profile', label: 'Profile', href: '/profile', icon: User },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { logout } = useAuth();
  const [hoveredTooltip, setHoveredTooltip] = useState<{ label: string; top: number } | null>(null);

  const handleMouseEnter = useCallback((label: string) => (e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setHoveredTooltip({
      label,
      top: rect.top + rect.height / 2,
    });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setHoveredTooltip(null);
  }, []);

  return (
    <aside className={styles.sidebar}>
      {/* Header / Logo Section (Fixed at top) */}
      <div className={styles.logoSection}>
        <Link 
          href="/" 
          className={styles.logoSquare} 
          aria-label="LifeOS Home"
          onMouseEnter={handleMouseEnter('Dashboard')}
          onMouseLeave={handleMouseLeave}
          data-tooltip="Dashboard"
        >
          <Activity size={26} strokeWidth={2} />
        </Link>
      </div>

      {/* Scrollable Navigation Area */}
      <div className={styles.scrollNav} onScroll={handleMouseLeave}>
        <nav className={styles.navGroup}>
          {TOP_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.id}
                href={item.href} 
                className={`${styles.navItem} ${isActive ? styles.active : ''}`}
                data-tooltip={item.label}
                onMouseEnter={handleMouseEnter(item.label)}
                onMouseLeave={handleMouseLeave}
              >
                <div className={styles.activeIndicator} />
                <div className={styles.iconWrapper}>
                  <Icon size={24} strokeWidth={2} />
                </div>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Account Section (Accessible at bottom) */}
      <div className={styles.bottomSection}>
        <div className={styles.divider} />
        <nav className={styles.navGroup}>
          {BOTTOM_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.id}
                href={item.href} 
                className={`${styles.navItem} ${isActive ? styles.active : ''}`}
                data-tooltip={item.label}
                onMouseEnter={handleMouseEnter(item.label)}
                onMouseLeave={handleMouseLeave}
              >
                <div className={styles.activeIndicator} />
                <div className={styles.iconWrapper}>
                  <Icon size={24} strokeWidth={2} />
                </div>
              </Link>
            );
          })}
          
          <button 
            className={styles.navItem} 
            onClick={logout} 
            aria-label="Log Out"
            data-tooltip="Logout"
            onMouseEnter={handleMouseEnter('Logout')}
            onMouseLeave={handleMouseLeave}
          >
            <div className={styles.iconWrapper}>
              <LogOut size={24} strokeWidth={2} />
            </div>
          </button>
        </nav>
      </div>

      {/* Unclipped Fixed Floating Hover Tooltip */}
      {hoveredTooltip && (
        <div 
          className={styles.floatingTooltip} 
          style={{ top: `${hoveredTooltip.top}px` }}
        >
          {hoveredTooltip.label}
        </div>
      )}
    </aside>
  );
}
