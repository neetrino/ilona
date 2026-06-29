'use client';

import { useTranslations } from 'next-intl';
import type { CrmLeadFilters } from '@/features/crm/types';
import { SingleSelectDropdown } from '@/shared/components/ui/single-select-dropdown';
import { DatePickerInput } from '@/shared/components/ui';
import { ADMIN_SEARCH_INPUT_CLASS } from '@/shared/lib/admin-control-theme';

const CRM_DESKTOP_CONTROL_CLASS = 'h-11 min-h-11 rounded-[15px] lg:border-[rgba(14,14,16,0.08)] lg:focus:border-[#1010a3]/45 lg:focus:outline-none lg:focus:ring-4 lg:focus:ring-[#1010a3]/10';

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
        <label className="mb-1.5 block text-sm font-medium text-[#8b8b90]">{tc('search')}</label>
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#8b8b90]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="search"
            placeholder={t('searchPlaceholder')}
            value={filters.search ?? ''}
            onChange={(e) => onFiltersChange({ ...filters, search: e.target.value || undefined })}
            className={ADMIN_SEARCH_INPUT_CLASS}
          />
        </div>
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
          triggerClassName={CRM_DESKTOP_CONTROL_CLASS}
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
          triggerClassName={CRM_DESKTOP_CONTROL_CLASS}
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
          triggerClassName={CRM_DESKTOP_CONTROL_CLASS}
        />
      </div>
      <div className="min-w-0 grid grid-cols-2 gap-3 sm:contents">
        <div className="min-w-0">
          <label className="block text-xs font-medium text-slate-500 mb-1">{t('dateFrom')}</label>
          <DatePickerInput
            id="crm-filter-date-from"
            value={filters.dateFrom ?? ''}
            placeholder={t('dateFrom')}
            onValueChange={(nextDate) => onFiltersChange({ ...filters, dateFrom: nextDate || undefined })}
            className={CRM_DESKTOP_CONTROL_CLASS}
          />
        </div>
        <div className="min-w-0">
          <label className="block text-xs font-medium text-slate-500 mb-1">{t('dateTo')}</label>
          <DatePickerInput
            id="crm-filter-date-to"
            value={filters.dateTo ?? ''}
            placeholder={t('dateTo')}
            onValueChange={(nextDate) => onFiltersChange({ ...filters, dateTo: nextDate || undefined })}
            className={CRM_DESKTOP_CONTROL_CLASS}
          />
        </div>
      </div>
    </div>
  );
}
