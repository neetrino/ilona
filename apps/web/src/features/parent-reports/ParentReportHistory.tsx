'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { SingleSelectDropdown } from '@/shared/components/ui/single-select-dropdown';
import { ADMIN_CONTROL_CLASS } from '@/shared/lib/admin-control-theme';
import type { ParentReportHistoryItem } from './api';
import { quarterMonthNumbers } from './parent-report-range';

export function ParentReportHistory({
  history,
  selected,
  onSelect,
}: {
  history: ParentReportHistoryItem[];
  selected: string | undefined;
  onSelect: (quarterKey: string) => void;
}) {
  const t = useTranslations('parentReportsPage');
  const tCommon = useTranslations('common');
  const years = useMemo(() => yearsFrom(history), [history]);
  const year = selected?.slice(0, 4) || years[0] || '';
  const quarters = history
    .filter((item) => item.quarterKey.startsWith(`${year}-`))
    .sort((left, right) => left.quarterKey.localeCompare(right.quarterKey));
  if (years.length === 0) return null;
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="w-full sm:w-44">
        <SingleSelectDropdown
          id="parent-report-year"
          label={tCommon('year')}
          options={years.map((item) => ({ id: item, label: item }))}
          value={year}
          allowDeselect={false}
          triggerClassName={ADMIN_CONTROL_CLASS}
          onValueChange={(next) => {
            if (next) onSelect(newestQuarter(history, next));
          }}
        />
      </div>
      <div className="flex min-w-0 flex-1 gap-2 overflow-x-auto pb-1">
        {quarters.map((item) => (
          <HistoryChip
            key={item.quarterKey}
            label={quarterMonthNumbers(item.quarterKey)
              .map((month) => tCommon(`months.${month}`))
              .join(' · ')}
            countLabel={t('historySent', { count: item.sent })}
            selected={item.quarterKey === selected}
            onSelect={() => onSelect(item.quarterKey)}
          />
        ))}
      </div>
    </div>
  );
}

function yearsFrom(history: ParentReportHistoryItem[]): string[] {
  return [...new Set(history.map((item) => item.quarterKey.slice(0, 4)))].sort((left, right) =>
    right.localeCompare(left),
  );
}

function newestQuarter(history: ParentReportHistoryItem[], year: string): string {
  const match = history
    .filter((item) => item.quarterKey.startsWith(`${year}-`))
    .sort((left, right) => right.quarterKey.localeCompare(left.quarterKey))[0];
  return match?.quarterKey ?? history[0]?.quarterKey ?? '';
}

function HistoryChip({
  label,
  countLabel,
  selected,
  onSelect,
}: {
  label: string;
  countLabel: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`min-w-[9.5rem] shrink-0 rounded-[15px] border px-3 py-2 text-left ${
        selected ? 'border-[#1010a3] bg-[#ecefff]' : 'border-[rgba(14,14,16,0.08)] bg-white'
      }`}
    >
      <span className="block text-sm font-medium text-[#0e0e10]">{label}</span>
      <span className={`mt-0.5 block text-xs ${selected ? 'text-[#1010a3]' : 'text-[#8b8b90]'}`}>{countLabel}</span>
    </button>
  );
}
