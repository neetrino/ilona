'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Input, Label, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/shared/components/ui';
import { useCreateRecurringLessons, type CreateRecurringLessonsDto } from '@/features/lessons';
import { useMyGroups } from '@/features/groups';
import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { api, getErrorMessage } from '@/shared/lib/api';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/shared/lib/utils';

const WEEKDAYS = [
  { value: 0, label: 'Sun', fullLabel: 'Sunday' },
  { value: 1, label: 'Mon', fullLabel: 'Monday' },
  { value: 2, label: 'Tue', fullLabel: 'Tuesday' },
  { value: 3, label: 'Wed', fullLabel: 'Wednesday' },
  { value: 4, label: 'Thu', fullLabel: 'Thursday' },
  { value: 5, label: 'Fri', fullLabel: 'Friday' },
  { value: 6, label: 'Sat', fullLabel: 'Saturday' },
];

const createCourseSchema = z.object({
  groupId: z.string().min(1, 'Please select a group'),
  weekdays: z.array(z.number()).min(1, 'Please select at least one weekday'),
  startTime: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
  endTime: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
  startDate: z.string().min(1, 'Please select start date'),
  endDate: z.string().min(1, 'Please select end date'),
  topic: z.string().max(200, 'Topic must be at most 200 characters').optional().or(z.literal('')),
  description: z.string().max(1000, 'Description must be at most 1000 characters').optional().or(z.literal('')),
}).refine((data) => {
  const [startH, startM] = data.startTime.split(':').map(Number);
  const [endH, endM] = data.endTime.split(':').map(Number);
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;
  return endMinutes > startMinutes;
}, {
  message: 'End time must be after start time',
  path: ['endTime'],
}).refine((data) => {
  const startDate = new Date(data.startDate);
  const endDate = new Date(data.endDate);
  return endDate >= startDate;
}, {
  message: 'End date must be after or equal to start date',
  path: ['endDate'],
});

type CreateCourseFormData = z.infer<typeof createCourseSchema>;

interface AddCourseFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Hook to get current teacher profile
function useMyTeacherProfile() {
  return useQuery({
    queryKey: ['teachers', 'me'],
    queryFn: async () => {
      const response = await api.get<{ id: string }>('/teachers/me');
      return response;
    },
  });
}

export function AddCourseForm({ open, onOpenChange }: AddCourseFormProps) {
  const t = useTranslations('calendar');
  const tCommon = useTranslations('common');
  const queryClient = useQueryClient();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const createRecurringLessons = useCreateRecurringLessons();
  
  // Fetch teacher's groups and profile
  const { data: groups = [], isLoading: isLoadingGroups } = useMyGroups();
  const { data: teacherProfile, isLoading: isLoadingTeacher } = useMyTeacherProfile();

  // Get default dates (tomorrow to 4 weeks from tomorrow)
  const getDefaultDates = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const endDate = new Date(tomorrow);
    endDate.setDate(endDate.getDate() + 28); // 4 weeks
    
    return {
      startDate: tomorrow.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
    };
  };

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
  } = useForm<CreateCourseFormData>({
    resolver: zodResolver(createCourseSchema),
    defaultValues: {
      groupId: '',
      weekdays: [],
      startTime: '17:00',
      endTime: '18:30',
      ...getDefaultDates(),
      topic: '',
      description: '',
    },
  });

  const weekdays = watch('weekdays');
  const startTime = watch('startTime');
  const endTime = watch('endTime');

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      reset({
        groupId: '',
        weekdays: [],
        startTime: '17:00',
        endTime: '18:30',
        ...getDefaultDates(),
        topic: '',
        description: '',
      });
      setErrorMessage(null);
      setSuccessMessage(null);
    }
  }, [open, reset]);

  const toggleWeekday = (dayValue: number) => {
    const current = weekdays || [];
    if (current.includes(dayValue)) {
      setValue('weekdays', current.filter(d => d !== dayValue), { shouldValidate: true });
    } else {
      setValue('weekdays', [...current, dayValue], { shouldValidate: true });
    }
  };

  const onSubmit = async (data: CreateCourseFormData) => {
    if (!teacherProfile?.id) {
      setErrorMessage(t('teacherProfileNotFound') || 'Teacher profile not found. Please try again.');
      return;
    }

    try {
      setErrorMessage(null);
      setSuccessMessage(null);

      const recurringData: CreateRecurringLessonsDto = {
        groupId: data.groupId,
        teacherId: teacherProfile.id,
        weekdays: data.weekdays,
        startTime: data.startTime,
        endTime: data.endTime,
        startDate: data.startDate,
        endDate: data.endDate,
        topic: data.topic || undefined,
        description: data.description || undefined,
      };

      await createRecurringLessons.mutateAsync(recurringData);
      
      // Invalidate calendar queries
      queryClient.invalidateQueries({ queryKey: ['lessons'] });
      
      setSuccessMessage(t('courseCreatedSuccess') || 'Course created successfully!');
      
      // Close dialog after a short delay
      setTimeout(() => {
        onOpenChange(false);
      }, 1500);
    } catch (err: unknown) {
      const errorMsg = getErrorMessage(err, t('courseCreateError') || 'Failed to create course. Please try again.');
      setErrorMessage(errorMsg);
      setSuccessMessage(null);
    }
  };

  const isLoading = isLoadingGroups || isLoadingTeacher;
  const canSubmit = !isSubmitting && !isLoading && groups.length > 0 && teacherProfile?.id && weekdays.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('addCourse') || 'Add Course'}</DialogTitle>
          <DialogDescription>
            {t('addCourseDescription') || 'Fill in the information below to create a new course. Fields marked with * are required.'}
          </DialogDescription>
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
            <Label htmlFor="groupId">
              {t('group') || 'Group'} <span className="text-red-500">*</span>
            </Label>
            <select
              id="groupId"
              {...register('groupId')}
              disabled={isSubmitting || isLoading || groups.length === 0}
              className={cn(
                'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm',
                errors.groupId ? 'border-red-300' : 'border-slate-300',
                (isSubmitting || isLoading || groups.length === 0) && 'bg-slate-100 cursor-not-allowed'
              )}
            >
              <option value="">{t('selectGroup') || 'Select a group'}</option>
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name} {group.level ? `(${group.level})` : ''} {group.center ? `- ${group.center.name}` : ''}
                </option>
              ))}
            </select>
            {errors.groupId && (
              <p className="text-sm text-red-600">{errors.groupId.message}</p>
            )}
            {isLoadingGroups && (
              <p className="text-sm text-slate-500">{tCommon('loading')}</p>
            )}
            {!isLoadingGroups && groups.length === 0 && (
              <p className="text-sm text-amber-600">{t('noGroupsAvailable') || 'No groups available. Please contact admin to assign you to a group.'}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>
              {t('weekdays') || 'Weekdays'} <span className="text-red-500">*</span>
            </Label>
            <div className="flex flex-wrap gap-2">
              {WEEKDAYS.map((day) => {
                const isSelected = weekdays?.includes(day.value);
                return (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => toggleWeekday(day.value)}
                    disabled={isSubmitting}
                    className={cn(
                      'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                      isSelected
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200',
                      isSubmitting && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    {day.label}
                  </button>
                );
              })}
            </div>
            {errors.weekdays && (
              <p className="text-sm text-red-600">{errors.weekdays.message}</p>
            )}
            <p className="text-xs text-slate-500">{t('weekdaysHint') || 'Select the days of the week when the course runs'}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime">
                {t('startTime') || 'Start Time'} <span className="text-red-500">*</span>
              </Label>
              <Input
                id="startTime"
                type="time"
                {...register('startTime')}
                error={errors.startTime?.message}
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endTime">
                {t('endTime') || 'End Time'} <span className="text-red-500">*</span>
              </Label>
              <Input
                id="endTime"
                type="time"
                {...register('endTime')}
                error={errors.endTime?.message}
                disabled={isSubmitting}
              />
            </div>
          </div>
          {startTime && endTime && (
            <p className="text-xs text-slate-500">
              {t('duration')}: {(() => {
                const [startH, startM] = startTime.split(':').map(Number);
                const [endH, endM] = endTime.split(':').map(Number);
                const duration = (endH * 60 + endM) - (startH * 60 + startM);
                return `${duration} ${tCommon('minutes')}`;
              })()}
            </p>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">
                {t('startDate') || 'Start Date'} <span className="text-red-500">*</span>
              </Label>
              <Input
                id="startDate"
                type="date"
                {...register('startDate')}
                error={errors.startDate?.message}
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">
                {t('endDate') || 'End Date'} <span className="text-red-500">*</span>
              </Label>
              <Input
                id="endDate"
                type="date"
                {...register('endDate')}
                error={errors.endDate?.message}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="topic">{t('topic') || 'Topic'}</Label>
            <Input
              id="topic"
              {...register('topic')}
              error={errors.topic?.message}
              placeholder={t('topicPlaceholder') || 'e.g., Present Simple, Vocabulary Review'}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">{tCommon('description')}</Label>
            <textarea
              id="description"
              {...register('description')}
              rows={4}
              className={cn(
                'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm resize-none',
                errors.description ? 'border-red-300' : 'border-slate-300',
                isSubmitting && 'bg-slate-100 cursor-not-allowed'
              )}
              placeholder={t('descriptionPlaceholder') || 'Optional course description or notes...'}
              disabled={isSubmitting}
            />
            {errors.description && (
              <p className="text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              {tCommon('cancel')}
            </Button>
            <Button
              type="submit"
              disabled={!canSubmit}
              isLoading={isSubmitting}
            >
              {isSubmitting ? (t('creating') || 'Creating...') : (t('createCourse') || 'Create Course')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
