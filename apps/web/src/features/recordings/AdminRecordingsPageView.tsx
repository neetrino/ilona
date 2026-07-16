'use client';

import { portalPageStackClass } from '@/shared/lib/portal-theme';
import { DatePickerInput, AdminPaginationControls } from '@/shared/components/ui';
import { MultiSelectChipsDropdown } from '@/shared/components/ui/multi-select-chips-dropdown';
import { cn } from '@/shared/lib/utils';
import {
  ADMIN_DATE_INPUT_CLASS,
  ADMIN_OUTLINE_BUTTON_CLASS,
  ADMIN_SEARCH_INPUT_CLASS,
} from '@/shared/lib/admin-control-theme';
import { AdminRecordingsStudentList } from './AdminRecordingsStudentList';
import { AdminStudentRecordingsSheet } from './AdminStudentRecordingsSheet';
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
  selectedStudent,
  openStudentHistory,
  closeStudentHistory,
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
  clearAllFilters,
  goToPage,
}: AdminRecordingsPageViewProps) {
  return (
    <div className={portalPageStackClass}>
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
              className="mb-1.5 block text-sm font-medium text-[#3b3b40]"
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
              className="mb-1.5 block text-sm font-medium text-[#3b3b40]"
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

      <div className="flex w-full min-w-0 flex-col">
        <div className="flex flex-col gap-4 md:flex-row md:items-end">
          <div className="flex-1">
            <label
              htmlFor="rec-search"
              className="mb-1.5 block text-sm font-medium text-[#8b8b90]"
            >
              {tCommon('search')}
            </label>
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
              <input
                id="rec-search"
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={t('searchPlaceholder')}
                className={ADMIN_SEARCH_INPUT_CLASS}
              />
            </div>
          </div>
          <button
            type="button"
            onClick={clearAllFilters}
            className={cn(
              ADMIN_OUTLINE_BUTTON_CLASS,
              'bg-[#f6f6f7] text-[#3b3b40] transition-colors hover:bg-[#f6f6f7]',
            )}
          >
            {t('clearAll')}
          </button>
        </div>

        <div className="mb-2 mt-10 text-sm text-[#8b8b90]">
          {t('studentsShown', { count: visibleRecordings.length })}
        </div>

        <AdminRecordingsStudentList
          t={t}
          tCommon={tCommon}
          isIPad={isIPad}
          isLoading={isLoading}
          isLoadingDirectory={isLoadingDirectory}
          studentDirectoryLength={studentDirectory.length}
          visibleCount={visibleRecordings.length}
          paginatedRecordings={paginatedRecordings}
          activeRecordingId={activeRecordingId}
          setActiveRecordingId={setActiveRecordingId}
          openStudentHistory={openStudentHistory}
          cardsListStartRef={cardsListStartRef}
        />

        {visibleRecordings.length > 0 ? (
          <div className="mt-4 flex items-center justify-center lg:justify-start">
            <AdminPaginationControls
              page={safePage}
              totalPages={totalPages}
              onPageChange={goToPage}
              previousLabel={tCommon('previousPage')}
              nextLabel={tCommon('nextPage')}
            />
          </div>
        ) : null}
      </div>

      <AdminStudentRecordingsSheet
        open={selectedStudent !== null}
        onClose={closeStudentHistory}
        studentUserId={selectedStudent?.studentUserId ?? null}
        studentFullName={selectedStudent?.studentFullName ?? ''}
        groupName={selectedStudent?.groupName ?? ''}
      />
    </div>
  );
}
