'use client';

import { ChevronRight } from 'lucide-react';
import type { AdminRecordingsPageViewProps } from './useAdminRecordingsPage';

type ListProps = Pick<
  AdminRecordingsPageViewProps,
  | 't'
  | 'tCommon'
  | 'isIPad'
  | 'isLoading'
  | 'isLoadingDirectory'
  | 'paginatedRecordings'
  | 'openStudentHistory'
  | 'cardsListStartRef'
> & {
  studentDirectoryLength: number;
  visibleCount: number;
};

export function AdminRecordingsStudentList({
  t,
  tCommon,
  isIPad,
  isLoading,
  isLoadingDirectory,
  studentDirectoryLength,
  visibleCount,
  paginatedRecordings,
  openStudentHistory,
  cardsListStartRef,
}: ListProps) {
  const emptyLabel =
    studentDirectoryLength === 0 ? t('noStudentsInDirectory') : t('noStudentsForFilters');

  return (
    <>
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
              <div className="mt-4 h-4 w-24 animate-pulse rounded bg-[#f6f6f7]" />
            </div>
          ))
        ) : visibleCount === 0 ? (
          <div className="rounded-2xl border border-[rgba(14,14,16,0.08)] bg-white px-4 py-10 text-center text-sm text-[#8b8b90]">
            {emptyLabel}
          </div>
        ) : (
          paginatedRecordings.map((row) => (
            <article
              key={`mobile-${row.studentUserId}`}
              role="button"
              tabIndex={0}
              onClick={() => openStudentHistory(row)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  openStudentHistory(row);
                }
              }}
              className="cursor-pointer rounded-2xl border border-[rgba(14,14,16,0.08)] bg-white px-4 py-3.5 shadow-[0_1px_2px_rgba(14,14,16,0.03)] transition-colors hover:border-[rgba(16,16,163,0.2)] hover:bg-[#fafafa]"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[1.35rem] font-semibold leading-tight tracking-[-0.01em] text-[#1f2937]">
                    {row.groupName}
                  </p>
                  <p className="mt-1 truncate text-[1rem] text-[#3b3b40]">
                    {row.studentFullName}
                  </p>
                  <p className="mt-2 text-sm text-[#3b3b40]">
                    {row.recordingCount > 0
                      ? t('voiceCount', { count: row.recordingCount })
                      : t('noVoiceRecorded')}
                  </p>
                </div>
                <ChevronRight className="mt-1 h-5 w-5 shrink-0 text-[#8b8b90]" aria-hidden />
              </div>
            </article>
          ))
        )}
      </div>

      <div
        className={`hidden overflow-hidden rounded-xl border border-[rgba(14,14,16,0.07)] bg-white ${
          isIPad ? '' : 'sm:block'
        }`}
      >
        <div className="overflow-x-auto">
          <table className="w-full table-fixed">
            <thead className="border-b border-[rgba(14,14,16,0.07)] bg-[#fafafa]">
              <tr>
                <th className="w-1/3 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#8b8b90]">
                  {tCommon('group')}
                </th>
                <th className="w-1/3 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#8b8b90]">
                  {tCommon('searchTypeStudent')}
                </th>
                <th className="w-1/3 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#8b8b90]">
                  {t('recording')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(14,14,16,0.07)]">
              {isLoading || isLoadingDirectory ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={`skeleton-${idx}`}>
                    <td className="px-4 py-4">
                      <div className="h-4 w-24 animate-pulse rounded bg-[#f6f6f7]" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-4 w-32 animate-pulse rounded bg-[#f6f6f7]" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-4 w-20 animate-pulse rounded bg-[#f6f6f7]" />
                    </td>
                  </tr>
                ))
              ) : visibleCount === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-10 text-center text-sm text-[#8b8b90]">
                    {emptyLabel}
                  </td>
                </tr>
              ) : (
                paginatedRecordings.map((row) => (
                  <tr
                    key={row.studentUserId}
                    role="button"
                    tabIndex={0}
                    onClick={() => openStudentHistory(row)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        openStudentHistory(row);
                      }
                    }}
                    className="cursor-pointer transition-colors hover:bg-[#fafafa]"
                  >
                    <td className="w-1/3 px-4 py-3 align-middle text-sm text-[#3b3b40]">
                      <span className="block truncate">{row.groupName}</span>
                    </td>
                    <td className="w-1/3 px-4 py-3 align-middle">
                      <div className="flex min-w-0 items-center gap-1.5">
                        <span className="truncate text-sm font-medium text-[#3b3b40]">
                          {row.studentFullName}
                        </span>
                        <ChevronRight className="h-4 w-4 shrink-0 text-[#8b8b90]" aria-hidden />
                      </div>
                    </td>
                    <td className="w-1/3 px-4 py-3 align-middle text-sm text-[#3b3b40]">
                      {row.recordingCount > 0 ? (
                        t('voiceCount', { count: row.recordingCount })
                      ) : (
                        <span className="inline-flex items-center rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700">
                          {t('noVoiceRecorded')}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
