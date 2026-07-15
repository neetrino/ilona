'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useGroup } from '@/features/groups';
import { getErrorMessage } from '@/shared/lib/api';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { getAdminPortalBasePath } from '@/shared/lib/role-routes';
import { useIsLgViewport } from '@/shared/hooks/useIsLgViewport';
import { useIsIPad } from '@/shared/hooks/useIsIPad';
import { useIsIPadPro } from '@/shared/hooks/useIsIPadPro';
import { useGroupsManagement } from '../../hooks/useGroupsManagement';
import { readUrlSearchParam, getLiveSearchParams } from '../../utils/url';
import { ALL_GROUPS_BRANCH, isAllGroupsBranch } from '../../utils/branch-tabs';
import {
  DESKTOP_BOARD_PAGE_SIZE,
  IPAD_BOARD_PAGE_SIZE,
  LIST_PAGE_SIZE,
  MOBILE_BOARD_PAGE_SIZE,
} from './groups-tab.constants';
import type { GroupsTabProps } from './groups-tab.types';

export function useGroupsTab({
  searchQuery,
  page,
  setPage,
  viewMode,
  onViewModeChange,
  updateUrl,
  searchParams,
  urlRevision = 0,
  selectedCenterId = null,
}: GroupsTabProps) {
  const locale = useLocale();
  const t = useTranslations('groups');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const { user } = useAuthStore();
  const portalBasePath = getAdminPortalBasePath(user?.role);
  const isLg = useIsLgViewport();
  const isIPad = useIsIPad();
  const isIPadPro = useIsIPadPro();
  const isCompactIPad = isIPad && !isIPadPro;
  const mobileBoardPageSize = isCompactIPad ? IPAD_BOARD_PAGE_SIZE : MOBILE_BOARD_PAGE_SIZE;

  const [mobileBoardPage, setMobileBoardPage] = useState(0);
  const [desktopBoardPage, setDesktopBoardPage] = useState(0);
  const mobileBoardStartRef = useRef<HTMLDivElement | null>(null);
  const desktopBoardStartRef = useRef<HTMLDivElement | null>(null);
  const [boardTabCenterId, setBoardTabCenterId] = useState<string | null>(null);
  const [statusDialog, setStatusDialog] = useState<{ groupId: string; wasActive: boolean } | null>(null);
  const [statusDialogError, setStatusDialogError] = useState<string | null>(null);
  const isClosingRef = useRef(false);
  const [pendingStudentsGroupId, setPendingStudentsGroupId] = useState<string | null>(null);
  const [pendingStudentId, setPendingStudentId] = useState<string | null>(null);

  useEffect(() => {
    if (selectedCenterId) {
      setBoardTabCenterId(null);
    }
  }, [selectedCenterId]);

  useEffect(() => {
    const branch = readUrlSearchParam('branch', searchParams);
    if (!selectedCenterId) {
      if (isAllGroupsBranch(branch)) {
        setBoardTabCenterId(null);
      } else {
        setBoardTabCenterId(branch);
      }
    }
  }, [searchParams, selectedCenterId, urlRevision]);

  const allGroupsMode =
    !selectedCenterId && isAllGroupsBranch(readUrlSearchParam('branch', searchParams));

  const management = useGroupsManagement(
    viewMode,
    searchQuery,
    page,
    selectedCenterId,
    boardTabCenterId,
    allGroupsMode,
  );

  const {
    groups,
    totalGroups,
    totalPages,
    allCenters,
    drillDownCenter,
    activeCenterId,
    showBoardCenterPicker,
    isLoadingBranchTabs,
    totalGroupsAcrossCenters,
    activeGroups,
    totalStudentsInGroups,
    averageGroupSize,
    isLoading,
    deleteGroup,
    editGroupId,
    setEditGroupId,
    deleteGroupId,
    setDeleteGroupId,
    deleteGroupError,
    handleDeleteClick,
    handleDeleteConfirm,
    toggleGroupActive,
    selectedGroupIds,
    setSelectedGroupIds,
    handleToggleSelectGroup,
    handleSelectAllGroups,
    allGroupsSelected,
    someGroupsSelected,
    isBulkDeleteDialogOpen,
    setIsBulkDeleteDialogOpen,
    bulkDeleteError,
    setBulkDeleteError,
    bulkDeleteSuccess,
    setBulkDeleteSuccess,
    deletedCount,
    handleBulkDeleteGroupsClick,
    handleBulkDeleteGroupsConfirm,
  } = management;

  const openGroupStatusDialog = useCallback((groupId: string, wasActive: boolean) => {
    setStatusDialogError(null);
    setStatusDialog({ groupId, wasActive });
  }, []);

  const closeGroupStatusDialog = (open: boolean) => {
    if (!open) {
      if (toggleGroupActive.isPending) return;
      setStatusDialog(null);
      setStatusDialogError(null);
    }
  };

  const handleConfirmGroupStatus = async (reason?: string) => {
    if (!statusDialog) return;
    setStatusDialogError(null);
    try {
      await toggleGroupActive.mutateAsync({
        id: statusDialog.groupId,
        reason,
      });
      setStatusDialog(null);
    } catch (err: unknown) {
      setStatusDialogError(getErrorMessage(err, t('statusUpdateFailed')));
    }
  };

  const isGroupStatusTogglePending = toggleGroupActive.isPending;

  useEffect(() => {
    if (selectedCenterId || isLoadingBranchTabs) return;
    if (isAllGroupsBranch(readUrlSearchParam('branch', searchParams))) return;
    if (readUrlSearchParam('branch', searchParams) || boardTabCenterId) return;

    const firstCenterId = allCenters[0]?.id;
    if (!firstCenterId) return;

    setBoardTabCenterId(firstCenterId);
    updateUrl({ branch: firstCenterId });
  }, [
    selectedCenterId,
    isLoadingBranchTabs,
    searchParams,
    boardTabCenterId,
    allCenters,
    updateUrl,
    urlRevision,
  ]);

  const activeBranchTabId = allGroupsMode ? null : (selectedCenterId ?? boardTabCenterId);
  const trimmedSearchQuery = searchQuery.trim();
  const isSearchingBranches =
    viewMode === 'board' && !activeCenterId && !allGroupsMode && !!trimmedSearchQuery;
  const isSearchingGroups = !!trimmedSearchQuery && !isSearchingBranches;

  const centersForBranchTabs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q || activeBranchTabId) return allCenters;
    return allCenters.filter((c) => c.name.toLowerCase().includes(q));
  }, [allCenters, searchQuery, activeBranchTabId]);

  const mobileBoardTotalPages = Math.max(1, Math.ceil(groups.length / mobileBoardPageSize));
  const safeMobileBoardPage = Math.min(mobileBoardPage, mobileBoardTotalPages - 1);
  const mobileBoardGroups = useMemo(
    () =>
      groups.slice(
        safeMobileBoardPage * mobileBoardPageSize,
        safeMobileBoardPage * mobileBoardPageSize + mobileBoardPageSize,
      ),
    [groups, safeMobileBoardPage, mobileBoardPageSize],
  );

  const desktopBoardTotalPages = Math.max(1, Math.ceil(groups.length / DESKTOP_BOARD_PAGE_SIZE));
  const safeDesktopBoardPage = Math.min(desktopBoardPage, desktopBoardTotalPages - 1);
  const desktopBoardGroups = useMemo(
    () =>
      groups.slice(
        safeDesktopBoardPage * DESKTOP_BOARD_PAGE_SIZE,
        safeDesktopBoardPage * DESKTOP_BOARD_PAGE_SIZE + DESKTOP_BOARD_PAGE_SIZE,
      ),
    [groups, safeDesktopBoardPage],
  );

  useEffect(() => {
    setMobileBoardPage(0);
  }, [viewMode, activeBranchTabId, searchQuery, groups.length]);

  useEffect(() => {
    setDesktopBoardPage(0);
  }, [viewMode, activeBranchTabId, searchQuery, groups.length]);

  const goToMobileBoardPage = (nextPage: number) => {
    setMobileBoardPage(nextPage);
    requestAnimationFrame(() => {
      mobileBoardStartRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const goToDesktopBoardPage = (nextPage: number) => {
    setDesktopBoardPage(nextPage);
    requestAnimationFrame(() => {
      desktopBoardStartRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const handleBranchTabClick = (centerId: string) => {
    setPage(0);
    setSelectedGroupIds(new Set());
    if (selectedCenterId) {
      const next = getLiveSearchParams(searchParams);
      next.delete('view');
      router.push(`/${locale}${portalBasePath}/groups/${centerId}?${next.toString()}`);
    } else {
      setBoardTabCenterId(centerId);
      updateUrl({ branch: centerId });
    }
  };

  const handleTotalGroupsClick = () => {
    setPage(0);
    setSelectedGroupIds(new Set());
    setMobileBoardPage(0);
    setDesktopBoardPage(0);
    if (selectedCenterId) {
      const next = getLiveSearchParams(searchParams);
      next.set('branch', ALL_GROUPS_BRANCH);
      router.push(`/${locale}${portalBasePath}/groups?${next.toString()}`);
      return;
    }
    setBoardTabCenterId(null);
    updateUrl({ branch: ALL_GROUPS_BRANCH });
    requestAnimationFrame(() => {
      mobileBoardStartRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      desktopBoardStartRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  useEffect(() => {
    if (isClosingRef.current) return;

    const editGroupFromUrl = readUrlSearchParam('editGroup', searchParams);
    if (editGroupFromUrl) {
      setEditGroupId(editGroupFromUrl);
      return;
    }

    setEditGroupId(null);
  }, [searchParams, urlRevision, setEditGroupId]);

  const handleEditGroupIdChange = useCallback(
    (id: string | null) => {
      if (id === null) {
        isClosingRef.current = true;
        setEditGroupId(null);
        updateUrl({ editGroup: null });
        setTimeout(() => {
          isClosingRef.current = false;
        }, 100);
      } else {
        isClosingRef.current = false;
        setEditGroupId(id);
        updateUrl({ editGroup: id });
      }
    },
    [setEditGroupId, updateUrl],
  );

  const isAddGroupOpen = readUrlSearchParam('modal', searchParams) === 'add-group';

  const handleCreateGroupOpenChange = (open: boolean) => {
    if (!open) {
      updateUrl({ modal: null }, { mode: 'replace' });
      return;
    }
    updateUrl({ modal: 'add-group' }, { mode: 'push' });
  };

  useEffect(() => {
    if (isLg === false && viewMode !== 'board') {
      onViewModeChange('board');
      setPage(0);
      setSelectedGroupIds(new Set());
    }
  }, [isLg, onViewModeChange, setPage, setSelectedGroupIds, viewMode]);

  const studentsGroupId =
    pendingStudentsGroupId ?? readUrlSearchParam('studentsGroup', searchParams);
  const selectedStudentId = pendingStudentId ?? readUrlSearchParam('studentId', searchParams);

  useEffect(() => {
    if (pendingStudentsGroupId !== null) {
      const fromUrl = readUrlSearchParam('studentsGroup', searchParams);
      if (fromUrl === pendingStudentsGroupId || (!fromUrl && pendingStudentsGroupId === '')) {
        setPendingStudentsGroupId(null);
      }
    }
    if (pendingStudentId !== null) {
      const fromUrl = readUrlSearchParam('studentId', searchParams);
      if (fromUrl === pendingStudentId || (!fromUrl && pendingStudentId === '')) {
        setPendingStudentId(null);
      }
    }
  }, [pendingStudentId, pendingStudentsGroupId, searchParams, urlRevision]);

  const { data: studentsGroupData } = useGroup(studentsGroupId ?? '', !!studentsGroupId);
  const studentsModalGroupName =
    groups.find((g) => g.id === studentsGroupId)?.name ??
    studentsGroupData?.name ??
    t('groupFallback');

  const openStudentsModal = useCallback(
    (groupId: string) => {
      setPendingStudentsGroupId(groupId);
      setPendingStudentId('');
      updateUrl({ studentsGroup: groupId, studentId: null });
    },
    [updateUrl],
  );

  const openStudentDetails = (studentId: string) => {
    setPendingStudentId(studentId);
    updateUrl({ studentId });
  };

  const openStudentFromGroupCard = (studentId: string) => {
    setPendingStudentsGroupId('');
    setPendingStudentId(studentId);
    updateUrl({ studentsGroup: null, studentId });
  };

  const closeStudentDetails = () => {
    setPendingStudentId('');
    updateUrl({ studentId: null });
  };

  const closeStudentsModal = () => {
    setPendingStudentsGroupId('');
    setPendingStudentId('');
    updateUrl({ studentsGroup: null, studentId: null });
  };

  const handleViewModeChange = (mode: 'list' | 'board') => {
    if (mode === viewMode) return;

    setPage(0);
    setSelectedGroupIds(new Set());

    if (mode === 'list') {
      onViewModeChange('list');
      return;
    }

    const branchParam = readUrlSearchParam('branch', searchParams);
    const nextBoardCenterId = isAllGroupsBranch(branchParam)
      ? null
      : selectedCenterId ?? branchParam ?? boardTabCenterId ?? allCenters[0]?.id ?? null;

    if (!selectedCenterId) {
      setBoardTabCenterId(nextBoardCenterId);
    }

    onViewModeChange('board', {
      branch: selectedCenterId
        ? null
        : isAllGroupsBranch(branchParam)
          ? ALL_GROUPS_BRANCH
          : nextBoardCenterId,
    });
  };

  return {
    t,
    tCommon,
    locale,
    portalBasePath,
    isLg,
    isCompactIPad,
    viewMode,
    searchQuery,
    page,
    setPage,
    selectedCenterId,
    allGroupsMode,
    groups,
    totalGroups,
    totalPages,
    allCenters,
    drillDownCenter,
    activeCenterId,
    showBoardCenterPicker,
    isLoadingBranchTabs,
    totalGroupsAcrossCenters,
    activeGroups,
    totalStudentsInGroups,
    averageGroupSize,
    isLoading,
    deleteGroup,
    editGroupId,
    deleteGroupId,
    setDeleteGroupId,
    deleteGroupError,
    handleDeleteClick,
    handleDeleteConfirm,
    toggleGroupActive,
    selectedGroupIds,
    setSelectedGroupIds,
    handleToggleSelectGroup,
    handleSelectAllGroups,
    allGroupsSelected,
    someGroupsSelected,
    isBulkDeleteDialogOpen,
    setIsBulkDeleteDialogOpen,
    bulkDeleteError,
    setBulkDeleteError,
    bulkDeleteSuccess,
    setBulkDeleteSuccess,
    deletedCount,
    handleBulkDeleteGroupsClick,
    handleBulkDeleteGroupsConfirm,
    activeBranchTabId,
    isSearchingBranches,
    isSearchingGroups,
    centersForBranchTabs,
    mobileBoardStartRef,
    desktopBoardStartRef,
    mobileBoardGroups,
    desktopBoardGroups,
    mobileBoardPageSize,
    safeMobileBoardPage,
    safeDesktopBoardPage,
    mobileBoardTotalPages,
    desktopBoardTotalPages,
    goToMobileBoardPage,
    goToDesktopBoardPage,
    handleBranchTabClick,
    handleTotalGroupsClick,
    handleEditGroupIdChange,
    handleCreateGroupOpenChange,
    isAddGroupOpen,
    statusDialog,
    statusDialogError,
    closeGroupStatusDialog,
    handleConfirmGroupStatus,
    isGroupStatusTogglePending,
    openGroupStatusDialog,
    openStudentsModal,
    openStudentDetails,
    openStudentFromGroupCard,
    closeStudentDetails,
    closeStudentsModal,
    studentsGroupId,
    selectedStudentId,
    studentsModalGroupName,
    handleViewModeChange,
    pageSize: LIST_PAGE_SIZE,
  };
}

export type GroupsTabState = ReturnType<typeof useGroupsTab>;
