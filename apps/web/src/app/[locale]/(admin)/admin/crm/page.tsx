'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';
import { fetchLeads, changeLeadStatus, fetchCrmStatuses } from '@/features/crm/api/crm.api';
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
  VoiceLeadDetailModal,
  EditLeadModal,
  CRMFilters,
} from '@/features/crm/components';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

const DEFAULT_FILTERS: CrmLeadFilters = {
  skip: 0,
  take: 100,
  sortBy: 'updatedAt',
  sortOrder: 'desc',
};

const VOICE_LEAD_PARAM = 'voiceLead';
const ARCHIVE_PARAM = 'archive';

export default function AdminCrmPage() {
  const t = useTranslations('nav');
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState<CrmLeadFilters>(DEFAULT_FILTERS);
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board');
  const [showArchiveColumn, setShowArchiveColumn] = useState(
    () => searchParams.get(ARCHIVE_PARAM) === '1'
  );
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [voiceLeadId, setVoiceLeadId] = useState<string | null>(null);
  const [voiceModalOpen, setVoiceModalOpen] = useState(false);
  const [editLeadId, setEditLeadId] = useState<string | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);

  // Restore voice lead popup from URL after refresh
  useEffect(() => {
    const id = searchParams.get(VOICE_LEAD_PARAM);
    if (id) setVoiceLeadId(id);
  }, [searchParams]);

  // Restore Archive column visibility from URL after refresh
  useEffect(() => {
    setShowArchiveColumn(searchParams.get(ARCHIVE_PARAM) === '1');
  }, [searchParams]);

  const queryClient = useQueryClient();
  const { data: leadsData, isLoading, refetch } = useQuery({
    queryKey: ['crm-leads', filters],
    queryFn: () => fetchLeads(filters),
  });

  const statusMutation = useMutation({
    mutationFn: ({ leadId, status }: { leadId: string; status: CrmLeadStatus }) =>
      changeLeadStatus(leadId, { status }),
    onMutate: async ({ leadId, status }) => {
      setStatusError(null);
      await queryClient.cancelQueries({ queryKey: ['crm-leads', filters] });
      const previous = queryClient.getQueryData<CrmLeadsResponse>(['crm-leads', filters]);
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
        queryClient.setQueryData<CrmLeadsResponse>(['crm-leads', filters], {
          ...previous,
          items: updatedLead ? [updatedLead, ...restItems] : previous.items,
          countsByStatus: counts,
        });
      }
      return { previous };
    },
    onError: (_err, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['crm-leads', filters], context.previous);
      }
      setStatusError('Failed to update status. Please try again.');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-leads'] });
    },
  });
  const changingStatusId = statusMutation.isPending ? statusMutation.variables?.leadId ?? null : null;

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
    queryKey: ['centers'],
    queryFn: () => fetchCenters({ take: 100 }),
  });
  const { data: teachersData } = useQuery({
    queryKey: ['teachers'],
    queryFn: () => fetchTeachers({ take: 200 }),
  });
  const { data: groupsData } = useQuery({
    queryKey: ['groups'],
    queryFn: () => fetchGroups({ take: 500 }),
  });

  const leads = leadsData?.items ?? [];
  const countsByStatus = leadsData?.countsByStatus ?? {};
  const centers = centersData?.items ?? [];
  const teachers = teachersData?.items ?? [];
  const groups = groupsData?.items ?? [];

  const openVoiceLead = (id: string) => {
    setVoiceLeadId(id);
    setSelectedLeadId(null);
    const url = new URL(window.location.href);
    url.searchParams.set(VOICE_LEAD_PARAM, id);
    window.history.replaceState(null, '', url.pathname + url.search);
  };

  const closeVoiceLead = () => {
    setVoiceLeadId(null);
    const url = new URL(window.location.href);
    url.searchParams.delete(VOICE_LEAD_PARAM);
    window.history.replaceState(null, '', url.pathname + (url.search || ''));
  };

  const handleCardClick = (lead: CrmLead) => {
    const isVoiceLead = lead.attachments?.some((a) => a.type === 'VOICE_RECORDING');
    if (isVoiceLead) {
      openVoiceLead(lead.id);
    } else {
      setSelectedLeadId(lead.id);
      setVoiceLeadId(null);
    }
  };
  const handleCardEdit = (lead: CrmLead) => {
    setEditLeadId(lead.id);
  };
  const handleCardStatusChange = (leadId: string, status: CrmLeadStatus) => {
    statusMutation.mutate({ leadId, status });
  };
  const handleAddLead = () => setVoiceModalOpen(true);

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
            onCardEdit={handleCardEdit}
            onCardStatusChange={handleCardStatusChange}
            changingStatusId={changingStatusId}
            onAddLead={handleAddLead}
            onRecordingSaved={() => refetch()}
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
      <VoiceLeadDetailModal
        leadId={voiceLeadId}
        open={!!voiceLeadId}
        onClose={closeVoiceLead}
        onUpdated={() => refetch()}
        centers={centers}
        teachers={teachers}
        groups={groups}
      />
      <EditLeadModal
        open={!!editLeadId}
        leadId={editLeadId}
        onClose={() => setEditLeadId(null)}
        onSaved={() => {
          refetch();
          setEditLeadId(null);
        }}
        centers={centers}
        teachers={teachers}
        groups={groups}
        availableStatuses={adminVisibleStatuses}
      />
      <VoiceLeadModal
        open={voiceModalOpen}
        onClose={() => setVoiceModalOpen(false)}
        onCreated={() => {
          refetch();
          setVoiceModalOpen(false);
        }}
      />
    </DashboardLayout>
  );
}
