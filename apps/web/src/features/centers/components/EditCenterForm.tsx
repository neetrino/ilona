'use client';

import * as DialogPrimitive from '@radix-ui/react-dialog';
import { useTranslations } from 'next-intl';
import { cn } from '@/shared/lib/utils';
import { ADMIN_ICON_BUTTON_SM_CLASS } from '@/shared/lib/admin-control-theme';
import { portalSheetLayerProps, stackedSheetDialogHandlers } from '@/shared/lib/sheet-stack';
import { PORTAL_DESKTOP_SIDE_SHEET_CLASS } from '@/shared/lib/portal-form-sheet-classes';
import { X, Trash2 } from 'lucide-react';
import { useEditCenterForm } from './edit-center-form/useEditCenterForm';
import { EditCenterFormFields } from './edit-center-form/EditCenterFormFields';
import { EDIT_CENTER_DIALOG_GRID_ROWS } from './edit-center-form/edit-center-form.constants';
import type { EditCenterFormProps } from './edit-center-form/edit-center-form.types';

export type { EditCenterFormProps } from './edit-center-form/edit-center-form.types';

export function EditCenterForm(props: EditCenterFormProps) {
  const { onToggleActive, onDelete } = props;
  const form = useEditCenterForm(props);
  const tForm = useTranslations('centers.form');
  const tCenters = useTranslations('centers');
  const tCommon = useTranslations('common');

  const renderHeaderActions = () => (
    <div className="flex shrink-0 items-center gap-3">
      {onDelete ? (
        <button
          type="button"
          aria-label={tCenters('deleteCenter')}
          title={tCenters('deleteCenter')}
          disabled={form.isFormBusy}
          onClick={onDelete}
          className={`${ADMIN_ICON_BUTTON_SM_CLASS} text-slate-500 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50`}
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
        </button>
      ) : null}
      {onToggleActive ? (
        <button
          type="button"
          role="switch"
          aria-checked={form.isCenterActive}
          aria-label={form.isCenterActive ? tCenters('deactivateCenter') : tCenters('activateCenter')}
          disabled={form.isFormBusy}
          onClick={onToggleActive}
          className={cn(
            'relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors focus:outline-none focus:ring-4 focus:ring-green-500/20 disabled:cursor-not-allowed disabled:opacity-50',
            form.isCenterActive ? 'bg-green-500' : 'bg-[#f1f1f2]',
          )}
        >
          <span
            className={cn(
              'pointer-events-none inline-block h-5 w-5 rounded-full border border-gray-300 bg-white transition-transform',
              form.isCenterActive ? 'translate-x-5 border-white' : 'translate-x-0.5',
            )}
          />
        </button>
      ) : null}
      <DialogPrimitive.Close
        className={`${ADMIN_ICON_BUTTON_SM_CLASS} hidden shrink-0 text-slate-500 hover:bg-slate-100 hover:text-slate-700 min-[1367px]:inline-flex`}
        aria-label={tCommon('close')}
      >
        <X className="h-4 w-4" />
      </DialogPrimitive.Close>
    </div>
  );

  const sheetContentClassName = cn(
    'fixed inset-x-0 bottom-[7px] top-auto z-50 grid w-full translate-y-0 lg:bottom-0 [@media(min-width:1024px)_and_(max-width:1366px)_and_(min-height:1000px)]:bottom-0',
    'duration-700 ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out min-[1367px]:duration-350 min-[1367px]:ease-[cubic-bezier(0.22,1,0.36,1)]',
    'data-[state=open]:slide-in-from-bottom-full data-[state=closed]:slide-out-to-bottom-full',
    EDIT_CENTER_DIALOG_GRID_ROWS,
    PORTAL_DESKTOP_SIDE_SHEET_CLASS,
  );

  const dragHandle = (
    <div className="relative flex h-9 w-full items-center justify-center bg-[#f8f9fb] min-[1367px]:hidden">
      <div
        className="absolute inset-x-0 -top-2 h-14"
        onTouchStart={form.handleDragStart}
        onTouchMove={form.handleDragMove}
        onTouchEnd={form.handleDragEnd}
        onTouchCancel={form.handleDragEnd}
      />
      <div className="h-1.5 w-14 rounded-full bg-slate-400" />
    </div>
  );

  if (form.isLoading) {
    return (
      <DialogPrimitive.Root open={form.isDialogOpen} onOpenChange={(nextOpen) => !nextOpen && form.requestClose()}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay
            style={form.overlayStyle}
            {...portalSheetLayerProps}
            className="fixed inset-0 z-50 bg-black/60 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
          />
          <DialogPrimitive.Content
            style={{ ...form.dragStyle, ...form.contentStyle }}
            {...stackedSheetDialogHandlers}
            {...portalSheetLayerProps}
            className={sheetContentClassName}
            aria-describedby={undefined}
          >
            {dragHandle}
            <DialogPrimitive.Title className="sr-only">{form.headerTitle}</DialogPrimitive.Title>
            <div className="shrink-0 bg-[#f8f9fb] px-4 pb-4 pt-3 min-[1367px]:px-6 min-[1367px]:pb-5 min-[1367px]:pt-6">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-lg font-semibold text-[#3b3b40]">{form.headerTitle}</h2>
                  <p className="mt-1 text-sm text-[#8b8b90]">{tForm('loadingCenter')}</p>
                </div>
                {renderHeaderActions()}
              </div>
            </div>
            <div className="min-h-0 overflow-y-auto overscroll-y-contain [touch-action:pan-y] [-webkit-overflow-scrolling:touch] px-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] min-[1367px]:px-6 min-[1367px]:pb-6">
              <div className="flex items-center justify-center py-8">
                <div className="text-slate-500">{tCommon('loading')}</div>
              </div>
            </div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    );
  }

  return (
    <DialogPrimitive.Root open={form.isDialogOpen} onOpenChange={(nextOpen) => !nextOpen && form.requestClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          style={form.overlayStyle}
          {...portalSheetLayerProps}
          className="fixed inset-0 z-50 bg-black/60 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
        />
        <DialogPrimitive.Content
          style={{ ...form.dragStyle, ...form.contentStyle }}
          {...stackedSheetDialogHandlers}
          {...portalSheetLayerProps}
          className={sheetContentClassName}
          aria-describedby={undefined}
        >
          {dragHandle}
          <DialogPrimitive.Title className="sr-only">{form.headerTitle}</DialogPrimitive.Title>
          <div className="shrink-0 bg-[#f8f9fb] px-4 pb-4 pt-3 min-[1367px]:px-6 min-[1367px]:pb-5 min-[1367px]:pt-6">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-lg font-semibold text-[#3b3b40]">{form.headerTitle}</h2>
              </div>
              {renderHeaderActions()}
            </div>
          </div>
          <div className="min-h-0 overflow-y-auto overscroll-y-contain [touch-action:pan-y] [-webkit-overflow-scrolling:touch] px-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] min-[1367px]:px-6 min-[1367px]:pb-6">
            <EditCenterFormFields {...form} />
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
