'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslations } from 'next-intl';
import { useCreateGroup, type CreateGroupDto } from '@/features/groups';
import type { GroupScheduleEntry } from '../../types';
import { useCenters } from '@/features/centers';
import { useTeachers } from '@/features/teachers';
import { useState, useEffect, useMemo, useCallback, useRef, type TouchEvent } from 'react';
import { getErrorMessage } from '@/shared/lib/api';
import type { GroupIconKey } from '@ilona/types';
import { defaultMonthDateRange, scheduleSlotsValidationError } from '../../group-schedule-utils';
import { filterTeachersForCenter } from '../../lib/center-scoped-teachers';
import { DEFAULT_GROUP_LEVEL } from '../../lib/group-level-options';
import { useSheetStackZIndex } from '@/shared/lib/sheet-stack';
import { translateScheduleSlotError } from '../edit-group-form/edit-group-form.constants';
import type { CreateGroupFormData, CreateGroupFormProps } from './create-group-form.types';

export function useCreateGroupForm({ open, onOpenChange }: CreateGroupFormProps) {
  const tForm = useTranslations('groups.form');
  const tVal = useTranslations('groups.validation');
  const tCommon = useTranslations('common');

  const createGroupSchema = useMemo(
    () =>
      z
        .object({
          name: z.string().min(2, tVal('nameMin')).max(100, tVal('nameMax')),
          level: z.string().max(50, tVal('levelMax')).optional().or(z.literal('')),
          description: z.string().max(500, tVal('descriptionMax')).optional().or(z.literal('')),
          centerId: z.string().min(1, tVal('selectCenter')),
          teacherId: z.string().min(1, tForm('selectBothTeachers')),
          secondTeacherId: z.string().min(1, tForm('selectBothTeachers')),
        })
        .refine((data) => data.teacherId !== data.secondTeacherId, {
          message: tForm('teachersMustDiffer'),
          path: ['secondTeacherId'],
        }),
    [tVal, tForm],
  );

  const resolver = useMemo(() => zodResolver(createGroupSchema), [createGroupSchema]);

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
  const [dateFrom, setDateFrom] = useState(() => defaultMonthDateRange().from);
  const [dateTo, setDateTo] = useState(() => defaultMonthDateRange().to);
  const [iconKey, setIconKey] = useState<GroupIconKey | null>(null);
  const [secondTeacherStartsFirstWeek, setSecondTeacherStartsFirstWeek] = useState(false);
  const createGroup = useCreateGroup();

  const { data: centersData, isLoading: isLoadingCenters } = useCenters({
    isActive: undefined,
    take: 100,
  });
  const { data: teachersData, isLoading: isLoadingTeachers } = useTeachers({ status: 'ACTIVE' });

  const centers = useMemo(() => centersData?.items ?? [], [centersData?.items]);
  const defaultCenterId = centers[0]?.id ?? '';
  const teachers = useMemo(() => teachersData?.items ?? [], [teachersData?.items]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
    getValues,
  } = useForm<CreateGroupFormData>({
    resolver,
    defaultValues: {
      name: '',
      level: DEFAULT_GROUP_LEVEL,
      description: '',
      centerId: defaultCenterId,
      teacherId: '',
      secondTeacherId: '',
    },
  });

  const isFormBusy = isSubmitting || createGroup.isPending;
  const watchedTeacherId = watch('teacherId');
  const watchedCenterId = watch('centerId');
  const watchedSecondTeacherId = watch('secondTeacherId');
  const watchedLevel = watch('level') ?? DEFAULT_GROUP_LEVEL;

  const centerSegmentOptions = useMemo(
    () =>
      centers.map((center) => ({
        id: center.id,
        label: center.name,
      })),
    [centers],
  );

  const handleCenterChange = useCallback(
    (nextCenterId: string) => {
      const prevCenterId = watchedCenterId;
      setValue('centerId', nextCenterId, {
        shouldDirty: true,
        shouldValidate: true,
      });
      if (prevCenterId && prevCenterId !== nextCenterId) {
        setValue('teacherId', '', { shouldDirty: true, shouldValidate: true });
        setValue('secondTeacherId', '', { shouldDirty: true, shouldValidate: true });
      }
    },
    [watchedCenterId, setValue],
  );

  useEffect(() => {
    if (!open || isLoadingCenters || !defaultCenterId) return;
    if (!getValues('centerId')) {
      setValue('centerId', defaultCenterId, {
        shouldDirty: false,
        shouldValidate: true,
      });
    }
  }, [open, isLoadingCenters, defaultCenterId, getValues, setValue]);

  const hasCenterSelected = Boolean(watchedCenterId);
  const teachersForCenter = useMemo(
    () => filterTeachersForCenter(teachers, watchedCenterId),
    [teachers, watchedCenterId],
  );
  const teacherDropdownDisabled =
    isSubmitting || createGroup.isPending || isLoadingTeachers || !hasCenterSelected;
  const teacherPlaceholder = hasCenterSelected
    ? tForm('noTeacherAssigned')
    : tForm('selectCenterFirst');

  useEffect(() => {
    setIsDialogOpen(open);
  }, [open]);

  useEffect(() => {
    if (open) {
      reset({
        name: '',
        level: DEFAULT_GROUP_LEVEL,
        description: '',
        centerId: defaultCenterId,
        teacherId: '',
        secondTeacherId: '',
      });
      setSchedule([]);
      setIconKey(null);
      setSecondTeacherStartsFirstWeek(false);
      setErrorMessage(null);
      setSuccessMessage(null);
      const r = defaultMonthDateRange();
      setDateFrom(r.from);
      setDateTo(r.to);
    }
  }, [open, reset, defaultCenterId]);

  useEffect(() => {
    if (!open) {
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

  const onSubmit = async (data: CreateGroupFormData) => {
    setErrorMessage(null);

    try {
      if (data.teacherId === data.secondTeacherId) {
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

      const payload: CreateGroupDto = {
        name: data.name,
        level: data.level || undefined,
        description: data.description || undefined,
        centerId: data.centerId,
        teacherId: data.teacherId,
        secondTeacherId: data.secondTeacherId,
        secondTeacherStartsFirstWeek,
        schedule: schedule.length > 0 ? schedule : undefined,
        calendarPlan: schedule.length > 0 ? { dateFrom, dateTo } : undefined,
        ...(iconKey ? { iconKey } : {}),
      };

      await createGroup.mutateAsync(payload);

      setSuccessMessage(tForm('createdSuccess'));
      setErrorMessage(null);

      reset({
        name: '',
        level: DEFAULT_GROUP_LEVEL,
        description: '',
        centerId: defaultCenterId,
        teacherId: '',
        secondTeacherId: '',
      });
      setSchedule([]);
      const r = defaultMonthDateRange();
      setDateFrom(r.from);
      setDateTo(r.to);
      setIconKey(null);
      setSecondTeacherStartsFirstWeek(false);
      setTimeout(() => {
        onOpenChange(false);
        setSuccessMessage(null);
      }, 1500);
    } catch (error: unknown) {
      const message = getErrorMessage(error, tForm('failedCreate'));
      setErrorMessage(message);
      setSuccessMessage(null);
    }
  };

  const { overlayStyle, contentStyle } = useSheetStackZIndex(isDialogOpen);

  return {
    tForm,
    tCommon,
    isDialogOpen,
    requestClose,
    overlayStyle,
    contentStyle,
    dragStyle,
    handleDragStart,
    handleDragMove,
    handleDragEnd,
    handleSubmit,
    onSubmit,
    register,
    errors,
    isSubmitting,
    setValue,
    successMessage,
    errorMessage,
    iconKey,
    setIconKey,
    schedule,
    setSchedule,
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
    createGroup,
    centers,
    centerSegmentOptions,
    watchedCenterId,
    watchedTeacherId,
    watchedSecondTeacherId,
    watchedLevel,
    handleCenterChange,
    teachersForCenter,
    teacherPlaceholder,
    teacherDropdownDisabled,
    isLoadingCenters,
    isLoadingTeachers,
    isFormBusy,
    secondTeacherStartsFirstWeek,
    setSecondTeacherStartsFirstWeek,
  };
}
