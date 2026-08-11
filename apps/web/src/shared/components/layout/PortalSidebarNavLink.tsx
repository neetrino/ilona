'use client';

import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/shared/lib/utils';
import type { StudentSidebarIconKey } from '@/features/student-dashboard/studentSidebarAssets';
import { PortalSidebarReveal } from './PortalSidebarReveal';
import {
  PORTAL_SIDEBAR_PILL_TRANSITION,
  usePortalSidebarNav,
} from './PortalSidebarNavList';
import { StudentSidebarNavIcon } from './StudentSidebarNavIcon';
import {
  PORTAL_SIDEBAR_NAV_ITEM_GAP_CLASS,
  PORTAL_SIDEBAR_NAV_LABEL_HY_CLASS,
} from './student-layout';

type PortalSidebarNavLinkProps = {
  /** Stable id for the sliding indicator (e.g. labelKey). */
  navId: string;
  href: string;
  label: string;
  icon: StudentSidebarIconKey;
  active: boolean;
  collapsed: boolean;
  onNavigate?: () => void;
  isArmenianLocale: boolean;
  badge?: number;
  compact?: boolean;
  /** Background is drawn by framer-motion layoutId pill. */
  slidingActive?: boolean;
};

export function PortalSidebarNavLink({
  navId,
  href,
  label,
  icon,
  active: routeActive,
  collapsed,
  onNavigate,
  isArmenianLocale,
  badge,
  compact = false,
  slidingActive = false,
}: PortalSidebarNavLinkProps) {
  const nav = usePortalSidebarNav();
  const reduceMotion = useReducedMotion();
  const active = nav ? nav.isVisuallyActive(navId, routeActive) : routeActive;
  const showSlidingPill = slidingActive && !collapsed && active;

  const navIconColumnClass = cn(
    'flex h-12 shrink-0 items-center justify-center',
    compact ? 'w-[2.125rem]' : 'w-[2.375rem]',
  );

  const labelClassName = cn(
    'min-w-0 flex-1 overflow-visible text-sm italic leading-snug transition-colors duration-[380ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none',
    compact ? 'whitespace-nowrap pr-0' : 'pr-0.5',
    isArmenianLocale && PORTAL_SIDEBAR_NAV_LABEL_HY_CLASS,
    active ? 'font-semibold text-white' : 'font-medium text-[#787878]',
  );

  // Keep box geometry identical for every row so the pill doesn't resize mid-slide.
  const expandedBox = compact
    ? 'rounded-[3.375rem] py-1 pl-1 pr-2'
    : 'rounded-[3.375rem] py-1 pl-1.5 pr-3';

  return (
    <Link
      href={href}
      title={collapsed ? label : undefined}
      onClick={() => {
        nav?.activate(navId);
        onNavigate?.();
      }}
      data-sidebar-nav={navId}
      className={cn(
        'relative flex h-12 w-full shrink-0 items-center',
        compact ? 'gap-2' : PORTAL_SIDEBAR_NAV_ITEM_GAP_CLASS,
        collapsed
          ? 'justify-center gap-0 rounded-[0.875rem] px-0 py-0'
          : slidingActive
            ? cn(expandedBox, 'bg-transparent', !active && 'hover:bg-[#f6f6f7]')
            : active
              ? cn(expandedBox, 'bg-[#1010a3]')
              : cn(expandedBox, 'hover:bg-[#f6f6f7]'),
      )}
    >
      {showSlidingPill && nav?.pillLayoutId ? (
        <motion.span
          layoutId={nav.pillLayoutId}
          className="pointer-events-none absolute inset-0 z-0 rounded-[3.375rem] bg-[#1010a3]"
          transition={reduceMotion ? { duration: 0 } : PORTAL_SIDEBAR_PILL_TRANSITION}
        />
      ) : null}

      <span className={cn('relative z-[1] flex min-w-0 flex-1 items-center', compact ? 'gap-2' : PORTAL_SIDEBAR_NAV_ITEM_GAP_CLASS, collapsed && 'flex-none justify-center')}>
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
            <span className="mr-[10px] inline-flex h-6 min-w-6 shrink-0 items-center justify-center rounded-full bg-black/[0.04] px-1.5 text-sm font-medium leading-none text-[#bcbcbc]">
              {badge}
            </span>
          </PortalSidebarReveal>
        ) : null}
      </span>
    </Link>
  );
}
