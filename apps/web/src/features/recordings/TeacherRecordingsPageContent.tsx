'use client';

import { useTranslations } from 'next-intl';
import {
  StudentCard,
  StudentFieldLabel,
  StudentGhostButton,
  StudentInput,
  StudentPageStack,
  studentInputClass,
  studentTableHeadClass,
} from '@/features/student-ui';
import { AdminPaginationControls, DatePickerInput } from '@/shared/components/ui';
import { cn } from '@/shared/lib/utils';
import { VoiceMessagePlayer } from '@/features/chat/components/VoiceMessagePlayer';
import { MultiSelectChipsDropdown } from '@/shared/components/ui/multi-select-chips-dropdown';
import type { AdminStudentRecording } from '@/features/chat/api/chat.api';
import {
  formatDateTime,
  formatIsoDay,
  getStudentFullName,
} from './teacher-recordings.utils';
import type { useTeacherRecordingsPage } from './useTeacherRecordingsPage';

type TeacherRecordingsPageState = ReturnType<typeof useTeacherRecordingsPage>;

export type TeacherRecordingsPageContentProps = TeacherRecordingsPageState;

export function TeacherRecordingsPageContent({
  t,
  isIPad,
  selectedGroupIds,
  setSelectedGroupIds,
  selectedStudentUserIds,
  setSelectedStudentUserIds,
  search,
  setSearch,
  dateFrom,
  setDateFrom,
  dateTo,
  setDateTo,
  selectedRecordingIds,
  activeRecordingId,
  setActiveRecordingId,
  cardsListStartRef,
  isLoading,
  isLoadingDirectory,
  groupMultiOptions,
  studentMultiOptions,
  visibleRecordings,
  paginatedRecordings,
  allVisibleSelected,
  toggleAll,
  toggleOne,
  resetFilters,
  goToPage,
  safePage,
  totalPages,
}: TeacherRecordingsPageContentProps) {
  const tCommon = useTranslations('common');

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
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#8b8b90]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <StudentInput
                id="recordings-search"
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={t('searchPlaceholder')}
                className="pl-10"
              />
            </div>
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
        <div className="mt-4 flex items-center justify-center lg:justify-start">
          <AdminPaginationControls
            page={safePage}
            totalPages={totalPages}
            onPageChange={goToPage}
            previousLabel={tCommon('previousPage')}
            nextLabel={tCommon('nextPage')}
          />
        </div>
      )}
    </StudentPageStack>
  );
}
