'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';
import { useMyProfile } from '@/features/students';
import { useStudentFeedback } from '@/features/feedback';

export default function StudentMyFeedbacksPage() {
  const tNav = useTranslations('nav');
  const tCommon = useTranslations('common');
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
      <div className="space-y-4">
        {isLoading && (
          <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-slate-500">
            {tCommon('loading')}
          </div>
        )}

        {!isLoading && hasError && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            Failed to load feedbacks.
          </div>
        )}

        {!isLoading && !hasError && sortedFeedbacks.length === 0 && (
          <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-slate-500">
            {tCommon('noData')}
          </div>
        )}

        {!isLoading && !hasError && sortedFeedbacks.length > 0 && (
          <div className="space-y-3">
            {sortedFeedbacks.map((feedback) => {
              const teacherName = feedback.teacher?.user
                ? `${feedback.teacher.user.firstName} ${feedback.teacher.user.lastName}`.trim()
                : '—';

              return (
                <div key={feedback.id} className="rounded-xl border border-slate-200 bg-white p-4">
                  <div className="mb-2 flex flex-wrap items-center gap-3 text-sm">
                    <span className="rounded-md bg-slate-100 px-2 py-1 font-medium text-slate-700">
                      {tCommon('date')}: {formatLessonDate(feedback.lesson?.scheduledAt)}
                    </span>
                    <span className="text-slate-600">
                      {tCommon('name')}: {teacherName}
                    </span>
                  </div>

                  <p className="whitespace-pre-wrap text-sm text-slate-800">{feedback.content}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
