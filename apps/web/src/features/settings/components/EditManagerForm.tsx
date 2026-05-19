'use client';

import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
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
import { getErrorMessage } from '@/shared/lib/api';

const updateManagerSchema = z.object({
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

type UpdateManagerFormData = z.infer<typeof updateManagerSchema>;

interface EditManagerFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  manager: ManagerAccount | null;
}

export function EditManagerForm({ open, onOpenChange, manager }: EditManagerFormProps) {
  const t = useTranslations('settings');
  const tCommon = useTranslations('common');
  const tStatus = useTranslations('status');
  const { data: centersData } = useCenters({ isActive: true, take: 100 });
  const { data: managers } = useManagers();
  const updateManager = useUpdateManager();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<UpdateManagerFormData>({
    resolver: zodResolver(updateManagerSchema),
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

  const watchedStatus = watch('status');

  const centers = useMemo(() => centersData?.items ?? [], [centersData?.items]);

  const centersTakenByOthers = useMemo(() => {
    const taken = new Set<string>();
    (managers ?? []).forEach((m) => {
      if (m.id === manager?.id) return;
      if (
        m.status === 'ACTIVE' &&
        m.managerProfile?.isCurrentAssignment !== false &&
        m.managerProfile?.centerId
      ) {
        taken.add(m.managerProfile.centerId);
      }
    });
    return taken;
  }, [managers, manager?.id]);

  const selectableCenters = useMemo(() => {
    return centers.filter(
      (center) =>
        center.id === manager?.managerProfile?.centerId || !centersTakenByOthers.has(center.id),
    );
  }, [centers, centersTakenByOthers, manager?.managerProfile?.centerId]);

  useEffect(() => {
    if (!manager || !open) return;
    reset({
      firstName: manager.firstName,
      lastName: manager.lastName,
      email: manager.email,
      phone: manager.phone ?? '',
      password: '',
      centerId: manager.managerProfile?.centerId ?? '',
      status: manager.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
    });
    setErrorMessage(null);
  }, [manager, open, reset]);

  const onSubmit = async (values: UpdateManagerFormData) => {
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('editManager')}</DialogTitle>
          <DialogDescription>{t('editManagerDescription')}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{errorMessage}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="manager-firstName">{t('firstName')}</Label>
              <Input id="manager-firstName" {...register('firstName')} />
              {errors.firstName && (
                <p className="text-xs text-red-600">{errors.firstName.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="manager-lastName">{t('lastName')}</Label>
              <Input id="manager-lastName" {...register('lastName')} />
              {errors.lastName && (
                <p className="text-xs text-red-600">{errors.lastName.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="manager-email">{t('emailAddress')}</Label>
            <Input id="manager-email" type="email" {...register('email')} />
            {errors.email && <p className="text-xs text-red-600">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="manager-phone">{t('phoneNumber')}</Label>
            <Input id="manager-phone" {...register('phone')} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="manager-password">{t('managerNewPassword')}</Label>
            <Input
              id="manager-password"
              type="password"
              autoComplete="new-password"
              placeholder={t('managerPasswordLeaveBlank')}
              {...register('password')}
            />
            {errors.password && (
              <p className="text-xs text-red-600">{errors.password.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="manager-center">{t('managerSelectCenter')}</Label>
            <select
              id="manager-center"
              className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
              {...register('centerId')}
              disabled={watchedStatus === 'INACTIVE'}
            >
              <option value="">{t('managerSelectCenter')}</option>
              {selectableCenters.map((center) => (
                <option key={center.id} value={center.id}>
                  {center.name}
                </option>
              ))}
            </select>
            {watchedStatus === 'INACTIVE' && (
              <p className="text-xs text-slate-500">{t('managerInactiveCenterHint')}</p>
            )}
            {errors.centerId && (
              <p className="text-xs text-red-600">{errors.centerId.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="manager-status">{t('managerStatus')}</Label>
            <select
              id="manager-status"
              className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
              {...register('status')}
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
            <Button type="submit" disabled={isSubmitting || updateManager.isPending}>
              {isSubmitting || updateManager.isPending ? t('saving') : t('saveChanges')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
