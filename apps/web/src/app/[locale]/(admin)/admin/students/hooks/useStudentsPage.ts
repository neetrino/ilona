'use client';

import { useState, useEffect, useMemo, startTransition } from 'react';
import { useParams, useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  useStudents,
  useDeleteStudent,
  useDeleteStudentsBulk,
  useUpdateStudent,
  getItemId,
  isOnboardingItem,
  type Student,
  type StudentLifecycleStatus,
  type UpdateStudentDto,
} from '@/features/students';
import { useTeachers } from '@/features/teachers';
import { useGroups } from '@/features/groups';
import { useCenters } from '@/features/centers';
import { getErrorMessage } from '@/shared/lib/api';
import { groupStudentsByCenter } from '../utils';
import { useAuthStore } from '@/features/auth/store/auth.store';

type ViewMode = 'list' | 'board';

const PAGE_SIZE = 10;
const NEW_STUDENT_BADGE_DAYS = 30;

function isWithinNewStudentWindow(student: Student): boolean {
  if (student.isRecentlyPaidFromCrm !== undefined) {
    return student.isRecentlyPaidFromCrm;
  }

  if (!student.leadId) {
    return false;
  }

  const activationDateRaw = student.enrolledAt ?? student.createdAt;
  if (!activationDateRaw) {
    return false;
  }
  const activationDate = new Date(activationDateRaw);
  if (Number.isNaN(activationDate.getTime())) {
    return false;
  }

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - NEW_STUDENT_BADGE_DAYS);
  return activationDate >= cutoff;
}

export function useStudentsPage() {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const locale = typeof params?.locale === 'string' ? params.locale : 'en';
  const t = useTranslations('students');
  const tCommon = useTranslations('common');
  const tTeachers = useTranslations('teachers');
  const tStatus = useTranslations('status');
  const { user } = useAuthStore();
  const managerCenterId = user?.role === 'MANAGER' ? user.managerCenterId : undefined;

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  
  // Pagination state
  const [page, setPage] = useState(0);
  
  // Sorting state
  const [sortBy, setSortBy] = useState<string | undefined>(undefined);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  // Modal/Dialog states
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [isEditStudentOpen, setIsEditStudentOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedStudentForFeedback, setSelectedStudentForFeedback] = useState<Student | null>(null);

  /** Student details modal — synced with `?studentId=` (same pattern as Teachers `?teacherId=`). */
  const [selectedStudentIdForDetails, setSelectedStudentIdForDetails] = useState<string | null>(null);
  const [isStudentDetailsModalOpen, setIsStudentDetailsModalOpen] = useState(false);
  
  // Selection state
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());
  
  // Messages state
  const [deletedCount, setDeletedCount] = useState<number>(0);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const [bulkDeleteError, setBulkDeleteError] = useState<string | null>(null);
  const [bulkDeleteSuccess, setBulkDeleteSuccess] = useState(false);
  const [deactivateError, setDeactivateError] = useState<string | null>(null);
  const [deactivateSuccess, setDeactivateSuccess] = useState(false);
  
  // Filter states
  const [selectedTeacherIds, setSelectedTeacherIds] = useState<Set<string>>(new Set());
  const [selectedCenterIds, setSelectedCenterIds] = useState<Set<string>>(new Set());
  const [selectedStatusIds, setSelectedStatusIds] = useState<Set<string>>(new Set());
  const [selectedGroupIds, setSelectedGroupIds] = useState<Set<string>>(new Set());
  const [selectedLifecycleIds, setSelectedLifecycleIds] = useState<Set<string>>(new Set());
  
  // Month/year filter for attendance - default to current month
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth() + 1); // 1-12
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
  
  // Export now for use in page component
  const nowForPage = now;
  
  // View mode state with URL persistence
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const modeFromUrl = searchParams.get('view');
    if (modeFromUrl === 'list' || modeFromUrl === 'board') {
      return modeFromUrl;
    }
    return 'list'; // Default to list view
  });

  // Update URL when view mode changes
  const updateViewModeInUrl = (mode: ViewMode) => {
    const params = new URLSearchParams(searchParams.toString());
    if (mode !== 'list') {
      params.set('view', mode);
    } else {
      params.delete('view');
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  // Sync view mode from URL
  useEffect(() => {
    const modeFromUrl = searchParams.get('view');
    if (modeFromUrl === 'list' || modeFromUrl === 'board') {
      setViewMode(modeFromUrl);
    } else if (!modeFromUrl) {
      setViewMode('list');
    }
  }, [searchParams]);

  useEffect(() => {
    const studentIdFromUrl = searchParams.get('studentId');
    setSelectedStudentIdForDetails(studentIdFromUrl);
    setIsStudentDetailsModalOpen(!!studentIdFromUrl);
  }, [searchParams]);

  // Feedback modal: read student id from URL so refresh keeps modal open
  const feedbackStudentIdFromUrl = searchParams.get('feedback') || null;
  useEffect(() => {
    if (feedbackStudentIdFromUrl) {
      setIsFeedbackModalOpen(true);
    }
  }, [feedbackStudentIdFromUrl]);

  // Debounce search query (300ms). Use debounced value for API to avoid request on every keystroke.
  useEffect(() => {
    const timer = setTimeout(() => {
      startTransition(() => {
        setDebouncedSearchQuery(searchQuery);
        setPage(0);
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch teachers, groups, and centers for filters and dropdowns
  const { data: teachersData } = useTeachers({ take: 50, status: 'ACTIVE' });
  const { data: groupsData } = useGroups({ take: 50, isActive: true });
  const { data: centersData } = useCenters({ isActive: true });

  // Convert filters to arrays for API
  const teacherIdsArray = useMemo(() => 
    selectedTeacherIds.size > 0 ? Array.from(selectedTeacherIds) : undefined,
    [selectedTeacherIds]
  );
  const centerIdsArray = useMemo(() => 
    managerCenterId
      ? [managerCenterId]
      : selectedCenterIds.size > 0
        ? Array.from(selectedCenterIds)
        : undefined,
    [managerCenterId, selectedCenterIds]
  );
  const statusIdsArray = useMemo(() => 
    selectedStatusIds.size > 0 ? Array.from(selectedStatusIds) as ('ACTIVE' | 'INACTIVE' | 'SUSPENDED')[] : undefined,
    [selectedStatusIds]
  );
  const groupIdsArray = useMemo(
    () => (selectedGroupIds.size > 0 ? Array.from(selectedGroupIds) : undefined),
    [selectedGroupIds],
  );
  const lifecycleStatusesArray = useMemo(
    () =>
      selectedLifecycleIds.size > 0
        ? (Array.from(selectedLifecycleIds) as StudentLifecycleStatus[])
        : undefined,
    [selectedLifecycleIds],
  );

  // Fetch students - for board view, fetch max allowed (100); for list view, use pagination
  const shouldFetchAll = viewMode === 'board';
  const { 
    data: studentsData, 
    isLoading,
    error 
  } = useStudents({ 
    skip: shouldFetchAll ? 0 : page * PAGE_SIZE,
    take: shouldFetchAll ? 100 : PAGE_SIZE, // API max is 100
    search: debouncedSearchQuery.trim() || undefined,
    teacherIds: teacherIdsArray,
    centerIds: centerIdsArray,
    statusIds: statusIdsArray,
    groupIds: groupIdsArray,
    lifecycleStatuses: lifecycleStatusesArray,
    sortBy: sortBy,
    sortOrder: sortOrder,
    month: selectedMonth,
    year: selectedYear,
  });

  // Mutations
  const deleteStudent = useDeleteStudent();
  const deleteStudentsBulk = useDeleteStudentsBulk();
  const updateStudent = useUpdateStudent();

  const students = useMemo(() => {
    const items = studentsData?.items || [];
    return [...items].sort((a, b) => {
      const aIsNew = !isOnboardingItem(a) && isWithinNewStudentWindow(a);
      const bIsNew = !isOnboardingItem(b) && isWithinNewStudentWindow(b);
      if (aIsNew === bIsNew) return 0;
      return aIsNew ? -1 : 1;
    });
  }, [studentsData?.items]);
  const totalStudents = studentsData?.total || 0;
  const totalPages = studentsData?.totalPages || 1;
  const allCenters = useMemo(() => {
    const centers = centersData?.items || [];
    if (!managerCenterId) return centers;
    return centers.filter((center) => center.id === managerCenterId);
  }, [centersData?.items, managerCenterId]);

  // Group students by center for board view
  const studentsByCenter = useMemo(() => 
    groupStudentsByCenter(students, allCenters, viewMode),
    [students, allCenters, viewMode]
  );

  // Handle sorting
  const handleSort = (key: string) => {
    if (sortBy === key) {
      // Toggle sort order if clicking the same column
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new sort column and default to ascending
      setSortBy(key);
      setSortOrder('asc');
    }
    setPage(0); // Reset to first page on sort change
    // Clear selection on sort change
    setSelectedStudentIds(new Set());
  };

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    // Clear selection on page change (selection is per-page)
    setSelectedStudentIds(new Set());
  };

  // Handle individual checkbox toggle
  const handleToggleSelect = (studentId: string) => {
    setSelectedStudentIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(studentId)) {
        newSet.delete(studentId);
      } else {
        newSet.add(studentId);
      }
      return newSet;
    });
  };

  // Handle select all toggle
  const handleSelectAll = () => {
    const currentPageIds = new Set(students.map(getItemId));
    const allCurrentSelected = students.length > 0 && students.every((s) => selectedStudentIds.has(getItemId(s)));
    
    if (allCurrentSelected) {
      // Deselect all current visible students (but keep selections from other pages)
      setSelectedStudentIds((prev) => {
        const newSet = new Set(prev);
        currentPageIds.forEach((id) => newSet.delete(id));
        return newSet;
      });
    } else {
      // Select all visible students
      setSelectedStudentIds((prev) => {
        const newSet = new Set(prev);
        currentPageIds.forEach((id) => newSet.add(id));
        return newSet;
      });
    }
  };

  // Check if all visible students are selected
  const allSelected = students.length > 0 && students.every((s) => selectedStudentIds.has(getItemId(s)));
  // Check if some (but not all) are selected (indeterminate state)
  const someSelected = students.some((s) => selectedStudentIds.has(getItemId(s))) && !allSelected;

  // Handle bulk delete click
  const handleBulkDeleteClick = () => {
    if (selectedStudentIds.size === 0) return;
    setBulkDeleteError(null);
    setBulkDeleteSuccess(false);
    setIsBulkDeleteDialogOpen(true);
  };

  // Handle bulk delete confirmation
  const handleBulkDeleteConfirm = async () => {
    if (selectedStudentIds.size === 0) return;

    setBulkDeleteError(null);
    setBulkDeleteSuccess(false);

    const idsArray = Array.from(selectedStudentIds);
    const count = idsArray.length;

    try {
      const result = await deleteStudentsBulk.mutateAsync(idsArray);
      const successCount = result?.deleted ?? 0;

      if (successCount > 0) {
        setDeletedCount(successCount);
        setBulkDeleteSuccess(true);
        setIsBulkDeleteDialogOpen(false);
        setSelectedStudentIds(new Set());

        setTimeout(() => {
          startTransition(() => {
            setBulkDeleteSuccess(false);
            setDeletedCount(0);
          });
        }, 3000);
      }

      if (successCount < count && successCount > 0) {
        setBulkDeleteError(`Deleted ${successCount} of ${count} students. Some could not be deleted.`);
      } else if (successCount === 0 && count > 0) {
        setBulkDeleteError('No students were deleted. They may have been removed already.');
      }
    } catch (err: unknown) {
      const message = getErrorMessage(err, 'Failed to delete students. Please try again.');
      setBulkDeleteError(message);
    }
  };

  // Handle search
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    // Clear selection when user types (page reset happens in debounce effect)
    setSelectedStudentIds(new Set());
  };

  // Handle delete button click
  const handleDeleteClick = (student: Student) => {
    setSelectedStudent(student);
    setDeleteError(null);
    setDeleteSuccess(false);
    setIsDeleteDialogOpen(true);
  };

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (!selectedStudent) return;

    setDeleteError(null);
    setDeleteSuccess(false);

    try {
      await deleteStudent.mutateAsync(selectedStudent.id);
      setDeleteSuccess(true);
      setIsDeleteDialogOpen(false);
      setSelectedStudent(null);
      
      // Clear success message after a delay
      setTimeout(() => {
        startTransition(() => setDeleteSuccess(false));
      }, 3000);
    } catch (err: unknown) {
      const message = getErrorMessage(err, 'Failed to delete student. Please try again.');
      setDeleteError(message);
    }
  };

  // Handle edit button click
  const handleEditClick = (student: Student) => {
    setSelectedStudent(student);
    setIsEditStudentOpen(true);
  };

  // Handle message/feedback icon click — update URL so refresh keeps modal open
  const handleShowFeedback = (student: Student) => {
    setSelectedStudentForFeedback(student);
    setIsFeedbackModalOpen(true);
    const params = new URLSearchParams(searchParams.toString());
    params.set('feedback', student.id);
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleFeedbackModalOpenChange = (open: boolean) => {
    setIsFeedbackModalOpen(open);
    if (!open) {
      setSelectedStudentForFeedback(null);
      const params = new URLSearchParams(searchParams.toString());
      params.delete('feedback');
      if (params.toString()) {
        router.push(`${pathname}?${params.toString()}`);
      } else {
        router.push(pathname);
      }
    }
  };

  // Handle deactivate button click
  const handleDeactivateClick = async (student: Student) => {
    const isCurrentlyActive = student.user?.status === 'ACTIVE';
    const newStatus = isCurrentlyActive ? 'INACTIVE' : 'ACTIVE';
    
    setDeactivateError(null);
    setDeactivateSuccess(false);

    try {
      await updateStudent.mutateAsync({
        id: student.id,
        data: { status: newStatus },
      });
      setDeactivateSuccess(true);
      
      // Clear success message after a delay
      setTimeout(() => {
        startTransition(() => setDeactivateSuccess(false));
      }, 3000);
    } catch (err: unknown) {
      const message = getErrorMessage(err, `Failed to ${isCurrentlyActive ? 'deactivate' : 'activate'} student. Please try again.`);
      setDeactivateError(message);
    }
  };

  // Handle inline updates
  const handleTeacherChange = async (studentId: string, teacherId: string | null) => {
    const row = students.find((s): s is Student => !isOnboardingItem(s) && s.id === studentId);
    const groupId = row?.groupId ?? null;
    const allGroups = groupsData?.items ?? [];
    const currentGroup = groupId ? allGroups.find((g) => g.id === groupId) : undefined;
    const nextTeacherId = teacherId || null;
    const groupBelongsToTeacher =
      !currentGroup || !nextTeacherId || currentGroup.teacherId === nextTeacherId;
    const payload: UpdateStudentDto = { teacherId: teacherId || undefined };
    if (!groupBelongsToTeacher) {
      payload.groupId = null;
    }
    await updateStudent.mutateAsync({
      id: studentId,
      data: payload,
    });
  };

  const handleGroupChange = async (studentId: string, groupId: string | null) => {
    await updateStudent.mutateAsync({
      id: studentId,
      data: { groupId: groupId === null ? null : groupId },
    });
  };

  const handleCenterChange = async (studentId: string, centerId: string | null) => {
    await updateStudent.mutateAsync({
      id: studentId,
      data: { centerId: centerId === null ? null : centerId },
    });
  };

  const handleRegisterDateChange = async (studentId: string, date: string | null) => {
    await updateStudent.mutateAsync({
      id: studentId,
      data: { registerDate: date },
    });
  };

  // Prepare options for dropdowns
  const teacherOptions = useMemo(() => 
    (teachersData?.items || []).map(teacher => ({
      id: teacher.id,
      label: `${teacher.user.firstName} ${teacher.user.lastName}`,
    })),
    [teachersData]
  );

  // Full groups list with teacherId for per-row filtering (group options are filtered by selected teacher in table)
  const groups = useMemo(() => groupsData?.items ?? [], [groupsData]);

  const centerOptions = useMemo(() => 
    allCenters.map(center => ({
      id: center.id,
      label: center.name,
    })),
    [allCenters]
  );

  const teacherFilterOptions = useMemo(() => 
    (teachersData?.items || []).map(teacher => ({
      id: teacher.id,
      label: `${teacher.user.firstName} ${teacher.user.lastName}`,
    })),
    [teachersData]
  );

  const centerFilterOptions = useMemo(() => 
    allCenters.map(center => ({
      id: center.id,
      label: center.name,
    })),
    [allCenters]
  );

  const statusFilterOptions = useMemo(() => [
    { id: 'ACTIVE', label: tStatus('active') },
    { id: 'INACTIVE', label: tStatus('inactive') },
    { id: 'SUSPENDED', label: tStatus('suspended') },
  ], [tStatus]);

  // Lifecycle filter options derived from the persisted Student.status enum.
  // Distinct from User.status: covers NEW intake, UNGROUPED, and risk states.
  const lifecycleFilterOptions = useMemo(
    () => [
      { id: 'NEW', label: 'New' },
      { id: 'UNGROUPED', label: 'Ungrouped' },
      { id: 'RISK', label: 'Risk' },
      { id: 'HIGH_RISK', label: 'High Risk' },
    ],
    [],
  );

  // Group filter options (scoped by manager center if applicable).
  const groupFilterOptions = useMemo(() => {
    const all = groupsData?.items ?? [];
    const scoped = managerCenterId
      ? all.filter((g) => g.centerId === managerCenterId)
      : all;
    return scoped.map((g) => ({
      id: g.id,
      label: `${g.name}${g.level ? ` (${g.level})` : ''}`,
    }));
  }, [groupsData?.items, managerCenterId]);

  // Reset page when filters change
  const handleFilterChange = () => {
    setPage(0);
    // Clear selection on filter change
    setSelectedStudentIds(new Set());
  };

  const handleStudentDetailsOpen = (student: Student) => {
    setSelectedStudentIdForDetails(student.id);
    setIsStudentDetailsModalOpen(true);
    const next = new URLSearchParams(searchParams.toString());
    next.set('studentId', student.id);
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  };

  const handleStudentDetailsClose = () => {
    setIsStudentDetailsModalOpen(false);
    setSelectedStudentIdForDetails(null);
    const next = new URLSearchParams(searchParams.toString());
    next.delete('studentId');
    const url = next.toString() ? `${pathname}?${next.toString()}` : pathname;
    router.replace(url, { scroll: false });
  };

  // Stats calculation (only full students have user.status; onboarding items are not counted as active)
  const activeStudents = students.filter((s): s is Student => 'user' in s && s.user?.status === 'ACTIVE').length;
  const studentsWithGroup = students.filter(s => s.group).length;
  // Use backend-provided totalMonthlyFees (calculated from all matching students, respecting filters, independent of pagination)
  const totalFees = studentsData?.totalMonthlyFees || 0;

  return {
    // Data
    students,
    totalStudents,
    totalPages,
    allCenters,
    studentsByCenter,
    isLoading,
    error,
    teachersData,
    groupsData,
    centersData,
    
    // State
    searchQuery,
    page,
    viewMode,
    sortBy,
    sortOrder,
    selectedStudent,
    selectedStudentIds,
    allSelected,
    someSelected,
    selectedTeacherIds,
    selectedCenterIds,
    selectedStatusIds,
    selectedGroupIds,
    selectedLifecycleIds,
    selectedMonth,
    selectedYear,
    isAddStudentOpen,
    isEditStudentOpen,
    isDeleteDialogOpen,
    isBulkDeleteDialogOpen,
    isFeedbackModalOpen,
    selectedStudentForFeedback,
    feedbackStudentIdFromUrl,
    selectedStudentIdForDetails,
    isStudentDetailsModalOpen,
    deleteError,
    deleteSuccess,
    bulkDeleteError,
    bulkDeleteSuccess,
    deletedCount,
    deactivateError,
    deactivateSuccess,
    
    // Mutations
    deleteStudent,
    updateStudent,
    
    // Options
    teacherOptions,
    groups,
    centerOptions,
    teacherFilterOptions,
    centerFilterOptions,
    statusFilterOptions,
    groupFilterOptions,
    lifecycleFilterOptions,
    
    // Stats
    activeStudents,
    studentsWithGroup,
    totalFees,
    
    // Handlers
    setSearchQuery,
    handleSearchChange,
    handlePageChange,
    setViewMode,
    updateViewModeInUrl,
    handleSort,
    handleToggleSelect,
    handleSelectAll,
    handleBulkDeleteClick,
    handleBulkDeleteConfirm,
    handleDeleteClick,
    handleDeleteConfirm,
    handleEditClick,
    handleDeactivateClick,
    handleShowFeedback,
    handleFeedbackModalOpenChange,
    handleTeacherChange,
    handleGroupChange,
    handleCenterChange,
    handleRegisterDateChange,
    handleStudentDetailsOpen,
    handleStudentDetailsClose,
    setSelectedTeacherIds,
    setSelectedCenterIds,
    setSelectedStatusIds,
    setSelectedGroupIds,
    setSelectedLifecycleIds,
    setSelectedMonth,
    setSelectedYear,
    handleFilterChange,
    setIsAddStudentOpen,
    setIsEditStudentOpen,
    setIsDeleteDialogOpen,
    setIsBulkDeleteDialogOpen,
    setIsFeedbackModalOpen,
    setSelectedStudentForFeedback,
    setSelectedStudent,
    setDeleteError,
    setBulkDeleteError,
    setPage,
    setSelectedStudentIds,
    setBulkDeleteSuccess,
    
    // Translations
    t,
    tCommon,
    tTeachers,
    tStatus,
    locale,
    
    // Constants
    pageSize: PAGE_SIZE,
    now: nowForPage,
  };
}

