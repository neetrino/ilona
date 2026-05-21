'use client';

import { useMemo } from 'react';
import { PublicAssetImage } from '@/shared/components/ui';
import { StudentSidebarNavIcon } from './StudentSidebarNavIcon';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { cn } from '@/shared/lib/utils';
import { useLogo } from '@/features/settings/hooks/useSettings';
import { useMyDashboard, type StudentUpcomingLesson } from '@/features/students';
import { getFullApiUrl } from '@/shared/lib/api';
import {
  STUDENT_SIDEBAR_ASSETS,
  type StudentSidebarIconKey,
} from '@/features/student-dashboard/studentSidebarAssets';

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
const NAV_ICON_COLUMN_CLASS = 'flex h-12 w-[2.375rem] shrink-0 items-center justify-center';

function NavLink({
  item,
  active,
  collapsed,
  label,
}: {
  item: NavEntry;
  active: boolean;
  collapsed: boolean;
  label: string;
}) {
  return (
    <Link
      href={item.href}
      title={collapsed ? label : undefined}
      className={cn(
        'flex h-12 w-full items-center transition-colors',
        active
          ? 'rounded-[3.375rem] bg-[#1010a3] px-1.5'
          : 'rounded-[0.875rem] px-3 hover:bg-[#f6f6f7]',
        collapsed && 'justify-center px-1.5',
      )}
    >
      <span className={NAV_ICON_COLUMN_CLASS}>
        <StudentSidebarNavIcon icon={item.icon} active={active} />
      </span>
      {!collapsed ? (
        <>
          <span
            className={cn(
              'ml-2 min-w-0 truncate text-sm italic',
              active ? 'font-semibold text-white' : 'font-medium text-[#787878]',
            )}
          >
            {label}
          </span>
          {item.badge != null && item.badge > 0 ? (
            <span className="ml-auto shrink-0 rounded-full bg-black/[0.04] px-2 text-base font-medium italic leading-none text-[#bcbcbc]">
              {item.badge}
            </span>
          ) : null}
        </>
      ) : null}
    </Link>
  );
}

interface StudentSidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

export function StudentSidebar({ collapsed = false, onToggle }: StudentSidebarProps) {
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations('nav');
  const { data: logoData } = useLogo();
  const { data: dashboard } = useMyDashboard();

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

  const navItems = useMemo(
    () => [...primaryNav, ...secondaryNav],
    [scheduleBadge],
  );

  const isActive = (href: string) => {
    const pathWithoutLocale = pathname.replace(/^\/[a-z]{2}\//, '/');
    return pathWithoutLocale.startsWith(href);
  };

  const withLocale = (href: string) => `/${locale}${href}`;

  return (
    <div
      className={cn(
        'flex h-screen shrink-0 flex-col bg-[#ececec] py-3 pl-3 pr-1 sm:pl-4',
        collapsed ? 'w-[5.5rem]' : 'w-[15.75rem] sm:w-[16.25rem]',
      )}
    >
      <aside className="flex h-full min-h-0 flex-1 flex-col overflow-hidden rounded-[2rem] bg-white">
        {/* Brand */}
        <div
          className={cn(
            'flex shrink-0 items-center gap-3 border-b border-transparent px-4 pb-2 pt-5',
            collapsed && 'justify-center px-2',
          )}
        >
          <div className="relative h-[3.25rem] w-[3.25rem] shrink-0 overflow-hidden rounded-full">
            <PublicAssetImage
              src={brandLogo}
              alt={t('brandName')}
              fill
              className="object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                if (target.src.includes('student-sidebar')) return;
                target.src = STUDENT_SIDEBAR_ASSETS.brandLogo;
              }}
            />
          </div>
          {!collapsed ? (
            <p className="min-w-0 flex-1 text-sm font-semibold leading-snug tracking-tight text-[#242427]">
              {t('brandName')}
            </p>
          ) : null}
          {onToggle && !collapsed ? (
            <button
              type="button"
              onClick={onToggle}
              className="ml-auto shrink-0 rounded-lg p-1.5 text-[#8b8b90] hover:bg-[#f6f6f7]"
              aria-label="Toggle sidebar"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 19l-7-7 7-7"
                />
              </svg>
            </button>
          ) : null}
        </div>

        <nav
          className={cn(
            'flex min-h-0 flex-1 flex-col overflow-y-auto px-3 py-4',
            NAV_LIST_GAP_CLASS,
          )}
        >
          {navItems.map((item) => (
            <NavLink
              key={item.href}
              item={{ ...item, href: withLocale(item.href) }}
              active={isActive(item.href)}
              collapsed={collapsed}
              label={t(item.labelKey)}
            />
          ))}
        </nav>

        {onToggle && collapsed ? (
          <button
            type="button"
            onClick={onToggle}
            className="mx-auto mb-4 rounded-lg p-2 text-[#8b8b90] hover:bg-[#f6f6f7]"
            aria-label="Expand sidebar"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7" />
            </svg>
          </button>
        ) : null}
      </aside>
    </div>
  );
}
