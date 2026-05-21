'use client';

import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Button,
  Input,
  Label,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/shared/components/ui';
import { useCreateLesson, useCreateRecurringLessons, type CreateLessonDto, type CreateRecurringLessonsDto } from '@/features/lessons';
import { useGroups } from '@/features/groups';
import { useTeachers } from '@/features/teachers';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { getErrorMessage } from '@/shared/lib/api';
import { cn } from '@/shared/lib/utils';

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
    }
  }, [open, reset, defaultDate, defaultTime, getDefaultRecurring, getDefaultScheduledAt]);

  useEffect(() => {
    setValue('groupId', '', { shouldValidate: false, shouldDirty: false, shouldTouch: false });
  }, [teacherIdW, setValue]);

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
        onOpenChange(false);
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{tForm('addTitle')}</DialogTitle>
          <DialogDescription>{tForm('addDescription')}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
            <select
              id="teacherId"
              {...register('teacherId')}
              disabled={isBusy || isLoadingTeachers || teachers.length === 0}
              className={cn(
                'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm',
                errors.teacherId ? 'border-red-300' : 'border-slate-300',
                (isBusy || isLoadingTeachers || teachers.length === 0) && 'bg-slate-100 cursor-not-allowed',
                !isLoadingTeachers && teachers.length > 0 && 'bg-white'
              )}
            >
              <option value="">{tForm('selectTeacher')}</option>
              {teachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.user.firstName} {teacher.user.lastName}
                </option>
              ))}
            </select>
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
            <select
              id="groupId"
              {...register('groupId')}
              disabled={groupSelectDisabled}
              className={cn(
                'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm',
                errors.groupId ? 'border-red-300' : 'border-slate-300',
                groupSelectDisabled && 'bg-slate-100 cursor-not-allowed',
                !groupSelectDisabled && 'bg-white'
              )}
            >
              <option value="">{!hasTeacher ? tForm('selectTeacherFirst') : tForm('selectGroup')}</option>
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name} {group.level ? `(${group.level})` : ''} {group.center ? `- ${group.center.name}` : ''}
                </option>
              ))}
            </select>
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
                            ? 'bg-blue-600 text-white hover:bg-blue-700'
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
                'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm resize-none',
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

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isBusy}>
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
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
