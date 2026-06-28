'use client';

import { useTranslations } from 'next-intl';
import type { CrmLeadFilters } from '@/features/crm/types';
import { SingleSelectDropdown } from '@/shared/components/ui/single-select-dropdown';
import { DatePickerInput } from '@/shared/components/ui';
import { cn } from '@/shared/lib/utils';

const CRM_DESKTOP_CONTROL_CLASS = 'lg:h-11 lg:rounded-[15px]';

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
          className={cn(
            'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm',
            CRM_DESKTOP_CONTROL_CLASS,
            'lg:border-[rgba(14,14,16,0.08)] lg:py-0 lg:focus:border-[#1010a3]/45 lg:focus:outline-none lg:focus:ring-4 lg:focus:ring-[#1010a3]/10',
          )}
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
