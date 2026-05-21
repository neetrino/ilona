'use client';

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
  return (
    <div className="grid w-full min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[repeat(auto-fit,minmax(min(100%,10rem),1fr))] items-end">
      <div className="min-w-0">
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
