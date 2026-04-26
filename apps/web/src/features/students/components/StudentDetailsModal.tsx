'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { AdminAvatarPhotoLightbox, AdminDetailModal, Avatar, Badge } from '@/shared/components/ui';
import { cn, formatCurrency } from '@/shared/lib/utils';
import { useStudent, useStudentStatistics } from '../hooks/useStudents';
import type { StudentLifecycleStatus } from '../types';
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

export interface StudentDetailsModalProps {
  studentId: string | null;
  open: boolean;
  onClose: () => void;
  locale: string;
}

function formatDisplayDate(value: string | null | undefined): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function formatLifecycle(status: StudentLifecycleStatus | undefined): string {
  if (!status) return '—';
  const labels: Record<StudentLifecycleStatus, string> = {
    ACTIVE: 'Active',
    INACTIVE: 'Inactive',
    UNGROUPED: 'Ungrouped',
    NEW: 'New',
    RISK: 'At risk',
    HIGH_RISK: 'High risk',
  };
  return labels[status] ?? status;
}

export function StudentDetailsModal({ studentId, open, onClose, locale }: StudentDetailsModalProps) {
  const t = useTranslations('students');
  const tTeachers = useTranslations('teachers');
  const tCommon = useTranslations('common');
  const tStatus = useTranslations('status');

  const {
    data: student,
    isLoading,
    error,
  } = useStudent(studentId || '', !!studentId && open);

  const { data: statistics } = useStudentStatistics(studentId || '', !!studentId && open && !!student);

  const [photoPreviewOpen, setPhotoPreviewOpen] = useState(false);

  useEffect(() => {
    if (!open) setPhotoPreviewOpen(false);
  }, [open]);

  useEffect(() => {
    setPhotoPreviewOpen(false);
  }, [studentId]);

  const handleEscapeKey = useCallback(() => {
    if (photoPreviewOpen) {
      setPhotoPreviewOpen(false);
      return true;
    }
    return false;
  }, [photoPreviewOpen]);

  const fullName = useMemo(() => {
    const first = student?.user?.firstName || '';
    const last = student?.user?.lastName || '';
    return `${first} ${last}`.trim() || '—';
  }, [student?.user?.firstName, student?.user?.lastName]);

  const isUserActive = student?.user?.status === 'ACTIVE';
  const monthlyFee =
    typeof student?.monthlyFee === 'string'
      ? parseFloat(student.monthlyFee)
      : Number(student?.monthlyFee || 0);

  const avatarUrl = student?.user?.avatarUrl;

  return (
    <>
      <AdminAvatarPhotoLightbox
        open={photoPreviewOpen}
        imageUrl={avatarUrl}
        imageAlt={fullName}
        ariaLabel={tTeachers('viewFullPhoto')}
        closeAriaLabel={tCommon('close')}
        onClose={() => setPhotoPreviewOpen(false)}
      />

      <AdminDetailModal
        open={open}
        onClose={onClose}
        aria-label={t('studentDetails')}
        closeAriaLabel={tCommon('close')}
        onEscapeKey={handleEscapeKey}
        title={
          <>
            <Image
              src="/students-logo.png"
              alt=""
              className="w-5 h-5 object-contain flex-shrink-0"
              width={20}
              height={20}
            />
            {t('studentDetails')}
          </>
        }
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
          <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6 pb-6 border-b border-slate-200">
            <button
              type="button"
              onClick={() => student.user?.avatarUrl && setPhotoPreviewOpen(true)}
              className={cn(
                'rounded-xl flex-shrink-0 overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2',
                !student.user?.avatarUrl && 'cursor-default pointer-events-none',
              )}
              aria-label={student.user?.avatarUrl ? tTeachers('viewFullPhoto') : undefined}
            >
              <Avatar
                src={student.user?.avatarUrl}
                name={fullName}
                size="xl"
                className="w-40 h-40 sm:w-56 sm:h-56 lg:w-64 lg:h-64 rounded-xl"
                alt={fullName}
              />
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
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
                {student.status && (
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

          <div className="space-y-5">
            <h4 className="font-semibold text-slate-800 text-base sm:text-lg">{tTeachers('basicInformation')}</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-4 space-y-1">
                <label className="text-sm font-medium text-slate-600 flex items-center gap-2">
                  <Phone className="h-4 w-4 text-slate-400 shrink-0" aria-hidden="true" />
                  {tTeachers('phoneNumber')}
                </label>
                <p className="text-slate-800 text-sm sm:text-base break-words">
                  {student.user?.phone || tTeachers('noPhoneNumber')}
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-4 space-y-1">
                <label className="text-sm font-medium text-slate-600 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-slate-400 shrink-0" aria-hidden="true" />
                  {t('memberSince')}
                </label>
                <p className="text-slate-800 text-sm sm:text-base">{formatDisplayDate(student.user?.createdAt)}</p>
              </div>
              {student.dateOfBirth && (
                <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-4 space-y-1">
                  <label className="text-sm font-medium text-slate-600 flex items-center gap-2">
                    <UserCircle className="h-4 w-4 text-slate-400 shrink-0" aria-hidden="true" />
                    {t('dateOfBirth')}
                  </label>
                  <p className="text-slate-800 text-sm sm:text-base">{formatDisplayDate(student.dateOfBirth)}</p>
                </div>
              )}
              <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-4 space-y-1">
                <label className="text-sm font-medium text-slate-600 flex items-center gap-2">
                  <CircleDollarSign className="h-4 w-4 text-slate-400 shrink-0" aria-hidden="true" />
                  {t('monthlyFeeLabel')}
                </label>
                <p className="text-slate-800 text-sm sm:text-base">{formatCurrency(monthlyFee)}</p>
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <h4 className="font-semibold text-slate-800 text-base sm:text-lg flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-slate-500" aria-hidden="true" />
              {t('enrollmentSection')}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-4 space-y-1">
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
              <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-4 space-y-1">
                <label className="text-sm font-medium text-slate-600">{t('teacher')}</label>
                <p className="text-slate-800 text-sm sm:text-base break-words">
                  {student.teacher
                    ? `${student.teacher.user.firstName} ${student.teacher.user.lastName}`
                    : '—'}
                </p>
              </div>
              {(student.center?.name || student.group?.center?.name) && (
                <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-4 space-y-1 sm:col-span-2">
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
                <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-4 space-y-1 sm:col-span-2">
                  <label className="text-sm font-medium text-slate-600">{t('registerDateLabel')}</label>
                  <p className="text-slate-800 text-sm sm:text-base">{formatDisplayDate(student.registerDate)}</p>
                </div>
              )}
            </div>
          </div>

          {(student.parentName || student.parentPhone || student.parentEmail) && (
            <div className="space-y-5">
              <h4 className="font-semibold text-slate-800 text-base sm:text-lg">{t('parentContact')}</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {student.parentName && (
                  <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-4 space-y-1">
                    <label className="text-sm font-medium text-slate-600">{t('parentName')}</label>
                    <p className="text-slate-800 text-sm sm:text-base break-words">{student.parentName}</p>
                  </div>
                )}
                {student.parentPhone && (
                  <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-4 space-y-1">
                    <label className="text-sm font-medium text-slate-600 flex items-center gap-2">
                      <Phone className="h-4 w-4 text-slate-400 shrink-0" aria-hidden="true" />
                      {t('parentPhone')}
                    </label>
                    <p className="text-slate-800 text-sm sm:text-base break-words">{student.parentPhone}</p>
                  </div>
                )}
                {student.parentEmail && (
                  <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-4 space-y-1 sm:col-span-2">
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
            <div className="space-y-4 pt-6 border-t border-slate-200">
              <h4 className="font-semibold text-slate-800 flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-slate-500" aria-hidden="true" />
                {tTeachers('statistics')}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-50 rounded-lg p-4">
                  <p className="text-sm text-slate-600 mb-1">{t('attendance')}</p>
                  <p className="text-2xl font-bold text-slate-800">{statistics.attendance.rate.toFixed(1)}%</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {statistics.attendance.present} / {statistics.attendance.total}{' '}
                    {t('lessonsShort')}
                  </p>
                </div>
                <div className="bg-slate-50 rounded-lg p-4">
                  <p className="text-sm text-slate-600 mb-1">{t('payments')}</p>
                  <p className="text-2xl font-bold text-slate-800">{statistics.payments.pending}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {statistics.payments.overdue > 0
                      ? t('overduePaymentsHint', { count: statistics.payments.overdue })
                      : t('noOverduePayments')}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-slate-200">
            <Link
              href={`/${locale}/admin/students/${student.id}`}
              className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
              onClick={() => onClose()}
            >
              {t('openFullProfile')}
            </Link>
            {student.receiveReports && (
              <span className="text-xs text-slate-500">{t('receiveReportsOn')}</span>
            )}
          </div>
        </>
      )}
      </AdminDetailModal>
    </>
  );
}
