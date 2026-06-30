'use client';

import {
  PORTAL_SHEET_DRAG_HANDLE_ATTR,
  type PortalSheetDragHandleProps,
} from '@/shared/hooks/usePortalSheetDrag';
import { PORTAL_FORM_SHEET_DRAG_HANDLE_CLASS } from '@/shared/lib/portal-form-sheet-classes';

interface PortalFormSheetDragHandleProps {
  dragHandleProps: PortalSheetDragHandleProps;
}

export function PortalFormSheetDragHandle({ dragHandleProps }: PortalFormSheetDragHandleProps) {
  return (
    <div className={PORTAL_FORM_SHEET_DRAG_HANDLE_CLASS} {...{ [PORTAL_SHEET_DRAG_HANDLE_ATTR]: '' }}>
      <div className="absolute inset-x-0 -top-2 h-14" style={{ touchAction: 'pan-y' }} {...dragHandleProps} />
      <div className="h-1.5 w-14 rounded-full bg-slate-400" />
    </div>
  );
}
