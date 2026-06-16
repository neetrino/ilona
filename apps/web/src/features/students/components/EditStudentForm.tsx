'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslations } from 'next-intl';
import { Button, Input, Label, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/shared/components/ui';
import { useUpdateStudent, useStudent, type UpdateStudentDto } from '@/features/students';
import { useGroups } from '@/features/groups';
import { useTeachers } from '@/features/teachers';
import { useCenters } from '@/features/centers';
import { useState, useEffect, useMemo, useRef, type TouchEvent } from 'react';
import type { UserStatus } from '@/types';
import { getErrorMessage } from '@/shared/lib/api';
import { cn, formatPhoneForDisplay } from '@/shared/lib/utils';
import { teacherBelongsToCenter } from '../lib/center-scoped-assignment';

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function computeAgeFromDob(dob: string | undefined): number | undefined {
  if (!dob || !ISO_DATE_RE.test(dob)) return undefined;
  const birth = new Date(`${dob}T00:00:00Z`);
  if (Number.isNaN(birth.getTime())) return undefined;
  const now = new Date();
  let age = now.getUTCFullYear() - birth.getUTCFullYear();
  const m = now.getUTCMonth() - birth.getUTCMonth();
  if (m < 0 || (m === 0 && now.getUTCDate() < birth.getUTCDate())) age -= 1;
  return age >= 0 && age <= 120 ? age : undefined;
}

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
  receiveReports?: boolean;
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
        dateOfBirth: z
          .union([z.string().regex(ISO_DATE_RE, tVal('dateFormat')), z.literal('')])
          .optional(),
        firstLessonDate: z
          .union([z.string().regex(ISO_DATE_RE, tVal('dateFormat')), z.literal('')])
          .optional(),
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
        receiveReports: z.boolean().optional(),
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
      receiveReports: false,
      registerDate: '',
    },
  });

  const watchedCenterId = watch('centerId') || '';
  const watchedTeacherId = watch('teacherId') || '';
  const watchedGroupId = watch('groupId') || '';
  const watchedDob = watch('dateOfBirth');
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

  const { data: teachersData, isLoading: isLoadingTeachers } = useTeachers({ status: 'ACTIVE' });
  const { data: groupsData, isLoading: isLoadingGroups } = useGroups({ isActive: true });
  const { data: centersData, isLoading: isLoadingCenters } = useCenters({ isActive: true });
  const teachers = useMemo(() => teachersData?.items ?? [], [teachersData?.items]);
  const centers = centersData?.items ?? [];
  const assignmentGroups = useMemo(() => groupsData?.items ?? [], [groupsData?.items]);
  const teachersForCenter = useMemo(() => {
    if (!watchedCenterId) return [];
    let list = teachers.filter((t) =>
      teacherBelongsToCenter(t.id, watchedCenterId, t.centerLinks, assignmentGroups),
    );
    if (watchedTeacherId && !list.some((t) => t.id === watchedTeacherId)) {
      const current = teachers.find((t) => t.id === watchedTeacherId);
      if (current) list = [current, ...list];
    }
    return list;
  }, [assignmentGroups, teachers, watchedCenterId, watchedTeacherId]);
  const groupsForTeacher = useMemo(() => {
    const all = groupsData?.items ?? [];
    if (!watchedTeacherId) return [];
    let list = all.filter((g) => g.teacherId === watchedTeacherId);
    if (watchedCenterId) {
      list = list.filter((g) => g.centerId === watchedCenterId);
    }
    if (watchedGroupId && !list.some((g) => g.id === watchedGroupId)) {
      const current = all.find((g) => g.id === watchedGroupId);
      if (current) list = [current, ...list];
    }
    return list;
  }, [groupsData?.items, watchedTeacherId, watchedCenterId, watchedGroupId]);

  useEffect(() => {
    if (!watchedTeacherId) {
      setValue('groupId', '');
      return;
    }
    if (!watchedGroupId) return;
    const g = groupsData?.items?.find((x) => x.id === watchedGroupId);
    if (!g) return;
    if (g.teacherId !== watchedTeacherId) {
      setValue('groupId', '');
      return;
    }
    if (watchedCenterId && g.centerId !== watchedCenterId) {
      setValue('groupId', '');
    }
  }, [
    watchedTeacherId,
    watchedGroupId,
    watchedCenterId,
    groupsData?.items,
    setValue,
  ]);

  const selectedTeacher = useMemo(
    () => teachers.find((t) => t.id === watchedTeacherId),
    [teachers, watchedTeacherId],
  );
  const teacherCentersLabel = useMemo(() => {
    const fromLinks = (selectedTeacher?.centerLinks ?? [])
      .map((l) => l.center.name)
      .filter(Boolean);
    const fromGroups = [
      ...new Set(groupsForTeacher.map((g) => g.center?.name).filter(Boolean)),
    ];
    return [...new Set([...fromLinks, ...fromGroups])].join(', ');
  }, [selectedTeacher, groupsForTeacher]);

  const selectFieldClass =
    'unified-native-select flex w-full rounded-md border border-[rgba(14,14,16,0.12)] bg-white px-3 py-2 text-sm text-[#3b3b40] placeholder:text-[#8b8b90] transition-colors hover:border-[rgba(14,14,16,0.2)] focus-visible:border-[#1010a3]/45 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#1010a3]/10 disabled:cursor-not-allowed disabled:opacity-50';

  const { onChange: onCenterChangeField, ...centerIdFieldRest } = register('centerId');

  // Pre-fill form when student data is loaded
  useEffect(() => {
    if (student && open) {
      setValue('firstName', student.user?.firstName || '');
      setValue('lastName', student.user?.lastName || '');
      setValue('phone', student.user?.phone || '');
      setValue('age', student.age ?? undefined);
      setValue(
        'dateOfBirth',
        student.dateOfBirth ? new Date(student.dateOfBirth).toISOString().split('T')[0] : '',
      );
      setValue(
        'firstLessonDate',
        student.firstLessonDate ? new Date(student.firstLessonDate).toISOString().split('T')[0] : '',
      );
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
      setValue('receiveReports', student.receiveReports ?? true);
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
        payload.dateOfBirth = data.dateOfBirth?.trim() ? data.dateOfBirth.trim() : null;
      }
      if (dirtyFields.firstLessonDate) {
        payload.firstLessonDate = data.firstLessonDate?.trim()
          ? data.firstLessonDate.trim()
          : null;
      }
      if (dirtyFields.status) payload.status = data.status;
      if (dirtyFields.groupId) payload.groupId = data.groupId?.trim() ? data.groupId.trim() : null;
      if (dirtyFields.teacherId) payload.teacherId = data.teacherId?.trim() ? data.teacherId.trim() : null;
      if (dirtyFields.centerId) payload.centerId = data.centerId?.trim() ? data.centerId.trim() : null;
      if (dirtyFields.parentName) payload.parentName = data.parentName || undefined;
      if (dirtyFields.parentPhone) payload.parentPhone = data.parentPhone || undefined;
      if (dirtyFields.parentEmail) payload.parentEmail = data.parentEmail || undefined;
      if (dirtyFields.parentPassportInfo) payload.parentPassportInfo = data.parentPassportInfo || undefined;
      if (dirtyFields.monthlyFee) payload.monthlyFee = data.monthlyFee;
      if (dirtyFields.notes) payload.notes = data.notes || undefined;
      if (dirtyFields.receiveReports) payload.receiveReports = data.receiveReports;
      if (dirtyFields.registerDate) payload.registerDate = data.registerDate?.trim() ? data.registerDate.trim() : null;

      // Nothing changed: just close without a redundant API call.
      if (Object.keys(payload).length === 0) {
        onOpenChange(false);
        return;
      }

      await updateStudent.mutateAsync({ id: studentId, data: payload });

      // Show success message
      setSuccessMessage(tForm('updatedSuccess'));
      setErrorMessage(null);

      // Close modal after a brief delay
      setTimeout(() => {
        onOpenChange(false);
        setSuccessMessage(null);
      }, 1500);
    } catch (error: unknown) {
      // Handle error
      const message = getErrorMessage(error, tForm('failedUpdate'));
      setErrorMessage(message);
      setSuccessMessage(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        style={dragStyle}
        onOpenAutoFocus={(event) => event.preventDefault()}
        className={cn(
          'bottom-[7px] left-0 top-auto z-50 w-full max-w-none translate-x-0 translate-y-0 overflow-hidden rounded-t-[22px] border border-slate-200 bg-[#f8f9fb] p-0 [&>button]:hidden',
          'duration-700 ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out',
          'data-[state=open]:slide-in-from-bottom-full data-[state=closed]:slide-out-to-bottom-full',
          'h-[calc(94dvh+7px)]',
          'sm:left-[50%] sm:top-[50%] sm:h-auto sm:max-h-[90vh] sm:max-w-2xl sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-lg sm:border sm:bg-background sm:p-6'
        )}
      >
        <div className="relative flex h-9 w-full items-center justify-center bg-[#f8f9fb] sm:hidden">
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
        <div className="overflow-y-auto overflow-x-hidden px-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] pt-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden sm:px-0 sm:pb-0 sm:pt-0">
          <DialogHeader>
            <DialogTitle>{tForm('editTitle')}</DialogTitle>
            <DialogDescription>{tForm('editDescription')}</DialogDescription>
          </DialogHeader>

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

            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">{t('dateOfBirth')}</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  {...register('dateOfBirth')}
                  error={errors.dateOfBirth?.message}
                />
                {effectiveAge !== undefined && (
                  <p className="text-xs text-slate-500">{tForm('ageHint', { age: effectiveAge })}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="firstLessonDate">{tForm('firstLessonDate')}</Label>
                <Input
                  id="firstLessonDate"
                  type="date"
                  {...register('firstLessonDate')}
                  error={errors.firstLessonDate?.message}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">{tCommon('status')}</Label>
              <select
                id="status"
                {...register('status')}
                className={selectFieldClass}
              >
                <option value="ACTIVE">{tStatus('active')}</option>
                <option value="INACTIVE">{tStatus('inactive')}</option>
                <option value="SUSPENDED">{tStatus('suspended')}</option>
              </select>
              {errors.status && (
                <p className="text-sm text-red-600">{errors.status.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="centerId">{tCommon('center')}</Label>
              <select
                id="centerId"
                {...centerIdFieldRest}
                className={selectFieldClass}
                disabled={isLoadingCenters || isSubmitting}
                onChange={(e) => {
                  onCenterChangeField(e);
                  setValue('teacherId', '', { shouldDirty: true });
                  setValue('groupId', '', { shouldDirty: true });
                }}
              >
                <option value="">{tCommon('notAssigned')}</option>
                {centers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {errors.centerId && (
                <p className="text-sm text-red-600">{errors.centerId.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="teacherId">{t('teacher')}</Label>
                <select
                  id="teacherId"
                  {...register('teacherId')}
                  className={selectFieldClass}
                  disabled={isLoadingTeachers || isSubmitting || !watchedCenterId}
                >
                  <option value="">
                    {watchedCenterId ? t('selectTeacher') : tForm('selectCenter')}
                  </option>
                  {teachersForCenter.map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.user.firstName} {teacher.user.lastName}
                      {teacher.user.phone ? ` - ${formatPhoneForDisplay(teacher.user.phone)}` : ''}
                    </option>
                  ))}
                </select>
                {errors.teacherId && (
                  <p className="text-sm text-red-600">{errors.teacherId.message}</p>
                )}
                {isLoadingTeachers && (
                  <p className="text-sm text-slate-500">{t('loadingTeachers')}</p>
                )}
                {watchedTeacherId && teacherCentersLabel ? (
                  <p className="text-xs text-slate-500">
                    {tForm('teacherCenters')}: {teacherCentersLabel}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="groupId">{t('group')}</Label>
                <select
                  id="groupId"
                  {...register('groupId')}
                  className={selectFieldClass}
                  disabled={isLoadingGroups || isSubmitting || !watchedTeacherId}
                >
                  <option value="">
                    {watchedTeacherId ? t('selectGroup') : t('selectTeacherFirst')}
                  </option>
                  {groupsForTeacher.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name} {group.level ? `(${group.level})` : ''}
                    </option>
                  ))}
                </select>
                {errors.groupId && (
                  <p className="text-sm text-red-600">{errors.groupId.message}</p>
                )}
                {watchedTeacherId && isLoadingGroups && (
                  <p className="text-sm text-slate-500">{tCommon('loading')}</p>
                )}
                {watchedGroupId ? (
                  <p className="text-xs text-slate-500">
                    {tCommon('center')}:{' '}
                    {groupsForTeacher.find((g) => g.id === watchedGroupId)?.center?.name ?? t('notAvailable')}
                  </p>
                ) : null}
              </div>
            </div>

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

            {showParentSection && (
            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold text-slate-800 mb-4">
                {tForm('parentDetailsSection')}
              </h3>

              <div className="space-y-4">
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

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="receiveReports"
                {...register('receiveReports')}
                className="h-4 w-4 rounded border-slate-300 accent-[#1010a3] focus:ring-[#1010a3]/30"
              />
              <Label htmlFor="receiveReports" className="text-sm font-normal cursor-pointer">
                {t('receiveReportsOn')}
              </Label>
            </div>

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  reset();
                  onOpenChange(false);
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                disabled={isSubmitting || updateStudent.isPending}
              >
                {tCommon('cancel')}
              </Button>
              <Button type="submit" isLoading={isSubmitting || updateStudent.isPending}>
                {isSubmitting || updateStudent.isPending ? tSettings('saving') : tSettings('saveChanges')}
              </Button>
            </DialogFooter>
          </form>
        )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
