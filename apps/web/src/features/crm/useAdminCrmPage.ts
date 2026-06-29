'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchLeads,
  fetchCrmStatuses,
} from '@/features/crm/api/crm.api';
import { fetchCenters } from '@/features/centers/api/centers.api';
import { fetchTeachers } from '@/features/teachers/api/teachers.api';
import { fetchGroups } from '@/features/groups/api/groups.api';
import type { CrmLead, CrmLeadFilters, CrmLeadStatus, CrmLeadsResponse } from '@/features/crm/types';
import { CRM_COLUMN_ORDER } from '@/features/crm/types';
import { isPortalMobileViewport } from '@/shared/lib/role-routes';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { useIsLgViewport } from '@/shared/hooks/useIsLgViewport';
import { readUrlSearchParam } from '@/shared/lib/url-search-params';
import { useAppSearchUrl } from '@/shared/hooks/useAppSearchUrl';
import {
  DEFAULT_FILTERS,
  ARCHIVE_PARAM,
  EDIT_LEAD_PARAM,
  LEAD_ID_PARAM,
  CREATE_LEAD_PARAM,
  VOICE_LEAD_PARAM,
  PAID_REG_LEAD_ID_PARAM,
  VIEW_PARAM,
  CRM_LIST_PAGE_SIZE,
  leadMatchesFilters,
  sortLeadsByFilters,
} from '@/features/crm/crm-page.utils';
import type { AdminCrmPageContentProps } from '@/features/crm/AdminCrmPageContent';
import { useAdminCrmMutations } from '@/features/crm/useAdminCrmMutations';

export function useAdminCrmPage(): {
  t: ReturnType<typeof useTranslations<'nav'>>;
  tCrm: ReturnType<typeof useTranslations<'crm'>>;
  contentProps: AdminCrmPageContentProps;
} {
  const { searchParams, urlRevision, replaceParams } = useAppSearchUrl();
  const t = useTranslations('nav');
  const tCrm = useTranslations('crm');
  const user = useAuthStore((state) => state.user);
  const userRole = user?.role;
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const hasAccessToken = useAuthStore((state) => Boolean(state.tokens?.accessToken));
  const isAdmin = userRole === 'ADMIN';
  const managerCenterId = userRole === 'MANAGER' ? user?.managerCenterId ?? undefined : undefined;
  const isAuthReady = isHydrated && isAuthenticated && hasAccessToken && !!user?.id;
  const authScopeKey = `${userRole ?? 'UNKNOWN'}:${user?.id ?? 'anonymous'}:${managerCenterId ?? 'all-centers'}`;
  const isLg = useIsLgViewport();

  const readCrmViewMode = useCallback((): 'board' | 'list' => {
    const mode = readUrlSearchParam(VIEW_PARAM, searchParams, urlRevision);
    if (mode === 'list' || mode === 'board') {
      return mode;
    }
    return 'board';
  }, [searchParams, urlRevision]);

  const [filters, setFilters] = useState<CrmLeadFilters>(DEFAULT_FILTERS);
  const [listPage, setListPage] = useState(0);
  const [pendingViewMode, setPendingViewMode] = useState<'board' | 'list' | null>(null);
  const viewMode = pendingViewMode ?? readCrmViewMode();

  useEffect(() => {
    if (pendingViewMode === null) {
      return;
    }
    if (readCrmViewMode() === pendingViewMode) {
      setPendingViewMode(null);
    }
  }, [pendingViewMode, readCrmViewMode]);

  const [showArchiveColumn, setShowArchiveColumn] = useState(
    () => readUrlSearchParam(ARCHIVE_PARAM, searchParams) === '1',
  );
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(
    () => readUrlSearchParam(LEAD_ID_PARAM, searchParams),
  );
  const isLeadDrawerClosingRef = useRef(false);
  const [voiceModalOpen, setVoiceModalOpen] = useState(
    () => readUrlSearchParam(VOICE_LEAD_PARAM, searchParams) === '1',
  );
  const isVoiceModalClosingRef = useRef(false);
  const [createLeadModalOpen, setCreateLeadModalOpen] = useState(
    () => readUrlSearchParam(CREATE_LEAD_PARAM, searchParams) === '1',
  );
  const isCreateLeadClosingRef = useRef(false);
  const [editLeadId, setEditLeadId] = useState<string | null>(
    () => readUrlSearchParam(EDIT_LEAD_PARAM, searchParams),
  );
  const isEditLeadClosingRef = useRef(false);
  const [paidRegLeadId, setPaidRegLeadId] = useState<string | null>(
    () => readUrlSearchParam(PAID_REG_LEAD_ID_PARAM, searchParams),
  );
  const isPaidRegClosingRef = useRef(false);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [leadIdPendingDelete, setLeadIdPendingDelete] = useState<string | null>(null);
  const [deleteLeadError, setDeleteLeadError] = useState<string | null>(null);

  useEffect(() => {
    setShowArchiveColumn(readUrlSearchParam(ARCHIVE_PARAM, searchParams, urlRevision) === '1');
  }, [searchParams, urlRevision]);

  useEffect(() => {
    if (isLeadDrawerClosingRef.current) {
      return;
    }
    setSelectedLeadId(readUrlSearchParam(LEAD_ID_PARAM, searchParams, urlRevision));
  }, [searchParams, urlRevision]);

  useEffect(() => {
    if (isEditLeadClosingRef.current) {
      return;
    }
    setEditLeadId(readUrlSearchParam(EDIT_LEAD_PARAM, searchParams, urlRevision));
  }, [searchParams, urlRevision]);

  useEffect(() => {
    if (isVoiceModalClosingRef.current) {
      return;
    }
    setVoiceModalOpen(readUrlSearchParam(VOICE_LEAD_PARAM, searchParams, urlRevision) === '1');
  }, [searchParams, urlRevision]);

  useEffect(() => {
    if (isCreateLeadClosingRef.current) {
      return;
    }
    setCreateLeadModalOpen(readUrlSearchParam(CREATE_LEAD_PARAM, searchParams, urlRevision) === '1');
  }, [searchParams, urlRevision]);

  useEffect(() => {
    if (isPaidRegClosingRef.current) {
      return;
    }
    setPaidRegLeadId(readUrlSearchParam(PAID_REG_LEAD_ID_PARAM, searchParams, urlRevision));
  }, [searchParams, urlRevision]);

  const updateViewModeInUrl = useCallback(
    (mode: 'board' | 'list') => {
      setPendingViewMode(mode);
      replaceParams({ view: mode });
    },
    [replaceParams],
  );

  useEffect(() => {
    if (isLg !== false) {
      return;
    }
    const modeFromUrl = readUrlSearchParam(VIEW_PARAM, searchParams, urlRevision);
    if (modeFromUrl === 'list' || modeFromUrl === 'board') {
      return;
    }
    setPendingViewMode('board');
    replaceParams({ view: 'board' });
  }, [isLg, searchParams, urlRevision, replaceParams]);

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

  const { data: centersData } = useQuery({
    queryKey: ['centers', authScopeKey],
    queryFn: () => fetchCenters({ take: 100 }),
    enabled: isAuthReady,
  });
  const centers = centersData?.items ?? [];

  const {
    statusMutation,
    branchMutation,
    deleteLeadMutation,
    changingStatusId,
    changingBranchId,
  } = useAdminCrmMutations({
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
  });

  const { data: statuses = CRM_COLUMN_ORDER } = useQuery({
    queryKey: ['crm-statuses'],
    queryFn: fetchCrmStatuses,
    staleTime: 5 * 60 * 1000,
  });

  const adminVisibleStatuses = statuses ?? CRM_COLUMN_ORDER;
  const boardColumnStatuses = showArchiveColumn
    ? adminVisibleStatuses
    : adminVisibleStatuses.filter((s) => s !== 'ARCHIVE');

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

  const leads = useMemo(() => leadsData?.items ?? [], [leadsData?.items]);
  const countsByStatus = leadsData?.countsByStatus ?? {};
  const managerCenterName =
    userRole === 'MANAGER' && managerCenterId
      ? centers.find((c) => c.id === managerCenterId)?.name
      : undefined;
  const teachers = teachersData?.items ?? [];
  const groups = groupsData?.items ?? [];
  const totalListPages = Math.max(1, Math.ceil(leads.length / CRM_LIST_PAGE_SIZE));
  const safeListPage = Math.min(Math.max(0, listPage), totalListPages - 1);
  const paginatedListLeads = useMemo(() => {
    const startIndex = safeListPage * CRM_LIST_PAGE_SIZE;
    return leads.slice(startIndex, startIndex + CRM_LIST_PAGE_SIZE);
  }, [leads, safeListPage]);

  useEffect(() => {
    if (viewMode !== 'list') {
      return;
    }
    if (listPage >= totalListPages) {
      setListPage(Math.max(0, totalListPages - 1));
    }
  }, [listPage, totalListPages, viewMode]);

  useEffect(() => {
    setListPage(0);
  }, [filters, viewMode]);

  const openEditLead = (id: string) => {
    setSelectedLeadId(null);
    setEditLeadId(id);
    replaceParams({ [LEAD_ID_PARAM]: null, [EDIT_LEAD_PARAM]: id });
  };

  const closeEditLead = () => {
    isEditLeadClosingRef.current = true;
    setEditLeadId(null);
    replaceParams({ [EDIT_LEAD_PARAM]: null });
    setTimeout(() => {
      isEditLeadClosingRef.current = false;
    }, 100);
  };

  const closeLeadDrawer = () => {
    isLeadDrawerClosingRef.current = true;
    setSelectedLeadId(null);
    replaceParams({ [LEAD_ID_PARAM]: null });
    setTimeout(() => {
      isLeadDrawerClosingRef.current = false;
    }, 100);
  };

  const closeVoiceModal = () => {
    isVoiceModalClosingRef.current = true;
    setVoiceModalOpen(false);
    replaceParams({ [VOICE_LEAD_PARAM]: null });
    setTimeout(() => {
      isVoiceModalClosingRef.current = false;
    }, 100);
  };

  const closeCreateLeadModal = () => {
    isCreateLeadClosingRef.current = true;
    setCreateLeadModalOpen(false);
    replaceParams({ [CREATE_LEAD_PARAM]: null });
    setTimeout(() => {
      isCreateLeadClosingRef.current = false;
    }, 100);
  };

  const closePaidRegModal = () => {
    isPaidRegClosingRef.current = true;
    setPaidRegLeadId(null);
    replaceParams({ [PAID_REG_LEAD_ID_PARAM]: null });
    setTimeout(() => {
      isPaidRegClosingRef.current = false;
    }, 100);
  };

  const handleCardClick = (lead: CrmLead) => {
    const isVoiceLead = lead.attachments?.some((a) => a.type === 'VOICE_RECORDING');
    if (isVoiceLead || isPortalMobileViewport()) {
      openEditLead(lead.id);
      return;
    }
    setSelectedLeadId(lead.id);
    replaceParams({ [LEAD_ID_PARAM]: lead.id, [EDIT_LEAD_PARAM]: null });
  };

  const handleCardStatusChange = (leadId: string, status: CrmLeadStatus) => {
    if (status === 'PAID') {
      setPaidRegLeadId(leadId);
      replaceParams({ [PAID_REG_LEAD_ID_PARAM]: leadId });
      return;
    }
    statusMutation.mutate({ leadId, status });
  };

  const handleCardBranchChange = (leadId: string, centerId: string | null) => {
    if (!isAdmin) return;
    branchMutation.mutate({ leadId, centerId });
  };

  const handleNewLeadFromBoard = () => {
    if (isAdmin) {
      setVoiceModalOpen(true);
      replaceParams({ [VOICE_LEAD_PARAM]: '1' });
    } else {
      setCreateLeadModalOpen(true);
      replaceParams({ [CREATE_LEAD_PARAM]: '1' });
    }
  };

  const handleLeadDeleteRequest = (lead: CrmLead) => {
    if (!isAdmin) return;
    setDeleteLeadError(null);
    setLeadIdPendingDelete(lead.id);
  };

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

  return {
    t,
    tCrm,
    contentProps: {
      tCrm,
      isLg: isLg ?? false,
      viewMode,
      updateViewModeInUrl,
      showArchiveColumn,
      setShowArchiveColumn,
      replaceParams,
      filters,
      setFilters,
      centers,
      teachers,
      groups,
      statusError,
      leads,
      countsByStatus,
      boardColumnStatuses,
      adminVisibleStatuses,
      handleCardClick,
      handleCardStatusChange,
      handleCardBranchChange,
      changingStatusId,
      changingBranchId,
      handleNewLeadFromBoard,
      isAdmin,
      paginatedListLeads,
      isLoading,
      deleteInProgress: deleteLeadMutation.isPending,
      safeListPage,
      totalListPages,
      setListPage,
      selectedLeadId,
      closeLeadDrawer,
      refetch: () => {
        void refetch();
      },
      editLeadId,
      closeEditLead,
      onEditLeadSaved: () => {
        void refetch();
        closeEditLead();
      },
      handleLeadDeleteRequest,
      voiceModalOpen,
      closeVoiceModal,
      onVoiceLeadCreated: (createdLead) => {
        upsertCreatedLeadIntoCaches(createdLead);
        void queryClient.invalidateQueries({ queryKey: ['crm-leads'] });
        closeVoiceModal();
      },
      createLeadModalOpen,
      closeCreateLeadModal,
      onCreateLeadCreated: (createdLead) => {
        upsertCreatedLeadIntoCaches(createdLead);
        void queryClient.invalidateQueries({ queryKey: ['crm-leads'] });
        closeCreateLeadModal();
      },
      managerCenterId,
      managerCenterName,
      paidRegLeadId,
      closePaidRegModal,
      onPaidRegSuccess: () => {
        closePaidRegModal();
        void queryClient.invalidateQueries({ queryKey: ['crm-leads'] });
      },
      leadIdPendingDelete,
      onDeleteDialogOpenChange: (open) => {
        if (!open && !deleteLeadMutation.isPending) {
          setLeadIdPendingDelete(null);
          setDeleteLeadError(null);
        }
      },
      onConfirmDelete: () => {
        if (leadIdPendingDelete) {
          deleteLeadMutation.mutate(leadIdPendingDelete);
        }
      },
      deleteLeadError,
    },
  };
}
