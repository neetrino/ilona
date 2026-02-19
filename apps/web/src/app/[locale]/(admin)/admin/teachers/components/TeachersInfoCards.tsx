'use client';

import { useRouter } from 'next/navigation';

interface TeachersInfoCardsProps {
  filteredTeachers: Array<{ _count?: { lessons?: number } }>;
  totalLessons: number;
  locale: string;
  t: (key: string, params?: Record<string, unknown>) => string;
}

export function TeachersInfoCards({ filteredTeachers, totalLessons, locale, t }: TeachersInfoCardsProps) {
  const router = useRouter();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-amber-50 rounded-xl">
            <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-slate-800 mb-2">{t('salaryCalculation')}</h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              {t('salaryDescription')}
            </p>
            <button 
              className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/90"
              onClick={() => router.push(`/${locale}/admin/finance`)}
            >
              {t('viewSalaries')}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-primary/10 rounded-xl">
            <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-slate-800 mb-2">{t('staffWorkload')}</h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              {filteredTeachers.length > 0 
                ? t('workloadDescription', { avg: Math.round(totalLessons / filteredTeachers.length) })
                : t('workloadNoTeachers')}
            </p>
            <button 
              className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/90"
              onClick={() => router.push(`/${locale}/admin/analytics`)}
            >
              {t('viewAnalytics')}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

