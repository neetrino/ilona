'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslations } from 'next-intl';
import {
  Button,
  Input,
  Label,
  PasswordInput,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/shared/components/ui';
import { useCreateTeacher, type CreateTeacherDto } from '@/features/teachers';
import { useState, useEffect, useMemo } from 'react';
import { getErrorMessage } from '@/shared/lib/api';
import { useCenters } from '@/features/centers';

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
    if (!open) {
      reset();
      setErrorMessage(null);
      setSuccessMessage(null);
    }
  }, [open, reset]);

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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{tForm('addTitle')}</DialogTitle>
          <DialogDescription>{tForm('addDescription')}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {successMessage && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-600">{successMessage}</p>
            </div>
          )}
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{errorMessage}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
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

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                reset();
                onOpenChange(false);
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
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
