'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type TouchEvent } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useCenters } from '@/features/centers';
import { useManagers, useUpdateManager } from '@/features/settings';
import { getCentersTakenByActiveManagers } from '@/features/settings/utils/manager-display';
import { getErrorMessage } from '@/shared/lib/api';
import { useSheetStackZIndex } from '@/shared/lib/sheet-stack';
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
  const [dragOffsetY, setDragOffsetY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isSettling, setIsSettling] = useState(false);
  const touchStartYRef = useRef<number | null>(null);
  const touchStartXRef = useRef<number | null>(null);
  const settleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    handleDragStart,
    handleDragMove,
    handleDragEnd,
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
