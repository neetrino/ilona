'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslations } from 'next-intl';
import { useUpdateGroup, useGroup, type UpdateGroupDto } from '@/features/groups';
import type { GroupScheduleEntry } from '../../types';
import { useCenters } from '@/features/centers';
import { useTeachers } from '@/features/teachers';
import { useState, useEffect, useMemo, useCallback, useRef, type TouchEvent } from 'react';
import { ApiError, getErrorMessage } from '@/shared/lib/api';
import { isGroupIconKey, type GroupIconKey } from '@ilona/types';
import {
  defaultMonthDateRange,
  normalizeGroupSchedulePayload,
  scheduleSlotsValidationError,
} from '../../group-schedule-utils';
import { filterTeachersForCenter, teacherOptionLabel } from '../../lib/center-scoped-teachers';
import { translateScheduleSlotError, REGENERATE_CONFIRM_MESSAGE } from './edit-group-form.constants';
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
    () =>
      z
        .object({
          name: z.string().min(2, tVal('nameMin')).max(100, tVal('nameMax')).optional(),
          level: z.string().max(50, tVal('levelMax')).optional().or(z.literal('')),
          description: z.string().max(500, tVal('descriptionMax')).optional().or(z.literal('')),
          centerId: z.string().min(1, tVal('centerRequired')).optional().or(z.literal('')),
          teacherId: z.string().min(1, tForm('selectBothTeachers')),
          secondTeacherId: z.string().min(1, tForm('selectBothTeachers')),
        })
        .refine((data) => data.teacherId !== data.secondTeacherId, {
          message: tForm('teachersMustDiffer'),
          path: ['secondTeacherId'],
        }),
    [tVal, tForm],
  );

  const resolver = useMemo(() => zodResolver(updateGroupSchema), [updateGroupSchema]);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(open);
  const [dragOffsetY, setDragOffsetY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isSettling, setIsSettling] = useState(false);
  const touchStartYRef = useRef<number | null>(null);
  const touchStartXRef = useRef<number | null>(null);
  const settleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [schedule, setSchedule] = useState<GroupScheduleEntry[]>([]);
  const [hadCalendarOnLoad, setHadCalendarOnLoad] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [regenerateDialogOpen, setRegenerateDialogOpen] = useState(false);
  const [secondTeacherStartsFirstWeek, setSecondTeacherStartsFirstWeek] = useState(false);
  const [iconKey, setIconKey] = useState<GroupIconKey | null>(null);
  const updateGroup = useUpdateGroup();
  const { data: group, isLoading } = useGroup(groupId, open);

  // Fetch centers and teachers for dropdowns
  const { data: centersData, isLoading: isLoadingCenters } = useCenters({ 
    isActive: undefined, // Get all centers (active and inactive)
    take: 100, // API max is 100, ensures we get all centers
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
    getValues,
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

  const hasCenterSelected = Boolean(watchedCenterId);
  const teachersForCenter = useMemo(
    () =>
      filterTeachersForCenter(teachers, watchedCenterId, [
        watchedTeacherId ?? '',
        watchedSecondTeacherId ?? '',
      ]),
    [teachers, watchedCenterId, watchedTeacherId, watchedSecondTeacherId],
  );
  const teacherDropdownDisabled =
    isSubmitting || updateGroup.isPending || isLoadingTeachers || !hasCenterSelected;
  const teacherPlaceholder = hasCenterSelected ? tForm('noTeacherAssigned') : tForm('selectCenterFirst');

  // Update form when group data loads
  useEffect(() => {
    if (group) {
      reset({
        name: group.name,
        level: group.level || '',
        description: group.description || '',
        centerId: group.centerId,
        teacherId: group.teacherId || '',
        secondTeacherId: group.secondTeacherId || '',
      });
      const normalized = normalizeGroupSchedulePayload(group.schedule);
      setSchedule(normalized.weeklySlots);
      setHadCalendarOnLoad(!!normalized.calendar);
      if (normalized.calendar) {
        setDateFrom(normalized.calendar.dateFrom);
        setDateTo(normalized.calendar.dateTo);
      } else {
        const r = defaultMonthDateRange();
        setDateFrom(r.from);
        setDateTo(r.to);
      }
      setIconKey(isGroupIconKey(group.iconKey) ? group.iconKey : null);
      setSecondTeacherStartsFirstWeek(group.secondTeacherStartsFirstWeek ?? false);
    }
  }, [group, reset]);

  // Reset form when dialog closes
  useEffect(() => {
    setIsDialogOpen(open);
  }, [open]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setErrorMessage(null);
      setSuccessMessage(null);
      setDragOffsetY(0);
      setIsDragging(false);
      setIsSettling(false);
    }
  }, [open]);

  useEffect(() => {
    return () => {
      if (settleTimerRef.current) {
        clearTimeout(settleTimerRef.current);
      }
    };
  }, []);

  const { overlayStyle, contentStyle, isBaseLayer } = useSheetStackZIndex(isDialogOpen);

  const requestClose = useCallback(() => {
    setIsDialogOpen(false);
    onOpenChange(false);
  }, [onOpenChange]);

  const isMobileViewport = () =>
    typeof window !== 'undefined' && window.matchMedia('(max-width: 1366px)').matches;

  const resetDragRefs = () => {
    touchStartYRef.current = null;
    touchStartXRef.current = null;
    setIsDragging(false);
  };

  const handleDragStart = (event: TouchEvent<HTMLDivElement>) => {
    if (!isMobileViewport()) return;
    const firstTouch = event.touches[0];
    if (!firstTouch) return;
    if (settleTimerRef.current) {
      clearTimeout(settleTimerRef.current);
      settleTimerRef.current = null;
    }
    touchStartYRef.current = firstTouch.clientY;
    touchStartXRef.current = firstTouch.clientX;
    setIsSettling(false);
    setIsDragging(true);
  };

  const handleDragMove = (event: TouchEvent<HTMLDivElement>) => {
    if (!isMobileViewport()) return;
    if (!isDragging || touchStartYRef.current === null || touchStartXRef.current === null) return;
    const firstTouch = event.touches[0];
    if (!firstTouch) return;
    const deltaY = firstTouch.clientY - touchStartYRef.current;
    const deltaX = Math.abs(firstTouch.clientX - touchStartXRef.current);
    if (deltaY <= 0 || deltaY <= deltaX) return;
    event.preventDefault();
    setDragOffsetY(Math.min(deltaY * 0.95, 340));
  };

  const handleDragEnd = () => {
    if (!isMobileViewport()) return;
    if (!isDragging) return;
    const shouldClose = dragOffsetY > 110;
    resetDragRefs();
    if (shouldClose) {
      setDragOffsetY(0);
      requestClose();
      return;
    }
    setIsSettling(true);
    setDragOffsetY(0);
    settleTimerRef.current = setTimeout(() => {
      setIsSettling(false);
      settleTimerRef.current = null;
    }, 280);
  };

  const dragStyle =
    dragOffsetY > 0 || isSettling
      ? {
          transform: `translateY(${dragOffsetY}px)`,
          transition: isDragging ? 'none' : 'transform 280ms cubic-bezier(0.22, 1, 0.36, 1)',
        }
      : undefined;

  const buildPayload = (
    data: UpdateGroupFormData,
    confirmReplaceGeneratedLessons: boolean,
  ): UpdateGroupDto => {
    let calendarPlan: UpdateGroupDto['calendarPlan'];
    if (schedule.length > 0) {
      calendarPlan = {
        dateFrom,
        dateTo,
      };
    } else if (hadCalendarOnLoad) {
      calendarPlan = null;
    } else {
      calendarPlan = undefined;
    }

    return {
      name: data.name,
      level: data.level || undefined,
      description: data.description || undefined,
      centerId: data.centerId && data.centerId.trim() !== '' ? data.centerId : undefined,
      teacherId: data.teacherId || undefined,
      secondTeacherId: data.secondTeacherId ? data.secondTeacherId : null,
      secondTeacherStartsFirstWeek,
      schedule: schedule.length > 0 ? schedule : null,
      calendarPlan,
      ...(confirmReplaceGeneratedLessons ? { confirmReplaceGeneratedLessons: true } : {}),
      iconKey,
    };
  };

  const persistGroup = async (data: UpdateGroupFormData, confirmReplace: boolean) => {
    if (data.teacherId && data.secondTeacherId && data.teacherId === data.secondTeacherId) {
      setErrorMessage(tForm('teachersMustDiffer'));
      return;
    }

    if (schedule.length > 0) {
      if (!data.teacherId?.trim() || !data.secondTeacherId?.trim()) {
        setErrorMessage(tForm('selectBothTeachersForCalendar'));
        return;
      }
      const slotErr = translateScheduleSlotError(scheduleSlotsValidationError(schedule), tVal);
      if (slotErr) {
        setErrorMessage(slotErr);
        return;
      }
      if (!dateFrom || !dateTo) {
        setErrorMessage(tForm('chooseCalendarDateRange'));
        return;
      }
      if (dateTo < dateFrom) {
        setErrorMessage(tForm('endDateOnOrAfterStart'));
        return;
      }
    }

    const payload = buildPayload(data, confirmReplace);
    await updateGroup.mutateAsync({ id: groupId, data: payload });
    setSuccessMessage(tForm('updatedSuccess'));
    setErrorMessage(null);
    setTimeout(() => {
      onOpenChange(false);
      setSuccessMessage(null);
    }, 1500);
  };

  const onSubmit = async (data: UpdateGroupFormData) => {
    setErrorMessage(null);
    try {
      await persistGroup(data, false);
    } catch (error: unknown) {
      if (
        error instanceof ApiError &&
        error.statusCode === 409 &&
        error.message === REGENERATE_CONFIRM_MESSAGE
      ) {
        setRegenerateDialogOpen(true);
        return;
      }
      const message = getErrorMessage(error, tForm('failedUpdate'));
      setErrorMessage(message);
      setSuccessMessage(null);
    }
  };

  const onConfirmRegenerate = async () => {
    setRegenerateDialogOpen(false);
    setErrorMessage(null);
    try {
      await persistGroup(getValues(), true);
    } catch (error: unknown) {
      const message = getErrorMessage(error, tForm('failedUpdate'));
      setErrorMessage(message);
      setSuccessMessage(null);
    }
  };
  return {
    tForm,
    tGroups,
    tVal,
    tCommon,
    updateGroupSchema,
    resolver,
    errorMessage,
    setErrorMessage,
    successMessage,
    setSuccessMessage,
    isDialogOpen,
    setIsDialogOpen,
    dragOffsetY,
    isDragging,
    isSettling,
    schedule,
    setSchedule,
    hadCalendarOnLoad,
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
    regenerateDialogOpen,
    setRegenerateDialogOpen,
    secondTeacherStartsFirstWeek,
    setSecondTeacherStartsFirstWeek,
    iconKey,
    setIconKey,
    updateGroup,
    group,
    isLoading,
    centers,
    teachers,
    register,
    handleSubmit,
    errors,
    isSubmitting,
    reset,
    watch,
    getValues,
    setValue,
    isGroupActive,
    isFormBusy,
    watchedTeacherId,
    watchedCenterId,
    watchedSecondTeacherId,
    hasCenterSelected,
    teachersForCenter,
    teacherDropdownDisabled,
    teacherPlaceholder,
    isLoadingCenters,
    isLoadingTeachers,
    overlayStyle,
    contentStyle,
    isBaseLayer,
    requestClose,
    handleDragStart,
    handleDragMove,
    handleDragEnd,
    dragStyle,
    onSubmit,
    onConfirmRegenerate,
    onToggleActive,
    isStatusTogglePending,
  };
}
