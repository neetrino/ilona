'use client';

import { useCallback, useEffect, useState } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { useTranslations } from 'next-intl';
import { ChevronRight, X } from 'lucide-react';
import { PortalFormSheetDragHandle } from '@/shared/components/ui/portal-form-sheet-drag-handle';
import { PortalFormSheetScrollArea } from '@/shared/components/ui/portal-form-sheet-scroll-area';
import { PortalSheetPortal } from '@/shared/components/ui/portal-sheet-portal';
import { usePortalSheetDrag } from '@/shared/hooks/usePortalSheetDrag';
import {
  PORTAL_FORM_SHEET_CLOSE_BUTTON_CLASS,
  PORTAL_FORM_SHEET_HEADER_CLASS,
  portalFormSheetContentClass,
} from '@/shared/lib/portal-form-sheet-classes';
import { ADMIN_OUTLINE_BUTTON_CLASS } from '@/shared/lib/admin-control-theme';
import { cn } from '@/shared/lib/utils';
import { AdminStudentRecordingItem } from './AdminStudentRecordingItem';
import { useAdminStudentRecordingsHistory } from './useAdminStudentRecordingsHistory';

export interface AdminStudentRecordingsSheetProps {
  open: boolean;
  onClose: () => void;
  studentUserId: string | null;
  studentFullName: string;
  groupName: string;
}

export function AdminStudentRecordingsSheet({
  open,
  onClose,
  studentUserId,
  studentFullName,
  groupName,
}: AdminStudentRecordingsSheetProps) {
  const t = useTranslations('recordings');
  const tCommon = useTranslations('common');
  const [activeRecordingId, setActiveRecordingId] = useState<string | null>(null);

  const requestClose = useCallback(() => {
    setActiveRecordingId(null);
    onClose();
  }, [onClose]);

  const { dragStyle, dragHandleProps, scrollContentProps, resetDrag } = usePortalSheetDrag({
    enabled: true,
    onClose: requestClose,
  });

  useEffect(() => {
    if (!open) {
      resetDrag();
      setActiveRecordingId(null);
    }
  }, [open, resetDrag]);

  const {
    dayGroups,
    recordings,
    isLoading,
    isError,
    error,
    refetch,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useAdminStudentRecordingsHistory(studentUserId, open);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={(next) => !next && requestClose()}>
      <PortalSheetPortal
        open={open}
        dragStyle={dragStyle}
        sheetContentRef={scrollContentProps.ref}
        contentClassName={portalFormSheetContentClass('xl')}
        contentProps={{ 'aria-describedby': undefined }}
      >
        <PortalFormSheetDragHandle dragHandleProps={dragHandleProps} />

        <DialogPrimitive.Title className="sr-only">
          {studentFullName} — {t('studentRecordingHistory')}
        </DialogPrimitive.Title>

        <div className={cn(PORTAL_FORM_SHEET_HEADER_CLASS, 'border-b border-slate-200/80')}>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h2 className="break-words text-lg font-semibold text-[#3b3b40]">
                {studentFullName}
              </h2>
              <p className="mt-1 truncate text-sm text-[#8b8b90]">
                {groupName} · {t('studentRecordingHistory')}
              </p>
            </div>
            <DialogPrimitive.Close
              className={PORTAL_FORM_SHEET_CLOSE_BUTTON_CLASS}
              aria-label={tCommon('close')}
            >
              <X className="h-4 w-4" />
            </DialogPrimitive.Close>
          </div>
        </div>

        <PortalFormSheetScrollArea>
          {isLoading ? (
            <div className="space-y-3 py-2">
              {Array.from({ length: 3 }).map((_, idx) => (
                <div
                  key={`history-skeleton-${idx}`}
                  className="rounded-xl border border-[rgba(14,14,16,0.08)] bg-white p-4"
                >
                  <div className="h-4 w-28 animate-pulse rounded bg-[#f6f6f7]" />
                  <div className="mt-3 h-3 w-40 animate-pulse rounded bg-[#f6f6f7]" />
                  <div className="mt-4 h-9 w-full animate-pulse rounded-lg bg-[#f6f6f7]" />
                </div>
              ))}
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <p className="text-sm text-red-600">
                {error instanceof Error ? error.message : t('historyLoadError')}
              </p>
              <button
                type="button"
                onClick={() => void refetch()}
                className={ADMIN_OUTLINE_BUTTON_CLASS}
              >
                {tCommon('retry')}
              </button>
            </div>
          ) : recordings.length === 0 ? (
            <div className="py-10 text-center text-sm text-[#8b8b90]">
              {t('noVoiceRecordingsForStudent')}
            </div>
          ) : (
            <div className="space-y-6 pb-2">
              {dayGroups.map((group) => (
                <section key={group.dayKey} className="space-y-3">
                  <h3 className="text-sm font-semibold text-[#3b3b40]">
                    {group.dayLabel}
                  </h3>
                  <div className="space-y-3">
                    {group.recordings.map((recording, index) => (
                      <AdminStudentRecordingItem
                        key={recording.id}
                        recording={recording}
                        indexInDay={index + 1}
                        isActive={activeRecordingId === recording.id}
                        onPlay={setActiveRecordingId}
                        onEnded={() => setActiveRecordingId(null)}
                      />
                    ))}
                  </div>
                </section>
              ))}

              {hasNextPage ? (
                <div className="flex justify-center pt-1">
                  <button
                    type="button"
                    disabled={isFetchingNextPage}
                    onClick={() => void fetchNextPage()}
                    className={cn(
                      ADMIN_OUTLINE_BUTTON_CLASS,
                      'inline-flex items-center gap-1.5',
                      isFetchingNextPage && 'opacity-60',
                    )}
                  >
                    {isFetchingNextPage ? t('loadingMore') : t('loadMore')}
                    {!isFetchingNextPage ? (
                      <ChevronRight className="h-4 w-4" aria-hidden />
                    ) : null}
                  </button>
                </div>
              ) : null}
            </div>
          )}
        </PortalFormSheetScrollArea>
      </PortalSheetPortal>
    </DialogPrimitive.Root>
  );
}
