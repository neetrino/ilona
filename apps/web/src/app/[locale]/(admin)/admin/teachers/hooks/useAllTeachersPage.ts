'use client';

import { useCallback, useEffect, useMemo, useRef, useState, startTransition } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useTeachers, type Teacher } from '@/features/teachers';
import { readUrlSearchParam } from '@/shared/lib/url-search-params';
import { useAppSearchUrl } from '@/shared/hooks/useAppSearchUrl';
import { filterTeachersByBranches, getTeacherCenters } from '../utils';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { getAdminPortalBasePath } from '@/shared/lib/role-routes';

const EDIT_TEACHER_URL_PARAM = 'editTeacherId';

export function useAllTeachersPage() {
  const params = useParams();
  const router = useRouter();
  const { searchParams, urlRevision, replaceParams, setParams, removeParams } = useAppSearchUrl();
  const locale = params.locale as string;
  const t = useTranslations('teachers');
  const tStatus = useTranslations('status');
  const { user } = useAuthStore();
  const portalBasePath = getAdminPortalBasePath(user?.role);
  const managerCenterId = user?.role === 'MANAGER' ? user.managerCenterId : undefined;

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [selectedBranchIds] = useState<Set<string>>(new Set());
  const [selectedStatus, setSelectedStatus] = useState<'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | ''>(() => {
    const statusFromUrl = readUrlSearchParam('status', searchParams);
    return (statusFromUrl === 'ACTIVE' || statusFromUrl === 'INACTIVE' || statusFromUrl === 'SUSPENDED')
      ? statusFromUrl
      : '';
  });
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      startTransition(() => {
        setDebouncedSearchQuery(searchQuery);
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data: teachersData, isLoading, error } = useTeachers({
    skip: 0,
    take: 500,
    search: debouncedSearchQuery || undefined,
    status: selectedStatus || undefined,
    sortOrder: 'asc',
  });

  const allTeachers = useMemo(() => teachersData?.items || [], [teachersData?.items]);

  const filteredTeachers = useMemo(() => {
    let result = filterTeachersByBranches(allTeachers, selectedBranchIds);
    if (managerCenterId) {
      result = result.filter((teacher) =>
        getTeacherCenters(teacher).some((center) => center.id === managerCenterId),
      );
    }
    return result;
  }, [allTeachers, selectedBranchIds, managerCenterId]);

  const selectedTeacherIdForDetails = readUrlSearchParam('teacherId', searchParams);
  const isDetailsDrawerOpen = Boolean(selectedTeacherIdForDetails);

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

  const setIsEditTeacherOpen = useCallback(
    (open: boolean) => {
      if (open) {
        isEditTeacherClosingRef.current = false;
        return;
      }
      isEditTeacherClosingRef.current = true;
      setSelectedTeacherIdForEdit(null);
      removeParams([EDIT_TEACHER_URL_PARAM], { mode: 'replace' });
      setTimeout(() => {
        isEditTeacherClosingRef.current = false;
      }, 100);
    },
    [removeParams],
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleStatusChange = (status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | '') => {
    setSelectedStatus(status);
    replaceParams({ status: status || null });
  };

  const isOpeningEditRef = useRef(false);

  const handleEditClick = (teacher: Teacher) => {
    isEditTeacherClosingRef.current = false;
    isOpeningEditRef.current = true;
    setSelectedTeacher(teacher);
    setSelectedTeacherIdForEdit(teacher.id);
    setParams({ [EDIT_TEACHER_URL_PARAM]: teacher.id }, { mode: 'push' });
    setTimeout(() => {
      isOpeningEditRef.current = false;
    }, 300);
  };

  const handleRowClick = (teacher: Teacher) => {
    setParams(
      {
        teacherId: teacher.id,
        [EDIT_TEACHER_URL_PARAM]: null,
      },
      { mode: 'push' },
    );
  };

  const handleDetailsDrawerClose = () => {
    if (isOpeningEditRef.current) {
      return;
    }
    isEditTeacherClosingRef.current = true;
    setSelectedTeacherIdForEdit(null);
    removeParams(['teacherId', EDIT_TEACHER_URL_PARAM], { mode: 'replace' });
    setTimeout(() => {
      isEditTeacherClosingRef.current = false;
    }, 100);
  };

  const handleBackToTeachers = useCallback(() => {
    router.push(`/${locale}${portalBasePath}/teachers`);
  }, [router, locale, portalBasePath]);

  return {
    t,
    tStatus,
    searchQuery,
    selectedStatus,
    filteredTeachers,
    isLoading,
    error,
    selectedTeacherIdForDetails,
    selectedTeacherIdForEdit,
    isDetailsDrawerOpen,
    isEditTeacherOpen,
    selectedTeacher,
    handleSearchChange,
    handleStatusChange,
    handleEditClick,
    handleRowClick,
    handleDetailsDrawerClose,
    handleBackToTeachers,
    setIsEditTeacherOpen,
    setSelectedTeacher,
  };
}
