'use client';

import { Input } from '@/shared/components/ui';
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
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {statistics && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-500">Streak</span>
            <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.24 17 7.2c.5 1.1.524 2.618-.024 3.8 1.34.357 2.436 1.45 2.824 3 .6 2.4-.6 4.8-2.143 6.6-1.25.75-3.136 1.56-4.978 1.06 1.2-2 1.2-4.8-.478-7.4-1-1.6-2-2.4-2-2.4 1 2.5.8 4.4-.6 5.8-.8.8-2 1-3 1" />
            </svg>
          </div>
          <p className="text-3xl font-bold text-slate-800">{statistics.streak.currentStreak}</p>
          <p className="text-xs text-slate-500 mt-1">
            {statistics.streak.lastAttendanceDate
              ? `Last: ${new Date(statistics.streak.lastAttendanceDate).toLocaleDateString()}`
              : 'No attendance yet'}
          </p>
        </div>
      )}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-slate-500">Monthly Fee</span>
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
          <p className="text-3xl font-bold text-slate-800">{formatCurrency(monthlyFee)}</p>
        )}
      </div>
      {statistics && (
        <>
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-500">Attendance Rate</span>
              <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-3xl font-bold text-slate-800">
              {statistics.attendance.rate.toFixed(1)}%
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {statistics.attendance.present} / {statistics.attendance.total} lessons
            </p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-500">Pending Payments</span>
              <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-3xl font-bold text-slate-800">{statistics.payments.pending}</p>
            {statistics.payments.overdue > 0 && (
              <p className="text-xs text-red-600 mt-1">
                {statistics.payments.overdue} overdue
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

