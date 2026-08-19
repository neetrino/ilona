'use client';

import Link from 'next/link';
import { cn } from '@/shared/lib/utils';
import { portalPrimaryButtonClass } from '@/shared/lib/portal-theme';
import { STUDENT_DASHBOARD_ASSETS } from '@/features/student-dashboard/assets';
import { GraduationCap } from 'lucide-react';
import { StudentDetailsModalNotes } from './StudentDetailsModalNotes';
import { StudentDetailsModalStatCard } from './StudentDetailsModalStatCard';
import { StudentDetailsModalIdentity } from './StudentDetailsModalIdentity';
import {
  StudentDetailsModalBasicInfo,
  StudentDetailsModalEnrollment,
  StudentDetailsModalParentContact,
} from './StudentDetailsModalSections';
import { getStudentDetailsVisibility } from './student-details-modal.visibility';
import type { StudentDetailsModalProps } from './student-details-modal.types';
import type { useStudentDetailsModal } from './useStudentDetailsModal';

type StudentDetailsModalBodyProps = Pick<StudentDetailsModalProps, 'studentId' | 'locale' | 'onClose' | 'audience'> &
  Pick<
    ReturnType<typeof useStudentDetailsModal>,
    | 't'
    | 'tTeachers'
    | 'tCommon'
    | 'tStatus'
    | 'student'
    | 'isLoading'
    | 'error'
    | 'statistics'
    | 'setPhotoPreviewOpen'
    | 'fullName'
    | 'isUserActive'
    | 'monthlyFee'
    | 'basePath'
  >;

function teacherName(
  teacher: { user: { firstName: string; lastName: string } } | null | undefined,
): string | null {
  if (!teacher?.user) return null;
  const name = `${teacher.user.firstName} ${teacher.user.lastName}`.trim();
  return name || null;
}

export function StudentDetailsModalBody(props: StudentDetailsModalBodyProps) {
  const {
    studentId,
    locale,
    onClose,
    audience = 'staff',
    t,
    tTeachers,
    tCommon,
    tStatus,
    student,
    isLoading,
    error,
    statistics,
    setPhotoPreviewOpen,
    fullName,
    isUserActive,
    basePath,
  } = props;

  const visibility = getStudentDetailsVisibility(audience);

  if (!studentId) {
    return <p className="p-4 text-slate-500 tablet:p-6">{t('noStudentSelected')}</p>;
  }
  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4 p-4 tablet:p-6">
        <div className="h-8 w-2/3 rounded bg-slate-200" />
        <div className="h-4 w-full rounded bg-slate-200" />
      </div>
    );
  }
  if (error || !student) {
    return (
      <div className="p-4 tablet:p-6">
        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-sm font-medium text-red-600">
              {error instanceof Error ? error.message : t('failedToLoadStudent')}
            </p>
            <button type="button" onClick={onClose} className="mt-4 text-sm text-red-600 underline">
              {tCommon('close')}
            </button>
          </div>
        ) : (
          <p className="text-slate-500">{t('studentNotFound')}</p>
        )}
      </div>
    );
  }

  const assignedTeacher = student.teacher ?? student.group?.teacher;
  const secondTeacher =
    student.group?.secondTeacher && student.group.secondTeacher.id !== assignedTeacher?.id
      ? student.group.secondTeacher
      : null;

  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] pt-4 tablet:p-6 tablet:pb-[calc(5rem+env(safe-area-inset-bottom))] lg:pb-8">
      <StudentDetailsModalIdentity
        student={student}
        fullName={fullName}
        isUserActive={isUserActive}
        showEmail={visibility.email}
        viewFullPhotoLabel={tTeachers('viewFullPhoto')}
        activeLabel={tStatus('active')}
        inactiveLabel={tStatus('inactive')}
        onPhotoPreview={() => setPhotoPreviewOpen(true)}
      />
      <StudentDetailsModalBasicInfo
        student={student}
        locale={locale}
        visibility={visibility}
        t={t}
        tTeachers={tTeachers}
      />
      <StudentDetailsModalEnrollment
        student={student}
        locale={locale}
        visibility={visibility}
        t={t}
        tTeachers={tTeachers}
        assignedTeacherName={teacherName(assignedTeacher) ?? '—'}
        secondTeacherName={teacherName(secondTeacher)}
      />
      <StudentDetailsModalParentContact student={student} visibility={visibility} t={t} />
      {statistics ? (
        <div className="mt-8 space-y-4">
          <h4 className="flex items-center gap-2 text-base font-semibold text-[#1010a3] sm:text-lg">
            <GraduationCap className="h-4 w-4 text-[#8b8b90]" aria-hidden="true" />
            {tTeachers('statistics')}
          </h4>
          <div className={cn('grid grid-cols-1 gap-4', visibility.payments && 'sm:grid-cols-2')}>
            <StudentDetailsModalStatCard
              label={t('attendance')}
              value={`${statistics.attendance.rate.toFixed(1)}%`}
              caption={`${statistics.attendance.present} / ${statistics.attendance.total} ${t('lessonsShort')}`}
              iconSrc={STUDENT_DASHBOARD_ASSETS.iconAttendance}
              iconBg="bg-[#dffc76]"
            />
            {visibility.payments ? (
              <StudentDetailsModalStatCard
                label={t('payments')}
                value={String(statistics.payments.pending)}
                caption={
                  statistics.payments.overdue > 0
                    ? t('overduePaymentsHint', { count: statistics.payments.overdue })
                    : t('noOverduePayments')
                }
                iconSrc={STUDENT_DASHBOARD_ASSETS.iconCard}
                iconBg="bg-[#ffe1e1]"
              />
            ) : null}
          </div>
        </div>
      ) : null}
      {student.notes ? (
        <StudentDetailsModalNotes
          notes={student.notes}
          locale={locale}
          title={t('notes')}
          deactivatedLabel={t('deactivatedNoteLabel')}
          activatedLabel={t('activatedNoteLabel')}
        />
      ) : null}
      {visibility.openFullProfile || visibility.receiveReports ? (
        <div className="flex flex-wrap items-center justify-end gap-3 pt-6">
          {visibility.receiveReports && student.receiveReports ? (
            <span className="text-xs text-[#8b8b90]">{t('receiveReportsOn')}</span>
          ) : null}
          {visibility.openFullProfile ? (
            <Link
              href={`/${locale}${basePath}/students/${student.id}`}
              className={portalPrimaryButtonClass}
              onClick={() => onClose()}
            >
              {t('openFullProfile')}
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
