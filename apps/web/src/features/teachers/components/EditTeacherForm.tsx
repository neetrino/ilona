'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslations } from 'next-intl';
import { Button, Input, Label, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/shared/components/ui';
import { useUpdateTeacher, useTeacher, type UpdateTeacherDto } from '@/features/teachers';
import { useState, useEffect, useMemo } from 'react';
import { getErrorMessage } from '@/shared/lib/api';
import { useCenters } from '@/features/centers';
import { getExperienceYearsFromHireDate } from '@/features/teachers/utils/experience';

type UpdateTeacherFormData = {
  firstName: string;
  lastName: string;
  phone?: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  hourlyRate?: number;
  experienceYears?: number;
  videoUrl?: string;
  centerIds?: string[];
  workingDays?: string[];
};

interface EditTeacherFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teacherId: string;
}

export function EditTeacherForm({ open, onOpenChange, teacherId }: EditTeacherFormProps) {
  const t = useTranslations('teachers');
  const tForm = useTranslations('teachers.form');
  const tVal = useTranslations('teachers.validation');
  const tCommon = useTranslations('common');
  const tStatus = useTranslations('status');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const updateTeacher = useUpdateTeacher();
  const { data: teacher, isLoading: isQueryLoading } = useTeacher(teacherId, open);
  const isLoadingTeacher =
    isQueryLoading || Boolean(teacher && teacher.id !== teacherId);
  const { data: centersData } = useCenters({ isActive: true, take: 100 }, open);
  const centers = centersData?.items ?? [];

  const updateTeacherSchema = useMemo(
    () =>
      z.object({
        firstName: z.string().min(2, tVal('firstNameMin')).max(50, tVal('firstNameMax')),
        lastName: z.string().min(2, tVal('lastNameMin')).max(50, tVal('lastNameMax')),
        phone: z.string().optional(),
        status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).optional(),
        hourlyRate: z.number().min(0, tVal('hourlyRateMin')).optional(),
        experienceYears: z
          .number()
          .int(tVal('experienceInt'))
          .min(0, tVal('experienceMin'))
          .max(80, tVal('experienceMax'))
          .optional(),
        videoUrl: z
          .string()
          .trim()
          .max(500, tVal('videoUrlMax'))
          .url(tVal('videoUrlInvalid'))
          .optional()
          .or(z.literal('').transform(() => undefined)),
        centerIds: z.array(z.string()).optional(),
        workingDays: z.array(z.string()).optional(),
      }),
    [tVal],
  );

  const resolver = useMemo(() => zodResolver(updateTeacherSchema), [updateTeacherSchema]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
  } = useForm<UpdateTeacherFormData>({
    resolver,
    defaultValues: {
      firstName: '',
      lastName: '',
      phone: '',
      hourlyRate: 0,
      experienceYears: 0,
      videoUrl: '',
      centerIds: [],
      workingDays: [],
    },
  });

  const selectedCenterIds = watch('centerIds') ?? [];

  const toggleCenter = (centerId: string) => {
    const next = selectedCenterIds.includes(centerId)
      ? selectedCenterIds.filter((c) => c !== centerId)
      : [...selectedCenterIds, centerId];
    setValue('centerIds', next, { shouldDirty: true });
  };

  // Pre-fill form when teacher data is loaded
  useEffect(() => {
    if (teacher && open && teacher.id === teacherId) {
      setValue('firstName', teacher.user.firstName || '');
      setValue('lastName', teacher.user.lastName || '');
      setValue('phone', teacher.user.phone || '');
      setValue('status', teacher.user.status);
      setValue('hourlyRate', teacher.hourlyRate || 0);
      setValue('experienceYears', getExperienceYearsFromHireDate(teacher.hireDate));
      setValue('videoUrl', teacher.videoUrl ?? '');
      const linkedCenterIds = teacher.centerLinks?.map((l) => l.center.id) ?? [];
      setValue('centerIds', linkedCenterIds);
      setValue('workingDays', teacher.workingDays || []);
      setErrorMessage(null);
      setSuccessMessage(null);
    }
  }, [teacher, teacherId, open, setValue]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      reset();
      setErrorMessage(null);
      setSuccessMessage(null);
    }
  }, [open, reset]);

  const onSubmit = async (data: UpdateTeacherFormData) => {
    setErrorMessage(null);
    
    try {
      const payload: UpdateTeacherDto = {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone || undefined,
        status: data.status,
        hourlyRate: data.hourlyRate,
        experienceYears: data.experienceYears,
        videoUrl: data.videoUrl ? data.videoUrl : null,
        centerIds: data.centerIds ?? [],
        workingDays: data.workingDays && data.workingDays.length > 0 ? data.workingDays : undefined,
      };

      await updateTeacher.mutateAsync({ id: teacherId, data: payload });
      
      setSuccessMessage(tForm('updatedSuccess'));
      setErrorMessage(null);
      
      setTimeout(() => {
        onOpenChange(false);
        setSuccessMessage(null);
      }, 1500);
    } catch (error: unknown) {
      const message = getErrorMessage(error, tForm('failedUpdate'));
      setErrorMessage(message);
      setSuccessMessage(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{tForm('editTitle')}</DialogTitle>
          <DialogDescription>{tForm('editDescription')}</DialogDescription>
        </DialogHeader>

        {isLoadingTeacher ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          </div>
        ) : (
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
              <Label htmlFor="status">{tCommon('status')}</Label>
              <select
                id="status"
                {...register('status')}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="ACTIVE">{tStatus('active')}</option>
                <option value="INACTIVE">{tStatus('inactive')}</option>
                <option value="SUSPENDED">{tStatus('suspended')}</option>
              </select>
              {errors.status && (
                <p className="text-sm text-red-600">{errors.status.message}</p>
              )}
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
              <Label htmlFor="experienceYears">{t('experienceYears')}</Label>
              <Input
                id="experienceYears"
                type="number"
                min="0"
                max="80"
                step="1"
                {...register('experienceYears', { valueAsNumber: true })}
                error={errors.experienceYears?.message}
                placeholder={tForm('experiencePlaceholder')}
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
              <p className="text-xs text-slate-500">{tForm('videoUrlHint')}</p>
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
                disabled={isSubmitting || updateTeacher.isPending}
              >
                {tCommon('cancel')}
              </Button>
              <Button type="submit" isLoading={isSubmitting || updateTeacher.isPending}>
                {isSubmitting || updateTeacher.isPending ? tForm('saving') : tForm('saveChanges')}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
