'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslations } from 'next-intl';
import { useCreateCenter, type CreateCenterDto } from '@/features/centers';
import { useState, useEffect, useMemo, useCallback, useRef, type TouchEvent } from 'react';
import { getErrorMessage } from '@/shared/lib/api';
import { useSheetStackZIndex } from '@/shared/lib/sheet-stack';
import type { CreateCenterFormData, CreateCenterFormProps } from './create-center-form.types';

export function useCreateCenterForm({ open, onOpenChange }: CreateCenterFormProps) {
  const tForm = useTranslations('centers.form');
  const tVal = useTranslations('centers.validation');

  const createCenterSchema = useMemo(
    () =>
      z.object({
        name: z.string().min(2, tVal('nameMin')).max(100, tVal('nameMax')),
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
      }),
    [tVal],
  );

  const resolver = useMemo(() => zodResolver(createCenterSchema), [createCenterSchema]);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(open);
  const [dragOffsetY, setDragOffsetY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isSettling, setIsSettling] = useState(false);
  const touchStartYRef = useRef<number | null>(null);
  const touchStartXRef = useRef<number | null>(null);
  const settleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const createCenter = useCreateCenter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
    setValue,
  } = useForm<CreateCenterFormData>({
    resolver,
    defaultValues: {
      name: '',
      address: '',
      phone: '',
      email: '',
      description: '',
      colorHex: '',
    },
  });

  useEffect(() => {
    setIsDialogOpen(open);
  }, [open]);

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

  const onSubmit = async (data: CreateCenterFormData) => {
    setErrorMessage(null);

    try {
      const payload: CreateCenterDto = {
        name: data.name,
        address: data.address || undefined,
        phone: data.phone || undefined,
        email: data.email || undefined,
        description: data.description || undefined,
        colorHex: data.colorHex && data.colorHex.trim() !== '' ? data.colorHex : undefined,
      };

      await createCenter.mutateAsync(payload);

      setSuccessMessage(tForm('createdSuccess'));
      setErrorMessage(null);

      reset();
      setTimeout(() => {
        requestClose();
        setSuccessMessage(null);
      }, 1500);
    } catch (error: unknown) {
      const message = getErrorMessage(error, tForm('failedCreate'));
      setErrorMessage(message);
      setSuccessMessage(null);
    }
  };

  const { overlayStyle, contentStyle } = useSheetStackZIndex(isDialogOpen);
  const isFormBusy = isSubmitting || createCenter.isPending;

  return {
    tForm,
    isDialogOpen,
    requestClose,
    overlayStyle,
    contentStyle,
    dragStyle,
    handleDragStart,
    handleDragMove,
    handleDragEnd,
    handleSubmit,
    onSubmit,
    errorMessage,
    successMessage,
    register,
    errors,
    isFormBusy,
    watch,
    setValue,
    isSubmitting,
    createCenter,
  };
}
