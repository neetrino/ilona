'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type TouchEvent } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import Image from 'next/image';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { AdminAvatarPhotoLightbox, Avatar, Badge, PublicAssetImage, ActionButtons } from '@/shared/components/ui';
import { cn, formatCurrency, formatPhoneForDisplay, getAppDateLocaleTag } from '@/shared/lib/utils';
import { portalInnerCardClass, portalPrimaryButtonClass } from '@/shared/lib/portal-theme';
import { STUDENT_DASHBOARD_ASSETS } from '@/features/student-dashboard/assets';
import { useStudent, useStudentStatistics } from '../hooks/useStudents';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { getAdminPortalBasePath } from '@/shared/lib/role-routes';
import type { StudentLifecycleStatus, Student } from '../types';
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
  X,
} from 'lucide-react';

export interface StudentDetailsModalProps {
  studentId: string | null;
  open: boolean;
  onClose: () => void;
  locale: string;
  onEdit?: (student: Student) => void;
  onDelete?: (student: Student) => void;
  onDeactivate?: (student: Student) => void;
  actionsDisabled?: boolean;
}

function formatDisplayDate(value: string | null | undefined, locale: string): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(getAppDateLocaleTag(locale), {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

type StudentModalStatCardProps = {
  label: string;
  value: string;
  caption: string;
  iconSrc: string;
  iconBg: string;
};

function StudentModalStatCard({ label, value, caption, iconSrc, iconBg }: StudentModalStatCardProps) {
  return (
    <div className={portalInnerCardClass}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs tracking-wide text-[#8b8b90]">{label}</p>
        <div
          className={cn(
            'flex h-[2.625rem] w-[2.625rem] shrink-0 items-center justify-center rounded-[0.875rem]',
            iconBg,
          )}
        >
          <PublicAssetImage src={iconSrc} alt="" width={24} height={24} className="h-6 w-6 object-contain" />
        </div>
      </div>
      <p className="mt-2 text-2xl font-bold tracking-tight text-[#1010a3]">{value}</p>
      <p className="mt-1 text-xs text-[#8b8b90]">{caption}</p>
    </div>
  );
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

export function StudentDetailsModal({
  studentId,
  open,
  onClose,
  locale,
  onEdit,
  onDelete,
  onDeactivate,
  actionsDisabled = false,
}: StudentDetailsModalProps) {
  const { user } = useAuthStore();
  const basePath = getAdminPortalBasePath(user?.role);
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
  const [isDialogOpen, setIsDialogOpen] = useState(open);
  const [dragOffsetY, setDragOffsetY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isSettling, setIsSettling] = useState(false);
  const touchStartYRef = useRef<number | null>(null);
  const touchStartXRef = useRef<number | null>(null);
  const settleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setIsDialogOpen(open);
  }, [open]);

  useEffect(() => {
    if (!open) setPhotoPreviewOpen(false);
  }, [open]);

  useEffect(() => {
    setPhotoPreviewOpen(false);
  }, [studentId]);

  useEffect(() => {
    return () => {
      if (settleTimerRef.current) {
        clearTimeout(settleTimerRef.current);
      }
    };
  }, []);

  const requestClose = useCallback(() => {
    setIsDialogOpen(false);
    onClose();
  }, [onClose]);

  const isMobileViewport = () =>
    typeof window !== 'undefined' && window.matchMedia('(max-width: 1366px)').matches;

  const resetDragRefs = () => {
    touchStartYRef.current = null;
    touchStartXRef.current = null;
    setIsDragging(false);
  };

  const handleDragStart = (event: TouchEvent<HTMLDivElement>) => {
    if (!isMobileViewport()) return;
    const firstTouch = event.touches[0];
    if (!firstTouch) return;
    if (settleTimerRef.current) {
      clearTimeout(settleTimerRef.current);
      settleTimerRef.current = null;
    }
    touchStartYRef.current = firstTouch.clientY;
    touchStartXRef.current = firstTouch.clientX;
    setIsSettling(false);
    setIsDragging(true);
  };

  const handleDragMove = (event: TouchEvent<HTMLDivElement>) => {
    if (!isMobileViewport()) return;
    if (!isDragging || touchStartYRef.current === null || touchStartXRef.current === null) return;
    const firstTouch = event.touches[0];
    if (!firstTouch) return;
    const deltaY = firstTouch.clientY - touchStartYRef.current;
    const deltaX = Math.abs(firstTouch.clientX - touchStartXRef.current);
    if (deltaY <= 0 || deltaY <= deltaX) return;
    event.preventDefault();
    setDragOffsetY(Math.min(deltaY * 0.95, 340));
  };

  const handleDragEnd = () => {
    if (!isMobileViewport()) return;
    if (!isDragging) return;
    const shouldClose = dragOffsetY > 110;
    resetDragRefs();
    if (shouldClose) {
      setDragOffsetY(0);
      requestClose();
      return;
    }
    setIsSettling(true);
    setDragOffsetY(0);
    settleTimerRef.current = setTimeout(() => {
      setIsSettling(false);
      settleTimerRef.current = null;
    }, 280);
  };

  const dragStyle =
    dragOffsetY > 0 || isSettling
      ? {
          transform: `translateY(${dragOffsetY}px)`,
          transition: isDragging ? 'none' : 'transform 280ms cubic-bezier(0.22, 1, 0.36, 1)',
        }
      : undefined;

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
  const showActions = !!(onEdit || onDelete || onDeactivate);

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

      <DialogPrimitive.Root open={isDialogOpen} onOpenChange={(nextOpen) => !nextOpen && requestClose()}>
      <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
      <DialogPrimitive.Content
        style={dragStyle}
        className={cn(
          'fixed inset-x-0 bottom-[7px] top-auto z-50 grid w-full translate-y-0 lg:bottom-0 [@media(min-width:1024px)_and_(max-width:1366px)_and_(min-height:1000px)]:bottom-0',
          'duration-700 ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out min-[1367px]:duration-350 min-[1367px]:ease-[cubic-bezier(0.22,1,0.36,1)]',
          'data-[state=open]:slide-in-from-bottom-full data-[state=closed]:slide-out-to-bottom-full',
          'h-[calc(94dvh+7px)] [@media(min-width:1024px)_and_(max-width:1366px)_and_(min-height:1000px)]:h-[56dvh] grid-rows-[auto_auto_1fr] gap-0 overflow-hidden rounded-t-[22px] border border-slate-200 bg-[#f8f9fb] shadow-xl',
          'min-[1367px]:inset-0 min-[1367px]:m-auto min-[1367px]:w-[95vw] min-[1367px]:max-w-4xl min-[1367px]:h-auto min-[1367px]:max-h-[90vh] min-[1367px]:translate-x-0 min-[1367px]:translate-y-0 min-[1367px]:rounded-2xl',
          'min-[1367px]:data-[state=open]:fade-in-0 min-[1367px]:data-[state=closed]:fade-out-0 min-[1367px]:data-[state=open]:slide-in-from-bottom-0 min-[1367px]:data-[state=closed]:slide-out-to-bottom-0'
        )}
        aria-describedby={undefined}
      >
      <div className="relative flex h-9 w-full items-center justify-center bg-white min-[1367px]:hidden">
        <div
          className="absolute inset-x-0 -top-2 h-14"
          onTouchStart={handleDragStart}
          onTouchMove={handleDragMove}
          onTouchEnd={handleDragEnd}
          onTouchCancel={handleDragEnd}
        />
        <div className="h-1.5 w-14 rounded-full bg-slate-400" />
      </div>
      <DialogPrimitive.Title className="sr-only">{t('studentDetails')}</DialogPrimitive.Title>
      <div className="flex items-center border-b border-slate-200 bg-white px-4 py-3 min-[1367px]:justify-between min-[1367px]:px-6">
        <div className="flex items-center gap-2">
          <Image
            src="/students-logo.webp"
            alt=""
            className="h-5 w-5 object-contain"
            width={20}
            height={20}
          />
          <h2 className="mt-0.5 text-[1.0625rem] font-semibold text-[#3b3b40] min-[1367px]:mt-0 min-[1367px]:text-lg">{t('studentDetails')}</h2>
        </div>
        <button
          type="button"
          onClick={requestClose}
          className="hidden rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 min-[1367px]:inline-flex"
          aria-label={tCommon('close')}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="overflow-y-auto px-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] pt-4 min-[1367px]:p-6">
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
          {/* Mobile: actions opposite avatar at top */}
          <div className="grid grid-cols-[1fr_auto] grid-rows-[auto_auto] gap-x-3 gap-y-4 pb-6 sm:hidden">
            <button
              type="button"
              onClick={() => student.user?.avatarUrl && setPhotoPreviewOpen(true)}
              className={cn(
                'col-start-1 row-start-1 self-start rounded-full flex-shrink-0 overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2',
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
            {showActions && (
              <div className="col-start-2 row-start-1 self-start">
                <ActionButtons
                  onEdit={onEdit ? () => onEdit(student) : undefined}
                  onDisable={onDeactivate ? () => onDeactivate(student) : undefined}
                  onDelete={onDelete ? () => onDelete(student) : undefined}
                  isActive={isUserActive}
                  disabled={actionsDisabled}
                  size="md"
                  className="shrink-0"
                  ariaLabels={{
                    edit: t('editStudentAria'),
                    disable: isUserActive ? t('deactivateStudentAria') : t('activateStudentAria'),
                    delete: t('deleteStudentAria'),
                  }}
                  titles={{
                    edit: t('editStudentAria'),
                    disable: isUserActive ? t('deactivateStudentAria') : t('activateStudentAria'),
                    delete: t('deleteStudentAria'),
                  }}
                />
              </div>
            )}
            <div className="col-span-2 row-start-2 min-w-0">
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
              <div className="flex items-start justify-between gap-3">
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
                {showActions && (
                  <ActionButtons
                    onEdit={onEdit ? () => onEdit(student) : undefined}
                    onDisable={onDeactivate ? () => onDeactivate(student) : undefined}
                    onDelete={onDelete ? () => onDelete(student) : undefined}
                    isActive={isUserActive}
                    disabled={actionsDisabled}
                    size="md"
                    className="shrink-0"
                    ariaLabels={{
                      edit: t('editStudentAria'),
                      disable: isUserActive ? t('deactivateStudentAria') : t('activateStudentAria'),
                      delete: t('deleteStudentAria'),
                    }}
                    titles={{
                      edit: t('editStudentAria'),
                      disable: isUserActive ? t('deactivateStudentAria') : t('activateStudentAria'),
                      delete: t('deleteStudentAria'),
                    }}
                  />
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
                  <p className="text-slate-800 text-sm sm:text-base">{formatDisplayDate(student.dateOfBirth, locale)}</p>
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
                  {student.teacher
                    ? `${student.teacher.user.firstName} ${student.teacher.user.lastName}`
                    : '—'}
                </p>
              </div>
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
                <StudentModalStatCard
                  label={t('attendance')}
                  value={`${statistics.attendance.rate.toFixed(1)}%`}
                  caption={`${statistics.attendance.present} / ${statistics.attendance.total} ${t('lessonsShort')}`}
                  iconSrc={STUDENT_DASHBOARD_ASSETS.iconAttendance}
                  iconBg="bg-[#dffc76]"
                />
                <StudentModalStatCard
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
      </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </>
  );
}
