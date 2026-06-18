'use client';

import * as DialogPrimitive from '@radix-ui/react-dialog';
import { useCallback, useEffect, useRef, useState, type TouchEvent } from 'react';
import { useTranslations } from 'next-intl';
import {
  DialogFooter,
} from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { Label } from '@/shared/components/ui/label';
import { SingleSelectDropdown } from '@/shared/components/ui/single-select-dropdown';
import { useLesson, useUpdateLesson } from '@/features/lessons';
import { cn } from '@/shared/lib/utils';

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
  const t = useTranslations('calendar');
  const tCommon = useTranslations('common');
  const { data: lesson, isLoading } = useLesson(lessonId ?? '', open && Boolean(lessonId));
  const updateLesson = useUpdateLesson();
  const [selectedId, setSelectedId] = useState<string>('');
  const [isDialogOpen, setIsDialogOpen] = useState(open);
  const [dragOffsetY, setDragOffsetY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isSettling, setIsSettling] = useState(false);
  const touchStartYRef = useRef<number | null>(null);
  const touchStartXRef = useRef<number | null>(null);
  const settleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setIsDialogOpen(open);
  }, [open]);

  useEffect(() => {
    if (lesson?.substituteTeacherId) {
      setSelectedId(lesson.substituteTeacherId);
    } else {
      setSelectedId('');
    }
  }, [lesson?.substituteTeacherId, lesson?.id]);

  useEffect(() => {
    if (!open) {
      setDragOffsetY(0);
      setIsDragging(false);
      setIsSettling(false);
    }
  }, [open]);

  useEffect(() => {
    return () => {
      if (settleTimerRef.current) {
        clearTimeout(settleTimerRef.current);
      }
    };
  }, []);

  const mainName = lesson?.teacher?.user
    ? `${lesson.teacher.user.firstName} ${lesson.teacher.user.lastName}`.trim()
    : '—';

  const requestClose = useCallback(() => {
    setIsDialogOpen(false);
    onOpenChange(false);
  }, [onOpenChange]);

  const isMobileViewport = () =>
    typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches;

  const resetDragRefs = () => {
    touchStartYRef.current = null;
    touchStartXRef.current = null;
    setIsDragging(false);
  };

  const handleDragStart = (event: TouchEvent<HTMLDivElement>) => {
    if (!isMobileViewport()) return;
    const firstTouch = event.touches[0];
    if (!firstTouch) return;
    if (settleTimerRef.current) {
      clearTimeout(settleTimerRef.current);
      settleTimerRef.current = null;
    }
    touchStartYRef.current = firstTouch.clientY;
    touchStartXRef.current = firstTouch.clientX;
    setIsSettling(false);
    setIsDragging(true);
  };

  const handleDragMove = (event: TouchEvent<HTMLDivElement>) => {
    if (!isMobileViewport()) return;
    if (!isDragging || touchStartYRef.current === null || touchStartXRef.current === null) return;
    const firstTouch = event.touches[0];
    if (!firstTouch) return;
    const deltaY = firstTouch.clientY - touchStartYRef.current;
    const deltaX = Math.abs(firstTouch.clientX - touchStartXRef.current);
    if (deltaY <= 0 || deltaY <= deltaX) return;
    event.preventDefault();
    setDragOffsetY(Math.min(deltaY * 0.95, 340));
  };

  const handleDragEnd = () => {
    if (!isMobileViewport()) return;
    if (!isDragging) return;
    const shouldClose = dragOffsetY > 110;
    resetDragRefs();
    if (shouldClose) {
      setDragOffsetY(0);
      requestClose();
      return;
    }
    setIsSettling(true);
    setDragOffsetY(0);
    settleTimerRef.current = setTimeout(() => {
      setIsSettling(false);
      settleTimerRef.current = null;
    }, 280);
  };

  const dragStyle =
    dragOffsetY > 0 || isSettling
      ? {
          transform: `translateY(${dragOffsetY}px)`,
          transition: isDragging ? 'none' : 'transform 280ms cubic-bezier(0.22, 1, 0.36, 1)',
        }
      : undefined;

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
    requestClose();
  };

  const handleRemove = async () => {
    if (!lessonId) return;
    await updateLesson.mutateAsync({
      id: lessonId,
      data: { substituteTeacherId: null },
    });
    requestClose();
  };

  return (
    <DialogPrimitive.Root open={isDialogOpen} onOpenChange={(nextOpen) => !nextOpen && requestClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          style={dragStyle}
          className={cn(
            'fixed inset-x-0 bottom-[7px] top-auto z-50 grid w-full translate-y-0',
            'duration-700 ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out sheet:duration-350 sheet:ease-[cubic-bezier(0.22,1,0.36,1)]',
            'data-[state=open]:slide-in-from-bottom-full data-[state=closed]:slide-out-to-bottom-full',
            'h-[calc(94dvh+7px)] grid-rows-[auto_1fr] gap-0 overflow-hidden rounded-t-[22px] border border-slate-200 bg-[#f8f9fb] shadow-xl',
            'sheet:inset-0 sheet:m-auto sheet:w-[95vw] sheet:max-w-md sheet:h-auto sheet:max-h-[90vh] sheet:translate-x-0 sheet:translate-y-0 sheet:rounded-2xl',
            'sheet:data-[state=open]:fade-in-0 sheet:data-[state=closed]:fade-out-0 sheet:data-[state=open]:slide-in-from-bottom-0 sheet:data-[state=closed]:slide-out-to-bottom-0'
          )}
          aria-describedby={undefined}
        >
          <div className="relative flex h-9 w-full items-center justify-center bg-[#f8f9fb] sheet:hidden">
            <div
              className="absolute inset-x-0 -top-2 h-14"
              onTouchStart={handleDragStart}
              onTouchMove={handleDragMove}
              onTouchEnd={handleDragEnd}
              onTouchCancel={handleDragEnd}
            />
            <div className="h-1.5 w-14 rounded-full bg-slate-400" />
          </div>
          <DialogPrimitive.Title className="sr-only">{t('substituteTeacherLesson')}</DialogPrimitive.Title>

          <div className="overflow-y-auto px-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] pt-4 sheet:p-6">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-[#3b3b40]">{t('substituteTeacherLesson')}</h2>
            </div>
            {isLoading || !lesson ? (
              <p className="text-sm text-[#3b3b40]">{t('loadingLesson')}</p>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-[#3b3b40]">
                  <span className="font-medium text-[#1010a3]">{t('groupLabel')}</span>{' '}
                  {lesson.group?.name ?? '—'}
                </p>
                <p className="text-sm text-[#3b3b40]">
                  <span className="font-medium text-[#1010a3]">{t('mainTeacherLabel')}</span> {mainName}
                </p>
                <div className="space-y-2">
                  <Label htmlFor="substitute-select">{t('substituteForClassOnly')}</Label>
                  <SingleSelectDropdown
                    id="substitute-select"
                    options={[
                      { id: '', label: t('noneMainTeacherCovers') },
                      ...teacherOptions
                        .filter((teacher) => teacher.id !== lesson.teacherId)
                        .map((teacher) => ({ id: teacher.id, label: teacher.label })),
                    ]}
                    value={selectedId}
                    onValueChange={(nextValue) => setSelectedId(nextValue ?? '')}
                  />
                </div>
                {lesson.substituteTeacher?.user && (
                  <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-md px-2 py-1.5">
                    {t('currentlyAssignedSubstitute')}{' '}
                    <span className="font-medium">
                      {lesson.substituteTeacher.user.firstName} {lesson.substituteTeacher.user.lastName}
                    </span>
                  </p>
                )}
              </div>
            )}
            <DialogFooter className="gap-2 pt-4 sheet:gap-0">
              {lesson?.substituteTeacherId ? (
                <Button type="button" variant="outline" onClick={handleRemove} disabled={updateLesson.isPending}>
                  {t('removeSubstitute')}
                </Button>
              ) : null}
              <Button type="button" variant="secondary" onClick={requestClose}>
                {tCommon('cancel')}
              </Button>
              <Button
                type="button"
                onClick={handleSave}
                disabled={updateLesson.isPending || !lessonId || isLoading || !lesson}
              >
                {tCommon('save')}
              </Button>
            </DialogFooter>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
