'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslations } from 'next-intl';
import { useUpdateStudent, useStudent, type UpdateStudentDto } from '@/features/students';
import { useGroups } from '@/features/groups';
import { useCenters } from '@/features/centers';
import { useState, useEffect, useMemo, useRef, type TouchEvent } from 'react';
import type { UserStatus } from '@/types';
import { getErrorMessage } from '@/shared/lib/api';
import {
  portalSheetLayerProps,
  stackedSheetDialogHandlers,
  useSheetStackZIndex,
  stackedSheetOverlayClassName,
} from '@/shared/lib/sheet-stack';
import {
  ensureCurrentGroupInList,
  filterAssignableGroupsByCenter,
} from '../../lib/group-center-assignment';
import { computeAgeFromDob } from '../../student-account-form.schema';
import { isoToDmy, resolveDmyOrIsoToIso } from '@/shared/lib/dmy-date';
import type { EditStudentFormProps, UpdateStudentFormData } from './edit-student-form.types';

export function useEditStudentForm({ open, onOpenChange, studentId }: EditStudentFormProps) {

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
  return {
    t,
    tForm,
    tVal,
    tCommon,
    tStatus,
    tSettings,
    updateStudentSchema,
    resolver,
    errorMessage,
    setErrorMessage,
    successMessage,
    setSuccessMessage,
    dragOffsetY,
    isDragging,
    isSettling,
    updateStudent,
    student,
    isLoadingStudent,
    register,
    handleSubmit,
    errors,
    isSubmitting,
    dirtyFields,
    reset,
    watch,
    setValue,
    watchedCenterId,
    watchedGroupId,
    watchedStatus,
    watchedDob,
    watchedFirstLessonDate,
    watchedAge,
    computedAge,
    effectiveAge,
    showParentSection,
    groupsForCenter,
    allGroups,
    centers,
    statusOptions,
    isLoadingGroups,
    isLoadingCenters,
    handleDragStart,
    handleDragMove,
    handleDragEnd,
    dragStyle,
    onSubmit,
    requestClose,
    overlayStyle,
    contentStyle,
    isBaseLayer,
    open,
    onOpenChange,
  };
}
