'use client';

import * as DialogPrimitive from '@radix-ui/react-dialog';
import { useTranslations } from 'next-intl';
import { cn } from '@/shared/lib/utils';
import { ADMIN_ICON_BUTTON_SM_CLASS } from '@/shared/lib/admin-control-theme';
import {
  portalSheetLayerProps,
  stackedSheetDialogHandlers,
  stackedSheetOverlayClassName,
} from '@/shared/lib/sheet-stack';
import { PORTAL_DESKTOP_SIDE_SHEET_CLASS } from '@/shared/lib/portal-form-sheet-classes';
import { X } from 'lucide-react';
import { useEditStudentForm } from './edit-student-form/useEditStudentForm';
import { EditStudentFormFields } from './edit-student-form/EditStudentFormFields';
import type { EditStudentFormProps } from './edit-student-form/edit-student-form.types';

export type { EditStudentFormProps } from './edit-student-form/edit-student-form.types';

export function EditStudentForm(props: EditStudentFormProps) {
  const form = useEditStudentForm(props);
  const tCommon = useTranslations('common');

  return (
    <DialogPrimitive.Root open={form.open} onOpenChange={form.onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          style={form.overlayStyle}
          {...portalSheetLayerProps}
          className={stackedSheetOverlayClassName(
            'fixed inset-0 z-50 bg-black/60 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
            form.isBaseLayer,
          )}
        />
        <DialogPrimitive.Content
          style={{ ...form.dragStyle, ...form.contentStyle }}
          {...stackedSheetDialogHandlers}
          {...portalSheetLayerProps}
          onOpenAutoFocus={(event) => event.preventDefault()}
          className={cn(
            'fixed inset-x-0 bottom-[7px] top-auto z-50 grid w-full translate-y-0 lg:bottom-0 [@media(min-width:1024px)_and_(max-width:1366px)_and_(min-height:1000px)]:bottom-0',
            'duration-700 ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out min-[1367px]:duration-350 min-[1367px]:ease-[cubic-bezier(0.22,1,0.36,1)]',
            'data-[state=open]:slide-in-from-bottom-full data-[state=closed]:slide-out-to-bottom-full',
            'h-[calc(94dvh+7px)] [@media(min-width:1024px)_and_(max-width:1366px)_and_(min-height:1000px)]:h-[56dvh] grid-rows-[auto_auto_1fr] gap-0 overflow-hidden rounded-t-[22px] border border-slate-200 bg-[#f8f9fb] shadow-xl',
            PORTAL_DESKTOP_SIDE_SHEET_CLASS,
          )}
          aria-describedby={undefined}
        >
          <div className="relative flex h-9 w-full items-center justify-center bg-[#f8f9fb] min-[1367px]:hidden">
            <div
              className="absolute inset-x-0 -top-2 h-14"
              style={{ touchAction: 'pan-y' }}
              onTouchStart={form.handleDragStart}
              onTouchMove={form.handleDragMove}
              onTouchEnd={form.handleDragEnd}
              onTouchCancel={form.handleDragEnd}
            />
            <div className="h-1.5 w-14 rounded-full bg-slate-400" />
          </div>
          <DialogPrimitive.Title className="sr-only">{form.tForm('editTitle')}</DialogPrimitive.Title>
          <div className="shrink-0 bg-[#f8f9fb] px-4 pb-4 pt-3 min-[1367px]:px-6 min-[1367px]:pb-5 min-[1367px]:pt-6">
            <div className="flex items-center justify-between gap-4">
              <h2 className="min-w-0 text-lg font-semibold text-[#3b3b40]">{form.tForm('editTitle')}</h2>
              <DialogPrimitive.Close
                className={cn(
                  ADMIN_ICON_BUTTON_SM_CLASS,
                  'shrink-0 text-slate-500 hover:bg-slate-100 hover:text-slate-700',
                )}
                aria-label={tCommon('close')}
              >
                <X className="h-4 w-4" />
              </DialogPrimitive.Close>
            </div>
          </div>
          <div className="min-h-0 overflow-y-auto overflow-x-hidden overscroll-y-contain [touch-action:pan-y] [-webkit-overflow-scrolling:touch] px-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] pt-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden min-[1367px]:px-6 min-[1367px]:pb-6 min-[1367px]:pt-0">
            {form.isLoadingStudent ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : (
              <EditStudentFormFields {...form} />
            )}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
