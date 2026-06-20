'use client';

import React, { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui';
import { useGroupStudents } from '@/features/groups';

const PAGE_SIZE = 10;

interface GroupStudentsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string | null;
  groupName: string;
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

export function GroupStudentsModal({
  open,
  onOpenChange,
  groupId,
  groupName,
  onStudentSelect,
}: GroupStudentsModalProps) {
  const locale = useLocale();
  const t = useTranslations('groups');
  const tCommon = useTranslations('common');
  const [page, setPage] = useState(0);
  useEffect(() => {
    if (!open) {
      setPage(0);
    }
  }, [open]);
  const skip = page * PAGE_SIZE;
  const { data, isLoading, isError, error } = useGroupStudents(
    groupId,
    { skip, take: PAGE_SIZE },
    open && !!groupId
  );

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>{t('studentsInGroupTitle', { groupName })}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col min-h-0 flex-1">
            {isLoading ? (
              <div className="py-8 text-center text-[#8b8b90]">{t('loadingStudents')}</div>
            ) : isError ? (
              <div className="py-8 text-center text-red-600">
                {error instanceof Error ? error.message : t('failedLoadStudents')}
              </div>
            ) : items.length === 0 ? (
              <div className="py-8 text-center text-[#8b8b90]">{t('noStudentsInGroup')}</div>
            ) : (
              <>
                <div className="overflow-auto border border-[rgba(14,14,16,0.07)] rounded-lg">
                  <table className="w-full text-sm">
                    <thead className="bg-[#fafafa] border-b border-[rgba(14,14,16,0.07)] sticky top-0">
                      <tr>
                        <th className="text-left py-3 px-4 font-semibold text-[#3b3b40]">{tCommon('name')}</th>
                        <th className="text-left py-3 px-4 font-semibold text-[#3b3b40]">{tCommon('enrollmentDate')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((student) => (
                        <tr
                          key={student.id}
                          className="border-b border-[rgba(14,14,16,0.07)] last:border-0 hover:bg-[#fafafa]/50"
                        >
                          <td className="py-3 px-4 text-[#3b3b40]">
                            <button
                              type="button"
                              onClick={() => onStudentSelect(student.id)}
                              className="underline decoration-[#8b8b90] underline-offset-2 hover:decoration-[#1010a3] hover:text-[#1010a3] focus:outline-none focus:ring-2 focus:ring-[#1010a3]/20 focus:ring-offset-1 rounded"
                              title={t('openStudentDetails')}
                            >
                              {student.user.firstName} {student.user.lastName}
                            </button>
                          </td>
                          <td className="py-3 px-4 text-[#3b3b40]">
                            {formatEnrolledAt(student.enrolledAt, locale)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4 text-sm text-[#8b8b90]">
                    <span>
                      {t('showingRangeOfTotal', {
                        start: skip + 1,
                        end: Math.min(skip + PAGE_SIZE, total),
                        total,
                      })}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="p-2 rounded-lg hover:bg-[#f6f6f7] disabled:opacity-50 disabled:pointer-events-none"
                        disabled={page === 0}
                        onClick={() => setPage((p) => Math.max(0, p - 1))}
                        aria-label={t('previousPage')}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      <span>{t('pageOf', { current: page + 1, total: totalPages })}</span>
                      <button
                        type="button"
                        className="p-2 rounded-lg hover:bg-[#f6f6f7] disabled:opacity-50 disabled:pointer-events-none"
                        disabled={page >= totalPages - 1}
                        onClick={() => setPage((p) => p + 1)}
                        aria-label={t('nextPage')}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
  );
}
