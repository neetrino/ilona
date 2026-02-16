'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Input, Label, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/shared/components/ui';
import { useCreateLesson, type CreateLessonDto } from '@/features/lessons';
import { useGroups } from '@/features/groups';
import { useTeachers } from '@/features/teachers';
import { useState, useEffect } from 'react';

const createLessonSchema = z.object({
  groupId: z.string().min(1, 'Please select a group'),
  teacherId: z.string().min(1, 'Please select a teacher'),
  scheduledAt: z.string().min(1, 'Please select date and time'),
  duration: z.number().int('Duration must be a whole number').min(15, 'Duration must be at least 15 minutes').max(240, 'Duration must be at most 240 minutes').optional(),
  topic: z.string().max(200, 'Topic must be at most 200 characters').optional().or(z.literal('')),
  description: z.string().max(1000, 'Description must be at most 1000 characters').optional().or(z.literal('')),
});

type CreateLessonFormData = z.infer<typeof createLessonSchema>;

interface AddLessonFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultDate?: string; // Optional default date in YYYY-MM-DD format
  defaultTime?: string; // Optional default time in HH:mm format
}

export function AddLessonForm({ open, onOpenChange, defaultDate, defaultTime }: AddLessonFormProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const createLesson = useCreateLesson();

  // Fetch groups and teachers
  const { data: groupsData, isLoading: isLoadingGroups } = useGroups({ take: 100, isActive: true });
  const { data: teachersData, isLoading: isLoadingTeachers } = useTeachers({ take: 100 });

  const groups = groupsData?.items || [];
  const teachers = teachersData?.items || [];

  // Combine date and time for scheduledAt
  const getDefaultScheduledAt = () => {
    if (defaultDate && defaultTime) {
      return `${defaultDate}T${defaultTime}`;
    }
    if (defaultDate) {
      return `${defaultDate}T10:00`;
    }
    // Default to tomorrow at 10:00
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];
    return `${dateStr}T10:00`;
  };

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
  } = useForm<CreateLessonFormData>({
    resolver: zodResolver(createLessonSchema),
    defaultValues: {
      groupId: '',
      teacherId: '',
      scheduledAt: getDefaultScheduledAt(),
      duration: 60,
      topic: '',
      description: '',
    },
  });

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      reset({
        groupId: '',
        teacherId: '',
        scheduledAt: getDefaultScheduledAt(),
        duration: 60,
        topic: '',
        description: '',
      });
      setErrorMessage(null);
      setSuccessMessage(null);
    }
  }, [open, reset, defaultDate, defaultTime]);

  const onSubmit = async (data: CreateLessonFormData) => {
    try {
      setErrorMessage(null);
      setSuccessMessage(null);

      const lessonData: CreateLessonDto = {
        groupId: data.groupId,
        teacherId: data.teacherId,
        scheduledAt: new Date(data.scheduledAt).toISOString(),
        duration: data.duration,
        topic: data.topic || undefined,
        description: data.description || undefined,
      };

      await createLesson.mutateAsync(lessonData);
      
      setSuccessMessage('Lesson created successfully!');
      
      // Close dialog after a short delay
      setTimeout(() => {
        onOpenChange(false);
      }, 1500);
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || err?.message || 'Failed to create lesson. Please try again.';
      setErrorMessage(errorMsg);
      setSuccessMessage(null);
    }
  };

  // Split scheduledAt into date and time for the form
  const scheduledAtValue = watch('scheduledAt');
  const [datePart, timePart] = scheduledAtValue ? scheduledAtValue.split('T') : ['', ''];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Lesson</DialogTitle>
          <DialogDescription>
            Fill in the information below to create a new lesson. Fields marked with * are required.
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
              Group <span className="text-red-500">*</span>
            </Label>
            <select
              id="groupId"
              {...register('groupId')}
              disabled={isSubmitting || isLoadingGroups || groups.length === 0}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm ${
                errors.groupId ? 'border-red-300' : 'border-slate-300'
              } ${isSubmitting || isLoadingGroups || groups.length === 0 ? 'bg-slate-100 cursor-not-allowed' : 'bg-white'}`}
            >
              <option value="">Select a group</option>
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
              <p className="text-sm text-slate-500">Loading groups...</p>
            )}
            {!isLoadingGroups && groups.length === 0 && (
              <p className="text-sm text-amber-600">No active groups available. Please create a group first.</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="teacherId">
              Teacher <span className="text-red-500">*</span>
            </Label>
            <select
              id="teacherId"
              {...register('teacherId')}
              disabled={isSubmitting || isLoadingTeachers || teachers.length === 0}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm ${
                errors.teacherId ? 'border-red-300' : 'border-slate-300'
              } ${isSubmitting || isLoadingTeachers || teachers.length === 0 ? 'bg-slate-100 cursor-not-allowed' : 'bg-white'}`}
            >
              <option value="">Select a teacher</option>
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
              <p className="text-sm text-slate-500">Loading teachers...</p>
            )}
            {!isLoadingTeachers && teachers.length === 0 && (
              <p className="text-sm text-amber-600">No teachers available. Please create a teacher first.</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="scheduledDate">
                Date <span className="text-red-500">*</span>
              </Label>
              <Input
                id="scheduledDate"
                type="date"
                value={datePart}
                onChange={(e) => {
                  const newDate = e.target.value;
                  const newDateTime = timePart ? `${newDate}T${timePart}` : `${newDate}T10:00`;
                  setValue('scheduledAt', newDateTime, { shouldValidate: true });
                }}
                error={errors.scheduledAt?.message}
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="scheduledTime">
                Time <span className="text-red-500">*</span>
              </Label>
              <Input
                id="scheduledTime"
                type="time"
                value={timePart}
                onChange={(e) => {
                  const newTime = e.target.value;
                  const newDateTime = datePart ? `${datePart}T${newTime}` : `${new Date().toISOString().split('T')[0]}T${newTime}`;
                  setValue('scheduledAt', newDateTime, { shouldValidate: true });
                }}
                error={errors.scheduledAt?.message}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration">Duration (minutes)</Label>
            <Input
              id="duration"
              type="number"
              {...register('duration', { valueAsNumber: true })}
              error={errors.duration?.message}
              placeholder="60"
              min={15}
              max={240}
              step={15}
              disabled={isSubmitting}
            />
            <p className="text-xs text-slate-500">Duration between 15 and 240 minutes (default: 60)</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="topic">Topic</Label>
            <Input
              id="topic"
              {...register('topic')}
              error={errors.topic?.message}
              placeholder="e.g., Present Simple, Vocabulary Review"
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              {...register('description')}
              rows={4}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm resize-none ${
                errors.description ? 'border-red-300' : 'border-slate-300'
              } ${isSubmitting ? 'bg-slate-100 cursor-not-allowed' : 'bg-white'}`}
              placeholder="Optional lesson description or notes..."
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
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || isLoadingGroups || isLoadingTeachers || groups.length === 0 || teachers.length === 0}
            >
              {isSubmitting ? 'Creating...' : 'Create Lesson'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}








