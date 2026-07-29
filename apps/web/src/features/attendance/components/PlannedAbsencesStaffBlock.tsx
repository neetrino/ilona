'use client';

import { useMemo, useState } from 'react';
import { CalendarDays } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useStaffPlannedAbsences } from '../hooks/useAttendance';
import type { StaffPlannedAbsenceItem } from '../types';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/shared/components/ui';
import { cn } from '@/shared/lib/utils';

const PREVIEW_LIMIT = 5;

type PlannedAbsencesStaffBlockProps = {
  fillHeight?: boolean;
  className?: string;
};

function getAbsenceDateParts(date: string, locale: string): { dayLabel: string; dayNumber: string } {
  const [year, month, day] = date.split('-').map(Number);
  if (![year, month, day].every((n) => Number.isFinite(n))) {
    return { dayLabel: '—', dayNumber: '—' };
  }
  // Noon UTC keeps weekday/day stable for a YYYY-MM-DD calendar value.
  const parsed = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  return {
    dayLabel: parsed.toLocaleDateString(locale, { weekday: 'short', timeZone: 'UTC' }),
    dayNumber: String(day),
  };
}

function AbsenceDateBadge({ date, locale }: { date: string; locale: string }) {
  const { dayLabel, dayNumber } = getAbsenceDateParts(date, locale);

  return (
    <div className="h-[4.25rem] w-[4.25rem] shrink-0 overflow-hidden rounded-[1rem] border border-[rgba(14,14,16,0.08)] bg-white">
      <div className="bg-gradient-to-r from-[#ff9330] via-[#ff5f5f] to-[#ff2e88] px-2 py-1 text-center text-[0.625rem] font-semibold uppercase tracking-[0.08em] text-white">
        {dayLabel}
      </div>
      <p className="pt-1.5 text-center text-[1.625rem] font-bold leading-none tracking-[-0.02em] text-[#1010a3]">
        {dayNumber}
      </p>
    </div>
  );
}

function PlannedAbsenceCard({
  row,
  locale,
  detailed = false,
}: {
  row: StaffPlannedAbsenceItem;
  locale: string;
  detailed?: boolean;
}) {
  return (
    <div
      className={cn(
        'rounded-3xl border border-[rgba(14,14,16,0.07)] bg-white text-sm shadow-[0_14px_30px_-28px_rgba(16,16,163,0.9)] transition-shadow hover:shadow-[0_22px_40px_-32px_rgba(16,16,163,0.9)]',
        detailed ? 'p-4 sm:p-5' : 'p-4',
      )}
    >
      <div className="flex items-start gap-3">
        <AbsenceDateBadge date={row.date} locale={locale} />
        <div className="min-w-0 flex-1">
          <div className="font-semibold tracking-tight text-[#1010a3]">{row.student.name}</div>
          <div className="mt-0.5 text-xs text-[#8b8b90]">
            {row.student.group?.name ?? '—'}
          </div>
          <p
            className={cn(
              'mt-3 whitespace-pre-wrap leading-relaxed text-[#3b3b40]',
              detailed && 'rounded-2xl bg-[#f6f7ff] px-3.5 py-3 text-[0.8125rem]',
            )}
          >
            {row.comment}
          </p>
        </div>
      </div>
    </div>
  );
}

export function PlannedAbsencesStaffBlock({
  fillHeight = false,
  className,
}: PlannedAbsencesStaffBlockProps) {
  const t = useTranslations('attendance');
  const locale = useLocale();
  const [viewAllOpen, setViewAllOpen] = useState(false);

  const { dateFrom, dateTo } = useMemo(() => {
    const from = new Date();
    from.setHours(0, 0, 0, 0);
    const to = new Date(from);
    to.setDate(to.getDate() + 60);
    to.setHours(23, 59, 59, 999);
    return { dateFrom: from.toISOString(), dateTo: to.toISOString() };
  }, []);

  const { data = [], isLoading } = useStaffPlannedAbsences(dateFrom, dateTo, true);

  const previewItems = useMemo(() => data.slice(0, PREVIEW_LIMIT), [data]);

  return (
    <>
      <section
        className={cn(
          'rounded-3xl border border-[rgba(14,14,16,0.07)] bg-[#f6f7ff] p-5 shadow-[0_10px_30px_-24px_rgba(16,16,163,0.45)] sm:p-6',
          fillHeight && 'flex min-h-0 flex-col',
          className,
        )}
      >
        <header className="mb-4 flex shrink-0 flex-wrap items-center justify-between gap-3 sm:mb-5">
          <h2 className="text-[clamp(0.875rem,1.25vw,1rem)] font-semibold tracking-tight text-[#1010a3]">
            {t('plannedAbsencesStaffTitle')}
          </h2>
          <button
            type="button"
            onClick={() => setViewAllOpen(true)}
            disabled={isLoading || data.length === 0}
            className="inline-flex h-9 items-center rounded-full border border-[#1010a3]/20 bg-white px-4 text-sm font-medium text-[#1010a3] transition-colors hover:bg-[#ececff] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {t('plannedAbsencesStaffViewAll')}
          </button>
        </header>
        {isLoading ? (
          <div className="space-y-2">
            <div className="h-20 animate-pulse rounded-3xl border border-[rgba(14,14,16,0.07)] bg-white" />
            <div className="h-20 animate-pulse rounded-3xl border border-[rgba(14,14,16,0.07)] bg-white" />
          </div>
        ) : data.length === 0 ? (
          <p className={cn('text-sm text-[#8b8b90]', fillHeight && 'flex flex-1 items-center')}>
            {t('plannedAbsencesStaffEmpty')}
          </p>
        ) : (
          <ul
            className={cn(
              'space-y-3',
              fillHeight && 'min-h-0 flex-1 overflow-y-auto',
            )}
          >
            {previewItems.map((row) => (
              <li key={row.id}>
                <PlannedAbsenceCard row={row} locale={locale} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <Dialog open={viewAllOpen} onOpenChange={setViewAllOpen}>
        <DialogContent
          variant="portal"
          stackOpen={viewAllOpen}
          className="bg-[#f8f9fb]"
          aria-describedby={undefined}
        >
          <div className="-mx-4 -mt-4 mb-5 border-b border-[rgba(14,14,16,0.07)] bg-white px-4 pb-5 pt-1 tablet:-mx-6 tablet:-mt-6 tablet:px-6 tablet:pb-6 tablet:pt-2">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 flex-col overflow-hidden rounded-[0.875rem] border border-[rgba(14,14,16,0.08)] bg-white shadow-[0_6px_16px_-10px_rgba(16,16,163,0.45)]">
                <div className="h-3.5 shrink-0 bg-gradient-to-r from-[#ff9330] via-[#ff5f5f] to-[#ff2e88]" />
                <div className="flex flex-1 items-center justify-center">
                  <CalendarDays className="h-4 w-4 text-[#1010a3]" strokeWidth={2.25} aria-hidden />
                </div>
              </div>
              <div className="min-w-0 flex-1 pr-8">
                <DialogTitle className="text-left text-lg font-semibold tracking-tight text-[#1010a3] sm:text-xl">
                  {t('plannedAbsencesStaffTitle')}
                </DialogTitle>
                <p className="mt-1.5 text-sm text-[#8b8b90]">
                  {t('plannedAbsencesStaffCount', { count: data.length })}
                </p>
              </div>
            </div>
          </div>

          <ul className="space-y-3 pb-2">
            {data.map((row) => (
              <li key={row.id}>
                <PlannedAbsenceCard row={row} locale={locale} detailed />
              </li>
            ))}
          </ul>
        </DialogContent>
      </Dialog>
    </>
  );
}
