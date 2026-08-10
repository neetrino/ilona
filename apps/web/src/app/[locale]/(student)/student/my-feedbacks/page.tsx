'use client';

import { useMemo } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';
import { useMyProfile } from '@/features/students';
import { useStudentFeedback } from '@/features/feedback';
import { StudentFeedbackViewCard } from '@/features/feedback/components/StudentFeedbackViewCard';
import {
  StudentEmptyState,
  StudentErrorState,
  StudentLoadingState,
  StudentPageStack,
} from '@/features/student-ui';

export default function StudentMyFeedbacksPage() {
  const tNav = useTranslations('nav');
  const tCommon = useTranslations('common');
  const tStudents = useTranslations('students');
  const locale = useLocale();
  const { data: myProfile, isLoading: isLoadingProfile, error: profileError } = useMyProfile();
  const studentId = myProfile?.id ?? '';
  const {
    data: feedbacks,
    isLoading: isLoadingFeedbacks,
    error: feedbackError,
  } = useStudentFeedback(studentId, undefined, undefined, undefined, !!studentId);

  const sortedFeedbacks = useMemo(() => {
    if (!feedbacks) return [];
    return [...feedbacks].sort((a, b) => {
      const dateA = a.lesson?.scheduledAt ? new Date(a.lesson.scheduledAt).getTime() : 0;
      const dateB = b.lesson?.scheduledAt ? new Date(b.lesson.scheduledAt).getTime() : 0;
      return dateB - dateA;
    });
  }, [feedbacks]);

  const isLoading = isLoadingProfile || isLoadingFeedbacks;
  const hasError = profileError || feedbackError;

  const formatLessonDate = (iso?: string) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <DashboardLayout title={tNav('myFeedbacks')}>
      <StudentPageStack>
        {isLoading && <StudentLoadingState message={tCommon('loading')} />}

        {!isLoading && hasError && (
          <StudentErrorState
            title={tStudents('couldNotLoadFeedback')}
            message="Failed to load feedbacks. Please try again later."
          />
        )}

        {!isLoading && !hasError && sortedFeedbacks.length === 0 && (
          <StudentEmptyState title={tCommon('noData')} message={tCommon('noData')} />
        )}

        {!isLoading && !hasError && sortedFeedbacks.length > 0 && (
          <div className="space-y-3">
            {sortedFeedbacks.map((feedback) => {
              const teacherName = feedback.teacher?.user
                ? `${feedback.teacher.user.firstName} ${feedback.teacher.user.lastName}`.trim()
                : '—';

              return (
                <StudentFeedbackViewCard
                  key={feedback.id}
                  feedback={feedback}
                  dateLabel={`${tCommon('date')}: ${formatLessonDate(feedback.lesson?.scheduledAt)}`}
                  teacherName={teacherName}
                />
              );
            })}
          </div>
        )}
      </StudentPageStack>
    </DashboardLayout>
  );
}
