'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useCenters } from '@/features/centers';
import { useCreateManager, useManagers } from '@/features/settings';
import { getErrorMessage } from '@/shared/lib/api';

export function ManagerTab() {
  const t = useTranslations('settings');
  const { data: centersData } = useCenters({ isActive: true, take: 100 });
  const { data: managers, isLoading } = useManagers();
  const createManager = useCreateManager();

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    centerId: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const centers = useMemo(() => centersData?.items ?? [], [centersData?.items]);
  const assignedCenterIds = useMemo(
    () =>
      new Set(
        (managers ?? [])
          .map((manager) => manager.managerProfile?.centerId)
          .filter((centerId): centerId is string => Boolean(centerId)),
      ),
    [managers],
  );
  const availableCenters = useMemo(
    () => centers.filter((center) => !assignedCenterIds.has(center.id)),
    [centers, assignedCenterIds],
  );

  useEffect(() => {
    if (form.centerId && !availableCenters.some((center) => center.id === form.centerId)) {
      setForm((prev) => ({ ...prev, centerId: '' }));
    }
  }, [availableCenters, form.centerId]);

  const canSubmit =
    form.firstName.trim().length >= 2 &&
    form.lastName.trim().length >= 2 &&
    form.email.trim().length > 0 &&
    form.password.length >= 8 &&
    form.centerId.length > 0 &&
    availableCenters.some((center) => center.id === form.centerId);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canSubmit) return;

    setError(null);
    setSuccess(null);

    try {
      await createManager.mutateAsync({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        password: form.password,
        centerId: form.centerId,
      });
      setSuccess(t('managerCreatedSuccess'));
      setForm({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        password: '',
        centerId: '',
      });
    } catch (err: unknown) {
      setError(getErrorMessage(err, t('failedToCreateManager')));
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-800">{t('manager')}</h2>
        <p className="text-sm text-slate-500 mt-1">{t('managerDescription')}</p>

        <form onSubmit={handleSubmit} className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            className="h-11 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-primary"
            placeholder={t('firstName')}
            value={form.firstName}
            onChange={(e) => setForm((prev) => ({ ...prev, firstName: e.target.value }))}
          />
          <input
            className="h-11 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-primary"
            placeholder={t('lastName')}
            value={form.lastName}
            onChange={(e) => setForm((prev) => ({ ...prev, lastName: e.target.value }))}
          />
          <input
            type="email"
            className="h-11 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-primary"
            placeholder={t('emailAddress')}
            value={form.email}
            onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
          />
          <input
            type="password"
            className="h-11 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-primary"
            placeholder={t('managerPasswordPlaceholder')}
            value={form.password}
            onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
          />
          <input
            className="h-11 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-primary"
            placeholder={t('phoneNumber')}
            value={form.phone}
            onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
          />
          <select
            className="h-11 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-primary bg-white"
            value={form.centerId}
            onChange={(e) => setForm((prev) => ({ ...prev, centerId: e.target.value }))}
            disabled={availableCenters.length === 0}
          >
            <option value="">{t('managerSelectCenter')}</option>
            {availableCenters.map((center) => (
              <option key={center.id} value={center.id}>
                {center.name}
              </option>
            ))}
          </select>

          <div className="md:col-span-2 flex items-center justify-between mt-1">
            <div className="text-sm">
              {error && <span className="text-red-600">{error}</span>}
              {!error && success && <span className="text-emerald-600">{success}</span>}
            </div>
            <button
              type="submit"
              disabled={!canSubmit || createManager.isPending}
              className="h-10 px-4 rounded-xl bg-primary text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createManager.isPending ? t('saving') : t('createManager')}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h3 className="text-base font-semibold text-slate-800">{t('managersList')}</h3>

        <div className="mt-4 space-y-2">
          {isLoading && <div className="text-sm text-slate-500">{t('loadingManagers')}</div>}
          {!isLoading && (!managers || managers.length === 0) && (
            <div className="text-sm text-slate-500">{t('noManagersYet')}</div>
          )}
          {!isLoading &&
            managers?.map((manager) => (
              <div
                key={manager.id}
                className="rounded-xl border border-slate-200 px-4 py-3 flex items-center justify-between gap-3"
              >
                <div>
                  <p className="text-sm font-medium text-slate-800">
                    {manager.firstName} {manager.lastName}
                  </p>
                  <p className="text-xs text-slate-500">{manager.email}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500">{t('managerAssignedCenter')}</p>
                  <p className="text-sm font-medium text-slate-700">
                    {manager.managerProfile?.center?.name ?? '—'}
                  </p>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
