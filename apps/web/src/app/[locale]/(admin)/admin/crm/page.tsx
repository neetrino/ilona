'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';
import { fetchLeads, changeLeadStatus } from '@/features/crm/api/crm.api';
import { fetchCenters } from '@/features/centers/api/centers.api';
import { fetchTeachers } from '@/features/teachers/api/teachers.api';
import { fetchGroups } from '@/features/groups/api/groups.api';
import type { CrmLead, CrmLeadFilters, CrmLeadStatus } from '@/features/crm/types';
import {
  BoardView,
  ListTable,
  LeadDrawer,
  VoiceLeadModal,
  VoiceLeadDetailModal,
  EditLeadModal,
  CRMFilters,
} from '@/features/crm/components';
import { cn } from '@/shared/lib/utils';

const DEFAULT_FILTERS: CrmLeadFilters = {
  skip: 0,
  take: 100,
  sortBy: 'createdAt',
  sortOrder: 'desc',
};

const VOICE_LEAD_PARAM = 'voiceLead';

export default function AdminCrmPage() {
  const t = useTranslations('nav');
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState<CrmLeadFilters>(DEFAULT_FILTERS);
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board');
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [voiceLeadId, setVoiceLeadId] = useState<string | null>(null);
  const [voiceModalOpen, setVoiceModalOpen] = useState(false);
  const [editLeadId, setEditLeadId] = useState<string | null>(null);

  // Restore voice lead popup from URL after refresh
  useEffect(() => {
    const id = searchParams.get(VOICE_LEAD_PARAM);
    if (id) setVoiceLeadId(id);
  }, [searchParams]);

  const queryClient = useQueryClient();
  const { data: leadsData, isLoading, refetch } = useQuery({
    queryKey: ['crm-leads', filters],
    queryFn: () => fetchLeads(filters),
  });

  const statusMutation = useMutation({
    mutationFn: ({ leadId, status }: { leadId: string; status: CrmLeadStatus }) =>
      changeLeadStatus(leadId, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-leads'] });
    },
  });
  const changingStatusId = statusMutation.isPending ? statusMutation.variables?.leadId ?? null : null;

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
    queryFn: () => fetchGroups({ take: 200 }),
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
          </div>
        </div>
        <CRMFilters
          filters={filters}
          onFiltersChange={setFilters}
          centers={centers}
          teachers={teachers}
          groups={groups}
        />

        {/* Content */}
        {viewMode === 'board' ? (
          <BoardView
            leads={leads}
            countsByStatus={countsByStatus}
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
          <div className="flex gap-4 overflow-x-auto pb-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="flex-shrink-0 w-72 rounded-xl border border-slate-200 bg-slate-50/50 p-3 animate-pulse"
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
