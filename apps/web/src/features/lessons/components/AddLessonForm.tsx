'use client';

import * as DialogPrimitive from '@radix-ui/react-dialog';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Button,
  Label,
} from '@/shared/components/ui';
import { SingleSelectDropdown } from '@/shared/components/ui/single-select-dropdown';
import {
  useCreateRecurringLessons,
  type CreateRecurringLessonsDto,
} from '@/features/lessons';
import {
  defaultMonthDateRange,
  scheduleEndDateFromStart,
  scheduleSlotsValidationError,
} from '@/features/groups/group-schedule-utils';
import type { GroupScheduleEntry } from '@/features/groups/types';
import { GroupCalendarScheduleSection } from '@/features/groups/components/GroupCalendarScheduleSection';
import { useGroups } from '@/features/groups';
import { useTeachers } from '@/features/teachers';
import { useState, useEffect, useCallback, useMemo, useRef, type TouchEvent } from 'react';
import { useTranslations } from 'next-intl';
import { getErrorMessage } from '@/shared/lib/api';
import { cn } from '@/shared/lib/utils';
import { X } from 'lucide-react';

type AddLessonFormData = {
  groupId: string;
  teacherId: string;
};

function createAddLessonFormSchema(tVal: (key: string) => string) {
  return z.object({
    groupId: z.string().min(1, tVal('selectGroup')),
    teacherId: z.string().min(1, tVal('selectTeacher')),
  });
}

function translateScheduleSlotError(
  err: string | null,
  tVal: (key: 'slotEndAfterStart' | 'slotDuration') => string,
): string | null {
  if (!err) return null;
  if (err.includes('end time after')) return tVal('slotEndAfterStart');
  if (err.includes('between 15 and 240')) return tVal('slotDuration');
  return err;
}

function groupSlotsForRecurring(
  slots: GroupScheduleEntry[],
): Array<{ startTime: string; endTime: string; weekdays: number[] }> {
  const map = new Map<string, { startTime: string; endTime: string; weekdays: number[] }>();
  for (const slot of slots) {
    const key = `${slot.startTime}|${slot.endTime}`;
    const existing = map.get(key);
    if (existing) {
      if (!existing.weekdays.includes(slot.dayOfWeek)) {
        existing.weekdays.push(slot.dayOfWeek);
      }
    } else {
      map.set(key, {
        startTime: slot.startTime,
        endTime: slot.endTime,
        weekdays: [slot.dayOfWeek],
      });
    }
  }
  return Array.from(map.values());
}

interface AddLessonFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultDate?: string;
  defaultTime?: string;
}

export function AddLessonForm({ open, onOpenChange, defaultDate }: AddLessonFormProps) {
  const tForm = useTranslations('lessons.form');
  const tVal = useTranslations('lessons.validation');
  const tGroupsForm = useTranslations('groups.form');
  const tGroupsVal = useTranslations('groups.validation');
  const tCommon = useTranslations('common');

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
  const [dragOffsetY, setDragOffsetY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isSettling, setIsSettling] = useState(false);
  const [schedule, setSchedule] = useState<GroupScheduleEntry[]>([]);
  const [dateFrom, setDateFrom] = useState(() => getDefaultDateRange().from);
  const [dateTo, setDateTo] = useState(() => getDefaultDateRange().to);
  const touchStartYRef = useRef<number | null>(null);
  const touchStartXRef = useRef<number | null>(null);
  const settleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const createRecurring = useCreateRecurringLessons();

  const { data: teachersData, isLoading: isLoadingTeachers } = useTeachers({ take: 100 });

  const teachers = teachersData?.items || [];

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

  const groupsQueryEnabled = open && teacherIdW.length > 0;
  const { data: groupsData, isLoading: isLoadingGroups } = useGroups(
    { take: 100, isActive: true, ...(teacherIdW ? { teacherId: teacherIdW } : {}) },
    groupsQueryEnabled
  );
  const groups = groupsData?.items ?? [];

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
      setDragOffsetY(0);
      setIsDragging(false);
      setIsSettling(false);
    }
  }, [open, reset, getDefaultDateRange]);

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

  const validateSchedule = (): string | null => {
    if (schedule.length < 1) {
      return tVal('weekdaysRequired');
    }
    const slotErr = translateScheduleSlotError(scheduleSlotsValidationError(schedule), tGroupsVal);
    if (slotErr) return slotErr;
    if (!dateFrom || !dateTo) {
      return tGroupsForm('chooseCalendarDateRange');
    }
    if (dateTo < dateFrom) {
      return tGroupsForm('endDateOnOrAfterStart');
    }
    return null;
  };

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
  const hasTeacher = teacherIdW.length > 0;
  const noGroupsForTeacher = hasTeacher && !isLoadingGroups && groups.length === 0;
  const groupSelectDisabled = isBusy || !hasTeacher || isLoadingGroups || noGroupsForTeacher;
  const scheduleValid = validateSchedule() === null;

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
            'h-fit max-h-[calc(82dvh+7px)] [@media(min-width:1024px)_and_(max-width:1366px)_and_(min-height:1000px)]:max-h-[50dvh] flex flex-col gap-0 overflow-hidden rounded-t-[22px] border border-slate-200 bg-[#f8f9fb] shadow-xl',
            'min-[1367px]:left-1/2 min-[1367px]:top-1/2 min-[1367px]:right-auto min-[1367px]:bottom-auto min-[1367px]:w-[95vw] min-[1367px]:max-w-2xl min-[1367px]:h-fit min-[1367px]:max-h-[80vh] min-[1367px]:-translate-x-1/2 min-[1367px]:-translate-y-1/2 min-[1367px]:rounded-2xl',
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

          <div className="min-h-0 overflow-y-auto overscroll-y-contain [touch-action:pan-y] [-webkit-overflow-scrolling:touch] px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4 min-[1367px]:p-6">
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

          <GroupCalendarScheduleSection
            schedule={schedule}
            onScheduleChange={setSchedule}
            dateFrom={dateFrom}
            dateTo={dateTo}
            onDateFromChange={setDateFrom}
            onDateToChange={setDateTo}
            disabled={isBusy}
          />

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
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
                groups.length === 0 ||
                !scheduleValid
              }
            >
              {isBusy ? tForm('creating') : tForm('createLessons')}
            </Button>
          </div>
            </form>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
