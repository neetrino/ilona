'use client';

import Link from 'next/link';
import { Avatar, Badge } from '@/shared/components/ui';
import { cn, formatCurrency, formatPhoneForDisplay } from '@/shared/lib/utils';
import { portalPrimaryButtonClass } from '@/shared/lib/portal-theme';
import { STUDENT_DASHBOARD_ASSETS } from '@/features/student-dashboard/assets';
import {
  Building2,
  Calendar,
  CircleDollarSign,
  FileText,
  GraduationCap,
  Mail,
  Phone,
  UserCircle,
  Users,
} from 'lucide-react';
import { formatDateOfBirth, formatDisplayDate, formatLifecycle } from './student-details-modal.util';
import { StudentDetailsModalStatCard } from './StudentDetailsModalStatCard';
import type { StudentDetailsModalProps } from './student-details-modal.types';
import type { useStudentDetailsModal } from './useStudentDetailsModal';

type StudentDetailsModalBodyProps = Pick<StudentDetailsModalProps, 'studentId' | 'locale' | 'onClose'> &
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

export function StudentDetailsModalBody(props: StudentDetailsModalBodyProps) {
  const {
    studentId,
    locale,
    onClose,
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
    monthlyFee,
    basePath,
  } = props;

  const assignedTeacher = student?.teacher ?? student?.group?.teacher;
  const secondTeacher =
    student?.group?.secondTeacher &&
    student.group.secondTeacher.id !== assignedTeacher?.id
      ? student.group.secondTeacher
      : null;
  const assignedTeacherName = assignedTeacher
    ? `${assignedTeacher.user.firstName} ${assignedTeacher.user.lastName}`
    : '—';
  const secondTeacherName = secondTeacher
    ? `${secondTeacher.user.firstName} ${secondTeacher.user.lastName}`
    : null;

  return (
    <div
      className="overflow-y-auto px-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] pt-4 min-[1367px]:p-6"
    >
      {!studentId ? (
        <p className="text-slate-500">{t('noStudentSelected')}</p>
      ) : isLoading ? (
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-2/3" />
          <div className="h-4 bg-slate-200 rounded w-full" />
          <div className="h-4 bg-slate-200 rounded w-1/2" />
        </div>
      ) : error ? (
        <div className="py-4">
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600 font-medium">
              {error instanceof Error ? error.message : t('failedToLoadStudent')}
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-4 text-sm text-red-600 hover:text-red-700 underline"
            >
              {tCommon('close')}
            </button>
          </div>
        </div>
      ) : !student ? (
        <p className="text-slate-500">{t('studentNotFound')}</p>
      ) : (
        <>
          {/* Mobile: avatar + name */}
          <div className="space-y-4 pb-6 sm:hidden">
            <button
              type="button"
              onClick={() => student.user?.avatarUrl && setPhotoPreviewOpen(true)}
              className={cn(
                'rounded-full flex-shrink-0 overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2',
                !student.user?.avatarUrl && 'cursor-default pointer-events-none',
              )}
              aria-label={student.user?.avatarUrl ? tTeachers('viewFullPhoto') : undefined}
            >
              <Avatar
                src={student.user?.avatarUrl}
                name={fullName}
                size="xl"
                className="w-40 h-40 rounded-full"
                alt={fullName}
              />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-2 flex-wrap min-w-0">
                <h3
                  className={cn(
                    'text-2xl font-bold leading-tight',
                    isUserActive ? 'text-slate-800' : 'text-slate-500',
                  )}
                >
                  {fullName}
                </h3>
                {!isUserActive ? (
                  <Badge variant="warning">{tStatus('inactive')}</Badge>
                ) : (
                  <Badge variant="success">{tStatus('active')}</Badge>
                )}
                {student.status &&
                  !(
                    (student.status === 'ACTIVE' && isUserActive) ||
                    (student.status === 'INACTIVE' && !isUserActive)
                  ) && (
                    <Badge variant="default">{formatLifecycle(student.status)}</Badge>
                  )}
              </div>
              {student.user?.email && (
                <div className="mt-1 flex items-center gap-2 text-slate-500 text-sm">
                  <Mail className="h-4 w-4 text-slate-400 shrink-0" aria-hidden="true" />
                  <p className="truncate">{student.user.email}</p>
                </div>
              )}
            </div>
          </div>

          {/* Desktop: avatar left, name + actions right */}
          <div className="hidden sm:flex items-start gap-6 pb-6">
            <button
              type="button"
              onClick={() => student.user?.avatarUrl && setPhotoPreviewOpen(true)}
              className={cn(
                'rounded-full min-[1367px]:rounded-xl flex-shrink-0 overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2',
                !student.user?.avatarUrl && 'cursor-default pointer-events-none',
              )}
              aria-label={student.user?.avatarUrl ? tTeachers('viewFullPhoto') : undefined}
            >
              <Avatar
                src={student.user?.avatarUrl}
                name={fullName}
                size="xl"
                className="w-56 h-56 lg:w-64 lg:h-64 rounded-full min-[1367px]:rounded-xl"
                alt={fullName}
              />
            </button>
            <div className="flex-1 min-w-0">
              <div className="mb-2 flex flex-wrap items-center gap-2 min-w-0">
                  <h3
                    className={cn(
                      'text-2xl font-bold leading-tight',
                      isUserActive ? 'text-slate-800' : 'text-slate-500',
                    )}
                  >
                    {fullName}
                  </h3>
                  {!isUserActive ? (
                    <Badge variant="warning">{tStatus('inactive')}</Badge>
                  ) : (
                    <Badge variant="success">{tStatus('active')}</Badge>
                  )}
                  {student.status &&
                    !(
                      (student.status === 'ACTIVE' && isUserActive) ||
                      (student.status === 'INACTIVE' && !isUserActive)
                    ) && (
                      <Badge variant="default">{formatLifecycle(student.status)}</Badge>
                    )}
                </div>
              {student.user?.email && (
                <div className="mt-1 flex items-center gap-2 text-slate-500 text-sm">
                  <Mail className="h-4 w-4 text-slate-400 shrink-0" aria-hidden="true" />
                  <p className="truncate">{student.user.email}</p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-5 pt-[10px] min-[1367px]:pt-0">
            <h4 className="font-semibold text-slate-800 text-base sm:text-lg">{tTeachers('basicInformation')}</h4>
            <div className="grid grid-cols-2 gap-4 min-[1367px]:flex min-[1367px]:gap-3">
              <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-4 space-y-1 min-[1367px]:min-w-0 min-[1367px]:flex-1">
                <label className="text-sm font-medium text-slate-600 flex items-center gap-2">
                  <Phone className="h-4 w-4 text-slate-400 shrink-0" aria-hidden="true" />
                  {tTeachers('phoneNumber')}
                </label>
                <p className="text-slate-800 text-sm sm:text-base break-words">
                  {formatPhoneForDisplay(student.user?.phone, tTeachers('noPhoneNumber'))}
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-4 space-y-1 min-[1367px]:min-w-0 min-[1367px]:flex-1">
                <label className="text-sm font-medium text-slate-600 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-slate-400 shrink-0" aria-hidden="true" />
                  {t('memberSince')}
                </label>
                <p className="text-slate-800 text-sm sm:text-base">{formatDisplayDate(student.user?.createdAt, locale)}</p>
              </div>
              {student.dateOfBirth && (
                <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-4 space-y-1 min-[1367px]:min-w-0 min-[1367px]:flex-1">
                  <label className="text-sm font-medium text-slate-600 flex items-center gap-2">
                    <UserCircle className="h-4 w-4 text-slate-400 shrink-0" aria-hidden="true" />
                    {t('dateOfBirth')}
                  </label>
                  <p className="text-slate-800 text-sm sm:text-base">{formatDateOfBirth(student.dateOfBirth, locale)}</p>
                </div>
              )}
              <div
                className={cn(
                  'rounded-lg border border-slate-200 bg-slate-50/60 p-4 space-y-1 min-[1367px]:min-w-0 min-[1367px]:flex-1',
                  !student.dateOfBirth && 'col-span-2 min-[1367px]:col-span-1',
                )}
              >
                <label className="text-sm font-medium text-slate-600 flex items-center gap-2">
                  <CircleDollarSign className="h-4 w-4 text-slate-400 shrink-0" aria-hidden="true" />
                  {t('monthlyFeeLabel')}
                </label>
                <p className="text-slate-800 text-sm sm:text-base">{formatCurrency(monthlyFee)}</p>
              </div>
            </div>
          </div>

          <div className="space-y-5 mt-8">
            <h4 className="font-semibold text-slate-800 text-base sm:text-lg flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-slate-500" aria-hidden="true" />
              {t('enrollmentSection')}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 min-[1367px]:flex min-[1367px]:gap-3">
              <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-4 space-y-1 min-[1367px]:min-w-0 min-[1367px]:flex-1">
                <label className="text-sm font-medium text-slate-600 flex items-center gap-2">
                  <Users className="h-4 w-4 text-slate-400 shrink-0" aria-hidden="true" />
                  {t('group')}
                </label>
                <p className="text-slate-800 text-sm sm:text-base break-words">
                  {student.group
                    ? `${student.group.name}${student.group.level ? ` (${student.group.level})` : ''}`
                    : '—'}
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-4 space-y-1 min-[1367px]:min-w-0 min-[1367px]:flex-1">
                <label className="text-sm font-medium text-slate-600">{t('teacher')}</label>
                <p className="text-slate-800 text-sm sm:text-base break-words">
                  {assignedTeacherName}
                </p>
              </div>
              {secondTeacherName && (
                <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-4 space-y-1 min-[1367px]:min-w-0 min-[1367px]:flex-1">
                  <label className="text-sm font-medium text-slate-600">{t('teacher2')}</label>
                  <p className="text-slate-800 text-sm sm:text-base break-words">
                    {secondTeacherName}
                  </p>
                </div>
              )}
              {(student.center?.name || student.group?.center?.name) && (
                <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-4 space-y-1 sm:col-span-2 min-[1367px]:col-span-1 min-[1367px]:min-w-0 min-[1367px]:flex-1">
                  <label className="text-sm font-medium text-slate-600 flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-slate-400 shrink-0" aria-hidden="true" />
                    {tTeachers('centers')}
                  </label>
                  <p className="text-slate-800 text-sm sm:text-base">
                    {student.center?.name ?? student.group?.center?.name}
                  </p>
                </div>
              )}
              {student.registerDate && (
                <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-4 space-y-1 sm:col-span-2 min-[1367px]:col-span-1 min-[1367px]:min-w-0 min-[1367px]:flex-1">
                  <label className="text-sm font-medium text-slate-600">{t('registerDateLabel')}</label>
                  <p className="text-slate-800 text-sm sm:text-base">{formatDisplayDate(student.registerDate, locale)}</p>
                </div>
              )}
            </div>
          </div>

          {(student.parentName || student.parentPhone || student.parentEmail) && (
            <div className="space-y-5 mt-8">
              <h4 className="font-semibold text-slate-800 text-base sm:text-lg">{t('parentContact')}</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 min-[1367px]:flex min-[1367px]:gap-3">
                {student.parentName && (
                  <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-4 space-y-1 min-[1367px]:min-w-0 min-[1367px]:flex-1">
                    <label className="text-sm font-medium text-slate-600">{t('parentName')}</label>
                    <p className="text-slate-800 text-sm sm:text-base break-words">{student.parentName}</p>
                  </div>
                )}
                {student.parentPhone && (
                  <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-4 space-y-1 min-[1367px]:min-w-0 min-[1367px]:flex-1">
                    <label className="text-sm font-medium text-slate-600 flex items-center gap-2">
                      <Phone className="h-4 w-4 text-slate-400 shrink-0" aria-hidden="true" />
                      {t('parentPhone')}
                    </label>
                    <p className="text-slate-800 text-sm sm:text-base break-words">{formatPhoneForDisplay(student.parentPhone)}</p>
                  </div>
                )}
                {student.parentEmail && (
                  <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-4 space-y-1 sm:col-span-2 min-[1367px]:col-span-1 min-[1367px]:min-w-0 min-[1367px]:flex-1">
                    <label className="text-sm font-medium text-slate-600 flex items-center gap-2">
                      <Mail className="h-4 w-4 text-slate-400 shrink-0" aria-hidden="true" />
                      {t('parentEmail')}
                    </label>
                    <p className="text-slate-800 text-sm sm:text-base break-words">{student.parentEmail}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {student.notes && (
            <div className="space-y-3">
              <h4 className="font-semibold text-slate-800 flex items-center gap-2">
                <FileText className="h-4 w-4 text-slate-500" aria-hidden="true" />
                {t('notes')}
              </h4>
              <p className="text-sm text-slate-700 whitespace-pre-wrap break-words rounded-lg border border-slate-200 bg-slate-50/60 p-4 max-h-40 overflow-y-auto">
                {student.notes}
              </p>
            </div>
          )}

          {statistics && (
            <div className="space-y-4 mt-8">
              <h4 className="flex items-center gap-2 text-base font-semibold text-[#1010a3] sm:text-lg">
                <GraduationCap className="h-4 w-4 text-[#8b8b90]" aria-hidden="true" />
                {tTeachers('statistics')}
              </h4>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <StudentDetailsModalStatCard
                  label={t('attendance')}
                  value={`${statistics.attendance.rate.toFixed(1)}%`}
                  caption={`${statistics.attendance.present} / ${statistics.attendance.total} ${t('lessonsShort')}`}
                  iconSrc={STUDENT_DASHBOARD_ASSETS.iconAttendance}
                  iconBg="bg-[#dffc76]"
                />
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
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-end gap-3 pt-6">
            {student.receiveReports ? (
              <span className="text-xs text-[#8b8b90]">{t('receiveReportsOn')}</span>
            ) : null}
            <Link href={`/${locale}${basePath}/students/${student.id}`} className={portalPrimaryButtonClass} onClick={() => onClose()}>
              {t('openFullProfile')}
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
