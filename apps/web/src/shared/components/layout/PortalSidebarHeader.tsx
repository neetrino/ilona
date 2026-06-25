'use client';

import { PublicAssetImage } from '@/shared/components/ui';
import { cn } from '@/shared/lib/utils';
import { STUDENT_SIDEBAR_ASSETS } from '@/features/student-dashboard/studentSidebarAssets';
import { PortalSidebarCollapseToggle } from './PortalSidebarCollapseToggle';
import { PortalSidebarReveal } from './PortalSidebarReveal';
import { PORTAL_SIDEBAR_HEADER_TRANSITION_CLASS } from './student-layout';

type PortalSidebarHeaderProps = {
  brandLogo: string;
  brandName: string;
  showLabels: boolean;
  collapsed: boolean;
  isDrawer: boolean;
  onToggle?: () => void;
  onNavigate?: () => void;
  closeLabel: string;
};

export function PortalSidebarHeader({
  brandLogo,
  brandName,
  showLabels,
  collapsed,
  isDrawer,
  onToggle,
  onNavigate,
  closeLabel,
}: PortalSidebarHeaderProps) {
  return (
    <div
      className={cn(
        'flex shrink-0 border-b border-transparent pb-2 pt-5',
        PORTAL_SIDEBAR_HEADER_TRANSITION_CLASS,
        showLabels
          ? 'flex-row items-center gap-3 px-4'
          : 'flex-col items-center gap-2 px-2',
      )}
    >
      {onToggle && !isDrawer ? (
        <PortalSidebarCollapseToggle
          collapsed={collapsed}
          onToggle={onToggle}
          className={cn(showLabels ? 'order-3 ml-auto' : 'order-2')}
        />
      ) : null}

      <div className="relative order-1 h-[3.25rem] w-[3.25rem] shrink-0 overflow-hidden rounded-full">
        <PublicAssetImage
          src={brandLogo}
          alt={brandName}
          fill
          className="object-cover"
          onError={(e) => {
            const target = e.currentTarget;
            if (target.src.includes('student-sidebar')) return;
            target.src = STUDENT_SIDEBAR_ASSETS.brandLogo;
          }}
        />
      </div>

      <PortalSidebarReveal open={showLabels} className="order-2 min-w-0 flex-1">
        <p className="text-sm font-semibold leading-snug tracking-tight text-[#242427]">
          {brandName}
        </p>
      </PortalSidebarReveal>

      {isDrawer ? (
        <button
          type="button"
          onClick={onNavigate}
          className="order-3 ml-auto shrink-0 rounded-lg p-1.5 text-[#8b8b90] transition-colors hover:bg-[#f6f6f7] hover:text-[#242427]"
          aria-label={closeLabel}
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
    </div>
  );
}
