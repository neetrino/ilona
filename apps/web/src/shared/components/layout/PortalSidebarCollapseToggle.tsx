'use client';

import { cn } from '@/shared/lib/utils';

type PortalSidebarCollapseToggleProps = {
  collapsed: boolean;
  onToggle: () => void;
  className?: string;
};

export function PortalSidebarCollapseToggle({
  collapsed,
  onToggle,
  className,
}: PortalSidebarCollapseToggleProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        'shrink-0 rounded-lg p-1.5 text-[#8b8b90] transition-[color,background-color,transform] duration-300 ease-in-out hover:bg-[#f6f6f7] hover:text-[#242427] motion-reduce:transition-none',
        className,
      )}
      aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
    >
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d={collapsed ? 'M13 5l7 7-7 7' : 'M11 19l-7-7 7-7'}
        />
      </svg>
    </button>
  );
}
