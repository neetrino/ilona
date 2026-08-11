'use client';

import { StudentLogoutControl } from './StudentLogoutControl';
import { PortalSidebarNavLink } from './PortalSidebarNavLink';
import { PortalSidebarNavList } from './PortalSidebarNavList';
import { PortalSidebarHeader } from './PortalSidebarHeader';
import { usePathname } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { cn } from '@/shared/lib/utils';
import { useIsIPad } from '@/shared/hooks/useIsIPad';
import { useLogo } from '@/features/settings/hooks/useSettings';
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
};

const NAV_LIST_GAP_CLASS = 'gap-0.5';

interface TeacherSidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
  onNavigate?: () => void;
  layout?: 'dock' | 'drawer';
}

export function TeacherSidebar({
  collapsed = false,
  onToggle,
  onNavigate,
  layout = 'dock',
}: TeacherSidebarProps) {
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations('nav');
  const tCommon = useTranslations('common');
  const isIPad = useIsIPad();
  const isArmenianLocale = locale === 'hy';

  const isDrawer = layout === 'drawer';
  const showLabels = isDrawer || !collapsed;

  const { data: logoData } = useLogo();
  const apiLogo = getFullApiUrl(logoData?.logoUrl);
  const brandLogo = apiLogo || STUDENT_SIDEBAR_ASSETS.brandLogo;

  const primaryNav: NavEntry[] = [
    { labelKey: 'dashboard', href: '/teacher/dashboard', icon: 'iconDashboard' },
    { labelKey: 'myStudents', href: '/teacher/students', icon: 'iconTeachers' },
    { labelKey: 'schedule', href: '/teacher/schedule', icon: 'iconSchedule' },
    { labelKey: 'dailyDuties', href: '/teacher/daily-duties', icon: 'iconCalendar' },
    { labelKey: 'dailyPlan', href: '/teacher/daily-plan', icon: 'iconFeedbacks' },
    { labelKey: 'recordings', href: '/teacher/recordings', icon: 'iconRecordings' },
    { labelKey: 'attendanceRegister', href: '/teacher/attendance-register', icon: 'iconAttendance' },
    { labelKey: 'salary', href: '/teacher/salary', icon: 'iconPayments' },
  ];

  const secondaryNav: NavEntry[] = [
    { labelKey: 'analytics', href: '/teacher/analytics', icon: 'iconAnalytics' },
    { labelKey: 'settings', href: '/teacher/settings', icon: 'iconSettings' },
  ];

  const navItems = [...primaryNav, ...secondaryNav];

  const isActive = (href: string) => {
    const pathWithoutLocale = pathname.replace(/^\/[a-z]{2}\//, '/');
    return pathWithoutLocale.startsWith(href);
  };

  const withLocale = (href: string) => `/${locale}${href}`;

  const routeActiveId = navItems.find((item) => isActive(item.href))?.labelKey ?? null;

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

        <PortalSidebarNavList
          activeId={routeActiveId}
          showIndicator={showLabels}
          layoutKey={showLabels ? 'expanded' : 'collapsed'}
          instanceId={isDrawer ? 'drawer' : 'dock'}
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
              navId={item.labelKey}
              href={withLocale(item.href)}
              icon={item.icon}
              active={isActive(item.href)}
              collapsed={!showLabels}
              label={
                isArmenianLocale && item.labelKey === 'dailyDuties' && isDrawer
                  ? t('dailyDutiesMobile')
                  : t(item.labelKey)
              }
              onNavigate={onNavigate}
              isArmenianLocale={isArmenianLocale}
              slidingActive={showLabels}
            />
          ))}
        </PortalSidebarNavList>

        <div className="shrink-0 px-4 pb-5 pt-2 lg:hidden">
          <StudentLogoutControl variant="sidebar" onAfterLogout={onNavigate} />
        </div>

      </aside>
    </div>
  );
}
