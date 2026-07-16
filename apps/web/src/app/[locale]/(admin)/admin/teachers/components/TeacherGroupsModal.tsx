'use client';

import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/shared/lib/utils';
import { ADMIN_ICON_BUTTON_SM_CLASS } from '@/shared/lib/admin-control-theme';
import { PortalFormSheetScrollArea } from '@/shared/components/ui/portal-form-sheet-scroll-area';
import { PortalSheetPortal } from '@/shared/components/ui/portal-sheet-portal';
import {
  PORTAL_FORM_SHEET_CLOSE_BUTTON_CLASS,
  PORTAL_FORM_SHEET_HEADER_CLASS,
  portalFormSheetContentClass,
} from '@/shared/lib/portal-form-sheet-classes';
import { useTeacher, type Teacher } from '@/features/teachers';

interface TeacherGroupsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teacher: Teacher | null;
  initialTab: 'groups' | 'subgroups';
}

function TeacherGroupsList({ names, emptyText }: { names: string[]; emptyText: string }) {
  if (names.length === 0) {
    return <p className="rounded-lg bg-[#fafafa] p-3 text-sm text-[#8b8b90]">{emptyText}</p>;
  }

  return (
    <ul className="space-y-2">
      {names.map((name) => (
        <li
          key={name}
          className="rounded-lg border border-[rgba(14,14,16,0.07)] bg-white px-3 py-2 text-sm text-[#3b3b40]"
        >
          {name}
        </li>
      ))}
    </ul>
  );
}

export function TeacherGroupsModal({
  open,
  onOpenChange,
  teacher,
  initialTab,
}: TeacherGroupsModalProps) {
  const t = useTranslations('teachers');
  const tCommon = useTranslations('common');
  const teacherId = teacher?.id ?? '';
  const { data: teacherDetails, isLoading, isError } = useTeacher(teacherId, open && !!teacherId);
  if (!teacher) return null;

  const groupsSource =
    teacherDetails && teacherDetails.id === teacherId ? teacherDetails : teacher;
  const mainGroups = (groupsSource.groups ?? []).map((group) => group.name);
  const secondTeacherGroups = (groupsSource.secondTeacherForGroups ?? []).map((group) => group.name);
  const firstName = groupsSource.user?.firstName ?? '';
  const lastName = groupsSource.user?.lastName ?? '';
  const isSecondRotation = initialTab === 'subgroups';
  const groupNames = isSecondRotation ? secondTeacherGroups : mainGroups;
  const sectionLabel = isSecondRotation ? t('viewSecondRotationGroups') : t('assignedGroups');

  const showLoading = open && isLoading && !teacherDetails;
  const showError = open && isError && !teacherDetails;

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <PortalSheetPortal
        open={open}
        contentClassName={cn(
          portalFormSheetContentClass('xl'),
          'tablet:portrait:!w-[20%] tablet:landscape:!w-[20%] min-[1366px]:!w-[20%]',
        )}
        contentProps={{ 'aria-describedby': undefined }}
      >
        <DialogPrimitive.Title className="sr-only">
          {firstName} {lastName} — {sectionLabel}
        </DialogPrimitive.Title>

        <div className={PORTAL_FORM_SHEET_HEADER_CLASS}>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1 space-y-1">
              <h2 className="text-lg font-semibold leading-snug text-[#3b3b40]">
                {firstName} {lastName}
              </h2>
              <p className="text-sm text-[#8b8b90]">{sectionLabel}</p>
            </div>
            <DialogPrimitive.Close
              className={cn(PORTAL_FORM_SHEET_CLOSE_BUTTON_CLASS, ADMIN_ICON_BUTTON_SM_CLASS)}
              aria-label={tCommon('close')}
            >
              <X className="h-4 w-4" />
            </DialogPrimitive.Close>
          </div>
        </div>

        <PortalFormSheetScrollArea className="pt-4">
          {showLoading ? (
            <p className="rounded-lg bg-[#fafafa] p-3 text-sm text-[#8b8b90]">{t('loadingGroups')}</p>
          ) : showError ? (
            <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
              Could not load latest groups. Showing available data.
            </p>
          ) : null}
          <TeacherGroupsList names={groupNames} emptyText={t('noGroups')} />
        </PortalFormSheetScrollArea>
      </PortalSheetPortal>
    </DialogPrimitive.Root>
  );
}
