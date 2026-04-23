'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { fetchLead, updateLead, changeLeadStatus } from '@/features/crm/api/crm.api';
import type { UpdateLeadDto, CrmLeadStatus } from '@/features/crm/types';
import { CRM_COLUMN_ORDER } from '@/features/crm/types';
import { useModalClose } from '@/shared/hooks/useModalClose';
import { cn } from '@/shared/lib/utils';
import { CrmStatusSelector } from './CrmStatusSelector';
import { RecordingPlayback } from './VoiceRecorder';

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
  teacherId?: string | null;
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
  const modalContainerRef = useRef<HTMLDivElement>(null);
  const { onOverlayMouseDown, onOverlayClick } = useModalClose({
    open,
    onClose,
    containerRef: modalContainerRef,
  });
  const [form, setForm] = useState<
    UpdateLeadDto & { status?: CrmLeadStatus; archivedReason?: string; parentSurname?: string }
  >({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  const { data: lead, isLoading } = useQuery({
    queryKey: ['crm-lead', leadId],
    queryFn: () => fetchLead(leadId!),
    enabled: !!leadId && open,
  });

  const selectedTeacherId = form.teacherId ?? '';
  const groupsForSelectedTeacher = useMemo(
    () => (selectedTeacherId ? groups.filter((group) => group.teacherId === selectedTeacherId) : []),
    [groups, selectedTeacherId],
  );
  const voiceAttachments = useMemo(
    () => lead?.attachments?.filter((attachment) => attachment.type === 'VOICE_RECORDING') ?? [],
    [lead?.attachments],
  );

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
      dateOfBirth: lead.dateOfBirth ? lead.dateOfBirth.slice(0, 10) : undefined,
      firstLessonDate: lead.firstLessonDate ? lead.firstLessonDate.slice(0, 10) : undefined,
      comment: lead.comment ?? '',
      parentName: lead.parentName ?? '',
      parentPhone: (lead.parentPhone ?? '').replace(/\D/g, ''),
      parentPassportInfo: lead.parentPassportInfo ?? '',
      levelId: lead.levelId ?? undefined,
      teacherId: lead.teacherId ?? undefined,
      groupId: lead.groupId ?? undefined,
      centerId: lead.centerId ?? undefined,
      status: lead.status,
      archivedReason: lead.archivedReason ?? undefined,
    });
    setError(null);
  }, [open, leadId, lead]);

  useEffect(() => {
    const selectedGroupId = form.groupId ?? '';

    if (!selectedTeacherId) {
      if (selectedGroupId) {
        setForm((prev) => ({ ...prev, groupId: undefined }));
      }
      return;
    }

    if (selectedGroupId && !groupsForSelectedTeacher.some((group) => group.id === selectedGroupId)) {
      setForm((prev) => ({ ...prev, groupId: undefined }));
    }
  }, [selectedTeacherId, form.groupId, groupsForSelectedTeacher]);

  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadId || !lead) return;
    setError(null);
    setSaving(true);
    try {
      const {
        status: formStatus,
        archivedReason: formArchivedReason,
        parentSurname: _parentSurname,
        ...updatePayload
      } = form;
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

  if (!isMounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto"
      onMouseDown={onOverlayMouseDown}
      onClick={onOverlayClick}
    >
      <div className="flex min-h-full items-center justify-center w-full">
        <div
          ref={modalContainerRef}
          className="flex w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-white shadow-xl max-h-[calc(100vh-1rem)] sm:max-h-[calc(100vh-2rem)]"
        >
          <div className="border-b border-slate-200 px-4 py-4 sm:px-6">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-lg font-semibold text-slate-900">Edit Lead</h2>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-9 w-9 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 active:bg-slate-200"
                aria-label="Close edit lead modal"
                title="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        {isLoading ? (
          <div className="p-8 text-center text-slate-500">Loading…</div>
        ) : (
          <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
            {error && (
              <p className="text-sm text-red-600 rounded-lg bg-red-50 p-2">{error}</p>
            )}
            <section className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Voice</h3>
              {voiceAttachments.length > 0 ? (
                <div className="space-y-2">
                  {voiceAttachments.map((attachment) => (
                    <RecordingPlayback
                      key={attachment.id}
                      r2Key={attachment.r2Key}
                      mimeType={attachment.mimeType ?? 'audio/webm'}
                      className="w-full"
                    />
                  ))}
                </div>
              ) : (
                <p className="rounded-lg border border-dashed border-slate-300 px-3 py-2 text-sm text-slate-500">
                  No voice recording
                </p>
              )}
            </section>
            <section className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Comment</h3>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Comment</label>
                <textarea
                  rows={3}
                  value={form.comment ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, comment: e.target.value }))}
                  placeholder="Internal notes about this lead"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
            </section>
            <section className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Basic Info</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">First name</label>
                  <input
                    type="text"
                    value={form.firstName ?? ''}
                    onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Last name</label>
                  <input
                    type="text"
                    value={form.lastName ?? ''}
                    onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Phone number</label>
                <input
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel"
                  value={form.phone != null && form.phone !== '' ? `+${form.phone}` : '+'}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value.replace(/\D/g, '') }))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
            </section>
            <section className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Additional Info</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Age</label>
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
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Date of birth (mm/dd/yyyy)
                  </label>
                  <input
                    type="date"
                    value={form.dateOfBirth ?? ''}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, dateOfBirth: e.target.value || undefined }))
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    First lesson date (mm/dd/yyyy)
                  </label>
                  <input
                    type="date"
                    value={form.firstLessonDate ?? ''}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, firstLessonDate: e.target.value || undefined }))
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
              </div>
            </section>
            {typeof form.age === 'number' && form.age > 0 && form.age < 18 && (
              <section className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Parent details (under 18)
                </p>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Parent name</label>
                  <input
                    type="text"
                    value={form.parentName ?? ''}
                    onChange={(e) => setForm((f) => ({ ...f, parentName: e.target.value }))}
                    placeholder="John"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Parent surname</label>
                  <input
                    type="text"
                    value={form.parentSurname ?? ''}
                    onChange={(e) => setForm((f) => ({ ...f, parentSurname: e.target.value }))}
                    placeholder="Smith"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Parent phone</label>
                  <input
                    type="tel"
                    inputMode="numeric"
                    value={form.parentPhone != null && form.parentPhone !== '' ? `+${form.parentPhone}` : ''}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, parentPhone: e.target.value.replace(/\D/g, '') }))
                    }
                    placeholder="+374XXXXXXXX"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Parent passport details</label>
                  <input
                    type="text"
                    value={form.parentPassportInfo ?? ''}
                    onChange={(e) => setForm((f) => ({ ...f, parentPassportInfo: e.target.value }))}
                    placeholder="XX0000000"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
              </section>
            )}
            <section className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Academic Info</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Level</label>
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
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Teacher</label>
                  <select
                    value={form.teacherId ?? ''}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, teacherId: e.target.value || undefined, groupId: undefined }))
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
                  <label className="mb-1 block text-sm font-medium text-slate-700">Group</label>
                  <select
                    value={form.groupId ?? ''}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, groupId: e.target.value || undefined }))
                    }
                    disabled={!selectedTeacherId}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  >
                    <option value="">{selectedTeacherId ? '—' : 'Select Teacher first'}</option>
                    {groupsForSelectedTeacher.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Center</label>
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
              </div>
            </section>
            </div>
            <div className="border-t border-slate-200 bg-white/95 px-4 py-3 shadow-[0_-2px_8px_rgba(15,23,42,0.06)] backdrop-blur sm:px-6">
              <section className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</h3>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Status</label>
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
                    <label className="mb-1 block text-sm font-medium text-slate-700">
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
              </section>
            </div>
            <div className="border-t border-slate-200 px-4 py-3 sm:px-6">
              <div className="flex justify-center gap-2">
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
            </div>
          </form>
        )}
        </div>
      </div>
    </div>,
    document.body
  );
}
