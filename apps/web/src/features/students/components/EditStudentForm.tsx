'use client';


import * as DialogPrimitive from '@radix-ui/react-dialog';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslations } from 'next-intl';
import { Button, Input, Label } from '@/shared/components/ui';
import { useUpdateStudent, useStudent, type UpdateStudentDto } from '@/features/students';
import { useGroups } from '@/features/groups';
import { useCenters } from '@/features/centers';
import { useState, useEffect, useMemo, useRef, type TouchEvent } from 'react';
import type { UserStatus } from '@/types';
import { getErrorMessage } from '@/shared/lib/api';
import { cn } from '@/shared/lib/utils';
import {
  portalSheetLayerProps,
  stackedSheetDialogHandlers,
  useSheetStackZIndex,
  stackedSheetOverlayClassName,
} from '@/shared/lib/sheet-stack';
import { PORTAL_DESKTOP_SIDE_SHEET_CLASS } from '@/shared/lib/portal-form-sheet-classes';
import { ADMIN_ICON_BUTTON_SM_CLASS } from '@/shared/lib/admin-control-theme';
import { X } from 'lucide-react';
import {
  ensureCurrentGroupInList,
  filterAssignableGroupsByCenter,
} from '../lib/group-center-assignment';
import {
  SingleSelectDropdown,
  portaledDropdownDialogHandlers,
} from '@/shared/components/ui/single-select-dropdown';
import { computeAgeFromDob } from '../student-account-form.schema';
import { isoToDmy, resolveDmyOrIsoToIso } from '@/shared/lib/dmy-date';
import { DmyDateInput } from '@/shared/components/ui/dmy-date-input';

const dmyInputClassName =
  'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';

type UpdateStudentFormData = {
  firstName: string;
  lastName: string;
  phone?: string;
  age?: number;
  dateOfBirth?: string;
  firstLessonDate?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  groupId?: string;
  teacherId?: string;
  centerId?: string;
  parentName?: string;
  parentPhone?: string;
  parentEmail?: string;
  parentPassportInfo?: string;
  monthlyFee: number;
  notes?: string;
  registerDate?: string;
};

interface EditStudentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: string;
}

export function EditStudentForm({ open, onOpenChange, studentId }: EditStudentFormProps) {
  const t = useTranslations('students');
  const tForm = useTranslations('students.form');
  const tVal = useTranslations('students.validation');
  const tCommon = useTranslations('common');
  const tStatus = useTranslations('status');
  const tSettings = useTranslations('settings');

  const updateStudentSchema = useMemo(
    () =>
      z.object({
        firstName: z.string().min(2, tVal('firstNameMin')).max(50, tVal('firstNameMax')),
        lastName: z.string().min(2, tVal('lastNameMin')).max(50, tVal('lastNameMax')),
        phone: z.string().max(50, tVal('phoneMax')).optional().or(z.literal('')),
        age: z
          .number()
          .int(tVal('ageInt'))
          .min(1, tVal('ageMin'))
          .max(120, tVal('ageMax'))
          .optional(),
        dateOfBirth: z.union([z.string(), z.literal('')]).optional(),
        firstLessonDate: z.union([z.string(), z.literal('')]).optional(),
        status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']),
        groupId: z.string().optional().or(z.literal('')),
        teacherId: z.string().optional().or(z.literal('')),
        centerId: z.string().optional().or(z.literal('')),
        parentName: z.string().max(100, tVal('parentNameMax')).optional().or(z.literal('')),
        parentPhone: z.string().max(50, tVal('parentPhoneMax')).optional().or(z.literal('')),
        parentEmail: z.string().email(tVal('invalidEmail')).optional().or(z.literal('')),
        parentPassportInfo: z.string().max(100, tVal('passportMax')).optional().or(z.literal('')),
        monthlyFee: z.number().min(0, tVal('monthlyFeeMin')),
        notes: z.string().max(500, tVal('notesMax')).optional().or(z.literal('')),
        registerDate: z.string().optional().or(z.literal('')),
      }),
    [tVal],
  );

  const resolver = useMemo(() => zodResolver(updateStudentSchema), [updateStudentSchema]);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [dragOffsetY, setDragOffsetY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isSettling, setIsSettling] = useState(false);
  const touchStartYRef = useRef<number | null>(null);
  const touchStartXRef = useRef<number | null>(null);
  const settleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const updateStudent = useUpdateStudent();
  const { data: student, isLoading: isLoadingStudent } = useStudent(studentId, open);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, dirtyFields },
    reset,
    watch,
    setValue,
  } = useForm<UpdateStudentFormData>({
    resolver,
    defaultValues: {
      firstName: '',
      lastName: '',
      phone: '',
      age: undefined,
      dateOfBirth: '',
      firstLessonDate: '',
      status: 'ACTIVE' as UserStatus,
      groupId: '',
      teacherId: '',
      centerId: '',
      parentName: '',
      parentPhone: '',
      parentEmail: '',
      parentPassportInfo: '',
      monthlyFee: 0,
      notes: '',
      registerDate: '',
    },
  });

  const watchedCenterId = watch('centerId') || '';
  const watchedGroupId = watch('groupId') || '';
  const watchedStatus = watch('status') || 'ACTIVE';
  const watchedDob = watch('dateOfBirth') ?? '';
  const watchedFirstLessonDate = watch('firstLessonDate') ?? '';
  const watchedAge = watch('age');
  const computedAge = useMemo(() => computeAgeFromDob(watchedDob), [watchedDob]);
  // Keep age field in sync with DOB, while still allowing legacy age-only records.
  useEffect(() => {
    if (computedAge !== undefined && computedAge !== watchedAge) {
      setValue('age', computedAge, { shouldDirty: true, shouldValidate: false });
    }
  }, [computedAge, watchedAge, setValue]);
  const effectiveAge = computedAge ?? watchedAge;
  const showParentSection = effectiveAge !== undefined && effectiveAge < 18;

  const { data: groupsData, isLoading: isLoadingGroups } = useGroups({ isActive: true });
  const { data: centersData, isLoading: isLoadingCenters } = useCenters({ isActive: true });
  const centers = centersData?.items ?? [];
  const allGroups = useMemo(() => groupsData?.items ?? [], [groupsData?.items]);
  const groupsForCenter = useMemo(() => {
    const filtered = filterAssignableGroupsByCenter(allGroups, watchedCenterId || undefined);
    return ensureCurrentGroupInList(filtered, watchedGroupId, allGroups);
  }, [allGroups, watchedCenterId, watchedGroupId]);

  useEffect(() => {
    if (!watchedCenterId) {
      setValue('groupId', '');
      setValue('teacherId', '');
      return;
    }
    if (!watchedGroupId) return;
    const group = allGroups.find((g) => g.id === watchedGroupId);
    if (!group || group.centerId !== watchedCenterId) {
      setValue('groupId', '');
      setValue('teacherId', '');
    }
  }, [watchedCenterId, watchedGroupId, allGroups, setValue]);

  useEffect(() => {
    if (!watchedGroupId) {
      setValue('teacherId', '');
      return;
    }
    const group = allGroups.find((g) => g.id === watchedGroupId);
    if (group?.teacherId) {
      setValue('teacherId', group.teacherId, { shouldDirty: true, shouldValidate: true });
      return;
    }
    setValue('groupId', '');
    setValue('teacherId', '');
  }, [watchedGroupId, allGroups, setValue]);

  const statusOptions = useMemo(
    () => [
      { id: 'ACTIVE', label: tStatus('active') },
      { id: 'INACTIVE', label: tStatus('inactive') },
      { id: 'SUSPENDED', label: tStatus('suspended') },
    ],
    [tStatus],
  );

  // Pre-fill form when student data is loaded
  useEffect(() => {
    if (student && open) {
      setValue('firstName', student.user?.firstName || '');
      setValue('lastName', student.user?.lastName || '');
      setValue('phone', student.user?.phone || '');
      setValue('age', student.age ?? undefined);
      setValue('dateOfBirth', isoToDmy(student.dateOfBirth));
      setValue('firstLessonDate', isoToDmy(student.firstLessonDate));
      setValue('status', student.user?.status || 'ACTIVE');
      setValue('teacherId', student.teacherId || '');
      setValue('groupId', student.groupId || '');
      setValue('centerId', student.centerId || '');
      setValue('parentName', student.parentName || '');
      setValue('parentPhone', student.parentPhone || '');
      setValue('parentEmail', student.parentEmail || '');
      setValue('parentPassportInfo', student.parentPassportInfo || '');
      setValue('monthlyFee', typeof student.monthlyFee === 'string' ? parseFloat(student.monthlyFee) || 0 : Number(student.monthlyFee || 0));
      setValue('notes', student.notes || '');
      setValue('registerDate', student.registerDate ? new Date(student.registerDate).toISOString().split('T')[0] : '');
      setErrorMessage(null);
      setSuccessMessage(null);
    }
  }, [student, open, setValue]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      reset();
      setErrorMessage(null);
      setSuccessMessage(null);
      setDragOffsetY(0);
      setIsDragging(false);
      setIsSettling(false);
    }
  }, [open, reset]);

  useEffect(() => {
    return () => {
      if (settleTimerRef.current) {
        clearTimeout(settleTimerRef.current);
      }
    };
  }, []);

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
      onOpenChange(false);
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

  const onSubmit = async (data: UpdateStudentFormData) => {
    setErrorMessage(null);

    try {
      const payload: UpdateStudentDto = {};

      if (dirtyFields.firstName) payload.firstName = data.firstName;
      if (dirtyFields.lastName) payload.lastName = data.lastName;
      if (dirtyFields.phone) payload.phone = data.phone || undefined;
      if (dirtyFields.age) payload.age = data.age;
      if (dirtyFields.dateOfBirth) {
        const trimmed = data.dateOfBirth?.trim();
        payload.dateOfBirth = trimmed ? resolveDmyOrIsoToIso(trimmed) ?? null : null;
      }
      if (dirtyFields.firstLessonDate) {
        const trimmed = data.firstLessonDate?.trim();
        payload.firstLessonDate = trimmed ? resolveDmyOrIsoToIso(trimmed) ?? null : null;
      }
      if (dirtyFields.status) payload.status = data.status;
      if (dirtyFields.groupId) payload.groupId = data.groupId?.trim() ? data.groupId.trim() : null;
      if (dirtyFields.centerId) payload.centerId = data.centerId?.trim() ? data.centerId.trim() : null;
      if (dirtyFields.parentName) payload.parentName = data.parentName || undefined;
      if (dirtyFields.parentPhone) payload.parentPhone = data.parentPhone || undefined;
      if (dirtyFields.parentEmail) payload.parentEmail = data.parentEmail || undefined;
      if (dirtyFields.parentPassportInfo) payload.parentPassportInfo = data.parentPassportInfo || undefined;
      if (dirtyFields.monthlyFee) payload.monthlyFee = data.monthlyFee;
      if (dirtyFields.notes) payload.notes = data.notes || undefined;
      if (dirtyFields.registerDate) payload.registerDate = data.registerDate?.trim() ? data.registerDate.trim() : null;

      // Nothing changed: just close without a redundant API call.
      if (Object.keys(payload).length === 0) {
        requestClose();
        return;
      }

      await updateStudent.mutateAsync({ id: studentId, data: payload });

      // Show success message
      setSuccessMessage(tForm('updatedSuccess'));
      setErrorMessage(null);

      // Close modal after a brief delay
      setTimeout(() => {
        requestClose();
        setSuccessMessage(null);
      }, 1500);
    } catch (error: unknown) {
      // Handle error
      const message = getErrorMessage(error, tForm('failedUpdate'));
      setErrorMessage(message);
      setSuccessMessage(null);
    }
  };

  const requestClose = () => {
    reset();
    onOpenChange(false);
    setErrorMessage(null);
    setSuccessMessage(null);
  };
  const { overlayStyle, contentStyle, isBaseLayer } = useSheetStackZIndex(open);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay style={overlayStyle} {...portalSheetLayerProps} className={stackedSheetOverlayClassName('fixed inset-0 z-50 bg-black/60 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0', isBaseLayer)} />
      <DialogPrimitive.Content style={{ ...dragStyle, ...contentStyle }} {...stackedSheetDialogHandlers} {...portalSheetLayerProps}
        onOpenAutoFocus={(event) => event.preventDefault()}
        className={cn(
          'fixed inset-x-0 bottom-[7px] top-auto z-50 grid w-full translate-y-0 lg:bottom-0 [@media(min-width:1024px)_and_(max-width:1366px)_and_(min-height:1000px)]:bottom-0',
          'duration-700 ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out min-[1367px]:duration-350 min-[1367px]:ease-[cubic-bezier(0.22,1,0.36,1)]',
          'data-[state=open]:slide-in-from-bottom-full data-[state=closed]:slide-out-to-bottom-full',
          'h-[calc(94dvh+7px)] [@media(min-width:1024px)_and_(max-width:1366px)_and_(min-height:1000px)]:h-[56dvh] grid-rows-[auto_1fr] gap-0 overflow-hidden rounded-t-[22px] border border-slate-200 bg-[#f8f9fb] shadow-xl',
          'min-[1367px]:grid-rows-[auto_1fr]',
          PORTAL_DESKTOP_SIDE_SHEET_CLASS,
        )}
        aria-describedby={undefined}
      >
        <div className="relative flex h-9 w-full items-center justify-center bg-[#f8f9fb] min-[1367px]:hidden">
          <div
            className="absolute inset-x-0 -top-2 h-14"
            style={{ touchAction: 'pan-y' }}
            onTouchStart={handleDragStart}
            onTouchMove={handleDragMove}
            onTouchEnd={handleDragEnd}
            onTouchCancel={handleDragEnd}
          />
          <div className="h-1.5 w-14 rounded-full bg-slate-400" />
        </div>
        <DialogPrimitive.Title className="sr-only">{tForm('editTitle')}</DialogPrimitive.Title>
        <div className="hidden min-[1367px]:flex shrink-0 items-center justify-end bg-[#f8f9fb] px-2 pt-2">
          <DialogPrimitive.Close
            className={`${ADMIN_ICON_BUTTON_SM_CLASS} text-slate-500 hover:bg-slate-100 hover:text-slate-700`}
            aria-label={tCommon('close')}
          >
            <X className="h-4 w-4" />
          </DialogPrimitive.Close>
        </div>
        <div className="min-h-0 overflow-y-auto overflow-x-hidden overscroll-y-contain [touch-action:pan-y] [-webkit-overflow-scrolling:touch] px-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] pt-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden min-[1367px]:px-6 min-[1367px]:pb-6 min-[1367px]:pt-2">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-[#3b3b40]">{tForm('editTitle')}</h2>
            <p className="mt-1 text-sm text-[#8b8b90]">{tForm('editDescription')}</p>
          </div>

        {isLoadingStudent ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          </div>
        ) : (
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">
                  {tCommon('firstName')} <span className="text-red-500">{tForm('requiredMark')}</span>
                </Label>
                <Input
                  id="firstName"
                  {...register('firstName')}
                  error={errors.firstName?.message}
                  placeholder={tForm('firstNamePlaceholder')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">
                  {tCommon('lastName')} <span className="text-red-500">{tForm('requiredMark')}</span>
                </Label>
                <Input
                  id="lastName"
                  {...register('lastName')}
                  error={errors.lastName?.message}
                  placeholder={tForm('lastNamePlaceholder')}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">{tCommon('phone')}</Label>
              <Input
                id="phone"
                type="tel"
                {...register('phone')}
                error={errors.phone?.message}
                placeholder={t('phonePlaceholder')}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">{t('dateOfBirth')}</Label>
                <DmyDateInput
                  id="dateOfBirth"
                  value={watchedDob}
                  placeholder={tForm('dateOfBirthPlaceholder')}
                  onChange={(value) =>
                    setValue('dateOfBirth', value, { shouldDirty: true, shouldValidate: true })
                  }
                  className={dmyInputClassName}
                  disabled={isSubmitting}
                />
                {errors.dateOfBirth && (
                  <p className="text-sm text-red-600">{errors.dateOfBirth.message}</p>
                )}
                {effectiveAge !== undefined ? (
                  <p className="text-xs text-slate-500">{tForm('ageHint', { age: effectiveAge })}</p>
                ) : (
                  <p className="hidden text-xs text-slate-500 min-[1367px]:block" aria-hidden>
                    {'\u00A0'}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="firstLessonDate">{tForm('firstLessonDate')}</Label>
                <DmyDateInput
                  id="firstLessonDate"
                  value={watchedFirstLessonDate}
                  placeholder={tForm('firstLessonDatePlaceholder')}
                  onChange={(value) =>
                    setValue('firstLessonDate', value, { shouldDirty: true, shouldValidate: true })
                  }
                  className={dmyInputClassName}
                  disabled={isSubmitting}
                />
                {errors.firstLessonDate && (
                  <p className="text-sm text-red-600">{errors.firstLessonDate.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-[minmax(9rem,34%)_minmax(0,1fr)] items-start gap-4 min-[1367px]:grid-cols-2">
              <div className="min-w-0 space-y-2">
                <Label htmlFor="status">{tCommon('status')}</Label>
                <input type="hidden" {...register('status')} />
                <SingleSelectDropdown
                  id="status"
                  options={statusOptions}
                  value={watchedStatus}
                  onValueChange={(nextValue) =>
                    setValue('status', (nextValue as UserStatus) ?? 'ACTIVE', {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                  }
                />
                {errors.status && (
                  <p className="text-sm text-red-600">{errors.status.message}</p>
                )}
              </div>

              <div className="min-w-0 space-y-2">
                <Label htmlFor="centerId">{tCommon('center')}</Label>
                <input type="hidden" {...register('centerId')} />
                <SingleSelectDropdown
                  id="centerId"
                  options={[
                    { id: '', label: tCommon('notAssigned') },
                    ...centers.map((center) => ({
                      id: center.id,
                      label: center.name,
                    })),
                  ]}
                  value={watchedCenterId}
                  onValueChange={(nextValue) => {
                    setValue('centerId', nextValue ?? '', { shouldDirty: true, shouldValidate: true });
                    setValue('groupId', '', { shouldDirty: true, shouldValidate: true });
                    setValue('teacherId', '', { shouldDirty: true, shouldValidate: true });
                  }}
                  disabled={isLoadingCenters || isSubmitting}
                />
                {errors.centerId && (
                  <p className="text-sm text-red-600">{errors.centerId.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="groupId">{t('group')}</Label>
              <input type="hidden" {...register('teacherId')} />
              <input type="hidden" {...register('groupId')} />
              <SingleSelectDropdown
                id="groupId"
                options={[
                  {
                    id: '',
                    label: watchedCenterId
                      ? isLoadingGroups
                        ? tCommon('loading')
                        : groupsForCenter.length === 0
                          ? tForm('noGroupsForCenter')
                          : t('selectGroup')
                      : tForm('selectCenterFirst'),
                  },
                  ...groupsForCenter.map((group) => ({
                    id: group.id,
                    label: `${group.name}${group.level ? ` (${group.level})` : ''}`,
                  })),
                ]}
                value={watchedGroupId}
                onValueChange={(nextValue) =>
                  setValue('groupId', nextValue ?? '', {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
                disabled={isLoadingGroups || isSubmitting || !watchedCenterId}
              />
              {errors.groupId && (
                <p className="text-sm text-red-600">{errors.groupId.message}</p>
              )}
              {watchedCenterId && !isLoadingGroups && groupsForCenter.length === 0 && (
                <p className="text-sm text-slate-500">{tForm('noGroupsForCenter')}</p>
              )}
              {watchedCenterId && isLoadingGroups && (
                <p className="text-sm text-slate-500">{tCommon('loading')}</p>
              )}
              {watchedGroupId ? (
                <p className="text-xs text-slate-500">
                  {tCommon('center')}:{' '}
                  {groupsForCenter.find((g) => g.id === watchedGroupId)?.center?.name ?? t('notAvailable')}
                </p>
              ) : null}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="monthlyFee">
                  {t('monthlyFeeLabel')} (֏) <span className="text-red-500">{tForm('requiredMark')}</span>
                </Label>
                <Input
                  id="monthlyFee"
                  type="number"
                  step="0.01"
                  min="0"
                  {...register('monthlyFee', { valueAsNumber: true })}
                  error={errors.monthlyFee?.message}
                  placeholder="50000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="registerDate">{t('registerDateLabel')}</Label>
                <Input
                  id="registerDate"
                  type="date"
                  {...register('registerDate')}
                  error={errors.registerDate?.message}
                />
              </div>
            </div>

            {showParentSection && (
            <div className="border-t pt-4">
              <h3 className="mb-4 text-sm font-semibold text-[#1010a3]">
                {tForm('parentDetailsSection')}
              </h3>

              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 min-[1367px]:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="parentName">{t('parentName')}</Label>
                    <Input
                      id="parentName"
                      {...register('parentName')}
                      error={errors.parentName?.message}
                      placeholder={tForm('firstNamePlaceholder')}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="parentPhone">{t('parentPhone')}</Label>
                    <Input
                      id="parentPhone"
                      type="tel"
                      {...register('parentPhone')}
                      error={errors.parentPhone?.message}
                      placeholder={t('phonePlaceholder')}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 min-[1367px]:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="parentEmail">{t('parentEmail')}</Label>
                    <Input
                      id="parentEmail"
                      type="email"
                      {...register('parentEmail')}
                      error={errors.parentEmail?.message}
                      placeholder={tForm('emailPlaceholder')}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="parentPassportInfo">{tForm('parentPassportInfo')}</Label>
                    <Input
                      id="parentPassportInfo"
                      {...register('parentPassportInfo')}
                      error={errors.parentPassportInfo?.message}
                      placeholder={tForm('parentPassportInfo')}
                    />
                  </div>
                </div>
              </div>
            </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="notes">{t('notes')}</Label>
              <textarea
                id="notes"
                {...register('notes')}
                rows={4}
                className="flex w-full rounded-md border border-[rgba(14,14,16,0.12)] bg-white px-3 py-2 text-sm text-[#3b3b40] placeholder:text-[#8b8b90] transition-colors hover:border-[rgba(14,14,16,0.2)] focus-visible:border-[#1010a3]/45 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#1010a3]/10 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder={t('notes')}
              />
              {errors.notes && (
                <p className="text-sm text-red-600">{errors.notes.message}</p>
              )}
            </div>

            <div className="flex flex-col-reverse gap-2 pt-2 min-[1367px]:flex-row min-[1367px]:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={requestClose}
                disabled={isSubmitting || updateStudent.isPending}
              >
                {tCommon('cancel')}
              </Button>
              <Button type="submit" isLoading={isSubmitting || updateStudent.isPending}>
                {isSubmitting || updateStudent.isPending ? tSettings('saving') : tSettings('saveChanges')}
              </Button>
            </div>
          </form>
        )}
        </div>
      </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
