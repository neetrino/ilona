'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslations, useLocale } from 'next-intl';
import { Button, Input, Label, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/shared/components/ui';
import { useUpdateLesson, useLesson, type UpdateLessonDto } from '@/features/lessons';
import { useState, useEffect, useMemo } from 'react';
import { getErrorMessage } from '@/shared/lib/api';

type UpdateLessonFormData = {
  date: string;
  time: string;
  duration: number;
  topic?: string;
  description?: string;
  notes?: string;
};

interface EditLessonFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lessonId: string;
}

export function EditLessonForm({ open, onOpenChange, lessonId }: EditLessonFormProps) {
  const tLessons = useTranslations('lessons');
  const tForm = useTranslations('lessons.form');
  const tVal = useTranslations('lessons.validation');
  const tCommon = useTranslations('common');
  const locale = useLocale();

  const updateLessonSchema = useMemo(
    () =>
      z.object({
        date: z.string().min(1, tVal('dateRequired')),
        time: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, tVal('invalidTimeFormat')),
        duration: z
          .number()
          .int(tVal('durationInt'))
          .min(15, tVal('durationMin'))
          .max(240, tVal('durationMax')),
        topic: z.string().max(200, tVal('topicMax')).optional().or(z.literal('')),
        description: z.string().max(1000, tVal('descriptionMax')).optional().or(z.literal('')),
        notes: z.string().max(1000, tVal('notesMax')).optional().or(z.literal('')),
      }),
    [tVal],
  );

  const resolver = useMemo(() => zodResolver(updateLessonSchema), [updateLessonSchema]);

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
    resolver,
    defaultValues: {
      date: '',
      time: '',
      duration: 60,
      topic: '',
      description: '',
      notes: '',
    },
  });

  useEffect(() => {
    if (lesson) {
      const scheduledAt = new Date(lesson.scheduledAt);
      const dateStr = scheduledAt.toISOString().split('T')[0];
      const timeStr = scheduledAt.toTimeString().slice(0, 5);

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

  useEffect(() => {
    if (!open) {
      setErrorMessage(null);
      setSuccessMessage(null);
    }
  }, [open]);

  const onSubmit = async (data: UpdateLessonFormData) => {
    setErrorMessage(null);

    try {
      const scheduledAt = new Date(`${data.date}T${data.time}:00`);

      const payload: UpdateLessonDto = {
        scheduledAt: scheduledAt.toISOString(),
        duration: data.duration,
        topic: data.topic || undefined,
        description: data.description || undefined,
        notes: data.notes || undefined,
      };

      await updateLesson.mutateAsync({ id: lessonId, data: payload });

      setSuccessMessage(tForm('lessonUpdatedSuccess'));
      setErrorMessage(null);

      setTimeout(() => {
        onOpenChange(false);
        setSuccessMessage(null);
      }, 1500);
    } catch (error: unknown) {
      const message = getErrorMessage(error, tVal('failedToUpdate'));
      setErrorMessage(message);
      setSuccessMessage(null);
    }
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{tForm('editTitle')}</DialogTitle>
            <DialogDescription>{tForm('loadingLessonData')}</DialogDescription>
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
          <DialogTitle>{tForm('editTitle')}</DialogTitle>
          <DialogDescription>{tForm('editDescription')}</DialogDescription>
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

          {lesson?.group && (
            <div className="space-y-2">
              <Label>{tCommon('group')}</Label>
              <Input value={lesson.group.name} disabled className="bg-slate-50" />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">
                {tCommon('date')} <span className="text-red-500">*</span>
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
                {tForm('startTime')} <span className="text-red-500">*</span>
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
              {tForm('durationMinutes')} <span className="text-red-500">*</span>
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
                {tForm('endTimePreview', {
                  time: (() => {
                    const date = watch('date');
                    const time = watch('time');
                    if (date && time) {
                      const start = new Date(`${date}T${time}:00`);
                      const end = new Date(start.getTime() + duration * 60 * 1000);
                      return end.toLocaleTimeString(locale, {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false,
                      });
                    }
                    return '—';
                  })(),
                })}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="topic">{tLessons('topic')}</Label>
            <Input
              id="topic"
              {...register('topic')}
              error={errors.topic?.message}
              placeholder={tForm('topicPlaceholder')}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">{tCommon('description')}</Label>
            <textarea
              id="description"
              {...register('description')}
              rows={3}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-4 focus:ring-[#1010a3]/10 focus:border-[#1010a3]/45 text-sm ${
                errors.description ? 'border-red-300' : 'border-slate-300'
              } ${isSubmitting ? 'bg-slate-100 cursor-not-allowed' : ''}`}
              placeholder={tForm('descriptionPlaceholderLong')}
              disabled={isSubmitting}
            />
            {errors.description && <p className="text-sm text-red-600">{errors.description.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">{tCommon('notes')}</Label>
            <textarea
              id="notes"
              {...register('notes')}
              rows={3}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-4 focus:ring-[#1010a3]/10 focus:border-[#1010a3]/45 text-sm ${
                errors.notes ? 'border-red-300' : 'border-slate-300'
              } ${isSubmitting ? 'bg-slate-100 cursor-not-allowed' : ''}`}
              placeholder={tForm('notesPlaceholder')}
              disabled={isSubmitting}
            />
            {errors.notes && <p className="text-sm text-red-600">{errors.notes.message}</p>}
          </div>

          {lesson?.status === 'COMPLETED' && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-600">{tForm('completedEditWarning')}</p>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              {tCommon('cancel')}
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-[#1010a3] hover:bg-[#0d0d85] text-white">
              {isSubmitting ? tForm('saving') : tForm('saveChanges')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
