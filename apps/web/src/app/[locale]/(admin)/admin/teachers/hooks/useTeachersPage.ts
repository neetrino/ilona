'use client';

import { useState, useEffect, useMemo, useCallback, useRef, startTransition } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { 
  useTeachers, 
  useDeleteTeacher,
  useDeleteTeachers,
  useUpdateTeacher,
  type Teacher 
} from '@/features/teachers';
import { useCenters } from '@/features/centers';
import { getErrorMessage } from '@/shared/lib/api';
import { readUrlSearchParam } from '@/shared/lib/url-search-params';
import { useAppSearchUrl } from '@/shared/hooks/useAppSearchUrl';
import { countUniqueTeachers, filterTeachersByBranches, groupTeachersByCenter } from '../utils';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { getAdminPortalBasePath } from '@/shared/lib/role-routes';

type ViewMode = 'list' | 'board';

const PAGE_SIZE = 10;

/** Query flag so "Add teacher" dialog survives full page refresh (same pattern as `teacherId`). */
const ADD_TEACHER_URL_PARAM = 'addTeacher';
const ADD_TEACHER_URL_VALUE = '1';

/** Teacher id in query so Edit dialog survives refresh (same idea as `teacherId` for details). */
const EDIT_TEACHER_URL_PARAM = 'editTeacherId';

export function useTeachersPage() {
  const params = useParams();
  const router = useRouter();
  const { searchParams, urlRevision, replaceParams } = useAppSearchUrl();
  const locale = params.locale as string;
  const t = useTranslations('teachers');
  const tCommon = useTranslations('common');
  const tStatus = useTranslations('status');
  const { user } = useAuthStore();
  const portalBasePath = getAdminPortalBasePath(user?.role);
  const managerCenterId = user?.role === 'MANAGER' ? user.managerCenterId : undefined;

  const readViewModeFromUrl = useCallback((): ViewMode => {
    const mode = readUrlSearchParam('view', searchParams, urlRevision);
    if (mode === 'list' || mode === 'board') {
      return mode;
    }
    return 'list';
  }, [searchParams, urlRevision]);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  
  // Pagination state
  const [page, setPage] = useState(0);
  
  // Sorting state
  const [sortBy, setSortBy] = useState<string | undefined>(undefined);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  // Modal/Dialog states
  const [teacherIdPendingDelete, setTeacherIdPendingDelete] = useState<string | null>(null);
  const [teacherPendingDeleteLabel, setTeacherPendingDeleteLabel] = useState<string | null>(null);
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  
  // Selection state
  const [selectedTeacherIds, setSelectedTeacherIds] = useState<Set<string>>(new Set());
  
  // Messages state
  const [deletedCount, setDeletedCount] = useState<number>(0);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const [bulkDeleteError, setBulkDeleteError] = useState<string | null>(null);
  const [bulkDeleteSuccess, setBulkDeleteSuccess] = useState(false);
  const [deactivateError, setDeactivateError] = useState<string | null>(null);
  const [deactivateSuccess, setDeactivateSuccess] = useState(false);
  
  // Filter states
  const [selectedBranchIds, setSelectedBranchIds] = useState<Set<string>>(new Set());
  const [selectedStatus, setSelectedStatus] = useState<'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | ''>(() => {
    const statusFromUrl = readUrlSearchParam('status', searchParams);
    return (statusFromUrl === 'ACTIVE' || statusFromUrl === 'INACTIVE' || statusFromUrl === 'SUSPENDED') ? statusFromUrl : '';
  });
  
  const [pendingViewMode, setPendingViewMode] = useState<ViewMode | null>(null);
  const viewMode = pendingViewMode ?? readViewModeFromUrl();

  useEffect(() => {
    if (pendingViewMode === null) {
      return;
    }
    if (readViewModeFromUrl() === pendingViewMode) {
      setPendingViewMode(null);
    }
  }, [pendingViewMode, readViewModeFromUrl]);

  const selectedTeacherIdForDetails = readUrlSearchParam('teacherId', searchParams);
  const isDetailsDrawerOpen = Boolean(selectedTeacherIdForDetails);

  const [isAddTeacherOpen, setIsAddTeacherOpenState] = useState(
    () => readUrlSearchParam(ADD_TEACHER_URL_PARAM, searchParams) === ADD_TEACHER_URL_VALUE,
  );
  const isAddTeacherClosingRef = useRef(false);

  useEffect(() => {
    if (isAddTeacherClosingRef.current) {
      return;
    }
    const shouldOpen = readUrlSearchParam(ADD_TEACHER_URL_PARAM, searchParams) === ADD_TEACHER_URL_VALUE;
    setIsAddTeacherOpenState(shouldOpen);
  }, [searchParams, urlRevision]);

  const [selectedTeacherIdForEdit, setSelectedTeacherIdForEdit] = useState<string | null>(
    () => readUrlSearchParam(EDIT_TEACHER_URL_PARAM, searchParams),
  );
  const isEditTeacherClosingRef = useRef(false);
  const isEditTeacherOpen = Boolean(selectedTeacherIdForEdit);

  useEffect(() => {
    if (isEditTeacherClosingRef.current) {
      return;
    }
    setSelectedTeacherIdForEdit(readUrlSearchParam(EDIT_TEACHER_URL_PARAM, searchParams));
  }, [searchParams, urlRevision]);

  const setIsAddTeacherOpen = useCallback(
    (open: boolean) => {
      if (open) {
        isAddTeacherClosingRef.current = false;
        setIsAddTeacherOpenState(true);
        replaceParams({
          [ADD_TEACHER_URL_PARAM]: ADD_TEACHER_URL_VALUE,
          teacherId: null,
          [EDIT_TEACHER_URL_PARAM]: null,
        });
      } else {
        isAddTeacherClosingRef.current = true;
        setIsAddTeacherOpenState(false);
        replaceParams({ [ADD_TEACHER_URL_PARAM]: null });
        setTimeout(() => {
          isAddTeacherClosingRef.current = false;
        }, 100);
      }
    },
    [replaceParams],
  );

  const setIsEditTeacherOpen = useCallback(
    (open: boolean) => {
      if (!open) {
        isEditTeacherClosingRef.current = true;
        setSelectedTeacherIdForEdit(null);
        replaceParams({ [EDIT_TEACHER_URL_PARAM]: null });
        setTimeout(() => {
          isEditTeacherClosingRef.current = false;
        }, 100);
      }
    },
    [replaceParams],
  );

  // Debounce search query (300ms delay). Use startTransition to avoid "setTimeout handler took Xms" violations.
  useEffect(() => {
    const timer = setTimeout(() => {
      startTransition(() => {
        setDebouncedSearchQuery(searchQuery);
        setPage(0); // Reset to first page on search
      });
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch teachers
  const { 
    data: teachersData, 
    isLoading,
    error 
  } = useTeachers({
    skip: 0,
    take: 500,
    search: debouncedSearchQuery || undefined,
    status: selectedStatus || undefined,
    sortBy: sortBy,
    sortOrder: sortOrder,
  });

  // Fetch centers for branch filter - fetch ALL centers (max 100 per API limit)
  const { 
    data: centersData, 
    isLoading: isLoadingCenters,
    error: centersError 
  } = useCenters({
    take: 100, // Maximum allowed by backend API
  });

  const visibleCenters = useMemo(() => {
    const centers = centersData?.items || [];
    if (!managerCenterId) return centers;
    return centers.filter((center) => center.id === managerCenterId);
  }, [centersData?.items, managerCenterId]);

  const sortedVisibleCenters = useMemo(
    () => [...visibleCenters].sort((a, b) => a.name.localeCompare(b.name)),
    [visibleCenters]
  );

  // Mutations
  const deleteTeacher = useDeleteTeacher();
  const deleteTeachers = useDeleteTeachers();
  const updateTeacher = useUpdateTeacher();

  // Get all teachers from API
  const allTeachers = useMemo(() => teachersData?.items || [], [teachersData?.items]);

  // Apply filters client-side with memoization for performance
  const filteredTeachers = useMemo(() => {
    return filterTeachersByBranches(allTeachers, selectedBranchIds);
  }, [allTeachers, selectedBranchIds]);

  // Group teachers by center for board tabs and list center filter
  const teachersByCenter = useMemo(() => {
    const centers = visibleCenters;
    return groupTeachersByCenter(filteredTeachers, centers);
  }, [filteredTeachers, visibleCenters]);

  const hasUnassignedTeachers = (teachersByCenter.unassigned?.length || 0) > 0;

  const [centerTabSelection, setCenterTabSelection] = useState<string | null>(null);

  /** Resolves selection on the same render (avoids empty pagination when strip exists but state is still null). */
  const activeCenterTabId = useMemo((): string | null => {
    const hasStrip =
      sortedVisibleCenters.length > 0 || hasUnassignedTeachers;
    if (!hasStrip) {
      return null;
    }
    if (sortedVisibleCenters.length === 0) {
      return hasUnassignedTeachers ? 'unassigned' : null;
    }
    if (centerTabSelection === 'unassigned' && hasUnassignedTeachers) {
      return 'unassigned';
    }
    if (
      centerTabSelection &&
      sortedVisibleCenters.some((center) => center.id === centerTabSelection)
    ) {
      return centerTabSelection;
    }
    return sortedVisibleCenters[0].id;
  }, [sortedVisibleCenters, hasUnassignedTeachers, centerTabSelection]);

  useEffect(() => {
    if (sortedVisibleCenters.length === 0) {
      setCenterTabSelection(hasUnassignedTeachers ? 'unassigned' : null);
      return;
    }

    const activeStillExists =
      centerTabSelection === 'unassigned'
        ? hasUnassignedTeachers
        : sortedVisibleCenters.some((center) => center.id === centerTabSelection);

    if (activeStillExists) {
      return;
    }

    setCenterTabSelection(sortedVisibleCenters[0].id);
  }, [centerTabSelection, hasUnassignedTeachers, sortedVisibleCenters]);

  const teachersPaginationSource = useMemo(() => {
    const hasCenterStrip =
      sortedVisibleCenters.length > 0 || hasUnassignedTeachers;
    if (!hasCenterStrip) {
      return filteredTeachers;
    }
    if (activeCenterTabId === 'unassigned') {
      return teachersByCenter.unassigned ?? [];
    }
    if (activeCenterTabId) {
      return teachersByCenter[activeCenterTabId] ?? [];
    }
    return [];
  }, [
    filteredTeachers,
    sortedVisibleCenters.length,
    hasUnassignedTeachers,
    teachersByCenter,
    activeCenterTabId,
  ]);

  // Apply pagination (list view uses center-scoped rows when the strip is shown)
  const { teachers, totalTeachers, totalPages } = useMemo(() => {
    const startIndex = page * PAGE_SIZE;
    const endIndex = startIndex + PAGE_SIZE;
    const paginatedTeachers = teachersPaginationSource.slice(startIndex, endIndex);
    const total = teachersPaginationSource.length;
    const totalPagesCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

    return {
      teachers: paginatedTeachers,
      totalTeachers: total,
      totalPages: totalPagesCount,
    };
  }, [teachersPaginationSource, page]);

  useEffect(() => {
    const total = teachersPaginationSource.length;
    const totalPagesCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
    if (page >= totalPagesCount) {
      setPage(Math.max(0, totalPagesCount - 1));
    }
  }, [teachersPaginationSource, page]);

  // Selection helpers
  const allSelected = teachers.length > 0 && teachers.every((t) => selectedTeacherIds.has(t.id));
  const someSelected = teachers.some((t) => selectedTeacherIds.has(t.id)) && !allSelected;

  // Handlers
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setSelectedTeacherIds(new Set());
  };

  const handleBranchFilterChange = (selectedIds: Set<string>) => {
    setSelectedBranchIds(selectedIds);
    setPage(0);
    setSelectedTeacherIds(new Set());
  };

  const handleStatusChange = (status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | '') => {
    setSelectedStatus(status);
    setPage(0);
    setSelectedTeacherIds(new Set());
    replaceParams({ status: status || null });
  };

  const handleSort = (key: string) => {
    if (sortBy === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(key);
      setSortOrder('asc');
    }
    setPage(0);
    setSelectedTeacherIds(new Set());
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    setSelectedTeacherIds(new Set());
  };

  const handleToggleSelect = (teacherId: string) => {
    setSelectedTeacherIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(teacherId)) {
        newSet.delete(teacherId);
      } else {
        newSet.add(teacherId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    const currentPageIds = new Set(teachers.map((t) => t.id));
    const allCurrentSelected = teachers.length > 0 && teachers.every((t) => selectedTeacherIds.has(t.id));
    
    if (allCurrentSelected) {
      setSelectedTeacherIds((prev) => {
        const newSet = new Set(prev);
        currentPageIds.forEach((id) => newSet.delete(id));
        return newSet;
      });
    } else {
      setSelectedTeacherIds((prev) => {
        const newSet = new Set(prev);
        currentPageIds.forEach((id) => newSet.add(id));
        return newSet;
      });
    }
  };

  const updateViewModeInUrl = useCallback(
    (mode: ViewMode) => {
      setPendingViewMode(mode);
      replaceParams({ view: mode === 'list' ? null : mode });
    },
    [replaceParams],
  );

  const handleViewModeChange = (mode: ViewMode) => {
    updateViewModeInUrl(mode);
    setPage(0);
    setSelectedTeacherIds(new Set());
  };

  const handleActiveCenterTabChange = (centerId: string) => {
    setCenterTabSelection(centerId);
    setPage(0);
    setSelectedTeacherIds(new Set());
  };

  const handleEditClick = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setSelectedTeacherIdForEdit(teacher.id);
    replaceParams({
      [EDIT_TEACHER_URL_PARAM]: teacher.id,
      [ADD_TEACHER_URL_PARAM]: null,
      teacherId: null,
    });
  };

  const handleDeleteClick = (teacher: Teacher) => {
    setTeacherIdPendingDelete(teacher.id);
    setTeacherPendingDeleteLabel(`${teacher.user.firstName} ${teacher.user.lastName}`);
    setDeleteError(null);
    setDeleteSuccess(false);
  };

  const handleDeleteDialogOpenChange = (open: boolean) => {
    if (open) return;
    if (deleteTeacher.isPending) return;
    setTeacherIdPendingDelete(null);
    setTeacherPendingDeleteLabel(null);
    setDeleteError(null);
    setDeleteSuccess(false);
  };

  const handleDeleteConfirm = async () => {
    if (!teacherIdPendingDelete) return;

    setDeleteError(null);
    setDeleteSuccess(false);

    try {
      const deletedId = teacherIdPendingDelete;
      await deleteTeacher.mutateAsync(deletedId);
      setDeleteSuccess(true);
      setTeacherIdPendingDelete(null);
      setTeacherPendingDeleteLabel(null);

      if (readUrlSearchParam(EDIT_TEACHER_URL_PARAM, searchParams) === deletedId) {
        replaceParams({ [EDIT_TEACHER_URL_PARAM]: null });
      }

      setTimeout(() => {
        startTransition(() => setDeleteSuccess(false));
      }, 3000);
    } catch (err: unknown) {
      const message = getErrorMessage(err, 'Failed to delete teacher. Please try again.');
      setDeleteError(message);
    }
  };

  const handleBulkDeleteClick = () => {
    if (selectedTeacherIds.size === 0) return;
    setBulkDeleteError(null);
    setBulkDeleteSuccess(false);
    setIsBulkDeleteDialogOpen(true);
  };

  const handleBulkDeleteConfirm = async () => {
    if (selectedTeacherIds.size === 0) return;

    setBulkDeleteError(null);
    setBulkDeleteSuccess(false);

    const count = selectedTeacherIds.size;
    try {
      const idsArray = Array.from(selectedTeacherIds);
      await deleteTeachers.mutateAsync(idsArray);
      setDeletedCount(count);
      setBulkDeleteSuccess(true);
      setIsBulkDeleteDialogOpen(false);
      setSelectedTeacherIds(new Set());

      const editId = readUrlSearchParam(EDIT_TEACHER_URL_PARAM, searchParams);
      if (editId && idsArray.includes(editId)) {
        replaceParams({ [EDIT_TEACHER_URL_PARAM]: null });
      }

      setTimeout(() => {
        startTransition(() => {
          setBulkDeleteSuccess(false);
          setDeletedCount(0);
        });
      }, 3000);
    } catch (err: unknown) {
      const message = getErrorMessage(err, 'Failed to delete teachers. Please try again.');
      setBulkDeleteError(message);
    }
  };

  const handleDeactivateClick = async (teacher: Teacher) => {
    const isCurrentlyActive = teacher.user?.status === 'ACTIVE';
    const newStatus = isCurrentlyActive ? 'INACTIVE' : 'ACTIVE';
    
    setDeactivateError(null);
    setDeactivateSuccess(false);

    try {
      await updateTeacher.mutateAsync({
        id: teacher.id,
        data: { status: newStatus },
      });
      setDeactivateSuccess(true);
      
      setTimeout(() => {
        startTransition(() => setDeactivateSuccess(false));
      }, 3000);
    } catch (err: unknown) {
      const message = getErrorMessage(err, `Failed to ${isCurrentlyActive ? 'deactivate' : 'activate'} teacher. Please try again.`);
      setDeactivateError(message);
    }
  };

  const handleCenterChange = async (teacherId: string, centerIds: string[]) => {
    await updateTeacher.mutateAsync({
      id: teacherId,
      data: {
        centerIds,
      },
    });
  };

  const handleRowClick = (teacher: Teacher) => {
    replaceParams({
      teacherId: teacher.id,
      [ADD_TEACHER_URL_PARAM]: null,
      [EDIT_TEACHER_URL_PARAM]: null,
    });
  };

  const handleDetailsDrawerClose = () => {
    replaceParams({ teacherId: null });
  };

  const handleTotalTeachersClick = useCallback(() => {
    router.push(`/${locale}${portalBasePath}/teachers/all`);
  }, [router, locale, portalBasePath]);

  const uniqueTeachersCount = useMemo(() => {
    const clientCount = countUniqueTeachers(filteredTeachers);
    if (selectedBranchIds.size > 0) {
      return clientCount;
    }
    const apiTotal = teachersData?.total;
    if (typeof apiTotal === 'number') {
      return apiTotal;
    }
    return clientCount;
  }, [filteredTeachers, selectedBranchIds, teachersData?.total]);

  // Stats calculation
  const activeTeachers = filteredTeachers.filter(t => t.user?.status === 'ACTIVE').length;
  const totalLessons = filteredTeachers.reduce((sum, t) => sum + (t._count?.lessons || 0), 0);

  return {
    // Translations
    t,
    tCommon,
    tStatus,
    locale,
    
    // State
    searchQuery,
    page,
    sortBy,
    sortOrder,
    viewMode,
    selectedStatus,
    selectedBranchIds,
    selectedTeacherIds,
    selectedTeacher,
    selectedTeacherIdForDetails,
    selectedTeacherIdForEdit,
    isAddTeacherOpen,
    isEditTeacherOpen,
    teacherIdPendingDelete,
    teacherPendingDeleteLabel,
    isBulkDeleteDialogOpen,
    isDetailsDrawerOpen,
    allSelected,
    someSelected,
    activeCenterTabId,
    sortedVisibleCenters,

    // Data
    teachers,
    totalTeachers,
    uniqueTeachersCount,
    totalPages,
    teachersByCenter,
    filteredTeachers,
    allTeachers,
    centersData: centersData ? { ...centersData, items: visibleCenters } : centersData,
    activeTeachers,
    totalLessons,
    
    // Loading states
    isLoading,
    isLoadingCenters,
    deleteTeacher,
    deleteTeachers,
    updateTeacher,
    
    // Errors
    error,
    centersError,
    deleteError,
    bulkDeleteError,
    deactivateError,
    
    // Success messages
    deleteSuccess,
    bulkDeleteSuccess,
    deactivateSuccess,
    deletedCount,
    
    // Handlers
    handleSearchChange,
    handleBranchFilterChange,
    handleStatusChange,
    handleSort,
    handlePageChange,
    handleToggleSelect,
    handleSelectAll,
    handleViewModeChange,
    handleActiveCenterTabChange,
    handleEditClick,
    handleDeleteClick,
    handleDeleteDialogOpenChange,
    handleDeleteConfirm,
    handleBulkDeleteClick,
    handleBulkDeleteConfirm,
    handleDeactivateClick,
    handleCenterChange,
    handleRowClick,
    handleDetailsDrawerClose,
    handleTotalTeachersClick,
    setIsAddTeacherOpen,
    setIsEditTeacherOpen,
    setIsBulkDeleteDialogOpen,
    setSelectedTeacher,
    setDeleteError,
    setDeleteSuccess,
    setBulkDeleteError,
    setBulkDeleteSuccess,
  };
}

