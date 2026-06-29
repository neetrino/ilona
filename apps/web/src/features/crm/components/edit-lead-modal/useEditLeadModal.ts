'use client';

import { useState, useEffect, useMemo, useRef, useCallback, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchLead, updateLead, changeLeadStatus } from '@/features/crm/api/crm.api';
import type { CrmLeadStatus, UpdateLeadDto } from '@/features/crm/types';
import { CRM_COLUMN_ORDER } from '@/features/crm/types';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { usePortalSheetDrag } from '@/shared/hooks/usePortalSheetDrag';
import { resolveAgeFromDobAndManual } from '@/features/students/student-account-form.age';
import { DEFAULT_LEVEL_ID, LEVEL_OPTIONS } from './edit-lead-modal.constants';
import type { EditLeadFormState, EditLeadModalProps } from './edit-lead-modal.types';

export function useEditLeadModal({
  open,
  leadId,
  onClose,
  onSaved,
  centers,
  teachers,
  groups,
  availableStatuses = CRM_COLUMN_ORDER,
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
  const [form, setForm] = useState<EditLeadFormState>({});
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
  const effectiveAge = useMemo(
    () => resolveAgeFromDobAndManual(form.dateOfBirth, form.age),
    [form.age, form.dateOfBirth],
  );

  useEffect(() => {
    if (!open || !leadId) return;
    if (!lead || lead.id !== leadId) {
      setForm({});
      return;
    }
    const dob = lead.dateOfBirth ? lead.dateOfBirth.slice(0, 10) : undefined;
    setForm({
      firstName: lead.firstName ?? '',
      lastName: lead.lastName ?? '',
      phone: (lead.phone ?? '').replace(/\D/g, ''),
      age: resolveAgeFromDobAndManual(dob, lead.age ?? undefined),
      dateOfBirth: dob,
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
        age: effectiveAge,
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

  const handleSubmit = async (e: FormEvent) => {
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
      const resolvedAge = resolveAgeFromDobAndManual(form.dateOfBirth, form.age);
      await updateLead(leadId, {
        ...updatePayload,
        age: resolvedAge,
      });
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

  const closePaidRegistration = () => {
    setPaidRegistrationOpen(false);
    setPaidPrefill(undefined);
  };

  const handlePaidRegistrationSuccess = () => {
    setPaidRegistrationOpen(false);
    setPaidPrefill(undefined);
    void queryClient.invalidateQueries({ queryKey: ['crm-lead', leadId] });
    void queryClient.invalidateQueries({ queryKey: ['crm-leads'] });
    onSaved();
    onClose();
  };

  return {
    t,
    tc,
    isDialogOpen,
    requestClose,
    dragStyle,
    dragHandleProps,
    isLoading,
    lead,
    form,
    setForm,
    saving,
    error,
    availableStatuses,
    crmStatusPortaledMenuRef,
    voiceAttachments,
    effectiveAge,
    levelSegmentOptions,
    teacherOptions,
    groupOptions,
    centerOptions,
    selectedTeacherId,
    isManager,
    managerCenterReadonlyLabel,
    teachers,
    handleCrmStatusChange,
    handleSubmit,
    paidRegistrationOpen,
    paidPrefill,
    leadId,
    closePaidRegistration,
    handlePaidRegistrationSuccess,
  };
}
