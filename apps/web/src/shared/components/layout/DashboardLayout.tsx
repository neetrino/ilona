'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
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
import { PortalMobileBottomNav } from '@/shared/components/layout/PortalMobileBottomNav';
import { cn } from '@/shared/lib/utils';
import {
  isAdminPortalPath,
  isAdminPortalSubpage,
  isStudentPortalSubpage,
  isTeacherPortalSubpage,
} from '@/shared/lib/role-routes';
import {
  PORTAL_CONTENT_SCROLL_ID,
  PORTAL_MOBILE_BOTTOM_NAV_OFFSET_CLASS,
} from '@/shared/lib/portal-mobile-layout';
import {
  PORTAL_MAIN_PADDING,
  PORTAL_MOBILE_NAV_WIDTH,
  PORTAL_SHELL_BG,
  PORTAL_SIDEBAR_DESKTOP_CLASS,
} from './student-layout';

const SIDEBAR_COLLAPSED_STORAGE_KEY = 'portal-sidebar-collapsed';

function getInitialSidebarCollapsedState(): boolean {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(SIDEBAR_COLLAPSED_STORAGE_KEY) === 'true';
}

interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  headerContent?: React.ReactNode;
  /** Optional compact promo banner rendered below the header, above page content */
  promoBanner?: React.ReactNode;
  /** Student/teacher/admin dashboards use the Figma portal shell */
  variant?: 'default' | 'student' | 'teacher' | 'admin';
  /** Optional class for the main content scroll container */
  contentScrollClassName?: string;
  /** Full-bleed mobile page: hide admin header and remove content padding below lg */
  mobileFullBleed?: boolean;
  /** Teacher subpages: navigate back in browser history with optional fallback */
  onBack?: () => void;
  backLabel?: string;
}

export function DashboardLayout({
  children,
  title,
  subtitle,
  headerContent,
  promoBanner,
  variant = 'default',
  contentScrollClassName,
  mobileFullBleed = false,
  onBack,
  backLabel,
}: DashboardLayoutProps) {
  const t = useTranslations('common');
  const pathname = usePathname();
  const { user } = useAuthStore();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(getInitialSidebarCollapsedState);
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
  const normalizedPath = pathname.replace(/^\/[a-z]{2}\//, '/');
  const hasAdminBottomNav = isAdminPortal && isAdminPortalSubpage(normalizedPath, role);
  const hasTeacherBottomNav = isTeacherPortal && isTeacherPortalSubpage(normalizedPath);
  const hasStudentBottomNav = isStudentPortal && isStudentPortalSubpage(normalizedPath);
  const hasMobileBottomNav = hasAdminBottomNav || hasTeacherBottomNav || hasStudentBottomNav;
  const isPortalShell = isStudentPortal || isTeacherPortal || isAdminPortal;
  const isDashboardHome = isPortalShell && !title;
  const portalHeaderSubtitle = isDashboardHome ? subtitle : undefined;

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

  useEffect(() => {
    window.localStorage.setItem(SIDEBAR_COLLAPSED_STORAGE_KEY, String(sidebarCollapsed));
  }, [sidebarCollapsed]);

  const mainPadding =
    mobileFullBleed && isPortalShell
      ? 'p-0 lg:p-[clamp(0.75rem,2vw,2rem)] lg:py-[clamp(0.75rem,1.5vw,1.25rem)]'
      : isPortalShell
        ? PORTAL_MAIN_PADDING
        : 'p-8';

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
    <PortalShellProvider enabled={isPortalShell} sidebarCollapsed={sidebarCollapsed}>
      <div
        className={cn(
          'flex min-h-screen w-full max-w-[100vw]',
          isAdminPortal
            ? 'min-h-[100dvh] overflow-visible md:min-h-screen md:h-screen md:overflow-hidden md:overflow-x-hidden'
            : 'lg:h-screen lg:overflow-hidden lg:overflow-x-hidden',
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

        {isPortalShell && mobileNavOpen && !isAdminPortal && !isTeacherPortal && !isStudentPortal ? (
          <>
            <button
              type="button"
              className="fixed inset-0 z-[55] bg-black/40 lg:hidden"
              onClick={() => setMobileNavOpen(false)}
              aria-label={t('closeNavigationMenu')}
            />
            <div
              className="fixed inset-y-0 left-0 z-[60] flex lg:hidden"
              style={{ width: PORTAL_MOBILE_NAV_WIDTH }}
            >
              {drawerSidebar}
            </div>
          </>
        ) : null}

        <main
          className={cn(
            'flex min-h-0 min-w-0 flex-1 flex-col',
            isAdminPortal ? 'overflow-visible md:overflow-hidden' : 'overflow-visible lg:overflow-hidden',
            mobileFullBleed && 'max-lg:min-h-[100dvh] max-lg:bg-white',
          )}
        >
          {isStudentPortal ? (
            <div className={cn(mobileFullBleed && 'hidden lg:block')}>
              <StudentDashboardHeader
                pageTitle={isDashboardHome ? undefined : title}
                pageSubtitle={portalHeaderSubtitle}
              />
            </div>
          ) : isTeacherPortal ? (
            <div className={cn(mobileFullBleed && 'hidden lg:block')}>
              <TeacherDashboardHeader
                pageTitle={isDashboardHome ? undefined : title}
                pageSubtitle={portalHeaderSubtitle}
                onBack={onBack}
                backLabel={backLabel}
              />
            </div>
          ) : isAdminPortal ? (
            <div className={cn(mobileFullBleed && 'hidden lg:block')}>
              <AdminDashboardHeader
                pageTitle={isDashboardHome ? undefined : title}
                pageSubtitle={portalHeaderSubtitle}
                headerContent={headerContent}
              />
            </div>
          ) : (
            <Header title={title} subtitle={subtitle} headerContent={headerContent} />
          )}
          <div
            id={isPortalShell ? PORTAL_CONTENT_SCROLL_ID : undefined}
            className={cn(
              isAdminPortal
                ? 'flex-1 overflow-visible md:min-h-0 md:overflow-x-hidden md:overflow-y-auto'
                : 'flex-1 overflow-visible lg:min-h-0 lg:overflow-x-hidden lg:overflow-y-auto',
              mainPadding,
              hasMobileBottomNav && !mobileFullBleed && PORTAL_MOBILE_BOTTOM_NAV_OFFSET_CLASS,
              mobileFullBleed &&
                'max-lg:flex max-lg:min-h-0 max-lg:flex-1 max-lg:flex-col max-lg:bg-white max-lg:overflow-hidden lg:flex lg:min-h-0 lg:flex-col lg:overflow-hidden',
              contentScrollClassName,
            )}
          >
            {promoBanner ? <div className="mb-4 sm:mb-6">{promoBanner}</div> : null}
            <div
              className={cn(
                'mx-auto w-full min-w-0 max-w-[90rem]',
                mobileFullBleed ? 'pb-0' : 'pb-[30px]',
                mobileFullBleed &&
                  'max-lg:flex max-lg:min-h-0 max-lg:flex-1 max-lg:flex-col max-lg:bg-white lg:flex lg:min-h-0 lg:flex-1 lg:flex-col',
              )}
            >
              {children}
            </div>
          </div>
        </main>
        {isPortalShell ? <PortalMobileBottomNav showNotifications={isAdminPortal} /> : null}
        <FloatingChatWidget />
      </div>
    </PortalShellProvider>
  );
}
