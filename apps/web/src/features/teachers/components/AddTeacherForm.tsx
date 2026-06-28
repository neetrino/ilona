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
import {
  createOptionalExperienceYearsSchema,
  experienceYearsFieldRegisterOptions,
} from '@/features/teachers/utils/experience';
import { useState, useEffect, useMemo, useCallback, useRef, type TouchEvent } from 'react';
import { getErrorMessage } from '@/shared/lib/api';
import { useCenters } from '@/features/centers';
import { cn } from '@/shared/lib/utils';
import {
  ADMIN_FORM_INPUT_CLASS,
  ADMIN_ICON_BUTTON_SM_CLASS,
  ADMIN_OUTLINE_BUTTON_CLASS,
  ADMIN_PRIMARY_BUTTON_CLASS,
} from '@/shared/lib/admin-control-theme';
import {
  portalSheetLayerProps,
  stackedSheetDialogHandlers,
  useSheetStackZIndex,
} from '@/shared/lib/sheet-stack';
import { PORTAL_DESKTOP_SIDE_SHEET_CLASS } from '@/shared/lib/portal-form-sheet-classes';
import { X } from 'lucide-react';

type CreateTeacherFormData = {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  phone?: string;
  hourlyRate: number;
  experienceYears?: number;
  videoUrl?: string;
  centerIds?: string[];
};

interface AddTeacherFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const sectionHeading = 'text-sm font-semibold text-[#3b3b40]';

const centerChipClass =
  'appearance-none rounded-[10px] border px-3 py-2 text-xs font-medium transition focus:outline-none focus-visible:outline-none focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-50 min-[1367px]:py-1.5';

export function AddTeacherForm({ open, onOpenChange }: AddTeacherFormProps) {
  const t = useTranslations('teachers');
  const tForm = useTranslations('teachers.form');
  const tVal = useTranslations('teachers.validation');
  const tCrm = useTranslations('crm');
  const tStudentsForm = useTranslations('students.form');
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

  return (
    <DialogPrimitive.Root open={isDialogOpen} onOpenChange={(nextOpen) => !nextOpen && requestClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          style={overlayStyle}
          {...portalSheetLayerProps}
          className="fixed inset-0 z-50 bg-black/60 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
        />
        <DialogPrimitive.Content
          style={{ ...dragStyle, ...contentStyle }}
          {...stackedSheetDialogHandlers}
          {...portalSheetLayerProps}
          className={cn(
            'fixed inset-x-0 bottom-[7px] top-auto z-50 grid w-full translate-y-0 lg:bottom-0 [@media(min-width:1024px)_and_(max-width:1366px)_and_(min-height:1000px)]:bottom-0',
            'duration-700 ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out min-[1367px]:duration-350 min-[1367px]:ease-[cubic-bezier(0.22,1,0.36,1)]',
            'data-[state=open]:slide-in-from-bottom-full data-[state=closed]:slide-out-to-bottom-full',
            'h-[calc(94dvh+7px)] [@media(min-width:1024px)_and_(max-width:1366px)_and_(min-height:1000px)]:h-[56dvh] grid-rows-[auto_auto_1fr] gap-0 overflow-hidden rounded-t-[22px] border border-slate-200 bg-[#f8f9fb] shadow-xl',
            PORTAL_DESKTOP_SIDE_SHEET_CLASS,
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
          <div className="shrink-0 bg-[#f8f9fb] px-4 pb-4 pt-3 min-[1367px]:px-6 min-[1367px]:pb-5 min-[1367px]:pt-6">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-semibold text-[#3b3b40]">{tForm('addTitle')}</h2>
              </div>
              <DialogPrimitive.Close
                className={cn(
                  ADMIN_ICON_BUTTON_SM_CLASS,
                  'hidden text-slate-500 hover:bg-slate-100 hover:text-slate-700 min-[1367px]:inline-flex',
                )}
                aria-label={tCommon('close')}
              >
                <X className="h-4 w-4" />
              </DialogPrimitive.Close>
            </div>
          </div>
          <div className="min-h-0 overflow-y-auto overscroll-y-contain [touch-action:pan-y] [-webkit-overflow-scrolling:touch] px-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] min-[1367px]:px-6 min-[1367px]:pb-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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

              <section className="space-y-4">
                <h3 className={sectionHeading}>{tCrm('basicInfo')}</h3>
                <div className="grid grid-cols-2 gap-4 min-[1367px]:grid-cols-3">
                  <div className="min-w-0 space-y-2">
                    <Label htmlFor="firstName">
                      {tCommon('firstName')} <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="firstName"
                      className={ADMIN_FORM_INPUT_CLASS}
                      {...register('firstName')}
                      error={errors.firstName?.message}
                      placeholder={tForm('firstNamePlaceholder')}
                      disabled={isFormBusy}
                    />
                  </div>
                  <div className="min-w-0 space-y-2">
                    <Label htmlFor="lastName">
                      {tCommon('lastName')} <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="lastName"
                      className={ADMIN_FORM_INPUT_CLASS}
                      {...register('lastName')}
                      error={errors.lastName?.message}
                      placeholder={tForm('lastNamePlaceholder')}
                      disabled={isFormBusy}
                    />
                  </div>
                  <div className="col-span-2 min-w-0 space-y-2 min-[1367px]:col-span-1">
                    <Label htmlFor="phone">{tStudentsForm('phoneNumber')}</Label>
                    <Input
                      id="phone"
                      type="tel"
                      inputMode="numeric"
                      autoComplete="tel"
                      value={phoneDigits !== '' ? `+${phoneDigits}` : ''}
                      onChange={(e) =>
                        setValue('phone', e.target.value.replace(/\D/g, ''), {
                          shouldValidate: true,
                          shouldDirty: true,
                        })
                      }
                      placeholder={tForm('phonePlaceholder')}
                      className={ADMIN_FORM_INPUT_CLASS}
                      disabled={isFormBusy}
                    />
                    {errors.phone ? (
                      <p className="text-sm text-red-600">{errors.phone.message}</p>
                    ) : null}
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <h3 className={sectionHeading}>{tStudentsForm('account')}</h3>
                <div className="grid grid-cols-2 gap-4 min-[1367px]:grid-cols-3">
                  <div className="col-span-2 min-w-0 space-y-2 min-[1367px]:col-span-1">
                    <Label htmlFor="email">
                      {tCommon('email')} <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      autoComplete="email"
                      className={ADMIN_FORM_INPUT_CLASS}
                      {...register('email')}
                      error={errors.email?.message}
                      placeholder={tForm('emailPlaceholder')}
                      disabled={isFormBusy}
                    />
                  </div>
                  <div className="min-w-0 space-y-2">
                    <Label htmlFor="password">
                      {tForm('password')} <span className="text-red-500">*</span>
                    </Label>
                    <PasswordInput
                      id="password"
                      autoComplete="new-password"
                      className={ADMIN_FORM_INPUT_CLASS}
                      {...register('password')}
                      error={errors.password?.message}
                      placeholder={tForm('passwordPlaceholder')}
                      disabled={isFormBusy}
                    />
                  </div>
                  <div className="min-w-0 space-y-2">
                    <Label htmlFor="confirmPassword">
                      {tForm('confirmPassword')} <span className="text-red-500">*</span>
                    </Label>
                    <PasswordInput
                      id="confirmPassword"
                      autoComplete="new-password"
                      className={ADMIN_FORM_INPUT_CLASS}
                      {...register('confirmPassword')}
                      error={errors.confirmPassword?.message}
                      placeholder={tForm('passwordPlaceholder')}
                      disabled={isFormBusy}
                    />
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <h3 className={sectionHeading}>{t('professionalInformation')}</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="min-w-0 space-y-2">
                    <Label htmlFor="hourlyRate">
                      {tForm('perLessonRate')} <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="hourlyRate"
                      type="number"
                      step="0.01"
                      min="0"
                      className={ADMIN_FORM_INPUT_CLASS}
                      {...register('hourlyRate', { valueAsNumber: true })}
                      error={errors.hourlyRate?.message}
                      placeholder={tForm('hourlyRatePlaceholder')}
                      disabled={isFormBusy}
                    />
                  </div>
                  <div className="min-w-0 space-y-2">
                    <Label htmlFor="experienceYears">{t('experienceYears')}</Label>
                    <Input
                      id="experienceYears"
                      type="number"
                      min="0"
                      max="80"
                      step="1"
                      className={ADMIN_FORM_INPUT_CLASS}
                      {...register('experienceYears', experienceYearsFieldRegisterOptions)}
                      error={errors.experienceYears?.message}
                      placeholder={tForm('experiencePlaceholder')}
                      disabled={isFormBusy}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="videoUrl">{tForm('publicVideoUrl')}</Label>
                  <Input
                    id="videoUrl"
                    type="url"
                    className={ADMIN_FORM_INPUT_CLASS}
                    {...register('videoUrl')}
                    error={errors.videoUrl?.message}
                    placeholder={tForm('videoUrlPlaceholder')}
                    disabled={isFormBusy}
                  />
                  <p className="text-xs text-slate-500">{tForm('videoUrlHintAdd')}</p>
                </div>
              </section>

              <section className="space-y-4">
                <h3 className={sectionHeading}>{tForm('centersBranches')}</h3>
                {centers.length === 0 ? (
                  <p className="text-xs text-slate-500">{tForm('noCentersAvailable')}</p>
                ) : (
                  <div className="grid grid-cols-2 gap-2 min-[1367px]:flex min-[1367px]:flex-wrap min-[1367px]:gap-2">
                    {centers.map((center) => {
                      const active = selectedCenterIds.includes(center.id);
                      return (
                        <button
                          key={center.id}
                          type="button"
                          onClick={() => toggleCenter(center.id)}
                          disabled={isFormBusy}
                          title={center.name}
                          className={cn(
                            centerChipClass,
                            'w-full min-w-0 min-[1367px]:w-auto',
                            active
                              ? 'border-[#1010a3] bg-[#1010a3] text-white'
                              : 'border-[rgba(14,14,16,0.07)] bg-white text-[#3b3b40] hover:bg-slate-50',
                          )}
                        >
                          <span className="block truncate">{center.name}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
                <p className="text-xs text-slate-500">{tForm('centersBranchesHint')}</p>
              </section>

              <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  className={cn(ADMIN_OUTLINE_BUTTON_CLASS, 'border-[rgba(14,14,16,0.07)] hover:bg-slate-50')}
                  onClick={requestClose}
                  disabled={isFormBusy}
                >
                  {tCommon('cancel')}
                </Button>
                <Button
                  type="submit"
                  isLoading={isFormBusy}
                  className={cn(ADMIN_PRIMARY_BUTTON_CLASS, 'bg-primary text-primary-foreground hover:bg-primary/90')}
                >
                  {isFormBusy ? tForm('creating') : tForm('createTeacher')}
                </Button>
              </div>
            </form>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
