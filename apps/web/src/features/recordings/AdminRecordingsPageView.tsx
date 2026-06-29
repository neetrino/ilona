'use client';

import { portalPageStackClass } from '@/shared/lib/portal-theme';
import { DatePickerInput } from '@/shared/components/ui';
import { VoiceMessagePlayer } from '@/features/chat/components/VoiceMessagePlayer';
import { MultiSelectChipsDropdown } from '@/shared/components/ui/multi-select-chips-dropdown';
import { cn } from '@/shared/lib/utils';
import {
  ADMIN_DATE_INPUT_CLASS,
  ADMIN_FORM_INPUT_CLASS,
  ADMIN_OUTLINE_BUTTON_CLASS,
} from '@/shared/lib/admin-control-theme';
import { formatDateTime, formatIsoDay } from './admin-recordings.utils';
import type { AdminRecordingsPageViewProps } from './useAdminRecordingsPage';

export function AdminRecordingsPageView({
  t,
  tCommon,
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
  activeRecordingId,
  setActiveRecordingId,
  cardsListStartRef,
  isLoadingDirectory,
  groupMultiOptions,
  studentMultiOptions,
  studentDirectory,
  isLoading,
  visibleRecordings,
  paginatedRecordings,
  safePage,
  totalPages,
  rangeStart,
  rangeEnd,
  clearAllFilters,
  goToPage,
}: AdminRecordingsPageViewProps) {
  return (
    <div className={portalPageStackClass}>
      {/* Filters */}
      <div className="mb-2 grid w-full min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[repeat(auto-fit,minmax(min(100%,11rem),1fr))]">
        <div className="md:col-span-2">
          <MultiSelectChipsDropdown
            label={tCommon('group')}
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

        <div className="md:col-span-2">
          <MultiSelectChipsDropdown
            label={tCommon('searchTypeStudent')}
            options={studentMultiOptions}
            selectedIds={selectedStudentUserIds}
            onSelectionChange={setSelectedStudentUserIds}
            showSelectedChipsOnlyWhenOpen
            hideSelectedLabelsInTrigger
            placeholder={
              selectedGroupIds.size === 0 ? t('allStudents') : t('studentsInSelectedGroups')
            }
            searchPlaceholder={t('searchStudents')}
            emptyOptionsHint={
              selectedGroupIds.size === 0 ? t('noStudents') : t('noStudentsInGroups')
            }
            noResultsHint={t('noStudentsMatch')}
            isLoading={isLoadingDirectory}
            maxChipsHeightClassName="max-h-28"
          />
        </div>

        <div className="grid grid-cols-2 gap-3 sm:contents">
          <div>
            <label
              htmlFor="rec-date-from"
              className="block text-sm font-medium text-[#3b3b40] mb-1.5"
            >
              {tCommon('from')}
            </label>
            <DatePickerInput
              id="rec-date-from"
              value={dateFrom}
              max={dateTo || undefined}
              onValueChange={setDateFrom}
              className={ADMIN_DATE_INPUT_CLASS}
            />
          </div>

          <div>
            <label
              htmlFor="rec-date-to"
              className="block text-sm font-medium text-[#3b3b40] mb-1.5"
            >
              {tCommon('to')}
            </label>
            <DatePickerInput
              id="rec-date-to"
              value={dateTo}
              min={dateFrom || undefined}
              onValueChange={setDateTo}
              className={ADMIN_DATE_INPUT_CLASS}
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-end gap-4 mb-6">
        <div className="flex-1">
          <label
            htmlFor="rec-search"
            className="block text-sm font-medium text-[#3b3b40] mb-1.5"
          >
            {tCommon('search')}
          </label>
          <input
            id="rec-search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t('searchPlaceholder')}
            className={ADMIN_FORM_INPUT_CLASS}
          />
        </div>
        <button
          type="button"
          onClick={clearAllFilters}
          className={cn(ADMIN_OUTLINE_BUTTON_CLASS, 'bg-[#f6f6f7] text-[#3b3b40] transition-colors hover:bg-[#f6f6f7]')}
        >
          {t('clearAll')}
        </button>
      </div>

      <div className="mb-3 text-sm text-[#8b8b90]">
        {t('studentsShown', { count: visibleRecordings.length })}
      </div>

      {/* Mobile cards */}
      <div ref={cardsListStartRef} />
      <div
        className={`${
          isIPad ? 'grid grid-cols-2 gap-3' : 'space-y-3'
        } ${isIPad ? '' : 'sm:hidden'}`}
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
            {studentDirectory.length === 0
              ? t('noStudentsInDirectory')
              : t('noStudentsForFilters')}
          </div>
        ) : (
          paginatedRecordings.map((row) => {
            const recording = row.recording;
            const recordingId = recording?.id ?? null;
            const isActive =
              recordingId !== null && activeRecordingId === recordingId;
            return (
              <article
                key={`mobile-${row.studentUserId}`}
                className="rounded-2xl border border-[rgba(14,14,16,0.08)] bg-white px-4 py-3.5 shadow-[0_1px_2px_rgba(14,14,16,0.03)]"
              >
                <div className="min-w-0">
                  <p className="truncate text-[1.35rem] font-semibold leading-tight tracking-[-0.01em] text-[#1f2937]">
                    {row.groupName}
                  </p>
                  <p className="mt-1 truncate text-[1rem] text-[#3b3b40]">
                    {row.studentFullName}
                  </p>
                  <div className="mt-2 flex items-start gap-2 text-[#8b8b90]">
                    <svg
                      className="mt-[2px] h-4 w-4 shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
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
                        {recording ? formatDateTime(recording.createdAt) : '-'}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex justify-end">
                  {!recording ? (
                    <span className="inline-flex items-center rounded-xl border border-amber-300 px-3 py-1.5 text-sm font-medium text-amber-700">
                      {t('noVoiceRecorded')}
                    </span>
                  ) : isActive ? (
                    <div className="w-full">
                      <VoiceMessagePlayer
                        fileUrl={recording.fileUrl}
                        duration={recording.duration}
                        fileName={recording.fileName}
                      />
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setActiveRecordingId(recording.id)}
                      className="inline-flex items-center gap-2 rounded-lg border border-[#1010a3]/20 px-3 py-1.5 text-sm font-medium text-[#1010a3] transition-colors hover:bg-[#1010a3]/5"
                    >
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
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
                  )}
                </div>
              </article>
            );
          })
        )}
      </div>

      {/* Desktop table */}
      <div
        className={`hidden overflow-hidden rounded-xl border border-[rgba(14,14,16,0.07)] bg-white ${
          isIPad ? '' : 'sm:block'
        }`}
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#fafafa] border-b border-[rgba(14,14,16,0.07)]">
              <tr>
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
                    <td className="px-4 py-4">
                      <div className="h-4 w-24 bg-[#f6f6f7] animate-pulse rounded" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-4 w-32 bg-[#f6f6f7] animate-pulse rounded" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-4 w-28 bg-[#f6f6f7] animate-pulse rounded" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-8 w-48 bg-[#f6f6f7] animate-pulse rounded" />
                    </td>
                  </tr>
                ))
              ) : visibleRecordings.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-10 text-center text-sm text-[#8b8b90]"
                  >
                    {studentDirectory.length === 0
                      ? t('noStudentsInDirectory')
                      : t('noStudentsForFilters')}
                  </td>
                </tr>
              ) : (
                paginatedRecordings.map((row) => {
                  const recording = row.recording;
                  const recordingId = recording?.id ?? null;
                  const isActive =
                    recordingId !== null && activeRecordingId === recordingId;
                  return (
                    <tr
                      key={row.studentUserId}
                      className="hover:bg-[#fafafa]/60 transition-colors"
                    >
                      <td className="px-4 py-3 align-middle">
                        <span className="text-sm text-[#3b3b40]">
                          {row.groupName}
                        </span>
                      </td>
                      <td className="px-4 py-3 align-middle">
                        <span className="text-sm font-medium text-[#3b3b40]">
                          {row.studentFullName}
                        </span>
                      </td>
                      <td className="px-4 py-3 align-middle whitespace-nowrap">
                        {recording ? (
                          <>
                            <div className="text-sm text-[#3b3b40]">
                              {formatDateTime(recording.createdAt)}
                            </div>
                            <div className="text-xs text-[#8b8b90]">
                              {formatIsoDay(recording.createdAt)}
                            </div>
                          </>
                        ) : (
                          <span className="text-sm text-[#8b8b90]">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 align-middle">
                        {!recording ? (
                          <span className="inline-flex items-center rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700">
                            {t('noVoiceRecorded')}
                          </span>
                        ) : isActive ? (
                          <VoiceMessagePlayer
                            fileUrl={recording.fileUrl}
                            duration={recording.duration}
                            fileName={recording.fileName}
                          />
                        ) : (
                          <button
                            type="button"
                            onClick={() => setActiveRecordingId(recording.id)}
                            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-[#1010a3] border border-[#1010a3]/20 hover:bg-[#1010a3]/5 rounded-lg transition-colors"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
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
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {visibleRecordings.length > 0 && (
        <div className={`mt-4 flex items-center text-sm text-[#8b8b90] ${isIPad ? 'justify-start gap-4' : 'justify-between lg:justify-start lg:gap-4'}`}>
          <span>
            Showing {rangeStart}-{rangeEnd} of {visibleRecordings.length}
          </span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              className={`inline-flex h-10 w-10 items-center justify-center rounded-full border transition-colors ${
                safePage === 0
                  ? 'border-[#d9dde8] bg-[#f1f1f4] text-[#9aa3b5]'
                  : 'border-[rgba(14,14,16,0.12)] bg-white text-[#3b3b40] hover:bg-[#f6f6f7]'
              }`}
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
              className={`inline-flex h-10 w-10 items-center justify-center rounded-full border transition-colors ${
                safePage >= totalPages - 1
                  ? 'border-[#d9dde8] bg-[#f1f1f4] text-[#9aa3b5]'
                  : 'border-[rgba(14,14,16,0.12)] bg-white text-[#3b3b40] hover:bg-[#f6f6f7]'
              }`}
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
    </div>
  );
}
