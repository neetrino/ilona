'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Input, Label, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/shared/components/ui';
import { useUpdateLesson, useLesson, type UpdateLessonDto } from '@/features/lessons';
import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';

const updateLessonSchema = z.object({
  date: z.string().min(1, 'Date is required'),
  time: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
  duration: z.number().int('Duration must be a whole number').min(15, 'Duration must be at least 15 minutes').max(240, 'Duration must be at most 240 minutes'),
  topic: z.string().max(200, 'Topic must be at most 200 characters').optional().or(z.literal('')),
  description: z.string().max(1000, 'Description must be at most 1000 characters').optional().or(z.literal('')),
  notes: z.string().max(1000, 'Notes must be at most 1000 characters').optional().or(z.literal('')),
});

type UpdateLessonFormData = z.infer<typeof updateLessonSchema>;

interface EditLessonFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lessonId: string;
}

export function EditLessonForm({ open, onOpenChange, lessonId }: EditLessonFormProps) {
  const t = useTranslations('calendar');
  const tCommon = useTranslations('common');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const updateLesson = useUpdateLesson();
  const { data: lesson, isLoading } = useLesson(lessonId, open);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
  } = useForm<UpdateLessonFormData>({
    resolver: zodResolver(updateLessonSchema),
    defaultValues: {
      date: '',
      time: '',
      duration: 60,
      topic: '',
      description: '',
      notes: '',
    },
  });

  // Update form when lesson data loads
  useEffect(() => {
    if (lesson) {
      const scheduledAt = new Date(lesson.scheduledAt);
      const dateStr = scheduledAt.toISOString().split('T')[0];
      const timeStr = scheduledAt.toTimeString().slice(0, 5); // HH:mm format
      
      reset({
        date: dateStr,
        time: timeStr,
        duration: lesson.duration || 60,
        topic: lesson.topic || '',
        description: lesson.description || '',
        notes: lesson.notes || '',
      });
    }
  }, [lesson, reset]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setErrorMessage(null);
      setSuccessMessage(null);
    }
  }, [open]);

  const onSubmit = async (data: UpdateLessonFormData) => {
    setErrorMessage(null);
    
    try {
      // Combine date and time into ISO string for scheduledAt
      const scheduledAt = new Date(`${data.date}T${data.time}:00`);

      const payload: UpdateLessonDto = {
        scheduledAt: scheduledAt.toISOString(),
        duration: data.duration,
        topic: data.topic || undefined,
        description: data.description || undefined,
        notes: data.notes || undefined,
      };

      await updateLesson.mutateAsync({ id: lessonId, data: payload });
      
      // Show success message
      setSuccessMessage('Lesson updated successfully!');
      setErrorMessage(null);
      
      // Close modal after a brief delay
      setTimeout(() => {
        onOpenChange(false);
        setSuccessMessage(null);
      }, 1500);
    } catch (error: any) {
      // Handle error
      let message = 'Failed to update lesson. Please try again.';
      if (error?.message) {
        message = Array.isArray(error.message) ? error.message[0] : error.message;
      } else if (error?.response?.data?.message) {
        message = Array.isArray(error.response.data.message) 
          ? error.response.data.message[0] 
          : error.response.data.message;
      }
      setErrorMessage(message);
      setSuccessMessage(null);
    }
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Lesson</DialogTitle>
            <DialogDescription>Loading lesson data...</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  const duration = watch('duration');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Lesson</DialogTitle>
          <DialogDescription>
            Update the lesson information below. All changes will be saved immediately.
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

          {/* Group info (read-only) */}
          {lesson?.group && (
            <div className="space-y-2">
              <Label>Group</Label>
              <Input
                value={lesson.group.name}
                disabled
                className="bg-slate-50"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">
                Date <span className="text-red-500">*</span>
              </Label>
              <Input
                id="date"
                type="date"
                {...register('date')}
                error={errors.date?.message}
                disabled={isSubmitting || lesson?.status === 'COMPLETED'}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="time">
                Start Time <span className="text-red-500">*</span>
              </Label>
              <Input
                id="time"
                type="time"
                {...register('time')}
                error={errors.time?.message}
                disabled={isSubmitting || lesson?.status === 'COMPLETED'}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration">
              Duration (minutes) <span className="text-red-500">*</span>
            </Label>
            <Input
              id="duration"
              type="number"
              {...register('duration', { valueAsNumber: true })}
              error={errors.duration?.message}
              placeholder="60"
              min={15}
              max={240}
              step={15}
              disabled={isSubmitting || lesson?.status === 'COMPLETED'}
            />
            {duration && (
              <p className="text-xs text-slate-500">
                End time: {(() => {
                  const date = watch('date');
                  const time = watch('time');
                  if (date && time) {
                    const start = new Date(`${date}T${time}:00`);
                    const end = new Date(start.getTime() + duration * 60 * 1000);
                    return end.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
                  }
                  return '—';
                })()}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="topic">Topic</Label>
            <Input
              id="topic"
              {...register('topic')}
              error={errors.topic?.message}
              placeholder="Lesson topic"
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              {...register('description')}
              rows={3}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm ${
                errors.description ? 'border-red-300' : 'border-slate-300'
              } ${isSubmitting ? 'bg-slate-100 cursor-not-allowed' : ''}`}
              placeholder="Lesson description"
              disabled={isSubmitting}
            />
            {errors.description && (
              <p className="text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <textarea
              id="notes"
              {...register('notes')}
              rows={3}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm ${
                errors.notes ? 'border-red-300' : 'border-slate-300'
              } ${isSubmitting ? 'bg-slate-100 cursor-not-allowed' : ''}`}
              placeholder="Internal notes"
              disabled={isSubmitting}
            />
            {errors.notes && (
              <p className="text-sm text-red-600">{errors.notes.message}</p>
            )}
          </div>

          {lesson?.status === 'COMPLETED' && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-600">
                This lesson is completed. Date, time, and duration cannot be changed.
              </p>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

