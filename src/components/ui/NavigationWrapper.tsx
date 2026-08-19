'use client';

import React, { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { usePathname, useRouter } from 'next/navigation';
import Sidebar from '@/components/ui/Sidebar';
import TopNav from '@/components/ui/TopNav';
import { useAuth } from '@/context/AuthContext';
import { Activity } from 'lucide-react';

// Dynamic import for AIChatWidget reduces initial JS bundle size across all routes
const AIChatWidget = dynamic(() => import('@/components/ui/AIChatWidget/AIChatWidget'), {
  ssr: false,
});

export default function NavigationWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();

  const isFocusMode = pathname === '/focus';
  const isAuthRoute =
    pathname === '/login' ||
    pathname === '/signup' ||
    pathname === '/forgot-password' ||
    pathname.startsWith('/verify-email') ||
    pathname.startsWith('/reset-password');

  useEffect(() => {
    if (!loading && !isAuthenticated && !isAuthRoute) {
      router.replace('/login');
    }
  }, [loading, isAuthenticated, isAuthRoute, router]);

  useEffect(() => {
    if (!loading && isAuthenticated && isAuthRoute) {
      router.replace('/');
    }
  }, [loading, isAuthenticated, isAuthRoute, router]);

  if (loading && !isAuthRoute) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', width: '100vw' }}>
        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
        <Activity size={48} color="var(--moss)" style={{ animation: 'spin 2s linear infinite' }} />
      </div>
    );
  }

  if (isFocusMode || isAuthRoute) {
    return <div className={isFocusMode ? 'focus-mode-wrapper' : 'auth-wrapper'}>{children}</div>;
  }

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-content">
        <TopNav />
        {children}
      </div>
      {/* Dynamic AI chat widget — available on every authenticated page */}
      <AIChatWidget />
    </div>
  );
}
