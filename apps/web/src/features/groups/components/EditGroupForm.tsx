'use client';


import * as DialogPrimitive from '@radix-ui/react-dialog';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslations } from 'next-intl';
import { Button, Input, Label, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, Checkbox } from '@/shared/components/ui';
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
import {
  ADMIN_FORM_INPUT_CLASS,
  ADMIN_ICON_BUTTON_SM_CLASS,
  ADMIN_OUTLINE_BUTTON_CLASS,
  ADMIN_PRIMARY_BUTTON_CLASS,
} from '@/shared/lib/admin-control-theme';
import {
  portalSheetLayerProps,
  stackedSheetDialogHandlers,
  useSheetStackZIndex,
  stackedSheetOverlayClassName,
} from '@/shared/lib/sheet-stack';
import { PORTAL_DESKTOP_SIDE_SHEET_CLASS } from '@/shared/lib/portal-form-sheet-classes';
import { SingleSelectDropdown, portaledDropdownDialogHandlers } from '@/shared/components/ui/single-select-dropdown';
import {
  filterTeachersForCenter,
  teacherOptionLabel,
} from '../lib/center-scoped-teachers';
import { X } from 'lucide-react';

type UpdateGroupFormData = {
  name?: string;
  level?: string;
  description?: string;
  centerId?: string;
  teacherId?: string;
  secondTeacherId?: string;
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
const ADMIN_TEXTAREA_CLASS = cn(ADMIN_FORM_INPUT_CLASS, 'h-auto min-h-[5.5rem] resize-none py-2');

interface EditGroupFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string;
  onToggleActive?: () => void;
  isStatusTogglePending?: boolean;
}

export function EditGroupForm({
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

  if (isLoading) {
    return (
      <DialogPrimitive.Root open={isDialogOpen} onOpenChange={(nextOpen) => !nextOpen && requestClose()}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay style={overlayStyle} {...portalSheetLayerProps} className={stackedSheetOverlayClassName('fixed inset-0 z-50 bg-black/60 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0', isBaseLayer)} />
          <DialogPrimitive.Content style={{ ...dragStyle, ...contentStyle }} {...stackedSheetDialogHandlers} {...portalSheetLayerProps}
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
            <DialogPrimitive.Title className="sr-only">{tForm('editTitle')}</DialogPrimitive.Title>
            <div className="shrink-0 bg-[#f8f9fb] px-4 pb-4 pt-3 min-[1367px]:px-6 min-[1367px]:pb-5 min-[1367px]:pt-6">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg font-semibold text-[#3b3b40]">{tForm('editTitle')}</h2>
                  <p className="mt-1 text-sm text-[#8b8b90]">{tForm('loadingGroupData')}</p>
                </div>
                <DialogPrimitive.Close
                  className={cn(ADMIN_ICON_BUTTON_SM_CLASS, 'hidden text-slate-500 hover:bg-slate-100 hover:text-slate-700 min-[1367px]:inline-flex')}
                  aria-label={tCommon('close')}
                >
                  <X className="h-4 w-4" />
                </DialogPrimitive.Close>
              </div>
            </div>
            <div className="min-h-0 overflow-y-auto overscroll-y-contain [touch-action:pan-y] [-webkit-overflow-scrolling:touch] px-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] min-[1367px]:px-6 min-[1367px]:pb-6" />
          </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    );
  }

  return (
    <Fragment>
    <DialogPrimitive.Root open={isDialogOpen} onOpenChange={(nextOpen) => !nextOpen && requestClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay style={overlayStyle} {...portalSheetLayerProps} className="fixed inset-0 z-50 bg-black/60 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content style={{ ...dragStyle, ...contentStyle }} {...stackedSheetDialogHandlers} {...portalSheetLayerProps}
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
          <DialogPrimitive.Title className="sr-only">{tForm('editTitle')}</DialogPrimitive.Title>
          <div className="shrink-0 bg-[#f8f9fb] px-4 pb-4 pt-3 min-[1367px]:px-6 min-[1367px]:pb-5 min-[1367px]:pt-6">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-semibold text-[#3b3b40]">{tForm('editTitle')}</h2>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                {onToggleActive ? (
                  <button
                    type="button"
                    role="switch"
                    aria-checked={isGroupActive}
                    aria-label={isGroupActive ? tGroups('deactivateGroup') : tGroups('activateGroup')}
                    disabled={isFormBusy}
                    onClick={onToggleActive}
                    className={cn(
                      'relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors focus:outline-none focus:ring-4 focus:ring-green-500/20 disabled:cursor-not-allowed disabled:opacity-50',
                      isGroupActive ? 'bg-green-500' : 'bg-[#f1f1f2]',
                    )}
                  >
                    <span
                      className={cn(
                        'pointer-events-none inline-block h-5 w-5 rounded-full border border-gray-300 bg-white transition-transform',
                        isGroupActive ? 'translate-x-5 border-white' : 'translate-x-0.5',
                      )}
                    />
                  </button>
                ) : null}
                <DialogPrimitive.Close
                  className={cn(ADMIN_ICON_BUTTON_SM_CLASS, 'hidden text-slate-500 hover:bg-slate-100 hover:text-slate-700 min-[1367px]:inline-flex')}
                  aria-label={tCommon('close')}
                >
                  <X className="h-4 w-4" />
                </DialogPrimitive.Close>
              </div>
            </div>
          </div>
          <div className="min-h-0 overflow-y-auto overscroll-y-contain [touch-action:pan-y] [-webkit-overflow-scrolling:touch] px-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] min-[1367px]:px-6 min-[1367px]:pb-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="min-w-0 space-y-2">
              <Label htmlFor="name">
                {tForm('groupName')} <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                className={ADMIN_FORM_INPUT_CLASS}
                {...register('name')}
                error={errors.name?.message}
                placeholder={tForm('namePlaceholder')}
                disabled={isSubmitting}
              />
            </div>

            <div className="min-w-0 space-y-2">
              <Label htmlFor="level">{tCommon('level')}</Label>
              <Input
                id="level"
                className={ADMIN_FORM_INPUT_CLASS}
                {...register('level')}
                error={errors.level?.message}
                placeholder={tForm('levelPlaceholder')}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label id="edit-group-icon-label">{tForm('groupIcon')}</Label>
            <p className="text-xs text-slate-500">{tForm('iconHintEdit')}</p>
            <GroupIconPicker
              value={iconKey}
              onChange={setIconKey}
              disabled={isSubmitting}
              adminControls
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
              className={cn(
                ADMIN_TEXTAREA_CLASS,
                errors.description ? 'border-red-300' : '',
                isSubmitting ? 'cursor-not-allowed bg-slate-100' : '',
              )}
            />
            {errors.description && (
              <p className="text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="centerId">
              {tCommon('center')} <span className="text-red-500">*</span>
            </Label>
            <input type="hidden" {...register('centerId')} />
            <SingleSelectDropdown
              id="centerId"
              triggerClassName={ADMIN_FORM_INPUT_CLASS}
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

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="min-w-0 space-y-2">
              <Label htmlFor="teacherId">
                {tForm('teacher1Main')} <span className="text-red-500">*</span>
              </Label>
              <input type="hidden" {...register('teacherId')} />
              <SingleSelectDropdown
                id="teacherId"
                triggerClassName={ADMIN_FORM_INPUT_CLASS}
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
            </div>

            <div className="min-w-0 space-y-2">
              <Label htmlFor="secondTeacherId">
                {tForm('teacher2')} <span className="text-red-500">*</span>
              </Label>
              <input type="hidden" {...register('secondTeacherId')} />
              <SingleSelectDropdown
                id="secondTeacherId"
                triggerClassName={ADMIN_FORM_INPUT_CLASS}
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
                  disabled={isFormBusy}
                  className="mt-0.5"
                />
                <span className="text-sm text-slate-600">{tForm('teacher2StartsFirstWeek')}</span>
              </label>
            </div>
          </div>

          {isLoadingTeachers && (
            <p className="text-sm text-slate-500">{tForm('loadingTeachers')}</p>
          )}

          <p className="text-xs text-slate-500">{tForm('teacherRotationHint')}</p>

          <GroupCalendarScheduleSection
            schedule={schedule}
            onScheduleChange={setSchedule}
            dateFrom={dateFrom}
            dateTo={dateTo}
            onDateFromChange={setDateFrom}
            onDateToChange={setDateTo}
            disabled={isSubmitting || updateGroup.isPending}
            adminControls
          />

          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              className={cn(ADMIN_OUTLINE_BUTTON_CLASS, 'border-[rgba(14,14,16,0.07)] hover:bg-slate-50')}
              onClick={requestClose}
              disabled={isFormBusy}
            >
              {tCommon('cancel')}
            </Button>
            <Button
              type="submit"
              disabled={
                isFormBusy ||
                isLoadingCenters ||
                isLoadingTeachers ||
                centers.length === 0
              }
              className={cn(ADMIN_PRIMARY_BUTTON_CLASS, 'bg-primary text-primary-foreground hover:bg-primary/90')}
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
      <DialogContent sheet={false} className="max-w-md rounded-[15px]">
        <DialogHeader>
          <DialogTitle>{tForm('replaceLessonsTitle')}</DialogTitle>
          <DialogDescription>{tForm('replaceLessonsDescription')}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            className={cn(ADMIN_OUTLINE_BUTTON_CLASS, 'border-[rgba(14,14,16,0.07)] hover:bg-slate-50')}
            onClick={() => setRegenerateDialogOpen(false)}
          >
            {tForm('goBack')}
          </Button>
          <Button
            type="button"
            className={cn(ADMIN_PRIMARY_BUTTON_CLASS, 'bg-primary text-primary-foreground hover:bg-primary/90')}
            onClick={onConfirmRegenerate}
          >
            {tForm('replaceAndSave')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </Fragment>
  );
}

