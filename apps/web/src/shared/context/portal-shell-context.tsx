'use client';

import { createContext, useContext } from 'react';

const PortalShellContext = createContext(false);

export function PortalShellProvider({
  enabled,
  children,
}: {
  enabled: boolean;
  children: React.ReactNode;
}) {
  return (
    <PortalShellContext.Provider value={enabled}>{children}</PortalShellContext.Provider>
  );
}

export function usePortalShell(): boolean {
  return useContext(PortalShellContext);
}
