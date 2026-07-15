'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Archive, X } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Button } from '@/shared/components/ui';
import { useManagers, useUpdateManager, type ManagerAccount } from '@/features/settings';
import { EditManagerForm } from '@/features/settings/components/EditManagerForm';
import {
  formatManagerDateTime,
  getCentersTakenByActiveManagers,
  getLastManagedInfo,
  getPendingCenterId,
} from '@/features/settings/utils/manager-display';
import { getErrorMessage } from '@/shared/lib/api';
import { formatPhoneForDisplay, cn } from '@/shared/lib/utils';
import {
  portalSheetLayerProps,
  stackedSheetDialogHandlers,
  useSheetStackZIndex,
  stackedSheetOverlayClassName,
} from '@/shared/lib/sheet-stack';
import { PORTAL_SHEET_DRAG_HANDLE_ATTR, usePortalSheetDrag } from '@/shared/hooks/usePortalSheetDrag';
import { PortalFormSheetScrollArea } from '@/shared/components/ui/portal-form-sheet-scroll-area';
import { portalFormSheetContentClass } from '@/shared/lib/portal-form-sheet-classes';
import {
  ADMIN_ICON_BUTTON_SM_CLASS,
  ADMIN_OUTLINE_BUTTON_CLASS,
  ADMIN_PRIMARY_BUTTON_CLASS,
} from '@/shared/lib/admin-control-theme';

interface InactiveManagersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InactiveManagersDialog({ open, onOpenChange }: InactiveManagersDialogProps) {
  const t = useTranslations('settings');
  const tCommon = useTranslations('common');
  const tStatus = useTranslations('status');
  const locale = useLocale();
  const { data: managers, isLoading } = useManagers();
  const updateManager = useUpdateManager();
  const [isDialogOpen, setIsDialogOpen] = useState(open);
  const [activatingId, setActivatingId] = useState<string | null>(null);
  const [editingManager, setEditingManager] = useState<ManagerAccount | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null,
  );

  useEffect(() => {
    setIsDialogOpen(open);
  }, [open]);

  const requestClose = useCallback(() => {
    setIsDialogOpen(false);
    onOpenChange(false);
  }, [onOpenChange]);

  const { dragStyle, dragHandleProps, scrollContentProps, resetDrag } = usePortalSheetDrag({
    enabled: true,
    onClose: requestClose,
  });

  useEffect(() => {
    if (!open) {
      resetDrag();
      setFeedback(null);
    }
  }, [open, resetDrag]);

  const inactiveManagers = useMemo(
    () => (managers ?? []).filter((manager) => manager.status !== 'ACTIVE'),
    [managers],
  );

  const centersTakenByActive = useMemo(
    () => getCentersTakenByActiveManagers(managers ?? []),
    [managers],
  );

  const handleActivate = async (manager: ManagerAccount) => {
    setFeedback(null);

    const centerId = getPendingCenterId(manager);
    if (!centerId) {
      setFeedback({ type: 'error', message: t('managerActivateRequiresCenter') });
      return;
    }

    if (centersTakenByActive.has(centerId)) {
      setFeedback({ type: 'error', message: t('managerActivateFailed') });
      return;
    }

    setActivatingId(manager.id);

    try {
      await updateManager.mutateAsync({
        id: manager.id,
        data: {
          status: 'ACTIVE',
          centerId,
        },
      });
      setFeedback({ type: 'success', message: t('managerActivatedSuccess') });
    } catch (err: unknown) {
      setFeedback({
        type: 'error',
        message: getErrorMessage(err, t('managerActivateFailed')),
      });
    } finally {
      setActivatingId(null);
    }
  };

  const openEdit = (manager: ManagerAccount) => {
    setEditingManager(manager);
    setIsEditOpen(true);
  };

  const { overlayStyle, contentStyle, isBaseLayer } = useSheetStackZIndex(isDialogOpen);

  return (
    <>
      <DialogPrimitive.Root open={isDialogOpen} onOpenChange={(nextOpen) => !nextOpen && requestClose()}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay
            style={overlayStyle}
            {...portalSheetLayerProps}
            className={stackedSheetOverlayClassName(
              'fixed inset-0 z-50 bg-black/60 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
              isBaseLayer,
            )}
          />
          <DialogPrimitive.Content
            ref={scrollContentProps.ref}
            style={{ ...dragStyle, ...contentStyle }}
            {...stackedSheetDialogHandlers}
            {...portalSheetLayerProps}
            className={portalFormSheetContentClass('2xl')}
            aria-describedby="inactive-managers-description"
          >
            <div
              className="relative flex h-9 w-full items-center justify-center bg-white tablet:hidden"
              {...{ [PORTAL_SHEET_DRAG_HANDLE_ATTR]: '' }}
            >
              <div
                className="absolute inset-x-0 -top-2 h-14"
                style={{ touchAction: 'pan-y' }}
                {...dragHandleProps}
              />
              <div className="h-1.5 w-14 rounded-full bg-slate-400" />
            </div>

            <DialogPrimitive.Title className="sr-only">{t('inactiveManagersTitle')}</DialogPrimitive.Title>
            <DialogPrimitive.Description id="inactive-managers-description" className="sr-only">
              {t('inactiveManagersDescription')}
            </DialogPrimitive.Description>

            <div className="relative z-40 shrink-0 border-b border-slate-200 bg-white px-4 py-3 tablet:px-6">
              <div className="flex w-full items-center justify-between gap-2">
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <Archive className="h-5 w-5 shrink-0 text-[#1010a3]" aria-hidden="true" />
                  <h2 className="truncate text-[1.0625rem] font-semibold text-[#3b3b40] tablet:text-lg">
                    {t('inactiveManagersTitle')}
                  </h2>
                </div>
                <DialogPrimitive.Close
                  className={cn(
                    ADMIN_ICON_BUTTON_SM_CLASS,
                    'hidden shrink-0 text-slate-500 hover:bg-slate-100 hover:text-slate-900 tablet:inline-flex',
                  )}
                  aria-label={tCommon('close')}
                >
                  <X className="h-4 w-4" />
                </DialogPrimitive.Close>
              </div>
            </div>

            <PortalFormSheetScrollArea className="pt-4 tablet:pt-6">
              <p className="mb-4 text-sm text-[#8b8b90]">{t('inactiveManagersDescription')}</p>

              {feedback && (
                <div
                  className={cn(
                    'mb-4 rounded-[15px] border px-4 py-3 text-sm',
                    feedback.type === 'success'
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                      : 'border-red-200 bg-red-50 text-red-700',
                  )}
                >
                  {feedback.message}
                </div>
              )}

              <InactiveList
                isLoading={isLoading}
                inactiveManagers={inactiveManagers}
                t={t}
                tCommon={tCommon}
                tStatus={tStatus}
                locale={locale}
                activatingId={activatingId}
                updatePending={updateManager.isPending}
                onEdit={openEdit}
                onActivate={handleActivate}
              />
            </PortalFormSheetScrollArea>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>

      <EditManagerForm
        open={isEditOpen}
        onOpenChange={(next) => {
          setIsEditOpen(next);
          if (!next) setEditingManager(null);
        }}
        manager={editingManager}
        variant="inactive"
      />
    </>
  );
}

function InactiveList({
  isLoading,
  inactiveManagers,
  t,
  tCommon,
  tStatus,
  locale,
  activatingId,
  updatePending,
  onEdit,
  onActivate,
}: {
  isLoading: boolean;
  inactiveManagers: ManagerAccount[];
  t: (key: string) => string;
  tCommon: (key: string) => string;
  tStatus: (key: string) => string;
  locale: string;
  activatingId: string | null;
  updatePending: boolean;
  onEdit: (manager: ManagerAccount) => void;
  onActivate: (manager: ManagerAccount) => void;
}) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div
          className="h-10 w-10 animate-spin rounded-full border-2 border-[rgba(14,14,16,0.07)] border-t-[#1010a3]"
          aria-hidden="true"
        />
        <span className="sr-only">{t('loadingManagers')}</span>
      </div>
    );
  }

  if (inactiveManagers.length === 0) {
    return (
      <div className="rounded-[15px] border border-[rgba(14,14,16,0.07)] bg-[#fafafa] px-4 py-8 text-center text-sm text-[#3b3b40]">
        {t('noInactiveManagers')}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {inactiveManagers.map((manager) => {
        const lastManaged = getLastManagedInfo(manager);
        const pendingCenterId = getPendingCenterId(manager);
        const pendingCenterName = pendingCenterId ? manager.managerProfile?.center?.name : undefined;
        const isActivating = activatingId === manager.id;

        return (
          <div
            key={manager.id}
            className="space-y-3 rounded-[15px] border border-[rgba(14,14,16,0.07)] bg-[#fafafa]/50 p-4"
          >
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-[#3b3b40]">
                {manager.firstName} {manager.lastName}
              </p>
              <span className="rounded-[15px] bg-[#f1f1f2] px-2 py-0.5 text-xs font-medium text-[#8b8b90]">
                {tStatus('inactive')}
              </span>
            </div>

            <div className="space-y-0.5 text-sm">
              <p className="text-[#8b8b90]">{manager.email}</p>
              {manager.phone && (
                <p className="text-[#8b8b90]">{formatPhoneForDisplay(manager.phone)}</p>
              )}
            </div>

            <LastManagedSection
              lastCenterName={lastManaged.centerName}
              lastManagedAt={lastManaged.managedAt}
              locale={locale}
              t={t}
            />

            {pendingCenterName && (
              <div className="border-t border-[rgba(14,14,16,0.07)] pt-2">
                <p className="text-xs font-medium text-[#8b8b90]">{t('managerPendingCenter')}</p>
                <p className="text-sm font-medium text-[#1010a3]">{pendingCenterName}</p>
              </div>
            )}

            <div className="flex flex-wrap gap-2 border-t border-[rgba(14,14,16,0.07)] pt-3">
              <Button
                type="button"
                variant="outline"
                className={cn(ADMIN_OUTLINE_BUTTON_CLASS, 'border-[rgba(14,14,16,0.07)] hover:bg-white')}
                onClick={() => onEdit(manager)}
              >
                {tCommon('edit')}
              </Button>
              <Button
                type="button"
                disabled={isActivating || updatePending}
                className={cn(ADMIN_PRIMARY_BUTTON_CLASS, 'bg-[#1010a3] text-white hover:bg-[#1010a3]/90')}
                onClick={() => onActivate(manager)}
              >
                {isActivating ? t('saving') : t('activateManager')}
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function LastManagedSection({
  lastCenterName,
  lastManagedAt,
  locale,
  t,
}: {
  lastCenterName: string | null;
  lastManagedAt: string | null;
  locale: string;
  t: (key: string) => string;
}) {
  const notAvailable = t('managerNotAvailable');

  return (
    <div className="border-t border-[rgba(14,14,16,0.07)] pt-2 space-y-1">
      <div>
        <p className="text-xs font-medium text-[#8b8b90]">{t('managerLastManagedCenter')}</p>
        <p className="text-sm font-medium text-[#3b3b40]">{lastCenterName ?? notAvailable}</p>
      </div>
      <div>
        <p className="text-xs font-medium text-[#8b8b90]">{t('managerLastActiveAsManager')}</p>
        <p className="text-sm font-medium text-[#3b3b40]">
          {lastManagedAt ? formatManagerDateTime(lastManagedAt, locale) : notAvailable}
        </p>
      </div>
    </div>
  );
}
