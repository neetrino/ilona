'use client';

import { useState, useEffect, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import type { CrmLead, CrmLeadStatus } from '@/features/crm/types';
import { useCrmStatusLabels } from '@/features/crm/hooks/useCrmStatusLabels';
import { fetchLead, updateLead, addLeadComment } from '@/features/crm/api/crm.api';
import { VoiceRecorder, RecordingPlayback } from './VoiceRecorder';
import { fetchCenters } from '@/features/centers/api/centers.api';
import { fetchTeachers } from '@/features/teachers/api/teachers.api';
import { fetchGroups } from '@/features/groups/api/groups.api';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { SingleSelectDropdown } from '@/shared/components/ui/single-select-dropdown';
import { ADMIN_ICON_BUTTON_CLASS } from '@/shared/lib/admin-control-theme';

interface LeadDrawerProps {
  leadId: string | null;
  onClose: () => void;
  onUpdated: () => void;
}

const LEVEL_OPTIONS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

export function LeadDrawer({ leadId, onClose, onUpdated }: LeadDrawerProps) {
  const t = useTranslations('crm');
  const tc = useTranslations('common');
  const tr = useTranslations('roles');
  const statusLabels = useCrmStatusLabels();
  const isAdmin = useAuthStore((s) => s.user?.role === 'ADMIN');
  const [comment, setComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  const { data: lead, isLoading, refetch } = useQuery({
    queryKey: ['crm-lead', leadId],
    queryFn: () => fetchLead(leadId!),
    enabled: !!leadId,
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
  const teachers = useMemo(() => teachersData?.items ?? [], [teachersData?.items]);
  const { data: groupsData } = useQuery({
    queryKey: ['groups'],
    queryFn: () => fetchGroups({ take: 500 }),
    enabled: !!leadId,
  });
  const [form, setForm] = useState<Partial<CrmLead>>({});
  const groups = useMemo(() => groupsData?.items ?? [], [groupsData?.items]);
  const selectedTeacherId = form.teacherId ?? '';
  const groupsForSelectedTeacher = useMemo(
    () => (selectedTeacherId ? groups.filter((group) => group.teacherId === selectedTeacherId) : []),
    [groups, selectedTeacherId],
  );

  const levelOptions = useMemo(
    () => [
      { id: '', label: '—' },
      ...LEVEL_OPTIONS.map((level) => ({ id: level, label: level })),
    ],
    [],
  );
  const centerOptions = useMemo(
    () => [
      { id: '', label: '—' },
      ...centers.map((center) => ({ id: center.id, label: center.name })),
    ],
    [centers],
  );
  const teacherOptions = useMemo(
    () => [
      { id: '', label: '—' },
      ...teachers.map((teacher) => ({
        id: teacher.id,
        label: `${teacher.user?.firstName ?? ''} ${teacher.user?.lastName ?? ''}`.trim(),
      })),
    ],
    [teachers],
  );
  const groupOptions = useMemo(
    () => [
      { id: '', label: selectedTeacherId ? '—' : t('selectTeacherFirst') },
      ...groupsForSelectedTeacher.map((group) => ({ id: group.id, label: group.name })),
    ],
    [groupsForSelectedTeacher, selectedTeacherId, t],
  );

  useEffect(() => {
    if (lead) {
      setForm({
        firstName: lead.firstName ?? '',
        lastName: lead.lastName ?? '',
        phone: (lead.phone ?? '').replace(/\D/g, ''),
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

  useEffect(() => {
    const selectedGroupId = form.groupId ?? '';

    if (!selectedTeacherId) {
      if (selectedGroupId) {
        setForm((prev) => ({ ...prev, groupId: '' }));
      }
      return;
    }

    if (selectedGroupId && !groupsForSelectedTeacher.some((group) => group.id === selectedGroupId)) {
      setForm((prev) => ({ ...prev, groupId: '' }));
    }
  }, [selectedTeacherId, form.groupId, groupsForSelectedTeacher]);

  const buildLeadUpdatePayload = (next: Partial<CrmLead>) => ({
    firstName: next.firstName ?? undefined,
    lastName: next.lastName ?? undefined,
    phone: next.phone ?? undefined,
    age: next.age ?? undefined,
    levelId: next.levelId ?? undefined,
    teacherId: next.teacherId ?? undefined,
    groupId: next.groupId ?? undefined,
    centerId: next.centerId ?? undefined,
    source: next.source ?? undefined,
    notes: next.notes ?? undefined,
  });

  const patchAndSave = async (patch: Partial<CrmLead>) => {
    if (!leadId) return;
    const next = { ...form, ...patch };
    setForm(next);
    try {
      await updateLead(leadId, buildLeadUpdatePayload(next));
      await refetch();
      onUpdated();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveFields = async () => {
    if (!leadId || !form) return;
    try {
      await updateLead(leadId, buildLeadUpdatePayload(form));
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
        <h2 className="text-lg font-semibold text-slate-900">{t('leadDetails')}</h2>
        <button
          type="button"
          onClick={onClose}
          className={`${ADMIN_ICON_BUTTON_CLASS} text-slate-500 hover:bg-slate-100 hover:text-slate-700`}
          aria-label={tc('close')}
          title={tc('close')}
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
          <p className="text-slate-500">{t('leadNotFound')}</p>
        ) : (
          <>
            {/* Voice player — top section */}
            {lead.attachments && lead.attachments.some((a) => a.type === 'VOICE_RECORDING') && (
              <div className="pb-4 border-b border-slate-200">
                <label className="block text-sm font-medium text-slate-700 mb-2">{t('voiceRecording')}</label>
                <div className="space-y-2">
                  {lead.attachments
                    .filter((a) => a.type === 'VOICE_RECORDING')
                    .map((a) => (
                      <div key={a.id}>
                        <RecordingPlayback
                          r2Key={a.r2Key}
                          mimeType={a.mimeType ?? 'audio/webm'}
                          className="w-full max-w-full"
                        />
                      </div>
                    ))}
                </div>
              </div>
            )}

            <div className="text-xs text-slate-500">
              {t('created')}{' '}
              {lead.createdAt ? new Date(lead.createdAt).toLocaleString() : ''}
              {lead.updatedAt && (
                <>
                  {' '}
                  · {t('updated')} {new Date(lead.updatedAt).toLocaleString()}
                </>
              )}
            </div>

            {/* Voice recording add-on for NEW leads — admin CRM only (managers use text create flow). */}
            {isAdmin && lead.status === 'NEW' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('voiceRecording')}</label>
                <VoiceRecorder leadId={lead.id} onRecordingSaved={() => refetch()} />
              </div>
            )}

            {/* Info form — hidden for voice leads */}
            {!lead.attachments?.some((a) => a.type === 'VOICE_RECORDING') && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">{t('firstName')}</label>
                    <input
                      type="text"
                      value={form.firstName ?? ''}
                      onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                      onBlur={handleSaveFields}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">{t('lastName')}</label>
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
                  <label className="block text-sm font-medium text-slate-700 mb-1">{tc('phone')}</label>
                  <input
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel"
                    value={form.phone != null && form.phone !== '' ? `+${form.phone}` : '+'}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value.replace(/\D/g, '') }))}
                    onBlur={handleSaveFields}
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
                      onChange={(e) => setForm((f) => ({ ...f, age: e.target.value ? Number(e.target.value) : undefined }))}
                      onBlur={handleSaveFields}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">{t('level')}</label>
                    <SingleSelectDropdown
                      id="lead-drawer-level"
                      options={levelOptions}
                      value={form.levelId ?? ''}
                      onValueChange={(nextValue) => {
                        void patchAndSave({ levelId: nextValue ?? '' });
                      }}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t('center')}</label>
                  <SingleSelectDropdown
                    id="lead-drawer-center"
                    options={centerOptions}
                    value={form.centerId ?? ''}
                    onValueChange={(nextValue) => {
                      void patchAndSave({ centerId: nextValue ?? '' });
                    }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t('teacher')}</label>
                  <SingleSelectDropdown
                    id="lead-drawer-teacher"
                    options={teacherOptions}
                    value={form.teacherId ?? ''}
                    onValueChange={(nextValue) => {
                      void patchAndSave({ teacherId: nextValue ?? '', groupId: '' });
                    }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t('group')}</label>
                  <SingleSelectDropdown
                    id="lead-drawer-group"
                    options={groupOptions}
                    value={form.groupId ?? ''}
                    onValueChange={(nextValue) => {
                      void patchAndSave({ groupId: nextValue ?? '' });
                    }}
                    disabled={!selectedTeacherId}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{tc('notes')}</label>
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
                  <label className="block text-sm font-medium text-slate-700">{t('addComment')}</label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder={t('writeCommentPlaceholder')}
                    rows={2}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                  <button
                    type="submit"
                    disabled={submittingComment || !comment.trim()}
                    className="rounded-lg bg-slate-200 px-3 py-1.5 text-sm font-medium text-slate-800 hover:bg-slate-300 disabled:opacity-50"
                  >
                    {submittingComment ? t('sending') : t('send')}
                  </button>
                </form>
              </>
            )}

            {/* Approved / Transfer are mutually exclusive: show only one */}
            {(lead.teacherApprovedAt || lead.activities?.some((a) => a.type === 'TEACHER_APPROVED')) ? (
              <div className="rounded-lg border border-green-200 bg-green-50/80 p-4">
                <h3 className="text-sm font-semibold text-green-900 mb-3">{t('approved')}</h3>
                <p className="text-sm text-slate-700">
                  {t('teacherApprovedLead')}
                  {lead.teacherApprovedAt && (
                    <span className="text-slate-500 ml-1">
                      {new Date(lead.teacherApprovedAt).toLocaleString()}
                    </span>
                  )}
                  {lead.teacher?.user && (
                    <span className="block mt-1 font-medium text-slate-800">
                      {lead.teacher.user.firstName} {lead.teacher.user.lastName}
                    </span>
                  )}
                </p>
              </div>
            ) : (lead.transferFlag || lead.activities?.some((a) => a.type === 'TEACHER_TRANSFER')) ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50/80 p-4">
                <h3 className="text-sm font-semibold text-amber-900 mb-3">{t('transferInfo')}</h3>
                <ul className="space-y-3">
                  {lead.activities
                    ?.filter((a) => a.type === 'TEACHER_TRANSFER')
                    .map((a) => {
                      const comment = (a.payload as { comment?: string } | null)?.comment ?? lead.transferComment ?? '—';
                      const teacherName = a.actorUser
                        ? `${a.actorUser.firstName} ${a.actorUser.lastName}`.trim()
                        : lead.teacher?.user
                          ? `${lead.teacher.user.firstName} ${lead.teacher.user.lastName}`.trim()
                          : tr('teacher');
                      return (
                        <li key={a.id} className="text-sm text-slate-700 border-l-2 border-amber-300 pl-3 py-1.5">
                          <span className="font-medium text-slate-800">{teacherName}</span>
                          <span className="text-slate-500 ml-1">
                            {new Date(a.createdAt).toLocaleString()}
                          </span>
                          {comment && comment !== '—' && (
                            <p className="mt-1 text-slate-600">{comment}</p>
                          )}
                        </li>
                      );
                    })}
                  {(!lead.activities?.some((a) => a.type === 'TEACHER_TRANSFER') && lead.transferFlag && lead.transferComment) && (
                    <li className="text-sm text-slate-700 border-l-2 border-amber-300 pl-3 py-1.5">
                      {lead.teacher?.user ? (
                        <span className="font-medium text-slate-800">
                          {lead.teacher.user.firstName} {lead.teacher.user.lastName}
                        </span>
                      ) : (
                        <span className="font-medium text-slate-800">{tr('teacher')}</span>
                      )}
                      <p className="mt-1 text-slate-600">{lead.transferComment}</p>
                    </li>
                  )}
                </ul>
              </div>
            ) : null}

            {/* Activity timeline */}
            {lead.activities && lead.activities.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-slate-800 mb-2">{t('activity')}</h3>
                <ul className="space-y-2">
                  {lead.activities.map((a) => (
                    <li key={a.id} className="text-sm text-slate-600 border-l-2 border-slate-200 pl-3 py-1">
                      {a.type === 'STATUS_CHANGE' && a.payload && (() => {
                        const payload = a.payload as { fromStatus?: CrmLeadStatus; toStatus?: CrmLeadStatus };
                        const from = payload.fromStatus
                          ? (statusLabels[payload.fromStatus] ?? payload.fromStatus)
                          : '';
                        const to = payload.toStatus
                          ? (statusLabels[payload.toStatus] ?? payload.toStatus)
                          : '';
                        return <>{t('activityStatusChange', { from, to })}</>;
                      })()}
                      {a.type === 'COMMENT' && a.payload && (
                        <>{t('activityComment', { content: (a.payload as { content?: string }).content ?? '' })}</>
                      )}
                      {a.type === 'RECORDING_UPLOADED' && <>{t('activityVoiceAdded')}</>}
                      {a.type === 'TEACHER_APPROVED' && <>{t('activityTeacherApproved')}</>}
                      {a.type === 'TEACHER_TRANSFER' && <>{t('activityTransferRequested')}</>}
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
