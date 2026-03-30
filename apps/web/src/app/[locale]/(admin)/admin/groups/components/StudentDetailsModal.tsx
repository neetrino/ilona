'use client';

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui';
import { useStudent } from '@/features/students';

interface StudentDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: string | null;
}

function formatDate(value?: string | null): string {
  if (!value) {
    return '—';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 py-2 border-b border-slate-100 last:border-0">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="text-sm text-slate-800 font-medium break-words">{value}</p>
    </div>
  );
}

export function StudentDetailsModal({ open, onOpenChange, studentId }: StudentDetailsModalProps) {
  const { data: student, isLoading, isError, error } = useStudent(studentId ?? '', open && !!studentId);
  const age = student?.age ?? null;
  const isUnder18 = age !== null && age < 18;
  const fullName = student ? `${student.user.firstName} ${student.user.lastName}` : 'Student';
  const courseStartDate = student?.registerDate ?? student?.enrolledAt ?? null;
  const groupHistory = student?.groupHistory ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>{fullName} - Student Details</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="py-8 text-center text-slate-500">Loading student details...</div>
        ) : isError ? (
          <div className="py-8 text-center text-red-600">
            {error instanceof Error ? error.message : 'Failed to load student details.'}
          </div>
        ) : !student ? (
          <div className="py-8 text-center text-slate-500">Student details are not available.</div>
        ) : (
          <div className="space-y-6">
            <section className="rounded-lg border border-slate-200 p-4">
              <h3 className="text-sm font-semibold text-slate-900 mb-2">Student Information</h3>
              <InfoRow label="First Name" value={student.user.firstName || '—'} />
              <InfoRow label="Last Name" value={student.user.lastName || '—'} />
              <InfoRow label="Age" value={age ?? '—'} />
              <InfoRow label="Phone Number" value={student.user.phone || '—'} />
              <InfoRow label="Course Start Date" value={formatDate(courseStartDate)} />
            </section>

            {isUnder18 && (
              <section className="rounded-lg border border-slate-200 p-4">
                <h3 className="text-sm font-semibold text-slate-900 mb-2">Parent Information</h3>
                <InfoRow label="Parent Name" value={student.parentName || '—'} />
                <InfoRow label="Parent Phone Number" value={student.parentPhone || '—'} />
                <InfoRow label="Parent Passport Information" value={student.parentPassportInfo || '—'} />
              </section>
            )}

            <section className="rounded-lg border border-slate-200 p-4">
              <h3 className="text-sm font-semibold text-slate-900 mb-3">Group History</h3>
              {groupHistory.length === 0 ? (
                <p className="text-sm text-slate-500">No group history found.</p>
              ) : (
                <ul className="space-y-2">
                  {groupHistory.map((entry) => (
                    <li key={entry.id} className="rounded-md border border-slate-100 px-3 py-2">
                      <p className="text-sm font-medium text-slate-800">
                        {entry.group.name}
                        {entry.group.level ? ` (${entry.group.level})` : ''}
                      </p>
                      <p className="text-xs text-slate-500">
                        {formatDate(entry.joinedAt)} - {entry.leftAt ? formatDate(entry.leftAt) : 'Present'}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
