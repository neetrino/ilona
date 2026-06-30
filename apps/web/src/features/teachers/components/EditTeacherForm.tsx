'use client';

import * as DialogPrimitive from '@radix-ui/react-dialog';
import { useTranslations } from 'next-intl';
import { cn } from '@/shared/lib/utils';
import { ADMIN_ICON_BUTTON_SM_CLASS } from '@/shared/lib/admin-control-theme';
import { PortalFormSheetDragHandle } from '@/shared/components/ui/portal-form-sheet-drag-handle';
import { PortalSheetPortal } from '@/shared/components/ui/portal-sheet-portal';
import {
  PORTAL_FORM_SHEET_CLOSE_BUTTON_CLASS,
  portalFormSheetContentClass,
} from '@/shared/lib/portal-form-sheet-classes';
import { Trash2, X } from 'lucide-react';
import { useEditTeacherForm } from './edit-teacher-form/useEditTeacherForm';
import { EditTeacherFormFields } from './edit-teacher-form/EditTeacherFormFields';
import type { EditTeacherFormProps } from './edit-teacher-form/edit-teacher-form.types';

export type { EditTeacherFormProps } from './edit-teacher-form/edit-teacher-form.types';

export function EditTeacherForm(props: EditTeacherFormProps) {
  const { open, onDelete, onDeactivate } = props;
  const form = useEditTeacherForm(props);
  const t = useTranslations('teachers');
  const tCommon = useTranslations('common');

  const renderHeaderActions = () => (
    <div className="flex shrink-0 items-center gap-3">
      {onDelete && form.teacher ? (
        <button
          type="button"
          aria-label={tCommon('delete')}
          title={tCommon('delete')}
          disabled={form.isFormBusy}
          onClick={() => onDelete(form.teacher!)}
          className={`${ADMIN_ICON_BUTTON_SM_CLASS} text-slate-500 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50`}
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
        </button>
      ) : null}
      {onDeactivate && form.teacher ? (
        <button
          type="button"
          role="switch"
          aria-checked={form.isTeacherActive}
          aria-label={form.isTeacherActive ? t('deactivate') : t('activate')}
          disabled={form.isFormBusy}
          onClick={() => onDeactivate(form.teacher!)}
          className={cn(
            'relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors focus:outline-none focus:ring-4 focus:ring-green-500/20 disabled:cursor-not-allowed disabled:opacity-50',
            form.isTeacherActive ? 'bg-green-500' : 'bg-[#f1f1f2]',
          )}
        >
          <span
            className={cn(
              'pointer-events-none inline-block h-5 w-5 rounded-full border border-gray-300 bg-white transition-transform',
              form.isTeacherActive ? 'translate-x-5 border-white' : 'translate-x-0.5',
            )}
          />
        </button>
      ) : null}
      <DialogPrimitive.Close
        className={PORTAL_FORM_SHEET_CLOSE_BUTTON_CLASS}
        aria-label={tCommon('close')}
      >
        <X className="h-4 w-4" />
      </DialogPrimitive.Close>
    </div>
  );

  return (
    <DialogPrimitive.Root open={open} onOpenChange={(nextOpen) => !nextOpen && form.requestClose()}>
      <PortalSheetPortal
        open={open}
        dragStyle={form.dragStyle}
        sheetContentRef={form.scrollContentProps.ref}
        contentClassName={portalFormSheetContentClass('2xl')}
        contentProps={{ 'aria-describedby': undefined }}
      >
        <PortalFormSheetDragHandle dragHandleProps={form.dragHandleProps} />
        <DialogPrimitive.Title className="sr-only">{form.tForm('editTitle')}</DialogPrimitive.Title>
        <div className="shrink-0 bg-[#f8f9fb] px-4 pb-4 pt-3 min-[1367px]:px-6 min-[1367px]:pb-5 min-[1367px]:pt-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-semibold text-[#3b3b40]">{form.tForm('editTitle')}</h2>
            </div>
            {renderHeaderActions()}
          </div>
        </div>
        <div
          className="min-h-0 overflow-y-auto overscroll-y-contain [touch-action:pan-y] [-webkit-overflow-scrolling:touch] px-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] pt-4 min-[1367px]:px-6 min-[1367px]:pb-6 min-[1367px]:pt-5"
        >
          {form.isLoadingTeacher ? (
            <div className="flex items-center justify-center py-4">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : (
            <EditTeacherFormFields {...form} />
          )}
        </div>
      </PortalSheetPortal>
    </DialogPrimitive.Root>
  );
}
