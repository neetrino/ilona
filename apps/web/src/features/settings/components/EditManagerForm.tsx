'use client';

import { useEffect, useMemo, useState } from 'react';
import { useForm, type UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslations } from 'next-intl';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
} from '@/shared/components/ui';
import { useCenters } from '@/features/centers';
import { useManagers, useUpdateManager, type ManagerAccount } from '@/features/settings';
import { getCentersTakenByActiveManagers } from '@/features/settings/utils/manager-display';
import { getErrorMessage } from '@/shared/lib/api';

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isInactiveVariant ? t('editInactiveManager') : t('editManager')}
          </DialogTitle>
          <DialogDescription>
            {isInactiveVariant
              ? t('editInactiveManagerDescription')
              : t('editManagerDescription')}
          </DialogDescription>
        </DialogHeader>

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
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {tCommon('cancel')}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? t('saving') : t('saveChanges')}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <form onSubmit={activeForm.handleSubmit(onSubmitActive)} className="space-y-4">
            {errorMessage && <FormError message={errorMessage} />}
            <ProfileFields form={activeForm as FormLike} t={t} />
            <CenterSelect
              form={activeForm as FormLike}
              t={t}
              selectableCenters={selectableCenters}
              disabled={watchedStatus === 'INACTIVE'}
              hint={watchedStatus === 'INACTIVE' ? t('managerInactiveCenterHint') : undefined}
              centerError={activeForm.formState.errors.centerId?.message}
            />
            <div className="space-y-2">
              <Label htmlFor="manager-status">{t('managerStatus')}</Label>
              <select
                id="manager-status"
                className="unified-native-select flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                {...activeForm.register('status')}
              >
                <option value="ACTIVE">{tStatus('active')}</option>
                <option value="INACTIVE">{tStatus('inactive')}</option>
              </select>
              {watchedStatus === 'INACTIVE' && (
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg p-2">
                  {t('managerSetInactiveHint')}
                </p>
              )}
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {tCommon('cancel')}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? t('saving') : t('saveChanges')}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
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

type FormLike = Pick<UseFormReturn<ManagerFormFields>, 'register' | 'formState'>;

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
  return (
    <div className="space-y-2">
      <Label htmlFor="manager-center">{t('managerSelectCenter')}</Label>
      <select
        id="manager-center"
        className="unified-native-select flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
        {...form.register('centerId')}
        disabled={disabled}
      >
        <option value="">{t('managerSelectCenter')}</option>
        {selectableCenters.map((center) => (
          <option key={center.id} value={center.id}>
            {center.name}
          </option>
        ))}
      </select>
      {hint && <p className="text-xs text-slate-500">{hint}</p>}
      {centerError && <p className="text-xs text-red-600">{centerError}</p>}
    </div>
  );
}
