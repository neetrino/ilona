'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslations } from 'next-intl';
import { useUpdateTeacher, useTeacher, type UpdateTeacherDto } from '@/features/teachers';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { getErrorMessage } from '@/shared/lib/api';
import { useCenters } from '@/features/centers';
import {
  createOptionalExperienceYearsSchema,
  getExperienceYearsFromHireDate,
} from '@/features/teachers/utils/experience';
import { usePortalSheetDrag } from '@/shared/hooks/usePortalSheetDrag';
import type { EditTeacherFormProps, UpdateTeacherFormData } from './edit-teacher-form.types';

export function useEditTeacherForm({
  open,
  onOpenChange,
  teacherId,
}: EditTeacherFormProps) {
  const t = useTranslations('teachers');
  const tForm = useTranslations('teachers.form');
  const tVal = useTranslations('teachers.validation');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const updateTeacher = useUpdateTeacher();
  const { data: teacher, isLoading: isQueryLoading } = useTeacher(teacherId, open && Boolean(teacherId));
  const isLoadingTeacher =
    isQueryLoading || Boolean(teacher && teacher.id !== teacherId);
  const { data: centersData } = useCenters({ isActive: true, take: 100 }, open);
  const centers = centersData?.items ?? [];

  const updateTeacherSchema = useMemo(
    () =>
      z.object({
        firstName: z.string().min(2, tVal('firstNameMin')).max(50, tVal('firstNameMax')),
        lastName: z.string().min(2, tVal('lastNameMin')).max(50, tVal('lastNameMax')),
        phone: z.string().optional(),
        status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).optional(),
        hourlyRate: z.number().min(0, tVal('hourlyRateMin')).optional(),
        experienceYears: createOptionalExperienceYearsSchema(tVal),
        videoUrl: z
          .string()
          .trim()
          .max(500, tVal('videoUrlMax'))
          .url(tVal('videoUrlInvalid'))
          .optional()
          .or(z.literal('').transform(() => undefined)),
        centerIds: z.array(z.string()).optional(),
        workingDays: z.array(z.string()).optional(),
      }),
    [tVal],
  );

  const resolver = useMemo(() => zodResolver(updateTeacherSchema), [updateTeacherSchema]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
  } = useForm<UpdateTeacherFormData>({
    resolver,
    defaultValues: {
      firstName: '',
      lastName: '',
      phone: '',
      hourlyRate: 0,
      videoUrl: '',
      centerIds: [],
      workingDays: [],
    },
  });

  const selectedCenterIds = watch('centerIds') ?? [];
  const watchedStatus = watch('status') ?? 'ACTIVE';
  const isTeacherActive = teacher?.user?.status === 'ACTIVE';
  const isFormBusy = isSubmitting || updateTeacher.isPending || isLoadingTeacher;

  const toggleCenter = (centerId: string) => {
    const next = selectedCenterIds.includes(centerId)
      ? selectedCenterIds.filter((c) => c !== centerId)
      : [...selectedCenterIds, centerId];
    setValue('centerIds', next, { shouldDirty: true });
  };

  useEffect(() => {
    if (teacher && open && teacher.id === teacherId) {
      setValue('firstName', teacher.user.firstName || '');
      setValue('lastName', teacher.user.lastName || '');
      setValue('phone', teacher.user.phone || '');
      setValue('status', teacher.user.status);
      setValue('hourlyRate', teacher.hourlyRate || 0);
      const experienceYears = getExperienceYearsFromHireDate(teacher.hireDate);
      setValue('experienceYears', experienceYears ?? undefined);
      setValue('videoUrl', teacher.videoUrl ?? '');
      const linkedCenterIds = teacher.centerLinks?.map((l) => l.center.id) ?? [];
      setValue('centerIds', linkedCenterIds);
      setValue('workingDays', teacher.workingDays || []);
      setErrorMessage(null);
      setSuccessMessage(null);
    }
  }, [teacher, teacherId, open, setValue]);

  useEffect(() => {
    if (!open) {
      reset();
      setErrorMessage(null);
      setSuccessMessage(null);
    }
  }, [open, reset]);

  const requestClose = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  const { dragStyle, dragHandleProps, scrollContentProps, resetDrag } = usePortalSheetDrag({
    enabled: true,
    onClose: requestClose,
  });

  useEffect(() => {
    if (!open) {
      resetDrag();
    }
  }, [open, resetDrag]);

  const onSubmit = async (data: UpdateTeacherFormData) => {
    setErrorMessage(null);

    try {
      const payload: UpdateTeacherDto = {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone || undefined,
        status: data.status,
        hourlyRate: data.hourlyRate,
        experienceYears: data.experienceYears ?? null,
        videoUrl: data.videoUrl ? data.videoUrl : null,
        centerIds: data.centerIds ?? [],
        workingDays: data.workingDays && data.workingDays.length > 0 ? data.workingDays : undefined,
      };

      await updateTeacher.mutateAsync({ id: teacherId, data: payload });

      setSuccessMessage(tForm('updatedSuccess'));
      setErrorMessage(null);

      setTimeout(() => {
        onOpenChange(false);
        setSuccessMessage(null);
      }, 1500);
    } catch (error: unknown) {
      const message = getErrorMessage(error, tForm('failedUpdate'));
      setErrorMessage(message);
      setSuccessMessage(null);
    }
  };

  const handleCancel = () => {
    reset();
    requestClose();
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  return {
    t,
    tForm,
    teacher,
    open,
    requestClose,
    dragStyle,
    dragHandleProps,
    scrollContentProps,
    isLoadingTeacher,
    isFormBusy,
    isTeacherActive,
    isSubmitting,
    updateTeacher,
    handleSubmit,
    onSubmit,
    handleCancel,
    errorMessage,
    successMessage,
    register,
    errors,
    setValue,
    watchedStatus,
    centers,
    selectedCenterIds,
    toggleCenter,
  };
}
