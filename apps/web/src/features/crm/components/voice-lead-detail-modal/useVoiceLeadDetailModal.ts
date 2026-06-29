'use client';

import { useState, useEffect, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { useSheetStackZIndex } from '@/shared/lib/sheet-stack';
import { fetchLead, deleteLead, updateLead } from '@/features/crm/api/crm.api';
import { fetchCenters } from '@/features/centers/api/centers.api';
import { fetchTeachers } from '@/features/teachers/api/teachers.api';
import { fetchGroups } from '@/features/groups/api/groups.api';
import { VOICE_LEAD_LEVEL_OPTIONS } from './voice-lead-detail-modal.types';
import type { VoiceLeadDetailModalProps, VoiceLeadFormState } from './voice-lead-detail-modal.types';
import { isValidVoiceLeadPhone, voiceLeadFormFromLead } from './voice-lead-detail-modal.util';

export function useVoiceLeadDetailModal({
  leadId,
  open,
  onClose,
  onUpdated,
  centers: centersProp,
  teachers: teachersProp,
  groups: groupsProp,
}: VoiceLeadDetailModalProps) {
  const isAdmin = useAuthStore((s) => s.user?.role === 'ADMIN');
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [form, setForm] = useState<VoiceLeadFormState>({});
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const t = useTranslations('crm');

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

  const centers = useMemo(
    () => centersProp ?? centersData?.items ?? [],
    [centersProp, centersData?.items],
  );
  const teachers = useMemo(
    () => teachersProp ?? teachersData?.items ?? [],
    [teachersProp, teachersData?.items],
  );
  const groups = useMemo(() => groupsProp ?? groupsData?.items ?? [], [groupsProp, groupsData?.items]);
  const selectedTeacherId = form.teacherId ?? '';
  const groupsForSelectedTeacher = useMemo(
    () => (selectedTeacherId ? groups.filter((group) => group.teacherId === selectedTeacherId) : []),
    [groups, selectedTeacherId],
  );
  const levelOptions = useMemo(
    () => [
      { id: '', label: '—' },
      ...VOICE_LEAD_LEVEL_OPTIONS.map((level) => ({ id: level, label: level })),
    ],
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
      { id: '', label: selectedTeacherId ? '—' : t('selectTeacherFirst') },
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

  useEffect(() => {
    if (lead) {
      setForm(voiceLeadFormFromLead(lead));
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

  const handleDeleteClick = () => {
    setDeleteError(null);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!leadId) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteLead(leadId);
      setIsDeleteDialogOpen(false);
      onUpdated();
      onClose();
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : t('failedDeleteLead'));
    } finally {
      setDeleting(false);
    }
  };

  const handleSaveLead = async () => {
    if (!leadId) return;
    setPhoneError(null);
    setSaveError(null);
    const phone =
      typeof form.phone === 'string'
        ? form.phone.trim()
        : form.phone == null
          ? ''
          : String(form.phone).trim();
    if (phone && !isValidVoiceLeadPhone(phone)) {
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
      setSaveError(e instanceof Error ? e.message : t('failedUpdateLead'));
    } finally {
      setSaving(false);
    }
  };

  const handleCancelLead = () => {
    if (lead) {
      setForm(voiceLeadFormFromLead(lead));
    }
    setPhoneError(null);
    setSaveError(null);
  };

  const { contentStyle, isBaseLayer } = useSheetStackZIndex(open);

  return {
    leadId,
    open,
    onClose,
    onUpdated,
    isAdmin,
    deleting,
    saving,
    saveError,
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    deleteError,
    setDeleteError,
    form,
    setForm,
    phoneError,
    setPhoneError,
    lead,
    isLoading,
    refetch,
    selectedTeacherId,
    levelOptions,
    teacherOptions,
    groupOptions,
    centerOptions,
    handleDeleteClick,
    handleDeleteConfirm,
    handleSaveLead,
    handleCancelLead,
    contentStyle,
    isBaseLayer,
  };
}
