'use client';

import { useTranslations } from 'next-intl';
import type { CrmLeadFilters } from '@/features/crm/types';
import { SingleSelectDropdown } from '@/shared/components/ui/single-select-dropdown';

interface CRMFiltersProps {
  filters: CrmLeadFilters;
  onFiltersChange: (f: CrmLeadFilters) => void;
  centers: { id: string; name: string }[];
  teachers: { id: string; user?: { firstName?: string; lastName?: string } }[];
  groups: { id: string; name: string }[];
}

export function CRMFilters({
  filters,
  onFiltersChange,
  centers,
  teachers,
  groups,
}: CRMFiltersProps) {
  const t = useTranslations('crm');
  const tc = useTranslations('common');

  return (
    <div className="grid w-full min-w-0 grid-cols-1 items-end gap-3 sm:grid-cols-2 lg:grid-cols-[repeat(auto-fit,minmax(min(100%,10rem),1fr))]">
      <div className="min-w-0">
        <label className="block text-xs font-medium text-slate-500 mb-1">{tc('search')}</label>
        <input
          type="search"
          placeholder={t('searchPlaceholder')}
          value={filters.search ?? ''}
          onChange={(e) => onFiltersChange({ ...filters, search: e.target.value || undefined })}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
      </div>
      <div className="min-w-0">
        <label className="block text-xs font-medium text-slate-500 mb-1">{t('center')}</label>
        <SingleSelectDropdown
          id="crm-filter-center"
          options={[
            { id: '', label: tc('all') },
            ...centers.map((c) => ({ id: c.id, label: c.name })),
          ]}
          value={filters.centerId ?? ''}
          onValueChange={(nextValue) =>
            onFiltersChange({ ...filters, centerId: nextValue || undefined })
          }
        />
      </div>
      <div className="min-w-0">
        <label className="block text-xs font-medium text-slate-500 mb-1">{t('teacher')}</label>
        <SingleSelectDropdown
          id="crm-filter-teacher"
          options={[
            { id: '', label: tc('all') },
            ...teachers.map((teacher) => ({
              id: teacher.id,
              label: `${teacher.user?.firstName ?? ''} ${teacher.user?.lastName ?? ''}`.trim(),
            })),
          ]}
          value={filters.teacherId ?? ''}
          onValueChange={(nextValue) =>
            onFiltersChange({ ...filters, teacherId: nextValue || undefined })
          }
        />
      </div>
      <div className="min-w-0">
        <label className="block text-xs font-medium text-slate-500 mb-1">{t('group')}</label>
        <SingleSelectDropdown
          id="crm-filter-group"
          options={[
            { id: '', label: tc('all') },
            ...groups.map((g) => ({ id: g.id, label: g.name })),
          ]}
          value={filters.groupId ?? ''}
          onValueChange={(nextValue) =>
            onFiltersChange({ ...filters, groupId: nextValue || undefined })
          }
        />
      </div>
      <div className="min-w-0">
        <label className="block text-xs font-medium text-slate-500 mb-1">{t('dateFrom')}</label>
        <input
          type="date"
          value={filters.dateFrom ?? ''}
          onChange={(e) =>
            onFiltersChange({ ...filters, dateFrom: e.target.value || undefined })
          }
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
      </div>
      <div className="min-w-0">
        <label className="block text-xs font-medium text-slate-500 mb-1">{t('dateTo')}</label>
        <input
          type="date"
          value={filters.dateTo ?? ''}
          onChange={(e) =>
            onFiltersChange({ ...filters, dateTo: e.target.value || undefined })
          }
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
      </div>
    </div>
  );
}
