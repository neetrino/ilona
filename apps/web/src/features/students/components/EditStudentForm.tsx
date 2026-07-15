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
import { PortalFormSheetDragHandle } from '@/shared/components/ui/portal-form-sheet-drag-handle';
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
          ref={form.scrollContentProps.ref}
          style={{ ...form.dragStyle, ...form.contentStyle }}
          {...stackedSheetDialogHandlers}
          {...portalSheetLayerProps}
          onOpenAutoFocus={(event) => event.preventDefault()}
          className={cn(
            'fixed inset-x-0 bottom-[7px] top-auto z-50 grid w-full translate-y-0',
            'duration-700 ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=open]:slide-in-from-bottom-full data-[state=closed]:slide-out-to-bottom-full',
            'h-[calc(94dvh+7px)] grid-rows-[auto_auto_1fr] gap-0 overflow-hidden rounded-t-[22px] border border-slate-200 bg-[#f8f9fb] shadow-xl',
            PORTAL_DESKTOP_SIDE_SHEET_CLASS,
          )}
          aria-describedby={undefined}
        >
          <PortalFormSheetDragHandle dragHandleProps={form.dragHandleProps} />
          <DialogPrimitive.Title className="sr-only">{form.tForm('editTitle')}</DialogPrimitive.Title>
          <div className="shrink-0 bg-[#f8f9fb] px-4 pb-4 pt-3 tablet:px-6 tablet:pb-5 tablet:pt-6">
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
          <div
            className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-y-contain [touch-action:pan-y] [-webkit-overflow-scrolling:touch] px-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] pt-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden tablet:px-6 tablet:pb-[calc(5rem+env(safe-area-inset-bottom))] tablet:pt-0 lg:pb-8"
          >
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
