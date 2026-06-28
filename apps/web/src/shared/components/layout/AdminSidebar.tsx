'use client';

import Image from 'next/image';
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
import { getFullApiUrl } from '@/shared/lib/api';
import { type AdminNavEntry, type AdminNavIcon } from '@/shared/lib/admin-nav-entries';
import { useAdminNavEntries } from '@/shared/hooks/useAdminNavEntries';
import { STUDENT_SIDEBAR_ASSETS } from '@/features/student-dashboard/studentSidebarAssets';
import {
  PORTAL_SIDEBAR_NAV_LABEL_HY_CLASS,
  PORTAL_SIDEBAR_SHELL_TRANSITION_CLASS,
  PORTAL_SIDEBAR_WIDTH_CLASS,
} from './student-layout';

const ADMIN_SIDEBAR_NAV_ITEM_GAP_CLASS = 'gap-[8px]';

const ADMIN_SIDEBAR_WIDTH_CLASS = {
  default: 'w-[clamp(14rem,16.5vw,20rem)]',
  hy: 'w-[clamp(18rem,22vw,25rem)]',
  hyIpad: 'w-[clamp(19rem,23vw,26.5rem)]',
} as const;

function getAdminSidebarWidthClass(
  collapsed: boolean,
  isArmenianLocale: boolean,
  isIPad: boolean,
): string {
  if (collapsed) return PORTAL_SIDEBAR_WIDTH_CLASS.collapsed;
  if (isArmenianLocale) {
    return isIPad ? ADMIN_SIDEBAR_WIDTH_CLASS.hyIpad : ADMIN_SIDEBAR_WIDTH_CLASS.hy;
  }
  return ADMIN_SIDEBAR_WIDTH_CLASS.default;
}

const NAV_LIST_GAP_CLASS = 'gap-0.5';
const NAV_ICON_COLUMN_CLASS = 'flex h-12 w-[2.375rem] shrink-0 items-center justify-center';

function AdminNavIconDisplay({
  icon,
  active,
  collapsed,
}: {
  icon: AdminNavIcon;
  active: boolean;
  collapsed: boolean;
}) {
  if (icon.type === 'sidebar') {
    return (
      <span className={NAV_ICON_COLUMN_CLASS}>
        <StudentSidebarNavIcon
          icon={icon.icon}
          active={active}
          activeVariant={collapsed ? 'filled' : 'pill'}
        />
      </span>
    );
  }

  if (icon.type === 'image') {
    return (
      <span
        className={cn(
          NAV_ICON_COLUMN_CLASS,
          active && 'rounded-full bg-white/20',
        )}
      >
        <Image
          src={icon.src}
          alt=""
          width={icon.width ?? 20}
          height={icon.height ?? 20}
          className={cn('h-5 w-5 object-contain', active && 'brightness-0 invert')}
        />
      </span>
    );
  }

  return (
    <span className={NAV_ICON_COLUMN_CLASS}>
      <svg
        className={cn(
          'h-5 w-5',
          active ? (collapsed ? 'text-[#1010a3]' : 'text-white') : 'text-[#787878]',
        )}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden
      >
        {icon.paths.split('|').map((d) => (
          <path key={d.slice(0, 12)} strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={d} />
        ))}
      </svg>
    </span>
  );
}

function NavLink({
  item,
  active,
  collapsed,
  label,
  onNavigate,
  isArmenianLocale,
  isMobileSidebar,
  t,
}: {
  item: AdminNavEntry & { href: string };
  active: boolean;
  collapsed: boolean;
  label: string;
  onNavigate?: () => void;
  isArmenianLocale: boolean;
  isMobileSidebar: boolean;
  t: (key: string) => string;
}) {
  const labelClassName = cn(
    'min-w-0 flex-1 overflow-visible pr-0.5 text-sm italic leading-snug',
    isArmenianLocale && PORTAL_SIDEBAR_NAV_LABEL_HY_CLASS,
    !isMobileSidebar && 'whitespace-nowrap',
    active ? 'font-semibold text-white' : 'font-medium text-[#787878]',
  );

  const renderLabel = () => {
    if (isArmenianLocale && item.labelKey === 'dailyDuties') {
      const mobileLabel = t('dailyDutiesMobile');
      if (isMobileSidebar) {
        return <span className={cn(labelClassName, 'whitespace-pre-line')}>{mobileLabel}</span>;
      }
      return <span className={labelClassName}>{label}</span>;
    }

    return <span className={labelClassName}>{label}</span>;
  };

  return (
    <Link
      href={item.href}
      title={collapsed ? label : undefined}
      onClick={onNavigate}
      className={cn(
        'flex min-h-12 w-full items-center transition-colors',
        ADMIN_SIDEBAR_NAV_ITEM_GAP_CLASS,
        active
          ? collapsed
            ? 'rounded-[0.875rem] bg-transparent px-1.5 py-0'
            : 'rounded-[3.375rem] bg-[#1010a3] py-1 pl-1.5 pr-3'
          : 'rounded-[0.875rem] px-3 py-1 hover:bg-[#f6f6f7]',
        collapsed && 'h-12 justify-center px-1.5 py-0',
      )}
    >
      <AdminNavIconDisplay icon={item.icon} active={active} collapsed={collapsed} />
      {!collapsed ? renderLabel() : null}
    </Link>
  );
}

interface AdminSidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
  onNavigate?: () => void;
  layout?: 'dock' | 'drawer';
}

export function AdminSidebar({
  collapsed = false,
  onToggle,
  onNavigate,
  layout = 'dock',
}: AdminSidebarProps) {
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

  const navItems = useAdminNavEntries();

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
                ? getAdminSidebarWidthClass(true, isArmenianLocale, isIPad)
                : getAdminSidebarWidthClass(false, isArmenianLocale, isIPad),
            ),
      )}
    >
      <aside
        className={cn(
          'flex h-full min-h-0 flex-1 flex-col overflow-y-auto overflow-x-visible rounded-[2rem] bg-white',
          !showLabels && '[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden',
        )}
      >
        <div
          className={cn(
            'flex shrink-0 border-b border-transparent pb-2 pt-5',
            showLabels
              ? 'items-center gap-3 px-4'
              : 'flex-col items-center gap-1.5 px-2 pt-3 pb-1',
          )}
        >
          <div className="relative h-[3.25rem] w-[3.25rem] shrink-0 overflow-hidden rounded-full">
            <PublicAssetImage
              src={brandLogo}
              alt={t('brandName')}
              fill
              className="object-cover"
              onError={(e) => {
                const target = e.currentTarget;
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
              className="ml-auto shrink-0 rounded-[15px] p-1.5 text-[#8b8b90] transition-colors hover:bg-[#f6f6f7] hover:text-[#242427]"
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
            'flex min-h-0 flex-1 flex-col overflow-x-visible overflow-y-auto pr-3.5',
            showLabels ? 'py-4' : 'pb-4 pt-2',
            showLabels
              ? isArmenianLocale ? 'px-4' : 'px-3'
              : 'px-2',
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
              isMobileSidebar={isDrawer}
              t={t}
            />
          ))}
        </nav>

        <div className="shrink-0 px-4 pb-5 pt-2 lg:hidden">
          <StudentLogoutControl variant="sidebar" onAfterLogout={onNavigate} />
        </div>

      </aside>
    </div>
  );
}
