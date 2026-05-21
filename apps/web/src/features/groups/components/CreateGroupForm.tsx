'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslations } from 'next-intl';
import { Button, Input, Label, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/shared/components/ui';
import { useCreateGroup, type CreateGroupDto } from '@/features/groups';
import type { GroupScheduleEntry } from '../types';
import { useCenters } from '@/features/centers';
import { useTeachers } from '@/features/teachers';
import { useState, useEffect, useMemo } from 'react';
import { getErrorMessage } from '@/shared/lib/api';
import { GroupCalendarScheduleSection } from './GroupCalendarScheduleSection';
import { GroupIconPicker } from './GroupIconPicker';
import type { GroupIconKey } from '@ilona/types';
import { defaultMonthDateRange, scheduleSlotsValidationError } from '../group-schedule-utils';

type CreateGroupFormData = {
  name: string;
  level?: string;
  centerId: string;
  teacherId?: string;
  substituteTeacherId?: string;
};

function translateScheduleSlotError(
  err: string | null,
  tVal: (key: 'slotEndAfterStart' | 'slotDuration') => string,
): string | null {
  if (!err) return null;
  if (err.includes('end time after')) return tVal('slotEndAfterStart');
  if (err.includes('between 15 and 240')) return tVal('slotDuration');
  return err;
}

interface CreateGroupFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultCenterId?: string;
}

export function CreateGroupForm({ open, onOpenChange, defaultCenterId }: CreateGroupFormProps) {
  const tForm = useTranslations('groups.form');
  const tVal = useTranslations('groups.validation');
  const tCommon = useTranslations('common');

  const createGroupSchema = useMemo(
    () =>
      z.object({
        name: z.string().min(2, tVal('nameMin')).max(100, tVal('nameMax')),
        level: z.string().max(50, tVal('levelMax')).optional().or(z.literal('')),
        centerId: z.string().min(1, tVal('selectCenter')),
        teacherId: z.string().optional().or(z.literal('')),
        substituteTeacherId: z.string().optional().or(z.literal('')),
      }),
    [tVal],
  );

  const resolver = useMemo(() => zodResolver(createGroupSchema), [createGroupSchema]);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [schedule, setSchedule] = useState<GroupScheduleEntry[]>([]);
  const [dateFrom, setDateFrom] = useState(() => defaultMonthDateRange().from);
  const [dateTo, setDateTo] = useState(() => defaultMonthDateRange().to);
  const [iconKey, setIconKey] = useState<GroupIconKey | null>(null);
  const createGroup = useCreateGroup();

  // Fetch centers and teachers for dropdowns
  const { data: centersData, isLoading: isLoadingCenters } = useCenters({ 
    isActive: undefined, // Get all centers (active and inactive)
    take: 100, // API max is 100, ensures we get all centers
  });
  const { data: teachersData, isLoading: isLoadingTeachers } = useTeachers({ status: 'ACTIVE' });
  
  const centers = centersData?.items || [];
  const teachers = teachersData?.items || [];

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
  } = useForm<CreateGroupFormData>({
    resolver,
    defaultValues: {
      name: '',
      level: '',
      centerId: defaultCenterId || '',
      teacherId: '',
      substituteTeacherId: '',
    },
  });
  const watchedTeacherId = watch('teacherId');

  // Watch centerId to update when defaultCenterId changes
  const centerId = watch('centerId');

  // Update centerId when defaultCenterId prop changes
  useEffect(() => {
    if (defaultCenterId && defaultCenterId !== centerId) {
      setValue('centerId', defaultCenterId);
    }
  }, [defaultCenterId, centerId, setValue]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      reset({
        name: '',
        level: '',
        centerId: defaultCenterId || '',
        teacherId: '',
        substituteTeacherId: '',
      });
      setSchedule([]);
      const r = defaultMonthDateRange();
      setDateFrom(r.from);
      setDateTo(r.to);
      setIconKey(null);
      setErrorMessage(null);
      setSuccessMessage(null);
    }
  }, [open, reset, defaultCenterId]);

  const onSubmit = async (data: CreateGroupFormData) => {
    setErrorMessage(null);
    
    try {
      if (
        data.substituteTeacherId &&
        data.teacherId &&
        data.substituteTeacherId === data.teacherId
      ) {
        setErrorMessage(tForm('substituteSameAsMain'));
        return;
      }

      if (schedule.length > 0) {
        if (!data.teacherId?.trim()) {
          setErrorMessage(tForm('selectMainTeacherForCalendar'));
          return;
        }
        const slotErr = translateScheduleSlotError(scheduleSlotsValidationError(schedule), tVal);
        if (slotErr) {
          setErrorMessage(slotErr);
          return;
        }
        if (!dateFrom || !dateTo) {
          setErrorMessage(tForm('chooseCalendarDateRange'));
          return;
        }
        if (dateTo < dateFrom) {
          setErrorMessage(tForm('endDateOnOrAfterStart'));
          return;
        }
      }

      const payload: CreateGroupDto = {
        name: data.name,
        level: data.level || undefined,
        centerId: data.centerId,
        teacherId: data.teacherId || undefined,
        substituteTeacherId: data.substituteTeacherId || undefined,
        schedule: schedule.length > 0 ? schedule : undefined,
        calendarPlan: schedule.length > 0 ? { dateFrom, dateTo } : undefined,
        ...(iconKey ? { iconKey } : {}),
      };

      await createGroup.mutateAsync(payload);
      
      // Show success message
      setSuccessMessage(tForm('createdSuccess'));
      setErrorMessage(null);
      
      // Reset form and close modal after a brief delay
      reset({
        name: '',
        level: '',
        centerId: defaultCenterId || '',
        teacherId: '',
        substituteTeacherId: '',
      });
      setSchedule([]);
      const r = defaultMonthDateRange();
      setDateFrom(r.from);
      setDateTo(r.to);
      setIconKey(null);
      setTimeout(() => {
        onOpenChange(false);
        setSuccessMessage(null);
      }, 1500);
    } catch (error: unknown) {
      // Handle error
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

          <div className="space-y-2">
            <Label htmlFor="name">
              {tForm('groupName')} <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              {...register('name')}
              error={errors.name?.message}
              placeholder={tForm('namePlaceholder')}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="level">{tCommon('level')}</Label>
            <Input
              id="level"
              {...register('level')}
              error={errors.level?.message}
              placeholder={tForm('levelPlaceholder')}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label id="group-icon-label">{tForm('groupIcon')}</Label>
            <p className="text-xs text-slate-500">{tForm('iconHintCreate')}</p>
            <GroupIconPicker
              value={iconKey}
              onChange={setIconKey}
              disabled={isSubmitting}
              aria-labelledby="group-icon-label"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="centerId">
              {tCommon('center')} <span className="text-red-500">*</span>
            </Label>
            <select
              id="centerId"
              {...register('centerId')}
              disabled={isSubmitting || isLoadingCenters || centers.length === 0}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm ${
                errors.centerId ? 'border-red-300' : 'border-slate-300'
              } ${isSubmitting || isLoadingCenters || centers.length === 0 ? 'bg-slate-100 cursor-not-allowed' : 'bg-white'}`}
            >
              <option value="">{tForm('selectCenter')}</option>
              {centers.map((center) => (
                <option key={center.id} value={center.id}>
                  {center.name}
                </option>
              ))}
            </select>
            {errors.centerId && (
              <p className="text-sm text-red-600">{errors.centerId.message}</p>
            )}
            {isLoadingCenters && (
              <p className="text-sm text-slate-500">{tForm('loadingCenters')}</p>
            )}
            {!isLoadingCenters && centers.length === 0 && (
              <p className="text-sm text-amber-600">{tForm('noCentersAvailable')}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="teacherId">
              {tForm('mainTeacher')}{' '}
              {schedule.length > 0 ? (
                <span className="text-red-500">*</span>
              ) : (
                tForm('optional')
              )}
            </Label>
            <select
              id="teacherId"
              {...register('teacherId')}
              disabled={isSubmitting || createGroup.isPending || isLoadingTeachers}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm ${
                errors.teacherId ? 'border-red-300' : 'border-slate-300'
              } ${isSubmitting || isLoadingTeachers ? 'bg-slate-100 cursor-not-allowed' : 'bg-white'}`}
            >
              <option value="">{tForm('noTeacherAssigned')}</option>
              {teachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.user.firstName} {teacher.user.lastName}
                </option>
              ))}
            </select>
            {errors.teacherId && (
              <p className="text-sm text-red-600">{errors.teacherId.message}</p>
            )}
            {isLoadingTeachers && (
              <p className="text-sm text-slate-500">{tForm('loadingTeachers')}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="substituteTeacherId">{tForm('substituteTeacherOptional')}</Label>
            <select
              id="substituteTeacherId"
              {...register('substituteTeacherId')}
              disabled={isSubmitting || createGroup.isPending || isLoadingTeachers}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm ${
                errors.substituteTeacherId ? 'border-red-300' : 'border-slate-300'
              } ${isSubmitting || createGroup.isPending || isLoadingTeachers ? 'bg-slate-100 cursor-not-allowed' : 'bg-white'}`}
            >
              <option value="">{tForm('noSubstitute')}</option>
              {teachers
                .filter((t) => t.id !== watchedTeacherId)
                .map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.user.firstName} {teacher.user.lastName}
                  </option>
                ))}
            </select>
          </div>

          <GroupCalendarScheduleSection
            schedule={schedule}
            onScheduleChange={setSchedule}
            dateFrom={dateFrom}
            dateTo={dateTo}
            onDateFromChange={setDateFrom}
            onDateToChange={setDateTo}
            disabled={isSubmitting || createGroup.isPending}
          />

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting || createGroup.isPending}
            >
              {tCommon('cancel')}
            </Button>
            <Button
              type="submit"
              disabled={
                isSubmitting ||
                createGroup.isPending ||
                isLoadingCenters ||
                isLoadingTeachers ||
                centers.length === 0
              }
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isSubmitting || createGroup.isPending ? tForm('creating') : tForm('createGroup')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

