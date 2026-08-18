"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  CheckSquare, 
  Repeat, 
  CreditCard, 
  FileText, 
  BookOpen,
  Settings, 
  Activity,
  User,
  LogOut
} from 'lucide-react';
import styles from './Sidebar.module.css';

const TOP_NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', href: '/', icon: LayoutDashboard },
  { id: 'tasks', label: 'Tasks', href: '/tasks', icon: CheckSquare },
  { id: 'habits', label: 'Habits', href: '/habits', icon: Repeat },
  { id: 'notes', label: 'Notes', href: '/notes', icon: FileText },
  { id: 'expenses', label: 'Expenses', href: '/expenses', icon: CreditCard },
  { id: 'journal', label: 'Journal', href: '/journal', icon: BookOpen },
];

const BOTTOM_NAV_ITEMS = [
  { id: 'settings', label: 'Settings', href: '/settings', icon: Settings },
  { id: 'profile', label: 'Profile', href: '/profile', icon: User },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className={styles.sidebar}>
      {/* Logo Widget */}
      <div className={styles.logoSection}>
        <Link href="/" className={styles.logoSquare}>
          <Activity size={28} strokeWidth={2} />
        </Link>
      </div>

      {/* Top Navigation Rail */}
      <nav className={styles.navGroup}>
        {TOP_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link 
              key={item.id}
              href={item.href} 
              className={`${styles.navItem} ${isActive ? styles.active : ''}`}
            >
              <div className={styles.activeIndicator} />
              <div className={styles.iconWrapper}>
                <Icon size={24} strokeWidth={2} />
              </div>
              <span className={styles.tooltip}>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Navigation Rail */}
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
              >
                <div className={styles.activeIndicator} />
                <div className={styles.iconWrapper}>
                  <Icon size={24} strokeWidth={2} />
                </div>
                <span className={styles.tooltip}>{item.label}</span>
              </Link>
            );
          })}
          
          <button className={styles.navItem}>
            <div className={styles.iconWrapper}>
              <LogOut size={24} strokeWidth={2} />
            </div>
            <span className={styles.tooltip}>Log Out</span>
          </button>
        </nav>
      </div>
    </aside>
  );
}
