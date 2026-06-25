'use client';

import { useMemo } from 'react';
import { StudentLogoutControl } from './StudentLogoutControl';
import { PortalSidebarNavLink } from './PortalSidebarNavLink';
import { PortalSidebarHeader } from './PortalSidebarHeader';
import { usePathname } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { cn } from '@/shared/lib/utils';
import { useIsIPad } from '@/shared/hooks/useIsIPad';
import { useLogo } from '@/features/settings/hooks/useSettings';
import { useMyDashboard, type StudentUpcomingLesson } from '@/features/students';
import { getFullApiUrl } from '@/shared/lib/api';
import {
  STUDENT_SIDEBAR_ASSETS,
  type StudentSidebarIconKey,
} from '@/features/student-dashboard/studentSidebarAssets';
import { getPortalSidebarWidthClass, PORTAL_SIDEBAR_SHELL_TRANSITION_CLASS } from './student-layout';

type NavEntry = {
  labelKey: string;
  href: string;
  icon: StudentSidebarIconKey;
  badge?: number;
};

function countWeekLessons(lessons: StudentUpcomingLesson[]): number {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfWeek = new Date(startOfToday);
  endOfWeek.setDate(endOfWeek.getDate() + 7);

  return lessons.filter((lesson) => {
    const date = new Date(lesson.scheduledAt);
    return date >= startOfToday && date < endOfWeek && date.getTime() > now.getTime();
  }).length;
}

/** Equal vertical spacing between every sidebar nav item (2px, matches Figma item rhythm) */
const NAV_LIST_GAP_CLASS = 'gap-0.5';

interface StudentSidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
  /** Called after navigation (e.g. close mobile drawer). */
  onNavigate?: () => void;
  /** Docked desktop sidebar vs mobile drawer panel. */
  layout?: 'dock' | 'drawer';
}

export function StudentSidebar({
  collapsed = false,
  onToggle,
  onNavigate,
  layout = 'dock',
}: StudentSidebarProps) {
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations('nav');
  const tCommon = useTranslations('common');
  const isIPad = useIsIPad();
  const isArmenianLocale = locale === 'hy';
  const { data: logoData } = useLogo();
  const { data: dashboard } = useMyDashboard();

  const isDrawer = layout === 'drawer';
  const showLabels = isDrawer || !collapsed;

  const scheduleBadge = useMemo(
    () => countWeekLessons(dashboard?.upcomingLessons ?? []),
    [dashboard?.upcomingLessons],
  );

  const apiLogo = getFullApiUrl(logoData?.logoUrl);
  const brandLogo = apiLogo || STUDENT_SIDEBAR_ASSETS.brandLogo;

  const primaryNav: NavEntry[] = [
    { labelKey: 'dashboard', href: '/student/dashboard', icon: 'iconDashboard' },
    {
      labelKey: 'schedule',
      href: '/student/schedule',
      icon: 'iconSchedule',
      badge: scheduleBadge,
    },
    { labelKey: 'recordings', href: '/student/recordings', icon: 'iconRecordings' },
    { labelKey: 'myFeedbacks', href: '/student/my-feedbacks', icon: 'iconFeedbacks' },
    { labelKey: 'ourTeachers', href: '/student/our-teachers', icon: 'iconTeachers' },
    { labelKey: 'payments', href: '/student/payments', icon: 'iconPayments' },
  ];

  const secondaryNav: NavEntry[] = [
    { labelKey: 'analytics', href: '/student/analytics', icon: 'iconAnalytics' },
    { labelKey: 'attendance', href: '/student/attendance', icon: 'iconAttendance' },
    { labelKey: 'settings', href: '/student/settings', icon: 'iconSettings' },
  ];

  const navItems = [...primaryNav, ...secondaryNav];

  const isActive = (href: string) => {
    const pathWithoutLocale = pathname.replace(/^\/[a-z]{2}\//, '/');
    return pathWithoutLocale.startsWith(href);
  };

  const withLocale = (href: string) => `/${locale}${href}`;

  return (
    <div
      className={cn(
        'flex h-full shrink-0 flex-col bg-[#ececec]',
        !isDrawer && PORTAL_SIDEBAR_SHELL_TRANSITION_CLASS,
        isDrawer
          ? 'w-full py-2 pl-2 pr-2'
          : cn(
              'h-screen py-3 pl-3 pr-2 sm:pl-4 sm:pr-3',
              collapsed
                ? getPortalSidebarWidthClass(true, isArmenianLocale, isIPad)
                : getPortalSidebarWidthClass(false, isArmenianLocale, isIPad),
            ),
      )}
    >
      <aside
        className={cn(
          'flex h-full min-h-0 flex-1 flex-col overflow-y-auto overflow-x-visible rounded-[2rem] bg-white',
          !showLabels && '[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden',
        )}
      >
        <PortalSidebarHeader
          brandLogo={brandLogo}
          brandName={t('brandName')}
          showLabels={showLabels}
          collapsed={collapsed}
          isDrawer={isDrawer}
          onToggle={onToggle}
          onNavigate={onNavigate}
          closeLabel={tCommon('close')}
        />

        <nav
          className={cn(
            'flex min-h-0 flex-1 flex-col overflow-x-visible overflow-y-auto py-4',
            showLabels
              ? cn('pr-3.5', isArmenianLocale ? 'px-4' : 'px-3')
              : 'px-2',
            NAV_LIST_GAP_CLASS,
            !showLabels && '[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden',
          )}
        >
          {navItems.map((item) => (
            <PortalSidebarNavLink
              key={item.href}
              href={withLocale(item.href)}
              icon={item.icon}
              active={isActive(item.href)}
              collapsed={!showLabels}
              label={t(item.labelKey)}
              onNavigate={onNavigate}
              isArmenianLocale={isArmenianLocale}
              badge={item.badge}
            />
          ))}
        </nav>

        <div className="shrink-0 px-4 pb-5 pt-2 lg:hidden">
          <StudentLogoutControl
            variant="sidebar"
            onAfterLogout={onNavigate}
          />
        </div>

      </aside>
    </div>
  );
}
