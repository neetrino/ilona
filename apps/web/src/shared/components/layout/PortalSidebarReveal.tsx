'use client';

import { cn } from '@/shared/lib/utils';
import { PORTAL_SIDEBAR_REVEAL_GRID_TRANSITION_CLASS } from './student-layout';

type PortalSidebarRevealProps = {
  open: boolean;
  children: React.ReactNode;
  className?: string;
};

export function PortalSidebarReveal({ open, children, className }: PortalSidebarRevealProps) {
  return (
    <span
      className={cn(
        'grid min-w-0',
        PORTAL_SIDEBAR_REVEAL_GRID_TRANSITION_CLASS,
        open ? 'grid-cols-[1fr] opacity-100' : 'grid-cols-[0fr] w-0 flex-none shrink-0 opacity-0',
        className,
      )}
      aria-hidden={!open}
    >
      <span className="min-w-0 overflow-hidden">{children}</span>
    </span>
  );
}
