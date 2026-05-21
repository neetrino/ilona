'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { createLead } from '@/features/crm/api/crm.api';
import type { CreateLeadDto, CrmLead } from '@/features/crm/types';
import { fetchCenters } from '@/features/centers/api/centers.api';
import { fetchTeachers } from '@/features/teachers/api/teachers.api';
import { fetchGroups } from '@/features/groups/api/groups.api';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/shared/lib/utils';

interface CreateLeadModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (lead: CrmLead) => void;
  /** When set (e.g. manager), center is fixed for the new lead and the center dropdown is hidden. */
  defaultCenterId?: string;
  defaultCenterName?: string;
  /** Narrow groups list to a center (recommended for managers). */
  groupsQueryCenterId?: string;
}

const LEVEL_OPTIONS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

export function CreateLeadModal({
  open,
  onClose,
  onCreated,
  defaultCenterId,
  defaultCenterName,
  groupsQueryCenterId,
}: CreateLeadModalProps) {
  const t = useTranslations('crm');
  const tc = useTranslations('common');
  const [form, setForm] = useState<CreateLeadDto>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const age = typeof form.age === 'number' ? form.age : null;
  const isUnder18 = age !== null && age > 0 && age < 18;
  const isAdult = age !== null && age >= 18;

  const { data: centers = [] } = useQuery({
    queryKey: ['centers'],
    queryFn: () => fetchCenters({ take: 100 }),
    select: (r) => r.items,
    enabled: open,
  });
  const { data: teachersData } = useQuery({
    queryKey: ['teachers'],
    queryFn: () => fetchTeachers({ take: 200 }),
    enabled: open,
  });
  const teachers = teachersData?.items ?? [];
  const { data: groupsData } = useQuery({
    queryKey: ['groups', groupsQueryCenterId ?? 'all'],
    queryFn: () =>
      fetchGroups({
        take: 500,
        ...(groupsQueryCenterId ? { centerId: groupsQueryCenterId } : {}),
      }),
    enabled: open,
  });

  useEffect(() => {
    if (!open) {
      setForm({});
      setError(null);
      return;
    }
    if (defaultCenterId) {
      setForm((prev) => ({ ...prev, centerId: defaultCenterId }));
    }
  }, [open, defaultCenterId]);
  const groups = groupsData?.items ?? [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const lead = await createLead(form);
      setForm({});
      onCreated(lead);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('failedCreateLead'));
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">{t('newLead')}</h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <p className="text-sm text-red-600 rounded-lg bg-red-50 p-2">{error}</p>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('firstName')}</label>
              <input
                type="text"
                value={form.firstName ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('lastName')}</label>
              <input
                type="text"
                value={form.lastName ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{tc('phone')}</label>
            <input
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              value={form.phone != null && form.phone !== '' ? `+${form.phone}` : '+'}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value.replace(/\D/g, '') }))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('age')}</label>
              <input
                type="number"
                min={0}
                value={form.age ?? ''}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    age: e.target.value ? Number(e.target.value) : undefined,
                    ...(e.target.value && Number(e.target.value) >= 18
                      ? { parentName: undefined, parentPhone: undefined, parentEmail: undefined }
                      : {}),
                  }))
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('level')}</label>
              <select
                value={form.levelId ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, levelId: e.target.value || undefined }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="">—</option>
                {LEVEL_OPTIONS.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t('center')}</label>
            {defaultCenterId ? (
              <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800">
                {defaultCenterName ?? t('yourCenter')}
              </p>
            ) : (
              <select
                value={form.centerId ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, centerId: e.target.value || undefined }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="">—</option>
                {centers.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            )}
          </div>
          {(isUnder18 || isAdult) && (
            <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {isUnder18 ? t('parentDetailsUnder18') : t('studentDetailsOver18')}
              </p>
              {isUnder18 && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">{t('parentName')}</label>
                    <input
                      type="text"
                      value={form.parentName ?? ''}
                      onChange={(e) => setForm((f) => ({ ...f, parentName: e.target.value }))}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">{t('parentPhone')}</label>
                    <input
                      type="tel"
                      inputMode="numeric"
                      value={form.parentPhone != null && form.parentPhone !== '' ? `+${form.parentPhone}` : '+'}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, parentPhone: e.target.value.replace(/\D/g, '') }))
                      }
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">{t('parentEmail')}</label>
                    <input
                      type="email"
                      autoComplete="email"
                      value={form.parentEmail ?? ''}
                      onChange={(e) => setForm((f) => ({ ...f, parentEmail: e.target.value }))}
                      placeholder={t('parentEmailPlaceholder')}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    />
                  </div>
                </>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {isUnder18 ? t('parentPassport') : t('studentPassport')}
                </label>
                <input
                  type="text"
                  value={form.parentPassportInfo ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, parentPassportInfo: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t('teacher')}</label>
            <select
              value={form.teacherId ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, teacherId: e.target.value || undefined }))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">—</option>
              {teachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.user?.firstName} {teacher.user?.lastName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t('group')}</label>
            <select
              value={form.groupId ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, groupId: e.target.value || undefined }))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">—</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t('source')}</label>
            <input
              type="text"
              value={form.source ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, source: e.target.value }))}
              placeholder={t('sourcePlaceholder')}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{tc('notes')}</label>
            <textarea
              value={form.notes ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              rows={2}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              {tc('cancel')}
            </button>
            <button
              type="submit"
              disabled={saving}
              className={cn(
                'rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50'
              )}
            >
              {saving ? t('creating') : t('createLead')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
