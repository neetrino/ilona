'use client';

import { useState, useEffect, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import type { CrmLead } from '@/features/crm/types';
import { fetchLead, deleteLead, updateLead } from '@/features/crm/api/crm.api';
import { fetchCenters } from '@/features/centers/api/centers.api';
import { fetchTeachers } from '@/features/teachers/api/teachers.api';
import { fetchGroups } from '@/features/groups/api/groups.api';
import { VoiceRecorder, RecordingPlayback } from './VoiceRecorder';
import { useQuery } from '@tanstack/react-query';

const LEVEL_OPTIONS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

/** Simple phone validation: at least 4 digits, allows +, spaces, digits, parentheses, hyphens */
function isValidPhone(value: string): boolean {
  if (!value.trim()) return true;
  const digits = value.replace(/\D/g, '');
  return digits.length >= 4 && digits.length <= 20;
}

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

interface VoiceLeadDetailModalProps {
  leadId: string | null;
  open: boolean;
  onClose: () => void;
  onUpdated: () => void;
  /** Optional: pass from parent to avoid duplicate requests */
  centers?: CenterOption[];
  teachers?: TeacherOption[];
  groups?: GroupOption[];
}

export function VoiceLeadDetailModal({
  leadId,
  open,
  onClose,
  onUpdated,
  centers: centersProp,
  teachers: teachersProp,
  groups: groupsProp,
}: VoiceLeadDetailModalProps) {
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<CrmLead>>({});
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const t = useTranslations('crm');
  const tCommon = useTranslations('common');

  const { data: lead, isLoading, refetch } = useQuery({
    queryKey: ['crm-lead', leadId],
    queryFn: () => fetchLead(leadId!),
    enabled: !!leadId && open,
  });

  const { data: centersData } = useQuery({
    queryKey: ['centers'],
    queryFn: () => fetchCenters({ take: 100 }),
    enabled: open && centersProp === undefined,
  });
  const { data: teachersData } = useQuery({
    queryKey: ['teachers'],
    queryFn: () => fetchTeachers({ take: 200 }),
    enabled: open && teachersProp === undefined,
  });
  const { data: groupsData } = useQuery({
    queryKey: ['groups'],
    queryFn: () => fetchGroups({ take: 500 }),
    enabled: open && groupsProp === undefined,
  });

  const centers = centersProp ?? centersData?.items ?? [];
  const teachers = teachersProp ?? teachersData?.items ?? [];
  const groups = useMemo(() => groupsProp ?? groupsData?.items ?? [], [groupsProp, groupsData?.items]);
  const selectedTeacherId = form.teacherId ?? '';
  const groupsForSelectedTeacher = useMemo(
    () => (selectedTeacherId ? groups.filter((group) => group.teacherId === selectedTeacherId) : []),
    [groups, selectedTeacherId],
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
      });
      setPhoneError(null);
      setSaveError(null);
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

  const handleDeleteClick = () => setShowDeleteConfirm(true);
  const handleDeleteConfirm = async () => {
    if (!leadId) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteLead(leadId);
      onUpdated();
      onClose();
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : 'Failed to delete');
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleSaveLead = async () => {
    if (!leadId) return;
    setPhoneError(null);
    setSaveError(null);
    const phone = (form.phone ?? '').trim();
    if (phone && !isValidPhone(phone)) {
      setPhoneError(t('invalidPhone'));
      return;
    }
    setSaving(true);
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
      });
      await refetch();
      onUpdated();
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelLead = () => {
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
      });
    }
    setPhoneError(null);
    setSaveError(null);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-lg max-h-[90vh] flex flex-col rounded-xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 flex-shrink-0">
          <h2 className="text-lg font-semibold text-slate-900">{t('voiceLead')}</h2>
          <div className="flex items-center gap-2">
            {lead && (
              <button
                type="button"
                onClick={handleDeleteClick}
                disabled={deleting}
                className="rounded-lg px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
              >
                Delete
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1 text-slate-500 hover:bg-slate-100"
            >
              ✕
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {!leadId ? (
            <p className="text-slate-500">No lead selected.</p>
          ) : isLoading ? (
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-slate-200 rounded w-2/3" />
              <div className="h-4 bg-slate-200 rounded w-full" />
              <div className="h-4 bg-slate-200 rounded w-1/2" />
            </div>
          ) : !lead ? (
            <p className="text-slate-500">Lead not found.</p>
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
                Created {lead.createdAt ? new Date(lead.createdAt).toLocaleString() : ''}
                {lead.updatedAt && (
                  <> · Updated {new Date(lead.updatedAt).toLocaleString()}</>
                )}
              </div>

              {lead.status === 'NEW' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t('voiceRecording')}</label>
                  <VoiceRecorder leadId={lead.id} onRecordingSaved={() => { refetch(); onUpdated(); }} />
                </div>
              )}

              {/* CRM lead information form — for NEW column voice cards */}
              {lead.status === 'NEW' && (
                <div className="border-t border-slate-200 pt-4 space-y-4">
                  <h3 className="text-sm font-semibold text-slate-800">{t('leadInformation')}</h3>
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
                    <label className="block text-sm font-medium text-slate-700 mb-1">{t('phoneNumber')}</label>
                    <input
                      type="tel"
                      inputMode="numeric"
                      autoComplete="tel"
                      value={form.phone != null && form.phone !== '' ? `+${form.phone}` : '+'}
                      onChange={(e) => {
                        setForm((f) => ({ ...f, phone: e.target.value.replace(/\D/g, '') }));
                        setPhoneError(null);
                      }}
                      className={`w-full rounded-lg border px-3 py-2 text-sm ${phoneError ? 'border-red-500' : 'border-slate-300'}`}
                    />
                    {phoneError && <p className="mt-1 text-xs text-red-600">{phoneError}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">{t('age')}</label>
                    <input
                      type="number"
                      min={0}
                      value={form.age ?? ''}
                      onChange={(e) => setForm((f) => ({ ...f, age: e.target.value ? Number(e.target.value) : undefined }))}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">{t('level')}</label>
                    <select
                      value={form.levelId ?? ''}
                      onChange={(e) => setForm((f) => ({ ...f, levelId: e.target.value }))}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    >
                      <option value="">—</option>
                      {LEVEL_OPTIONS.map((l) => (
                        <option key={l} value={l}>{l}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">{t('teacher')}</label>
                    <select
                      value={form.teacherId ?? ''}
                      onChange={(e) => setForm((f) => ({ ...f, teacherId: e.target.value, groupId: '' }))}
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
                      onChange={(e) => setForm((f) => ({ ...f, groupId: e.target.value }))}
                      disabled={!selectedTeacherId}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    >
                      <option value="">
                        {selectedTeacherId ? '—' : 'Select Teacher first'}
                      </option>
                      {groupsForSelectedTeacher.map((g) => (
                        <option key={g.id} value={g.id}>{g.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">{t('center')}</label>
                    <select
                      value={form.centerId ?? ''}
                      onChange={(e) => setForm((f) => ({ ...f, centerId: e.target.value }))}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    >
                      <option value="">—</option>
                      {centers.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  {saveError && <p className="text-sm text-red-600">{saveError}</p>}
                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={handleSaveLead}
                      disabled={saving}
                      className="rounded-lg px-4 py-2 text-sm font-medium bg-primary text-white hover:bg-primary/90 disabled:opacity-50"
                    >
                      {saving ? t('saving') : tCommon('save')}
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelLead}
                      disabled={saving}
                      className="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-50"
                    >
                      {tCommon('cancel')}
                    </button>
                  </div>
                </div>
              )}

              {deleteError && (
                <p className="text-sm text-red-600">{deleteError}</p>
              )}

              {showDeleteConfirm && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 space-y-3">
                  <p className="text-sm text-amber-800">
                    Delete this voice lead? This cannot be undone.
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleDeleteConfirm}
                      disabled={deleting}
                      className="rounded-lg px-3 py-1.5 text-sm font-medium bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                    >
                      {deleting ? 'Deleting…' : 'Delete'}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowDeleteConfirm(false); setDeleteError(null); }}
                      disabled={deleting}
                      className="rounded-lg px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-200"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Approved / Transfer are mutually exclusive: show only one */}
              {(lead.teacherApprovedAt || lead.activities?.some((a) => a.type === 'TEACHER_APPROVED')) ? (
                <div className="rounded-lg border border-green-200 bg-green-50/80 p-4">
                  <h3 className="text-sm font-semibold text-green-900 mb-3">Approved</h3>
                  <p className="text-sm text-slate-700">
                    Teacher approved this lead
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
                  <h3 className="text-sm font-semibold text-amber-900 mb-3">Transfer info</h3>
                  <ul className="space-y-3">
                    {lead.activities
                      ?.filter((a) => a.type === 'TEACHER_TRANSFER')
                      .map((a) => {
                        const comment = (a.payload as { comment?: string } | null)?.comment ?? lead.transferComment ?? '—';
                        const teacherName = a.actorUser
                          ? `${a.actorUser.firstName} ${a.actorUser.lastName}`.trim()
                          : lead.teacher?.user
                            ? `${lead.teacher.user.firstName} ${lead.teacher.user.lastName}`.trim()
                            : 'Teacher';
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
                          <span className="font-medium text-slate-800">Teacher</span>
                        )}
                        <p className="mt-1 text-slate-600">{lead.transferComment}</p>
                      </li>
                    )}
                  </ul>
                </div>
              ) : null}

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
    </div>
  );
}
