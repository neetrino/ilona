'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslations } from 'next-intl';
import { useCreateGroup, type CreateGroupDto } from '@/features/groups';
import { useCenters } from '@/features/centers';
import { useTeachers } from '@/features/teachers';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { getErrorMessage } from '@/shared/lib/api';
import type { GroupIconKey } from '@ilona/types';
import { filterTeachersForCenter } from '../../lib/center-scoped-teachers';
import { DEFAULT_GROUP_LEVEL } from '../../lib/group-level-options';
import { useSheetStackZIndex } from '@/shared/lib/sheet-stack';
import { usePortalSheetDrag } from '@/shared/hooks/usePortalSheetDrag';
import type { CreateGroupFormData, CreateGroupFormProps } from './create-group-form.types';

export function useCreateGroupForm({ open, onOpenChange }: CreateGroupFormProps) {
  const tForm = useTranslations('groups.form');
  const tVal = useTranslations('groups.validation');
  const tCommon = useTranslations('common');

  const createGroupSchema = useMemo(
    () =>
      z
        .object({
          name: z.string().min(2, tVal('nameMin')).max(100, tVal('nameMax')),
          level: z.string().max(50, tVal('levelMax')).optional().or(z.literal('')),
          description: z.string().max(500, tVal('descriptionMax')).optional().or(z.literal('')),
          centerId: z.string().min(1, tVal('selectCenter')),
          teacherId: z.string().min(1, tForm('noTeacherAssigned')),
          secondTeacherId: z.string().min(1, tForm('noTeacherAssigned')),
        })
        .refine(
          (data) => data.teacherId !== data.secondTeacherId,
          {
            message: tForm('teachersMustDiffer'),
            path: ['secondTeacherId'],
          },
        ),
    [tVal, tForm],
  );

  const resolver = useMemo(() => zodResolver(createGroupSchema), [createGroupSchema]);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(open);
  const [iconKey, setIconKey] = useState<GroupIconKey | null>(null);
  const createGroup = useCreateGroup();

  const { data: centersData, isLoading: isLoadingCenters } = useCenters({
    isActive: undefined,
    take: 100,
  });
  const { data: teachersData, isLoading: isLoadingTeachers } = useTeachers({ status: 'ACTIVE' });

  const centers = useMemo(() => centersData?.items ?? [], [centersData?.items]);
  const defaultCenterId = centers[0]?.id ?? '';
  const teachers = useMemo(() => teachersData?.items ?? [], [teachersData?.items]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
    getValues,
  } = useForm<CreateGroupFormData>({
    resolver,
    defaultValues: {
      name: '',
      level: DEFAULT_GROUP_LEVEL,
      description: '',
      centerId: defaultCenterId,
      teacherId: '',
      secondTeacherId: '',
    },
  });

  const isFormBusy = isSubmitting || createGroup.isPending;
  const watchedTeacherId = watch('teacherId');
  const watchedCenterId = watch('centerId');
  const watchedSecondTeacherId = watch('secondTeacherId');
  const watchedLevel = watch('level') ?? DEFAULT_GROUP_LEVEL;

  const centerSegmentOptions = useMemo(
    () =>
      centers.map((center) => ({
        id: center.id,
        label: center.name,
      })),
    [centers],
  );

  const handleCenterChange = useCallback(
    (nextCenterId: string) => {
      const prevCenterId = watchedCenterId;
      setValue('centerId', nextCenterId, {
        shouldDirty: true,
        shouldValidate: true,
      });
      if (prevCenterId && prevCenterId !== nextCenterId) {
        setValue('teacherId', '', { shouldDirty: true, shouldValidate: true });
        setValue('secondTeacherId', '', { shouldDirty: true, shouldValidate: true });
      }
    },
    [watchedCenterId, setValue],
  );

  useEffect(() => {
    if (!open || isLoadingCenters || !defaultCenterId) return;
    if (!getValues('centerId')) {
      setValue('centerId', defaultCenterId, {
        shouldDirty: false,
        shouldValidate: true,
      });
    }
  }, [open, isLoadingCenters, defaultCenterId, getValues, setValue]);

  const hasCenterSelected = Boolean(watchedCenterId);
  const teachersForCenter = useMemo(
    () => filterTeachersForCenter(teachers, watchedCenterId),
    [teachers, watchedCenterId],
  );
  const teacherDropdownDisabled =
    isSubmitting || createGroup.isPending || isLoadingTeachers || !hasCenterSelected;
  const teacherPlaceholder = hasCenterSelected
    ? tForm('noTeacherAssigned')
    : tForm('selectCenterFirst');

  useEffect(() => {
    setIsDialogOpen(open);
  }, [open]);

  useEffect(() => {
    if (open) {
      reset({
        name: '',
        level: DEFAULT_GROUP_LEVEL,
        description: '',
        centerId: defaultCenterId,
        teacherId: '',
        secondTeacherId: '',
      });
      setIconKey(null);
      setErrorMessage(null);
      setSuccessMessage(null);
    }
  }, [open, reset, defaultCenterId]);

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

  const onSubmit = async (data: CreateGroupFormData) => {
    setErrorMessage(null);

    if (data.secondTeacherId?.trim() && data.teacherId === data.secondTeacherId) {
      setErrorMessage(tForm('teachersMustDiffer'));
      return;
    }

    try {
      const payload: CreateGroupDto = {
        name: data.name,
        level: data.level || undefined,
        description: data.description || undefined,
        centerId: data.centerId,
        teacherId: data.teacherId,
        secondTeacherId: data.secondTeacherId.trim(),
        ...(iconKey ? { iconKey } : {}),
      };

      await createGroup.mutateAsync(payload);

      setSuccessMessage(tForm('createdSuccess'));
      setErrorMessage(null);

      reset({
        name: '',
        level: DEFAULT_GROUP_LEVEL,
        description: '',
        centerId: defaultCenterId,
        teacherId: '',
        secondTeacherId: '',
      });
      setIconKey(null);
      setTimeout(() => {
        onOpenChange(false);
        setSuccessMessage(null);
      }, 1500);
    } catch (error: unknown) {
      const message = getErrorMessage(error, tForm('failedCreate'));
      setErrorMessage(message);
      setSuccessMessage(null);
    }
  };

  const { overlayStyle, contentStyle } = useSheetStackZIndex(isDialogOpen);

  return {
    tForm,
    tCommon,
    isDialogOpen,
    requestClose,
    overlayStyle,
    contentStyle,
    dragStyle,
    dragHandleProps,
    scrollContentProps,
    handleSubmit,
    onSubmit,
    register,
    errors,
    isSubmitting,
    setValue,
    successMessage,
    errorMessage,
    iconKey,
    setIconKey,
    createGroup,
    centers,
    centerSegmentOptions,
    watchedCenterId,
    watchedTeacherId,
    watchedSecondTeacherId,
    watchedLevel,
    handleCenterChange,
    teachersForCenter,
    teacherPlaceholder,
    teacherDropdownDisabled,
    isLoadingCenters,
    isLoadingTeachers,
    isFormBusy,
  };
}
