'use client';

import * as DialogPrimitive from '@radix-ui/react-dialog';
import { useCallback, useEffect, useMemo, useRef, useState, type TouchEvent } from 'react';
import { useForm, type UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslations } from 'next-intl';
import {
  Button,
  Input,
  Label,
} from '@/shared/components/ui';
import { SingleSelectDropdown } from '@/shared/components/ui/single-select-dropdown';
import { useCenters } from '@/features/centers';
import { useManagers, useUpdateManager, type ManagerAccount } from '@/features/settings';
import { getCentersTakenByActiveManagers } from '@/features/settings/utils/manager-display';
import { getErrorMessage } from '@/shared/lib/api';
import { cn } from '@/shared/lib/utils';
import { X } from 'lucide-react';

const activeManagerSchema = z.object({
  firstName: z.string().min(2).max(50),
  lastName: z.string().min(2).max(50),
  email: z.string().email(),
  phone: z.string().max(50).optional(),
  password: z
    .string()
    .max(128)
    .optional()
    .refine((value) => !value || value.length >= 8, {
      message: 'Password must be at least 8 characters',
    }),
  centerId: z.string().min(1),
  status: z.enum(['ACTIVE', 'INACTIVE']),
});

const inactiveManagerSchema = z.object({
  firstName: z.string().min(2).max(50),
  lastName: z.string().min(2).max(50),
  email: z.string().email(),
  phone: z.string().max(50).optional(),
  password: z
    .string()
    .max(128)
    .optional()
    .refine((value) => !value || value.length >= 8, {
      message: 'Password must be at least 8 characters',
    }),
  centerId: z.string().optional(),
});

type ActiveManagerFormData = z.infer<typeof activeManagerSchema>;
type InactiveManagerFormData = z.infer<typeof inactiveManagerSchema>;

interface EditManagerFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  manager: ManagerAccount | null;
  variant?: 'active' | 'inactive';
}

export function EditManagerForm({
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
    typeof window !== 'undefined' && window.matchMedia('(max-width: 1024px)').matches;

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

  return (
    <DialogPrimitive.Root open={isDialogOpen} onOpenChange={(nextOpen) => !nextOpen && requestClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          style={dragStyle}
          className={cn(
            'fixed inset-x-0 bottom-[7px] top-auto z-50 grid w-full translate-y-0',
            'duration-700 ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out min-[1025px]:duration-350 min-[1025px]:ease-[cubic-bezier(0.22,1,0.36,1)]',
            'data-[state=open]:slide-in-from-bottom-full data-[state=closed]:slide-out-to-bottom-full',
            'h-[calc(94dvh+7px)] grid-rows-[auto_1fr] gap-0 overflow-hidden rounded-t-[22px] border border-slate-200 bg-[#f8f9fb] shadow-xl',
            'min-[1025px]:inset-0 min-[1025px]:m-auto min-[1025px]:w-[95vw] min-[1025px]:max-w-lg min-[1025px]:h-auto min-[1025px]:max-h-[90vh] min-[1025px]:translate-x-0 min-[1025px]:translate-y-0 min-[1025px]:rounded-2xl',
            'min-[1025px]:data-[state=open]:fade-in-0 min-[1025px]:data-[state=closed]:fade-out-0 min-[1025px]:data-[state=open]:slide-in-from-bottom-0 min-[1025px]:data-[state=closed]:slide-out-to-bottom-0'
          )}
          aria-describedby="edit-manager-description"
        >
          <div className="relative flex h-9 w-full items-center justify-center bg-[#f8f9fb] min-[1025px]:hidden">
            <div
              className="absolute inset-x-0 -top-2 h-14"
              onTouchStart={handleDragStart}
              onTouchMove={handleDragMove}
              onTouchEnd={handleDragEnd}
              onTouchCancel={handleDragEnd}
            />
            <div className="h-1.5 w-14 rounded-full bg-slate-400" />
          </div>
          <DialogPrimitive.Title className="sr-only">{title}</DialogPrimitive.Title>
          <DialogPrimitive.Description id="edit-manager-description" className="sr-only">
            {description}
          </DialogPrimitive.Description>
          <DialogPrimitive.Close
            className="absolute right-4 top-4 hidden h-8 w-8 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 min-[1025px]:inline-flex"
            aria-label={tCommon('close')}
          >
            <X className="h-4 w-4" />
          </DialogPrimitive.Close>
          <div className="min-h-0 overflow-y-auto overscroll-y-contain [touch-action:pan-y] [-webkit-overflow-scrolling:touch] px-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] pt-4 min-[1025px]:p-6">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-[#3b3b40]">{title}</h2>
              <p className="mt-1 text-sm text-[#8b8b90]">{description}</p>
            </div>

            {isInactiveVariant ? (
              <form onSubmit={inactiveForm.handleSubmit(onSubmitInactive)} className="space-y-4">
                {errorMessage && <FormError message={errorMessage} />}
                <ProfileFields form={inactiveForm as FormLike} t={t} />
                <CenterSelect
                  form={inactiveForm as FormLike}
                  t={t}
                  selectableCenters={selectableCenters}
                  disabled={false}
                  hint={t('managerInactiveEditCenterHint')}
                />
                <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
                  <Button type="button" variant="outline" onClick={requestClose}>
                    {tCommon('cancel')}
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? t('saving') : t('saveChanges')}
                  </Button>
                </div>
              </form>
            ) : (
              <form onSubmit={activeForm.handleSubmit(onSubmitActive)} className="space-y-4">
                {errorMessage && <FormError message={errorMessage} />}
                <ProfileFields form={activeForm as FormLike} t={t} />
                <div className="grid grid-cols-2 gap-4">
                  <CenterSelect
                    form={activeForm as FormLike}
                    t={t}
                    selectableCenters={selectableCenters}
                    disabled={watchedStatus === 'INACTIVE'}
                    hint={watchedStatus === 'INACTIVE' ? t('managerInactiveCenterHint') : undefined}
                    centerError={activeForm.formState.errors.centerId?.message}
                  />
                  <div className="space-y-2">
                    <SingleSelectDropdown
                      id="manager-status"
                      label={t('managerStatus')}
                      options={[
                        { id: 'ACTIVE', label: tStatus('active') },
                        { id: 'INACTIVE', label: tStatus('inactive') },
                      ]}
                      value={watchedStatus ?? 'ACTIVE'}
                      onValueChange={(value) => {
                        activeForm.setValue('status', (value as 'ACTIVE' | 'INACTIVE') ?? 'ACTIVE', {
                          shouldDirty: true,
                          shouldValidate: true,
                        });
                      }}
                    />
                    {watchedStatus === 'INACTIVE' && (
                      <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg p-2">
                        {t('managerSetInactiveHint')}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
                  <Button type="button" variant="outline" onClick={requestClose}>
                    {tCommon('cancel')}
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? t('saving') : t('saveChanges')}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

function FormError({ message }: { message: string }) {
  return (
    <MotionErrorContainer>
      <p className="text-sm text-red-600">{message}</p>
    </MotionErrorContainer>
  );
}

function MotionErrorContainer({ children }: { children: React.ReactNode }) {
  return (
    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">{children}</div>
  );
}

type ManagerFormFields = {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  password?: string;
  centerId?: string;
  status?: 'ACTIVE' | 'INACTIVE';
};

type FormLike = Pick<UseFormReturn<ManagerFormFields>, 'register' | 'formState' | 'watch' | 'setValue'>;

function ProfileFields({ form, t }: { form: FormLike; t: (key: string) => string }) {
  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="manager-firstName">{t('firstName')}</Label>
          <Input id="manager-firstName" {...form.register('firstName')} />
          {form.formState.errors.firstName && (
            <p className="text-xs text-red-600">{form.formState.errors.firstName.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="manager-lastName">{t('lastName')}</Label>
          <Input id="manager-lastName" {...form.register('lastName')} />
          {form.formState.errors.lastName && (
            <p className="text-xs text-red-600">{form.formState.errors.lastName.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="manager-email">{t('emailAddress')}</Label>
        <Input id="manager-email" type="email" {...form.register('email')} />
        {form.formState.errors.email && (
          <p className="text-xs text-red-600">{form.formState.errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="manager-phone">{t('phoneNumber')}</Label>
        <Input id="manager-phone" {...form.register('phone')} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="manager-password">{t('managerNewPassword')}</Label>
        <Input
          id="manager-password"
          type="password"
          autoComplete="new-password"
          placeholder={t('managerPasswordLeaveBlank')}
          {...form.register('password')}
        />
        {form.formState.errors.password && (
          <p className="text-xs text-red-600">{form.formState.errors.password.message}</p>
        )}
      </div>
    </>
  );
}

function CenterSelect({
  form,
  t,
  selectableCenters,
  disabled,
  hint,
  centerError,
}: {
  form: FormLike;
  t: (key: string) => string;
  selectableCenters: Array<{ id: string; name: string }>;
  disabled: boolean;
  hint?: string;
  centerError?: string;
}) {
  const currentCenterId = form.watch('centerId') ?? '';

  return (
    <div className="space-y-2">
      <SingleSelectDropdown
        id="manager-center"
        label={t('managerSelectCenter')}
        options={selectableCenters.map((center) => ({ id: center.id, label: center.name }))}
        value={currentCenterId}
        onValueChange={(value) =>
          form.setValue('centerId', value ?? '', { shouldDirty: true, shouldValidate: true })
        }
        disabled={disabled}
        allowDeselect
        wrapText
        placeholder={t('managerSelectCenter')}
      />
      {hint && <p className="text-xs text-slate-500">{hint}</p>}
      {centerError && <p className="text-xs text-red-600">{centerError}</p>}
    </div>
  );
}
