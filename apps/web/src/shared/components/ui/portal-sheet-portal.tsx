'use client';

import * as DialogPrimitive from '@radix-ui/react-dialog';
import type { ComponentPropsWithoutRef, CSSProperties, ReactNode } from 'react';
import { PORTAL_FORM_SHEET_OVERLAY_CLASS } from '@/shared/lib/portal-form-sheet-classes';
import {
  portalSheetLayerProps,
  stackedSheetDialogHandlers,
  stackedSheetOverlayClassName,
  useSheetStackZIndex,
} from '@/shared/lib/sheet-stack';

type ContentProps = ComponentPropsWithoutRef<typeof DialogPrimitive.Content>;

interface PortalSheetPortalProps {
  open: boolean;
  dragStyle?: CSSProperties;
  sheetContentRef?: (node: HTMLDivElement | null) => void;
  contentClassName?: string;
  overlayClassName?: string;
  contentProps?: Omit<ContentProps, 'className' | 'style' | 'children' | 'ref'>;
  children: ReactNode;
}

export function PortalSheetPortal({
  open,
  dragStyle,
  sheetContentRef,
  contentClassName,
  overlayClassName,
  contentProps,
  children,
}: PortalSheetPortalProps) {
  const { overlayStyle, contentStyle, isBaseLayer } = useSheetStackZIndex(open);

  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay
        className={stackedSheetOverlayClassName(
          PORTAL_FORM_SHEET_OVERLAY_CLASS,
          isBaseLayer,
          overlayClassName,
        )}
        style={overlayStyle}
        {...portalSheetLayerProps}
      />
      <DialogPrimitive.Content
        ref={sheetContentRef}
        style={{ ...dragStyle, ...contentStyle }}
        className={contentClassName}
        {...stackedSheetDialogHandlers}
        {...portalSheetLayerProps}
        {...contentProps}
      >
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}
