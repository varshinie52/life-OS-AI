'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from '@/components/ui/Sidebar';
import TopNav from '@/components/ui/TopNav';

export default function NavigationWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isFocusMode = pathname === '/focus';

  if (isFocusMode) {
    return <div className="focus-mode-wrapper">{children}</div>;
  }

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-content">
        <TopNav />
        {children}
      </div>
    </div>
  );
}
