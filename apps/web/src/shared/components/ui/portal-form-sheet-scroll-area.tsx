'use client';

import type { ReactNode } from 'react';
import { PORTAL_FORM_SHEET_SCROLL_CLASS } from '@/shared/lib/portal-form-sheet-classes';
import { cn } from '@/shared/lib/utils';

interface PortalFormSheetScrollAreaProps {
  children: ReactNode;
  className?: string;
}

export function PortalFormSheetScrollArea({ children, className }: PortalFormSheetScrollAreaProps) {
  return <div className={cn(PORTAL_FORM_SHEET_SCROLL_CLASS, className)}>{children}</div>;
}
