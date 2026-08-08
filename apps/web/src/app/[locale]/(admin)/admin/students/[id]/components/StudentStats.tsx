'use client';

import { useTranslations } from 'next-intl';
import { Input, PublicAssetImage } from '@/shared/components/ui';
import { STUDENT_DASHBOARD_ASSETS } from '@/features/student-dashboard/assets';
import { formatCurrency } from '@/shared/lib/utils';
import type { StudentStatistics } from '@/features/students';
import type { UseFormRegister } from 'react-hook-form';
import type { UpdateStudentFormData } from '../schemas';

interface StudentStatsProps {
  monthlyFee: number;
  statistics?: StudentStatistics;
  isEditMode: boolean;
  errors?: {
    monthlyFee?: { message?: string };
  };
  register: UseFormRegister<UpdateStudentFormData>;
}

export function StudentStats({
  monthlyFee,
  statistics,
  isEditMode,
  errors,
  register,
}: StudentStatsProps) {
  const t = useTranslations('students');
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <div className="bg-white rounded-xl border border-[rgba(14,14,16,0.07)] p-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-[#8b8b90]">{t('monthlyFeeLabelStat')}</span>
          <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        {isEditMode ? (
          <div className="space-y-2">
            <Input
              type="number"
              step="0.01"
              min="0"
              {...register('monthlyFee', { valueAsNumber: true })}
              error={errors?.monthlyFee?.message}
              className="text-2xl font-bold"
            />
          </div>
        ) : (
          <p className="text-3xl font-bold text-[#3b3b40]">{formatCurrency(monthlyFee)}</p>
        )}
      </div>
      {statistics && (
        <>
          <div className="bg-white rounded-xl border border-[rgba(14,14,16,0.07)] p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-[#8b8b90]">{t('attendanceRateLabel')}</span>
              <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-3xl font-bold text-[#3b3b40]">
              {statistics.attendance.rate.toFixed(1)}%
            </p>
            <p className="text-xs text-[#8b8b90] mt-1">
              {statistics.attendance.present} / {statistics.attendance.total} {t('lessonsShort')}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-[rgba(14,14,16,0.07)] p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-[#8b8b90]">{t('pendingPaymentsLabel')}</span>
              <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-3xl font-bold text-[#3b3b40]">{statistics.payments.pending}</p>
            {statistics.payments.overdue > 0 && (
              <p className="text-xs text-red-600 mt-1">
                {t('overdueCountShort', { count: statistics.payments.overdue })}
              </p>
            )}
          </div>
          <div className="bg-white rounded-xl border border-[rgba(14,14,16,0.07)] p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-[#8b8b90]">{t('currentStreakLabel')}</span>
              <PublicAssetImage
                src={STUDENT_DASHBOARD_ASSETS.fireIcon}
                alt=""
                width={20}
                height={20}
                className="h-5 w-5"
              />
            </div>
            <p className="text-3xl font-bold text-[#3b3b40]">{statistics.attendance.currentStreak}</p>
            <p className="text-xs text-[#8b8b90] mt-1">
              {t('consecutivePresentLessons')}
            </p>
          </div>
        </>
      )}
    </div>
  );
}

