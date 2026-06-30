'use client';

import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Trash2, X } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { ADMIN_ICON_BUTTON_SM_CLASS } from '@/shared/lib/admin-control-theme';
import { PortalFormSheetDragHandle } from '@/shared/components/ui/portal-form-sheet-drag-handle';
import { PortalFormSheetScrollArea } from '@/shared/components/ui/portal-form-sheet-scroll-area';
import { PortalSheetPortal } from '@/shared/components/ui/portal-sheet-portal';
import {
  PORTAL_FORM_SHEET_CLOSE_BUTTON_CLASS,
  PORTAL_FORM_SHEET_HEADER_CLASS,
  portalFormSheetContentClass,
} from '@/shared/lib/portal-form-sheet-classes';
import { PaidRegistrationModal } from './PaidRegistrationModal';
import { useEditLeadModal } from './edit-lead-modal/useEditLeadModal';
import { EditLeadModalFormBody } from './edit-lead-modal/EditLeadModalFormBody';
import type { EditLeadModalProps } from './edit-lead-modal/edit-lead-modal.types';

export type { EditLeadModalProps } from './edit-lead-modal/edit-lead-modal.types';

export function EditLeadModal({
  canDeleteLead,
  onDeleteRequest,
  deleteDisabled,
  ...props
}: EditLeadModalProps) {
  const vm = useEditLeadModal(props);

  return (
    <>
      <DialogPrimitive.Root
        open={vm.isDialogOpen}
        onOpenChange={(nextOpen) => !nextOpen && vm.requestClose()}
      >
        <PortalSheetPortal
          open={vm.isDialogOpen}
          dragStyle={vm.dragStyle}
          sheetContentRef={vm.scrollContentProps.ref}
          contentClassName={portalFormSheetContentClass('3xl')}
          contentProps={{ 'aria-describedby': undefined }}
        >
          <PortalFormSheetDragHandle dragHandleProps={vm.dragHandleProps} />
          <DialogPrimitive.Title className="sr-only">{vm.t('editLead')}</DialogPrimitive.Title>
          <div className={PORTAL_FORM_SHEET_HEADER_CLASS}>
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-semibold text-[#3b3b40]">{vm.t('editLead')}</h2>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {canDeleteLead && onDeleteRequest ? (
                  <button
                    type="button"
                    aria-label={vm.t('deleteLead')}
                    title={vm.t('deleteLead')}
                    disabled={deleteDisabled || vm.saving}
                    onClick={onDeleteRequest}
                    className={cn(
                      ADMIN_ICON_BUTTON_SM_CLASS,
                      'text-slate-500 hover:bg-red-50 hover:text-red-600 disabled:pointer-events-none disabled:opacity-50',
                    )}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden />
                  </button>
                ) : null}
                <DialogPrimitive.Close
                  className={PORTAL_FORM_SHEET_CLOSE_BUTTON_CLASS}
                  aria-label={vm.t('closeEditLeadModal')}
                >
                  <X className="h-4 w-4" />
                </DialogPrimitive.Close>
              </div>
            </div>
          </div>
          {vm.isLoading ? (
            <PortalFormSheetScrollArea
              className="p-8 text-center text-slate-500"
            >
              {vm.tc('loading')}
            </PortalFormSheetScrollArea>
          ) : (
            <PortalFormSheetScrollArea className="pt-4 sm:pt-5">
              <EditLeadModalFormBody {...vm} />
            </PortalFormSheetScrollArea>
          )}
        </PortalSheetPortal>
      </DialogPrimitive.Root>
      <PaidRegistrationModal
        open={vm.paidRegistrationOpen}
        leadId={vm.paidRegistrationOpen ? vm.leadId : null}
        formPrefill={vm.paidPrefill}
        onClose={vm.closePaidRegistration}
        onSuccess={vm.handlePaidRegistrationSuccess}
      />
    </>
  );
}
