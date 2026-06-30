'use client';

import * as DialogPrimitive from '@radix-ui/react-dialog';
import { useTranslations } from 'next-intl';
import { cn } from '@/shared/lib/utils';
import {
  portalSheetLayerProps,
  stackedSheetDialogHandlers,
  stackedSheetOverlayClassName,
} from '@/shared/lib/sheet-stack';
import { PORTAL_DESKTOP_SIDE_SHEET_CLASS } from '@/shared/lib/portal-form-sheet-classes';
import { PORTAL_SHEET_DRAG_HANDLE_ATTR } from '@/shared/hooks/usePortalSheetDrag';
import { useCenterDetailsModal } from './center-details-modal/useCenterDetailsModal';
import { CenterDetailsModalHeader } from './center-details-modal/CenterDetailsModalHeader';
import { CenterDetailsModalTabBar } from './center-details-modal/CenterDetailsModalTabBar';
import { CenterDetailsModalTabContent } from './center-details-modal/CenterDetailsModalTabContent';
import type { CenterDetailsModalProps } from './center-details-modal/center-details-modal.types';

export type { CenterDetailsModalProps } from './center-details-modal/center-details-modal.types';

export function CenterDetailsModal(props: CenterDetailsModalProps) {
  const modal = useCenterDetailsModal(props);
  const t = useTranslations('centers');
  const tCommon = useTranslations('common');

  return (
    <DialogPrimitive.Root open={modal.open} onOpenChange={(o) => !o && modal.onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          style={modal.overlayStyle}
          {...portalSheetLayerProps}
          className={stackedSheetOverlayClassName(
            'fixed inset-0 z-50 bg-black/60 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
            modal.isBaseLayer,
          )}
        />
        <DialogPrimitive.Content
          ref={modal.scrollContentProps.ref}
          style={{ ...modal.dragStyle, ...modal.contentStyle }}
          {...stackedSheetDialogHandlers}
          {...portalSheetLayerProps}
          className={cn(
            'fixed inset-x-0 bottom-[7px] top-auto z-50 grid w-full translate-y-0 lg:bottom-0 [@media(min-width:1024px)_and_(max-width:1366px)_and_(min-height:1000px)]:bottom-0',
            'duration-700 ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out min-[1367px]:duration-350 min-[1367px]:ease-[cubic-bezier(0.22,1,0.36,1)]',
            'data-[state=open]:slide-in-from-bottom-full data-[state=closed]:slide-out-to-bottom-full',
            'h-[calc(94dvh+7px)] [@media(min-width:1024px)_and_(max-width:1366px)_and_(min-height:1000px)]:h-[56dvh] grid-rows-[auto_auto_auto_1fr] gap-0 overflow-hidden rounded-t-[22px] border border-slate-200 bg-[#f8f9fb] shadow-xl min-[1367px]:grid-rows-[auto_auto_1fr]',
            PORTAL_DESKTOP_SIDE_SHEET_CLASS,
          )}
        >
          <div
            className="relative flex h-9 w-full items-center justify-center bg-white min-[1367px]:hidden"
            {...{ [PORTAL_SHEET_DRAG_HANDLE_ATTR]: '' }}
          >
            <div
              className="absolute inset-x-0 -top-2 h-14"
              style={{ touchAction: 'pan-y' }}
              {...modal.dragHandleProps}
            />
            <div className="h-1.5 w-14 rounded-full bg-slate-300" />
          </div>
          <DialogPrimitive.Title className="sr-only">
            {modal.data?.center.name ?? t('centerDetails')}
          </DialogPrimitive.Title>
          <CenterDetailsModalHeader
            center={modal.data?.center ?? null}
            onClose={modal.onClose}
            closeLabel={tCommon('close')}
          />
          <CenterDetailsModalTabBar
            activeTab={modal.activeTab}
            setActiveTab={modal.setActiveTab}
            counts={modal.data?.counts}
          />

          <div
            className="overflow-y-auto px-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] pt-4 min-[1367px]:p-6"
          >
            {modal.isLoading && <p className="text-sm text-slate-500">{tCommon('loading')}</p>}
            {modal.error && (
              <p className="text-sm text-red-600">
                {modal.error instanceof Error ? modal.error.message : t('failedLoadCenterDetails')}
              </p>
            )}
            {modal.data && (
              <CenterDetailsModalTabContent data={modal.data} activeTab={modal.activeTab} />
            )}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
