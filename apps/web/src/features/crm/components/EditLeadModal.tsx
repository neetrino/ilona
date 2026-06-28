'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { useTranslations } from 'next-intl';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Trash2, X } from 'lucide-react';
import { fetchLead, updateLead, changeLeadStatus } from '@/features/crm/api/crm.api';
import type { UpdateLeadDto, CrmLeadStatus } from '@/features/crm/types';
import { CRM_COLUMN_ORDER } from '@/features/crm/types';
import { cn } from '@/shared/lib/utils';
import { ADMIN_ICON_BUTTON_SM_CLASS } from '@/shared/lib/admin-control-theme';
import { DatePickerInput, SegmentedControl } from '@/shared/components/ui';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { CrmStatusSelector } from './CrmStatusSelector';
import { PaidRegistrationModal } from './PaidRegistrationModal';
import { RecordingPlayback } from './VoiceRecorder';
import { SingleSelectDropdown, portaledDropdownDialogHandlers } from '@/shared/components/ui/single-select-dropdown';
import { usePortalSheetDrag } from '@/shared/hooks/usePortalSheetDrag';
import { PortalFormSheetDragHandle } from '@/shared/components/ui/portal-form-sheet-drag-handle';
import {
  PORTAL_FORM_SHEET_CLOSE_BUTTON_CLASS,
  PORTAL_FORM_SHEET_HEADER_CLASS,
  PORTAL_FORM_SHEET_OVERLAY_CLASS,
  PORTAL_FORM_SHEET_SCROLL_CLASS,
  portalFormSheetContentClass,
} from '@/shared/lib/portal-form-sheet-classes';

const LEVEL_OPTIONS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
const DEFAULT_LEVEL_ID = LEVEL_OPTIONS[0];

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
  canDeleteLead?: boolean;
  onDeleteRequest?: () => void;
  deleteDisabled?: boolean;
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
  canDeleteLead,
  onDeleteRequest,
  deleteDisabled,
}: EditLeadModalProps) {
  const t = useTranslations('crm');
  const tc = useTranslations('common');
  const user = useAuthStore((s) => s.user);
  const isManager = user?.role === 'MANAGER';
  const managerCenterReadonlyLabel = useMemo(() => {
    if (!isManager || !user?.managerCenterId) return null;
    const name = centers.find((c) => c.id === user.managerCenterId)?.name;
    return name ?? t('yourAssignedBranch');
  }, [centers, isManager, t, user?.managerCenterId]);

  const queryClient = useQueryClient();
  const crmStatusPortaledMenuRef = useRef<HTMLDivElement>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(open);
  const [form, setForm] = useState<
    UpdateLeadDto & { status?: CrmLeadStatus; archivedReason?: string; parentSurname?: string }
  >({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paidRegistrationOpen, setPaidRegistrationOpen] = useState(false);
  const [paidPrefill, setPaidPrefill] = useState<Partial<UpdateLeadDto> | undefined>(undefined);

  const requestClose = useCallback(() => {
    setIsDialogOpen(false);
    onClose();
  }, [onClose]);

  const { dragStyle, dragHandleProps, resetDrag } = usePortalSheetDrag({
    enabled: open,
    onClose: requestClose,
  });

  useEffect(() => {
    setIsDialogOpen(open);
  }, [open]);

  useEffect(() => {
    if (!open) {
      resetDrag();
    }
  }, [open, resetDrag]);

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
  const levelSegmentOptions = useMemo(
    () => LEVEL_OPTIONS.map((level) => ({ id: level, label: level })),
    [],
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
      {
        id: '',
        label: selectedTeacherId ? '—' : t('selectTeacherFirst'),
      },
      ...groupsForSelectedTeacher.map((group) => ({ id: group.id, label: group.name })),
    ],
    [groupsForSelectedTeacher, selectedTeacherId, t],
  );
  const centerOptions = useMemo(
    () => [
      { id: '', label: '—' },
      ...centers.map((center) => ({ id: center.id, label: center.name })),
    ],
    [centers],
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
      parentEmail: lead.parentEmail ?? '',
      parentPassportInfo: lead.parentPassportInfo ?? '',
      levelId: lead.levelId ?? DEFAULT_LEVEL_ID,
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

  const handleCrmStatusChange = (status: CrmLeadStatus) => {
    if (status === 'PAID' && lead && lead.status !== 'PAID') {
      setPaidPrefill({
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone,
        age: form.age,
        dateOfBirth: form.dateOfBirth,
        firstLessonDate: form.firstLessonDate,
        parentName: form.parentName,
        parentPhone: form.parentPhone,
        parentEmail: form.parentEmail,
        parentPassportInfo: form.parentPassportInfo,
        comment: form.comment,
        levelId: form.levelId,
        teacherId: form.teacherId,
        groupId: form.groupId,
        ...(isManager ? {} : { centerId: form.centerId }),
      });
      setPaidRegistrationOpen(true);
      return;
    }
    setForm((f) => ({ ...f, status }));
  };

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
      if (isManager) {
        delete updatePayload.centerId;
      }
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
      setError(err instanceof Error ? err.message : t('failedUpdateLead'));
    } finally {
      setSaving(false);
    }
  };

  const renderHeaderActions = () => (
    <div className="flex shrink-0 items-center gap-2">
      {canDeleteLead && onDeleteRequest ? (
        <button
          type="button"
          aria-label={t('deleteLead')}
          title={t('deleteLead')}
          disabled={deleteDisabled || saving}
          onClick={onDeleteRequest}
          className={cn(
            ADMIN_ICON_BUTTON_SM_CLASS,
            'text-slate-500 hover:bg-red-50 hover:text-red-600 disabled:pointer-events-none disabled:opacity-50',
          )}
        >
          <Trash2 className="h-4 w-4" aria-hidden />
        </button>
      ) : null}
      <DialogPrimitive.Close className={PORTAL_FORM_SHEET_CLOSE_BUTTON_CLASS} aria-label={t('closeEditLeadModal')}>
        <X className="h-4 w-4" />
      </DialogPrimitive.Close>
    </div>
  );

  return (
    <>
      <DialogPrimitive.Root open={isDialogOpen} onOpenChange={(nextOpen) => !nextOpen && requestClose()}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className={PORTAL_FORM_SHEET_OVERLAY_CLASS} />
          <DialogPrimitive.Content
            style={dragStyle}
            {...portaledDropdownDialogHandlers}
            className={portalFormSheetContentClass('3xl')}
            aria-describedby={undefined}
          >
            <PortalFormSheetDragHandle dragHandleProps={dragHandleProps} />
            <DialogPrimitive.Title className="sr-only">{t('editLead')}</DialogPrimitive.Title>
            <div className={PORTAL_FORM_SHEET_HEADER_CLASS}>
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg font-semibold text-[#3b3b40]">{t('editLead')}</h2>
                </div>
                {renderHeaderActions()}
              </div>
            </div>
            {isLoading ? (
              <div className={cn(PORTAL_FORM_SHEET_SCROLL_CLASS, 'p-8 text-center text-slate-500')}>
                {tc('loading')}
              </div>
            ) : (
              <div className={cn(PORTAL_FORM_SHEET_SCROLL_CLASS, 'pt-4 sm:pt-5')}>
                <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <p className="text-sm text-red-600 rounded-lg bg-red-50 p-2">{error}</p>
            )}
            <section className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t('voiceSection')}</h3>
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
                  {t('noVoiceRecording')}
                </p>
              )}
            </section>
            <section className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t('comment')}</h3>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">{t('comment')}</label>
                <textarea
                  rows={3}
                  value={form.comment ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, comment: e.target.value }))}
                  placeholder={t('commentPlaceholder')}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
            </section>
            <section className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t('basicInfo')}</h3>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">{t('firstName')}</label>
                  <input
                    type="text"
                    value={form.firstName ?? ''}
                    onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">{t('lastName')}</label>
                  <input
                    type="text"
                    value={form.lastName ?? ''}
                    onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="mb-1 block text-sm font-medium text-slate-700">{t('phoneNumber')}</label>
                  <input
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel"
                    value={form.phone != null && form.phone !== '' ? `+${form.phone}` : '+'}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value.replace(/\D/g, '') }))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
              </div>
            </section>
            <section className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t('additionalInfo')}</h3>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                <div className="col-span-2 sm:col-span-1">
                  <label className="mb-1 block text-sm font-medium text-slate-700">{t('age')}</label>
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
                    {t('dateOfBirth')}
                  </label>
                  <DatePickerInput
                    value={form.dateOfBirth ?? ''}
                    onValueChange={(nextValue) =>
                      setForm((f) => ({ ...f, dateOfBirth: nextValue || undefined }))
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    {t('firstLessonDate')}
                  </label>
                  <DatePickerInput
                    value={form.firstLessonDate ?? ''}
                    onValueChange={(nextValue) =>
                      setForm((f) => ({ ...f, firstLessonDate: nextValue || undefined }))
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
              </div>
            </section>
            {typeof form.age === 'number' && form.age > 0 && form.age < 18 && (
              <section className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {t('parentDetailsUnder18')}
                </p>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t('parentName')}</label>
                  <input
                    type="text"
                    value={form.parentName ?? ''}
                    onChange={(e) => setForm((f) => ({ ...f, parentName: e.target.value }))}
                    placeholder={t('parentNamePlaceholder')}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t('parentSurname')}</label>
                  <input
                    type="text"
                    value={form.parentSurname ?? ''}
                    onChange={(e) => setForm((f) => ({ ...f, parentSurname: e.target.value }))}
                    placeholder={t('parentSurnamePlaceholder')}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t('parentPhone')}</label>
                  <input
                    type="tel"
                    inputMode="numeric"
                    value={form.parentPhone != null && form.parentPhone !== '' ? `+${form.parentPhone}` : ''}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, parentPhone: e.target.value.replace(/\D/g, '') }))
                    }
                    placeholder={t('parentPhonePlaceholder')}
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
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t('parentPassport')}</label>
                  <input
                    type="text"
                    value={form.parentPassportInfo ?? ''}
                    onChange={(e) => setForm((f) => ({ ...f, parentPassportInfo: e.target.value }))}
                    placeholder={t('passportPlaceholder')}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
              </section>
            )}
            <section className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t('academicInfo')}</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">{t('level')}</label>
                  <SegmentedControl
                    options={levelSegmentOptions}
                    value={form.levelId ?? ''}
                    onChange={(nextValue) =>
                      setForm((f) => ({ ...f, levelId: nextValue || undefined }))
                    }
                    allowDeselect
                    aria-label={t('level')}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">{t('teacher')}</label>
                  <SingleSelectDropdown
                    id="edit-lead-teacher"
                    options={teacherOptions}
                    value={form.teacherId ?? ''}
                    onValueChange={(nextValue) =>
                      setForm((f) => ({
                        ...f,
                        teacherId: nextValue || undefined,
                        groupId: undefined,
                      }))
                    }
                  />
                  {isManager && teachers.length === 0 ? (
                    <p className="mt-1 text-xs text-slate-500">{t('noTeachersForCenter')}</p>
                  ) : null}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">{t('group')}</label>
                  <SingleSelectDropdown
                    id="edit-lead-group"
                    options={groupOptions}
                    value={form.groupId ?? ''}
                    onValueChange={(nextValue) =>
                      setForm((f) => ({ ...f, groupId: nextValue || undefined }))
                    }
                    disabled={!selectedTeacherId}
                  />
                </div>
                {isManager ? (
                  managerCenterReadonlyLabel ? (
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">{t('center')}</label>
                      <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                        {managerCenterReadonlyLabel}
                      </p>
                    </div>
                  ) : null
                ) : (
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">{t('center')}</label>
                    <SingleSelectDropdown
                      id="edit-lead-center"
                      options={centerOptions}
                      value={form.centerId ?? ''}
                      onValueChange={(nextValue) =>
                        setForm((f) => ({ ...f, centerId: nextValue || undefined }))
                      }
                    />
                  </div>
                )}
              </div>
            </section>
            <section className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">{tc('status')}</h3>
              <div className="flex items-end gap-3">
                <div className="min-w-0 flex-1">
                  <CrmStatusSelector
                    id="edit-lead-status"
                    value={form.status}
                    options={availableStatuses}
                    portaledMenuRef={crmStatusPortaledMenuRef}
                    menuPlacement="top"
                    onChange={handleCrmStatusChange}
                    disabled={lead?.status === 'PAID'}
                  />
                </div>
                <button
                  type="submit"
                  disabled={saving}
                  className={cn(
                    'inline-flex h-11 shrink-0 items-center justify-center rounded-[15px] bg-primary px-4 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50',
                  )}
                >
                  {saving ? t('saving') : tc('save')}
                </button>
              </div>
              {form.status === 'ARCHIVE' && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    {t('archiveReasonOptional')}
                  </label>
                  <input
                    type="text"
                    value={form.archivedReason ?? ''}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, archivedReason: e.target.value || undefined }))
                    }
                    placeholder={t('archiveReasonPlaceholder')}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
              )}
            </section>
                </form>
              </div>
            )}
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
      <PaidRegistrationModal
        open={paidRegistrationOpen}
        leadId={paidRegistrationOpen ? leadId : null}
        formPrefill={paidPrefill}
        onClose={() => {
          setPaidRegistrationOpen(false);
          setPaidPrefill(undefined);
        }}
        onSuccess={() => {
          setPaidRegistrationOpen(false);
          setPaidPrefill(undefined);
          void queryClient.invalidateQueries({ queryKey: ['crm-lead', leadId] });
          void queryClient.invalidateQueries({ queryKey: ['crm-leads'] });
          onSaved();
          onClose();
        }}
      />
    </>
  );
}
