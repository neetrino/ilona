'use client';

import * as DialogPrimitive from '@radix-ui/react-dialog';
import Image from 'next/image';
import { AdminAvatarPhotoLightbox } from '@/shared/components/ui';
import { ADMIN_ICON_BUTTON_SM_CLASS } from '@/shared/lib/admin-control-theme';
import { cn } from '@/shared/lib/utils';
import { PORTAL_DESKTOP_SIDE_SHEET_CLASS } from '@/shared/lib/portal-form-sheet-classes';
import {
  portalSheetLayerProps,
  stackedSheetDialogHandlers,
  stackedSheetOverlayClassName,
} from '@/shared/lib/sheet-stack';
import {
  MessageCircle,
  MoreVertical,
  Pencil,
  Trash2,
  UserCircle,
  X,
} from 'lucide-react';
import { PORTAL_SHEET_DRAG_HANDLE_ATTR } from '@/shared/hooks/usePortalSheetDrag';
import { StudentDetailsModalBody } from './student-details-modal/StudentDetailsModalBody';
import { useStudentDetailsModal } from './student-details-modal/useStudentDetailsModal';
import type { StudentDetailsModalProps } from './student-details-modal/student-details-modal.types';

export type { StudentDetailsModalProps } from './student-details-modal/student-details-modal.types';

export function StudentDetailsModal(props: StudentDetailsModalProps) {
  const {
    studentId,
    onClose,
    locale,
    onEdit,
    onDelete,
    onDeactivate,
    onFeedback,
    actionsDisabled = false,
  } = props;
  const {
    basePath,
    t,
    tTeachers,
    tCommon,
    tStatus,
    student,
    isLoading,
    error,
    statistics,
    photoPreviewOpen,
    setPhotoPreviewOpen,
    actionsMenuOpen,
    setActionsMenuOpen,
    headerActionsRef,
    isDialogOpen,
    requestClose,
    dragHandleProps,
    scrollContentProps,
    dragStyle,
    fullName,
    isUserActive,
    monthlyFee,
    runHeaderAction,
    studentActionsMenuItemClass,
    canShowActionsMenu,
    overlayStyle,
    contentStyle,
    isBaseLayer,
    avatarUrl,
  } = useStudentDetailsModal(props);


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
      <DialogPrimitive.Overlay style={overlayStyle} {...portalSheetLayerProps} className={stackedSheetOverlayClassName('fixed inset-0 z-50 bg-black/60 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0', isBaseLayer)} />
      <DialogPrimitive.Content ref={scrollContentProps.ref} style={{ ...dragStyle, ...contentStyle }} {...stackedSheetDialogHandlers} {...portalSheetLayerProps}
        className={cn(
          'fixed inset-x-0 bottom-[7px] top-auto z-50 grid w-full translate-y-0 lg:bottom-0 [@media(min-width:1024px)_and_(max-width:1366px)_and_(min-height:1000px)]:bottom-0',
          'duration-700 ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out min-[1367px]:duration-350 min-[1367px]:ease-[cubic-bezier(0.22,1,0.36,1)]',
          'data-[state=open]:slide-in-from-bottom-full data-[state=closed]:slide-out-to-bottom-full',
          'h-[calc(94dvh+7px)] [@media(min-width:1024px)_and_(max-width:1366px)_and_(min-height:1000px)]:h-[56dvh] grid-rows-[auto_auto_1fr] gap-0 overflow-hidden rounded-t-[22px] border border-slate-200 bg-[#f8f9fb] shadow-xl',
          PORTAL_DESKTOP_SIDE_SHEET_CLASS,
        )}
        aria-describedby={undefined}
      >
      <div
        className="relative flex h-9 w-full items-center justify-center bg-white min-[1367px]:hidden"
        {...{ [PORTAL_SHEET_DRAG_HANDLE_ATTR]: '' }}
      >
        <div
          className="absolute inset-x-0 -top-2 h-14"
          style={{ touchAction: 'pan-y' }}
          {...dragHandleProps}
        />
        <div className="h-1.5 w-14 rounded-full bg-slate-400" />
      </div>
      <DialogPrimitive.Title className="sr-only">{t('studentDetails')}</DialogPrimitive.Title>
      <div className="relative z-40 flex w-full shrink-0 items-center justify-between gap-2 border-b border-slate-200 bg-white px-4 py-3 min-[1367px]:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Image
            src="/students-logo.webp"
            alt=""
            className="h-5 w-5 object-contain"
            width={20}
            height={20}
          />
          <h2 className="mt-0.5 truncate text-[1.0625rem] font-semibold text-[#3b3b40] min-[1367px]:mt-0 min-[1367px]:text-lg">
            {t('studentDetails')}
          </h2>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {canShowActionsMenu ? (
            <div ref={headerActionsRef} className="relative shrink-0">
              <button
                type="button"
                aria-label={tCommon('actions')}
                aria-haspopup="menu"
                aria-expanded={actionsMenuOpen}
                disabled={actionsDisabled}
                onClick={() => setActionsMenuOpen((prev) => !prev)}
                className={cn(
                  ADMIN_ICON_BUTTON_SM_CLASS,
                  'text-[#3b3b40] hover:bg-[#f3f3f4]',
                  actionsDisabled && 'cursor-not-allowed opacity-50',
                )}
              >
                <MoreVertical className="h-4 w-4" aria-hidden="true" />
              </button>
              {actionsMenuOpen ? (
                <div
                  role="menu"
                  className="absolute right-0 top-full z-30 mt-1 min-w-[11rem] overflow-hidden rounded-xl border border-[rgba(14,14,16,0.08)] bg-white p-1 shadow-[0_16px_40px_rgba(15,23,42,0.14)] ring-1 ring-black/5"
                >
                  {onFeedback ? (
                    <button
                      type="button"
                      role="menuitem"
                      disabled={actionsDisabled}
                      onClick={() => runHeaderAction(() => onFeedback(student!))}
                      className={studentActionsMenuItemClass}
                    >
                      <MessageCircle className="h-4 w-4 shrink-0 text-[#1010a3]" aria-hidden="true" />
                      {t('teacherFeedback')}
                    </button>
                  ) : null}
                  {onEdit ? (
                    <button
                      type="button"
                      role="menuitem"
                      disabled={actionsDisabled}
                      onClick={() => runHeaderAction(() => onEdit(student!))}
                      className={studentActionsMenuItemClass}
                    >
                      <Pencil className="h-4 w-4 shrink-0" aria-hidden="true" />
                      {tCommon('edit')}
                    </button>
                  ) : null}
                  {onDeactivate ? (
                    <button
                      type="button"
                      role="menuitem"
                      disabled={actionsDisabled}
                      onClick={() => runHeaderAction(() => onDeactivate(student!))}
                      className={studentActionsMenuItemClass}
                    >
                      <UserCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                      {isUserActive ? tTeachers('deactivate') : tTeachers('activate')}
                    </button>
                  ) : null}
                  {onDelete ? (
                    <button
                      type="button"
                      role="menuitem"
                      disabled={actionsDisabled}
                      onClick={() => runHeaderAction(() => onDelete(student!))}
                      className={cn(
                        studentActionsMenuItemClass,
                        'text-red-600 hover:bg-red-50',
                      )}
                    >
                      <Trash2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                      {tCommon('delete')}
                    </button>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}
          <button
            type="button"
            onClick={requestClose}
            className={cn(
              ADMIN_ICON_BUTTON_SM_CLASS,
              'hidden shrink-0 text-slate-500 hover:bg-slate-100 hover:text-slate-900 min-[1367px]:inline-flex',
            )}
            aria-label={tCommon('close')}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
      <StudentDetailsModalBody
        studentId={studentId}
        locale={locale}
        onClose={onClose}
        t={t}
        tTeachers={tTeachers}
        tCommon={tCommon}
        tStatus={tStatus}
        student={student}
        isLoading={isLoading}
        error={error}
        statistics={statistics}
        setPhotoPreviewOpen={setPhotoPreviewOpen}
        fullName={fullName}
        isUserActive={isUserActive}
        monthlyFee={monthlyFee}
        basePath={basePath}
      />
      </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </>
  );
}