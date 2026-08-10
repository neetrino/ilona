'use client';

import { useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { addCalendarDays, endOfZonedDay, startOfZonedDay, toYmd } from '@ilona/types';
import { useStaffPlannedAbsences } from '../hooks/useAttendance';
import type { StaffPlannedAbsenceItem } from '../types';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/shared/components/ui';
import { LessonListDateCell } from '@/shared/components/daily-duties/LessonListDateCell';
import { cn } from '@/shared/lib/utils';

const PREVIEW_LIMIT = 5;

type PlannedAbsencesStaffBlockProps = {
  fillHeight?: boolean;
  className?: string;
};

function toAbsenceDateStr(date: string): string {
  return date.includes('T') ? date : `${date}T12:00:00.000Z`;
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
        'rounded-3xl border border-[rgba(14,14,16,0.07)] bg-white text-sm',
        detailed ? 'p-4 sm:p-5' : 'p-4',
      )}
    >
      <div className="flex items-start gap-3">
        <div className="w-fit shrink-0">
          <LessonListDateCell
            dateStr={toAbsenceDateStr(row.date)}
            locale={locale}
            showTime={false}
          />
        </div>
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
    const fromYmd = toYmd(new Date());
    const toYmdValue = addCalendarDays(fromYmd, 60);
    return {
      dateFrom: startOfZonedDay(fromYmd).toISOString(),
      dateTo: endOfZonedDay(toYmdValue).toISOString(),
    };
  }, []);

  const { data = [], isLoading } = useStaffPlannedAbsences(dateFrom, dateTo, true);

  const previewItems = useMemo(() => data.slice(0, PREVIEW_LIMIT), [data]);

  return (
    <>
      <section
        className={cn(
          'rounded-3xl border border-[rgba(14,14,16,0.07)] bg-[#f6f7ff] p-5 shadow-[0_8px_24px_rgba(14,14,16,0.06)] sm:p-6',
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
          <div className="-mx-4 -mt-4 mb-5 border-b border-[rgba(14,14,16,0.07)] bg-white px-4 py-5 tablet:-mx-6 tablet:-mt-6 tablet:px-6 tablet:py-6">
            <div className="min-w-0 pr-8">
              <DialogTitle className="text-left text-lg font-semibold tracking-tight text-[#1010a3] sm:text-xl">
                {t('plannedAbsencesStaffTitle')}
              </DialogTitle>
              <p className="mt-1.5 text-sm text-[#8b8b90]">
                {t('plannedAbsencesStaffCount', { count: data.length })}
              </p>
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
