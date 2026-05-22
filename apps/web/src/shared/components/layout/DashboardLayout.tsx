'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { StudentSidebar } from './StudentSidebar';
import { TeacherSidebar } from './TeacherSidebar';
import { AdminSidebar } from './AdminSidebar';
import { Header } from './Header';
import { StudentDashboardHeader } from '@/features/student-dashboard';
import { TeacherDashboardHeader } from '@/features/teacher-dashboard';
import { AdminDashboardHeader } from '@/features/admin-dashboard';
import { FloatingChatWidget } from '@/features/chat';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { PortalShellProvider } from '@/shared/context/portal-shell-context';
import { cn } from '@/shared/lib/utils';
import { isAdminPortalPath } from '@/shared/lib/role-routes';
import {
  PORTAL_MAIN_PADDING,
  PORTAL_MOBILE_NAV_WIDTH,
  PORTAL_SHELL_BG,
  PORTAL_SIDEBAR_DESKTOP_CLASS,
} from './student-layout';

interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  headerContent?: React.ReactNode;
  /** Optional compact promo banner rendered below the header, above page content */
  promoBanner?: React.ReactNode;
  /** Student/teacher/admin dashboards use the Figma portal shell */
  variant?: 'default' | 'student' | 'teacher' | 'admin';
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

  const role = user?.role;
  const isAdminRoute = isAdminPortalPath(pathname.replace(/^\/[a-z]{2}\//, '/'));
  const isStudentPortal =
    variant === 'student' || (variant === 'default' && role === 'STUDENT');
  const isTeacherPortal =
    variant === 'teacher' || (variant === 'default' && role === 'TEACHER');
  const isAdminPortal =
    variant === 'admin' ||
    (variant === 'default' && (role === 'ADMIN' || role === 'MANAGER') && isAdminRoute);
  const isPortalShell = isStudentPortal || isTeacherPortal || isAdminPortal;
  const isDashboardHome = isPortalShell && !title;

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

  const mainPadding = isPortalShell ? PORTAL_MAIN_PADDING : 'p-8';

  const portalSidebar = isStudentPortal ? (
    <StudentSidebar
      collapsed={sidebarCollapsed}
      onToggle={() => setSidebarCollapsed((c) => !c)}
      layout="dock"
    />
  ) : isTeacherPortal ? (
    <TeacherSidebar
      collapsed={sidebarCollapsed}
      onToggle={() => setSidebarCollapsed((c) => !c)}
      layout="dock"
    />
  ) : (
    <AdminSidebar
      collapsed={sidebarCollapsed}
      onToggle={() => setSidebarCollapsed((c) => !c)}
      layout="dock"
    />
  );

  const drawerSidebar = isStudentPortal ? (
    <StudentSidebar layout="drawer" onNavigate={() => setMobileNavOpen(false)} />
  ) : isTeacherPortal ? (
    <TeacherSidebar layout="drawer" onNavigate={() => setMobileNavOpen(false)} />
  ) : (
    <AdminSidebar layout="drawer" onNavigate={() => setMobileNavOpen(false)} />
  );

  return (
    <PortalShellProvider enabled={isPortalShell}>
      <div
        className={cn(
          'flex h-screen min-h-0 w-full max-w-[100vw] overflow-hidden',
          isPortalShell ? PORTAL_SHELL_BG : 'bg-slate-50',
        )}
      >
        {isPortalShell ? (
          <div className={PORTAL_SIDEBAR_DESKTOP_CLASS}>{portalSidebar}</div>
        ) : (
          <Sidebar
            collapsed={sidebarCollapsed}
            onToggle={() => setSidebarCollapsed((c) => !c)}
          />
        )}

        {isPortalShell && mobileNavOpen ? (
          <>
            <button
              type="button"
              className="fixed inset-0 z-[55] bg-black/40 lg:hidden"
              onClick={() => setMobileNavOpen(false)}
              aria-label="Close navigation menu"
            />
            <div
              className="fixed inset-y-0 left-0 z-[60] flex lg:hidden"
              style={{ width: PORTAL_MOBILE_NAV_WIDTH }}
            >
              {drawerSidebar}
            </div>
          </>
        ) : null}

        <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          {isStudentPortal ? (
            <StudentDashboardHeader
              pageTitle={isDashboardHome ? undefined : title}
              pageSubtitle={isDashboardHome ? undefined : subtitle}
              onMenuClick={() => setMobileNavOpen(true)}
            />
          ) : isTeacherPortal ? (
            <TeacherDashboardHeader
              pageTitle={isDashboardHome ? undefined : title}
              pageSubtitle={isDashboardHome ? undefined : subtitle}
              onMenuClick={() => setMobileNavOpen(true)}
            />
          ) : isAdminPortal ? (
            <AdminDashboardHeader
              pageTitle={isDashboardHome ? undefined : title}
              pageSubtitle={isDashboardHome ? undefined : subtitle}
              headerContent={headerContent}
              onMenuClick={() => setMobileNavOpen(true)}
            />
          ) : (
            <Header title={title} subtitle={subtitle} headerContent={headerContent} />
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
    </PortalShellProvider>
  );
}
