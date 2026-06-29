'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslations } from 'next-intl';
import { useCreateTeacher, type CreateTeacherDto } from '@/features/teachers';
import {
  createOptionalExperienceYearsSchema,
} from '@/features/teachers/utils/experience';
import { useState, useEffect, useMemo, useCallback, useRef, type TouchEvent } from 'react';
import { getErrorMessage } from '@/shared/lib/api';
import { useCenters } from '@/features/centers';
import { useSheetStackZIndex } from '@/shared/lib/sheet-stack';
import type { AddTeacherFormProps, CreateTeacherFormData } from './add-teacher-form.types';

export function useAddTeacherForm({ open, onOpenChange }: AddTeacherFormProps) {
  const tForm = useTranslations('teachers.form');
  const tVal = useTranslations('teachers.validation');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(open);
  const [dragOffsetY, setDragOffsetY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isSettling, setIsSettling] = useState(false);
  const touchStartYRef = useRef<number | null>(null);
  const touchStartXRef = useRef<number | null>(null);
  const settleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const createTeacher = useCreateTeacher();
  const { data: centersData } = useCenters({ isActive: true, take: 100 });
  const centers = centersData?.items ?? [];

  const createTeacherSchema = useMemo(
    () =>
      z
        .object({
          email: z.string().email(tVal('invalidEmail')),
          password: z.string().min(6, tVal('passwordMin')).max(50, tVal('passwordMax')),
          confirmPassword: z.string().min(1, tVal('confirmPasswordRequired')),
          firstName: z.string().min(2, tVal('firstNameMin')).max(50, tVal('firstNameMax')),
          lastName: z.string().min(2, tVal('lastNameMin')).max(50, tVal('lastNameMax')),
          phone: z.string().optional(),
          hourlyRate: z.number().min(0, tVal('hourlyRateMin')),
          experienceYears: createOptionalExperienceYearsSchema(tVal),
          videoUrl: z
            .string()
            .trim()
            .max(500, tVal('videoUrlMax'))
            .url(tVal('videoUrlInvalid'))
            .optional()
            .or(z.literal('').transform(() => undefined)),
          centerIds: z.array(z.string()).optional(),
        })
        .refine((data) => data.password === data.confirmPassword, {
          message: tVal('passwordsDoNotMatch'),
          path: ['confirmPassword'],
        }),
    [tVal],
  );

  const resolver = useMemo(() => zodResolver(createTeacherSchema), [createTeacherSchema]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
  } = useForm<CreateTeacherFormData>({
    resolver,
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      firstName: '',
      lastName: '',
      phone: '',
      hourlyRate: 0,
      videoUrl: '',
      centerIds: [],
    },
  });

  const selectedCenterIds = watch('centerIds') ?? [];
  const phoneDigits = (watch('phone') ?? '').replace(/\D/g, '');

  const toggleCenter = (centerId: string) => {
    const next = selectedCenterIds.includes(centerId)
      ? selectedCenterIds.filter((c) => c !== centerId)
      : [...selectedCenterIds, centerId];
    setValue('centerIds', next, { shouldDirty: true });
  };

  useEffect(() => {
    setIsDialogOpen(open);
  }, [open]);

  useEffect(() => {
    if (open) {
      reset({
        email: '',
        password: '',
        confirmPassword: '',
        firstName: '',
        lastName: '',
        phone: '',
        hourlyRate: 0,
        videoUrl: '',
        centerIds: [],
      });
      setErrorMessage(null);
      setSuccessMessage(null);
    } else {
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

  const onSubmit = async (data: CreateTeacherFormData) => {
    setErrorMessage(null);

    try {
      const payload: CreateTeacherDto = {
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone || undefined,
        hourlyRate: data.hourlyRate,
        ...(data.experienceYears !== undefined ? { experienceYears: data.experienceYears } : {}),
        videoUrl: data.videoUrl || undefined,
        centerIds: data.centerIds && data.centerIds.length > 0 ? data.centerIds : undefined,
      };

      await createTeacher.mutateAsync(payload);

      setSuccessMessage(tForm('createdSuccess'));
      setErrorMessage(null);

      reset();
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
  const isFormBusy = isSubmitting || createTeacher.isPending;

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
    setValue,
    phoneDigits,
    centers,
    selectedCenterIds,
    toggleCenter,
    isSubmitting,
    createTeacher,
  };
}
