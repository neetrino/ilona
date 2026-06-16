'use client';

import * as DialogPrimitive from '@radix-ui/react-dialog';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslations } from 'next-intl';
import { Button, Input, Label, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/shared/components/ui';
import { useUpdateGroup, useGroup, type UpdateGroupDto } from '@/features/groups';
import type { GroupScheduleEntry } from '../types';
import { useCenters } from '@/features/centers';
import { useTeachers } from '@/features/teachers';
import { useState, useEffect, Fragment, useMemo, useCallback, useRef, type TouchEvent } from 'react';
import { ApiError, getErrorMessage } from '@/shared/lib/api';
import { GroupCalendarScheduleSection } from './GroupCalendarScheduleSection';
import { GroupIconPicker } from './GroupIconPicker';
import { isGroupIconKey, type GroupIconKey } from '@ilona/types';
import {
  defaultMonthDateRange,
  normalizeGroupSchedulePayload,
  scheduleSlotsValidationError,
} from '../group-schedule-utils';
import { cn } from '@/shared/lib/utils';

type UpdateGroupFormData = {
  name?: string;
  level?: string;
  description?: string;
  centerId?: string;
  teacherId?: string;
  substituteTeacherId?: string;
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

const REGENERATE_CONFIRM_MESSAGE = 'GROUP_SCHEDULE_REGENERATION_CONFIRMATION_REQUIRED';

interface EditGroupFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string;
}

export function EditGroupForm({ open, onOpenChange, groupId }: EditGroupFormProps) {
  const tForm = useTranslations('groups.form');
  const tVal = useTranslations('groups.validation');
  const tCommon = useTranslations('common');

  const updateGroupSchema = useMemo(
    () =>
      z.object({
        name: z.string().min(2, tVal('nameMin')).max(100, tVal('nameMax')).optional(),
        level: z.string().max(50, tVal('levelMax')).optional().or(z.literal('')),
        description: z.string().max(500, tVal('descriptionMax')).optional().or(z.literal('')),
        centerId: z.string().min(1, tVal('centerRequired')).optional().or(z.literal('')),
        teacherId: z.string().optional().or(z.literal('')),
        substituteTeacherId: z.string().optional().or(z.literal('')),
      }),
    [tVal],
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
  const teachers = teachersData?.items || [];

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
    getValues,
  } = useForm<UpdateGroupFormData>({
    resolver,
    defaultValues: {
      name: '',
      level: '',
      description: '',
      centerId: '',
      teacherId: '',
      substituteTeacherId: '',
    },
  });
  const watchedTeacherId = watch('teacherId');

  // Update form when group data loads
  useEffect(() => {
    if (group) {
      reset({
        name: group.name,
        level: group.level || '',
        description: group.description || '',
        centerId: group.centerId,
        teacherId: group.teacherId || '',
        substituteTeacherId: group.substituteTeacherId || '',
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

  const requestClose = useCallback(() => {
    setIsDialogOpen(false);
    onOpenChange(false);
  }, [onOpenChange]);

  const isMobileViewport = () =>
    typeof window !== 'undefined' && window.matchMedia('(max-width: 639px)').matches;

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
      substituteTeacherId: data.substituteTeacherId ? data.substituteTeacherId : null,
      schedule: schedule.length > 0 ? schedule : null,
      calendarPlan,
      ...(confirmReplaceGeneratedLessons ? { confirmReplaceGeneratedLessons: true } : {}),
      iconKey,
    };
  };

  const persistGroup = async (data: UpdateGroupFormData, confirmReplace: boolean) => {
    if (
      data.substituteTeacherId &&
      data.teacherId &&
      data.substituteTeacherId === data.teacherId
    ) {
      setErrorMessage(tForm('substituteSameAsMain'));
      return;
    }

    if (schedule.length > 0) {
      if (!data.teacherId?.trim()) {
        setErrorMessage(tForm('selectMainTeacherForCalendar'));
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

  if (isLoading) {
    return (
      <DialogPrimitive.Root open={isDialogOpen} onOpenChange={(nextOpen) => !nextOpen && requestClose()}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
          <DialogPrimitive.Content
            style={dragStyle}
            className={cn(
              'fixed inset-x-0 bottom-[7px] top-auto z-50 grid w-full translate-y-0',
              'duration-700 ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out sm:duration-350 sm:ease-[cubic-bezier(0.22,1,0.36,1)]',
              'data-[state=open]:slide-in-from-bottom-full data-[state=closed]:slide-out-to-bottom-full',
              'h-[calc(94dvh+7px)] grid-rows-[auto_1fr] gap-0 overflow-hidden rounded-t-[22px] border border-slate-200 bg-[#f8f9fb] shadow-xl',
              'sm:inset-0 sm:m-auto sm:w-[95vw] sm:max-w-2xl sm:h-auto sm:max-h-[90vh] sm:translate-x-0 sm:translate-y-0 sm:rounded-2xl',
              'sm:data-[state=open]:fade-in-0 sm:data-[state=closed]:fade-out-0 sm:data-[state=open]:slide-in-from-bottom-0 sm:data-[state=closed]:slide-out-to-bottom-0'
            )}
            aria-describedby={undefined}
          >
            <div className="relative flex h-9 w-full items-center justify-center bg-[#f8f9fb] sm:hidden">
              <div
                className="absolute inset-x-0 -top-2 h-14"
                onTouchStart={handleDragStart}
                onTouchMove={handleDragMove}
                onTouchEnd={handleDragEnd}
                onTouchCancel={handleDragEnd}
              />
              <div className="h-1.5 w-14 rounded-full bg-slate-400" />
            </div>
            <DialogPrimitive.Title className="sr-only">{tForm('editTitle')}</DialogPrimitive.Title>
            <div className="overflow-y-auto px-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] pt-4 sm:p-6">
              <h2 className="text-lg font-semibold text-[#3b3b40]">{tForm('editTitle')}</h2>
              <p className="mt-1 text-sm text-[#8b8b90]">{tForm('loadingGroupData')}</p>
            </div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    );
  }

  return (
    <Fragment>
    <DialogPrimitive.Root open={isDialogOpen} onOpenChange={(nextOpen) => !nextOpen && requestClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          style={dragStyle}
          className={cn(
            'fixed inset-x-0 bottom-[7px] top-auto z-50 grid w-full translate-y-0',
            'duration-700 ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out sm:duration-350 sm:ease-[cubic-bezier(0.22,1,0.36,1)]',
            'data-[state=open]:slide-in-from-bottom-full data-[state=closed]:slide-out-to-bottom-full',
            'h-[calc(94dvh+7px)] grid-rows-[auto_1fr] gap-0 overflow-hidden rounded-t-[22px] border border-slate-200 bg-[#f8f9fb] shadow-xl',
            'sm:inset-0 sm:m-auto sm:w-[95vw] sm:max-w-2xl sm:h-auto sm:max-h-[90vh] sm:translate-x-0 sm:translate-y-0 sm:rounded-2xl',
            'sm:data-[state=open]:fade-in-0 sm:data-[state=closed]:fade-out-0 sm:data-[state=open]:slide-in-from-bottom-0 sm:data-[state=closed]:slide-out-to-bottom-0'
          )}
          aria-describedby={undefined}
        >
          <div className="relative flex h-9 w-full items-center justify-center bg-[#f8f9fb] sm:hidden">
            <div
              className="absolute inset-x-0 -top-2 h-14"
              onTouchStart={handleDragStart}
              onTouchMove={handleDragMove}
              onTouchEnd={handleDragEnd}
              onTouchCancel={handleDragEnd}
            />
            <div className="h-1.5 w-14 rounded-full bg-slate-400" />
          </div>
          <DialogPrimitive.Title className="sr-only">{tForm('editTitle')}</DialogPrimitive.Title>
          <div className="overflow-y-auto px-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] pt-4 sm:p-6">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-[#3b3b40]">{tForm('editTitle')}</h2>
              <p className="mt-1 text-sm text-[#8b8b90]">{tForm('editDescription')}</p>
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
            <Label id="edit-group-icon-label">{tForm('groupIcon')}</Label>
            <p className="text-xs text-slate-500">{tForm('iconHintEdit')}</p>
            <GroupIconPicker
              value={iconKey}
              onChange={setIconKey}
              disabled={isSubmitting}
              aria-labelledby="edit-group-icon-label"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">{tForm('description')}</Label>
            <textarea
              id="description"
              {...register('description')}
              rows={3}
              placeholder={tForm('descriptionPlaceholder')}
              disabled={isSubmitting}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm resize-none ${
                errors.description ? 'border-red-300' : 'border-slate-300'
              } ${isSubmitting ? 'bg-slate-100 cursor-not-allowed' : 'bg-white'}`}
            />
            {errors.description && (
              <p className="text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="centerId">
              {tCommon('center')} <span className="text-red-500">*</span>
            </Label>
            <select
              id="centerId"
              {...register('centerId')}
              disabled={isSubmitting || isLoadingCenters || centers.length === 0}
              className={`unified-native-select w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm ${
                errors.centerId ? 'border-red-300' : 'border-slate-300'
              } ${isSubmitting || isLoadingCenters || centers.length === 0 ? 'bg-slate-100 cursor-not-allowed' : 'bg-white'}`}
            >
              <option value="">{tForm('selectCenter')}</option>
              {centers.map((center) => (
                <option key={center.id} value={center.id}>
                  {center.name}
                </option>
              ))}
            </select>
            {errors.centerId && (
              <p className="text-sm text-red-600">{errors.centerId.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="teacherId">
              {tForm('mainTeacher')}{' '}
              {schedule.length > 0 ? (
                <span className="text-red-500">*</span>
              ) : (
                tForm('optional')
              )}
            </Label>
            <select
              id="teacherId"
              {...register('teacherId')}
              disabled={isSubmitting || updateGroup.isPending || isLoadingTeachers}
              className={`unified-native-select w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm ${
                errors.teacherId ? 'border-red-300' : 'border-slate-300'
              } ${isSubmitting || updateGroup.isPending || isLoadingTeachers ? 'bg-slate-100 cursor-not-allowed' : 'bg-white'}`}
            >
              <option value="">{tForm('noTeacherAssigned')}</option>
              {teachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.user.firstName} {teacher.user.lastName}
                </option>
              ))}
            </select>
            {errors.teacherId && (
              <p className="text-sm text-red-600">{errors.teacherId.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="substituteTeacherId">{tForm('substituteTeacherOptional')}</Label>
            <select
              id="substituteTeacherId"
              {...register('substituteTeacherId')}
              disabled={isSubmitting || updateGroup.isPending || isLoadingTeachers}
              className={`unified-native-select w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm ${
                errors.substituteTeacherId ? 'border-red-300' : 'border-slate-300'
              } ${isSubmitting || updateGroup.isPending || isLoadingTeachers ? 'bg-slate-100 cursor-not-allowed' : 'bg-white'}`}
            >
              <option value="">{tForm('noSubstitute')}</option>
              {teachers
                .filter((t) => t.id !== watchedTeacherId)
                .map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.user.firstName} {teacher.user.lastName}
                  </option>
                ))}
            </select>
          </div>

          <GroupCalendarScheduleSection
            schedule={schedule}
            onScheduleChange={setSchedule}
            dateFrom={dateFrom}
            dateTo={dateTo}
            onDateFromChange={setDateFrom}
            onDateToChange={setDateTo}
            disabled={isSubmitting || updateGroup.isPending}
          />

          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="ghost"
              onClick={requestClose}
              disabled={isSubmitting || updateGroup.isPending}
            >
              {tCommon('cancel')}
            </Button>
            <Button
              type="submit"
              disabled={
                isSubmitting ||
                updateGroup.isPending ||
                isLoadingCenters ||
                isLoadingTeachers ||
                centers.length === 0
              }
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {isSubmitting || updateGroup.isPending ? tForm('saving') : tForm('saveChanges')}
            </Button>
          </div>
        </form>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>

    <Dialog open={regenerateDialogOpen} onOpenChange={setRegenerateDialogOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{tForm('replaceLessonsTitle')}</DialogTitle>
          <DialogDescription>{tForm('replaceLessonsDescription')}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="ghost" onClick={() => setRegenerateDialogOpen(false)}>
            {tForm('goBack')}
          </Button>
          <Button type="button" className="bg-primary text-primary-foreground" onClick={onConfirmRegenerate}>
            {tForm('replaceAndSave')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </Fragment>
  );
}

