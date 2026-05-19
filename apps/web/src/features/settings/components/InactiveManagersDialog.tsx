'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui';
import { useManagers, useUpdateManager, type ManagerAccount } from '@/features/settings';
import { getErrorMessage } from '@/shared/lib/api';

interface InactiveManagersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InactiveManagersDialog({ open, onOpenChange }: InactiveManagersDialogProps) {
  const t = useTranslations('settings');
  const tStatus = useTranslations('status');
  const { data: managers, isLoading } = useManagers();
  const updateManager = useUpdateManager();
  const [activatingId, setActivatingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null,
  );

  const inactiveManagers = useMemo(
    () => (managers ?? []).filter((manager) => manager.status !== 'ACTIVE'),
    [managers],
  );

  const handleActivate = async (manager: ManagerAccount) => {
    setFeedback(null);
    setActivatingId(manager.id);

    try {
      await updateManager.mutateAsync({
        id: manager.id,
        data: {
          status: 'ACTIVE',
          ...(manager.managerProfile?.centerId
            ? { centerId: manager.managerProfile.centerId }
            : {}),
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

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) setFeedback(null);
      }}
    >
      <DialogContent className="max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
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

        <div className="flex-1 overflow-y-auto -mx-1 px-1 space-y-2 min-h-0">
          {isLoading && (
            <p className="text-sm text-slate-500 py-4 text-center">{t('loadingManagers')}</p>
          )}
          {!isLoading && inactiveManagers.length === 0 && (
            <p className="text-sm text-slate-500 py-8 text-center">{t('noInactiveManagers')}</p>
          )}
          {!isLoading &&
            inactiveManagers.map((manager) => (
              <div
                key={manager.id}
                className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
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
                  <p className="text-xs text-slate-500 mt-1">
                    {t('managerAssignedCenter')}:{' '}
                    <span className="font-medium text-slate-700">
                      {manager.managerProfile?.center?.name ?? '—'}
                    </span>
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  className="shrink-0"
                  disabled={activatingId === manager.id || updateManager.isPending}
                  onClick={() => handleActivate(manager)}
                >
                  {activatingId === manager.id ? t('saving') : t('activateManager')}
                </Button>
              </div>
            ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
