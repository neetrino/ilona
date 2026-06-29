'use client';

import { useTranslations } from 'next-intl';

export function FeedbacksTabLoadingState() {
  const tCommon = useTranslations('common');

  return (
    <div className="flex flex-col items-center justify-center p-16">
      <div className="relative">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
        <div
          className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-blue-400"
          style={{ animationDuration: '0.75s' }}
        />
      </div>
      <p className="mt-6 text-sm font-medium text-slate-600">{tCommon('loading')}</p>
    </div>
  );
}

export function FeedbacksTabLessonNotFound() {
  const t = useTranslations('dailyDuties.feedback');

  return (
    <div className="flex flex-col items-center justify-center p-16">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
        <svg className="h-8 w-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
      <p className="font-medium text-slate-600">{t('lessonNotFound')}</p>
    </div>
  );
}

export function FeedbacksTabEmptyStudents() {
  const t = useTranslations('dailyDuties.feedback');

  return (
    <div className="flex flex-col items-center justify-center rounded-[15px] border-2 border-dashed border-slate-200 bg-slate-50 p-16">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-200">
        <svg className="h-8 w-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
      </div>
      <p className="font-medium text-slate-600">{t('noStudentsInLesson')}</p>
    </div>
  );
}
