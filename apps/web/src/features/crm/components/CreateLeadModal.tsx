'use client';

import { useState } from 'react';
import { createLead } from '@/features/crm/api/crm.api';
import type { CreateLeadDto } from '@/features/crm/types';
import { fetchCenters } from '@/features/centers/api/centers.api';
import { fetchTeachers } from '@/features/teachers/api/teachers.api';
import { fetchGroups } from '@/features/groups/api/groups.api';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/shared/lib/utils';

interface CreateLeadModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

const LEVEL_OPTIONS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

export function CreateLeadModal({ open, onClose, onCreated }: CreateLeadModalProps) {
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
    queryKey: ['groups'],
    queryFn: () => fetchGroups({ take: 500 }),
    enabled: open,
  });
  const groups = groupsData?.items ?? [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await createLead(form);
      setForm({});
      onCreated();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create lead');
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">New Lead</h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <p className="text-sm text-red-600 rounded-lg bg-red-50 p-2">{error}</p>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">First name</label>
              <input
                type="text"
                value={form.firstName ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Last name</label>
              <input
                type="text"
                value={form.lastName ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
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
              <label className="block text-sm font-medium text-slate-700 mb-1">Age</label>
              <input
                type="number"
                min={0}
                value={form.age ?? ''}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    age: e.target.value ? Number(e.target.value) : undefined,
                    ...(e.target.value && Number(e.target.value) >= 18
                      ? { parentName: undefined, parentPhone: undefined }
                      : {}),
                  }))
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Level</label>
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
            <label className="block text-sm font-medium text-slate-700 mb-1">Center</label>
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
          </div>
          {(isUnder18 || isAdult) && (
            <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {isUnder18 ? 'Parent details (under 18)' : 'Student details (18+)'}
              </p>
              {isUnder18 && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Parent name</label>
                    <input
                      type="text"
                      value={form.parentName ?? ''}
                      onChange={(e) => setForm((f) => ({ ...f, parentName: e.target.value }))}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Parent phone number</label>
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
                </>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {isUnder18 ? 'Parent passport details' : 'Student passport details'}
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
            <label className="block text-sm font-medium text-slate-700 mb-1">Teacher</label>
            <select
              value={form.teacherId ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, teacherId: e.target.value || undefined }))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">—</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.user?.firstName} {t.user?.lastName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Group</label>
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
            <label className="block text-sm font-medium text-slate-700 mb-1">Source</label>
            <input
              type="text"
              value={form.source ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, source: e.target.value }))}
              placeholder="e.g. call, form"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
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
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className={cn(
                'rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50'
              )}
            >
              {saving ? 'Creating…' : 'Create Lead'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
