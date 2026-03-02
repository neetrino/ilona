'use client';

import type { CrmLeadFilters, CrmLeadStatus } from '@/features/crm/types';
import { CRM_COLUMN_ORDER } from '@/features/crm/types';
import { STATUS_LABELS } from './LeadCard';

interface CRMFiltersProps {
  filters: CrmLeadFilters;
  onFiltersChange: (f: CrmLeadFilters) => void;
  centers: { id: string; name: string }[];
  teachers: { id: string; user?: { firstName?: string; lastName?: string } }[];
  groups: { id: string; name: string }[];
  /** When provided (e.g. Admin CRM), only these statuses appear in the Status filter dropdown. */
  statusOptions?: CrmLeadStatus[];
}

export function CRMFilters({
  filters,
  onFiltersChange,
  centers,
  teachers,
  groups,
  statusOptions = CRM_COLUMN_ORDER,
}: CRMFiltersProps) {
  return (
    <div className="flex flex-wrap items-end gap-4">
      <div className="min-w-[200px]">
        <label className="block text-xs font-medium text-slate-500 mb-1">Search</label>
        <input
          type="search"
          placeholder="Name, phone…"
          value={filters.search ?? ''}
          onChange={(e) => onFiltersChange({ ...filters, search: e.target.value || undefined })}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-500 mb-1">Status</label>
        <select
          value={filters.status ?? ''}
          onChange={(e) =>
            onFiltersChange({
              ...filters,
              status: (e.target.value || undefined) as CrmLeadStatus | undefined,
            })
          }
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">All</option>
          {statusOptions.map((s) => (
            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-500 mb-1">Center</label>
        <select
          value={filters.centerId ?? ''}
          onChange={(e) =>
            onFiltersChange({ ...filters, centerId: e.target.value || undefined })
          }
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">All</option>
          {centers.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-500 mb-1">Teacher</label>
        <select
          value={filters.teacherId ?? ''}
          onChange={(e) =>
            onFiltersChange({ ...filters, teacherId: e.target.value || undefined })
          }
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">All</option>
          {teachers.map((t) => (
            <option key={t.id} value={t.id}>
              {t.user?.firstName} {t.user?.lastName}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-500 mb-1">Group</label>
        <select
          value={filters.groupId ?? ''}
          onChange={(e) =>
            onFiltersChange({ ...filters, groupId: e.target.value || undefined })
          }
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">All</option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-500 mb-1">From</label>
        <input
          type="date"
          value={filters.dateFrom ?? ''}
          onChange={(e) =>
            onFiltersChange({ ...filters, dateFrom: e.target.value || undefined })
          }
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-500 mb-1">To</label>
        <input
          type="date"
          value={filters.dateTo ?? ''}
          onChange={(e) =>
            onFiltersChange({ ...filters, dateTo: e.target.value || undefined })
          }
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
      </div>
    </div>
  );
}
