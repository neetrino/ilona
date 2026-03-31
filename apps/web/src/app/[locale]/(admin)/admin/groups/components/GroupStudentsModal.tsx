'use client';

import React, { useEffect, useState } from 'react';
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

function formatEnrolledAt(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
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
            <DialogTitle>Students in {groupName}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col min-h-0 flex-1">
            {isLoading ? (
              <div className="py-8 text-center text-slate-500">Loading students...</div>
            ) : isError ? (
              <div className="py-8 text-center text-red-600">
                {error instanceof Error ? error.message : 'Failed to load students.'}
              </div>
            ) : items.length === 0 ? (
              <div className="py-8 text-center text-slate-500">No students in this group.</div>
            ) : (
              <>
                <div className="overflow-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200 sticky top-0">
                      <tr>
                        <th className="text-left py-3 px-4 font-semibold text-slate-700">Name</th>
                        <th className="text-left py-3 px-4 font-semibold text-slate-700">Enrollment date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((student) => (
                        <tr
                          key={student.id}
                          className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50"
                        >
                          <td className="py-3 px-4 text-slate-800">
                            <button
                              type="button"
                              onClick={() => onStudentSelect(student.id)}
                              className="underline decoration-slate-400 underline-offset-2 hover:decoration-primary hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-1 rounded"
                              title="Open student details"
                            >
                              {student.user.firstName} {student.user.lastName}
                            </button>
                          </td>
                          <td className="py-3 px-4 text-slate-600">
                            {formatEnrolledAt(student.enrolledAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4 text-sm text-slate-500">
                    <span>
                      Showing {skip + 1}-{Math.min(skip + PAGE_SIZE, total)} of {total}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:pointer-events-none"
                        disabled={page === 0}
                        onClick={() => setPage((p) => Math.max(0, p - 1))}
                        aria-label="Previous page"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      <span>Page {page + 1} of {totalPages}</span>
                      <button
                        type="button"
                        className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:pointer-events-none"
                        disabled={page >= totalPages - 1}
                        onClick={() => setPage((p) => p + 1)}
                        aria-label="Next page"
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
