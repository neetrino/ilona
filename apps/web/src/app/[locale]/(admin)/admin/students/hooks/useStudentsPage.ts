'use client';

import { useState, useEffect, useMemo, useCallback, useRef, startTransition } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  useStudents,
  useDeleteStudent,
  useDeleteStudentsBulk,
  useUpdateStudent,
  getItemId,
  isOnboardingItem,
  buildStudentStatusNote,
  type Student,
  type StudentLifecycleStatus,
} from '@/features/students';
import { useTeachers } from '@/features/teachers';
import { useGroups } from '@/features/groups';
import { useCenters } from '@/features/centers';
import { getErrorMessage } from '@/shared/lib/api';
import { readUrlSearchParam } from '@/shared/lib/url-search-params';
import { useAppSearchUrl } from '@/shared/hooks/useAppSearchUrl';
import { resolveTeacherIdFromGroup } from '@/features/students/lib/group-center-assignment';
import { groupStudentsByCenter } from '../utils';
import { useAuthStore } from '@/features/auth/store/auth.store';

type ViewMode = 'list' | 'board';

const PAGE_SIZE = 10;
const NEW_STUDENT_BADGE_DAYS = 30;
const MODAL_PARAM = 'modal';
const ADD_STUDENT_MODAL = 'add-student';
const EDIT_STUDENT_PARAM = 'editStudent';

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
  const { searchParams, urlRevision, setParams, removeParams } = useAppSearchUrl();
  const locale = typeof params?.locale === 'string' ? params.locale : 'en';
  const t = useTranslations('students');
  const tCommon = useTranslations('common');
  const tTeachers = useTranslations('teachers');
  const tAnalytics = useTranslations('analytics');
  const tStatus = useTranslations('status');
  const { user } = useAuthStore();
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
  
  const isAddStudentOpen =
    readUrlSearchParam(MODAL_PARAM, searchParams, urlRevision) === ADD_STUDENT_MODAL;

  const setIsAddStudentOpen = useCallback(
    (open: boolean) => {
      if (open) {
        setParams({ [MODAL_PARAM]: ADD_STUDENT_MODAL }, { mode: 'push' });
      } else {
        removeParams([MODAL_PARAM], { mode: 'replace' });
      }
    },
    [removeParams, setParams],
  );
  const [isEditStudentOpen, setIsEditStudentOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const isFeedbackClosingRef = useRef(false);
  const isEditClosingRef = useRef(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedStudentForStatusChange, setSelectedStudentForStatusChange] =
    useState<Student | null>(null);
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

  // Update URL when view mode changes
  const updateViewModeInUrl = useCallback(
    (mode: ViewMode) => {
      setPendingViewMode(mode);
      setParams({ view: mode === 'list' ? null : mode }, { mode: 'replace' });
    },
    [setParams],
  );

  const setViewMode = useCallback(
    (mode: ViewMode) => {
      updateViewModeInUrl(mode);
    },
    [updateViewModeInUrl],
  );

  useEffect(() => {
    const studentIdFromUrl = readUrlSearchParam('studentId', searchParams);
    setSelectedStudentIdForDetails(studentIdFromUrl);
    setIsStudentDetailsModalOpen(!!studentIdFromUrl);
  }, [searchParams, urlRevision]);

  const feedbackStudentIdFromUrl = readUrlSearchParam('feedback', searchParams, urlRevision);
  useEffect(() => {
    if (isFeedbackClosingRef.current) {
      return;
    }
    if (feedbackStudentIdFromUrl) {
      setIsFeedbackModalOpen(true);
    } else {
      setIsFeedbackModalOpen(false);
    }
  }, [feedbackStudentIdFromUrl, urlRevision]);

  const editStudentIdFromUrl = readUrlSearchParam(EDIT_STUDENT_PARAM, searchParams, urlRevision);
  useEffect(() => {
    if (isEditClosingRef.current) {
      return;
    }
    if (editStudentIdFromUrl) {
      setIsEditStudentOpen(true);
    } else {
      setIsEditStudentOpen(false);
    }
  }, [editStudentIdFromUrl, urlRevision]);

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
  const { data: centersData } = useCenters({ isActive: true, take: 100 });

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

  // Fetch students — take up to API max so list center strip + board can group client-side
  const { 
    data: studentsData, 
    isLoading,
    error 
  } = useStudents({ 
    skip: 0,
    take: 100,
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

  const allStudents = useMemo(() => {
    const items = studentsData?.items || [];
    return [...items].sort((a, b) => {
      const aIsNew = !isOnboardingItem(a) && isWithinNewStudentWindow(a);
      const bIsNew = !isOnboardingItem(b) && isWithinNewStudentWindow(b);
      if (aIsNew === bIsNew) return 0;
      return aIsNew ? -1 : 1;
    });
  }, [studentsData?.items]);

  const allCenters = useMemo(() => {
    const centers = centersData?.items || [];
    if (!managerCenterId) return centers;
    const scoped = centers.filter((center) => center.id === managerCenterId);
    if (scoped.length > 0) return scoped;
    for (const student of allStudents) {
      if (isOnboardingItem(student)) continue;
      if (student.center?.id === managerCenterId) {
        return [{ id: student.center.id, name: student.center.name }];
      }
      if (student.group?.center?.id === managerCenterId) {
        return [{ id: student.group.center.id, name: student.group.center.name }];
      }
    }
    return scoped;
  }, [centersData?.items, managerCenterId, allStudents]);

  const sortedVisibleCenters = useMemo(
    () => [...allCenters].sort((a, b) => a.name.localeCompare(b.name)),
    [allCenters],
  );

  const studentsByCenter = useMemo(
    () => groupStudentsByCenter(allStudents, allCenters),
    [allStudents, allCenters],
  );

  const hasUnassignedStudents = (studentsByCenter.unassigned?.length || 0) > 0;

  const [centerTabSelection, setCenterTabSelection] = useState<string | null>(null);

  const activeCenterTabId = useMemo((): string | null => {
    const hasStrip = sortedVisibleCenters.length > 0 || hasUnassignedStudents;
    if (!hasStrip) {
      return null;
    }
    if (sortedVisibleCenters.length === 0) {
      return hasUnassignedStudents ? 'unassigned' : null;
    }
    if (centerTabSelection === 'unassigned' && hasUnassignedStudents) {
      return 'unassigned';
    }
    if (
      centerTabSelection &&
      sortedVisibleCenters.some((center) => center.id === centerTabSelection)
    ) {
      return centerTabSelection;
    }
    return sortedVisibleCenters[0]?.id ?? null;
  }, [sortedVisibleCenters, hasUnassignedStudents, centerTabSelection]);

  useEffect(() => {
    if (sortedVisibleCenters.length === 0) {
      setCenterTabSelection(hasUnassignedStudents ? 'unassigned' : null);
      return;
    }

    const activeStillExists =
      centerTabSelection === 'unassigned'
        ? hasUnassignedStudents
        : sortedVisibleCenters.some((center) => center.id === centerTabSelection);

    if (activeStillExists) {
      return;
    }

    setCenterTabSelection(sortedVisibleCenters[0].id);
  }, [centerTabSelection, hasUnassignedStudents, sortedVisibleCenters]);

  const handleActiveCenterTabChange = useCallback((centerId: string) => {
    setCenterTabSelection(centerId);
    setPage(0);
    setSelectedStudentIds(new Set());
  }, []);

  const listSourceStudents = useMemo(() => {
    if (viewMode !== 'list') {
      return allStudents;
    }
    const hasCenterStrip = sortedVisibleCenters.length > 0 || hasUnassignedStudents;
    if (!hasCenterStrip) {
      return allStudents;
    }
    if (activeCenterTabId === 'unassigned') {
      return studentsByCenter.unassigned ?? [];
    }
    if (activeCenterTabId) {
      return studentsByCenter[activeCenterTabId] ?? [];
    }
    return [];
  }, [
    viewMode,
    allStudents,
    sortedVisibleCenters.length,
    hasUnassignedStudents,
    studentsByCenter,
    activeCenterTabId,
  ]);

  const { students, totalStudents, totalPages } = useMemo(() => {
    if (viewMode === 'board') {
      return {
        students: allStudents,
        totalStudents: studentsData?.total || allStudents.length,
        totalPages: 1,
      };
    }
    const startIndex = page * PAGE_SIZE;
    const paginated = listSourceStudents.slice(startIndex, startIndex + PAGE_SIZE);
    return {
      students: paginated,
      totalStudents: listSourceStudents.length,
      totalPages: Math.max(1, Math.ceil(listSourceStudents.length / PAGE_SIZE)),
    };
  }, [viewMode, allStudents, listSourceStudents, page, studentsData?.total]);

  const uniqueStudentsCount = useMemo(() => {
    const apiTotal = studentsData?.total;
    if (typeof apiTotal === 'number') {
      return apiTotal;
    }
    return allStudents.length;
  }, [allStudents.length, studentsData?.total]);

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
    if (user?.role === 'MANAGER') return;
    if (selectedStudentIds.size === 0) return;
    setBulkDeleteError(null);
    setBulkDeleteSuccess(false);
    setIsBulkDeleteDialogOpen(true);
  };

  // Handle bulk delete confirmation
  const handleBulkDeleteConfirm = async () => {
    if (user?.role === 'MANAGER') return;
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
    if (user?.role === 'MANAGER') return;
    setSelectedStudent(student);
    setDeleteError(null);
    setDeleteSuccess(false);
    setIsDeleteDialogOpen(true);
  };

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (user?.role === 'MANAGER') return;
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

  // Handle edit button click — update URL so refresh keeps modal open
  const handleEditClick = (student: Student) => {
    isEditClosingRef.current = false;
    setSelectedStudent(student);
    setIsEditStudentOpen(true);
    setParams({ [EDIT_STUDENT_PARAM]: student.id }, { mode: 'push' });
  };

  const handleEditModalOpenChange = (open: boolean) => {
    if (open) {
      isEditClosingRef.current = false;
      setIsEditStudentOpen(true);
      return;
    }
    isEditClosingRef.current = true;
    setIsEditStudentOpen(false);
    setSelectedStudent(null);
    removeParams([EDIT_STUDENT_PARAM], { mode: 'replace' });
    setTimeout(() => {
      isEditClosingRef.current = false;
    }, 100);
  };

  // Handle message/feedback icon click — update URL so refresh keeps modal open
  const handleShowFeedback = (student: Student) => {
    isFeedbackClosingRef.current = false;
    setSelectedStudentForFeedback(student);
    setIsFeedbackModalOpen(true);
    setParams({ feedback: student.id }, { mode: 'push' });
  };

  const handleFeedbackModalOpenChange = (open: boolean) => {
    if (open) {
      isFeedbackClosingRef.current = false;
      setIsFeedbackModalOpen(true);
      return;
    }
    isFeedbackClosingRef.current = true;
    setIsFeedbackModalOpen(false);
    setSelectedStudentForFeedback(null);
    removeParams(['feedback'], { mode: 'replace' });
    setTimeout(() => {
      isFeedbackClosingRef.current = false;
    }, 100);
  };

  // Handle deactivate/activate — open confirmation dialog
  const handleDeactivateClick = (student: Student) => {
    setDeactivateError(null);
    setSelectedStudentForStatusChange(student);
    setIsStatusDialogOpen(true);
  };

  const handleStatusConfirm = async (reason?: string) => {
    const student = selectedStudentForStatusChange;
    if (!student) return;

    const isCurrentlyActive = student.user?.status === 'ACTIVE';
    const newStatus = isCurrentlyActive ? 'INACTIVE' : 'ACTIVE';

    setDeactivateError(null);
    setDeactivateSuccess(false);

    try {
      const data: { status: 'ACTIVE' | 'INACTIVE'; notes?: string } = { status: newStatus };
      if (isCurrentlyActive) {
        const trimmedReason = reason?.trim();
        if (!trimmedReason) {
          setDeactivateError(t('deactivateReasonRequired'));
          return;
        }
        data.notes = buildStudentStatusNote(
          student.notes,
          t('deactivatedNoteLabel'),
          trimmedReason,
        );
      } else {
        data.notes = buildStudentStatusNote(student.notes, t('activatedNoteLabel'));
      }

      await updateStudent.mutateAsync({
        id: student.id,
        data,
      });
      setDeactivateSuccess(true);
      setIsStatusDialogOpen(false);
      setSelectedStudentForStatusChange(null);

      setTimeout(() => {
        startTransition(() => setDeactivateSuccess(false));
      }, 3000);
    } catch (err: unknown) {
      const message = getErrorMessage(
        err,
        `Failed to ${isCurrentlyActive ? 'deactivate' : 'activate'} student. Please try again.`,
      );
      setDeactivateError(message);
    }
  };

  const handleStatusDialogOpenChange = (open: boolean) => {
    setIsStatusDialogOpen(open);
    if (!open) {
      setSelectedStudentForStatusChange(null);
      setDeactivateError(null);
    }
  };

  // Handle inline updates
  const handleGroupChange = async (studentId: string, groupId: string | null) => {
    const row = students.find((s): s is Student => !isOnboardingItem(s) && s.id === studentId);
    const allGroups = groupsData?.items ?? [];
    const group = groupId ? allGroups.find((g) => g.id === groupId) : undefined;
    const teacherId = groupId ? resolveTeacherIdFromGroup(group) : undefined;
    const shouldSyncCenter = Boolean(groupId && group?.centerId && !row?.centerId);

    await updateStudent.mutateAsync({
      id: studentId,
      data: {
        groupId: groupId === null ? null : groupId,
        teacherId: groupId === null ? null : teacherId,
        ...(shouldSyncCenter ? { centerId: group!.centerId } : {}),
      },
    });
  };

  const handleCenterChange = async (studentId: string, centerId: string | null) => {
    const row = students.find((s): s is Student => !isOnboardingItem(s) && s.id === studentId);
    const prevCenterId = row?.centerId ?? null;
    const nextCenterId = centerId;
    const centerChanged = row ? prevCenterId !== nextCenterId : true;
    await updateStudent.mutateAsync({
      id: studentId,
      data: {
        centerId: nextCenterId === null ? null : nextCenterId,
        ...(centerChanged ? { teacherId: null, groupId: null } : {}),
      },
    });
  };

  const handleRegisterDateChange = async (studentId: string, date: string | null) => {
    await updateStudent.mutateAsync({
      id: studentId,
      data: { registerDate: date },
    });
  };

  const teachers = useMemo(() => teachersData?.items ?? [], [teachersData?.items]);

  // Full groups list with teacherId for per-row filtering (group options are filtered by selected center in table)
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
      { id: 'NEW', label: t('lifecycleNew') },
      { id: 'UNGROUPED', label: t('lifecycleUngrouped') },
      { id: 'RISK', label: tAnalytics('riskBadge') },
      { id: 'HIGH_RISK', label: tAnalytics('highRisk') },
    ],
    [t, tAnalytics],
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
    setParams({ studentId: student.id }, { mode: 'push' });
  };

  const handleStudentDetailsClose = () => {
    setIsStudentDetailsModalOpen(false);
    setSelectedStudentIdForDetails(null);
    removeParams(['studentId'], { mode: 'replace' });
  };

  // Stats calculation (only full students have user.status; onboarding items are not counted as active)
  const activeStudents = allStudents.filter((s): s is Student => 'user' in s && s.user?.status === 'ACTIVE').length;
  const studentsWithGroup = allStudents.filter(s => s.group).length;
  // Use backend-provided totalMonthlyFees (calculated from all matching students, respecting filters, independent of pagination)
  const totalFees = studentsData?.totalMonthlyFees || 0;

  return {
    // Data
    students,
    totalStudents,
    totalPages,
    allCenters,
    sortedVisibleCenters,
    studentsByCenter,
    uniqueStudentsCount,
    activeCenterTabId,
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
    editStudentIdFromUrl,
    isDeleteDialogOpen,
    isBulkDeleteDialogOpen,
    isStatusDialogOpen,
    selectedStudentForStatusChange,
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
    teachers,
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
    isManager: user?.role === 'MANAGER',
    
    // Handlers
    setSearchQuery,
    handleSearchChange,
    handlePageChange,
    setViewMode,
    updateViewModeInUrl,
    handleSort,
    handleActiveCenterTabChange,
    handleToggleSelect,
    handleSelectAll,
    handleBulkDeleteClick,
    handleBulkDeleteConfirm,
    handleDeleteClick,
    handleDeleteConfirm,
    handleEditClick,
    handleEditModalOpenChange,
    handleDeactivateClick,
    handleStatusConfirm,
    handleStatusDialogOpenChange,
    handleShowFeedback,
    handleFeedbackModalOpenChange,
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
    tAnalytics,
    tStatus,
    locale,
    
    // Constants
    pageSize: PAGE_SIZE,
    now: nowForPage,
  };
}

