'use client';

import { useTranslations } from 'next-intl';
import { formatDateDisplay } from '@/features/attendance/utils/dateUtils';
import type { Group } from '@/features/groups';

interface AttendanceContextHeaderProps {
  group: Group | null;
  date?: Date;
  weekRange?: string;
  viewMode: 'day' | 'week' | 'month';
  lessonsCount: number;
  studentsCount: number;
  hasUnsavedChanges: boolean;
  isCurrentDateToday?: boolean;
}

export function AttendanceContextHeader({
  group,
  date,
  weekRange,
  viewMode,
  lessonsCount,
  studentsCount,
  hasUnsavedChanges,
  isCurrentDateToday,
}: AttendanceContextHeaderProps) {
  const t = useTranslations('attendance');
  const tCommon = useTranslations('common');
  const tStudents = useTranslations('students');
  const groupLabel = t('registerGroupLabel').replace('՝', '').replace(':', '');
  const dateLabel = t('registerDateLabel').replace('՝', '').replace(':', '');
  const weekLabel = t('registerWeekLabel').replace('՝', '').replace(':', '');

  if (viewMode === 'day') {
    return (
      <div className="space-y-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-3 md:hidden">
            <div className="flex items-center gap-2 text-[#6d738f]">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="text-[15px] font-medium">{groupLabel}</span>
            </div>
            <div className="flex items-center gap-3">
              <h2 className="whitespace-nowrap text-[24px] font-semibold leading-none tracking-[-0.02em] text-[#0f1638]">
                {group?.name || tStudents('notAvailable')}
              </h2>
              {group?.level && (
                <span className="rounded-xl bg-[#eef0ff] px-3 py-1 text-sm font-semibold text-[#424a75]">
                  {group.level}
                </span>
              )}
            </div>
          </div>
          <div className="hidden items-center gap-3 md:flex">
            <svg className="h-5 w-5 text-[#6d738f]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span className="text-[14px] font-medium text-[#6d738f]">{groupLabel}</span>
            <h2 className="whitespace-nowrap text-[24px] font-semibold leading-none tracking-[-0.02em] text-[#0f1638]">
              {group?.name || tStudents('notAvailable')}
            </h2>
            {group?.level && (
              <span className="rounded-xl bg-[#eef0ff] px-3 py-1 text-sm font-semibold text-[#424a75]">
                {group.level}
              </span>
            )}
            <span className="h-5 w-px bg-[#d6dae8]" />
            <svg className="h-5 w-5 text-[#6d738f]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-[14px] font-medium text-[#6d738f]">{dateLabel}</span>
            <span className="whitespace-nowrap text-[24px] font-semibold leading-none tracking-[-0.02em] text-[#1010a3]">
              {date ? formatDateDisplay(date) : tStudents('notAvailable')}
            </span>
            {isCurrentDateToday && (
              <span className="rounded-xl bg-[#e8ebff] px-3 py-1 text-sm font-semibold text-[#424a75]">
                {tCommon('today')}
              </span>
            )}
          </div>
          {hasUnsavedChanges && (
            <div className="flex items-center gap-2 self-start rounded-xl border border-amber-300 bg-amber-50 px-3 py-2">
              <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-amber-500" />
              <span className="text-sm font-semibold text-amber-800">{tCommon('unsavedChanges')}</span>
            </div>
          )}
        </div>

        <div className="h-px w-full bg-[#e8eaf3] md:hidden" />

        <div className="space-y-2 text-[#6d738f] md:hidden">
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-[15px] font-medium">{dateLabel}</span>
          </div>
          <div className="ml-7 flex items-center gap-3">
            <span className="whitespace-nowrap text-[24px] font-semibold leading-none tracking-[-0.02em] text-[#1010a3]">
              {date ? formatDateDisplay(date) : tStudents('notAvailable')}
            </span>
            {isCurrentDateToday && (
              <span className="rounded-xl bg-[#e8ebff] px-3 py-1 text-sm font-semibold text-[#424a75]">
                {tCommon('today')}
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 md:hidden">
          <div className="flex items-center gap-2 rounded-2xl border border-[#d9f0df] bg-[#e8f8ed] px-3 py-2 text-[#1f2a37]">
            <span className="h-3 w-3 rounded-full bg-[#35c759] shadow-[0_0_0_4px_rgba(53,199,89,0.2)]" />
            <span className="text-[16px] font-semibold leading-none">{t('sessionsCount', { count: lessonsCount })}</span>
          </div>
          <div className="flex items-center gap-2 rounded-2xl border border-[#eceef5] bg-[#f6f7fb] px-3 py-2 text-[#1f2a37]">
            <span className="h-3 w-3 rounded-full bg-[#b7bed3]" />
            <span className="text-[16px] font-semibold leading-none">{t('studentsCount', { count: studentsCount })}</span>
          </div>
        </div>

        <div className="hidden items-center gap-3 border-t border-[#e8eaf3] pt-3 text-[#3b3b40] md:flex">
          <span className="flex items-center gap-2 whitespace-nowrap text-[14px] font-medium">
            <span className="h-2.5 w-2.5 rounded-full bg-[#35c759]" />
            <span>{t('sessionsCount', { count: lessonsCount })}</span>
          </span>
          <span className="h-4 w-px bg-[#d6dae8]" />
          <span className="flex items-center gap-2 whitespace-nowrap text-[14px] font-medium">
            <span className="h-2.5 w-2.5 rounded-full bg-[#b7bed3]" />
            <span>{t('studentsCount', { count: studentsCount })}</span>
          </span>
        </div>
      </div>
    );
  }

  if (viewMode === 'week') {
    return (
      <>
        <div className="space-y-4 md:hidden">
          <div className="flex flex-col gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-[#6d738f]">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span className="text-[14px] font-medium">{groupLabel}</span>
                <span className="text-[18px] font-semibold leading-none text-[#0f1638]">
                  {group?.name || tStudents('notAvailable')}
                </span>
                {group?.level && (
                  <span className="rounded-xl bg-[#eef0ff] px-2.5 py-0.5 text-xs font-semibold text-[#424a75]">
                    {group.level}
                  </span>
                )}
              </div>

              <div className="space-y-2 text-[#6d738f]">
                <div className="flex items-center gap-2">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-[14px] font-medium">{weekLabel}</span>
                </div>
                <div className="ml-7">
                  <span className="whitespace-nowrap text-[18px] font-semibold leading-none tracking-[-0.01em] text-[#1010a3]">
                    {weekRange || tStudents('notAvailable')}
                  </span>
                </div>
              </div>
            </div>

            {hasUnsavedChanges && (
              <div className="flex items-center gap-2 self-start rounded-xl border border-amber-300 bg-amber-50 px-3 py-2">
                <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-amber-500" />
                <span className="text-sm font-semibold text-amber-800">{tCommon('unsavedChanges')}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 border-t border-[#e8eaf3] pt-3 text-[#3b3b40]">
            <span className="flex items-center gap-2 text-[15px]">
              <span className="h-2.5 w-2.5 rounded-full bg-[#35c759]" />
              <span>{t('sessionsCount', { count: lessonsCount })}</span>
            </span>
            <span className="h-4 w-px bg-[#d6dae8]" />
            <span className="flex items-center gap-2 text-[15px]">
              <span className="h-2.5 w-2.5 rounded-full bg-[#b7bed3]" />
              <span>{t('studentsCount', { count: studentsCount })}</span>
            </span>
          </div>
        </div>

        <div className="hidden md:block mb-6 pb-4 border-b-2 border-[rgba(14,14,16,0.07)]">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-[#8b8b90]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span className="text-xs font-semibold text-[#8b8b90] uppercase tracking-wide">
                    {t('registerGroupLabel')}
                  </span>
                  <span className="text-xl font-bold text-[#1010a3]">{group?.name || tStudents('notAvailable')}</span>
                  {group?.level && (
                    <span className="text-sm font-medium text-[#3b3b40]">({group.level})</span>
                  )}
                </div>
                <div className="h-6 w-px bg-[#e8e8ec]"></div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-[#8b8b90]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-xs font-semibold text-[#8b8b90] uppercase tracking-wide">
                    {t('registerWeekLabel')}
                  </span>
                  <span className="text-xl font-bold text-[#1010a3]">
                    {weekRange || tStudents('notAvailable')}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm text-[#3b3b40]">
                <span>{t('sessionsCount', { count: lessonsCount })}</span>
                <span>•</span>
                <span>{t('studentsCount', { count: studentsCount })}</span>
              </div>
            </div>
            {hasUnsavedChanges && (
              <div className="flex items-center gap-2 px-4 py-2 bg-amber-100 border-2 border-amber-400 rounded-lg">
                <div className="h-2 w-2 rounded-full bg-amber-600 animate-pulse"></div>
                <span className="text-sm font-semibold text-amber-800">{tCommon('unsavedChanges')}</span>
              </div>
            )}
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="mb-6 pb-4 border-b-2 border-[rgba(14,14,16,0.07)]">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-[#8b8b90]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="text-xs font-semibold text-[#8b8b90] uppercase tracking-wide">
                {t('registerGroupLabel')}
              </span>
              <span className="text-xl font-bold text-[#1010a3]">{group?.name || tStudents('notAvailable')}</span>
              {group?.level && (
                <span className="text-sm font-medium text-[#3b3b40]">({group.level})</span>
              )}
            </div>
            <div className="h-6 w-px bg-[#e8e8ec]"></div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-[#8b8b90]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-xs font-semibold text-[#8b8b90] uppercase tracking-wide">
                {viewMode === 'week' ? t('registerWeekLabel') : t('registerDateLabel')}
              </span>
              <span className="text-xl font-bold text-[#1010a3]">
                {viewMode === 'week' ? weekRange : date ? formatDateDisplay(date) : tStudents('notAvailable')}
              </span>
              {isCurrentDateToday && viewMode === 'day' && (
                <span className="px-2 py-0.5 text-xs font-semibold bg-[#1010a3]/20 text-[#1010a3] rounded-full">
                  {tCommon('today')}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm text-[#3b3b40]">
            <span>{t('sessionsCount', { count: lessonsCount })}</span>
            <span>•</span>
            <span>{t('studentsCount', { count: studentsCount })}</span>
          </div>
        </div>
        {hasUnsavedChanges && (
          <div className="flex items-center gap-2 px-4 py-2 bg-amber-100 border-2 border-amber-400 rounded-lg">
            <div className="h-2 w-2 rounded-full bg-amber-600 animate-pulse"></div>
            <span className="text-sm font-semibold text-amber-800">{tCommon('unsavedChanges')}</span>
          </div>
        )}
      </div>
    </div>
  );
}
