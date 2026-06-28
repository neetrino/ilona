'use client';


import * as DialogPrimitive from '@radix-ui/react-dialog';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslations } from 'next-intl';
import { Button, Input, Label, Checkbox } from '@/shared/components/ui';
import { useCreateGroup, type CreateGroupDto } from '@/features/groups';
import type { GroupScheduleEntry } from '../types';
import { useCenters } from '@/features/centers';
import { useTeachers } from '@/features/teachers';
import { useState, useEffect, useMemo, useCallback, useRef, type TouchEvent } from 'react';
import { getErrorMessage } from '@/shared/lib/api';
import { GroupCalendarScheduleSection } from './GroupCalendarScheduleSection';
import { GroupIconPicker } from './GroupIconPicker';
import type { GroupIconKey } from '@ilona/types';
import { defaultMonthDateRange, scheduleSlotsValidationError } from '../group-schedule-utils';
import { cn } from '@/shared/lib/utils';
import {
  portalSheetLayerProps,
  stackedSheetDialogHandlers,
  useSheetStackZIndex,
  stackedSheetOverlayClassName,
} from '@/shared/lib/sheet-stack';
import { PORTAL_DESKTOP_SIDE_SHEET_CLASS } from '@/shared/lib/portal-form-sheet-classes';
import { X } from 'lucide-react';
import { SingleSelectDropdown, portaledDropdownDialogHandlers } from '@/shared/components/ui/single-select-dropdown';
import {
  filterTeachersForCenter,
  teacherOptionLabel,
} from '../lib/center-scoped-teachers';

type CreateGroupFormData = {
  name: string;
  level?: string;
  centerId: string;
  teacherId: string;
  secondTeacherId: string;
};

function translateScheduleSlotError(
  err: string | null,
  tVal: (key: 'slotEndAfterStart' | 'slotDuration') => string,
): string | null {
  if (!err) return null;
  if (err.includes('end time after')) return tVal('slotEndAfterStart');
  if (err.includes('between 15 and 240')) return tVal('slotDuration');
  return err;
}

interface CreateGroupFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateGroupForm({ open, onOpenChange }: CreateGroupFormProps) {
  const tForm = useTranslations('groups.form');
  const tVal = useTranslations('groups.validation');
  const tCommon = useTranslations('common');

  const createGroupSchema = useMemo(
    () =>
      z
        .object({
          name: z.string().min(2, tVal('nameMin')).max(100, tVal('nameMax')),
          level: z.string().max(50, tVal('levelMax')).optional().or(z.literal('')),
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
    setValue,
    watch,
  } = useForm<CreateGroupFormData>({
    resolver,
    defaultValues: {
      name: '',
      level: '',
      centerId: '',
      teacherId: '',
      secondTeacherId: '',
    },
  });
  const watchedTeacherId = watch('teacherId');
  const watchedCenterId = watch('centerId');
  const watchedSecondTeacherId = watch('secondTeacherId');

  const hasCenterSelected = Boolean(watchedCenterId);
  const teachersForCenter = useMemo(
    () => filterTeachersForCenter(teachers, watchedCenterId),
    [teachers, watchedCenterId],
  );
  const teacherDropdownDisabled =
    isSubmitting || createGroup.isPending || isLoadingTeachers || !hasCenterSelected;
  const teacherPlaceholder = hasCenterSelected ? tForm('noTeacherAssigned') : tForm('selectCenterFirst');

  // Reset form when dialog closes
  useEffect(() => {
    setIsDialogOpen(open);
  }, [open]);

  // Fresh form + calendar dates each time modal opens
  useEffect(() => {
    if (open) {
      reset({
        name: '',
        level: '',
        centerId: '',
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
  }, [open, reset]);

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
        centerId: data.centerId,
        teacherId: data.teacherId,
        secondTeacherId: data.secondTeacherId,
        secondTeacherStartsFirstWeek,
        schedule: schedule.length > 0 ? schedule : undefined,
        calendarPlan: schedule.length > 0 ? { dateFrom, dateTo } : undefined,
        ...(iconKey ? { iconKey } : {}),
      };

      await createGroup.mutateAsync(payload);
      
      // Show success message
      setSuccessMessage(tForm('createdSuccess'));
      setErrorMessage(null);
      
      // Reset form and close modal after a brief delay
      reset({
        name: '',
        level: '',
        centerId: '',
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
      // Handle error
      const message = getErrorMessage(error, tForm('failedCreate'));
      setErrorMessage(message);
      setSuccessMessage(null);
    }
  };
  const { overlayStyle, contentStyle, isBaseLayer } = useSheetStackZIndex(isDialogOpen);

  return (
    <DialogPrimitive.Root open={isDialogOpen} onOpenChange={(nextOpen) => !nextOpen && requestClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay style={overlayStyle} {...portalSheetLayerProps} className={stackedSheetOverlayClassName('fixed inset-0 z-50 bg-black/60 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0', isBaseLayer)} />
        <DialogPrimitive.Content style={{ ...dragStyle, ...contentStyle }} {...stackedSheetDialogHandlers} {...portalSheetLayerProps}
          className={cn(
            'fixed inset-x-0 bottom-[7px] top-auto z-50 grid w-full translate-y-0 lg:bottom-0 [@media(min-width:1024px)_and_(max-width:1366px)_and_(min-height:1000px)]:bottom-0',
            'duration-700 ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out min-[1367px]:duration-350 min-[1367px]:ease-[cubic-bezier(0.22,1,0.36,1)]',
            'data-[state=open]:slide-in-from-bottom-full data-[state=closed]:slide-out-to-bottom-full',
            'h-[calc(94dvh+7px)] [@media(min-width:1024px)_and_(max-width:1366px)_and_(min-height:1000px)]:h-[56dvh] grid-rows-[auto_1fr] gap-0 overflow-hidden rounded-t-[22px] border border-slate-200 bg-[#f8f9fb] shadow-xl',
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
          <div className="min-h-0 overflow-y-auto overscroll-y-contain [touch-action:pan-y] [-webkit-overflow-scrolling:touch] px-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] pt-4 min-[1367px]:p-6">
            <div className="mb-4">
              <DialogPrimitive.Close
                className="absolute right-4 top-4 hidden h-8 w-8 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 min-[1367px]:inline-flex"
                aria-label={tCommon('close')}
              >
                <X className="h-4 w-4" />
              </DialogPrimitive.Close>
              <h2 className="text-lg font-semibold text-[#3b3b40]">{tForm('addTitle')}</h2>
              <p className="mt-1 text-sm text-[#8b8b90]">{tForm('addDescription')}</p>
            </div>

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
            <Label htmlFor="name">
              {tForm('groupName')} <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              {...register('name')}
              error={errors.name?.message}
              placeholder={tForm('namePlaceholder')}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="level">{tCommon('level')}</Label>
            <Input
              id="level"
              {...register('level')}
              error={errors.level?.message}
              placeholder={tForm('levelPlaceholder')}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label id="group-icon-label">{tForm('groupIcon')}</Label>
            <p className="text-xs text-slate-500">{tForm('iconHintCreate')}</p>
            <GroupIconPicker
              value={iconKey}
              onChange={setIconKey}
              defaultSelectsRandom
              disabled={isSubmitting}
              aria-labelledby="group-icon-label"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="centerId">
              {tCommon('center')} <span className="text-red-500">*</span>
            </Label>
            <input type="hidden" {...register('centerId')} />
            <SingleSelectDropdown
              id="centerId"
              options={centers.map((center) => ({
                id: center.id,
                label: center.name,
              }))}
              value={watchedCenterId || null}
              onValueChange={(nextValue) => {
                const nextCenterId = nextValue ?? '';
                const prevCenterId = watchedCenterId;
                setValue('centerId', nextCenterId, {
                  shouldDirty: true,
                  shouldValidate: true,
                });
                if (prevCenterId && prevCenterId !== nextCenterId) {
                  setValue('teacherId', '', { shouldDirty: true, shouldValidate: true });
                  setValue('secondTeacherId', '', { shouldDirty: true, shouldValidate: true });
                }
              }}
              placeholder={tForm('selectCenter')}
              isLoading={isLoadingCenters}
              error={errors.centerId?.message ?? null}
              disabled={isSubmitting || isLoadingCenters || centers.length === 0}
            />
            {isLoadingCenters && (
              <p className="text-sm text-slate-500">{tForm('loadingCenters')}</p>
            )}
            {!isLoadingCenters && centers.length === 0 && (
              <p className="text-sm text-amber-600">{tForm('noCentersAvailable')}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="teacherId">
              {tForm('teacher1Main')} <span className="text-red-500">*</span>
            </Label>
            <input type="hidden" {...register('teacherId')} />
            <SingleSelectDropdown
              id="teacherId"
              options={teachersForCenter.map((teacher) => ({
                id: teacher.id,
                label: teacherOptionLabel(teacher),
              }))}
              value={watchedTeacherId || null}
              onValueChange={(nextValue) => {
                const nextTeacherId = nextValue ?? '';
                setValue('teacherId', nextTeacherId, {
                  shouldDirty: true,
                  shouldValidate: true,
                });
                if (watchedSecondTeacherId && watchedSecondTeacherId === nextTeacherId) {
                  setValue('secondTeacherId', '', {
                    shouldDirty: true,
                    shouldValidate: true,
                  });
                }
              }}
              placeholder={teacherPlaceholder}
              isLoading={isLoadingTeachers}
              error={errors.teacherId?.message ?? null}
              disabled={teacherDropdownDisabled}
            />
            {isLoadingTeachers && (
              <p className="text-sm text-slate-500">{tForm('loadingTeachers')}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="secondTeacherId">
              {tForm('teacher2')} <span className="text-red-500">*</span>
            </Label>
            <input type="hidden" {...register('secondTeacherId')} />
            <SingleSelectDropdown
              id="secondTeacherId"
              options={teachersForCenter
                .filter((teacher) => teacher.id !== watchedTeacherId)
                .map((teacher) => ({
                  id: teacher.id,
                  label: teacherOptionLabel(teacher),
                }))}
              value={watchedSecondTeacherId || null}
              onValueChange={(nextValue) =>
                setValue('secondTeacherId', nextValue ?? '', {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
              placeholder={teacherPlaceholder}
              isLoading={isLoadingTeachers}
              error={errors.secondTeacherId?.message ?? null}
              disabled={teacherDropdownDisabled}
            />
            <label className="flex cursor-pointer select-none items-start gap-2 pt-1">
              <Checkbox
                checked={secondTeacherStartsFirstWeek}
                onCheckedChange={setSecondTeacherStartsFirstWeek}
                disabled={isSubmitting || createGroup.isPending}
                className="mt-0.5"
              />
              <span className="text-sm text-slate-600">{tForm('teacher2StartsFirstWeek')}</span>
            </label>
          </div>

          <p className="text-xs text-slate-500">{tForm('teacherRotationHint')}</p>

          <GroupCalendarScheduleSection
            schedule={schedule}
            onScheduleChange={setSchedule}
            dateFrom={dateFrom}
            dateTo={dateTo}
            onDateFromChange={setDateFrom}
            onDateToChange={setDateTo}
            disabled={isSubmitting || createGroup.isPending}
          />

          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="ghost"
              onClick={requestClose}
              disabled={isSubmitting || createGroup.isPending}
            >
              {tCommon('cancel')}
            </Button>
            <Button
              type="submit"
              disabled={
                isSubmitting ||
                createGroup.isPending ||
                isLoadingCenters ||
                isLoadingTeachers ||
                centers.length === 0
              }
              className="bg-[#1010a3] hover:bg-[#0d0d85] text-white"
            >
              {isSubmitting || createGroup.isPending ? tForm('creating') : tForm('createGroup')}
            </Button>
          </div>
        </form>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

