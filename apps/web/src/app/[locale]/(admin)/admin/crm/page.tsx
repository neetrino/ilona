'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';
import { fetchLeads, changeLeadStatus, changeLeadBranch, fetchCrmStatuses } from '@/features/crm/api/crm.api';
import { fetchCenters } from '@/features/centers/api/centers.api';
import { fetchTeachers } from '@/features/teachers/api/teachers.api';
import { fetchGroups } from '@/features/groups/api/groups.api';
import type { CrmLead, CrmLeadFilters, CrmLeadStatus, CrmLeadsResponse } from '@/features/crm/types';
import { CRM_COLUMN_ORDER } from '@/features/crm/types';
import {
  BoardView,
  ListTable,
  LeadDrawer,
  VoiceLeadModal,
  EditLeadModal,
  PaidRegistrationModal,
  CRMFilters,
} from '@/features/crm/components';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { useAuthStore } from '@/features/auth/store/auth.store';

const DEFAULT_FILTERS: CrmLeadFilters = {
  skip: 0,
  take: 100,
  sortBy: 'updatedAt',
  sortOrder: 'desc',
};

const ARCHIVE_PARAM = 'archive';
const EDIT_LEAD_PARAM = 'editLead';

function normalize(value?: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }
  return String(value).trim().toLowerCase();
}

function containsNormalized(haystack?: string | null, needle?: string): boolean {
  if (!needle) return true;
  return normalize(haystack).includes(needle);
}

function leadMatchesFilters(lead: CrmLead, filters: CrmLeadFilters): boolean {
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

function sortLeadsByFilters(leads: CrmLead[], filters: CrmLeadFilters): CrmLead[] {
  const sortBy = filters.sortBy ?? 'createdAt';
  const sortOrder = filters.sortOrder ?? 'desc';
  const direction = sortOrder === 'asc' ? 1 : -1;

  return [...leads].sort((a, b) => {
    const aTs = new Date(sortBy === 'updatedAt' ? a.updatedAt : a.createdAt).getTime();
    const bTs = new Date(sortBy === 'updatedAt' ? b.updatedAt : b.createdAt).getTime();
    if (aTs === bTs) return b.id.localeCompare(a.id);
    return (aTs - bTs) * direction;
  });
}

export default function AdminCrmPage() {
  const t = useTranslations('nav');
  const user = useAuthStore((state) => state.user);
  const userRole = user?.role;
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const hasAccessToken = useAuthStore((state) => Boolean(state.tokens?.accessToken));
  const isAdmin = userRole === 'ADMIN';
  const managerCenterId = userRole === 'MANAGER' ? user?.managerCenterId ?? undefined : undefined;
  const isAuthReady = isHydrated && isAuthenticated && hasAccessToken && !!user?.id;
  const authScopeKey = `${userRole ?? 'UNKNOWN'}:${user?.id ?? 'anonymous'}:${managerCenterId ?? 'all-centers'}`;
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState<CrmLeadFilters>(DEFAULT_FILTERS);
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board');
  const [showArchiveColumn, setShowArchiveColumn] = useState(
    () => searchParams.get(ARCHIVE_PARAM) === '1'
  );
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [voiceModalOpen, setVoiceModalOpen] = useState(false);
  const [newColumnCenterId] = useState<string | null>(null);
  const [editLeadId, setEditLeadId] = useState<string | null>(() => searchParams.get(EDIT_LEAD_PARAM));
  const [paidRegLeadId, setPaidRegLeadId] = useState<string | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);

  // Restore Archive column visibility from URL after refresh
  useEffect(() => {
    setShowArchiveColumn(searchParams.get(ARCHIVE_PARAM) === '1');
  }, [searchParams]);

  // Restore edit lead modal from URL after refresh
  useEffect(() => {
    setEditLeadId(searchParams.get(EDIT_LEAD_PARAM));
  }, [searchParams]);

  const queryClient = useQueryClient();
  const scopedFilters = useMemo<CrmLeadFilters>(() => filters, [filters]);

  useEffect(() => {
    if (!isAuthReady) return;
    queryClient.removeQueries({ queryKey: ['crm-leads'] });
  }, [authScopeKey, isAuthReady, queryClient]);

  const { data: leadsData, isLoading, refetch } = useQuery({
    queryKey: ['crm-leads', authScopeKey, scopedFilters],
    queryFn: () => fetchLeads(scopedFilters),
    enabled: isAuthReady,
  });

  const statusMutation = useMutation({
    mutationFn: ({ leadId, status }: { leadId: string; status: CrmLeadStatus }) =>
      changeLeadStatus(leadId, { status }),
    onMutate: async ({ leadId, status }) => {
      setStatusError(null);
      await queryClient.cancelQueries({ queryKey: ['crm-leads', authScopeKey, scopedFilters] });
      const previous = queryClient.getQueryData<CrmLeadsResponse>(['crm-leads', authScopeKey, scopedFilters]);
      if (previous?.items) {
        const lead = previous.items.find((l) => l.id === leadId);
        const fromStatus = lead?.status;
        const counts = { ...previous.countsByStatus } as Partial<Record<CrmLeadStatus, number>>;
        if (fromStatus && counts[fromStatus] !== undefined) {
          counts[fromStatus] = Math.max(0, (counts[fromStatus] ?? 0) - 1);
        }
        if (counts[status] !== undefined) {
          counts[status] = (counts[status] ?? 0) + 1;
        } else {
          counts[status] = 1;
        }
        const updatedLead = lead ? { ...lead, status } : null;
        const restItems = previous.items.filter((l) => l.id !== leadId);
        queryClient.setQueryData<CrmLeadsResponse>(['crm-leads', authScopeKey, scopedFilters], {
          ...previous,
          items: updatedLead ? [updatedLead, ...restItems] : previous.items,
          countsByStatus: counts,
        });
      }
      return { previous };
    },
    onError: (_err, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['crm-leads', authScopeKey, scopedFilters], context.previous);
      }
      setStatusError('Failed to update status. Please try again.');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-leads'] });
    },
  });
  const changingStatusId = statusMutation.isPending ? statusMutation.variables?.leadId ?? null : null;
  const branchMutation = useMutation({
    mutationFn: ({ leadId, centerId }: { leadId: string; centerId: string | null }) =>
      changeLeadBranch(leadId, centerId ? { centerId } : {}),
    onMutate: async ({ leadId, centerId }) => {
      setStatusError(null);
      await queryClient.cancelQueries({ queryKey: ['crm-leads', authScopeKey, scopedFilters] });
      const previous = queryClient.getQueryData<CrmLeadsResponse>(['crm-leads', authScopeKey, scopedFilters]);
      if (previous?.items) {
        const centerById = new Map(centers.map((c) => [c.id, c]));
        const updatedItems = previous.items.map((lead) => {
          if (lead.id !== leadId) return lead;
          const nextCenter = centerId ? centerById.get(centerId) : null;
          return {
            ...lead,
            centerId,
            center: nextCenter ? { id: nextCenter.id, name: nextCenter.name } : null,
          };
        });
        queryClient.setQueryData<CrmLeadsResponse>(['crm-leads', authScopeKey, scopedFilters], {
          ...previous,
          items: updatedItems,
        });
      }
      return { previous };
    },
    onError: (_err, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['crm-leads', authScopeKey, scopedFilters], context.previous);
      }
      setStatusError('Failed to update branch. Please try again.');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-leads'] });
    },
  });
  const changingBranchId = branchMutation.isPending ? branchMutation.variables?.leadId ?? null : null;

  const { data: statuses = CRM_COLUMN_ORDER } = useQuery({
    queryKey: ['crm-statuses'],
    queryFn: fetchCrmStatuses,
    staleTime: 5 * 60 * 1000,
  });

  const adminVisibleStatuses = statuses ?? CRM_COLUMN_ORDER;
  // Board columns: Archive hidden by default; toggle shows it as 5th column
  const boardColumnStatuses = showArchiveColumn
    ? adminVisibleStatuses
    : adminVisibleStatuses.filter((s) => s !== 'ARCHIVE');

  const { data: centersData } = useQuery({
    queryKey: ['centers', authScopeKey],
    queryFn: () => fetchCenters({ take: 100 }),
    enabled: isAuthReady,
  });
  const { data: teachersData } = useQuery({
    queryKey: ['teachers', authScopeKey, managerCenterId ?? 'all-centers'],
    queryFn: () => fetchTeachers({ take: 200 }),
    enabled: isAuthReady,
  });
  const { data: groupsData } = useQuery({
    queryKey: ['groups', authScopeKey, managerCenterId ?? 'all-centers'],
    queryFn: () =>
      fetchGroups({
        take: 500,
        centerId: managerCenterId,
      }),
    enabled: isAuthReady,
  });

  const leads = leadsData?.items ?? [];
  const countsByStatus = leadsData?.countsByStatus ?? {};
  const centers = centersData?.items ?? [];
  const teachers = teachersData?.items ?? [];
  const groups = groupsData?.items ?? [];

  const openEditLead = (id: string) => {
    setSelectedLeadId(null);
    setEditLeadId(id);
    const url = new URL(window.location.href);
    url.searchParams.set(EDIT_LEAD_PARAM, id);
    window.history.replaceState(null, '', url.pathname + url.search);
  };

  const closeEditLead = () => {
    setEditLeadId(null);
    const url = new URL(window.location.href);
    url.searchParams.delete(EDIT_LEAD_PARAM);
    window.history.replaceState(null, '', url.pathname + (url.search || ''));
  };

  const handleCardClick = (lead: CrmLead) => {
    const isVoiceLead = lead.attachments?.some((a) => a.type === 'VOICE_RECORDING');
    if (isVoiceLead) {
      openEditLead(lead.id);
    } else {
      setSelectedLeadId(lead.id);
    }
  };
  const handleCardStatusChange = (leadId: string, status: CrmLeadStatus) => {
    if (status === 'PAID') {
      setPaidRegLeadId(leadId);
      return;
    }
    statusMutation.mutate({ leadId, status });
  };
  const handleCardBranchChange = (leadId: string, centerId: string | null) => {
    if (!isAdmin) return;
    branchMutation.mutate({ leadId, centerId });
  };
  const handleAddLead = () => setVoiceModalOpen(true);

  const upsertCreatedLeadIntoCaches = (createdLead: CrmLead) => {
    const crmQueries = queryClient.getQueriesData<CrmLeadsResponse>({ queryKey: ['crm-leads'] });

    for (const [queryKey, currentData] of crmQueries) {
      if (!currentData) continue;

      const queryFilters = ((queryKey as unknown[])[1] as CrmLeadFilters | undefined) ?? DEFAULT_FILTERS;
      const skip = queryFilters.skip ?? 0;
      const take = queryFilters.take ?? currentData.items.length;
      const nextCounts = {
        ...currentData.countsByStatus,
        NEW: (currentData.countsByStatus?.NEW ?? 0) + 1,
      };

      let nextItems = currentData.items;
      if (skip === 0 && leadMatchesFilters(createdLead, queryFilters)) {
        const withoutDuplicate = currentData.items.filter((lead) => lead.id !== createdLead.id);
        const sorted = sortLeadsByFilters([createdLead, ...withoutDuplicate], queryFilters);
        nextItems = sorted.slice(0, take);
      }

      queryClient.setQueryData<CrmLeadsResponse>(queryKey, {
        ...currentData,
        items: nextItems,
        total: currentData.total + 1,
        countsByStatus: nextCounts,
      });
    }
  };

  return (
    <DashboardLayout title={t('crm')} subtitle="Lead management">
      <div className="space-y-4">
        {/* View toggle + Filters */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setViewMode('board')}
              className={cn(
                'rounded-lg px-3 py-1.5 text-sm font-medium',
                viewMode === 'board'
                  ? 'bg-primary text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              )}
            >
              Board
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={cn(
                'rounded-lg px-3 py-1.5 text-sm font-medium',
                viewMode === 'list'
                  ? 'bg-primary text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              )}
            >
              List
            </button>
            {viewMode === 'board' && (
              <button
                type="button"
                onClick={() => {
                  const next = !showArchiveColumn;
                  setShowArchiveColumn(next);
                  const url = new URL(window.location.href);
                  if (next) url.searchParams.set(ARCHIVE_PARAM, '1');
                  else url.searchParams.delete(ARCHIVE_PARAM);
                  window.history.replaceState(null, '', url.pathname + url.search || '');
                }}
                className={cn(
                  'rounded-lg p-1.5 text-slate-700 transition-colors hover:bg-slate-200 hover:text-slate-900',
                  showArchiveColumn && 'bg-slate-700 text-white hover:bg-slate-600 hover:text-white'
                )}
                title={showArchiveColumn ? 'Hide Archive column' : 'Show Archive column'}
                aria-label={showArchiveColumn ? 'Hide Archive column' : 'Show Archive column'}
              >
                {showArchiveColumn ? (
                  <Eye className="size-5" strokeWidth={2} aria-hidden />
                ) : (
                  <EyeOff className="size-5" strokeWidth={2} aria-hidden />
                )}
              </button>
            )}
          </div>
        </div>
        <CRMFilters
          filters={filters}
          onFiltersChange={setFilters}
          centers={centers}
          teachers={teachers}
          groups={groups}
        />

        {statusError && (
          <div
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
          >
            {statusError}
          </div>
        )}

        {/* Content */}
        {viewMode === 'board' ? (
          <BoardView
            leads={leads}
            countsByStatus={countsByStatus}
            columnStatuses={boardColumnStatuses}
            availableStatuses={adminVisibleStatuses}
            onCardClick={handleCardClick}
            onCardStatusChange={handleCardStatusChange}
            onCardBranchChange={isAdmin ? handleCardBranchChange : undefined}
            changingStatusId={changingStatusId}
            changingBranchId={isAdmin ? changingBranchId : null}
            onAddLead={handleAddLead}
            onRecordingSaved={() => refetch()}
            branchOptions={isAdmin ? centers.map((c) => ({ id: c.id, name: c.name })) : undefined}
          />
        ) : (
          <ListTable
            leads={leads}
            onRowClick={handleCardClick}
            isLoading={isLoading}
          />
        )}

        {isLoading && viewMode === 'board' && (
          <div
            className="grid gap-4 pb-4 w-full min-w-0"
            style={{ gridTemplateColumns: `repeat(${boardColumnStatuses.length}, minmax(160px, 1fr))` }}
          >
            {boardColumnStatuses.map((s) => (
              <div
                key={s}
                className="min-w-0 w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 animate-pulse"
              >
                <div className="h-6 bg-slate-200 rounded w-24 mb-4" />
                <div className="space-y-2">
                  <div className="h-20 bg-slate-200 rounded" />
                  <div className="h-20 bg-slate-200 rounded" />
                  <div className="h-20 bg-slate-200 rounded" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <LeadDrawer
        leadId={selectedLeadId}
        onClose={() => setSelectedLeadId(null)}
        onUpdated={() => refetch()}
      />
      <EditLeadModal
        open={!!editLeadId}
        leadId={editLeadId}
        onClose={closeEditLead}
        onSaved={() => {
          refetch();
          closeEditLead();
        }}
        centers={centers}
        teachers={teachers}
        groups={groups}
        availableStatuses={adminVisibleStatuses}
      />
      <VoiceLeadModal
        open={voiceModalOpen}
        onClose={() => setVoiceModalOpen(false)}
        centerId={newColumnCenterId}
        onCreated={(createdLead) => {
          upsertCreatedLeadIntoCaches(createdLead);
          queryClient.invalidateQueries({ queryKey: ['crm-leads'] });
          setVoiceModalOpen(false);
        }}
      />
      <PaidRegistrationModal
        open={paidRegLeadId != null}
        leadId={paidRegLeadId}
        onClose={() => setPaidRegLeadId(null)}
        onSuccess={() => {
          setPaidRegLeadId(null);
          void queryClient.invalidateQueries({ queryKey: ['crm-leads'] });
        }}
        centers={centers}
        teachers={teachers}
        groups={groups}
      />
    </DashboardLayout>
  );
}
