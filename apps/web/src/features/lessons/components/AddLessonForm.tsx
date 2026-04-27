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
import { getErrorMessage } from '@/shared/lib/api';
import { cn } from '@/shared/lib/utils';

const TIME_RE = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;

/** Mon–Sun display; values match Date.getDay() (0 = Sun … 6 = Sat) */
const WEEKDAYS = [
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
  { value: 0, label: 'Sun' },
] as const;

type ScheduleMode = 'single' | 'recurring';

const addLessonFormSchema = z
  .object({
    scheduleMode: z.enum(['single', 'recurring']),
    groupId: z.string().min(1, 'Please select a group'),
    teacherId: z.string().min(1, 'Please select a teacher'),
    scheduledAt: z.string().optional(),
    duration: z
      .number()
      .int('Duration must be a whole number')
      .min(15, 'Duration must be at least 15 minutes')
      .max(240, 'Duration must be at most 240 minutes')
      .optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    weekdays: z.array(z.number().int().min(0).max(6)).optional(),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
    description: z
      .string()
      .max(1000, 'Description must be at most 1000 characters')
      .optional()
      .or(z.literal('')),
  })
  .superRefine((data, ctx) => {
    if (data.scheduleMode === 'single') {
      if (!data.scheduledAt || data.scheduledAt.length < 1) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['scheduledAt'], message: 'Please select date and time' });
      }
    } else {
      if (!data.startDate) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['startDate'], message: 'Please select start date' });
      }
      if (!data.endDate) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['endDate'], message: 'Please select end date' });
      }
      if (data.startDate && data.endDate) {
        const a = new Date(data.startDate);
        const b = new Date(data.endDate);
        if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['endDate'], message: 'Invalid date' });
        } else if (b < a) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['endDate'], message: 'End date must be on or after start date' });
        }
      }
      const wd = data.weekdays ?? [];
      if (wd.length < 1) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['weekdays'], message: 'Select at least one day of the week' });
      }
      if (data.startTime) {
        if (!TIME_RE.test(data.startTime)) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['startTime'], message: 'Start time is invalid' });
        }
      } else {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['startTime'], message: 'Please set start time' });
      }
      if (data.endTime) {
        if (!TIME_RE.test(data.endTime)) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['endTime'], message: 'End time is invalid' });
        }
      } else {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['endTime'], message: 'Please set end time' });
      }
      if (data.startTime && data.endTime && TIME_RE.test(data.startTime) && TIME_RE.test(data.endTime)) {
        const [sH, sM] = data.startTime.split(':').map(Number);
        const [eH, eM] = data.endTime.split(':').map(Number);
        if (eH * 60 + eM <= sH * 60 + sM) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['endTime'], message: 'End time must be after start time' });
        }
      }
    }
  });

type AddLessonFormData = z.infer<typeof addLessonFormSchema>;

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
    resolver: zodResolver(addLessonFormSchema),
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
        setSuccessMessage('Lesson created successfully!');
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
        let msg = n === 1 ? 'Created 1 lesson.' : `Created ${n} lessons.`;
        if (s > 0) {
          msg += ` Skipped ${s} time slot(s) that already had a lesson.`;
        }
        setSuccessMessage(msg);
      }

      setTimeout(() => {
        onOpenChange(false);
      }, 1500);
    } catch (err: unknown) {
      setErrorMessage(getErrorMessage(err, 'Failed to create lesson(s). Please try again.'));
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
          <DialogTitle>Add New Lesson</DialogTitle>
          <DialogDescription>
            Add one session or many recurring sessions. Fields marked with * are required.
          </DialogDescription>
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
            <Label>Schedule</Label>
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
                Single session
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
                Date range &amp; recurring
              </button>
            </div>
            <p className="text-xs text-slate-500">
              Single: one date and a duration. Recurring: a range, weekdays, and a start/end time each day.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="teacherId">
              Teacher <span className="text-red-500">*</span>
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
              <option value="">Select a teacher</option>
              {teachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.user.firstName} {teacher.user.lastName}
                </option>
              ))}
            </select>
            {errors.teacherId && <p className="text-sm text-red-600">{errors.teacherId.message}</p>}
            {isLoadingTeachers && <p className="text-sm text-slate-500">Loading teachers...</p>}
            {!isLoadingTeachers && teachers.length === 0 && (
              <p className="text-sm text-amber-600">No teachers available. Please create a teacher first.</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="groupId">
              Group <span className="text-red-500">*</span>
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
              <option value="">{!hasTeacher ? 'Select a teacher first' : 'Select a group'}</option>
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name} {group.level ? `(${group.level})` : ''} {group.center ? `- ${group.center.name}` : ''}
                </option>
              ))}
            </select>
            {errors.groupId && <p className="text-sm text-red-600">{errors.groupId.message}</p>}
            {!hasTeacher && <p className="text-sm text-slate-500">Select a teacher to see groups assigned to them.</p>}
            {hasTeacher && isLoadingGroups && <p className="text-sm text-slate-500">Loading groups...</p>}
            {hasTeacher && !isLoadingGroups && noGroupsForTeacher && (
              <p className="text-sm text-amber-600">This teacher has no active groups assigned. Assign a group in Groups first.</p>
            )}
          </div>

          {scheduleMode === 'single' ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="scheduledDate">
                  Date <span className="text-red-500">*</span>
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
                  Time <span className="text-red-500">*</span>
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
                <Label>Days of week <span className="text-red-500">*</span></Label>
                <div className="flex flex-wrap gap-2">
                  {WEEKDAYS.map((day) => {
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
                  <Label htmlFor="al-startTime">Start time <span className="text-red-500">*</span></Label>
                  <Input id="al-startTime" type="time" {...register('startTime')} error={errors.startTime?.message} disabled={isBusy} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="al-endTime">End time <span className="text-red-500">*</span></Label>
                  <Input id="al-endTime" type="time" {...register('endTime')} error={errors.endTime?.message} disabled={isBusy} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="al-startDate">Start date <span className="text-red-500">*</span></Label>
                  <Input id="al-startDate" type="date" {...register('startDate')} error={errors.startDate?.message} disabled={isBusy} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="al-endDate">End date <span className="text-red-500">*</span></Label>
                  <Input id="al-endDate" type="date" {...register('endDate')} error={errors.endDate?.message} disabled={isBusy} />
                </div>
              </div>

              {slotPreview.slots > 0 && (
                <div
                  className="rounded-lg border border-slate-200 bg-slate-50/90 px-3 py-2 text-sm text-slate-700"
                  role="status"
                >
                  <p className="font-medium">Summary</p>
                  <p>
                    {slotPreview.slots} new lesson{slotPreview.slots === 1 ? '' : 's'} in this range
                    {slotPreview.durationMins && slotPreview.durationMins > 0 ? ` · ${slotPreview.durationMins} min each` : ''}.
                    Existing lessons at the same time are not duplicated.
                  </p>
                </div>
              )}
            </>
          )}

          {scheduleMode === 'single' && (
            <div className="space-y-2">
              <Label htmlFor="duration">Duration (minutes)</Label>
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
              <p className="text-xs text-slate-500">Duration between 15 and 240 minutes (default: 60)</p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
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
              placeholder="Optional notes..."
              disabled={isBusy}
            />
            {errors.description && <p className="text-sm text-red-600">{errors.description.message}</p>}
          </div>

          <input type="hidden" {...register('scheduleMode')} />

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isBusy}>
              Cancel
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
                ? 'Creating…'
                : scheduleMode === 'recurring' && slotPreview.slots > 0
                  ? `Create ${slotPreview.slots} lessons`
                  : scheduleMode === 'recurring'
                    ? 'Create lessons'
                    : 'Create lesson'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
