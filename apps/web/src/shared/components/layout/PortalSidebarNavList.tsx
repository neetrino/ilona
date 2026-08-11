'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { LayoutGroup } from 'framer-motion';
import { cn } from '@/shared/lib/utils';

/** Shared layoutId prefix for the sliding active pill. */
export const PORTAL_SIDEBAR_ACTIVE_PILL_LAYOUT_ID = 'portal-sidebar-active-pill';

export const PORTAL_SIDEBAR_PILL_TRANSITION = {
  type: 'tween' as const,
  duration: 0.38,
  ease: [0.22, 1, 0.36, 1] as const,
};

type PortalSidebarNavContextValue = {
  activate: (id: string) => void;
  isVisuallyActive: (id: string, routeActive: boolean) => boolean;
  showIndicator: boolean;
  /** Unique per dock/drawer instance so framer-motion layoutIds don't clash. */
  pillLayoutId: string;
};

const PortalSidebarNavContext = createContext<PortalSidebarNavContextValue | null>(null);

export function usePortalSidebarNav(): PortalSidebarNavContextValue | null {
  return useContext(PortalSidebarNavContext);
}

type PortalSidebarNavListProps = {
  children: ReactNode;
  className?: string;
  /** Stable active nav id (e.g. `dashboard`). */
  activeId: string | null;
  /** Hide the sliding pill in collapsed (icon-only) mode. */
  showIndicator?: boolean;
  /** Remeasure / layout scope key (expanded ↔ collapsed). */
  layoutKey?: string;
  /** Distinguish dock vs drawer instances mounted at once. */
  instanceId?: string;
};

/**
 * Sidebar nav list with optimistic active state.
 * The blue pill itself is a framer-motion `layoutId` element inside each link
 * (same pattern as shared-element tabs — more reliable than manual offsetTop).
 */
export function PortalSidebarNavList({
  children,
  className,
  activeId: routeActiveId,
  showIndicator = true,
  instanceId = 'dock',
}: PortalSidebarNavListProps) {
  const [optimisticId, setOptimisticId] = useState<string | null>(null);
  const pillLayoutId = `${PORTAL_SIDEBAR_ACTIVE_PILL_LAYOUT_ID}-${instanceId}`;

  useEffect(() => {
    setOptimisticId(null);
  }, [routeActiveId]);

  const activate = useCallback((id: string) => {
    setOptimisticId(id);
  }, []);

  const isVisuallyActive = useCallback(
    (id: string, routeActive: boolean) => {
      if (!showIndicator) {
        return routeActive;
      }
      if (optimisticId != null) {
        return optimisticId === id;
      }
      return routeActive;
    },
    [optimisticId, showIndicator],
  );

  const contextValue = useMemo(
    () => ({ activate, isVisuallyActive, showIndicator, pillLayoutId }),
    [activate, isVisuallyActive, showIndicator, pillLayoutId],
  );

  return (
    <LayoutGroup id={`portal-sidebar-nav-${instanceId}`}>
      <PortalSidebarNavContext.Provider value={contextValue}>
        <nav className={cn('relative', className)}>{children}</nav>
      </PortalSidebarNavContext.Provider>
    </LayoutGroup>
  );
}
