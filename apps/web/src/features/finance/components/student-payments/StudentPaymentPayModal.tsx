'use client';

import * as DialogPrimitive from '@radix-ui/react-dialog';
import { useTranslations } from 'next-intl';
import { X } from 'lucide-react';
import { PortalFormSheetDragHandle } from '@/shared/components/ui/portal-form-sheet-drag-handle';
import { PortalFormSheetScrollArea } from '@/shared/components/ui/portal-form-sheet-scroll-area';
import { PortalSheetPortal } from '@/shared/components/ui/portal-sheet-portal';
import {
  PORTAL_FORM_SHEET_CLOSE_BUTTON_CLASS,
  PORTAL_FORM_SHEET_HEADER_CLASS,
  portalFormSheetContentClass,
} from '@/shared/lib/portal-form-sheet-classes';
import { Label } from '@/shared/components/ui';
import { cn, formatCurrency } from '@/shared/lib/utils';
import type { Payment } from '@/features/finance/api/student-finance.api';
import { StudentGhostButton, StudentPrimaryButton } from '@/features/student-ui';
import type { usePortalSheetDrag } from '@/shared/hooks/usePortalSheetDrag';

type PaymentMethod = 'cash' | 'card' | 'idram';

interface StudentPaymentPayModalProps {
  isOpen: boolean;
  onClose: () => void;
  processModal: Payment | null;
  paymentMethod: PaymentMethod;
  onPaymentMethodChange: (method: PaymentMethod) => void;
  confirmStep: boolean;
  onConfirmStepChange: (step: boolean) => void;
  successMessage: string | null;
  onConfirmPayment: () => void;
  isPending: boolean;
  dragStyle: ReturnType<typeof usePortalSheetDrag>['dragStyle'];
  dragHandleProps: ReturnType<typeof usePortalSheetDrag>['dragHandleProps'];
  scrollContentProps: ReturnType<typeof usePortalSheetDrag>['scrollContentProps'];
}

export function StudentPaymentPayModal({
  isOpen,
  onClose,
  processModal,
  paymentMethod,
  onPaymentMethodChange,
  confirmStep,
  onConfirmStepChange,
  successMessage,
  onConfirmPayment,
  isPending,
  dragStyle,
  dragHandleProps,
  scrollContentProps,
}: StudentPaymentPayModalProps) {
  const t = useTranslations('finance');
  const tCommon = useTranslations('common');

  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <PortalSheetPortal
        open={isOpen}
        dragStyle={dragStyle}
        sheetContentRef={scrollContentProps.ref}
        contentClassName={portalFormSheetContentClass('2xl')}
        contentProps={{ 'aria-describedby': undefined }}
      >
        <PortalFormSheetDragHandle dragHandleProps={dragHandleProps} />

        <div className={cn(PORTAL_FORM_SHEET_HEADER_CLASS, 'border-b-0')}>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <DialogPrimitive.Title className="break-words text-xl font-semibold leading-snug text-[#1010a3] tablet:text-lg tablet:text-[#3b3b40]">
                {t('pay')}
              </DialogPrimitive.Title>
            </div>
            <DialogPrimitive.Close
              className={PORTAL_FORM_SHEET_CLOSE_BUTTON_CLASS}
              aria-label={tCommon('close')}
            >
              <X className="h-4 w-4" />
            </DialogPrimitive.Close>
          </div>
        </div>

        <PortalFormSheetScrollArea>
          {processModal ? (
            successMessage ? (
              <div className="py-4 text-center">
                <p className="font-medium text-[#0a7a3e]">{successMessage}</p>
              </div>
            ) : (
              <>
                <p className="mb-6 text-sm font-medium text-[#1010a3] min-[1367px]:mb-4">
                  {(processModal.month
                    ? new Date(processModal.month)
                    : new Date(processModal.dueDate)
                  ).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
                  {' — '}
                  {formatCurrency(Number(processModal.amount))}
                </p>
                {!confirmStep ? (
                  <>
                    <Label className="mb-4 block text-[#3b3b40]">{t('paymentMethod')}</Label>
                    <div className="mb-3 grid grid-cols-3 gap-3 sm:grid-cols-3 min-[1367px]:mb-4">
                      {(['cash', 'card', 'idram'] as const).map((method) => (
                        <button
                          key={method}
                          type="button"
                          onClick={() => onPaymentMethodChange(method)}
                          className={cn(
                            'min-h-12 rounded-[0.875rem] border-2 px-2 py-3.5 text-sm font-bold transition-colors min-[1367px]:min-h-11 min-[1367px]:px-4 min-[1367px]:py-3 min-[1367px]:text-base',
                            paymentMethod === method
                              ? 'border-[#1010a3] bg-[#d9d9f4] text-[#1010a3]'
                              : 'border-[rgba(14,14,16,0.07)] text-[#3b3b40] hover:bg-[#f6f6f7]',
                          )}
                        >
                          {method === 'cash'
                            ? t('methodCash')
                            : method === 'card'
                              ? t('methodCard')
                              : t('methodIdram')}
                        </button>
                      ))}
                    </div>
                    <div className="flex flex-row justify-end gap-3 pt-4 min-[1367px]:flex-row min-[1367px]:justify-end">
                      <StudentGhostButton
                        type="button"
                        onClick={onClose}
                        className="min-h-12 px-6 text-base font-semibold min-[1367px]:min-h-10 min-[1367px]:px-4 min-[1367px]:text-sm min-[1367px]:font-medium"
                      >
                        {tCommon('cancel')}
                      </StudentGhostButton>
                      <StudentPrimaryButton
                        type="button"
                        onClick={() => onConfirmStepChange(true)}
                        className="min-h-12 px-6 text-base min-[1367px]:min-h-10 min-[1367px]:px-5 min-[1367px]:text-sm"
                      >
                        {tCommon('next')}
                      </StudentPrimaryButton>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="mb-3 text-sm text-[#8b8b90] min-[1367px]:mb-4">
                      {t('payConfirm', {
                        amount: formatCurrency(Number(processModal.amount)),
                        method:
                          paymentMethod === 'cash'
                            ? t('methodCash')
                            : paymentMethod === 'card'
                              ? t('methodCard')
                              : t('methodIdram'),
                      })}
                    </p>
                    <div className="flex flex-row justify-end gap-3 pt-4 min-[1367px]:flex-row min-[1367px]:justify-end">
                      <StudentGhostButton
                        type="button"
                        onClick={() => onConfirmStepChange(false)}
                        className="min-h-12 px-6 text-base font-semibold min-[1367px]:min-h-10 min-[1367px]:px-4 min-[1367px]:text-sm min-[1367px]:font-medium"
                      >
                        {tCommon('back')}
                      </StudentGhostButton>
                      <StudentPrimaryButton
                        type="button"
                        onClick={onConfirmPayment}
                        disabled={isPending}
                        className="min-h-12 px-6 text-base min-[1367px]:min-h-10 min-[1367px]:px-5 min-[1367px]:text-sm"
                      >
                        {isPending ? tCommon('loading') : tCommon('confirm')}
                      </StudentPrimaryButton>
                    </div>
                  </>
                )}
              </>
            )
          ) : null}
        </PortalFormSheetScrollArea>
      </PortalSheetPortal>
    </DialogPrimitive.Root>
  );
}
