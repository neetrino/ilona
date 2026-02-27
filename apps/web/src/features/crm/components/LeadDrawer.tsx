'use client';

import { useState, useEffect } from 'react';
import type { CrmLead, CrmLeadStatus } from '@/features/crm/types';
import {
  fetchLead,
  updateLead,
  changeLeadStatus,
  addLeadComment,
  getAllowedTransitions,
} from '@/features/crm/api/crm.api';
import { STATUS_LABELS } from './LeadCard';
import { VoiceRecorder, RecordingPlayback } from './VoiceRecorder';
import { fetchCenters } from '@/features/centers/api/centers.api';
import { fetchTeachers } from '@/features/teachers/api/teachers.api';
import { fetchGroups } from '@/features/groups/api/groups.api';
import { useQuery } from '@tanstack/react-query';

interface LeadDrawerProps {
  leadId: string | null;
  onClose: () => void;
  onUpdated: () => void;
}

const LEVEL_OPTIONS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

export function LeadDrawer({ leadId, onClose, onUpdated }: LeadDrawerProps) {
  const [comment, setComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [changingStatus, setChangingStatus] = useState(false);

  const { data: lead, isLoading, refetch } = useQuery({
    queryKey: ['crm-lead', leadId],
    queryFn: () => fetchLead(leadId!),
    enabled: !!leadId,
  });

  const { data: allowedStatuses = [] } = useQuery({
    queryKey: ['crm-allowed-transitions', lead?.status],
    queryFn: () => getAllowedTransitions(lead!.status),
    enabled: !!lead?.status,
  });

  const { data: centers = [] } = useQuery({
    queryKey: ['centers'],
    queryFn: () => fetchCenters({ take: 100 }),
    select: (r) => r.items,
    enabled: !!leadId,
  });
  const { data: teachersData } = useQuery({
    queryKey: ['teachers'],
    queryFn: () => fetchTeachers({ take: 200 }),
    enabled: !!leadId,
  });
  const teachers = teachersData?.items ?? [];
  const { data: groupsData } = useQuery({
    queryKey: ['groups'],
    queryFn: () => fetchGroups({ take: 200 }),
    enabled: !!leadId,
  });
  const groups = groupsData?.items ?? [];

  const [form, setForm] = useState<Partial<CrmLead>>({});

  useEffect(() => {
    if (lead) {
      setForm({
        firstName: lead.firstName ?? '',
        lastName: lead.lastName ?? '',
        phone: lead.phone ?? '',
        age: lead.age ?? undefined,
        levelId: lead.levelId ?? '',
        teacherId: lead.teacherId ?? '',
        groupId: lead.groupId ?? '',
        centerId: lead.centerId ?? '',
        source: lead.source ?? '',
        notes: lead.notes ?? '',
      });
    }
  }, [lead]);

  const handleStatusChange = async (newStatus: CrmLeadStatus) => {
    if (!leadId || !lead) return;
    setChangingStatus(true);
    try {
      await changeLeadStatus(leadId, { status: newStatus });
      await refetch();
      onUpdated();
    } finally {
      setChangingStatus(false);
    }
  };

  const handleSaveFields = async () => {
    if (!leadId || !form) return;
    try {
      await updateLead(leadId, {
        firstName: form.firstName ?? undefined,
        lastName: form.lastName ?? undefined,
        phone: form.phone ?? undefined,
        age: form.age ?? undefined,
        levelId: form.levelId ?? undefined,
        teacherId: form.teacherId ?? undefined,
        groupId: form.groupId ?? undefined,
        centerId: form.centerId ?? undefined,
        source: form.source ?? undefined,
        notes: form.notes ?? undefined,
      });
      await refetch();
      onUpdated();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadId || !comment.trim()) return;
    setSubmittingComment(true);
    try {
      await addLeadComment(leadId, comment.trim());
      setComment('');
      await refetch();
    } finally {
      setSubmittingComment(false);
    }
  };

  if (!leadId) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-white shadow-xl flex flex-col">
      <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
        <h2 className="text-lg font-semibold text-slate-900">Lead details</h2>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1 text-slate-500 hover:bg-slate-100"
        >
          ✕
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {isLoading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-slate-200 rounded w-2/3" />
            <div className="h-4 bg-slate-200 rounded w-full" />
            <div className="h-4 bg-slate-200 rounded w-1/2" />
          </div>
        ) : !lead ? (
          <p className="text-slate-500">Lead not found.</p>
        ) : (
          <>
            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
              <select
                value={lead.status}
                onChange={(e) => handleStatusChange(e.target.value as CrmLeadStatus)}
                disabled={changingStatus || allowedStatuses.length === 0}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                <option value={lead.status}>{STATUS_LABELS[lead.status]}</option>
                {allowedStatuses
                  .filter((s) => s !== lead.status)
                  .map((s) => (
                    <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                  ))}
              </select>
            </div>

            <div className="text-xs text-slate-500">
              Created {lead.createdAt ? new Date(lead.createdAt).toLocaleString() : ''}
              {lead.updatedAt && (
                <> · Updated {new Date(lead.updatedAt).toLocaleString()}</>
              )}
            </div>

            {/* Voice recording (NEW only) */}
            {lead.status === 'NEW' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Voice recording</label>
                <VoiceRecorder leadId={lead.id} onRecordingSaved={() => refetch()} />
              </div>
            )}

            {/* Attachments */}
            {lead.attachments && lead.attachments.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Recordings</label>
                <div className="space-y-2">
                  {lead.attachments.map((a) => (
                    <div key={a.id}>
                      {a.type === 'VOICE_RECORDING' && (
                        <RecordingPlayback r2Key={a.r2Key} mimeType={a.mimeType} />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Info form — hidden for voice leads */}
            {!lead.attachments?.some((a) => a.type === 'VOICE_RECORDING') && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">First name</label>
                    <input
                      type="text"
                      value={form.firstName ?? ''}
                      onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                      onBlur={handleSaveFields}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Last name</label>
                    <input
                      type="text"
                      value={form.lastName ?? ''}
                      onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                      onBlur={handleSaveFields}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={form.phone ?? ''}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    onBlur={handleSaveFields}
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
                      onChange={(e) => setForm((f) => ({ ...f, age: e.target.value ? Number(e.target.value) : undefined }))}
                      onBlur={handleSaveFields}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Level</label>
                    <select
                      value={form.levelId ?? ''}
                      onChange={(e) => setForm((f) => ({ ...f, levelId: e.target.value }))}
                      onBlur={handleSaveFields}
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
                    onChange={(e) => setForm((f) => ({ ...f, centerId: e.target.value }))}
                    onBlur={handleSaveFields}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  >
                    <option value="">—</option>
                    {centers.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Teacher</label>
                  <select
                    value={form.teacherId ?? ''}
                    onChange={(e) => setForm((f) => ({ ...f, teacherId: e.target.value }))}
                    onBlur={handleSaveFields}
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
                    onChange={(e) => setForm((f) => ({ ...f, groupId: e.target.value }))}
                    onBlur={handleSaveFields}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  >
                    <option value="">—</option>
                    {groups.map((g) => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                  <textarea
                    value={form.notes ?? ''}
                    onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                    onBlur={handleSaveFields}
                    rows={3}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>

                {/* Comment */}
                <form onSubmit={handleAddComment} className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">Add comment</label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Write a comment…"
                    rows={2}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                  <button
                    type="submit"
                    disabled={submittingComment || !comment.trim()}
                    className="rounded-lg bg-slate-200 px-3 py-1.5 text-sm font-medium text-slate-800 hover:bg-slate-300 disabled:opacity-50"
                  >
                    {submittingComment ? 'Sending…' : 'Send'}
                  </button>
                </form>
              </>
            )}

            {/* Activity timeline */}
            {lead.activities && lead.activities.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-slate-800 mb-2">Activity</h3>
                <ul className="space-y-2">
                  {lead.activities.map((a) => (
                    <li key={a.id} className="text-sm text-slate-600 border-l-2 border-slate-200 pl-3 py-1">
                      {a.type === 'STATUS_CHANGE' && a.payload && (
                        <>Status: {(a.payload as { fromStatus?: string }).fromStatus} → {(a.payload as { toStatus?: string }).toStatus}</>
                      )}
                      {a.type === 'COMMENT' && a.payload && (
                        <>Comment: {(a.payload as { content?: string }).content}</>
                      )}
                      {a.type === 'RECORDING_UPLOADED' && <>Voice recording added</>}
                      {a.type === 'TEACHER_APPROVED' && <>Teacher approved</>}
                      {a.type === 'TEACHER_TRANSFER' && <>Transfer requested</>}
                      <span className="text-slate-400 ml-1">
                        {new Date(a.createdAt).toLocaleString()}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
