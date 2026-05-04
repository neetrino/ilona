'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { Label } from '@/shared/components/ui/label';
import { useLesson, useUpdateLesson } from '@/features/lessons';

export interface SubstituteTeacherOption {
  id: string;
  label: string;
}

interface SubstituteLessonModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lessonId: string | null;
  teacherOptions: SubstituteTeacherOption[];
}

export function SubstituteLessonModal({
  open,
  onOpenChange,
  lessonId,
  teacherOptions,
}: SubstituteLessonModalProps) {
  const { data: lesson, isLoading } = useLesson(lessonId ?? '', open && Boolean(lessonId));
  const updateLesson = useUpdateLesson();
  const [selectedId, setSelectedId] = useState<string>('');

  useEffect(() => {
    if (lesson?.substituteTeacherId) {
      setSelectedId(lesson.substituteTeacherId);
    } else {
      setSelectedId('');
    }
  }, [lesson?.substituteTeacherId, lesson?.id]);

  const mainName = lesson?.teacher?.user
    ? `${lesson.teacher.user.firstName} ${lesson.teacher.user.lastName}`.trim()
    : '—';

  const handleSave = async () => {
    if (!lessonId) return;
    const next = selectedId === '' ? null : selectedId;
    if (next === lesson?.teacherId) {
      return;
    }
    await updateLesson.mutateAsync({
      id: lessonId,
      data: { substituteTeacherId: next },
    });
    onOpenChange(false);
  };

  const handleRemove = async () => {
    if (!lessonId) return;
    await updateLesson.mutateAsync({
      id: lessonId,
      data: { substituteTeacherId: null },
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Substitute teacher (this lesson)</DialogTitle>
        </DialogHeader>
        {isLoading || !lesson ? (
          <p className="text-sm text-slate-600">Loading lesson…</p>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-slate-700">
              <span className="font-medium text-slate-900">Group:</span> {lesson.group?.name ?? '—'}
            </p>
            <p className="text-sm text-slate-700">
              <span className="font-medium text-slate-900">Main teacher:</span> {mainName}
            </p>
            <div className="space-y-2">
              <Label htmlFor="substitute-select">Substitute for this class only</Label>
              <select
                id="substitute-select"
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
              >
                <option value="">None (main teacher covers)</option>
                {teacherOptions
                  .filter((t) => t.id !== lesson.teacherId)
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
              </select>
            </div>
            {lesson.substituteTeacher?.user && (
              <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-md px-2 py-1.5">
                Currently assigned substitute:{' '}
                <span className="font-medium">
                  {lesson.substituteTeacher.user.firstName} {lesson.substituteTeacher.user.lastName}
                </span>
              </p>
            )}
          </div>
        )}
        <DialogFooter className="gap-2 sm:gap-0">
          {lesson?.substituteTeacherId ? (
            <Button type="button" variant="outline" onClick={handleRemove} disabled={updateLesson.isPending}>
              Remove substitute
            </Button>
          ) : null}
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={updateLesson.isPending || !lessonId || isLoading || !lesson}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
