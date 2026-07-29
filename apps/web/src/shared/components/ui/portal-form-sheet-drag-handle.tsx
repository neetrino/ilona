'use client';

import {
  PORTAL_SHEET_DRAG_HANDLE_ATTR,
  type PortalSheetDragHandleProps,
} from '@/shared/hooks/usePortalSheetDrag';
import { PORTAL_FORM_SHEET_DRAG_HANDLE_CLASS } from '@/shared/lib/portal-form-sheet-classes';
import { cn } from '@/shared/lib/utils';

interface PortalFormSheetDragHandleProps {
  dragHandleProps: PortalSheetDragHandleProps;
  className?: string;
}

export function PortalFormSheetDragHandle({
  dragHandleProps,
  className,
}: PortalFormSheetDragHandleProps) {
  return (
    <div
      className={cn(PORTAL_FORM_SHEET_DRAG_HANDLE_CLASS, className)}
      {...{ [PORTAL_SHEET_DRAG_HANDLE_ATTR]: '' }}
    >
      <div className="absolute inset-x-0 -top-2 h-14" style={{ touchAction: 'none' }} {...dragHandleProps} />
      <div className="h-1.5 w-14 rounded-full bg-slate-400" />
    </div>
  );
}
