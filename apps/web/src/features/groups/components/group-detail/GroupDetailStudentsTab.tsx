'use client';

import { useRef, useState } from 'react';
import { scrollListStartSoon } from '@/shared/lib/scroll-element-to-list-start';
import { useLocale, useTranslations } from 'next-intl';
import { useGroupStudents } from '../../hooks';
import { AdminPaginationControls } from '@/shared/components/ui';
import { GROUP_DETAIL_STUDENTS_PAGE_SIZE } from './group-detail.constants';

interface GroupDetailStudentsTabProps {
  groupId: string;
  onStudentSelect: (studentId: string) => void;
}

function formatEnrolledAt(dateStr: string, locale: string): string {
  try {
    const d = new Date(dateStr);
    return Number.isNaN(d.getTime())
      ? '—'
      : d.toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return '—';
  }
}

export function GroupDetailStudentsTab({ groupId, onStudentSelect }: GroupDetailStudentsTabProps) {
  const locale = useLocale();
  const t = useTranslations('groups');
  const tCommon = useTranslations('common');
  const [page, setPage] = useState(0);
  const listStartRef = useRef<HTMLDivElement | null>(null);
  const skip = page * GROUP_DETAIL_STUDENTS_PAGE_SIZE;
  const { data, isLoading, isError, error } = useGroupStudents(groupId, {
    skip,
    take: GROUP_DETAIL_STUDENTS_PAGE_SIZE,
  });

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, data?.totalPages ?? 1);

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-[rgba(14,14,16,0.07)] bg-white px-4 py-10 text-center text-sm text-[#8b8b90]">
        {t('loadingStudents')}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-10 text-center text-sm text-red-600">
        {error instanceof Error ? error.message : t('failedLoadStudents')}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-[rgba(14,14,16,0.07)] bg-white px-4 py-10 text-center text-sm text-[#8b8b90]">
        {t('noStudentsInGroup')}
      </div>
    );
  }

  return (
    <div ref={listStartRef} className="space-y-4">
      <div className="overflow-hidden rounded-2xl border border-[rgba(14,14,16,0.07)] bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-[rgba(14,14,16,0.07)] bg-[#fafafa]">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-[#3b3b40]">{tCommon('name')}</th>
              <th className="px-4 py-3 text-left font-semibold text-[#3b3b40]">{tCommon('status')}</th>
              <th className="hidden px-4 py-3 text-left font-semibold text-[#3b3b40] sm:table-cell">
                {tCommon('enrollmentDate')}
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((student) => (
              <tr
                key={student.id}
                className="border-b border-[rgba(14,14,16,0.06)] last:border-0 hover:bg-[#fafafa]/70"
              >
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => onStudentSelect(student.id)}
                    className="font-medium text-[#1010a3] underline-offset-2 hover:underline focus:outline-none focus:ring-2 focus:ring-[#1010a3]/20 rounded"
                    title={t('openStudentDetails')}
                  >
                    {student.user.firstName} {student.user.lastName}
                  </button>
                </td>
                <td className="px-4 py-3 text-[#3b3b40]">{student.user.status}</td>
                <td className="hidden px-4 py-3 text-[#3b3b40] sm:table-cell">
                  {formatEnrolledAt(student.enrolledAt, locale)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {total > GROUP_DETAIL_STUDENTS_PAGE_SIZE ? (
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
          <p className="text-sm text-[#8b8b90]">
            {t('showingRangeOfTotal', {
              start: skip + 1,
              end: Math.min(skip + GROUP_DETAIL_STUDENTS_PAGE_SIZE, total),
              total,
            })}
          </p>
          <AdminPaginationControls
            page={page}
            totalPages={totalPages}
            onPageChange={(nextPage) => {
              setPage(nextPage);
              scrollListStartSoon(listStartRef.current);
            }}
            previousLabel={tCommon('previousPage')}
            nextLabel={tCommon('nextPage')}
          />
        </div>
      ) : null}
    </div>
  );
}
