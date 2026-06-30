'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useCenters } from '@/features/centers';
import { useManagers, useUpdateManager } from '@/features/settings';
import { getCentersTakenByActiveManagers } from '@/features/settings/utils/manager-display';
import { getErrorMessage } from '@/shared/lib/api';
import { useSheetStackZIndex } from '@/shared/lib/sheet-stack';
import { usePortalSheetDrag } from '@/shared/hooks/usePortalSheetDrag';
import {
  activeManagerSchema,
  inactiveManagerSchema,
  type ActiveManagerFormData,
  type EditManagerFormProps,
  type InactiveManagerFormData,
  type ManagerFormLike,
} from './edit-manager-form.types';

export function useEditManagerForm({
  open,
  onOpenChange,
  manager,
  variant = 'active',
}: EditManagerFormProps) {
  const isInactiveVariant = variant === 'inactive';
  const t = useTranslations('settings');
  const tCommon = useTranslations('common');
  const tStatus = useTranslations('status');
  const { data: centersData } = useCenters({ isActive: true, take: 100 });
  const { data: managers } = useManagers();
  const updateManager = useUpdateManager();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(open);

  const activeForm = useForm<ActiveManagerFormData>({
    resolver: zodResolver(activeManagerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      password: '',
      centerId: '',
      status: 'ACTIVE',
    },
  });

  const inactiveForm = useForm<InactiveManagerFormData>({
    resolver: zodResolver(inactiveManagerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      password: '',
      centerId: '',
    },
  });

  const watchedStatus = activeForm.watch('status');
  const centers = useMemo(() => centersData?.items ?? [], [centersData?.items]);

  const centersTakenByOthers = useMemo(
    () => getCentersTakenByActiveManagers(managers ?? [], manager?.id),
    [managers, manager?.id],
  );

  const selectableCenters = useMemo(() => {
    if (isInactiveVariant) {
      return centers.filter((center) => !centersTakenByOthers.has(center.id));
    }

    const currentCenterId = manager?.managerProfile?.centerId;
    return centers.filter(
      (center) => center.id === currentCenterId || !centersTakenByOthers.has(center.id),
    );
  }, [centers, centersTakenByOthers, isInactiveVariant, manager?.managerProfile?.centerId]);

  useEffect(() => {
    if (!isInactiveVariant || !open) return;

    const selected = inactiveForm.getValues('centerId');
    if (selected && !selectableCenters.some((center) => center.id === selected)) {
      inactiveForm.setValue('centerId', '');
    }
  }, [selectableCenters, isInactiveVariant, open, inactiveForm]);

  useEffect(() => {
    if (!manager || !open) return;

    const pendingCenterId = manager.managerProfile?.centerId ?? '';
    const centerIdForForm =
      isInactiveVariant &&
      pendingCenterId &&
      centersTakenByOthers.has(pendingCenterId)
        ? ''
        : pendingCenterId;

    const base = {
      firstName: manager.firstName,
      lastName: manager.lastName,
      email: manager.email,
      phone: manager.phone ?? '',
      password: '',
      centerId: centerIdForForm,
    };

    if (isInactiveVariant) {
      inactiveForm.reset(base);
    } else {
      activeForm.reset({
        ...base,
        status: manager.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
      });
    }
    setErrorMessage(null);
  }, [manager, open, isInactiveVariant, centersTakenByOthers, activeForm, inactiveForm]);

  useEffect(() => {
    setIsDialogOpen(open);
  }, [open]);

  useEffect(() => {
    if (!open) {
      setErrorMessage(null);
    }
  }, [open]);

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

  const onSubmitActive = async (values: ActiveManagerFormData) => {
    if (!manager) return;
    setErrorMessage(null);

    try {
      await updateManager.mutateAsync({
        id: manager.id,
        data: {
          firstName: values.firstName.trim(),
          lastName: values.lastName.trim(),
          email: values.email.trim(),
          phone: values.phone?.trim() || undefined,
          centerId: values.centerId,
          status: values.status,
          ...(values.password?.trim() ? { password: values.password.trim() } : {}),
        },
      });
      onOpenChange(false);
    } catch (err: unknown) {
      setErrorMessage(getErrorMessage(err, t('failedToUpdateManager')));
    }
  };

  const onSubmitInactive = async (values: InactiveManagerFormData) => {
    if (!manager) return;
    setErrorMessage(null);

    try {
      await updateManager.mutateAsync({
        id: manager.id,
        data: {
          firstName: values.firstName.trim(),
          lastName: values.lastName.trim(),
          email: values.email.trim(),
          phone: values.phone?.trim() || undefined,
          ...(values.centerId ? { centerId: values.centerId } : {}),
          ...(values.password?.trim() ? { password: values.password.trim() } : {}),
        },
      });
      onOpenChange(false);
    } catch (err: unknown) {
      setErrorMessage(getErrorMessage(err, t('failedToUpdateManager')));
    }
  };

  const isSubmitting = updateManager.isPending;
  const title = isInactiveVariant ? t('editInactiveManager') : t('editManager');
  const description = isInactiveVariant
    ? t('editInactiveManagerDescription')
    : t('editManagerDescription');
  const { overlayStyle, contentStyle, isBaseLayer } = useSheetStackZIndex(isDialogOpen);

  return {
    t,
    tCommon,
    tStatus,
    isInactiveVariant,
    isDialogOpen,
    requestClose,
    overlayStyle,
    contentStyle,
    isBaseLayer,
    dragStyle,
    dragHandleProps,
    scrollContentProps,
    title,
    description,
    errorMessage,
    activeForm,
    inactiveForm,
    activeFormLike: activeForm as unknown as ManagerFormLike,
    inactiveFormLike: inactiveForm as unknown as ManagerFormLike,
    handleSubmitActive: activeForm.handleSubmit(onSubmitActive),
    handleSubmitInactive: inactiveForm.handleSubmit(onSubmitInactive),
    isSubmitting,
    selectableCenters,
    watchedStatus,
  };
}
