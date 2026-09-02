'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useCreateStudent } from '../../hooks/useStudents';
import { useGroups } from '@/features/groups';
import { useCenters } from '@/features/centers';
import { filterAssignableGroupsByCenter } from '../../lib/group-center-assignment';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { getErrorMessage } from '@/shared/lib/api';
import { usePortalSheetDrag } from '@/shared/hooks/usePortalSheetDrag';
import {
  createStudentWithConfirmSchema,
  type CreateStudentWithConfirmFormData,
} from '../../student-account-form.schema';
import { formDataToCreateStudentDto } from '../../student-account-form.payload';
import { resolveAgeFromDobAndManual } from '../../student-account-form.age';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { useSheetStackZIndex } from '@/shared/lib/sheet-stack';
import { getAddStudentFormDefaultValues } from './add-student-form.constants';
import type { AddStudentFormProps } from './add-student-form.types';

export function useAddStudentForm({ open, onOpenChange }: AddStudentFormProps) {
  const t = useTranslations('students');
  const tForm = useTranslations('students.form');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(open);
  const createStudent = useCreateStudent();
  const user = useAuthStore((s) => s.user);
  const isManager = user?.role === 'MANAGER';

  const { data: groupsData, isLoading: isLoadingGroups } = useGroups({ isActive: true });
  const { data: centersData, isLoading: isLoadingCenters } = useCenters({ isActive: true });
  const centers = useMemo(() => centersData?.items ?? [], [centersData?.items]);
  const defaultCenterId = centers[0]?.id ?? '';
  const allGroups = useMemo(() => groupsData?.items ?? [], [groupsData?.items]);
  const managerCenterLabel = useMemo(() => {
    if (!isManager || !user?.managerCenterId) return null;
    const name = centers.find((c) => c.id === user.managerCenterId)?.name;
    return name ?? 'Your assigned branch';
  }, [centers, isManager, user?.managerCenterId]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
    setValue,
    getValues,
  } = useForm<CreateStudentWithConfirmFormData>({
    resolver: zodResolver(createStudentWithConfirmSchema),
    defaultValues: getAddStudentFormDefaultValues(),
  });

  const watchedCenterId = watch('centerId') || '';
  const effectiveCenterId = useMemo(
    () => (isManager && user?.managerCenterId ? user.managerCenterId : watchedCenterId) || '',
    [isManager, user?.managerCenterId, watchedCenterId],
  );
  const watchedGroupId = watch('groupId') || '';
  const watchedDob = watch('dateOfBirth');
  const watchedManualAge = watch('manualAge');
  const computedAge = useMemo(
    () => resolveAgeFromDobAndManual(watchedDob, watchedManualAge),
    [watchedDob, watchedManualAge],
  );

  const groupsForCenter = useMemo(
    () => filterAssignableGroupsByCenter(allGroups, effectiveCenterId || undefined),
    [allGroups, effectiveCenterId],
  );

  useEffect(() => {
    if (!effectiveCenterId) {
      setValue('groupId', '');
      setValue('teacherId', '');
      return;
    }
    if (!watchedGroupId) return;
    const group = allGroups.find((g) => g.id === watchedGroupId);
    if (!group || group.centerId !== effectiveCenterId) {
      setValue('groupId', '');
      setValue('teacherId', '');
    }
  }, [effectiveCenterId, watchedGroupId, allGroups, setValue]);

  useEffect(() => {
    if (!watchedGroupId) {
      setValue('teacherId', '');
      return;
    }
    const group = allGroups.find((g) => g.id === watchedGroupId);
    if (group?.teacherId) {
      setValue('teacherId', group.teacherId);
      return;
    }
    setValue('groupId', '');
    setValue('teacherId', '');
  }, [watchedGroupId, allGroups, setValue]);

  const showParentSection = computedAge !== undefined && computedAge < 18;

  useEffect(() => {
    setIsDialogOpen(open);
  }, [open]);

  useEffect(() => {
    if (!open || isLoadingCenters || !defaultCenterId || isManager) return;
    if (!getValues('centerId')) {
      setValue('centerId', defaultCenterId, {
        shouldDirty: false,
        shouldValidate: true,
      });
    }
  }, [open, isLoadingCenters, defaultCenterId, getValues, setValue, isManager]);

  useEffect(() => {
    if (open) {
      reset(
        getAddStudentFormDefaultValues(
          isManager && user?.managerCenterId ? user.managerCenterId : defaultCenterId,
        ),
      );
      setErrorMessage(null);
      setSuccessMessage(null);
    }
  }, [open, reset, defaultCenterId, isManager, user?.managerCenterId]);

  const requestClose = useCallback(() => {
    setIsDialogOpen(false);
    onOpenChange(false);
  }, [onOpenChange]);

  const { dragStyle, dragHandleProps, scrollContentProps, resetDrag } = usePortalSheetDrag({
    enabled: isDialogOpen,
    onClose: requestClose,
  });

  useEffect(() => {
    if (!isDialogOpen) {
      resetDrag();
    }
  }, [isDialogOpen, resetDrag]);

  useEffect(() => {
    if (computedAge !== undefined && computedAge >= 18) {
      setValue('parentName', '');
      setValue('parentSurname', '');
      setValue('parentPhone', '');
      setValue('parentEmail', '');
    }
  }, [computedAge, setValue]);

  const onSubmit = async (data: CreateStudentWithConfirmFormData) => {
    setErrorMessage(null);
    try {
      const payload = formDataToCreateStudentDto(data);
      if (isManager) {
        delete payload.centerId;
      }
      await createStudent.mutateAsync(payload);
      setSuccessMessage(tForm('createdSuccess'));
      setErrorMessage(null);
      reset(
        getAddStudentFormDefaultValues(
          isManager && user?.managerCenterId ? user.managerCenterId : defaultCenterId,
        ),
      );
      setTimeout(() => {
        onOpenChange(false);
        setSuccessMessage(null);
      }, 1500);
    } catch (error: unknown) {
      setErrorMessage(getErrorMessage(error, tForm('failedCreate')));
      setSuccessMessage(null);
    }
  };

  const { overlayStyle, contentStyle } = useSheetStackZIndex(isDialogOpen);
  const isFormBusy = isSubmitting || createStudent.isPending;

  return {
    t,
    tForm,
    isDialogOpen,
    requestClose,
    overlayStyle,
    contentStyle,
    dragStyle,
    dragHandleProps,
    scrollContentProps,
    handleSubmit,
    onSubmit,
    errorMessage,
    successMessage,
    register,
    setValue,
    errors,
    watch,
    showParentSection,
    groupsForCenter,
    centers,
    isLoadingGroups,
    isLoadingCenters,
    isFormBusy,
    isSubmitting,
    createStudent,
    showCenterSelect: !isManager,
    managerCenterLabel: isManager ? managerCenterLabel : null,
    lockedCenterId: isManager ? user?.managerCenterId ?? null : null,
  };
}
