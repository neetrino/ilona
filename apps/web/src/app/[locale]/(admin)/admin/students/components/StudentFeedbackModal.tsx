'use client';

import { useCallback, useEffect, useState } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { MessageCircle, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useStudentFeedback } from '@/features/feedback';
import { useStudent, type Student } from '@/features/students';
import type { Feedback } from '@/features/feedback';
import {
  portalSheetLayerProps,
  stackedSheetDialogHandlers,
  useSheetStackZIndex,
  stackedSheetOverlayClassName,
} from '@/shared/lib/sheet-stack';
import { PortalFormSheetScrollArea } from '@/shared/components/ui/portal-form-sheet-scroll-area';
import { PORTAL_SHEET_DRAG_HANDLE_ATTR, usePortalSheetDrag } from '@/shared/hooks/usePortalSheetDrag';
import { portalFormSheetContentClass } from '@/shared/lib/portal-form-sheet-classes';
import { ADMIN_ICON_BUTTON_SM_CLASS } from '@/shared/lib/admin-control-theme';
import { cn } from '@/shared/lib/utils';

function formatDateTime(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return iso;
  }
}

function formatDate(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { dateStyle: 'medium' });
  } catch {
    return iso;
  }
}

interface StudentFeedbackModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Student when opened by click (in memory) */
  student: Student | null;
  /** Student id from URL (e.g. after refresh) when student object is not in memory */
  studentId?: string | null;
}

export function StudentFeedbackModal({
  open,
  onOpenChange,
  student: studentProp,
  studentId: studentIdFromUrl,
}: StudentFeedbackModalProps) {
  const t = useTranslations('students');
  const tCommon = useTranslations('common');
  const [isDialogOpen, setIsDialogOpen] = useState(open);

  useEffect(() => {
    setIsDialogOpen(open);
  }, [open]);

  const requestClose = useCallback(() => {
    setIsDialogOpen(false);
    onOpenChange(false);
  }, [onOpenChange]);

  const { dragStyle, dragHandleProps, scrollContentProps, resetDrag } = usePortalSheetDrag({
    enabled: true,
    onClose: requestClose,
  });

  useEffect(() => {
    if (!open) {
      resetDrag();
    }
  }, [open, resetDrag]);

  const shouldFetchStudent = open && !!studentIdFromUrl && !studentProp;
  const { data: studentFromApi } = useStudent(studentIdFromUrl ?? '', shouldFetchStudent);
  const student = studentProp ?? studentFromApi ?? null;
  const studentId = student?.id ?? studentIdFromUrl ?? '';
  const teacherId = student?.teacherId ?? undefined;
  const { data: feedbacks, isLoading, error } = useStudentFeedback(
    studentId,
    undefined,
    undefined,
    teacherId,
    open && !!studentId,
  );

  const studentName = student
    ? `${student.user?.firstName ?? ''} ${student.user?.lastName ?? ''}`.trim() ||
        tCommon('searchTypeStudent')
    : '';
  const teacherName =
    feedbacks?.[0]?.teacher?.user?.firstName != null
      ? `${feedbacks[0].teacher.user.firstName} ${feedbacks[0].teacher.user.lastName}`.trim()
      : student?.teacher
        ? `${student.teacher.user.firstName} ${student.teacher.user.lastName}`.trim()
        : null;

  const { overlayStyle, contentStyle, isBaseLayer } = useSheetStackZIndex(isDialogOpen);

  return (
    <DialogPrimitive.Root open={isDialogOpen} onOpenChange={(nextOpen) => !nextOpen && requestClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          style={overlayStyle}
          {...portalSheetLayerProps}
          className={stackedSheetOverlayClassName(
            'fixed inset-0 z-50 bg-black/60 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
            isBaseLayer,
          )}
        />
        <DialogPrimitive.Content
          ref={scrollContentProps.ref}
          style={{ ...dragStyle, ...contentStyle }}
          {...stackedSheetDialogHandlers}
          {...portalSheetLayerProps}
          className={portalFormSheetContentClass('2xl')}
          aria-describedby={undefined}
        >
          <div
            className="relative flex h-9 w-full items-center justify-center bg-white tablet:hidden"
            {...{ [PORTAL_SHEET_DRAG_HANDLE_ATTR]: '' }}
          >
            <div
              className="absolute inset-x-0 -top-2 h-14"
              style={{ touchAction: 'pan-y' }}
              {...dragHandleProps}
            />
            <div className="h-1.5 w-14 rounded-full bg-slate-400" />
          </div>

          <DialogPrimitive.Title className="sr-only">{t('teacherFeedback')}</DialogPrimitive.Title>

          <div className="relative z-40 shrink-0 border-b border-slate-200 bg-white px-4 py-3 tablet:px-6">
            <div className="flex w-full items-center justify-between gap-2">
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <MessageCircle className="h-5 w-5 shrink-0 text-[#1010a3]" aria-hidden="true" />
                <h2 className="truncate text-[1.0625rem] font-semibold text-[#3b3b40] tablet:text-lg">
                  {t('teacherFeedback')}
                </h2>
              </div>
              <DialogPrimitive.Close
                className={cn(
                  ADMIN_ICON_BUTTON_SM_CLASS,
                  'hidden shrink-0 text-slate-500 hover:bg-slate-100 hover:text-slate-900 tablet:inline-flex',
                )}
                aria-label={tCommon('close')}
              >
                <X className="h-4 w-4" />
              </DialogPrimitive.Close>
            </div>
          </div>

          <PortalFormSheetScrollArea className="pt-4 tablet:pt-6">
            {!student ? (
              open && studentIdFromUrl ? (
                <div className="flex items-center justify-center py-12">
                  <div
                    className="h-10 w-10 animate-spin rounded-full border-2 border-[rgba(14,14,16,0.07)] border-t-[#1010a3]"
                    aria-hidden="true"
                  />
                  <span className="sr-only">{t('loadingStudent')}</span>
                </div>
              ) : (
                <p className="py-4 text-sm text-[#8b8b90]">{t('noStudentSelected')}</p>
              )
            ) : (
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="font-medium text-[#8b8b90]">{tCommon('searchTypeStudent')}</span>
                    <p className="font-medium text-[#1010a3]">{studentName}</p>
                  </div>
                  <div>
                    <span className="font-medium text-[#8b8b90]">{tCommon('searchTypeTeacher')}</span>
                    <p className="font-medium text-[#1010a3]">
                      {teacherName ??
                        (student.teacherId ? t('assignedNoFeedbackYet') : tCommon('notAssigned'))}
                    </p>
                  </div>
                </div>

                {isLoading && (
                  <div className="flex items-center justify-center py-12">
                    <div
                      className="h-10 w-10 animate-spin rounded-full border-2 border-[rgba(14,14,16,0.07)] border-t-[#1010a3]"
                      aria-hidden="true"
                    />
                    <span className="sr-only">{t('loadingFeedback')}</span>
                  </div>
                )}

                {error && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {t('failedLoadFeedback')}
                  </div>
                )}

                {!isLoading && !error && (!feedbacks || feedbacks.length === 0) && (
                  <div className="rounded-lg border border-[rgba(14,14,16,0.07)] bg-[#fafafa] px-4 py-6 text-center text-sm text-[#3b3b40]">
                    {t('noFeedbackProvidedYet')}
                  </div>
                )}

                {!isLoading && !error && feedbacks && feedbacks.length > 0 && (
                  <div className="space-y-4">
                    <p className="text-sm font-medium text-[#3b3b40]">{t('feedbackByLesson')}</p>
                    {feedbacks.map((feedback) => (
                      <FeedbackCard key={feedback.id} feedback={feedback} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </PortalFormSheetScrollArea>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

function FeedbackCard({ feedback }: { feedback: Feedback }) {
  const t = useTranslations('students');
  const lesson = feedback.lesson;
  const scheduledAt = lesson?.scheduledAt ? formatDate(lesson.scheduledAt) : '—';
  const groupName = lesson?.group?.name;

  return (
    <div className="space-y-3 rounded-lg border border-[rgba(14,14,16,0.07)] bg-[#fafafa]/50 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-[#8b8b90]">
          {t('lessonLabel', { date: scheduledAt })}
        </span>
        {groupName && <span className="text-xs text-[#8b8b90]">· {groupName}</span>}
      </div>

      {feedback.content ? (
        <div className="border-t border-[rgba(14,14,16,0.07)] pt-2">
          <p className="mb-1 text-xs font-medium text-[#8b8b90]">{t('feedbackContent')}</p>
          <p className="whitespace-pre-wrap text-sm text-[#3b3b40]">{feedback.content}</p>
          <p className="mt-2 text-xs text-[#8b8b90]">
            {t('feedbackGivenAt', { date: formatDateTime(feedback.createdAt) })}
          </p>
        </div>
      ) : (
        <div className="border-t border-[rgba(14,14,16,0.07)] pt-2">
          <p className="text-sm italic text-[#8b8b90]">{t('noFeedbackForLesson')}</p>
          <p className="mt-2 text-xs text-[#8b8b90]">{formatDateTime(feedback.createdAt)}</p>
        </div>
      )}
    </div>
  );
}
