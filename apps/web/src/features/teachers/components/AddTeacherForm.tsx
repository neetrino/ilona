'use client';

import * as DialogPrimitive from '@radix-ui/react-dialog';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslations } from 'next-intl';
import {
  Button,
  Input,
  Label,
  PasswordInput,
} from '@/shared/components/ui';
import { useCreateTeacher, type CreateTeacherDto } from '@/features/teachers';
import { useState, useEffect, useMemo, useCallback, useRef, type TouchEvent } from 'react';
import { getErrorMessage } from '@/shared/lib/api';
import { useCenters } from '@/features/centers';
import { cn } from '@/shared/lib/utils';
import { X } from 'lucide-react';

type CreateTeacherFormData = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  hourlyRate: number;
  videoUrl?: string;
  centerIds?: string[];
};

interface AddTeacherFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddTeacherForm({ open, onOpenChange }: AddTeacherFormProps) {
  const tForm = useTranslations('teachers.form');
  const tVal = useTranslations('teachers.validation');
  const tCommon = useTranslations('common');
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
      z.object({
        email: z.string().email(tVal('invalidEmail')),
        password: z.string().min(6, tVal('passwordMin')).max(50, tVal('passwordMax')),
        firstName: z.string().min(2, tVal('firstNameMin')).max(50, tVal('firstNameMax')),
        lastName: z.string().min(2, tVal('lastNameMin')).max(50, tVal('lastNameMax')),
        phone: z.string().optional(),
        hourlyRate: z.number().min(0, tVal('hourlyRateMin')),
        videoUrl: z
          .string()
          .trim()
          .max(500, tVal('videoUrlMax'))
          .url(tVal('videoUrlInvalid'))
          .optional()
          .or(z.literal('').transform(() => undefined)),
        centerIds: z.array(z.string()).optional(),
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
      firstName: '',
      lastName: '',
      phone: '',
      hourlyRate: 0,
      videoUrl: '',
      centerIds: [],
    },
  });

  const selectedCenterIds = watch('centerIds') ?? [];

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

  return (
    <DialogPrimitive.Root open={isDialogOpen} onOpenChange={(nextOpen) => !nextOpen && requestClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          style={dragStyle}
          className={cn(
            'fixed inset-x-0 bottom-[7px] top-auto z-50 grid w-full translate-y-0 lg:bottom-0 [@media(min-width:1024px)_and_(max-width:1366px)_and_(min-height:1000px)]:bottom-0',
            'duration-700 ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out min-[1367px]:duration-350 min-[1367px]:ease-[cubic-bezier(0.22,1,0.36,1)]',
            'data-[state=open]:slide-in-from-bottom-full data-[state=closed]:slide-out-to-bottom-full',
            'h-[calc(94dvh+7px)] [@media(min-width:1024px)_and_(max-width:1366px)_and_(min-height:1000px)]:h-[56dvh] grid-rows-[auto_1fr] gap-0 overflow-hidden rounded-t-[22px] border border-slate-200 bg-[#f8f9fb] shadow-xl',
            'min-[1367px]:inset-0 min-[1367px]:m-auto min-[1367px]:w-[95vw] min-[1367px]:max-w-2xl min-[1367px]:h-auto min-[1367px]:max-h-[90vh] min-[1367px]:translate-x-0 min-[1367px]:translate-y-0 min-[1367px]:rounded-2xl',
            'min-[1367px]:data-[state=open]:fade-in-0 min-[1367px]:data-[state=closed]:fade-out-0 min-[1367px]:data-[state=open]:slide-in-from-bottom-0 min-[1367px]:data-[state=closed]:slide-out-to-bottom-0'
          )}
          aria-describedby={undefined}
        >
          <div className="relative flex h-9 w-full items-center justify-center bg-[#f8f9fb] min-[1367px]:hidden">
            <div
              className="absolute inset-x-0 -top-2 h-14"
              onTouchStart={handleDragStart}
              onTouchMove={handleDragMove}
              onTouchEnd={handleDragEnd}
              onTouchCancel={handleDragEnd}
            />
            <div className="h-1.5 w-14 rounded-full bg-slate-400" />
          </div>
          <DialogPrimitive.Title className="sr-only">{tForm('addTitle')}</DialogPrimitive.Title>
          <DialogPrimitive.Close
            className="absolute right-4 top-4 hidden h-8 w-8 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 min-[1367px]:inline-flex"
            aria-label={tCommon('close')}
          >
            <X className="h-4 w-4" />
          </DialogPrimitive.Close>

          <div className="min-h-0 overflow-y-auto overscroll-y-contain [touch-action:pan-y] [-webkit-overflow-scrolling:touch] px-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] pt-4 min-[1367px]:p-6">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-[#3b3b40]">{tForm('addTitle')}</h2>
              <p className="mt-1 text-sm text-[#8b8b90]">{tForm('addDescription')}</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {successMessage && (
            <div className="rounded-[15px] border border-green-200 bg-green-50 p-3">
              <p className="text-sm text-green-600">{successMessage}</p>
            </div>
          )}
          {errorMessage && (
            <div className="rounded-[15px] border border-red-200 bg-red-50 p-3">
              <p className="text-sm text-red-600">{errorMessage}</p>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName">
                {tCommon('firstName')} <span className="text-red-500">*</span>
              </Label>
              <Input
                id="firstName"
                {...register('firstName')}
                error={errors.firstName?.message}
                placeholder={tForm('firstNamePlaceholder')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">
                {tCommon('lastName')} <span className="text-red-500">*</span>
              </Label>
              <Input
                id="lastName"
                {...register('lastName')}
                error={errors.lastName?.message}
                placeholder={tForm('lastNamePlaceholder')}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">
              {tCommon('email')} <span className="text-red-500">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              {...register('email')}
              error={errors.email?.message}
              placeholder={tForm('emailPlaceholder')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">
              {tForm('password')} <span className="text-red-500">*</span>
            </Label>
            <PasswordInput
              id="password"
              {...register('password')}
              error={errors.password?.message}
              placeholder={tForm('passwordPlaceholder')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">{tCommon('phone')}</Label>
            <Input
              id="phone"
              type="tel"
              {...register('phone')}
              error={errors.phone?.message}
              placeholder={tForm('phonePlaceholder')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="hourlyRate">
              {tForm('perLessonRate')} <span className="text-red-500">*</span>
            </Label>
            <Input
              id="hourlyRate"
              type="number"
              step="0.01"
              min="0"
              {...register('hourlyRate', { valueAsNumber: true })}
              error={errors.hourlyRate?.message}
              placeholder={tForm('hourlyRatePlaceholder')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="videoUrl">{tForm('publicVideoUrl')}</Label>
            <Input
              id="videoUrl"
              type="url"
              {...register('videoUrl')}
              error={errors.videoUrl?.message}
              placeholder={tForm('videoUrlPlaceholder')}
            />
            <p className="text-xs text-slate-500">{tForm('videoUrlHintAdd')}</p>
          </div>

          <div className="space-y-2">
            <Label>{tForm('centersBranches')}</Label>
            {centers.length === 0 ? (
              <p className="text-xs text-slate-500">{tForm('noCentersAvailable')}</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {centers.map((center) => {
                  const active = selectedCenterIds.includes(center.id);
                  return (
                    <button
                      key={center.id}
                      type="button"
                      onClick={() => toggleCenter(center.id)}
                      className={`rounded-full border px-3 py-1 text-xs transition ${
                        active
                          ? 'border-primary bg-primary text-white'
                          : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {center.name}
                    </button>
                  );
                })}
              </div>
            )}
            <p className="text-xs text-slate-500">{tForm('centersBranchesHint')}</p>
          </div>

          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  reset();
                  requestClose();
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                disabled={isSubmitting || createTeacher.isPending}
              >
                {tCommon('cancel')}
              </Button>
              <Button type="submit" isLoading={isSubmitting || createTeacher.isPending}>
                {isSubmitting || createTeacher.isPending ? tForm('creating') : tForm('createTeacher')}
              </Button>
            </div>
          </form>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
