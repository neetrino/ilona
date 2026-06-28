'use client';

import * as DialogPrimitive from '@radix-ui/react-dialog';
import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/shared/components/ui/button';
import { Label } from '@/shared/components/ui/label';
import {
  SingleSelectDropdown,
} from '@/shared/components/ui/single-select-dropdown';
import { useLesson, useUpdateLesson } from '@/features/lessons';
import { PortalFormSheetDragHandle } from '@/shared/components/ui/portal-form-sheet-drag-handle';
import { usePortalSheetDrag } from '@/shared/hooks/usePortalSheetDrag';
import { cn } from '@/shared/lib/utils';
import {
  portalSheetLayerProps,
  stackedSheetDialogHandlers,
  useSheetStackZIndex,
  stackedSheetOverlayClassName,
} from '@/shared/lib/sheet-stack';
import {
  PORTAL_FORM_SHEET_HEADER_CLASS,
  PORTAL_FORM_SHEET_OVERLAY_CLASS,
  PORTAL_FORM_SHEET_SCROLL_CLASS,
  portalFormSheetContentClass,
} from '@/shared/lib/portal-form-sheet-classes';

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

  const requestClose = useCallback(() => {
    setIsDialogOpen(false);
    onOpenChange(false);
  }, [onOpenChange]);

  const { dragStyle, dragHandleProps, resetDrag } = usePortalSheetDrag({
    onClose: requestClose,
    enabled: isDialogOpen,
  });

  useEffect(() => {
    if (!open) {
      resetDrag();
    }
  }, [open, resetDrag]);

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
  const { overlayStyle, contentStyle, isBaseLayer } = useSheetStackZIndex(isDialogOpen);

  return (
    <DialogPrimitive.Root open={isDialogOpen} onOpenChange={(nextOpen) => !nextOpen && requestClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay style={overlayStyle} {...portalSheetLayerProps} className={stackedSheetOverlayClassName(PORTAL_FORM_SHEET_OVERLAY_CLASS, isBaseLayer, 'z-[60]')} />
        <DialogPrimitive.Content style={{ ...dragStyle, ...contentStyle }} {...stackedSheetDialogHandlers} {...portalSheetLayerProps}
          className={cn(portalFormSheetContentClass('xl'), 'z-[60]')}
          aria-describedby={undefined}
        >
          <PortalFormSheetDragHandle dragHandleProps={dragHandleProps} />

          <div className={cn(PORTAL_FORM_SHEET_HEADER_CLASS, 'pb-3 pt-2 min-[1367px]:pb-5 min-[1367px]:pt-6')}>
            <DialogPrimitive.Title className="break-words text-xl font-semibold leading-snug text-[#1010a3] min-[1367px]:text-lg min-[1367px]:text-[#3b3b40]">
              {t('substituteTeacherLesson')}
            </DialogPrimitive.Title>
          </div>

          <div
            className={cn(
              PORTAL_FORM_SHEET_SCROLL_CLASS,
              'min-h-0 flex-1 pb-[calc(5.5rem+env(safe-area-inset-bottom))] min-[1367px]:pb-6',
            )}
          >
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
                  <p className="rounded-md border border-amber-200 bg-amber-50 px-2 py-1.5 text-xs text-amber-800">
                    {t('currentlyAssignedSubstitute')}{' '}
                    <span className="font-medium">
                      {lesson.substituteTeacher.user.firstName} {lesson.substituteTeacher.user.lastName}
                    </span>
                  </p>
                )}
                {lesson.substituteTeacherId ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full rounded-[15px] sm:w-auto"
                    onClick={handleRemove}
                    disabled={updateLesson.isPending}
                  >
                    {t('removeSubstitute')}
                  </Button>
                ) : null}
                <div className="flex flex-col gap-2 pt-4 sm:flex-row sm:justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full rounded-[15px] sm:w-auto"
                    onClick={requestClose}
                    disabled={updateLesson.isPending}
                  >
                    {tCommon('cancel')}
                  </Button>
                  <Button
                    type="button"
                    className="w-full rounded-[15px] bg-primary text-primary-foreground hover:bg-primary/90 sm:w-auto"
                    onClick={handleSave}
                    disabled={updateLesson.isPending || !lessonId || isLoading || !lesson}
                  >
                    {updateLesson.isPending ? tCommon('saving') : tCommon('save')}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
