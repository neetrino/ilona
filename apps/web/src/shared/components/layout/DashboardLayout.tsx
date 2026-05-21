'use client';

import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { StudentDashboardHeader } from '@/features/student-dashboard';
import { FloatingChatWidget } from '@/features/chat';

interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  headerContent?: React.ReactNode;
  /** Optional compact promo banner rendered below the header, above page content */
  promoBanner?: React.ReactNode;
  /** Student dashboard uses custom header and page background from Figma */
  variant?: 'default' | 'student';
}

export function DashboardLayout({
  children,
  title,
  subtitle,
  headerContent,
  promoBanner,
  variant = 'default',
}: DashboardLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const isStudent = variant === 'student';

  return (
    <div className={`flex h-screen ${isStudent ? 'bg-[#ececec]' : 'bg-slate-50'}`}>
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <main className="flex-1 flex flex-col overflow-hidden">
        {isStudent ? (
          <StudentDashboardHeader />
        ) : (
          <Header title={title} subtitle={subtitle} headerContent={headerContent} />
        )}
        <div
          className={`flex-1 overflow-auto ${isStudent ? 'px-4 py-5 sm:px-6 lg:px-8' : 'p-8'}`}
        >
          {promoBanner ? <div className="mb-6">{promoBanner}</div> : null}
          {children}
        </div>
      </main>
      <FloatingChatWidget />
    </div>
  );
}
