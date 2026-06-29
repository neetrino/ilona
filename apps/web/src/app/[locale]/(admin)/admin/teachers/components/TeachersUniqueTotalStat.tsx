'use client';

import { Skeleton } from '@/shared/components/ui/Skeleton';
import type { useTranslations } from 'next-intl';

interface TeachersUniqueTotalStatProps {
  count: number;
  isLoading: boolean;
  t: ReturnType<typeof useTranslations<'teachers'>>;
  onClick?: () => void;
}

export function TeachersUniqueTotalStat({
  count,
  isLoading,
  t,
  onClick,
}: TeachersUniqueTotalStatProps) {
  const content = (
    <>
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#f0f0ff] text-[#1010a3]">
        <svg
          className="h-[1.125rem] w-[1.125rem]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.75}
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
      </div>
      <div className="min-w-0">
        <p className="text-[0.625rem] font-semibold uppercase tracking-[0.12em] text-[#8b8b90]">
          {t('totalTeachers')}
        </p>
        {isLoading ? (
          <Skeleton className="mt-1 h-6 w-10 rounded-md bg-[#ececec]" />
        ) : (
          <p className="text-xl font-bold leading-none tabular-nums tracking-tight text-[#1010a3]">
            {count}
          </p>
        )}
        <p className="mt-0.5 max-w-[10rem] text-[0.625rem] leading-tight text-[#8b8b90]">
          {onClick ? t('viewAllTeachers') : t('uniqueTeachersHelper')}
        </p>
      </div>
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="flex shrink-0 items-center gap-3 rounded-2xl border border-[rgba(14,14,16,0.07)] bg-white px-3.5 py-2.5 text-left shadow-[0_2px_8px_rgba(15,23,42,0.06)] transition-all hover:-translate-y-px hover:border-[rgba(16,16,163,0.18)] hover:shadow-[0_4px_14px_rgba(16,16,163,0.12)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1010a3]/30 active:scale-[0.985]"
        aria-label={t('viewAllTeachers')}
      >
        {content}
      </button>
    );
  }

  return (
    <div
      className="flex shrink-0 items-center gap-3 rounded-2xl border border-[rgba(14,14,16,0.07)] bg-white px-3.5 py-2.5 shadow-[0_2px_8px_rgba(15,23,42,0.06)]"
      aria-label={t('totalTeachers')}
    >
      {content}
    </div>
  );
}
