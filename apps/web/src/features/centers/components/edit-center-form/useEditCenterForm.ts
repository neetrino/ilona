'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslations } from 'next-intl';
import { useUpdateCenter, useCenter, type UpdateCenterDto } from '@/features/centers';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { getErrorMessage } from '@/shared/lib/api';
import { useSheetStackZIndex } from '@/shared/lib/sheet-stack';
import { usePortalSheetDrag } from '@/shared/hooks/usePortalSheetDrag';
import type { EditCenterFormProps, UpdateCenterFormData } from './edit-center-form.types';

export function useEditCenterForm({
  open,
  onOpenChange,
  centerId,
  isStatusTogglePending = false,
}: EditCenterFormProps) {
  const tForm = useTranslations('centers.form');
  const tVal = useTranslations('centers.validation');

  const updateCenterSchema = useMemo(
    () =>
      z.object({
        name: z.string().min(2, tVal('nameMin')).max(100, tVal('nameMax')).optional(),
        address: z.string().max(255, tVal('addressMax')).optional().or(z.literal('')),
        phone: z.string().max(50, tVal('phoneMax')).optional().or(z.literal('')),
        email: z.union([z.string().email(tVal('invalidEmail')), z.literal('')]).optional(),
        description: z.string().max(500, tVal('descriptionMax')).optional().or(z.literal('')),
        colorHex: z
          .union([
            z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, tVal('invalidHexColor')),
            z.literal(''),
          ])
          .optional()
          .or(z.literal('')),
        isActive: z.boolean().optional(),
      }),
    [tVal],
  );

  const resolver = useMemo(() => zodResolver(updateCenterSchema), [updateCenterSchema]);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(open);
  const updateCenter = useUpdateCenter();
  const { data: center, isLoading } = useCenter(centerId, open);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
    setValue,
  } = useForm<UpdateCenterFormData>({
    resolver,
    defaultValues: {
      name: '',
      address: '',
      phone: '',
      email: '',
      description: '',
      colorHex: '',
      isActive: true,
    },
  });

  useEffect(() => {
    if (center) {
      reset({
        name: center.name,
        address: center.address || '',
        phone: center.phone || '',
        email: center.email || '',
        description: center.description || '',
        colorHex: center.colorHex || '',
        isActive: center.isActive,
      });
    }
  }, [center, reset]);

  useEffect(() => {
    setIsDialogOpen(open);
  }, [open]);

  useEffect(() => {
    if (!open) {
      setErrorMessage(null);
      setSuccessMessage(null);
    }
  }, [open]);

  const { overlayStyle, contentStyle } = useSheetStackZIndex(isDialogOpen);

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

  const onSubmit = async (data: UpdateCenterFormData) => {
    setErrorMessage(null);

    try {
      const payload: UpdateCenterDto = {
        name: data.name,
        address: data.address || undefined,
        phone: data.phone || undefined,
        email: data.email || undefined,
        description: data.description || undefined,
        colorHex: data.colorHex && data.colorHex.trim() !== '' ? data.colorHex : undefined,
        isActive: center?.isActive,
      };

      await updateCenter.mutateAsync({ id: centerId, data: payload });

      setSuccessMessage(tForm('updatedSuccess'));
      setErrorMessage(null);

      setTimeout(() => {
        requestClose();
        setSuccessMessage(null);
      }, 1500);
    } catch (error: unknown) {
      const message = getErrorMessage(error, tForm('failedUpdate'));
      setErrorMessage(message);
      setSuccessMessage(null);
    }
  };

  const isCenterActive = center?.isActive ?? true;
  const isFormBusy = isSubmitting || updateCenter.isPending || isStatusTogglePending;
  const headerTitle = center?.name ?? tForm('editTitle');

  return {
    tForm,
    center,
    isLoading,
    isDialogOpen,
    requestClose,
    overlayStyle,
    contentStyle,
    dragStyle,
    dragHandleProps,
    scrollContentProps,
    headerTitle,
    handleSubmit,
    onSubmit,
    errorMessage,
    successMessage,
    register,
    errors,
    isFormBusy,
    watch,
    setValue,
    reset,
    isCenterActive,
    isSubmitting,
    updateCenter,
  };
}
