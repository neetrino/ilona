'use client';

import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import {
  useCreateRecurringLessons,
  type CreateRecurringLessonsDto,
} from '@/features/lessons';
import {
  defaultMonthDateRange,
  scheduleEndDateFromStart,
} from '@/features/groups/group-schedule-utils';
import type { GroupScheduleEntry } from '@/features/groups/types';
import { useGroups } from '@/features/groups';
import { getGroupTeachersForDisplay } from '@/features/groups';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { getErrorMessage } from '@/shared/lib/api';
import { useSheetStackZIndex } from '@/shared/lib/sheet-stack';
import { usePortalSheetDrag } from '@/shared/hooks/usePortalSheetDrag';
import {
  createAddLessonFormSchema,
  type AddLessonFormData,
  type AddLessonFormProps,
} from './add-lesson-form.types';
import {
  getGroupTeacherId,
  groupSlotsForRecurring,
  validateAddLessonSchedule,
} from './add-lesson-form.util';

export function useAddLessonForm({ open, onOpenChange, defaultDate }: AddLessonFormProps) {
  const tForm = useTranslations('lessons.form');
  const tVal = useTranslations('lessons.validation');
  const tGroupsForm = useTranslations('groups.form');
  const tGroupsVal = useTranslations('groups.validation');

  const addLessonFormSchema = useMemo(() => createAddLessonFormSchema(tVal), [tVal]);
  const resolver = useMemo(() => zodResolver(addLessonFormSchema), [addLessonFormSchema]);

  const getDefaultDateRange = useCallback(() => {
    if (defaultDate) {
      return { from: defaultDate, to: scheduleEndDateFromStart(defaultDate) };
    }
    return defaultMonthDateRange();
  }, [defaultDate]);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(open);
  const [schedule, setSchedule] = useState<GroupScheduleEntry[]>([]);
  const [dateFrom, setDateFrom] = useState(() => getDefaultDateRange().from);
  const [dateTo, setDateTo] = useState(() => getDefaultDateRange().to);
  const createRecurring = useCreateRecurringLessons();

  const { data: groupsData, isLoading: isLoadingGroups } = useGroups(
    { take: 100, isActive: true },
    open,
  );
  const groups = useMemo(() => groupsData?.items ?? [], [groupsData?.items]);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
  } = useForm<AddLessonFormData>({
    resolver,
    defaultValues: {
      groupId: '',
      teacherId: '',
    },
  });

  const teacherIdW = useWatch({ control, name: 'teacherId' });
  const groupIdW = useWatch({ control, name: 'groupId' });

  const selectedGroup = useMemo(
    () => groups.find((group) => group.id === groupIdW) ?? null,
    [groups, groupIdW],
  );

  const selectedGroupTeachers = useMemo(
    () => (selectedGroup ? getGroupTeachersForDisplay(selectedGroup) : []),
    [selectedGroup],
  );

  const handleGroupChange = useCallback(
    (nextValue: string | null) => {
      const groupId = nextValue ?? '';
      const group = groups.find((item) => item.id === groupId) ?? null;
      const teacherId = group ? getGroupTeacherId(group) ?? '' : '';

      setValue('groupId', groupId, {
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true,
      });
      setValue('teacherId', teacherId, {
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true,
      });
    },
    [groups, setValue],
  );

  useEffect(() => {
    setIsDialogOpen(open);
  }, [open]);

  useEffect(() => {
    if (open) {
      const range = getDefaultDateRange();
      reset({
        groupId: '',
        teacherId: '',
      });
      setSchedule([]);
      setDateFrom(range.from);
      setDateTo(range.to);
      setErrorMessage(null);
      setSuccessMessage(null);
    }
  }, [open, reset, getDefaultDateRange]);

  const requestClose = useCallback(() => {
    setIsDialogOpen(false);
    onOpenChange(false);
  }, [onOpenChange]);

  const { dragStyle, dragHandleProps, scrollContentProps, resetDrag } = usePortalSheetDrag({
    enabled: isDialogOpen,
    onClose: requestClose,
  });

  useEffect(() => {
    if (!isDialogOpen) {
      resetDrag();
    }
  }, [isDialogOpen, resetDrag]);

  const validateSchedule = () =>
    validateAddLessonSchedule({
      schedule,
      dateFrom,
      dateTo,
      tVal,
      tGroupsForm,
      tGroupsVal,
    });

  const onSubmit = async (data: AddLessonFormData) => {
    const scheduleError = validateSchedule();
    if (scheduleError) {
      setErrorMessage(scheduleError);
      setSuccessMessage(null);
      return;
    }

    try {
      setErrorMessage(null);
      setSuccessMessage(null);

      const grouped = groupSlotsForRecurring(schedule);
      let totalCreated = 0;
      let totalSkipped = 0;

      for (const slot of grouped) {
        const recurringData: CreateRecurringLessonsDto = {
          groupId: data.groupId,
          teacherId: data.teacherId,
          weekdays: slot.weekdays.sort((a, b) => a - b),
          startTime: slot.startTime,
          endTime: slot.endTime,
          startDate: dateFrom,
          endDate: dateTo,
        };
        const res = await createRecurring.mutateAsync(recurringData);
        totalCreated += res.items.length;
        totalSkipped += res.skippedDuplicateCount;
      }

      let msg = tForm('createdLessons', { count: totalCreated });
      if (totalSkipped > 0) {
        msg += tForm('skippedDuplicates', { count: totalSkipped });
      }
      setSuccessMessage(msg);

      setTimeout(() => {
        requestClose();
      }, 1500);
    } catch (err: unknown) {
      setErrorMessage(getErrorMessage(err, tVal('failedToCreate')));
      setSuccessMessage(null);
    }
  };

  const isBusy = isSubmitting || createRecurring.isPending;
  const hasGroup = groupIdW.length > 0;
  const hasTeacher = teacherIdW.length > 0;
  const selectedGroupHasNoTeacher = hasGroup && selectedGroupTeachers.length === 0;
  const noGroupsAvailable = !isLoadingGroups && groups.length === 0;
  const scheduleValid = validateSchedule() === null;

  const { overlayStyle, contentStyle } = useSheetStackZIndex(isDialogOpen);

  return {
    tForm,
    isDialogOpen,
    requestClose,
    overlayStyle,
    contentStyle,
    dragStyle,
    dragHandleProps,
    scrollContentProps,
    handleSubmit,
    onSubmit,
    errorMessage,
    successMessage,
    register,
    errors,
    isBusy,
    groupIdW,
    teacherIdW,
    groups,
    isLoadingGroups,
    handleGroupChange,
    selectedGroupTeachers,
    hasGroup,
    hasTeacher,
    selectedGroupHasNoTeacher,
    noGroupsAvailable,
    scheduleValid,
    schedule,
    setSchedule,
    dateFrom,
    dateTo,
    setDateFrom,
    setDateTo,
    isSubmitting,
    createRecurring,
  };
}
