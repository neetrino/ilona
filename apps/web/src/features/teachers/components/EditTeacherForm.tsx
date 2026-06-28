'use client';

import * as DialogPrimitive from '@radix-ui/react-dialog';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslations } from 'next-intl';
import { Button, Input, Label } from '@/shared/components/ui';
import { useUpdateTeacher, useTeacher, type Teacher, type UpdateTeacherDto } from '@/features/teachers';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { getErrorMessage } from '@/shared/lib/api';
import { useCenters } from '@/features/centers';
import {
  createOptionalExperienceYearsSchema,
  experienceYearsFieldRegisterOptions,
  getExperienceYearsFromHireDate,
} from '@/features/teachers/utils/experience';
import { cn } from '@/shared/lib/utils';
import { ADMIN_ICON_BUTTON_SM_CLASS } from '@/shared/lib/admin-control-theme';
import { SingleSelectDropdown, portaledDropdownDialogHandlers } from '@/shared/components/ui/single-select-dropdown';
import { PortalFormSheetDragHandle } from '@/shared/components/ui/portal-form-sheet-drag-handle';
import { usePortalSheetDrag } from '@/shared/hooks/usePortalSheetDrag';
import {
  PORTAL_FORM_SHEET_CLOSE_BUTTON_CLASS,
  PORTAL_FORM_SHEET_HEADER_CLASS,
  PORTAL_FORM_SHEET_OVERLAY_CLASS,
  PORTAL_FORM_SHEET_SCROLL_CLASS,
  portalFormSheetContentClass,
} from '@/shared/lib/portal-form-sheet-classes';
import { Trash2, X } from 'lucide-react';

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
  onDelete?: (teacher: Teacher) => void;
  onDeactivate?: (teacher: Teacher) => void;
}

export function EditTeacherForm({
  open,
  onOpenChange,
  teacherId,
  onDelete,
  onDeactivate,
}: EditTeacherFormProps) {
  const t = useTranslations('teachers');
  const tForm = useTranslations('teachers.form');
  const tVal = useTranslations('teachers.validation');
  const tCommon = useTranslations('common');
  const tStatus = useTranslations('status');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(open);
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
        experienceYears: createOptionalExperienceYearsSchema(tVal),
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
      videoUrl: '',
      centerIds: [],
      workingDays: [],
    },
  });

  const selectedCenterIds = watch('centerIds') ?? [];
  const watchedStatus = watch('status') ?? 'ACTIVE';
  const isTeacherActive = teacher?.user?.status === 'ACTIVE';
  const isFormBusy = isSubmitting || updateTeacher.isPending || isLoadingTeacher;

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
      const experienceYears = getExperienceYearsFromHireDate(teacher.hireDate);
      setValue('experienceYears', experienceYears ?? undefined);
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
    setIsDialogOpen(open);
  }, [open]);

  useEffect(() => {
    if (!open) {
      reset();
      setErrorMessage(null);
      setSuccessMessage(null);
    }
  }, [open, reset]);

  const requestClose = useCallback(() => {
    setIsDialogOpen(false);
    onOpenChange(false);
  }, [onOpenChange]);

  const { dragStyle, dragHandleProps, resetDrag } = usePortalSheetDrag({
    enabled: true,
    onClose: requestClose,
  });

  useEffect(() => {
    if (!open) {
      resetDrag();
    }
  }, [open, resetDrag]);

  const onSubmit = async (data: UpdateTeacherFormData) => {
    setErrorMessage(null);
    
    try {
      const payload: UpdateTeacherDto = {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone || undefined,
        status: data.status,
        hourlyRate: data.hourlyRate,
        experienceYears: data.experienceYears ?? null,
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

  const renderHeaderActions = () => (
    <div className="flex shrink-0 items-center gap-3">
      {onDelete && teacher ? (
        <button
          type="button"
          aria-label={tCommon('delete')}
          title={tCommon('delete')}
          disabled={isFormBusy}
          onClick={() => onDelete(teacher)}
          className={`${ADMIN_ICON_BUTTON_SM_CLASS} text-slate-500 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50`}
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
        </button>
      ) : null}
      {onDeactivate && teacher ? (
        <button
          type="button"
          role="switch"
          aria-checked={isTeacherActive}
          aria-label={isTeacherActive ? t('deactivate') : t('activate')}
          disabled={isFormBusy}
          onClick={() => onDeactivate(teacher)}
          className={cn(
            'relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors focus:outline-none focus:ring-4 focus:ring-green-500/20 disabled:cursor-not-allowed disabled:opacity-50',
            isTeacherActive ? 'bg-green-500' : 'bg-[#f1f1f2]',
          )}
        >
          <span
            className={cn(
              'pointer-events-none inline-block h-5 w-5 rounded-full border border-gray-300 bg-white transition-transform',
              isTeacherActive ? 'translate-x-5 border-white' : 'translate-x-0.5',
            )}
          />
        </button>
      ) : null}
      <DialogPrimitive.Close
        className={PORTAL_FORM_SHEET_CLOSE_BUTTON_CLASS}
        aria-label={tCommon('close')}
      >
        <X className="h-4 w-4" />
      </DialogPrimitive.Close>
    </div>
  );

  return (
    <DialogPrimitive.Root open={isDialogOpen} onOpenChange={(nextOpen) => !nextOpen && requestClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className={PORTAL_FORM_SHEET_OVERLAY_CLASS} />
        <DialogPrimitive.Content
          style={dragStyle}
          {...portaledDropdownDialogHandlers}
          className={portalFormSheetContentClass('2xl')}
          aria-describedby={undefined}
        >
          <PortalFormSheetDragHandle dragHandleProps={dragHandleProps} />
          <DialogPrimitive.Title className="sr-only">{tForm('editTitle')}</DialogPrimitive.Title>
          <div className={PORTAL_FORM_SHEET_HEADER_CLASS}>
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-semibold text-[#3b3b40]">{tForm('editTitle')}</h2>
              </div>
              {renderHeaderActions()}
            </div>
          </div>
          <div className={PORTAL_FORM_SHEET_SCROLL_CLASS}>

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

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                <input type="hidden" {...register('status')} />
                <SingleSelectDropdown
                  id="status"
                  className="w-full"
                  triggerClassName="h-10 rounded-md border-input bg-background py-2 shadow-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  options={[
                    { id: 'ACTIVE', label: tStatus('active') },
                    { id: 'INACTIVE', label: tStatus('inactive') },
                    { id: 'SUSPENDED', label: tStatus('suspended') },
                  ]}
                  value={watchedStatus}
                  onValueChange={(nextValue) =>
                    setValue('status', (nextValue as 'ACTIVE' | 'INACTIVE' | 'SUSPENDED') ?? 'ACTIVE', {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                  }
                />
                {errors.status && (
                  <p className="text-sm text-red-600">{errors.status.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                  {...register('experienceYears', experienceYearsFieldRegisterOptions)}
                  error={errors.experienceYears?.message}
                  placeholder={tForm('experiencePlaceholder')}
                />
              </div>
            </div>

            <div className="mt-8 space-y-2">
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
                        className={`rounded-full border px-3 py-1 text-xs transition focus:outline-none focus-visible:outline-none focus-visible:ring-0 ${
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
                disabled={isSubmitting || updateTeacher.isPending}
              >
                {tCommon('cancel')}
              </Button>
              <Button type="submit" isLoading={isSubmitting || updateTeacher.isPending}>
                {isSubmitting || updateTeacher.isPending ? tForm('saving') : tForm('saveChanges')}
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
