'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import {
  useUpdateGroup,
  useGroup,
  type UpdateGroupDto,
  type GroupScheduleEntry,
} from '@/features/groups';
import { useCenters } from '@/features/centers';
import { useTeachers } from '@/features/teachers';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { getErrorMessage } from '@/shared/lib/api';
import { isGroupIconKey, type GroupIconKey } from '@ilona/types';
import { filterTeachersForCenter } from '../../lib/center-scoped-teachers';
import {
  defaultMonthDateRange,
  normalizeGroupSchedulePayload,
} from '../../group-schedule-utils';
import { validateGroupCalendarSchedule } from '../../lib/validate-group-calendar-schedule';
import { useSheetStackZIndex } from '@/shared/lib/sheet-stack';
import { usePortalSheetDrag } from '@/shared/hooks/usePortalSheetDrag';
import { buildEditGroupPayload } from './edit-group-form-payload';
import { createUpdateGroupFormSchema } from './edit-group-form-schema';
import type { EditGroupFormProps, UpdateGroupFormData } from './edit-group-form.types';

export function useEditGroupForm({
  open,
  onOpenChange,
  groupId,
  onToggleActive,
  isStatusTogglePending = false,
}: EditGroupFormProps) {
  const tForm = useTranslations('groups.form');
  const tGroups = useTranslations('groups');
  const tVal = useTranslations('groups.validation');
  const tCommon = useTranslations('common');

  const updateGroupSchema = useMemo(
    () => createUpdateGroupFormSchema(tVal, tForm),
    [tVal, tForm],
  );

  const resolver = useMemo(() => zodResolver(updateGroupSchema), [updateGroupSchema]);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(open);
  const [iconKey, setIconKey] = useState<GroupIconKey | null>(null);
  const [schedule, setSchedule] = useState<GroupScheduleEntry[]>([]);
  const [dateFrom, setDateFrom] = useState(() => defaultMonthDateRange().from);
  const [dateTo, setDateTo] = useState(() => defaultMonthDateRange().to);
  const [scheduleSectionError, setScheduleSectionError] = useState<string | null>(null);
  const updateGroup = useUpdateGroup();
  const { data: group, isLoading } = useGroup(groupId, open);

  const { data: centersData, isLoading: isLoadingCenters } = useCenters({
    isActive: undefined,
    take: 100,
  });
  const { data: teachersData, isLoading: isLoadingTeachers } = useTeachers({ status: 'ACTIVE' });

  const centers = centersData?.items || [];
  const teachers = useMemo(() => teachersData?.items ?? [], [teachersData?.items]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
    setValue,
  } = useForm<UpdateGroupFormData>({
    resolver,
    defaultValues: {
      name: '',
      level: '',
      description: '',
      centerId: '',
      teacherId: '',
      secondTeacherId: '',
    },
  });

  const isGroupActive = group?.isActive ?? true;
  const isFormBusy = isSubmitting || updateGroup.isPending || isStatusTogglePending;
  const watchedTeacherId = watch('teacherId');
  const watchedCenterId = watch('centerId');
  const watchedSecondTeacherId = watch('secondTeacherId');

  const teachersForCenter = useMemo(
    () => filterTeachersForCenter(teachers, watchedCenterId),
    [teachers, watchedCenterId],
  );
  const teacherDropdownDisabled =
    isSubmitting || updateGroup.isPending || isLoadingTeachers || !watchedCenterId;
  const teacherPlaceholder = watchedCenterId
    ? tForm('noTeacherAssigned')
    : tForm('selectCenterFirst');

  const hadCalendar = useMemo(() => {
    if (!group) return false;
    return Boolean(normalizeGroupSchedulePayload(group.schedule).calendar);
  }, [group]);

  const handleScheduleChange = useCallback((next: GroupScheduleEntry[]) => {
    setSchedule(next);
    setScheduleSectionError(null);
  }, []);

  const handleDateFromChange = useCallback((next: string) => {
    setDateFrom(next);
    setScheduleSectionError(null);
  }, []);

  const handleDateToChange = useCallback((next: string) => {
    setDateTo(next);
    setScheduleSectionError(null);
  }, []);

  useEffect(() => {
    if (!group) return;
    const { weeklySlots, calendar } = normalizeGroupSchedulePayload(group.schedule);
    const range = defaultMonthDateRange();
    reset({
      name: group.name,
      level: group.level || '',
      description: group.description || '',
      centerId: group.centerId,
      teacherId: group.teacherId || '',
      secondTeacherId: group.secondTeacherId || '',
    });
    setIconKey(isGroupIconKey(group.iconKey) ? group.iconKey : null);
    setSchedule(weeklySlots);
    setDateFrom(calendar?.dateFrom ?? range.from);
    setDateTo(calendar?.dateTo ?? range.to);
  }, [group, reset]);

  useEffect(() => {
    setIsDialogOpen(open);
  }, [open]);

  useEffect(() => {
    if (!open) {
      setErrorMessage(null);
      setSuccessMessage(null);
      setScheduleSectionError(null);
    }
  }, [open]);

  const { overlayStyle, contentStyle, isBaseLayer } = useSheetStackZIndex(isDialogOpen);

  const requestClose = useCallback(() => {
    setIsDialogOpen(false);
    onOpenChange(false);
  }, [onOpenChange]);

  const { dragStyle, dragHandleProps, scrollContentProps, resetDrag } = usePortalSheetDrag({
    enabled: isDialogOpen,
    onClose: requestClose,
  });

  useEffect(() => {
    if (!isDialogOpen) resetDrag();
  }, [isDialogOpen, resetDrag]);

  const finishSuccess = useCallback(() => {
    setSuccessMessage(tForm('updatedSuccess'));
    setErrorMessage(null);
    setTimeout(() => {
      onOpenChange(false);
      setSuccessMessage(null);
    }, 1500);
  }, [tForm, onOpenChange]);

  const submitPayload = useCallback(
    async (payload: UpdateGroupDto) => {
      try {
        await updateGroup.mutateAsync({ id: groupId, data: payload });
        finishSuccess();
      } catch (error: unknown) {
        setErrorMessage(getErrorMessage(error, tForm('failedUpdate')));
        setSuccessMessage(null);
      }
    },
    [updateGroup, groupId, finishSuccess, tForm],
  );

  const onSubmit = async (data: UpdateGroupFormData) => {
    setErrorMessage(null);

    if (
      data.secondTeacherId?.trim() &&
      data.teacherId &&
      data.teacherId === data.secondTeacherId
    ) {
      setErrorMessage(tForm('teachersMustDiffer'));
      return;
    }

    const calendarError = validateGroupCalendarSchedule({
      schedule,
      dateFrom,
      dateTo,
      requireSlots: true,
      tForm,
      tVal,
    });
    if (calendarError) {
      setScheduleSectionError(calendarError);
      return;
    }
    setScheduleSectionError(null);

    await submitPayload(
      buildEditGroupPayload({
        data,
        iconKey,
        schedule,
        dateFrom,
        dateTo,
        hadCalendar,
      }),
    );
  };

  return {
    tForm,
    tGroups,
    tCommon,
    errorMessage,
    successMessage,
    isDialogOpen,
    iconKey,
    setIconKey,
    updateGroup,
    isLoading,
    centers,
    register,
    handleSubmit,
    errors,
    isSubmitting,
    setValue,
    isGroupActive,
    isFormBusy,
    watchedTeacherId,
    watchedCenterId,
    watchedSecondTeacherId,
    teachersForCenter,
    teacherDropdownDisabled,
    teacherPlaceholder,
    isLoadingCenters,
    isLoadingTeachers,
    overlayStyle,
    contentStyle,
    isBaseLayer,
    requestClose,
    dragHandleProps,
    scrollContentProps,
    dragStyle,
    onSubmit,
    onToggleActive,
    schedule,
    setSchedule: handleScheduleChange,
    dateFrom,
    dateTo,
    setDateFrom: handleDateFromChange,
    setDateTo: handleDateToChange,
    scheduleSectionError,
  };
}
