'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Input, Label, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/shared/components/ui';
import { useUpdateGroup, useGroup, type UpdateGroupDto } from '@/features/groups';
import type { GroupScheduleEntry } from '../types';
import { useCenters } from '@/features/centers';
import { useTeachers } from '@/features/teachers';
import { useState, useEffect, Fragment } from 'react';
import { ApiError, getErrorMessage } from '@/shared/lib/api';
import { GroupCalendarScheduleSection } from './GroupCalendarScheduleSection';
import { GroupIconPicker } from './GroupIconPicker';
import { isGroupIconKey, type GroupIconKey } from '@ilona/types';
import { normalizeGroupSchedulePayload, scheduleSlotsValidationError } from '../group-schedule-utils';

const updateGroupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name must be at most 100 characters').optional(),
  level: z.string().max(50, 'Level must be at most 50 characters').optional().or(z.literal('')),
  description: z.string().max(500, 'Description must be at most 500 characters').optional().or(z.literal('')),
  centerId: z.string().min(1, 'Center is required').optional().or(z.literal('')),
  teacherId: z.string().optional().or(z.literal('')),
  substituteTeacherId: z.string().optional().or(z.literal('')),
  isActive: z.boolean().optional(),
});

type UpdateGroupFormData = z.infer<typeof updateGroupSchema>;

const REGENERATE_CONFIRM_MESSAGE = 'GROUP_SCHEDULE_REGENERATION_CONFIRMATION_REQUIRED';

interface EditGroupFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string;
}

export function EditGroupForm({ open, onOpenChange, groupId }: EditGroupFormProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [schedule, setSchedule] = useState<GroupScheduleEntry[]>([]);
  const [calendarEnabled, setCalendarEnabled] = useState(false);
  const [hadCalendarOnLoad, setHadCalendarOnLoad] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [lessonTopic, setLessonTopic] = useState('');
  const [lessonDescription, setLessonDescription] = useState('');
  const [regenerateDialogOpen, setRegenerateDialogOpen] = useState(false);
  const [iconKey, setIconKey] = useState<GroupIconKey | null>(null);
  const updateGroup = useUpdateGroup();
  const { data: group, isLoading } = useGroup(groupId, open);

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
    watch,
    getValues,
  } = useForm<UpdateGroupFormData>({
    resolver: zodResolver(updateGroupSchema),
    defaultValues: {
      name: '',
      level: '',
      description: '',
      centerId: '',
      teacherId: '',
      substituteTeacherId: '',
      isActive: true,
    },
  });
  const watchedTeacherId = watch('teacherId');

  // Update form when group data loads
  useEffect(() => {
    if (group) {
      reset({
        name: group.name,
        level: group.level || '',
        description: group.description || '',
        centerId: group.centerId,
        teacherId: group.teacherId || '',
        substituteTeacherId: group.substituteTeacherId || '',
        isActive: group.isActive,
      });
      const normalized = normalizeGroupSchedulePayload(group.schedule);
      setSchedule(normalized.weeklySlots);
      setHadCalendarOnLoad(!!normalized.calendar);
      setCalendarEnabled(!!normalized.calendar);
      if (normalized.calendar) {
        setDateFrom(normalized.calendar.dateFrom);
        setDateTo(normalized.calendar.dateTo);
        setLessonTopic(normalized.calendar.topic ?? '');
        setLessonDescription(normalized.calendar.description ?? '');
      } else {
        setDateFrom('');
        setDateTo('');
        setLessonTopic('');
        setLessonDescription('');
      }
      setIconKey(isGroupIconKey(group.iconKey) ? group.iconKey : null);
    }
  }, [group, reset]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setErrorMessage(null);
      setSuccessMessage(null);
    }
  }, [open]);

  const buildPayload = (
    data: UpdateGroupFormData,
    confirmReplaceGeneratedLessons: boolean,
  ): UpdateGroupDto => {
    let calendarPlan: UpdateGroupDto['calendarPlan'];
    if (calendarEnabled) {
      calendarPlan = {
        dateFrom,
        dateTo,
        topic: lessonTopic.trim() || undefined,
        description: lessonDescription.trim() || undefined,
      };
    } else if (hadCalendarOnLoad) {
      calendarPlan = null;
    } else {
      calendarPlan = undefined;
    }

    return {
      name: data.name,
      level: data.level || undefined,
      description: data.description || undefined,
      centerId: data.centerId && data.centerId.trim() !== '' ? data.centerId : undefined,
      teacherId: data.teacherId || undefined,
      substituteTeacherId: data.substituteTeacherId ? data.substituteTeacherId : null,
      schedule: schedule.length > 0 ? schedule : null,
      calendarPlan,
      ...(confirmReplaceGeneratedLessons ? { confirmReplaceGeneratedLessons: true } : {}),
      isActive: data.isActive,
      iconKey,
    };
  };

  const persistGroup = async (data: UpdateGroupFormData, confirmReplace: boolean) => {
    if (
      data.substituteTeacherId &&
      data.teacherId &&
      data.substituteTeacherId === data.teacherId
    ) {
      setErrorMessage('Substitute teacher cannot be the same as the main teacher');
      return;
    }

    if (calendarEnabled) {
      if (!data.teacherId?.trim()) {
        setErrorMessage('Select a main teacher to generate calendar lessons.');
        return;
      }
      if (schedule.length === 0) {
        setErrorMessage('Add at least one weekly time slot for calendar generation.');
        return;
      }
      const slotErr = scheduleSlotsValidationError(schedule);
      if (slotErr) {
        setErrorMessage(slotErr);
        return;
      }
      if (!dateFrom || !dateTo) {
        setErrorMessage('Choose a start and end date for the calendar range.');
        return;
      }
      if (dateTo < dateFrom) {
        setErrorMessage('End date must be on or after the start date.');
        return;
      }
    }

    const payload = buildPayload(data, confirmReplace);
    await updateGroup.mutateAsync({ id: groupId, data: payload });
    setSuccessMessage('Group updated successfully!');
    setErrorMessage(null);
    setTimeout(() => {
      onOpenChange(false);
      setSuccessMessage(null);
    }, 1500);
  };

  const onSubmit = async (data: UpdateGroupFormData) => {
    setErrorMessage(null);
    try {
      await persistGroup(data, false);
    } catch (error: unknown) {
      if (
        error instanceof ApiError &&
        error.statusCode === 409 &&
        error.message === REGENERATE_CONFIRM_MESSAGE
      ) {
        setRegenerateDialogOpen(true);
        return;
      }
      const message = getErrorMessage(error, 'Failed to update group. Please try again.');
      setErrorMessage(message);
      setSuccessMessage(null);
    }
  };

  const onConfirmRegenerate = async () => {
    setRegenerateDialogOpen(false);
    setErrorMessage(null);
    try {
      await persistGroup(getValues(), true);
    } catch (error: unknown) {
      const message = getErrorMessage(error, 'Failed to update group. Please try again.');
      setErrorMessage(message);
      setSuccessMessage(null);
    }
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Group</DialogTitle>
            <DialogDescription>Loading group data...</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Fragment>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Group</DialogTitle>
          <DialogDescription>
            Update the group information below. All changes will be saved immediately.
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
            <Label htmlFor="name">
              Group Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              {...register('name')}
              error={errors.name?.message}
              placeholder="Beginner English A1"
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="level">Level</Label>
            <Input
              id="level"
              {...register('level')}
              error={errors.level?.message}
              placeholder="A1, A2, B1, etc."
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label id="edit-group-icon-label">Group Icon</Label>
            <p className="text-xs text-slate-500">Optional — pick one icon or Default for the generic group icon.</p>
            <GroupIconPicker
              value={iconKey}
              onChange={setIconKey}
              disabled={isSubmitting}
              aria-labelledby="edit-group-icon-label"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              {...register('description')}
              rows={3}
              placeholder="Group description..."
              disabled={isSubmitting}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm resize-none ${
                errors.description ? 'border-red-300' : 'border-slate-300'
              } ${isSubmitting ? 'bg-slate-100 cursor-not-allowed' : 'bg-white'}`}
            />
            {errors.description && (
              <p className="text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="centerId">
              Center <span className="text-red-500">*</span>
            </Label>
            <select
              id="centerId"
              {...register('centerId')}
              disabled={isSubmitting || isLoadingCenters || centers.length === 0}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm ${
                errors.centerId ? 'border-red-300' : 'border-slate-300'
              } ${isSubmitting || isLoadingCenters || centers.length === 0 ? 'bg-slate-100 cursor-not-allowed' : 'bg-white'}`}
            >
              <option value="">Select a center</option>
              {centers.map((center) => (
                <option key={center.id} value={center.id}>
                  {center.name}
                </option>
              ))}
            </select>
            {errors.centerId && (
              <p className="text-sm text-red-600">{errors.centerId.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="teacherId">
              Main Teacher {calendarEnabled ? <span className="text-red-500">*</span> : '(Optional)'}
            </Label>
            <select
              id="teacherId"
              {...register('teacherId')}
              disabled={isSubmitting || updateGroup.isPending || isLoadingTeachers}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm ${
                errors.teacherId ? 'border-red-300' : 'border-slate-300'
              } ${isSubmitting || updateGroup.isPending || isLoadingTeachers ? 'bg-slate-100 cursor-not-allowed' : 'bg-white'}`}
            >
              <option value="">No teacher assigned</option>
              {teachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.user.firstName} {teacher.user.lastName}
                </option>
              ))}
            </select>
            {errors.teacherId && (
              <p className="text-sm text-red-600">{errors.teacherId.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="substituteTeacherId">Substitute Teacher (Optional)</Label>
            <select
              id="substituteTeacherId"
              {...register('substituteTeacherId')}
              disabled={isSubmitting || updateGroup.isPending || isLoadingTeachers}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm ${
                errors.substituteTeacherId ? 'border-red-300' : 'border-slate-300'
              } ${isSubmitting || updateGroup.isPending || isLoadingTeachers ? 'bg-slate-100 cursor-not-allowed' : 'bg-white'}`}
            >
              <option value="">No substitute</option>
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
            calendarEnabled={calendarEnabled}
            onCalendarEnabledChange={setCalendarEnabled}
            dateFrom={dateFrom}
            dateTo={dateTo}
            onDateFromChange={setDateFrom}
            onDateToChange={setDateTo}
            lessonTopic={lessonTopic}
            onLessonTopicChange={setLessonTopic}
            lessonDescription={lessonDescription}
            onLessonDescriptionChange={setLessonDescription}
            disabled={isSubmitting || updateGroup.isPending}
          />

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              {...register('isActive')}
              className="w-4 h-4 text-primary border-slate-300 rounded focus:ring-primary"
              disabled={isSubmitting}
            />
            <Label htmlFor="isActive" className="font-normal cursor-pointer">
              Active (Group is currently active and accepting students)
            </Label>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting || updateGroup.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                isSubmitting ||
                updateGroup.isPending ||
                isLoadingCenters ||
                isLoadingTeachers ||
                centers.length === 0
              }
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {isSubmitting || updateGroup.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    <Dialog open={regenerateDialogOpen} onOpenChange={setRegenerateDialogOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Replace auto-generated lessons?</DialogTitle>
          <DialogDescription>
            The calendar schedule changed in a way that requires replacing lessons previously generated from this
            group. Lessons you added manually in the calendar are kept. Confirming will remove matching
            auto-generated lessons in the affected date ranges and recreate them from the new settings.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="ghost" onClick={() => setRegenerateDialogOpen(false)}>
            Go back
          </Button>
          <Button type="button" className="bg-primary text-primary-foreground" onClick={onConfirmRegenerate}>
            Replace and save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </Fragment>
  );
}

