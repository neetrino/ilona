'use client';

import { createContext, useContext } from 'react';

type PortalShellContextValue = {
  enabled: boolean;
  sidebarCollapsed: boolean;
};

const PortalShellContext = createContext<PortalShellContextValue>({
  enabled: false,
  sidebarCollapsed: false,
});

export function PortalShellProvider({
  enabled,
  sidebarCollapsed = false,
  children,
}: {
  enabled: boolean;
  sidebarCollapsed?: boolean;
  children: React.ReactNode;
}) {
  return (
    <PortalShellContext.Provider value={{ enabled, sidebarCollapsed }}>
      {children}
    </PortalShellContext.Provider>
  );
}

export function usePortalShell(): boolean {
  return useContext(PortalShellContext).enabled;
}

export function usePortalSidebarCollapsed(): boolean {
  return useContext(PortalShellContext).sidebarCollapsed;
}
