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
import { useGroups, getGroupTeachersForDisplay, getGroupTeacherName } from '@/features/groups';
import type { Group, GroupTeacherRef } from '@/features/groups/types';
import { useState, useEffect, useCallback, useMemo, useRef, type TouchEvent } from 'react';
import { useTranslations } from 'next-intl';
import { getErrorMessage } from '@/shared/lib/api';
import { cn } from '@/shared/lib/utils';
import {
  portalSheetLayerProps,
  stackedSheetDialogHandlers,
  useSheetStackZIndex,
} from '@/shared/lib/sheet-stack';
import { PORTAL_DESKTOP_SIDE_SHEET_CLASS } from '@/shared/lib/portal-form-sheet-classes';
import {
  ADMIN_FORM_INPUT_CLASS,
  ADMIN_ICON_BUTTON_SM_CLASS,
  ADMIN_OUTLINE_BUTTON_CLASS,
  ADMIN_PRIMARY_BUTTON_CLASS,
} from '@/shared/lib/admin-control-theme';
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

function getGroupTeacherId(group: Group): string | null {
  return group.teacherId ?? group.teacher?.id ?? null;
}

function GroupTeacherReadonlyRow({ teacher }: { teacher: GroupTeacherRef }) {
  const name = getGroupTeacherName(teacher) ?? '';
  const firstName = teacher.user?.firstName || '';
  const lastName = teacher.user?.lastName || '';
  const initials = `${firstName[0] || ''}${lastName[0] || ''}` || '?';

  return (
    <div className="grid min-w-0 grid-cols-[auto_1fr] items-center gap-x-2">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#f1f1f2] text-sm font-medium text-[#3b3b40]">
        {initials}
      </div>
      <span className="min-w-0 truncate text-sm text-[#3b3b40]" title={name}>
        {name}
      </span>
    </div>
  );
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
  const hasGroup = groupIdW.length > 0;
  const hasTeacher = teacherIdW.length > 0;
  const selectedGroupHasNoTeacher = hasGroup && selectedGroupTeachers.length === 0;
  const noGroupsAvailable = !isLoadingGroups && groups.length === 0;
  const scheduleValid = validateSchedule() === null;

  const { overlayStyle, contentStyle } = useSheetStackZIndex(isDialogOpen);

  return (
    <DialogPrimitive.Root open={isDialogOpen} onOpenChange={(nextOpen) => !nextOpen && requestClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          style={overlayStyle}
          {...portalSheetLayerProps}
          className="fixed inset-0 z-50 bg-black/60 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
        />
        <DialogPrimitive.Content
          style={{ ...dragStyle, ...contentStyle }}
          {...stackedSheetDialogHandlers}
          {...portalSheetLayerProps}
          className={cn(
            'fixed inset-x-0 bottom-[7px] top-auto z-50 grid w-full translate-y-0 lg:bottom-0 [@media(min-width:1024px)_and_(max-width:1366px)_and_(min-height:1000px)]:bottom-0',
            'duration-700 ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out min-[1367px]:duration-350 min-[1367px]:ease-[cubic-bezier(0.22,1,0.36,1)]',
            'data-[state=open]:slide-in-from-bottom-full data-[state=closed]:slide-out-to-bottom-full',
            'h-[calc(94dvh+7px)] [@media(min-width:1024px)_and_(max-width:1366px)_and_(min-height:1000px)]:h-[56dvh] grid-rows-[auto_auto_1fr] gap-0 overflow-hidden rounded-t-[22px] border border-slate-200 bg-[#f8f9fb] shadow-xl',
            PORTAL_DESKTOP_SIDE_SHEET_CLASS,
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
          <div className="shrink-0 bg-[#f8f9fb] px-4 pb-4 pt-3 min-[1367px]:px-6 min-[1367px]:pb-5 min-[1367px]:pt-6">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-semibold text-[#3b3b40]">{tForm('addTitle')}</h2>
              </div>
              <DialogPrimitive.Close
                className={cn(
                  ADMIN_ICON_BUTTON_SM_CLASS,
                  'hidden text-slate-500 hover:bg-slate-100 hover:text-slate-700 min-[1367px]:inline-flex',
                )}
                aria-label={tCommon('close')}
              >
                <X className="h-4 w-4" />
              </DialogPrimitive.Close>
            </div>
          </div>
          <div className="min-h-0 overflow-y-auto overscroll-y-contain [touch-action:pan-y] [-webkit-overflow-scrolling:touch] px-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] min-[1367px]:px-6 min-[1367px]:pb-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {successMessage && (
            <div className="rounded-[15px] border border-green-200 bg-green-50 p-3">
              <p className="text-sm text-green-600">{successMessage}</p>
            </div>
          )}
          {errorMessage && (
            <div className="rounded-[15px] border border-red-200 bg-red-50 p-3">
              <p className="text-sm text-red-600">{errorMessage}</p>
            </div>
          )}

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="min-w-0 space-y-2">
                <Label htmlFor="groupId">
                  {tCommon('group')} <span className="text-red-500">*</span>
                </Label>
                <input type="hidden" {...register('groupId')} />
                <SingleSelectDropdown
                  id="groupId"
                  triggerClassName={ADMIN_FORM_INPUT_CLASS}
                  options={[
                    { id: '', label: tForm('selectGroup') },
                    ...groups.map((group) => ({
                      id: group.id,
                      label: `${group.name}${group.level ? ` (${group.level})` : ''}${group.center ? ` - ${group.center.name}` : ''}`,
                    })),
                  ]}
                  value={groupIdW || ''}
                  onValueChange={handleGroupChange}
                  disabled={isBusy || isLoadingGroups}
                  error={errors.groupId?.message ?? null}
                  searchable
                  searchPlaceholder={tForm('searchGroups')}
                  placeholder={tForm('selectGroup')}
                  wrapText
                />
                {errors.groupId && <p className="text-sm text-red-600">{errors.groupId.message}</p>}
                {isLoadingGroups && <p className="text-sm text-slate-500">{tForm('loadingGroups')}</p>}
                {!isLoadingGroups && noGroupsAvailable && (
                  <p className="text-sm text-amber-600">{tForm('noGroupsAvailable')}</p>
                )}
                {selectedGroupHasNoTeacher && (
                  <p className="text-sm text-amber-600">{tForm('noTeacherOnGroup')}</p>
                )}
              </div>

              <div className="min-w-0 space-y-2">
                <input type="hidden" {...register('teacherId')} />
                {!hasGroup ? (
                  <>
                    <Label htmlFor="teacherId">
                      {tCommon('teacher')} <span className="text-red-500">*</span>
                    </Label>
                    <div
                      id="teacherId"
                      className={cn(ADMIN_FORM_INPUT_CLASS, 'flex items-center bg-slate-50')}
                    >
                      <span className="text-sm text-slate-400">{tForm('selectGroupFirst')}</span>
                    </div>
                  </>
                ) : selectedGroupTeachers[0] ? (
                  <>
                    <Label htmlFor="teacherId">
                      {tGroupsForm('teacher1Main')} <span className="text-red-500">*</span>
                    </Label>
                    <div
                      id="teacherId"
                      className={cn(ADMIN_FORM_INPUT_CLASS, 'flex items-center bg-slate-50')}
                    >
                      <GroupTeacherReadonlyRow teacher={selectedGroupTeachers[0]} />
                    </div>
                  </>
                ) : (
                  <>
                    <Label htmlFor="teacherId">
                      {tCommon('teacher')} <span className="text-red-500">*</span>
                    </Label>
                    <div
                      id="teacherId"
                      className={cn(ADMIN_FORM_INPUT_CLASS, 'flex items-center bg-slate-50')}
                    >
                      <span className="text-sm text-slate-400">—</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {hasGroup && selectedGroupTeachers.length > 1 ? (
              <div className="space-y-2">
                <Label htmlFor={`teacherId-${selectedGroupTeachers[1].id}`}>
                  {tGroupsForm('teacher2')}
                </Label>
                <div
                  id={`teacherId-${selectedGroupTeachers[1].id}`}
                  className={cn(ADMIN_FORM_INPUT_CLASS, 'flex items-center bg-slate-50')}
                >
                  <GroupTeacherReadonlyRow teacher={selectedGroupTeachers[1]} />
                </div>
              </div>
            ) : null}

            {errors.teacherId && <p className="text-sm text-red-600">{errors.teacherId.message}</p>}
          </div>

          <GroupCalendarScheduleSection
            schedule={schedule}
            onScheduleChange={setSchedule}
            dateFrom={dateFrom}
            dateTo={dateTo}
            onDateFromChange={setDateFrom}
            onDateToChange={setDateTo}
            disabled={isBusy}
            adminControls
          />

          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              className={cn(ADMIN_OUTLINE_BUTTON_CLASS, 'border-[rgba(14,14,16,0.07)] hover:bg-slate-50')}
              onClick={requestClose}
              disabled={isBusy}
            >
              {tCommon('cancel')}
            </Button>
            <Button
              type="submit"
              className={cn(ADMIN_PRIMARY_BUTTON_CLASS, 'bg-primary text-primary-foreground hover:bg-primary/90')}
              disabled={
                isBusy ||
                isLoadingGroups ||
                groups.length === 0 ||
                !hasGroup ||
                !hasTeacher ||
                selectedGroupHasNoTeacher ||
                !scheduleValid
              }
              isLoading={isBusy}
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
