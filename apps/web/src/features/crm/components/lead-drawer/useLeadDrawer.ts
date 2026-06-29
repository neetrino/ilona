'use client';

import { useState, useEffect, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import type { CrmLead } from '@/features/crm/types';
import { fetchLead, updateLead, addLeadComment } from '@/features/crm/api/crm.api';
import { fetchCenters } from '@/features/centers/api/centers.api';
import { fetchTeachers } from '@/features/teachers/api/teachers.api';
import { fetchGroups } from '@/features/groups/api/groups.api';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { useSheetStackZIndex } from '@/shared/lib/sheet-stack';
import { LEAD_DRAWER_LEVEL_OPTIONS } from './lead-drawer.constants';
import { buildLeadUpdatePayload } from './lead-drawer.util';
import type { LeadDrawerProps, LeadDrawerViewModel } from './lead-drawer.types';

export function useLeadDrawer({ leadId, onClose, onUpdated }: LeadDrawerProps): LeadDrawerViewModel {
  const t = useTranslations('crm');
  const isAdmin = useAuthStore((s) => s.user?.role === 'ADMIN');
  const [comment, setComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [form, setForm] = useState<Partial<CrmLead>>({});

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

  const { data: groupsData } = useQuery({
    queryKey: ['groups'],
    queryFn: () => fetchGroups({ take: 500 }),
    enabled: !!leadId,
  });

  const teachers = useMemo(() => teachersData?.items ?? [], [teachersData?.items]);
  const groups = useMemo(() => groupsData?.items ?? [], [groupsData?.items]);
  const selectedTeacherId = form.teacherId ?? '';

  const groupsForSelectedTeacher = useMemo(
    () => (selectedTeacherId ? groups.filter((group) => group.teacherId === selectedTeacherId) : []),
    [groups, selectedTeacherId],
  );

  const levelOptions = useMemo(
    () => [
      { id: '', label: '—' },
      ...LEAD_DRAWER_LEVEL_OPTIONS.map((level) => ({ id: level, label: level })),
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
      if (selectedGroupId) setForm((prev) => ({ ...prev, groupId: '' }));
      return;
    }
    if (selectedGroupId && !groupsForSelectedTeacher.some((group) => group.id === selectedGroupId)) {
      setForm((prev) => ({ ...prev, groupId: '' }));
    }
  }, [selectedTeacherId, form.groupId, groupsForSelectedTeacher]);

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
    if (!leadId) return;
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

  const { contentStyle, isBaseLayer } = useSheetStackZIndex(Boolean(leadId));

  return {
    leadId,
    lead,
    isLoading,
    isAdmin,
    form,
    comment,
    submittingComment,
    selectedTeacherId,
    levelOptions,
    centerOptions,
    teacherOptions,
    groupOptions,
    contentStyle,
    isBaseLayer,
    setComment,
    setForm,
    patchAndSave,
    handleSaveFields,
    handleAddComment,
    refetch,
    onClose,
    onUpdated,
  };
}
