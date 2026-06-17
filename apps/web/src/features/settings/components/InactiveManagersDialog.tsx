'use client';

import { useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui';
import { useManagers, useUpdateManager, type ManagerAccount } from '@/features/settings';
import { EditManagerForm } from '@/features/settings/components/EditManagerForm';
import {
  formatManagerDateTime,
  getCentersTakenByActiveManagers,
  getLastManagedInfo,
  getPendingCenterId,
} from '@/features/settings/utils/manager-display';
import { getErrorMessage } from '@/shared/lib/api';
import { formatPhoneForDisplay } from '@/shared/lib/utils';

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
  const [activatingId, setActivatingId] = useState<string | null>(null);
  const [editingManager, setEditingManager] = useState<ManagerAccount | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null,
  );

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

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          onOpenChange(next);
          if (!next) setFeedback(null);
        }}
      >
        <DialogContent
          onOpenAutoFocus={(event) => event.preventDefault()}
          overlayClassName="duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
          className="w-[calc(100%-1.5rem)] max-w-lg rounded-[15px] p-5 duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] max-h-[85vh] overflow-hidden flex flex-col sm:w-full [&>button]:border-0 [&>button]:bg-transparent [&>button]:outline-none [&>button]:ring-0 [&>button]:focus:outline-none [&>button]:focus:ring-0 [&>button]:focus-visible:outline-none [&>button]:focus-visible:ring-0 [&>button[data-state=open]]:bg-transparent"
        >
          <DialogHeader>
            <DialogTitle>{t('inactiveManagersTitle')}</DialogTitle>
            <DialogDescription>{t('inactiveManagersDescription')}</DialogDescription>
          </DialogHeader>

          {feedback && (
            <div
              className={`text-sm rounded-lg px-3 py-2 ${
                feedback.type === 'success'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                  : 'bg-red-50 text-red-700 border border-red-100'
              }`}
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
        </DialogContent>
      </Dialog>

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
  return (
    <div className="flex-1 overflow-y-auto -mx-1 px-1 space-y-2 min-h-0">
      {isLoading && (
        <p className="text-sm text-slate-500 py-4 text-center">{t('loadingManagers')}</p>
      )}
      {!isLoading && inactiveManagers.length === 0 && (
        <p className="text-sm text-slate-500 py-8 text-center">{t('noInactiveManagers')}</p>
      )}
      {!isLoading &&
        inactiveManagers.map((manager) => {
          const lastManaged = getLastManagedInfo(manager);
          const pendingCenterId = getPendingCenterId(manager);
          const pendingCenterName = pendingCenterId
            ? manager.managerProfile?.center?.name
            : undefined;

          return (
            <div
              key={manager.id}
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 flex flex-col gap-3"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium text-slate-800">
                    {manager.firstName} {manager.lastName}
                  </p>
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-200 text-slate-600">
                    {tStatus('inactive')}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{manager.email}</p>
                {manager.phone && (
                  <p className="text-xs text-slate-500">{formatPhoneForDisplay(manager.phone)}</p>
                )}

                <LastManagedSection
                  lastCenterName={lastManaged.centerName}
                  lastManagedAt={lastManaged.managedAt}
                  locale={locale}
                  t={t}
                />

                {pendingCenterName && (
                  <p className="text-xs text-slate-500 mt-1">
                    {t('managerPendingCenter')}:{' '}
                    <span className="font-medium text-slate-700">{pendingCenterName}</span>
                  </p>
                )}
              </div>

              <div className="flex flex-wrap gap-2 shrink-0">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => onEdit(manager)}
                >
                  {tCommon('edit')}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={activatingId === manager.id || updatePending}
                  onClick={() => onActivate(manager)}
                >
                  {activatingId === manager.id ? t('saving') : t('activateManager')}
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
    <div className="mt-2 space-y-0.5 rounded-lg border border-slate-200/80 bg-white/60 px-2.5 py-2">
      <p className="text-xs text-slate-500">
        {t('managerLastManagedCenter')}:{' '}
        <span className="font-medium text-slate-700">
          {lastCenterName ?? notAvailable}
        </span>
      </p>
      <p className="text-xs text-slate-500">
        {t('managerLastActiveAsManager')}:{' '}
        <span className="font-medium text-slate-700">
          {lastManagedAt ? formatManagerDateTime(lastManagedAt, locale) : notAvailable}
        </span>
      </p>
    </div>
  );
}
