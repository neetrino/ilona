import type { CrmLead, CrmLeadFilters } from '@/features/crm/types';

export const DEFAULT_FILTERS: CrmLeadFilters = {
  skip: 0,
  take: 100,
  sortBy: 'updatedAt',
  sortOrder: 'desc',
};

export const ARCHIVE_PARAM = 'archive';
export const EDIT_LEAD_PARAM = 'editLead';
export const LEAD_ID_PARAM = 'leadId';
export const CREATE_LEAD_PARAM = 'createLead';
export const VOICE_LEAD_PARAM = 'voiceLead';
export const PAID_REG_LEAD_ID_PARAM = 'paidRegLeadId';
export const VIEW_PARAM = 'view';
export const CRM_LIST_PAGE_SIZE = 10;

export function normalize(value?: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }
  return String(value).trim().toLowerCase();
}

export function containsNormalized(haystack?: string | null, needle?: string): boolean {
  if (!needle) return true;
  return normalize(haystack).includes(needle);
}

export function leadMatchesFilters(lead: CrmLead, filters: CrmLeadFilters): boolean {
  if (filters.status && lead.status !== filters.status) return false;
  if (filters.centerId && lead.centerId !== filters.centerId) return false;
  if (filters.teacherId && lead.teacherId !== filters.teacherId) return false;
  if (filters.groupId && lead.groupId !== filters.groupId) return false;
  if (filters.levelId && lead.levelId !== filters.levelId) return false;

  const search = normalize(filters.search);
  if (search) {
    const matched =
      containsNormalized(lead.firstName, search) ||
      containsNormalized(lead.lastName, search) ||
      containsNormalized(lead.phone, search);
    if (!matched) return false;
  }

  const createdAtTs = new Date(lead.createdAt).getTime();
  if (filters.dateFrom) {
    const fromTs = new Date(filters.dateFrom).getTime();
    if (!Number.isNaN(fromTs) && createdAtTs < fromTs) return false;
  }
  if (filters.dateTo) {
    const dateTo = new Date(filters.dateTo);
    dateTo.setHours(23, 59, 59, 999);
    const toTs = dateTo.getTime();
    if (!Number.isNaN(toTs) && createdAtTs > toTs) return false;
  }

  return true;
}

export function sortLeadsByFilters(leads: CrmLead[], filters: CrmLeadFilters): CrmLead[] {
  const sortBy = filters.sortBy ?? 'createdAt';
  const sortOrder = filters.sortOrder ?? 'desc';
  const direction = sortOrder === 'asc' ? 1 : -1;

  return [...leads].sort((a, b) => {
    const aTs = new Date(sortBy === 'updatedAt' ? a.updatedAt : a.createdAt).getTime();
    const bTs = new Date(sortBy === 'updatedAt' ? b.updatedAt : b.createdAt).getTime();
    if (aTs === bTs) return a.id.localeCompare(b.id);
    return (aTs - bTs) * direction;
  });
}
