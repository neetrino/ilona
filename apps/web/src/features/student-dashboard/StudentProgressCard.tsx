'use client';

import { useTranslations } from 'next-intl';
import { LearningActivityGrid } from './LearningActivityGrid';

type StudentProgressCardProps = {
  overall: number;
  attendanceRate: number;
  studyProgress: number;
  levelLabel?: string;
  isLoading?: boolean;
};

function ProgressRing({ value }: { value: number }) {
  const tCommon = useTranslations('common');
  const clamped = Math.max(0, Math.min(100, Math.round(value)));
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className="relative mx-auto h-[8.125rem] w-[8.125rem] shrink-0">
      <svg className="-rotate-90" viewBox="0 0 120 120" aria-hidden>
        <circle cx="60" cy="60" r={radius} fill="none" stroke="#f1f1f2" strokeWidth="10" />
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="#6868f8"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <p className="text-[1.875rem] font-bold leading-none tracking-tight text-[#1010a3]">
          {clamped}
          <span className="text-sm font-medium text-[#8b8b90]">%</span>
        </p>
        <p className="mt-1 text-[0.65625rem] uppercase tracking-wider text-[#8b8b90]">{tCommon('overall')}</p>
      </div>
    </div>
  );
}

function SkillRow({ label, rate, barClass }: { label: string; rate: number; barClass: string }) {
  const clamped = Math.max(0, Math.min(100, Math.round(rate)));
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 sm:flex-nowrap">
      <span className="w-full shrink-0 text-[0.8125rem] font-medium text-[#1010a3] min-[400px]:w-auto sm:min-w-[6.5rem] md:min-w-[7rem]">
        {label}
      </span>
      <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-[#f1f1f2]">
        <div className={`h-full rounded-full ${barClass}`} style={{ width: `${clamped}%` }} />
      </div>
      <span className="w-10 shrink-0 text-right font-mono text-[0.6875rem] text-[#3b3b40]">
        {clamped}%
      </span>
    </div>
  );
}

export function StudentProgressCard({
  overall,
  attendanceRate,
  studyProgress,
  levelLabel,
  isLoading,
}: StudentProgressCardProps) {
  const t = useTranslations('dashboard');

  if (isLoading) {
    return (
      <section className="h-[24.5rem] animate-pulse rounded-3xl border border-[rgba(14,14,16,0.07)] bg-white" />
    );
  }

  return (
    <section className="rounded-3xl border border-[rgba(14,14,16,0.07)] bg-white p-5 transition-[transform,box-shadow] duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_10px_28px_rgba(14,14,16,0.08)] sm:p-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-base font-semibold text-[#1010a3]">{t('yourProgress')}</h3>
          <p className="text-xs text-[#8b8b90]">
            {levelLabel ? t('progress.track', { level: levelLabel }) : t('progress.trackDefault')}
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-start">
        <ProgressRing value={overall} />
        <div className="min-w-0 flex-1 space-y-4">
          <SkillRow
            label={t('factorAttendance')}
            rate={attendanceRate}
            barClass="bg-[#a3c9ff]"
          />
          <SkillRow
            label={t('progress.studyProgress')}
            rate={studyProgress}
            barClass="bg-[#1010a3]"
          />
        </div>
      </div>

      <div className="mt-6">
        <LearningActivityGrid intensity={overall} />
      </div>
    </section>
  );
}
