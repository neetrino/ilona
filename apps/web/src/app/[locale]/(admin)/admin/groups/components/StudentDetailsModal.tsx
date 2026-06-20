'use client';

import React from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui';
import { useStudent } from '@/features/students';
import { formatPhoneForDisplay } from '@/shared/lib/utils';

interface StudentDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: string | null;
}

function formatDate(value: string | null | undefined, locale: string): string {
  if (!value) {
    return '—';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return date.toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' });
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 py-2 border-b border-[rgba(14,14,16,0.07)] last:border-0">
      <p className="text-sm text-[#8b8b90]">{label}</p>
      <p className="text-sm text-[#3b3b40] font-medium break-words">{value}</p>
    </div>
  );
}

export function StudentDetailsModal({ open, onOpenChange, studentId }: StudentDetailsModalProps) {
  const locale = useLocale();
  const t = useTranslations('groups');
  const tCommon = useTranslations('common');
  const tStudents = useTranslations('students');
  const tSettings = useTranslations('settings');
  const tAttendance = useTranslations('attendance');
  const { data: student, isLoading, isError, error } = useStudent(studentId ?? '', open && !!studentId);
  const age = student?.age ?? null;
  const isUnder18 = age !== null && age < 18;
  const fullName = student
    ? `${student.user.firstName} ${student.user.lastName}`
    : t('studentFallback');
  const courseStartDate = student?.registerDate ?? student?.enrolledAt ?? null;
  const groupHistory = student?.groupHistory ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>{t('studentDetailsTitle', { name: fullName })}</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="py-8 text-center text-[#8b8b90]">{t('loadingStudentDetails')}</div>
        ) : isError ? (
          <div className="py-8 text-center text-red-600">
            {error instanceof Error ? error.message : tStudents('failedToLoadStudent')}
          </div>
        ) : !student ? (
          <div className="py-8 text-center text-[#8b8b90]">{t('studentDetailsUnavailable')}</div>
        ) : (
          <div className="space-y-6">
            <section className="rounded-lg border border-[rgba(14,14,16,0.07)] p-4">
              <h3 className="text-sm font-semibold text-[#1010a3] mb-2">{tCommon('studentInformation')}</h3>
              <InfoRow label={tCommon('firstName')} value={student.user.firstName || '—'} />
              <InfoRow label={tCommon('lastName')} value={student.user.lastName || '—'} />
              <InfoRow label={tSettings('age')} value={age ?? '—'} />
              <InfoRow label={tSettings('phoneNumber')} value={formatPhoneForDisplay(student.user.phone)} />
              <InfoRow label={t('courseStartDate')} value={formatDate(courseStartDate, locale)} />
            </section>

            {isUnder18 && (
              <section className="rounded-lg border border-[rgba(14,14,16,0.07)] p-4">
                <h3 className="text-sm font-semibold text-[#1010a3] mb-2">{tCommon('parentInformation')}</h3>
                <InfoRow label={tStudents('parentName')} value={student.parentName || '—'} />
                <InfoRow label={tStudents('parentPhone')} value={formatPhoneForDisplay(student.parentPhone)} />
                <InfoRow label={t('parentPassportInfo')} value={student.parentPassportInfo || '—'} />
              </section>
            )}

            <section className="rounded-lg border border-[rgba(14,14,16,0.07)] p-4">
              <h3 className="text-sm font-semibold text-[#1010a3] mb-3">{tCommon('groupHistory')}</h3>
              {groupHistory.length === 0 ? (
                <p className="text-sm text-[#8b8b90]">{t('noGroupHistory')}</p>
              ) : (
                <ul className="space-y-2">
                  {groupHistory.map((entry) => (
                    <li key={entry.id} className="rounded-md border border-[rgba(14,14,16,0.07)] px-3 py-2">
                      <p className="text-sm font-medium text-[#3b3b40]">
                        {entry.group.name}
                        {entry.group.level ? ` (${entry.group.level})` : ''}
                      </p>
                      <p className="text-xs text-[#8b8b90]">
                        {formatDate(entry.joinedAt, locale)} -{' '}
                        {entry.leftAt ? formatDate(entry.leftAt, locale) : tAttendance('present')}
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
