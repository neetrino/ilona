'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { FilterDropdown } from '@/shared/components/ui/filter-dropdown';
import { SingleSelectDropdown } from '@/shared/components/ui/single-select-dropdown';
import { ADMIN_CONTROL_CLASS, ADMIN_FORM_INPUT_CLASS } from '@/shared/lib/admin-control-theme';
import { DROPDOWN_LABEL_CLASS } from '@/shared/components/ui/dropdown-theme';
import type { ParentReportItem } from './api';
import { NO_GROUP_ID, quarterKeyFromDate, recentQuarterKeys } from './parent-report-range';

export function useParentReportFilters() {
  const now = new Date();
  const [fromQuarter, setFromQuarter] = useState(() => `${now.getFullYear()}-Q1`);
  const [toQuarter, setToQuarter] = useState(() => quarterKeyFromDate(now));
  const [groupIds, setGroupIds] = useState<Set<string>>(() => new Set());
  const [statusIds, setStatusIds] = useState<Set<string>>(() => new Set());
  const [search, setSearch] = useState('');
  return {
    fromQuarter,
    setFromQuarter,
    toQuarter,
    setToQuarter,
    groupIds,
    setGroupIds,
    statusIds,
    setStatusIds,
    search,
    setSearch,
  };
}

export function ParentReportFilters({
  items,
  filters,
}: {
  items: ParentReportItem[];
  filters: ReturnType<typeof useParentReportFilters>;
}) {
  const t = useTranslations('parentReportsPage');
  const quarterOptions = useMemo(
    () => recentQuarterKeys(new Date()).map((key) => ({ id: key, label: key })),
    [],
  );
  const groupOptions = useMemo(() => groupOptionsFrom(items, t('noGroup')), [items, t]);
  const statusOptions = [
    { id: 'sent', label: t('sentFilter') },
    { id: 'notSent', label: t('notSent') },
    { id: 'missingEmail', label: t('missingEmail') },
    { id: 'reportsOff', label: t('reportsOff') },
  ];

  return (
    <div className="grid grid-cols-1 items-end gap-3 sm:grid-cols-2 xl:grid-cols-5">
      <SingleSelectDropdown
        id="parent-report-from"
        label={t('fromQuarter')}
        options={quarterOptions}
        value={filters.fromQuarter}
        onValueChange={(next) => {
          if (next) filters.setFromQuarter(next);
        }}
        triggerClassName={ADMIN_CONTROL_CLASS}
      />
      <SingleSelectDropdown
        id="parent-report-to"
        label={t('toQuarter')}
        options={quarterOptions}
        value={filters.toQuarter}
        onValueChange={(next) => {
          if (next) filters.setToQuarter(next);
        }}
        triggerClassName={ADMIN_CONTROL_CLASS}
      />
      <FilterDropdown
        label={t('group')}
        options={groupOptions}
        selectedIds={filters.groupIds}
        onSelectionChange={filters.setGroupIds}
        placeholder={t('allGroups')}
        triggerClassName={ADMIN_CONTROL_CLASS}
      />
      <FilterDropdown
        label={t('status')}
        options={statusOptions}
        selectedIds={filters.statusIds}
        onSelectionChange={filters.setStatusIds}
        placeholder={t('allStatuses')}
        triggerClassName={ADMIN_CONTROL_CLASS}
      />
      <div>
        <label className={DROPDOWN_LABEL_CLASS} htmlFor="parent-report-search">
          {t('search')}
        </label>
        <input
          id="parent-report-search"
          value={filters.search}
          onChange={(event) => filters.setSearch(event.target.value)}
          className={ADMIN_FORM_INPUT_CLASS}
        />
      </div>
    </div>
  );
}

function groupOptionsFrom(items: ParentReportItem[], noGroupLabel: string) {
  const groups = new Map<string, string>();
  for (const item of items) {
    groups.set(item.groupId ?? NO_GROUP_ID, item.groupName ?? noGroupLabel);
  }
  return [...groups.entries()]
    .map(([id, label]) => ({ id, label }))
    .sort((left, right) => left.label.localeCompare(right.label));
}
