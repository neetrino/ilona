'use client';

import { emptyStructuredFeedback } from './lesson-feedback-form-utils';
import { FeedbacksTabStudentCard } from './feedbacks-tab/FeedbacksTabStudentCard';
import {
  FeedbacksTabEmptyStudents,
  FeedbacksTabLessonNotFound,
  FeedbacksTabLoadingState,
} from './feedbacks-tab/FeedbacksTabStates';
import type { FeedbacksTabProps } from './feedbacks-tab/feedbacks-tab.types';
import { useFeedbacksTab } from './feedbacks-tab/useFeedbacksTab';

export type { FeedbacksTabProps } from './feedbacks-tab/feedbacks-tab.types';

export function FeedbacksTab({ lessonId }: FeedbacksTabProps) {
  const {
    isLoading,
    lesson,
    students,
    structuredFeedbacks,
    saveStatus,
    participationExpanded,
    grammarOptions,
    isSaving,
    updateStructuredFeedback,
    toggleParticipationExpanded,
    handleSaveFeedback,
    getHasSavedFeedback,
  } = useFeedbacksTab({ lessonId });

  if (isLoading) {
    return <FeedbacksTabLoadingState />;
  }

  if (!lesson) {
    return <FeedbacksTabLessonNotFound />;
  }

  return (
    <div className="mx-auto max-w-4xl p-4 sm:p-6">
      <div className="space-y-6 sm:space-y-8">
        {students.map((student) => (
          <FeedbacksTabStudentCard
            key={student.id}
            student={student}
            structured={structuredFeedbacks[student.id] ?? emptyStructuredFeedback()}
            hasSavedFeedback={getHasSavedFeedback(student.id)}
            isSaving={isSaving}
            status={saveStatus[student.id]}
            participationOpen={participationExpanded[student.id] ?? false}
            grammarOptions={grammarOptions}
            onUpdateStructured={(updater) => updateStructuredFeedback(student.id, updater)}
            onToggleParticipation={() => toggleParticipationExpanded(student.id)}
            onSave={() => handleSaveFeedback(student.id)}
          />
        ))}
      </div>

      {students.length === 0 && <FeedbacksTabEmptyStudents />}
    </div>
  );
}
