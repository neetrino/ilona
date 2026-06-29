'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  changeLeadStatus,
  changeLeadBranch,
  deleteLead,
} from '@/features/crm/api/crm.api';
import type { CrmLeadFilters, CrmLeadStatus, CrmLeadsResponse } from '@/features/crm/types';
import { getErrorMessage } from '@/shared/lib/api';
import {
  EDIT_LEAD_PARAM,
  LEAD_ID_PARAM,
  PAID_REG_LEAD_ID_PARAM,
} from '@/features/crm/crm-page.utils';

interface UseAdminCrmMutationsParams {
  authScopeKey: string;
  scopedFilters: CrmLeadFilters;
  centers: { id: string; name: string }[];
  replaceParams: (params: Record<string, string | null>) => void;
  tCrm: (key: string) => string;
  setStatusError: (error: string | null) => void;
  setDeleteLeadError: (error: string | null) => void;
  setLeadIdPendingDelete: (id: string | null) => void;
  setSelectedLeadId: (updater: (id: string | null) => string | null) => void;
  setEditLeadId: (updater: (id: string | null) => string | null) => void;
  setPaidRegLeadId: (updater: (id: string | null) => string | null) => void;
}

export function useAdminCrmMutations({
  authScopeKey,
  scopedFilters,
  centers,
  replaceParams,
  tCrm,
  setStatusError,
  setDeleteLeadError,
  setLeadIdPendingDelete,
  setSelectedLeadId,
  setEditLeadId,
  setPaidRegLeadId,
}: UseAdminCrmMutationsParams) {
  const queryClient = useQueryClient();

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
      setStatusError(tCrm('failedUpdateStatus'));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-leads'] });
    },
  });

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
      setStatusError(tCrm('failedUpdateBranch'));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-leads'] });
    },
  });

  const deleteLeadMutation = useMutation({
    mutationFn: (leadId: string) => deleteLead(leadId),
    onMutate: async (leadId) => {
      setDeleteLeadError(null);
      await queryClient.cancelQueries({ queryKey: ['crm-leads', authScopeKey, scopedFilters] });
      const previous = queryClient.getQueryData<CrmLeadsResponse>(['crm-leads', authScopeKey, scopedFilters]);
      if (previous?.items) {
        const removed = previous.items.find((l) => l.id === leadId);
        const nextItems = previous.items.filter((l) => l.id !== leadId);
        const counts = { ...previous.countsByStatus } as Partial<Record<CrmLeadStatus, number>>;
        if (removed && counts[removed.status] !== undefined) {
          counts[removed.status] = Math.max(0, (counts[removed.status] ?? 0) - 1);
        }
        queryClient.setQueryData<CrmLeadsResponse>(['crm-leads', authScopeKey, scopedFilters], {
          ...previous,
          items: nextItems,
          total: Math.max(0, previous.total - 1),
          countsByStatus: counts,
        });
      }
      return { previous };
    },
    onError: (err, _leadId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['crm-leads', authScopeKey, scopedFilters], context.previous);
      }
      setDeleteLeadError(getErrorMessage(err, tCrm('failedDeleteLead')));
    },
    onSuccess: (_void, leadId) => {
      setLeadIdPendingDelete(null);
      setSelectedLeadId((id) => (id === leadId ? null : id));
      replaceParams({ [LEAD_ID_PARAM]: null });
      setEditLeadId((id) => {
        if (id !== leadId) return id;
        replaceParams({ [EDIT_LEAD_PARAM]: null });
        return null;
      });
      setPaidRegLeadId((id) => {
        if (id !== leadId) return id;
        replaceParams({ [PAID_REG_LEAD_ID_PARAM]: null });
        return null;
      });
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['crm-leads'] });
    },
  });

  return {
    statusMutation,
    branchMutation,
    deleteLeadMutation,
    changingStatusId: statusMutation.isPending ? statusMutation.variables?.leadId ?? null : null,
    changingBranchId: branchMutation.isPending ? branchMutation.variables?.leadId ?? null : null,
  };
}
