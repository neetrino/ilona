'use client';

import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { FloatingChatWidget } from '@/features/chat';

interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  headerContent?: React.ReactNode;
  /** Optional compact promo banner rendered below the header, above page content */
  promoBanner?: React.ReactNode;
}

export function DashboardLayout({
  children,
  title,
  subtitle,
  headerContent,
  promoBanner,
}: DashboardLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <main className="flex-1 flex flex-col overflow-hidden">
        <Header title={title} subtitle={subtitle} headerContent={headerContent} />
        <div className="flex-1 overflow-auto p-8">
          {promoBanner ? <div className="mb-6">{promoBanner}</div> : null}
          {children}
        </div>
      </main>
      <FloatingChatWidget />
    </div>
  );
}
