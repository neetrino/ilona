'use client';

import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchLead, updateLead, changeLeadStatus } from '@/features/crm/api/crm.api';
import type { UpdateLeadDto, CrmLeadStatus } from '@/features/crm/types';
import { CRM_COLUMN_ORDER } from '@/features/crm/types';
import { cn } from '@/shared/lib/utils';
import { CrmStatusSelector } from './CrmStatusSelector';

const LEVEL_OPTIONS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

interface CenterOption {
  id: string;
  name: string;
}
interface TeacherOption {
  id: string;
  user?: { firstName?: string; lastName?: string };
}
interface GroupOption {
  id: string;
  name: string;
}

interface EditLeadModalProps {
  open: boolean;
  leadId: string | null;
  onClose: () => void;
  onSaved: () => void;
  centers: CenterOption[];
  teachers: TeacherOption[];
  groups: GroupOption[];
  /** All CRM statuses to show in the status selector (must match board columns). Defaults to CRM_COLUMN_ORDER. */
  availableStatuses?: CrmLeadStatus[];
}

export function EditLeadModal({
  open,
  leadId,
  onClose,
  onSaved,
  centers,
  teachers,
  groups,
  availableStatuses = CRM_COLUMN_ORDER,
}: EditLeadModalProps) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<UpdateLeadDto & { status?: CrmLeadStatus; archivedReason?: string }>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: lead, isLoading } = useQuery({
    queryKey: ['crm-lead', leadId],
    queryFn: () => fetchLead(leadId!),
    enabled: !!leadId && open,
  });

  // Sync form whenever modal opens or lead data is available (so edit always shows current saved values)
  useEffect(() => {
    if (!open || !leadId) return;
    if (!lead || lead.id !== leadId) {
      setForm({});
      return;
    }
    setForm({
      firstName: lead.firstName ?? '',
      lastName: lead.lastName ?? '',
      phone: (lead.phone ?? '').replace(/\D/g, ''),
      age: lead.age ?? undefined,
      levelId: lead.levelId ?? undefined,
      teacherId: lead.teacherId ?? undefined,
      groupId: lead.groupId ?? undefined,
      centerId: lead.centerId ?? undefined,
      status: lead.status,
      archivedReason: lead.archivedReason ?? undefined,
    });
    setError(null);
  }, [open, leadId, lead]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadId || !lead) return;
    setError(null);
    setSaving(true);
    try {
      const { status: formStatus, archivedReason: formArchivedReason, ...updatePayload } = form;
      await updateLead(leadId, updatePayload);
      if (formStatus && formStatus !== lead.status) {
        await changeLeadStatus(leadId, {
          status: formStatus,
          ...(formStatus === 'ARCHIVE' && formArchivedReason
            ? { archivedReason: formArchivedReason }
            : {}),
        });
      }
      await queryClient.invalidateQueries({ queryKey: ['crm-lead', leadId] });
      onSaved();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update lead');
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">Edit Lead</h2>
        </div>
        {isLoading ? (
          <div className="p-8 text-center text-slate-500">Loading…</div>
        ) : (
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
              <label className="block text-sm font-medium text-slate-700 mb-1">Phone number</label>
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
                    }))
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Level</label>
                <select
                  value={form.levelId ?? ''}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, levelId: e.target.value || undefined }))
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="">—</option>
                  {LEVEL_OPTIONS.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Teacher</label>
              <select
                value={form.teacherId ?? ''}
                onChange={(e) =>
                  setForm((f) => ({ ...f, teacherId: e.target.value || undefined }))
                }
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
                onChange={(e) =>
                  setForm((f) => ({ ...f, groupId: e.target.value || undefined }))
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="">—</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Center</label>
              <select
                value={form.centerId ?? ''}
                onChange={(e) =>
                  setForm((f) => ({ ...f, centerId: e.target.value || undefined }))
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="">—</option>
                {centers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
              <CrmStatusSelector
                id="edit-lead-status"
                value={form.status}
                options={availableStatuses}
                onChange={(status) =>
                  setForm((f) => ({ ...f, status }))
                }
              />
            </div>
            {form.status === 'ARCHIVE' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Archive reason (optional)
                </label>
                <input
                  type="text"
                  value={form.archivedReason ?? ''}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, archivedReason: e.target.value || undefined }))
                  }
                  placeholder="Reason for archiving"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
            )}
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
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
