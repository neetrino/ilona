'use client';

import { useMemo } from 'react';
import { PublicAssetImage } from '@/shared/components/ui';
import { StudentLogoutControl } from './StudentLogoutControl';
import { PortalSidebarCollapseToggle } from './PortalSidebarCollapseToggle';
import { StudentSidebarNavIcon } from './StudentSidebarNavIcon';
import Link from 'next/link';
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
import { PORTAL_SIDEBAR_NAV_ITEM_GAP_CLASS, PORTAL_SIDEBAR_NAV_LABEL_HY_CLASS, getPortalSidebarWidthClass } from './student-layout';

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
  onNavigate,
  isArmenianLocale,
}: {
  item: NavEntry;
  active: boolean;
  collapsed: boolean;
  label: string;
  onNavigate?: () => void;
  isArmenianLocale: boolean;
}) {
  return (
    <Link
      href={item.href}
      title={collapsed ? label : undefined}
      onClick={onNavigate}
      className={cn(
        'flex min-h-12 w-full items-center transition-colors',
        PORTAL_SIDEBAR_NAV_ITEM_GAP_CLASS,
        active
          ? 'rounded-[3.375rem] bg-[#1010a3] py-1 pl-1.5 pr-3'
          : 'rounded-[0.875rem] px-3 py-1 hover:bg-[#f6f6f7]',
        collapsed && 'h-12 justify-center px-1.5 py-0',
      )}
    >
      <span className={NAV_ICON_COLUMN_CLASS}>
        <StudentSidebarNavIcon icon={item.icon} active={active} />
      </span>
      {!collapsed ? (
        <>
          <span
            className={cn(
              'min-w-0 flex-1 overflow-visible pr-0.5 text-sm italic leading-snug',
              isArmenianLocale && PORTAL_SIDEBAR_NAV_LABEL_HY_CLASS,
              active ? 'font-semibold text-white' : 'font-medium text-[#787878]',
            )}
          >
            {label}
          </span>
          {item.badge != null && item.badge > 0 ? (
            <span className="shrink-0 rounded-full bg-black/[0.04] px-2 text-base font-medium italic leading-none text-[#bcbcbc]">
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
        {/* Brand */}
        <div
          className={cn(
            'flex shrink-0 border-b border-transparent pb-2 pt-5',
            showLabels
              ? 'items-center gap-3 px-4'
              : 'flex-col items-center gap-2 px-2',
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
          {showLabels ? (
            <p className="min-w-0 flex-1 text-sm font-semibold leading-snug tracking-tight text-[#242427]">
              {t('brandName')}
            </p>
          ) : null}
          {isDrawer ? (
            <button
              type="button"
              onClick={onNavigate}
              className="ml-auto shrink-0 rounded-lg p-1.5 text-[#8b8b90] transition-colors hover:bg-[#f6f6f7] hover:text-[#242427]"
              aria-label={tCommon('close')}
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          ) : null}
          {onToggle && !isDrawer ? (
            <PortalSidebarCollapseToggle
              collapsed={collapsed}
              onToggle={onToggle}
              className={showLabels ? 'ml-auto' : undefined}
            />
          ) : null}
        </div>

        <nav
          className={cn(
            'flex min-h-0 flex-1 flex-col overflow-x-visible overflow-y-auto py-4 pr-3.5',
            isArmenianLocale ? 'px-4' : 'px-3',
            NAV_LIST_GAP_CLASS,
            !showLabels && '[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden',
          )}
        >
          {navItems.map((item) => (
            <NavLink
              key={item.href}
              item={{ ...item, href: withLocale(item.href) }}
              active={isActive(item.href)}
              collapsed={!showLabels}
              label={t(item.labelKey)}
              onNavigate={onNavigate}
              isArmenianLocale={isArmenianLocale}
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
