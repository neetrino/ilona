'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';
import {
  StudentCard,
  StudentFieldLabel,
  StudentGhostButton,
  StudentInput,
  StudentPageStack,
  studentInputClass,
  studentTableHeadClass,
} from '@/features/student-ui';
import { DatePickerInput } from '@/shared/components/ui';
import { cn } from '@/shared/lib/utils';
import { VoiceMessagePlayer } from '@/features/chat/components/VoiceMessagePlayer';
import { MultiSelectChipsDropdown } from '@/shared/components/ui/multi-select-chips-dropdown';
import { useIsIPad } from '@/shared/hooks/useIsIPad';
import {
  fetchTeacherStudentRecordings,
  type AdminStudentRecording,
} from '@/features/chat/api/chat.api';
import { chatKeys } from '@/features/chat/hooks/useChat';
import { fetchMyAssignedStudents } from '@/features/students/api/students.api';
import { useMyGroups } from '@/features/groups/hooks/useGroups';
import {
  isOnboardingItem,
  type Student,
  type TeacherAssignedItem,
} from '@/features/students/types';

function getStudentFullName(recording: AdminStudentRecording): string {
  return (
    `${recording.student.firstName} ${recording.student.lastName}`.trim() ||
    recording.student.userId
  );
}

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatIsoDay(value: string): string {
  return new Date(value).toISOString().slice(0, 10);
}

const DIRECTORY_PAGE_SIZE = 100;
const RECORDINGS_PAGE_SIZE = 5;
const IPAD_RECORDINGS_PAGE_SIZE = 10;
const FILTERS_STORAGE_KEY = 'teacher-recordings:filters-v1';

function isFullStudent(item: TeacherAssignedItem): item is Student {
  return !isOnboardingItem(item);
}

async function fetchAllAssignedStudentsDirectory(): Promise<Student[]> {
  const students: Student[] = [];
  let skip = 0;

  for (;;) {
    const page = await fetchMyAssignedStudents({ skip, take: DIRECTORY_PAGE_SIZE });
    const fullStudents = page.items.filter(isFullStudent);
    students.push(...fullStudents);
    skip += page.items.length;
    if (skip >= page.total || page.items.length === 0) break;
  }

  return students;
}

export default function TeacherRecordingsPage() {
  const tNav = useTranslations('nav');
  const t = useTranslations('recordings');
  const tCommon = useTranslations('common');
  const isIPad = useIsIPad();
  const recordingsPageSize = isIPad ? IPAD_RECORDINGS_PAGE_SIZE : RECORDINGS_PAGE_SIZE;
  const [selectedGroupIds, setSelectedGroupIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [selectedStudentUserIds, setSelectedStudentUserIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(0);
  const [selectedRecordingIds, setSelectedRecordingIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [activeRecordingId, setActiveRecordingId] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const cardsListStartRef = useRef<HTMLDivElement | null>(null);

  const { data: myGroups = [], isLoading: isLoadingGroups } = useMyGroups();

  const { data: recordings = [], isLoading } = useQuery({
    queryKey: [...chatKeys.all, 'teacher', 'student-recordings'],
    queryFn: () => fetchTeacherStudentRecordings(),
    refetchInterval: 15_000,
    refetchOnWindowFocus: true,
  });

  const { data: allStudents = [], isLoading: isLoadingStudents } = useQuery({
    queryKey: [...chatKeys.all, 'teacher', 'recordings-directory', 'students'],
    queryFn: fetchAllAssignedStudentsDirectory,
    staleTime: 60_000,
  });

  const isLoadingDirectory = isLoadingGroups || isLoadingStudents;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const raw = localStorage.getItem(FILTERS_STORAGE_KEY);
    if (!raw) {
      setIsHydrated(true);
      return;
    }
    try {
      const parsed = JSON.parse(raw) as {
        groupIds?: string[];
        studentIds?: string[];
        search?: string;
        dateFrom?: string;
        dateTo?: string;
      };
      setSelectedGroupIds(new Set(parsed.groupIds ?? []));
      setSelectedStudentUserIds(new Set(parsed.studentIds ?? []));
      setSearch(parsed.search ?? '');
      setDateFrom(parsed.dateFrom ?? '');
      setDateTo(parsed.dateTo ?? '');
    } finally {
      setIsHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!isHydrated || typeof window === 'undefined') return;
    const noFilters =
      selectedGroupIds.size === 0 &&
      selectedStudentUserIds.size === 0 &&
      !search &&
      !dateFrom &&
      !dateTo;
    if (noFilters) {
      localStorage.removeItem(FILTERS_STORAGE_KEY);
      return;
    }
    localStorage.setItem(
      FILTERS_STORAGE_KEY,
      JSON.stringify({
        groupIds: Array.from(selectedGroupIds),
        studentIds: Array.from(selectedStudentUserIds),
        search,
        dateFrom,
        dateTo,
      }),
    );
  }, [isHydrated, selectedGroupIds, selectedStudentUserIds, search, dateFrom, dateTo]);

  const studentDirectory = useMemo(
    () =>
      allStudents
        .map((student) => ({
          userId: student.userId,
          fullName:
            `${student.user.firstName} ${student.user.lastName}`.trim() ||
            student.userId,
          groupId: student.group?.id ?? null,
          groupName: student.group?.name ?? t('ungrouped'),
        }))
        .sort((a, b) => a.fullName.localeCompare(b.fullName)),
    [allStudents, t],
  );

  const groupOptions = useMemo(() => {
    const map = new Map<string, { id: string; name: string }>();

    myGroups.forEach((group) => {
      map.set(group.id, { id: group.id, name: group.name });
    });

    const hasUngrouped = studentDirectory.some((student) => student.groupId === null);
    if (hasUngrouped) {
      map.set('ungrouped', { id: 'ungrouped', name: t('ungrouped') });
    }

    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [myGroups, studentDirectory, t]);

  const groupMultiOptions = useMemo(
    () => groupOptions.map((group) => ({ id: group.id, label: group.name })),
    [groupOptions],
  );

  const studentMultiOptions = useMemo(() => {
    const rows =
      selectedGroupIds.size === 0
        ? studentDirectory
        : studentDirectory.filter((s) =>
            selectedGroupIds.has(s.groupId ?? 'ungrouped'),
          );
    return rows.map((s) => ({
      id: s.userId,
      label: `${s.fullName} (${s.groupName})`,
    }));
  }, [studentDirectory, selectedGroupIds]);

  const visibleRecordings = useMemo(() => {
    const query = search.trim().toLowerCase();
    const fromTs = dateFrom ? new Date(`${dateFrom}T00:00:00`).getTime() : null;
    const toTs = dateTo ? new Date(`${dateTo}T23:59:59.999`).getTime() : null;

    return recordings
      .filter((recording) => {
        const recordingGroupId = recording.group.id ?? 'ungrouped';
        if (
          selectedGroupIds.size > 0 &&
          !selectedGroupIds.has(recordingGroupId)
        ) {
          return false;
        }
        if (
          selectedStudentUserIds.size > 0 &&
          !selectedStudentUserIds.has(recording.student.userId)
        ) {
          return false;
        }
        const ts = new Date(recording.createdAt).getTime();
        if (fromTs !== null && ts < fromTs) return false;
        if (toTs !== null && ts > toTs) return false;
        if (!query) return true;
        const haystack = [
          getStudentFullName(recording),
          recording.group.name,
          recording.fileName ?? '',
        ]
          .join(' ')
          .toLowerCase();
        return haystack.includes(query);
      })
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
  }, [recordings, selectedGroupIds, selectedStudentUserIds, search, dateFrom, dateTo]);

  useEffect(() => {
    setPage(0);
  }, [selectedGroupIds, selectedStudentUserIds, search, dateFrom, dateTo]);

  const totalPages = Math.max(1, Math.ceil(visibleRecordings.length / recordingsPageSize));
  const safePage = Math.min(page, totalPages - 1);
  const paginatedRecordings = useMemo(
    () =>
      visibleRecordings.slice(
        safePage * recordingsPageSize,
        safePage * recordingsPageSize + recordingsPageSize,
      ),
    [safePage, visibleRecordings, recordingsPageSize],
  );
  const rangeStart =
    visibleRecordings.length === 0 ? 0 : safePage * recordingsPageSize + 1;
  const rangeEnd = Math.min(
    (safePage + 1) * recordingsPageSize,
    visibleRecordings.length,
  );

  useEffect(() => {
    setSelectedRecordingIds((prev) => {
      if (prev.size === 0) return prev;
      const visibleIds = new Set(visibleRecordings.map((r) => r.id));
      const next = new Set<string>();
      prev.forEach((id) => visibleIds.has(id) && next.add(id));
      return next.size === prev.size ? prev : next;
    });
  }, [visibleRecordings]);

  const allVisibleSelected =
    visibleRecordings.length > 0 &&
    visibleRecordings.every((r) => selectedRecordingIds.has(r.id));

  const toggleAll = () => {
    if (allVisibleSelected) {
      setSelectedRecordingIds(new Set());
      return;
    }
    setSelectedRecordingIds(new Set(visibleRecordings.map((r) => r.id)));
  };

  const toggleOne = (id: string) => {
    setSelectedRecordingIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const resetFilters = () => {
    setSelectedGroupIds(new Set());
    setSelectedStudentUserIds(new Set());
    setSearch('');
    setDateFrom('');
    setDateTo('');
  };

  const goToPage = (nextPage: number) => {
    setPage(nextPage);
    requestAnimationFrame(() => {
      cardsListStartRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    });
  };

  const renderRecordingPlayback = (recording: AdminStudentRecording) => {
    const isActive = activeRecordingId === recording.id;
    if (isActive) {
      return (
        <div className="w-full">
          <VoiceMessagePlayer
            fileUrl={recording.fileUrl}
            duration={recording.duration}
            fileName={recording.fileName}
          />
        </div>
      );
    }
    return (
      <button
        type="button"
        onClick={() => setActiveRecordingId(recording.id)}
        className="inline-flex items-center gap-2 rounded-lg border border-[#1010a3]/20 px-3 py-1.5 text-sm font-medium text-[#1010a3] transition-colors hover:bg-[#1010a3]/5"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        {t('play')}
      </button>
    );
  };

  return (
    <DashboardLayout
      title={tNav('recordings')}
      subtitle={tNav('adminRecordingsSubtitle')}
    >
      <StudentPageStack>
      <StudentCard>
      <div className="grid w-full min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:items-end">
        <div className="min-w-0 sm:col-span-2 lg:col-span-1">
          <StudentFieldLabel>{tCommon('group')}</StudentFieldLabel>
          <MultiSelectChipsDropdown
            options={groupMultiOptions}
            selectedIds={selectedGroupIds}
            onSelectionChange={setSelectedGroupIds}
            showSelectedChipsOnlyWhenOpen
            hideSelectedLabelsInTrigger
            placeholder={t('allGroups')}
            searchPlaceholder={t('searchGroups')}
            emptyOptionsHint={t('noGroups')}
            noResultsHint={t('noGroupsMatch')}
            isLoading={isLoadingDirectory}
            maxChipsHeightClassName="max-h-28"
          />
        </div>
        <div className="min-w-0 sm:col-span-2 lg:col-span-1">
          <StudentFieldLabel>{tCommon('searchTypeStudent')}</StudentFieldLabel>
          <MultiSelectChipsDropdown
            options={studentMultiOptions}
            selectedIds={selectedStudentUserIds}
            onSelectionChange={setSelectedStudentUserIds}
            showSelectedChipsOnlyWhenOpen
            hideSelectedLabelsInTrigger
            placeholder={t('allStudents')}
            searchPlaceholder={t('searchStudents')}
            emptyOptionsHint={t('noStudents')}
            noResultsHint={t('noStudentsMatch')}
            isLoading={isLoadingDirectory}
            maxChipsHeightClassName="max-h-28"
          />
        </div>
        <div className="min-w-0">
          <StudentFieldLabel htmlFor="recordings-from">{tCommon('from')}</StudentFieldLabel>
          <DatePickerInput
            id="recordings-from"
            value={dateFrom}
            max={dateTo || undefined}
            onValueChange={setDateFrom}
            className={studentInputClass}
          />
        </div>
        <div className="min-w-0">
          <StudentFieldLabel htmlFor="recordings-to">{tCommon('to')}</StudentFieldLabel>
          <DatePickerInput
            id="recordings-to"
            value={dateTo}
            min={dateFrom || undefined}
            onValueChange={setDateTo}
            className={studentInputClass}
          />
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="min-w-0 flex-1">
          <StudentFieldLabel htmlFor="recordings-search">{tCommon('search')}</StudentFieldLabel>
          <StudentInput
            id="recordings-search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t('searchPlaceholder')}
          />
        </div>
        <StudentGhostButton
          type="button"
          onClick={resetFilters}
          className="h-11 w-full shrink-0 justify-center sm:w-auto"
        >
          {t('clearAll')}
        </StudentGhostButton>
      </div>
      </StudentCard>

      <div className="text-sm text-[#8b8b90]">
        {t('recordingsFound', { count: visibleRecordings.length })}
        {selectedRecordingIds.size > 0 && (
          <span className="ml-3 text-[#3b3b40] font-medium">
            {t('selectedCount', { count: selectedRecordingIds.size })}
          </span>
        )}
      </div>

      <div ref={cardsListStartRef} />
      <div
        className={cn(
          isIPad ? 'grid grid-cols-2 gap-3' : 'space-y-3',
          !isIPad && 'sm:hidden',
        )}
      >
        {isLoading || isLoadingDirectory ? (
          Array.from({ length: 4 }).map((_, idx) => (
            <div
              key={`mobile-skeleton-${idx}`}
              className="rounded-2xl border border-[rgba(14,14,16,0.08)] bg-white p-4"
            >
              <div className="h-5 w-32 animate-pulse rounded bg-[#f6f6f7]" />
              <div className="mt-2 h-4 w-40 animate-pulse rounded bg-[#f6f6f7]" />
              <div className="mt-3 h-4 w-28 animate-pulse rounded bg-[#f6f6f7]" />
              <div className="mt-4 h-9 w-32 animate-pulse rounded-lg bg-[#f6f6f7]" />
            </div>
          ))
        ) : visibleRecordings.length === 0 ? (
          <div className="rounded-2xl border border-[rgba(14,14,16,0.08)] bg-white px-4 py-10 text-center text-sm text-[#8b8b90]">
            {t('noRecordingsForFilters')}
          </div>
        ) : (
          paginatedRecordings.map((recording) => (
            <article
              key={`mobile-${recording.id}`}
              className="rounded-2xl border border-[rgba(14,14,16,0.08)] bg-white px-4 py-3.5 shadow-[0_1px_2px_rgba(14,14,16,0.03)]"
            >
              <div className="min-w-0">
                <p className="truncate text-[1.35rem] font-semibold leading-tight tracking-[-0.01em] text-[#1f2937]">
                  {recording.group.name}
                </p>
                <p className="mt-1 truncate text-[1rem] text-[#3b3b40]">
                  {getStudentFullName(recording)}
                </p>
                <div className="mt-2 flex items-start gap-2 text-[#8b8b90]">
                  <svg
                    className="mt-[2px] h-4 w-4 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10m-11 9h12a2 2 0 002-2V7a2 2 0 00-2-2H6a2 2 0 00-2 2v11a2 2 0 002 2z"
                    />
                  </svg>
                  <div className="text-[1.05rem] leading-snug">
                    <p>{t('dateTime')}</p>
                    <p className="text-[#3b3b40]">
                      {formatDateTime(recording.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-3 flex justify-end">
                {renderRecordingPlayback(recording)}
              </div>
            </article>
          ))
        )}
      </div>

      <StudentCard noPadding className={cn('hidden', !isIPad && 'sm:block')}>
        <div className="min-w-0 overflow-x-auto">
          <table className="w-full min-w-[48rem] text-sm">
            <thead className={cn(studentTableHeadClass, 'border-b border-[rgba(14,14,16,0.07)]')}>
              <tr>
                <th className="w-12 px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    aria-label={t('selectAllVisible')}
                    className="w-4 h-4 rounded border-[rgba(14,14,16,0.07)] cursor-pointer"
                    checked={allVisibleSelected}
                    onChange={toggleAll}
                    disabled={visibleRecordings.length === 0}
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#8b8b90]">
                  {tCommon('group')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#8b8b90]">
                  {tCommon('searchTypeStudent')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#8b8b90]">
                  {t('dateTime')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#8b8b90]">
                  {t('recording')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(14,14,16,0.07)]">
              {isLoading || isLoadingDirectory ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={`skeleton-${idx}`}>
                    <td className="px-4 py-4"><div className="h-4 w-4 bg-[#f6f6f7] animate-pulse rounded" /></td>
                    <td className="px-4 py-4"><div className="h-4 w-24 bg-[#f6f6f7] animate-pulse rounded" /></td>
                    <td className="px-4 py-4"><div className="h-4 w-32 bg-[#f6f6f7] animate-pulse rounded" /></td>
                    <td className="px-4 py-4"><div className="h-4 w-28 bg-[#f6f6f7] animate-pulse rounded" /></td>
                    <td className="px-4 py-4"><div className="h-8 w-48 bg-[#f6f6f7] animate-pulse rounded" /></td>
                  </tr>
                ))
              ) : visibleRecordings.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-[#8b8b90]">
                    {t('noRecordingsForFilters')}
                  </td>
                </tr>
              ) : (
                paginatedRecordings.map((recording) => {
                  const isActive = activeRecordingId === recording.id;
                  return (
                    <tr key={recording.id} className="hover:bg-[#fafafa]/60 transition-colors">
                      <td className="px-4 py-3 align-middle">
                        <input
                          type="checkbox"
                          aria-label={t('selectRecording', { id: recording.id })}
                          className="w-4 h-4 rounded border-[rgba(14,14,16,0.07)] cursor-pointer"
                          checked={selectedRecordingIds.has(recording.id)}
                          onChange={() => toggleOne(recording.id)}
                        />
                      </td>
                      <td className="px-4 py-3 align-middle text-sm text-[#3b3b40]">
                        {recording.group.name}
                      </td>
                      <td className="px-4 py-3 align-middle text-sm font-medium text-[#1010a3]">
                        {getStudentFullName(recording)}
                      </td>
                      <td className="px-4 py-3 align-middle whitespace-nowrap">
                        <div className="text-sm text-[#3b3b40]">{formatDateTime(recording.createdAt)}</div>
                        <div className="text-xs text-[#8b8b90]">{formatIsoDay(recording.createdAt)}</div>
                      </td>
                      <td className="px-4 py-3 align-middle">
                        {isActive ? (
                          <VoiceMessagePlayer
                            fileUrl={recording.fileUrl}
                            duration={recording.duration}
                            fileName={recording.fileName}
                          />
                        ) : (
                          <button
                            type="button"
                            onClick={() => setActiveRecordingId(recording.id)}
                            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-primary border border-primary/20 hover:bg-primary/5 rounded-lg transition-colors"
                          >
                            {t('play')}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </StudentCard>

      {visibleRecordings.length > 0 && (
        <div
          className={cn(
            'mt-4 flex items-center text-sm text-[#8b8b90]',
            isIPad ? 'justify-start gap-4' : 'justify-between sm:justify-start sm:gap-4',
          )}
        >
          <span>
            Showing {rangeStart}-{rangeEnd} of {visibleRecordings.length}
          </span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              className={cn(
                'inline-flex h-10 w-10 items-center justify-center rounded-full border transition-colors',
                safePage === 0
                  ? 'border-[#d9dde8] bg-[#f1f1f4] text-[#9aa3b5]'
                  : 'border-[rgba(14,14,16,0.12)] bg-white text-[#3b3b40] hover:bg-[#f6f6f7]',
              )}
              disabled={safePage === 0}
              onClick={() => goToPage(Math.max(0, safePage - 1))}
              aria-label={tCommon('previousPage')}
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="inline-flex h-10 min-w-10 items-center justify-center rounded-full bg-[#1010a3] px-3 text-sm font-semibold text-white">
              {safePage + 1}
            </span>
            <button
              type="button"
              className={cn(
                'inline-flex h-10 w-10 items-center justify-center rounded-full border transition-colors',
                safePage >= totalPages - 1
                  ? 'border-[#d9dde8] bg-[#f1f1f4] text-[#9aa3b5]'
                  : 'border-[rgba(14,14,16,0.12)] bg-white text-[#3b3b40] hover:bg-[#f6f6f7]',
              )}
              disabled={safePage >= totalPages - 1}
              onClick={() => goToPage(Math.min(totalPages - 1, safePage + 1))}
              aria-label={tCommon('nextPage')}
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      )}
      </StudentPageStack>
    </DashboardLayout>
  );
}
