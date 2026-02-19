'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
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
import { filterTeachersByBranches, groupTeachersByCenter } from '../utils';

type ViewMode = 'list' | 'board';

const PAGE_SIZE = 10;

export function useTeachersPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = params.locale as string;
  const t = useTranslations('teachers');
  const tCommon = useTranslations('common');
  const tStatus = useTranslations('status');

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  
  // Pagination state
  const [page, setPage] = useState(0);
  
  // Sorting state
  const [sortBy, setSortBy] = useState<string | undefined>(undefined);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  // Modal/Dialog states
  const [isAddTeacherOpen, setIsAddTeacherOpen] = useState(false);
  const [isEditTeacherOpen, setIsEditTeacherOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
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
    const statusFromUrl = searchParams.get('status');
    return (statusFromUrl === 'ACTIVE' || statusFromUrl === 'INACTIVE' || statusFromUrl === 'SUSPENDED') ? statusFromUrl : '';
  });
  
  // View mode state with URL persistence
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const modeFromUrl = searchParams.get('view');
    if (modeFromUrl === 'list' || modeFromUrl === 'board') {
      return modeFromUrl;
    }
    return 'board'; // Default to board view
  });
  
  // Details drawer state
  const teacherIdFromUrl = searchParams.get('teacherId');
  const [selectedTeacherIdForDetails, setSelectedTeacherIdForDetails] = useState<string | null>(teacherIdFromUrl);
  const [isDetailsDrawerOpen, setIsDetailsDrawerOpen] = useState(!!teacherIdFromUrl);

  // Debounce search query (300ms delay)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      setPage(0); // Reset to first page on search
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Sync view mode from URL
  useEffect(() => {
    const modeFromUrl = searchParams.get('view');
    if (modeFromUrl === 'list' || modeFromUrl === 'board') {
      setViewMode(modeFromUrl);
    } else if (!modeFromUrl) {
      setViewMode('board');
    }
  }, [searchParams]);

  // Sync state with URL params when URL changes
  useEffect(() => {
    const teacherIdFromUrl = searchParams.get('teacherId');
    if (teacherIdFromUrl !== selectedTeacherIdForDetails) {
      setSelectedTeacherIdForDetails(teacherIdFromUrl);
      setIsDetailsDrawerOpen(!!teacherIdFromUrl);
    }
  }, [searchParams, selectedTeacherIdForDetails]);

  // Fetch teachers
  const { 
    data: teachersData, 
    isLoading,
    error 
  } = useTeachers({ 
    skip: 0,
    take: 100, // Max allowed by backend
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

  // Mutations
  const deleteTeacher = useDeleteTeacher();
  const deleteTeachers = useDeleteTeachers();
  const updateTeacher = useUpdateTeacher();

  // Get all teachers from API
  const allTeachers = teachersData?.items || [];
  
  // Apply filters client-side with memoization for performance
  const filteredTeachers = useMemo(() => {
    return filterTeachersByBranches(allTeachers, selectedBranchIds);
  }, [allTeachers, selectedBranchIds]);

  // Group teachers by center for board view
  const teachersByCenter = useMemo(() => {
    const centers = centersData?.items || [];
    return groupTeachersByCenter(filteredTeachers, centers, viewMode);
  }, [filteredTeachers, centersData, viewMode]);

  // Apply pagination to filtered results with memoization
  const { teachers, totalTeachers, totalPages } = useMemo(() => {
    const startIndex = page * PAGE_SIZE;
    const endIndex = startIndex + PAGE_SIZE;
    const paginatedTeachers = filteredTeachers.slice(startIndex, endIndex);
    const total = filteredTeachers.length;
    const totalPagesCount = Math.ceil(total / PAGE_SIZE);
    
    return {
      teachers: paginatedTeachers,
      totalTeachers: total,
      totalPages: totalPagesCount,
    };
  }, [filteredTeachers, page]);

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
    // Update URL
    const params = new URLSearchParams(searchParams.toString());
    if (status) {
      params.set('status', status);
    } else {
      params.delete('status');
    }
    router.push(`/${locale}/admin/teachers?${params.toString()}`);
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

  const updateViewModeInUrl = (mode: ViewMode) => {
    const params = new URLSearchParams(searchParams.toString());
    if (mode !== 'board') {
      params.set('view', mode);
    } else {
      params.delete('view');
    }
    router.push(`/${locale}/admin/teachers?${params.toString()}`);
  };

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    updateViewModeInUrl(mode);
    setPage(0);
    setSelectedTeacherIds(new Set());
  };

  const handleEditClick = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setIsEditTeacherOpen(true);
  };

  const handleDeleteClick = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setDeleteError(null);
    setDeleteSuccess(false);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedTeacher) return;

    setDeleteError(null);
    setDeleteSuccess(false);

    try {
      await deleteTeacher.mutateAsync(selectedTeacher.id);
      setDeleteSuccess(true);
      setIsDeleteDialogOpen(false);
      setSelectedTeacher(null);
      
      setTimeout(() => {
        setDeleteSuccess(false);
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
      
      setTimeout(() => {
        setBulkDeleteSuccess(false);
        setDeletedCount(0);
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
        setDeactivateSuccess(false);
      }, 3000);
    } catch (err: unknown) {
      const message = getErrorMessage(err, `Failed to ${isCurrentlyActive ? 'deactivate' : 'activate'} teacher. Please try again.`);
      setDeactivateError(message);
    }
  };

  const handleRowClick = (teacher: Teacher) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('teacherId', teacher.id);
    router.push(`/${locale}/admin/teachers?${params.toString()}`, { scroll: false });
    setSelectedTeacherIdForDetails(teacher.id);
    setIsDetailsDrawerOpen(true);
  };

  const handleDetailsDrawerClose = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('teacherId');
    const newUrl = params.toString() ? `/${locale}/admin/teachers?${params.toString()}` : `/${locale}/admin/teachers`;
    router.push(newUrl, { scroll: false });
    setIsDetailsDrawerOpen(false);
    setSelectedTeacherIdForDetails(null);
  };

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
    isAddTeacherOpen,
    isEditTeacherOpen,
    isDeleteDialogOpen,
    isBulkDeleteDialogOpen,
    isDetailsDrawerOpen,
    allSelected,
    someSelected,
    
    // Data
    teachers,
    totalTeachers,
    totalPages,
    teachersByCenter,
    filteredTeachers,
    allTeachers,
    centersData,
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
    handleEditClick,
    handleDeleteClick,
    handleDeleteConfirm,
    handleBulkDeleteClick,
    handleBulkDeleteConfirm,
    handleDeactivateClick,
    handleRowClick,
    handleDetailsDrawerClose,
    setIsAddTeacherOpen,
    setIsEditTeacherOpen,
    setIsDeleteDialogOpen,
    setIsBulkDeleteDialogOpen,
    setSelectedTeacher,
    setDeleteError,
    setDeleteSuccess,
    setBulkDeleteError,
    setBulkDeleteSuccess,
  };
}

