'use client';

import { useTranslations } from 'next-intl';
import type { CrmLeadFilters } from '@/features/crm/types';

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
        <select
          value={filters.centerId ?? ''}
          onChange={(e) =>
            onFiltersChange({ ...filters, centerId: e.target.value || undefined })
          }
          className="unified-native-select w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">{tc('all')}</option>
          {centers.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>
      <div className="min-w-0">
        <label className="block text-xs font-medium text-slate-500 mb-1">{t('teacher')}</label>
        <select
          value={filters.teacherId ?? ''}
          onChange={(e) =>
            onFiltersChange({ ...filters, teacherId: e.target.value || undefined })
          }
          className="unified-native-select w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">{tc('all')}</option>
          {teachers.map((teacher) => (
            <option key={teacher.id} value={teacher.id}>
              {teacher.user?.firstName} {teacher.user?.lastName}
            </option>
          ))}
        </select>
      </div>
      <div className="min-w-0">
        <label className="block text-xs font-medium text-slate-500 mb-1">{t('group')}</label>
        <select
          value={filters.groupId ?? ''}
          onChange={(e) =>
            onFiltersChange({ ...filters, groupId: e.target.value || undefined })
          }
          className="unified-native-select w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">{tc('all')}</option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </select>
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
