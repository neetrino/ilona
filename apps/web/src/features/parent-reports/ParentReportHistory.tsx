'use client';

import { useTranslations } from 'next-intl';
import { formatQuarterMonths } from './parent-report-range';
import type { ParentReportHistoryItem } from './api';

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
  if (history.length === 0) return null;
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {history.map((item) => (
        <HistoryChip
          key={item.quarterKey}
          label={formatQuarterMonths(item.quarterKey, (month) => tCommon(`months.${month}`))}
          countLabel={t('historySent', { count: item.sent })}
          selected={item.quarterKey === selected}
          onSelect={() => onSelect(item.quarterKey)}
        />
      ))}
    </div>
  );
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
      className={`min-w-[11rem] shrink-0 rounded-[15px] border px-3 py-2 text-left ${
        selected ? 'border-[#1010a3] bg-[#ecefff]' : 'border-[rgba(14,14,16,0.08)] bg-white'
      }`}
    >
      <span className="block text-sm font-medium text-[#0e0e10]">{label}</span>
      <span className={`mt-0.5 block text-xs ${selected ? 'text-[#1010a3]' : 'text-[#8b8b90]'}`}>{countLabel}</span>
    </button>
  );
}
