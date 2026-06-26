'use client';

import React, { useCallback, useEffect, useRef, useState, type TouchEvent } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { useTranslations } from 'next-intl';
import { X } from 'lucide-react';
import { formatCurrency, formatPhoneForDisplay, cn } from '@/shared/lib/utils';
import { Avatar, Badge } from '@/shared/components/ui';
import { useTeacher } from '../hooks/useTeachers';
import { getExperienceLabelFromHireDate } from '../utils/experience';

interface TeacherDetailsModalProps {
  teacherId: string | null;
  open: boolean;
  onClose: () => void;
  showInternalStats?: boolean;
  showInternalMeta?: boolean;
}

function formatDate(value?: string | null): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-2 border-b border-[rgba(14,14,16,0.07)] py-2 last:border-0 sm:grid-cols-2">
      <p className="text-sm text-[#8b8b90]">{label}</p>
      <p className="break-words text-sm font-medium text-[#3b3b40]">{value}</p>
    </div>
  );
}

export function TeacherDetailsModal({
  teacherId,
  open,
  onClose,
  showInternalStats = true,
  showInternalMeta = true,
}: TeacherDetailsModalProps) {
  const t = useTranslations('teachers');
  const tCommon = useTranslations('common');
  const tStatus = useTranslations('status');

  const { data: teacher, isLoading, error } = useTeacher(teacherId ?? '', open && !!teacherId);

  const firstName = teacher?.user?.firstName || '';
  const lastName = teacher?.user?.lastName || '';
  const fullName = `${firstName} ${lastName}`.trim() || 'Teacher';
  const isActive = teacher?.user?.status === 'ACTIVE';
  const phone = formatPhoneForDisplay(teacher?.user?.phone, t('noPhoneNumber'));
  const email = teacher?.user?.email || '';
  const lessonRateRaw = teacher?.lessonRateAMD;
  const hourlyRateFallback = typeof teacher?.hourlyRate === 'string'
    ? parseFloat(teacher.hourlyRate)
    : Number(teacher?.hourlyRate || 0);
  const lessonRate =
    lessonRateRaw !== undefined && lessonRateRaw !== null
      ? Number(lessonRateRaw)
      : hourlyRateFallback;
  const groups = teacher?.groups || [];
  const secondTeacherGroups = teacher?.secondTeacherForGroups || [];
  const allGroups = [...(teacher?.groups || []), ...secondTeacherGroups];
  const explicitCenters = teacher?.centerLinks?.map((link) => link.center) ?? [];
  const groupCenters = groups.filter((group) => group.center).map((group) => group.center!);
  const centers =
    teacher?.centers ??
    Array.from(new Map([...explicitCenters, ...groupCenters].map((center) => [center.id, center])).values());
  const experienceLabel = getExperienceLabelFromHireDate(teacher?.hireDate);
  const [isDialogOpen, setIsDialogOpen] = useState(open);
  const [dragOffsetY, setDragOffsetY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isSettling, setIsSettling] = useState(false);
  const touchStartYRef = useRef<number | null>(null);
  const touchStartXRef = useRef<number | null>(null);
  const settleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (settleTimerRef.current) {
        clearTimeout(settleTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    setIsDialogOpen(open);
  }, [open]);

  useEffect(() => {
    if (!open) {
      setDragOffsetY(0);
      setIsDragging(false);
      setIsSettling(false);
    }
  }, [open]);

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

  return (
    <DialogPrimitive.Root open={isDialogOpen} onOpenChange={(nextOpen) => !nextOpen && requestClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          style={dragStyle}
          className={cn(
            'fixed inset-x-0 bottom-[7px] top-auto z-50 grid w-full translate-y-0 lg:bottom-0 [@media(min-width:1024px)_and_(max-width:1366px)_and_(min-height:1000px)]:bottom-0',
            'duration-700 ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out min-[1367px]:duration-350 min-[1367px]:ease-[cubic-bezier(0.22,1,0.36,1)]',
            'data-[state=open]:slide-in-from-bottom-full data-[state=closed]:slide-out-to-bottom-full',
            'h-[calc(94dvh+7px)] [@media(min-width:1024px)_and_(max-width:1366px)_and_(min-height:1000px)]:h-[56dvh] grid-rows-[auto_1fr] gap-0 overflow-hidden rounded-t-[22px] border border-slate-200 bg-[#f8f9fb] shadow-xl',
            'min-[1367px]:grid-rows-[auto_1fr]',
            'min-[1367px]:inset-0 min-[1367px]:m-auto min-[1367px]:w-[95vw] min-[1367px]:max-w-2xl min-[1367px]:h-auto min-[1367px]:max-h-[90vh] min-[1367px]:translate-x-0 min-[1367px]:translate-y-0 min-[1367px]:rounded-2xl',
            'min-[1367px]:data-[state=open]:fade-in-0 min-[1367px]:data-[state=closed]:fade-out-0 min-[1367px]:data-[state=open]:slide-in-from-bottom-0 min-[1367px]:data-[state=closed]:slide-out-to-bottom-0'
          )}
          aria-describedby={undefined}
        >
          <div className="relative flex h-9 w-full items-center justify-center bg-[#f8f9fb] min-[1367px]:hidden">
            <div
              className="absolute inset-x-0 -top-2 h-14"
              onTouchStart={handleDragStart}
              onTouchMove={handleDragMove}
              onTouchEnd={handleDragEnd}
              onTouchCancel={handleDragEnd}
            />
            <div className="h-1.5 w-14 rounded-full bg-slate-400" />
          </div>
          <DialogPrimitive.Title className="sr-only">
            {fullName} - {t('teacherDetails')}
          </DialogPrimitive.Title>
          <div className="hidden min-[1367px]:flex shrink-0 items-center justify-end bg-[#f8f9fb] px-2 pt-2">
            <DialogPrimitive.Close
              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
              aria-label={tCommon('close')}
            >
              <X className="h-4 w-4" />
            </DialogPrimitive.Close>
          </div>
          <div className="overflow-y-auto px-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] pt-4 min-[1367px]:px-6 min-[1367px]:pb-6 min-[1367px]:pt-2">

            {!teacherId ? (
              <div className="py-8 text-center text-[#8b8b90]">{t('teacherNotFound')}</div>
            ) : isLoading ? (
              <div className="py-8 text-center text-[#8b8b90]">{tCommon('loading')}</div>
            ) : error ? (
              <div className="py-8 text-center text-red-600">
                {error instanceof Error ? error.message : 'Failed to load teacher details.'}
              </div>
            ) : !teacher ? (
              <div className="py-8 text-center text-[#8b8b90]">{t('teacherNotFound')}</div>
            ) : (
              <div className="space-y-6">
                <section className="rounded-[15px] border border-[rgba(14,14,16,0.07)] bg-white p-4">
                  <div className="mb-3 flex items-center gap-3">
                    <Avatar
                      src={teacher.user.avatarUrl}
                      name={fullName}
                      size="xl"
                      className="h-14 w-14 rounded-full"
                      alt={fullName}
                    />
                    <div className="min-w-0">
                      <p className="truncate text-base font-semibold text-[#3b3b40]">{fullName}</p>
                      <Badge variant={isActive ? 'success' : 'warning'}>
                        {isActive ? tStatus('active') : tStatus('inactive')}
                      </Badge>
                    </div>
                  </div>
                  <InfoRow label={t('phoneNumber')} value={phone} />
                  <InfoRow label={tCommon('email')} value={email || '—'} />
                  {experienceLabel ? (
                    <InfoRow label="Experience" value={experienceLabel} />
                  ) : null}
                  <InfoRow label="Joined" value={formatDate(teacher.createdAt)} />
                </section>

                <section className="rounded-[15px] border border-[rgba(14,14,16,0.07)] bg-white p-4">
                  <h3 className="mb-2 text-sm font-semibold text-[#1010a3]">{t('basicInformation')}</h3>
                  {showInternalMeta ? (
                    <InfoRow label="Per Lesson Rate" value={`${formatCurrency(lessonRate)}/lesson`} />
                  ) : null}
                  <InfoRow label={t('specialization')} value={teacher.specialization || '—'} />
                  <InfoRow label={t('bio')} value={teacher.bio || '—'} />
                  <InfoRow label="Video URL" value={teacher.videoUrl || '—'} />
                </section>

                {showInternalMeta && (
                  <section className="rounded-[15px] border border-[rgba(14,14,16,0.07)] bg-white p-4">
                    <h3 className="mb-2 text-sm font-semibold text-[#1010a3]">{t('centers')}</h3>
                    {centers.length === 0 ? (
                      <p className="text-sm text-[#8b8b90]">{t('noBranchAssigned')}</p>
                    ) : (
                      <ul className="space-y-2">
                        {centers.map((center) => (
                          <li key={center.id} className="rounded-[15px] border border-[rgba(14,14,16,0.07)] px-3 py-2 text-sm text-[#3b3b40]">
                            {center.name}
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>
                )}

                {showInternalStats && (
                  <section className="rounded-[15px] border border-[rgba(14,14,16,0.07)] bg-white p-4">
                    <h3 className="mb-2 text-sm font-semibold text-[#1010a3]">{t('statistics')}</h3>
                    <InfoRow label={t('totalGroups')} value={(teacher._count?.groups ?? 0) + (teacher.secondTeacherForGroupsCount ?? teacher._count?.secondTeacherForGroups ?? 0)} />
                    <InfoRow label={t('totalLessons')} value={teacher._count?.lessons ?? 0} />
                    <InfoRow label={t('totalStudents')} value={teacher._count?.students ?? 0} />
                  </section>
                )}

                {showInternalStats && (
                  <section className="rounded-[15px] border border-[rgba(14,14,16,0.07)] bg-white p-4">
                    <h3 className="mb-2 text-sm font-semibold text-[#1010a3]">{t('groups')}</h3>
                    {allGroups.length === 0 ? (
                      <p className="text-sm text-[#8b8b90]">{t('noGroupsAssigned')}</p>
                    ) : (
                      <ul className="space-y-2">
                        {allGroups.map((group) => (
                          <li key={group.id} className="rounded-[15px] border border-[rgba(14,14,16,0.07)] px-3 py-2">
                            <p className="text-sm font-medium text-[#3b3b40]">{group.name}</p>
                            <p className="text-xs text-[#8b8b90]">{group.center?.name || '—'}</p>
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>
                )}
              </div>
            )}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
