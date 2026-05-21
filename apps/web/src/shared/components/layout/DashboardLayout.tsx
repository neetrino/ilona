'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { StudentSidebar } from './StudentSidebar';
import { Header } from './Header';
import { StudentDashboardHeader } from '@/features/student-dashboard';
import { FloatingChatWidget } from '@/features/chat';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { cn } from '@/shared/lib/utils';
import {
  STUDENT_MAIN_PADDING,
  STUDENT_SHELL_BG,
  STUDENT_SIDEBAR_DESKTOP_CLASS,
  STUDENT_MOBILE_NAV_WIDTH,
} from './student-layout';

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
  const pathname = usePathname();
  const { user } = useAuthStore();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const isStudent = variant === 'student' || user?.role === 'STUDENT';
  const isDashboardHome = isStudent && !title;

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileNavOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileNavOpen]);

  const mainPadding = isStudent ? STUDENT_MAIN_PADDING : 'p-8';

  return (
    <div
      className={cn(
        'flex h-screen min-h-0 w-full max-w-[100vw] overflow-hidden',
        isStudent ? STUDENT_SHELL_BG : 'bg-slate-50',
      )}
    >
      {isStudent ? (
        <div className={STUDENT_SIDEBAR_DESKTOP_CLASS}>
          <StudentSidebar
            collapsed={sidebarCollapsed}
            onToggle={() => setSidebarCollapsed((c) => !c)}
            layout="dock"
          />
        </div>
      ) : (
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed((c) => !c)}
        />
      )}

      {isStudent && mobileNavOpen ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-[55] bg-black/40 lg:hidden"
            onClick={() => setMobileNavOpen(false)}
            aria-label="Close navigation menu"
          />
          <div
            className="fixed inset-y-0 left-0 z-[60] flex lg:hidden"
            style={{ width: STUDENT_MOBILE_NAV_WIDTH }}
          >
            <StudentSidebar
              layout="drawer"
              onNavigate={() => setMobileNavOpen(false)}
            />
          </div>
        </>
      ) : null}

      <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        {isStudent ? (
          <StudentDashboardHeader
            pageTitle={isDashboardHome ? undefined : title}
            pageSubtitle={isDashboardHome ? undefined : subtitle}
            onMenuClick={() => setMobileNavOpen(true)}
          />
        ) : (
          <Header
            title={title}
            subtitle={subtitle}
            headerContent={headerContent}
          />
        )}
        <div
          className={cn(
            'min-h-0 flex-1 overflow-x-hidden overflow-y-auto',
            mainPadding,
          )}
        >
          {promoBanner ? <div className="mb-4 sm:mb-6">{promoBanner}</div> : null}
          <div className="mx-auto w-full min-w-0 max-w-[90rem]">{children}</div>
        </div>
      </main>
      <FloatingChatWidget />
    </div>
  );
}
