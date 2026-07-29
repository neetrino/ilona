'use client';

import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Button } from '@/shared/components/ui';
import { cn } from '@/shared/lib/utils';
import {
  portalSheetLayerProps,
  stackedSheetDialogHandlers,
  stackedSheetOverlayClassName,
} from '@/shared/lib/sheet-stack';
import { PORTAL_DESKTOP_SIDE_SHEET_CLASS } from '@/shared/lib/portal-form-sheet-classes';
import {
  ADMIN_ICON_BUTTON_SM_CLASS,
  ADMIN_OUTLINE_BUTTON_CLASS,
  ADMIN_PRIMARY_BUTTON_CLASS,
} from '@/shared/lib/admin-control-theme';
import { PortalFormSheetDragHandle } from '@/shared/components/ui/portal-form-sheet-drag-handle';
import { X } from 'lucide-react';
import { useEditManagerForm } from './edit-manager-form/useEditManagerForm';
import {
  EditManagerFormCenterSelect,
  EditManagerFormError,
  EditManagerFormProfileFields,
  EditManagerFormStatusSelect,
} from './edit-manager-form/EditManagerFormFields';
import type { EditManagerFormProps } from './edit-manager-form/edit-manager-form.types';

export type { EditManagerFormProps } from './edit-manager-form/edit-manager-form.types';

export function EditManagerForm(props: EditManagerFormProps) {
  const form = useEditManagerForm(props);

  return (
    <DialogPrimitive.Root
      open={form.isDialogOpen}
      onOpenChange={(nextOpen) => !nextOpen && form.requestClose()}
    >
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
          className={cn(
            'fixed inset-x-0 bottom-[7px] top-auto z-50 grid w-full translate-y-0',
            'duration-700 ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=open]:slide-in-from-bottom-full data-[state=closed]:slide-out-to-bottom-full',
            'h-[calc(94dvh+7px)] grid-rows-[auto_auto_minmax(0,1fr)] gap-0 overflow-hidden rounded-t-[22px] border border-slate-200 bg-[#f8f9fb] shadow-xl',
            PORTAL_DESKTOP_SIDE_SHEET_CLASS,
          )}
          aria-describedby="edit-manager-description"
        >
          <PortalFormSheetDragHandle dragHandleProps={form.dragHandleProps} />
          <DialogPrimitive.Title className="sr-only">{form.title}</DialogPrimitive.Title>
          <DialogPrimitive.Description id="edit-manager-description" className="sr-only">
            {form.description}
          </DialogPrimitive.Description>
          <div className="shrink-0 bg-[#f8f9fb] px-4 pb-4 pt-3 tablet:px-6 tablet:pb-5 tablet:pt-6">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-semibold text-[#3b3b40]">{form.title}</h2>
              </div>
              <DialogPrimitive.Close
                className={cn(
                  ADMIN_ICON_BUTTON_SM_CLASS,
                  'hidden text-slate-500 hover:bg-slate-100 hover:text-slate-700 tablet:inline-flex',
                )}
                aria-label={form.tCommon('close')}
              >
                <X className="h-4 w-4" />
              </DialogPrimitive.Close>
            </div>
          </div>
          <div
            className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain [touch-action:pan-y] [-webkit-overflow-scrolling:touch] px-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] tablet:px-6 tablet:pb-[calc(5rem+env(safe-area-inset-bottom))] lg:pb-8"
          >
            {form.isInactiveVariant ? (
              <form onSubmit={form.handleSubmitInactive} className="space-y-4">
                {form.errorMessage && <EditManagerFormError message={form.errorMessage} />}
                <EditManagerFormProfileFields
                  form={form.inactiveFormLike}
                  t={form.t}
                  disabled={form.isSubmitting}
                />
                <EditManagerFormCenterSelect
                  form={form.inactiveFormLike}
                  t={form.t}
                  selectableCenters={form.selectableCenters}
                  disabled={false}
                  hint={form.t('managerInactiveEditCenterHint')}
                />
                <FormActions form={form} />
              </form>
            ) : (
              <form onSubmit={form.handleSubmitActive} className="space-y-4">
                {form.errorMessage && <EditManagerFormError message={form.errorMessage} />}
                <EditManagerFormProfileFields
                  form={form.activeFormLike}
                  t={form.t}
                  disabled={form.isSubmitting}
                />
                <div className="grid grid-cols-1 gap-4 min-[1367px]:grid-cols-2">
                  <EditManagerFormCenterSelect
                    form={form.activeFormLike}
                    t={form.t}
                    selectableCenters={form.selectableCenters}
                    disabled={form.watchedStatus === 'INACTIVE'}
                    hint={
                      form.watchedStatus === 'INACTIVE'
                        ? form.t('managerInactiveCenterHint')
                        : undefined
                    }
                    centerError={form.activeForm.formState.errors.centerId?.message}
                  />
                  <EditManagerFormStatusSelect
                    value={form.watchedStatus ?? 'ACTIVE'}
                    onChange={(nextStatus) => {
                      form.activeForm.setValue('status', nextStatus, {
                        shouldDirty: true,
                        shouldValidate: true,
                      });
                    }}
                    disabled={form.isSubmitting}
                    t={form.t}
                    tStatus={form.tStatus}
                  />
                </div>
                {form.watchedStatus === 'INACTIVE' && (
                  <p className="rounded-[15px] border border-amber-100 bg-amber-50 p-2 text-xs text-amber-700">
                    {form.t('managerSetInactiveHint')}
                  </p>
                )}
                <FormActions form={form} />
              </form>
            )}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

function FormActions({ form }: { form: ReturnType<typeof useEditManagerForm> }) {
  return (
    <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
      <Button
        type="button"
        variant="outline"
        className={cn(ADMIN_OUTLINE_BUTTON_CLASS, 'border-[rgba(14,14,16,0.07)] hover:bg-slate-50')}
        onClick={form.requestClose}
        disabled={form.isSubmitting}
      >
        {form.tCommon('cancel')}
      </Button>
      <Button
        type="submit"
        disabled={form.isSubmitting}
        className={cn(ADMIN_PRIMARY_BUTTON_CLASS, 'bg-primary text-primary-foreground hover:bg-primary/90')}
      >
        {form.isSubmitting ? form.t('saving') : form.t('saveChanges')}
      </Button>
    </div>
  );
}
