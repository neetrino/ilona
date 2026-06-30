'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { emptyStructuredFeedback } from './lesson-feedback-form-utils';
import { FeedbacksTabStudentCard } from './feedbacks-tab/FeedbacksTabStudentCard';
import { FeedbacksTabStudentList } from './feedbacks-tab/FeedbacksTabStudentList';
import { FeedbacksTabStudentSheet } from './feedbacks-tab/FeedbacksTabStudentSheet';
import {
  FeedbacksTabEmptyStudents,
  FeedbacksTabLessonNotFound,
  FeedbacksTabLoadingState,
} from './feedbacks-tab/FeedbacksTabStates';
import { LessonDetailTabSectionHeader } from '@/shared/components/daily-duties/LessonDetailTabSectionHeader';
import { lessonDetailTabShellClass } from '@/shared/components/daily-duties/lesson-detail-tab-layout';
import { cn } from '@/shared/lib/utils';
import type { FeedbacksTabProps } from './feedbacks-tab/feedbacks-tab.types';
import { useFeedbacksTab } from './feedbacks-tab/useFeedbacksTab';

export type { FeedbacksTabProps } from './feedbacks-tab/feedbacks-tab.types';

function buildStudentCardProps(
  student: ReturnType<typeof useFeedbacksTab>['students'][number],
  ctx: ReturnType<typeof useFeedbacksTab>,
  hideStudentHeader: boolean,
) {
  return {
    student,
    structured: ctx.structuredFeedbacks[student.id] ?? emptyStructuredFeedback(),
    hasSavedFeedback: ctx.getHasSavedFeedback(student.id),
    isSaving: ctx.isSaving,
    status: ctx.saveStatus[student.id],
    participationOpen: ctx.participationExpanded[student.id] ?? false,
    grammarOptions: ctx.grammarOptions,
    hideStudentHeader,
    onUpdateStructured: (updater: Parameters<typeof ctx.updateStructuredFeedback>[1]) =>
      ctx.updateStructuredFeedback(student.id, updater),
    onToggleParticipation: () => ctx.toggleParticipationExpanded(student.id),
    onSave: () => ctx.handleSaveFeedback(student.id),
  };
}

export function FeedbacksTab({ lessonId, embeddedInSheet = false }: FeedbacksTabProps) {
  const t = useTranslations('dailyDuties.feedback');
  const ctx = useFeedbacksTab({ lessonId });
  const { isLoading, lesson, students } = ctx;
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [sheetStudentId, setSheetStudentId] = useState<string | null>(null);

  const studentsKey = useMemo(() => students.map((s) => s.id).join(','), [students]);

  useEffect(() => {
    if (students.length === 0) {
      setSelectedStudentId(null);
      return;
    }
    if (!selectedStudentId || !students.some((s) => s.id === selectedStudentId)) {
      setSelectedStudentId(students[0].id);
    }
  }, [studentsKey, selectedStudentId, students]);

  const selectedStudent = students.find((s) => s.id === selectedStudentId) ?? null;
  const sheetStudent = students.find((s) => s.id === sheetStudentId) ?? null;

  if (isLoading) {
    return <FeedbacksTabLoadingState />;
  }

  if (!lesson) {
    return <FeedbacksTabLessonNotFound />;
  }

  if (students.length === 0) {
    return <FeedbacksTabEmptyStudents />;
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      {/* Desktop: chat-style master–detail with independent scroll regions */}
      <div className="hidden min-h-0 flex-1 overflow-hidden lg:flex">
        <aside className="relative z-[1] flex min-h-0 w-80 shrink-0 flex-col overflow-hidden rounded-r-[30px] border-r border-slate-200/80 bg-white shadow-[4px_0_24px_rgba(14,14,16,0.08)]">
          <FeedbacksTabStudentList
            students={students}
            selectedStudentId={selectedStudentId}
            hasSavedFeedback={ctx.getHasSavedFeedback}
            onSelectStudent={setSelectedStudentId}
          />
        </aside>
        <div className="min-h-0 flex-1 overflow-hidden bg-white">
          <div className="h-full min-h-0 overflow-y-auto overscroll-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {selectedStudent ? (
              <FeedbacksTabStudentCard
                {...buildStudentCardProps(selectedStudent, ctx, true)}
              />
            ) : null}
          </div>
        </div>
      </div>

      {/* Mobile / tablet: chat-style list + detail sheet */}
      <div className={cn('flex flex-col lg:hidden', lessonDetailTabShellClass(embeddedInSheet))}>
        <LessonDetailTabSectionHeader title={t('editFeedback')} embeddedInSheet={embeddedInSheet} />
        <div className="-mx-4 min-h-0 flex-1">
          <FeedbacksTabStudentList
            students={students}
            selectedStudentId={sheetStudentId}
            hasSavedFeedback={ctx.getHasSavedFeedback}
            onSelectStudent={setSheetStudentId}
          />
        </div>
      </div>

      <FeedbacksTabStudentSheet
        open={sheetStudentId !== null}
        onOpenChange={(open) => {
          if (!open) {
            setSheetStudentId(null);
          }
        }}
        student={sheetStudent}
        hasSavedFeedback={sheetStudent ? ctx.getHasSavedFeedback(sheetStudent.id) : false}
      >
        {sheetStudent ? (
          <FeedbacksTabStudentCard
            {...buildStudentCardProps(sheetStudent, ctx, true)}
          />
        ) : null}
      </FeedbacksTabStudentSheet>
    </div>
  );
}
