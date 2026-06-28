'use client';

import {
  portalSheetLayerProps,
  stackedSheetDialogHandlers,
  useSheetStackZIndex,
  stackedSheetOverlayClassName,
} from '@/shared/lib/sheet-stack';


import React, { useCallback, useEffect, useState } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useStudent } from '@/features/students';
import { usePortalSheetDrag } from '@/shared/hooks/usePortalSheetDrag';
import { formatPhoneForDisplay } from '@/shared/lib/utils';
import { portalFormSheetContentClass } from '@/shared/lib/portal-form-sheet-classes';

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

export function StudentDetailsModal({ open, onOpenChange, studentId }: StudentDetailsModalProps) {
  const locale = useLocale();
  const t = useTranslations('groups');
  const tCommon = useTranslations('common');
  const tStudents = useTranslations('students');
  const tSettings = useTranslations('settings');
  const tAttendance = useTranslations('attendance');
  const [isDialogOpen, setIsDialogOpen] = useState(open);
  const { data: student, isLoading, isError, error } = useStudent(studentId ?? '', open && !!studentId);

  useEffect(() => {
    setIsDialogOpen(open);
  }, [open]);

  const requestClose = useCallback(() => {
    setIsDialogOpen(false);
    onOpenChange(false);
  }, [onOpenChange]);

  const { dragStyle, dragHandleProps, resetDrag } = usePortalSheetDrag({
    enabled: true,
    onClose: requestClose,
  });

  useEffect(() => {
    if (!open) {
      resetDrag();
    }
  }, [open, resetDrag]);

  const age = student?.age ?? null;
  const isUnder18 = age !== null && age < 18;
  const fullName = student
    ? `${student.user.firstName} ${student.user.lastName}`
    : t('studentFallback');
  const title = t('studentDetailsTitle', { name: fullName });
  const courseStartDate = student?.registerDate ?? student?.enrolledAt ?? null;
  const groupHistory = student?.groupHistory ?? [];

  const { overlayStyle, contentStyle, isBaseLayer } = useSheetStackZIndex(isDialogOpen);

  return (
    <DialogPrimitive.Root open={isDialogOpen} onOpenChange={(nextOpen) => !nextOpen && requestClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay style={overlayStyle} {...portalSheetLayerProps} className={stackedSheetOverlayClassName('fixed inset-0 z-50 bg-black/60 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0', isBaseLayer)} />
        <DialogPrimitive.Content style={{ ...dragStyle, ...contentStyle }} {...stackedSheetDialogHandlers} {...portalSheetLayerProps}
          className={portalFormSheetContentClass('2xl')}
          aria-describedby={undefined}
        >
          <div className="relative flex h-9 w-full items-center justify-center bg-[#f8f9fb] min-[1367px]:hidden">
            <div className="absolute inset-x-0 -top-2 h-14" style={{ touchAction: 'pan-y' }} {...dragHandleProps} />
            <div className="h-1.5 w-14 rounded-full bg-slate-400" />
          </div>

          <DialogPrimitive.Title className="sr-only">{title}</DialogPrimitive.Title>

          <div className="shrink-0 bg-[#f8f9fb] px-4 pb-4 pt-3 min-[1367px]:px-6 min-[1367px]:pb-5 min-[1367px]:pt-6">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <h2 className="break-words text-lg font-semibold text-[#3b3b40]">{title}</h2>
              </div>
              <DialogPrimitive.Close
                className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 min-[1367px]:inline-flex"
                aria-label={tCommon('close')}
              >
                <X className="h-4 w-4" />
              </DialogPrimitive.Close>
            </div>
          </div>

          <div className="min-h-0 overflow-y-auto overscroll-y-contain [touch-action:pan-y] [-webkit-overflow-scrolling:touch] px-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] min-[1367px]:px-6 min-[1367px]:pb-6">
            {isLoading ? (
              <div className="py-8 text-center text-[#8b8b90]">{t('loadingStudentDetails')}</div>
            ) : isError ? (
              <div className="py-8 text-center text-red-600">
                {error instanceof Error ? error.message : tStudents('failedToLoadStudent')}
              </div>
            ) : !student ? (
              <div className="py-8 text-center text-[#8b8b90]">{t('studentDetailsUnavailable')}</div>
            ) : (
              <div className="space-y-4">
                <DetailSection title={tCommon('studentInformation')}>
                  <DetailField label={tCommon('firstName')} value={student.user.firstName || '—'} />
                  <DetailField label={tCommon('lastName')} value={student.user.lastName || '—'} />
                  <DetailField label={tSettings('age')} value={age ?? '—'} />
                  <DetailField label={tSettings('phoneNumber')} value={formatPhoneForDisplay(student.user.phone)} />
                  <DetailField label={t('courseStartDate')} value={formatDate(courseStartDate, locale)} />
                </DetailSection>

                {isUnder18 ? (
                  <DetailSection title={tCommon('parentInformation')}>
                    <DetailField label={tStudents('parentName')} value={student.parentName || '—'} />
                    <DetailField label={tStudents('parentPhone')} value={formatPhoneForDisplay(student.parentPhone)} />
                    <DetailField label={t('parentPassportInfo')} value={student.parentPassportInfo || '—'} />
                  </DetailSection>
                ) : null}

                <DetailSection title={tCommon('groupHistory')}>
                  {groupHistory.length === 0 ? (
                    <p className="text-sm text-[#8b8b90]">{t('noGroupHistory')}</p>
                  ) : (
                    <ul className="space-y-2">
                      {groupHistory.map((entry) => (
                        <li
                          key={entry.id}
                          className="rounded-lg border border-[rgba(14,14,16,0.07)] bg-[#fafafa] px-3 py-2"
                        >
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
                </DetailSection>
              </div>
            )}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
