'use client';

import { useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';
import { useMyProfile } from '@/features/students';
import { useStudentFeedback } from '@/features/feedback';
import { StudentFeedbackViewCard } from '@/features/feedback/components/StudentFeedbackViewCard';
import {
  StudentCard,
  StudentDatePicker,
  StudentEmptyState,
  StudentErrorState,
  StudentFieldLabel,
  StudentGhostButton,
  StudentLoadingState,
  StudentPageStack,
} from '@/features/student-ui';

export default function StudentMyFeedbacksPage() {
  const tNav = useTranslations('nav');
  const tCommon = useTranslations('common');
  const tStudents = useTranslations('students');
  const locale = useLocale();
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const { data: myProfile, isLoading: isLoadingProfile, error: profileError } = useMyProfile();
  const studentId = myProfile?.id ?? '';

  const dateFromParam = useMemo(
    () => (dateFrom ? new Date(`${dateFrom}T00:00:00`).toISOString() : undefined),
    [dateFrom],
  );
  const dateToParam = useMemo(
    () => (dateTo ? new Date(`${dateTo}T23:59:59.999`).toISOString() : undefined),
    [dateTo],
  );

  const {
    data: feedbacks,
    isLoading: isLoadingFeedbacks,
    error: feedbackError,
  } = useStudentFeedback(studentId, dateFromParam, dateToParam, undefined, !!studentId);

  const sortedFeedbacks = useMemo(() => {
    if (!feedbacks) return [];
    return [...feedbacks].sort((a, b) => {
      const dateA = a.lesson?.scheduledAt ? new Date(a.lesson.scheduledAt).getTime() : 0;
      const dateB = b.lesson?.scheduledAt ? new Date(b.lesson.scheduledAt).getTime() : 0;
      return dateB - dateA;
    });
  }, [feedbacks]);

  const hasDateFilter = Boolean(dateFrom || dateTo);
  const isLoading = isLoadingProfile || isLoadingFeedbacks;
  const hasError = profileError || feedbackError;

  const handleResetFilters = () => {
    setDateFrom('');
    setDateTo('');
  };

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
        <StudentCard>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="grid min-w-0 flex-1 grid-cols-2 gap-3">
              <div className="min-w-0">
                <StudentFieldLabel htmlFor="student-feedbacks-from">
                  {tCommon('from')}
                </StudentFieldLabel>
                <StudentDatePicker
                  id="student-feedbacks-from"
                  value={dateFrom}
                  max={dateTo || undefined}
                  onValueChange={setDateFrom}
                />
              </div>
              <div className="min-w-0">
                <StudentFieldLabel htmlFor="student-feedbacks-to">
                  {tCommon('to')}
                </StudentFieldLabel>
                <StudentDatePicker
                  id="student-feedbacks-to"
                  value={dateTo}
                  min={dateFrom || undefined}
                  onValueChange={setDateTo}
                />
              </div>
            </div>
            {hasDateFilter ? (
              <StudentGhostButton type="button" onClick={handleResetFilters} className="shrink-0">
                {tCommon('clear')}
              </StudentGhostButton>
            ) : null}
          </div>
        </StudentCard>

        {isLoading && <StudentLoadingState message={tCommon('loading')} />}

        {!isLoading && hasError && (
          <StudentErrorState
            title={tStudents('couldNotLoadFeedback')}
            message="Failed to load feedbacks. Please try again later."
          />
        )}

        {!isLoading && !hasError && sortedFeedbacks.length === 0 && (
          <StudentEmptyState title={tCommon('noData')} message={tCommon('noData')}>
            {hasDateFilter ? (
              <StudentGhostButton type="button" onClick={handleResetFilters}>
                {tCommon('clear')}
              </StudentGhostButton>
            ) : null}
          </StudentEmptyState>
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
