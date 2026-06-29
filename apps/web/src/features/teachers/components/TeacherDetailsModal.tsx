'use client';

import React, { useCallback, useEffect } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { useTranslations } from 'next-intl';
import { Pencil, X } from 'lucide-react';
import { formatCurrency, formatPhoneForDisplay, cn } from '@/shared/lib/utils';
import { Avatar, Badge } from '@/shared/components/ui';
import { ADMIN_ICON_BUTTON_SM_CLASS } from '@/shared/lib/admin-control-theme';
import { PortalFormSheetDragHandle } from '@/shared/components/ui/portal-form-sheet-drag-handle';
import { PortalSheetPortal } from '@/shared/components/ui/portal-sheet-portal';
import { usePortalSheetDrag } from '@/shared/hooks/usePortalSheetDrag';
import {
  PORTAL_FORM_SHEET_CLOSE_BUTTON_CLASS,
  PORTAL_FORM_SHEET_HEADER_CLASS,
  PORTAL_FORM_SHEET_SCROLL_CLASS,
  portalFormSheetContentClass,
} from '@/shared/lib/portal-form-sheet-classes';
import { useTeacher } from '../hooks/useTeachers';
import { getExperienceLabelFromHireDate } from '../utils/experience';

interface TeacherDetailsModalProps {
  teacherId: string | null;
  open: boolean;
  onClose: () => void;
  onEdit?: () => void;
  showInternalStats?: boolean;
  showInternalMeta?: boolean;
  scrollClassName?: string;
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

function DetailField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-[#8b8b90]">{label}</p>
      <p className="break-words text-sm font-medium text-[#3b3b40]">{value}</p>
    </div>
  );
}

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h3 className="text-sm font-semibold text-[#3b3b40]">{title}</h3>
      <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4">{children}</div>
    </section>
  );
}

export function TeacherDetailsModal({
  teacherId,
  open,
  onClose,
  onEdit,
  showInternalStats = true,
  showInternalMeta = true,
  scrollClassName,
}: TeacherDetailsModalProps) {
  const t = useTranslations('teachers');
  const tCommon = useTranslations('common');
  const tStatus = useTranslations('status');
  const { data: teacher, isLoading, error } = useTeacher(teacherId ?? '', open && !!teacherId);

  const requestClose = useCallback(() => {
    onClose();
  }, [onClose]);

  const { dragStyle, dragHandleProps, resetDrag } = usePortalSheetDrag({
    enabled: true,
    onClose: requestClose,
  });

  useEffect(() => {
    if (!open) {
      resetDrag();
    }
  }, [open, resetDrag]);

  const firstName = teacher?.user?.firstName || '';
  const lastName = teacher?.user?.lastName || '';
  const fullName = `${firstName} ${lastName}`.trim() || t('teacherDetails');
  const isActive = teacher?.user?.status === 'ACTIVE';
  const phone = formatPhoneForDisplay(teacher?.user?.phone, t('noPhoneNumber'));
  const email = teacher?.user?.email || '';
  const lessonRateRaw = teacher?.lessonRateAMD;
  const hourlyRateFallback =
    typeof teacher?.hourlyRate === 'string' ? parseFloat(teacher.hourlyRate) : Number(teacher?.hourlyRate || 0);
  const lessonRate =
    lessonRateRaw !== undefined && lessonRateRaw !== null ? Number(lessonRateRaw) : hourlyRateFallback;
  const groups = teacher?.groups || [];
  const secondTeacherGroups = teacher?.secondTeacherForGroups || [];
  const allGroups = [...groups, ...secondTeacherGroups];
  const explicitCenters = teacher?.centerLinks?.map((link) => link.center) ?? [];
  const groupCenters = groups.filter((group) => group.center).map((group) => group.center!);
  const centers =
    teacher?.centers ??
    Array.from(new Map([...explicitCenters, ...groupCenters].map((center) => [center.id, center])).values());
  const experienceLabel = getExperienceLabelFromHireDate(teacher?.hireDate);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={(nextOpen) => !nextOpen && requestClose()}>
      <PortalSheetPortal open={open} dragStyle={dragStyle} contentClassName={portalFormSheetContentClass('xl')} contentProps={{ 'aria-describedby': undefined }}>
          <PortalFormSheetDragHandle dragHandleProps={dragHandleProps} />

          <DialogPrimitive.Title className="sr-only">
            {fullName} - {t('teacherDetails')}
          </DialogPrimitive.Title>

          <div className={cn(PORTAL_FORM_SHEET_HEADER_CLASS, 'border-b-0')}>
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <h2 className="break-words text-lg font-semibold text-[#3b3b40]">{fullName}</h2>
                <p className="mt-1 text-sm text-[#8b8b90]">{t('teacherDetails')}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {onEdit ? (
                  <button
                    type="button"
                    aria-label={tCommon('edit')}
                    title={tCommon('edit')}
                    onClick={onEdit}
                    className={cn(
                      ADMIN_ICON_BUTTON_SM_CLASS,
                      'text-slate-500 hover:bg-slate-100 hover:text-slate-700',
                    )}
                  >
                    <Pencil className="h-4 w-4" aria-hidden />
                  </button>
                ) : null}
                <DialogPrimitive.Close className={PORTAL_FORM_SHEET_CLOSE_BUTTON_CLASS} aria-label={tCommon('close')}>
                  <X className="h-4 w-4" />
                </DialogPrimitive.Close>
              </div>
            </div>
          </div>

          <div className={cn(PORTAL_FORM_SHEET_SCROLL_CLASS, scrollClassName)}>
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
              <div className="space-y-4">
                <section className="rounded-xl border border-slate-200 bg-white p-4">
                  <div className="mb-4 flex items-center gap-3">
                    <Avatar
                      src={teacher.user.avatarUrl}
                      name={fullName}
                      size="xl"
                      className="h-14 w-14 rounded-full"
                      alt={fullName}
                    />
                    <Badge variant={isActive ? 'success' : 'warning'}>
                      {isActive ? tStatus('active') : tStatus('inactive')}
                    </Badge>
                  </div>
                  <div className="space-y-4">
                    <DetailField label={t('phoneNumber')} value={phone} />
                    <DetailField label={tCommon('email')} value={email || '—'} />
                    {experienceLabel ? <DetailField label="Experience" value={experienceLabel} /> : null}
                    <DetailField label="Joined" value={formatDate(teacher.createdAt)} />
                  </div>
                </section>

                <DetailSection title={t('basicInformation')}>
                  {showInternalMeta ? (
                    <DetailField label="Per Lesson Rate" value={`${formatCurrency(lessonRate)}/lesson`} />
                  ) : null}
                  <DetailField label={t('specialization')} value={teacher.specialization || '—'} />
                  <DetailField label={t('bio')} value={teacher.bio || '—'} />
                  <DetailField label="Video URL" value={teacher.videoUrl || '—'} />
                </DetailSection>

                {showInternalMeta ? (
                  <DetailSection title={t('centers')}>
                    {centers.length === 0 ? (
                      <p className="text-sm text-[#8b8b90]">{t('noBranchAssigned')}</p>
                    ) : (
                      <ul className="flex flex-wrap gap-2">
                        {centers.map((center) => (
                          <li
                            key={center.id}
                            className="w-fit rounded-full border border-slate-200 bg-[#fafafa] px-3 py-1.5 text-sm text-[#3b3b40]"
                          >
                            {center.name}
                          </li>
                        ))}
                      </ul>
                    )}
                  </DetailSection>
                ) : null}

                {showInternalStats ? (
                  <DetailSection title={t('statistics')}>
                    <DetailField
                      label={t('totalGroups')}
                      value={(teacher._count?.groups ?? 0) + (teacher.secondTeacherForGroupsCount ?? teacher._count?.secondTeacherForGroups ?? 0)}
                    />
                    <DetailField label={t('totalLessons')} value={teacher._count?.lessons ?? 0} />
                    <DetailField label={t('totalStudents')} value={teacher._count?.students ?? 0} />
                  </DetailSection>
                ) : null}

                {showInternalStats ? (
                  <DetailSection title={t('groups')}>
                    {allGroups.length === 0 ? (
                      <p className="text-sm text-[#8b8b90]">{t('noGroupsAssigned')}</p>
                    ) : (
                      <ul className="space-y-2">
                        {allGroups.map((group) => (
                          <li
                            key={group.id}
                            className="rounded-lg border border-[rgba(14,14,16,0.07)] bg-[#fafafa] px-3 py-2"
                          >
                            <p className="text-sm font-medium text-[#3b3b40]">{group.name}</p>
                            <p className="text-xs text-[#8b8b90]">{group.center?.name || '—'}</p>
                          </li>
                        ))}
                      </ul>
                    )}
                  </DetailSection>
                ) : null}
              </div>
            )}
          </div>
        </PortalSheetPortal>
    </DialogPrimitive.Root>
  );
}
