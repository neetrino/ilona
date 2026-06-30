'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslations } from 'next-intl';
import { useUpdateGroup, useGroup, type UpdateGroupDto } from '@/features/groups';
import { useCenters } from '@/features/centers';
import { useTeachers } from '@/features/teachers';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { getErrorMessage } from '@/shared/lib/api';
import { isGroupIconKey, type GroupIconKey } from '@ilona/types';
import { filterTeachersForCenter } from '../../lib/center-scoped-teachers';
import { useSheetStackZIndex } from '@/shared/lib/sheet-stack';
import { usePortalSheetDrag } from '@/shared/hooks/usePortalSheetDrag';
import type { EditGroupFormProps, UpdateGroupFormData } from './edit-group-form.types';

export function useEditGroupForm({
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
          teacherId: z.string().min(1, tForm('noTeacherAssigned')),
          secondTeacherId: z.string().optional().or(z.literal('')),
        })
        .refine(
          (data) => !data.secondTeacherId?.trim() || data.teacherId !== data.secondTeacherId,
          {
            message: tForm('teachersMustDiffer'),
            path: ['secondTeacherId'],
          },
        ),
    [tVal, tForm],
  );

  const resolver = useMemo(() => zodResolver(updateGroupSchema), [updateGroupSchema]);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(open);
  const [iconKey, setIconKey] = useState<GroupIconKey | null>(null);
  const updateGroup = useUpdateGroup();
  const { data: group, isLoading } = useGroup(groupId, open);

  const { data: centersData, isLoading: isLoadingCenters } = useCenters({
    isActive: undefined,
    take: 100,
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
    () => filterTeachersForCenter(teachers, watchedCenterId),
    [teachers, watchedCenterId],
  );
  const teacherDropdownDisabled =
    isSubmitting || updateGroup.isPending || isLoadingTeachers || !hasCenterSelected;
  const teacherPlaceholder = hasCenterSelected ? tForm('noTeacherAssigned') : tForm('selectCenterFirst');

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
      setIconKey(isGroupIconKey(group.iconKey) ? group.iconKey : null);
    }
  }, [group, reset]);

  useEffect(() => {
    setIsDialogOpen(open);
  }, [open]);

  useEffect(() => {
    if (!open) {
      setErrorMessage(null);
      setSuccessMessage(null);
    }
  }, [open]);

  const { overlayStyle, contentStyle, isBaseLayer } = useSheetStackZIndex(isDialogOpen);

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

  const buildPayload = (data: UpdateGroupFormData): UpdateGroupDto => ({
    name: data.name,
    level: data.level || undefined,
    description: data.description || undefined,
    centerId: data.centerId && data.centerId.trim() !== '' ? data.centerId : undefined,
    teacherId: data.teacherId || undefined,
    secondTeacherId: data.secondTeacherId ? data.secondTeacherId : null,
    iconKey,
  });

  const onSubmit = async (data: UpdateGroupFormData) => {
    setErrorMessage(null);

    if (
      data.secondTeacherId?.trim() &&
      data.teacherId &&
      data.teacherId === data.secondTeacherId
    ) {
      setErrorMessage(tForm('teachersMustDiffer'));
      return;
    }

    try {
      await updateGroup.mutateAsync({ id: groupId, data: buildPayload(data) });
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

  return {
    tForm,
    tGroups,
    tVal,
    tCommon,
    updateGroupSchema,
    resolver,
    errorMessage,
    setErrorMessage,
    successMessage,
    setSuccessMessage,
    isDialogOpen,
    setIsDialogOpen,
    iconKey,
    setIconKey,
    updateGroup,
    group,
    isLoading,
    centers,
    teachers,
    register,
    handleSubmit,
    errors,
    isSubmitting,
    reset,
    watch,
    setValue,
    isGroupActive,
    isFormBusy,
    watchedTeacherId,
    watchedCenterId,
    watchedSecondTeacherId,
    hasCenterSelected,
    teachersForCenter,
    teacherDropdownDisabled,
    teacherPlaceholder,
    isLoadingCenters,
    isLoadingTeachers,
    overlayStyle,
    contentStyle,
    isBaseLayer,
    requestClose,
    dragHandleProps,
    scrollContentProps,
    dragStyle,
    onSubmit,
    onToggleActive,
    isStatusTogglePending,
  };
}
