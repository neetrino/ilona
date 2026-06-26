'use client';

import Link from 'next/link';
import { cn } from '@/shared/lib/utils';
import type { StudentSidebarIconKey } from '@/features/student-dashboard/studentSidebarAssets';
import { PortalSidebarReveal } from './PortalSidebarReveal';
import { StudentSidebarNavIcon } from './StudentSidebarNavIcon';
import {
  PORTAL_SIDEBAR_NAV_ITEM_GAP_CLASS,
  PORTAL_SIDEBAR_NAV_LABEL_HY_CLASS,
  PORTAL_SIDEBAR_NAV_LINK_TRANSITION_CLASS,
} from './student-layout';

type PortalSidebarNavLinkProps = {
  href: string;
  label: string;
  icon: StudentSidebarIconKey;
  active: boolean;
  collapsed: boolean;
  onNavigate?: () => void;
  isArmenianLocale: boolean;
  badge?: number;
  compact?: boolean;
};

export function PortalSidebarNavLink({
  href,
  label,
  icon,
  active,
  collapsed,
  onNavigate,
  isArmenianLocale,
  badge,
  compact = false,
}: PortalSidebarNavLinkProps) {
  const navIconColumnClass = cn(
    'flex h-12 shrink-0 items-center justify-center',
    compact ? 'w-[2.125rem]' : 'w-[2.375rem]',
  );

  const labelClassName = cn(
    'min-w-0 flex-1 overflow-visible text-sm italic leading-snug',
    compact ? 'whitespace-nowrap pr-0' : 'pr-0.5',
    isArmenianLocale && PORTAL_SIDEBAR_NAV_LABEL_HY_CLASS,
    active ? 'font-semibold text-white' : 'font-medium text-[#787878]',
  );

  return (
    <Link
      href={href}
      title={collapsed ? label : undefined}
      onClick={onNavigate}
      className={cn(
        'flex min-h-12 w-full items-center',
        PORTAL_SIDEBAR_NAV_LINK_TRANSITION_CLASS,
        compact ? 'gap-2' : PORTAL_SIDEBAR_NAV_ITEM_GAP_CLASS,
        active
          ? collapsed
            ? 'rounded-[0.875rem] bg-transparent px-0 py-0'
            : compact
              ? 'rounded-[3.375rem] bg-[#1010a3] py-1 pl-1 pr-2'
              : 'rounded-[3.375rem] bg-[#1010a3] py-1 pl-1.5 pr-3'
          : compact
            ? 'rounded-[0.875rem] px-2 py-1 hover:bg-[#f6f6f7]'
            : 'rounded-[0.875rem] px-3 py-1 hover:bg-[#f6f6f7]',
        collapsed && 'h-12 justify-center gap-0 px-0 py-0',
      )}
    >
      <span className={navIconColumnClass}>
        <StudentSidebarNavIcon
          icon={icon}
          active={active}
          activeVariant={collapsed ? 'filled' : 'pill'}
        />
      </span>
      <PortalSidebarReveal
        open={!collapsed}
        allowOverflow={compact}
        className={cn('min-w-0', !collapsed && 'flex-1')}
      >
        <span className={labelClassName}>{label}</span>
      </PortalSidebarReveal>
      {badge != null && badge > 0 ? (
        <PortalSidebarReveal open={!collapsed}>
          <span className="shrink-0 rounded-full bg-black/[0.04] px-2 text-base font-medium italic leading-none text-[#bcbcbc]">
            {badge}
          </span>
        </PortalSidebarReveal>
      ) : null}
    </Link>
  );
}
