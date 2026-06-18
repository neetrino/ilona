'use client';

import * as DialogPrimitive from '@radix-ui/react-dialog';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Button,
  Input,
  Label,
} from '@/shared/components/ui';
import { SingleSelectDropdown } from '@/shared/components/ui/single-select-dropdown';
import { useCreateLesson, useCreateRecurringLessons, type CreateLessonDto, type CreateRecurringLessonsDto } from '@/features/lessons';
import { useGroups } from '@/features/groups';
import { useTeachers } from '@/features/teachers';
import { useState, useEffect, useCallback, useMemo, useRef, type TouchEvent } from 'react';
import { useTranslations } from 'next-intl';
import { getErrorMessage } from '@/shared/lib/api';
import { cn } from '@/shared/lib/utils';
import { X } from 'lucide-react';

const TIME_RE = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;

type ScheduleMode = 'single' | 'recurring';

type AddLessonFormData = {
  scheduleMode: ScheduleMode;
  groupId: string;
  teacherId: string;
  scheduledAt?: string;
  duration?: number;
  startDate?: string;
  endDate?: string;
  weekdays?: number[];
  startTime?: string;
  endTime?: string;
  description?: string;
};

function createAddLessonFormSchema(tVal: (key: string) => string) {
  return z
    .object({
      scheduleMode: z.enum(['single', 'recurring']),
      groupId: z.string().min(1, tVal('selectGroup')),
      teacherId: z.string().min(1, tVal('selectTeacher')),
      scheduledAt: z.string().optional(),
      duration: z
        .number()
        .int(tVal('durationInt'))
        .min(15, tVal('durationMin'))
        .max(240, tVal('durationMax'))
        .optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      weekdays: z.array(z.number().int().min(0).max(6)).optional(),
      startTime: z.string().optional(),
      endTime: z.string().optional(),
      description: z.string().max(1000, tVal('descriptionMax')).optional().or(z.literal('')),
    })
    .superRefine((data, ctx) => {
      if (data.scheduleMode === 'single') {
        if (!data.scheduledAt || data.scheduledAt.length < 1) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['scheduledAt'], message: tVal('scheduledAtRequired') });
        }
      } else {
        if (!data.startDate) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['startDate'], message: tVal('startDateRequired') });
        }
        if (!data.endDate) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['endDate'], message: tVal('endDateRequired') });
        }
        if (data.startDate && data.endDate) {
          const a = new Date(data.startDate);
          const b = new Date(data.endDate);
          if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['endDate'], message: tVal('invalidDate') });
          } else if (b < a) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['endDate'], message: tVal('endDateAfterStart') });
          }
        }
        const wd = data.weekdays ?? [];
        if (wd.length < 1) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['weekdays'], message: tVal('weekdaysRequired') });
        }
        if (data.startTime) {
          if (!TIME_RE.test(data.startTime)) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['startTime'], message: tVal('startTimeInvalid') });
          }
        } else {
          ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['startTime'], message: tVal('startTimeRequired') });
        }
        if (data.endTime) {
          if (!TIME_RE.test(data.endTime)) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['endTime'], message: tVal('endTimeInvalid') });
          }
        } else {
          ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['endTime'], message: tVal('endTimeRequired') });
        }
        if (data.startTime && data.endTime && TIME_RE.test(data.startTime) && TIME_RE.test(data.endTime)) {
          const [sH, sM] = data.startTime.split(':').map(Number);
          const [eH, eM] = data.endTime.split(':').map(Number);
          if (eH * 60 + eM <= sH * 60 + sM) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['endTime'], message: tVal('endTimeAfterStart') });
          }
        }
      }
    });
}

interface AddLessonFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultDate?: string;
  defaultTime?: string;
}

function countSlotsInRange(
  startDateStr: string,
  endDateStr: string,
  weekdays: number[],
  timeStr: string
): number {
  if (!startDateStr || !endDateStr || !TIME_RE.test(timeStr) || weekdays.length === 0) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  const endWith = new Date(endDateStr);
  endWith.setHours(23, 59, 59, 999);
  const cur = new Date(startDateStr);
  cur.setHours(0, 0, 0, 0);
  const startRef = new Date(startDateStr);
  let n = 0;
  while (cur <= endWith) {
    if (weekdays.includes(cur.getDay())) {
      const slot = new Date(cur);
      slot.setHours(h, m, 0, 0);
      if (slot >= startRef && slot <= endWith) n += 1;
    }
    cur.setDate(cur.getDate() + 1);
  }
  return n;
}

export function AddLessonForm({ open, onOpenChange, defaultDate, defaultTime }: AddLessonFormProps) {
  const tForm = useTranslations('lessons.form');
  const tVal = useTranslations('lessons.validation');
  const tWeekdays = useTranslations('lessons.weekdays');
  const tCommon = useTranslations('common');
  const tCalendar = useTranslations('calendar');

  const addLessonFormSchema = useMemo(() => createAddLessonFormSchema(tVal), [tVal]);
  const resolver = useMemo(() => zodResolver(addLessonFormSchema), [addLessonFormSchema]);

  const weekdays = useMemo(
    () =>
      [
        { value: 1, label: tWeekdays('mon') },
        { value: 2, label: tWeekdays('tue') },
        { value: 3, label: tWeekdays('wed') },
        { value: 4, label: tWeekdays('thu') },
        { value: 5, label: tWeekdays('fri') },
        { value: 6, label: tWeekdays('sat') },
        { value: 0, label: tWeekdays('sun') },
      ] as const,
    [tWeekdays],
  );

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(open);
  const [dragOffsetY, setDragOffsetY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isSettling, setIsSettling] = useState(false);
  const touchStartYRef = useRef<number | null>(null);
  const touchStartXRef = useRef<number | null>(null);
  const settleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const createLesson = useCreateLesson();
  const createRecurring = useCreateRecurringLessons();

  const { data: teachersData, isLoading: isLoadingTeachers } = useTeachers({ take: 100 });

  const teachers = teachersData?.items || [];

  const getDefaultScheduledAt = useCallback(() => {
    if (defaultDate && defaultTime) {
      return `${defaultDate}T${defaultTime}`;
    }
    if (defaultDate) {
      return `${defaultDate}T10:00`;
    }
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];
    return `${dateStr}T10:00`;
  }, [defaultDate, defaultTime]);

  const getDefaultRecurring = useCallback(() => {
    const base = defaultDate ?? (() => {
      const t = new Date();
      t.setDate(t.getDate() + 1);
      return t.toISOString().split('T')[0];
    })();
    return {
      startDate: base,
      endDate: base,
      weekdays: [new Date(base + 'T12:00:00').getDay()] as number[],
      startTime: '10:00',
      endTime: '11:00',
    };
  }, [defaultDate]);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
  } = useForm<AddLessonFormData>({
    resolver,
    defaultValues: {
      scheduleMode: 'single',
      groupId: '',
      teacherId: '',
      scheduledAt: getDefaultScheduledAt(),
      duration: 60,
      startDate: '',
      endDate: '',
      weekdays: [],
      startTime: '10:00',
      endTime: '11:00',
      description: '',
    },
  });

  const scheduleMode = useWatch({ control, name: 'scheduleMode' });
  const teacherIdW = useWatch({ control, name: 'teacherId' });
  const groupIdW = useWatch({ control, name: 'groupId' });
  const startDateW = useWatch({ control, name: 'startDate' });
  const endDateW = useWatch({ control, name: 'endDate' });
  const weekdaysW = useWatch({ control, name: 'weekdays' });
  const startTimeW = useWatch({ control, name: 'startTime' });
  const endTimeW = useWatch({ control, name: 'endTime' });

  const groupsQueryEnabled = open && teacherIdW.length > 0;
  const { data: groupsData, isLoading: isLoadingGroups } = useGroups(
    { take: 100, isActive: true, ...(teacherIdW ? { teacherId: teacherIdW } : {}) },
    groupsQueryEnabled
  );
  const groups = groupsData?.items ?? [];
  const scheduledAtValue = watch('scheduledAt');
  const [datePart, timePart] = scheduledAtValue ? scheduledAtValue.split('T') : ['', ''];

  const slotPreview = useMemo(() => {
    if (scheduleMode !== 'recurring' || !startDateW || !endDateW || !weekdaysW || weekdaysW.length < 1) {
      return { slots: 0, durationMins: 0 as number | null };
    }
    if (!startTimeW || !endTimeW || !TIME_RE.test(startTimeW) || !TIME_RE.test(endTimeW)) {
      return { slots: 0, durationMins: null as number | null };
    }
    const [sH, sM] = startTimeW.split(':').map(Number);
    const [eH, eM] = endTimeW.split(':').map(Number);
    const dur = eH * 60 + eM - (sH * 60 + sM);
    if (dur <= 0) return { slots: 0, durationMins: null };
    return { slots: countSlotsInRange(startDateW, endDateW, weekdaysW, startTimeW), durationMins: dur };
  }, [scheduleMode, startDateW, endDateW, weekdaysW, startTimeW, endTimeW]);

  useEffect(() => {
    setIsDialogOpen(open);
  }, [open]);

  useEffect(() => {
    if (open) {
      const rec = getDefaultRecurring();
      reset({
        scheduleMode: 'single',
        groupId: '',
        teacherId: '',
        scheduledAt: getDefaultScheduledAt(),
        duration: 60,
        startDate: rec.startDate,
        endDate: rec.endDate,
        weekdays: rec.weekdays,
        startTime: rec.startTime,
        endTime: rec.endTime,
        description: '',
      });
      setErrorMessage(null);
      setSuccessMessage(null);
      setDragOffsetY(0);
      setIsDragging(false);
      setIsSettling(false);
    }
  }, [open, reset, defaultDate, defaultTime, getDefaultRecurring, getDefaultScheduledAt]);

  useEffect(() => {
    return () => {
      if (settleTimerRef.current) {
        clearTimeout(settleTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    setValue('groupId', '', { shouldValidate: false, shouldDirty: false, shouldTouch: false });
  }, [teacherIdW, setValue]);

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

  const onSubmit = async (data: AddLessonFormData) => {
    try {
      setErrorMessage(null);
      setSuccessMessage(null);

      if (data.scheduleMode === 'single') {
        const lessonData: CreateLessonDto = {
          groupId: data.groupId,
          teacherId: data.teacherId,
          scheduledAt: new Date(data.scheduledAt as string).toISOString(),
          duration: data.duration,
          description: data.description || undefined,
        };
        await createLesson.mutateAsync(lessonData);
        setSuccessMessage(tForm('lessonCreatedSuccess'));
      } else {
        const recurringData: CreateRecurringLessonsDto = {
          groupId: data.groupId,
          teacherId: data.teacherId,
          weekdays: (data.weekdays ?? []).sort((a, b) => a - b),
          startTime: data.startTime as string,
          endTime: data.endTime as string,
          startDate: data.startDate as string,
          endDate: data.endDate as string,
          description: data.description || undefined,
        };
        const res = await createRecurring.mutateAsync(recurringData);
        const n = res.items.length;
        const s = res.skippedDuplicateCount;
        let msg = tForm('createdLessons', { count: n });
        if (s > 0) {
          msg += tForm('skippedDuplicates', { count: s });
        }
        setSuccessMessage(msg);
      }

      setTimeout(() => {
        requestClose();
      }, 1500);
    } catch (err: unknown) {
      setErrorMessage(getErrorMessage(err, tVal('failedToCreate')));
      setSuccessMessage(null);
    }
  };

  const onModeChange = (next: ScheduleMode) => {
    setValue('scheduleMode', next, { shouldValidate: true });
    if (next === 'recurring') {
      const r = getDefaultRecurring();
      if (!startDateW) setValue('startDate', r.startDate, { shouldValidate: false });
      if (!endDateW) setValue('endDate', r.endDate, { shouldValidate: false });
    }
  };

  const toggleWeekday = (day: number) => {
    const cur = weekdaysW ?? [];
    if (cur.includes(day)) {
      setValue('weekdays', cur.filter((d) => d !== day), { shouldValidate: true });
    } else {
      setValue('weekdays', [...cur, day], { shouldValidate: true });
    }
  };

  const isBusy = isSubmitting;
  const hasTeacher = teacherIdW.length > 0;
  const noGroupsForTeacher = hasTeacher && !isLoadingGroups && groups.length === 0;
  const groupSelectDisabled = isBusy || !hasTeacher || isLoadingGroups || noGroupsForTeacher;

  return (
    <DialogPrimitive.Root open={isDialogOpen} onOpenChange={(nextOpen) => !nextOpen && requestClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          style={dragStyle}
          className={cn(
            'fixed inset-x-0 bottom-[7px] top-auto z-50 grid w-full translate-y-0 lg:bottom-0 [@media(min-width:1024px)_and_(max-width:1366px)_and_(min-height:1000px)]:bottom-0',
            'duration-700 ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out min-[1367px]:duration-350 min-[1367px]:ease-[cubic-bezier(0.22,1,0.36,1)]',
            'data-[state=open]:slide-in-from-bottom-full data-[state=closed]:slide-out-to-bottom-full',
            'h-[calc(94dvh+7px)] [@media(min-width:1024px)_and_(max-width:1366px)_and_(min-height:1000px)]:h-[56dvh] grid-rows-[auto_1fr] gap-0 overflow-hidden rounded-t-[22px] border border-slate-200 bg-[#f8f9fb] shadow-xl',
            'min-[1367px]:inset-0 min-[1367px]:m-auto min-[1367px]:w-[95vw] min-[1367px]:max-w-2xl min-[1367px]:h-auto min-[1367px]:max-h-[90vh] min-[1367px]:translate-x-0 min-[1367px]:translate-y-0 min-[1367px]:rounded-2xl',
            'min-[1367px]:data-[state=open]:fade-in-0 min-[1367px]:data-[state=closed]:fade-out-0 min-[1367px]:data-[state=open]:slide-in-from-bottom-0 min-[1367px]:data-[state=closed]:slide-out-to-bottom-0'
          )}
          aria-describedby={undefined}
        >
          <div className="relative flex h-9 w-full items-center justify-center bg-[#f8f9fb] min-[1367px]:hidden">
            <div
              className="absolute inset-x-0 -top-2 h-14"
              onTouchStart={handleDragStart}
              onTouchMove={handleDragMove}
              onTouchEnd={handleDragEnd}
              onTouchCancel={handleDragEnd}
            />
            <div className="h-1.5 w-14 rounded-full bg-slate-400" />
          </div>
          <DialogPrimitive.Title className="sr-only">{tForm('addTitle')}</DialogPrimitive.Title>
          <DialogPrimitive.Close
            className="absolute right-4 top-4 hidden h-8 w-8 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 min-[1367px]:inline-flex"
            aria-label={tCommon('close')}
          >
            <X className="h-4 w-4" />
          </DialogPrimitive.Close>

          <div className="min-h-0 overflow-y-auto overscroll-y-contain [touch-action:pan-y] [-webkit-overflow-scrolling:touch] px-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] pt-4 min-[1367px]:p-6">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-[#3b3b40]">{tForm('addTitle')}</h2>
              <p className="mt-1 text-sm text-[#8b8b90]">{tForm('addDescription')}</p>
            </div>

            <form
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-4"
            >
          {successMessage && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-600">{successMessage}</p>
            </div>
          )}
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{errorMessage}</p>
            </div>
          )}

          <div className="space-y-2">
            <Label>{tForm('schedule')}</Label>
            <div className="grid grid-cols-2 gap-2 rounded-lg border border-slate-200 bg-slate-50/80 p-1">
              <button
                type="button"
                onClick={() => onModeChange('single')}
                className={cn(
                  'rounded-md px-3 py-2 text-sm font-medium transition',
                  scheduleMode === 'single'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                )}
              >
                {tForm('singleSession')}
              </button>
              <button
                type="button"
                onClick={() => onModeChange('recurring')}
                className={cn(
                  'rounded-md px-3 py-2 text-sm font-medium transition',
                  scheduleMode === 'recurring'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                )}
              >
                {tForm('recurringSessions')}
              </button>
            </div>
            <p className="text-xs text-slate-500">{tForm('scheduleHint')}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="teacherId">
              {tCommon('teacher')} <span className="text-red-500">*</span>
            </Label>
            <SingleSelectDropdown
              id="teacherId"
              options={[
                { id: '', label: tForm('selectTeacher') },
                ...teachers.map((teacher) => ({
                  id: teacher.id,
                  label: `${teacher.user.firstName} ${teacher.user.lastName}`,
                })),
              ]}
              value={teacherIdW}
              onValueChange={(nextValue) => {
                setValue('teacherId', nextValue ?? '', {
                  shouldValidate: true,
                  shouldDirty: true,
                  shouldTouch: true,
                });
              }}
            />
            {errors.teacherId && <p className="text-sm text-red-600">{errors.teacherId.message}</p>}
            {isLoadingTeachers && <p className="text-sm text-slate-500">{tForm('loadingTeachers')}</p>}
            {!isLoadingTeachers && teachers.length === 0 && (
              <p className="text-sm text-amber-600">{tForm('noTeachersAvailable')}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="groupId">
              {tCommon('group')} <span className="text-red-500">*</span>
            </Label>
            <input type="hidden" {...register('groupId')} />
            <SingleSelectDropdown
              id="groupId"
              options={[
                {
                  id: '',
                  label: !hasTeacher ? tForm('selectTeacherFirst') : tForm('selectGroup'),
                },
                ...groups.map((group) => ({
                  id: group.id,
                  label: `${group.name}${group.level ? ` (${group.level})` : ''}${group.center ? ` - ${group.center.name}` : ''}`,
                })),
              ]}
              value={groupIdW || ''}
              onValueChange={(nextValue) =>
                setValue('groupId', nextValue ?? '', {
                  shouldValidate: true,
                  shouldDirty: true,
                  shouldTouch: true,
                })
              }
              disabled={groupSelectDisabled}
              error={errors.groupId?.message ?? null}
            />
            {errors.groupId && <p className="text-sm text-red-600">{errors.groupId.message}</p>}
            {!hasTeacher && <p className="text-sm text-slate-500">{tForm('selectTeacherForGroups')}</p>}
            {hasTeacher && isLoadingGroups && <p className="text-sm text-slate-500">{tForm('loadingGroups')}</p>}
            {hasTeacher && !isLoadingGroups && noGroupsForTeacher && (
              <p className="text-sm text-amber-600">{tForm('noGroupsForTeacher')}</p>
            )}
          </div>

          {scheduleMode === 'single' ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="scheduledDate">
                  {tCommon('date')} <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="scheduledDate"
                  type="date"
                  value={datePart}
                  onChange={(e) => {
                    const newDate = e.target.value;
                    const newDateTime = timePart ? `${newDate}T${timePart}` : `${newDate}T10:00`;
                    setValue('scheduledAt', newDateTime, { shouldValidate: true });
                  }}
                  error={errors.scheduledAt?.message}
                  disabled={isBusy}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="scheduledTime">
                  {tCommon('time')} <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="scheduledTime"
                  type="time"
                  value={timePart}
                  onChange={(e) => {
                    const newTime = e.target.value;
                    const newDateTime = datePart
                      ? `${datePart}T${newTime}`
                      : `${new Date().toISOString().split('T')[0]}T${newTime}`;
                    setValue('scheduledAt', newDateTime, { shouldValidate: true });
                  }}
                  error={errors.scheduledAt?.message}
                  disabled={isBusy}
                />
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label>
                  {tForm('daysOfWeek')} <span className="text-red-500">*</span>
                </Label>
                <div className="flex flex-wrap gap-2">
                  {weekdays.map((day) => {
                    const selected = (weekdaysW ?? []).includes(day.value);
                    return (
                      <button
                        key={day.value}
                        type="button"
                        onClick={() => toggleWeekday(day.value)}
                        disabled={isBusy}
                        className={cn(
                          'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                          selected
                            ? 'bg-[#1010a3] text-white hover:bg-[#0d0d85]'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200',
                          isBusy && 'opacity-50 cursor-not-allowed'
                        )}
                      >
                        {day.label}
                      </button>
                    );
                  })}
                </div>
                {errors.weekdays && <p className="text-sm text-red-600">{String(errors.weekdays.message)}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="al-startTime">
                    {tCalendar('startTime')} <span className="text-red-500">*</span>
                  </Label>
                  <Input id="al-startTime" type="time" {...register('startTime')} error={errors.startTime?.message} disabled={isBusy} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="al-endTime">
                    {tCalendar('endTime')} <span className="text-red-500">*</span>
                  </Label>
                  <Input id="al-endTime" type="time" {...register('endTime')} error={errors.endTime?.message} disabled={isBusy} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="al-startDate">
                    {tCalendar('startDate')} <span className="text-red-500">*</span>
                  </Label>
                  <Input id="al-startDate" type="date" {...register('startDate')} error={errors.startDate?.message} disabled={isBusy} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="al-endDate">
                    {tCalendar('endDate')} <span className="text-red-500">*</span>
                  </Label>
                  <Input id="al-endDate" type="date" {...register('endDate')} error={errors.endDate?.message} disabled={isBusy} />
                </div>
              </div>

              {slotPreview.slots > 0 && (
                <div
                  className="rounded-lg border border-slate-200 bg-slate-50/90 px-3 py-2 text-sm text-slate-700"
                  role="status"
                >
                  <p className="font-medium">{tForm('summary')}</p>
                  <p>
                    {tForm('summaryLessons', { count: slotPreview.slots })}
                    {slotPreview.durationMins && slotPreview.durationMins > 0
                      ? tForm('summaryDurationEach', { minutes: slotPreview.durationMins })
                      : ''}
                    . {tForm('summaryNoDuplicates')}
                  </p>
                </div>
              )}
            </>
          )}

          {scheduleMode === 'single' && (
            <div className="space-y-2">
              <Label htmlFor="duration">{tForm('durationMinutes')}</Label>
              <Input
                id="duration"
                type="number"
                {...register('duration', { valueAsNumber: true })}
                error={errors.duration?.message}
                placeholder="60"
                min={15}
                max={240}
                step={15}
                disabled={isBusy}
              />
              <p className="text-xs text-slate-500">{tForm('durationHint')}</p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="description">{tCommon('description')}</Label>
            <textarea
              id="description"
              {...register('description')}
              rows={3}
              className={cn(
                'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-4 focus:ring-[#1010a3]/10 focus:border-[#1010a3]/45 text-sm resize-none',
                errors.description ? 'border-red-300' : 'border-slate-300',
                isBusy && 'bg-slate-100 cursor-not-allowed',
                !isBusy && 'bg-white'
              )}
              placeholder={tForm('descriptionPlaceholder')}
              disabled={isBusy}
            />
            {errors.description && <p className="text-sm text-red-600">{errors.description.message}</p>}
          </div>

          <input type="hidden" {...register('scheduleMode')} />

          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                reset();
                requestClose();
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              disabled={isBusy}
            >
              {tCommon('cancel')}
            </Button>
            <Button
              type="submit"
              disabled={
                isBusy ||
                isLoadingTeachers ||
                teachers.length === 0 ||
                !hasTeacher ||
                isLoadingGroups ||
                groups.length === 0
              }
            >
              {isBusy
                ? tForm('creating')
                : scheduleMode === 'recurring' && slotPreview.slots > 0
                  ? tForm('createLessonsCount', { count: slotPreview.slots })
                  : scheduleMode === 'recurring'
                    ? tForm('createLessons')
                    : tForm('createLesson')}
            </Button>
          </div>
            </form>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
