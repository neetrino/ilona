import fs from 'node:fs';
import path from 'node:path';

function readLines(filePath) {
  return fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
}

function slice(lines, a, b) {
  return lines.slice(a - 1, b).join('\n');
}

function splitEditGroupForm() {
  const srcPath = path.resolve('apps/web/src/features/groups/components/EditGroupForm.tsx');
  const dir = path.resolve('apps/web/src/features/groups/components/edit-group-form');
  const lines = readLines(srcPath);
  fs.mkdirSync(dir, { recursive: true });

  fs.writeFileSync(
    path.join(dir, 'edit-group-form.types.ts'),
    `import type { GroupIconKey } from '@ilona/types';
import type { GroupScheduleEntry } from '../../types';

${slice(lines, 45, 73)}
`,
  );

  fs.writeFileSync(
    path.join(dir, 'edit-group-form.constants.ts'),
    `${slice(lines, 54, 65)}

export const REGENERATE_CONFIRM_MESSAGE = 'GROUP_SCHEDULE_REGENERATION_CONFIRMATION_REQUIRED';

import { cn } from '@/shared/lib/utils';
import { ADMIN_FORM_INPUT_CLASS } from '@/shared/lib/admin-control-theme';

export const ADMIN_TEXTAREA_CLASS = cn(ADMIN_FORM_INPUT_CLASS, 'h-auto min-h-[5.5rem] resize-none py-2');
`,
  );

  const hookHeader = `'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslations } from 'next-intl';
import { useUpdateGroup, useGroup, type UpdateGroupDto } from '@/features/groups';
import type { GroupScheduleEntry } from '../../types';
import { useCenters } from '@/features/centers';
import { useTeachers } from '@/features/teachers';
import { useState, useEffect, useMemo, useCallback, useRef, type TouchEvent } from 'react';
import { ApiError, getErrorMessage } from '@/shared/lib/api';
import { isGroupIconKey, type GroupIconKey } from '@ilona/types';
import {
  defaultMonthDateRange,
  normalizeGroupSchedulePayload,
  scheduleSlotsValidationError,
} from '../../group-schedule-utils';
import { filterTeachersForCenter, teacherOptionLabel } from '../../lib/center-scoped-teachers';
import { translateScheduleSlotError, REGENERATE_CONFIRM_MESSAGE } from './edit-group-form.constants';
import type { EditGroupFormProps, UpdateGroupFormData } from './edit-group-form.types';

export function useEditGroupForm({
  open,
  onOpenChange,
  groupId,
  onToggleActive,
  isStatusTogglePending = false,
}: EditGroupFormProps) {
`;

  fs.writeFileSync(
    path.join(dir, 'useEditGroupForm.ts'),
    `${hookHeader}
${slice(lines, 82, 390)}
  return {
    tForm,
    tGroups,
    tVal,
    tCommon,
    updateGroupSchema,
    resolver,
    errorMessage,
    setErrorMessage,
    successMessage,
    setSuccessMessage,
    isDialogOpen,
    setIsDialogOpen,
    dragOffsetY,
    isDragging,
    isSettling,
    schedule,
    setSchedule,
    hadCalendarOnLoad,
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
    regenerateDialogOpen,
    setRegenerateDialogOpen,
    secondTeacherStartsFirstWeek,
    setSecondTeacherStartsFirstWeek,
    iconKey,
    setIconKey,
    updateGroup,
    group,
    isLoading,
    centers,
    teachers,
    register,
    handleSubmit,
    errors,
    isSubmitting,
    reset,
    watch,
    getValues,
    setValue,
    isGroupActive,
    isFormBusy,
    watchedTeacherId,
    watchedCenterId,
    watchedSecondTeacherId,
    hasCenterSelected,
    teachersForCenter,
    teacherDropdownDisabled,
    teacherPlaceholder,
    isLoadingCenters,
    isLoadingTeachers,
    overlayStyle,
    contentStyle,
    isBaseLayer,
    requestClose,
    handleDragStart,
    handleDragMove,
    handleDragEnd,
    dragStyle,
    onSubmit,
    onConfirmRegenerate,
    onToggleActive,
    isStatusTogglePending,
  };
}
`,
  );

  fs.writeFileSync(
    path.join(dir, 'EditGroupFormFields.tsx'),
    `'use client';

import { Button, Input, Label, Checkbox } from '@/shared/components/ui';
import { cn } from '@/shared/lib/utils';
import {
  ADMIN_FORM_INPUT_CLASS,
  ADMIN_OUTLINE_BUTTON_CLASS,
  ADMIN_PRIMARY_BUTTON_CLASS,
} from '@/shared/lib/admin-control-theme';
import { SingleSelectDropdown } from '@/shared/components/ui/single-select-dropdown';
import { GroupCalendarScheduleSection } from '../GroupCalendarScheduleSection';
import { GroupIconPicker } from '../GroupIconPicker';
import { teacherOptionLabel } from '../../lib/center-scoped-teachers';
import { ADMIN_TEXTAREA_CLASS } from './edit-group-form.constants';
import type { UpdateGroupFormData } from './edit-group-form.types';
import type { useEditGroupForm } from './useEditGroupForm';

type EditGroupFormFieldsProps = ReturnType<typeof useEditGroupForm> & {
  handleSubmit: ReturnType<typeof useEditGroupForm>['handleSubmit'];
  onSubmit: (data: UpdateGroupFormData) => Promise<void>;
};

export function EditGroupFormFields(props: EditGroupFormFieldsProps) {
  const {
    tForm,
    tCommon,
    successMessage,
    errorMessage,
    handleSubmit,
    onSubmit,
    register,
    errors,
    isSubmitting,
    iconKey,
    setIconKey,
    schedule,
    setSchedule,
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
    updateGroup,
    centers,
    watchedCenterId,
    watchedTeacherId,
    watchedSecondTeacherId,
    setValue,
    teachersForCenter,
    teacherPlaceholder,
    teacherDropdownDisabled,
    isLoadingCenters,
    isLoadingTeachers,
    isFormBusy,
    secondTeacherStartsFirstWeek,
    setSecondTeacherStartsFirstWeek,
    requestClose,
  } = props;

  return (
${slice(lines, 502, 723)}
  );
}
`,
  );

  fs.writeFileSync(
    path.join(dir, 'EditGroupFormRegenerateDialog.tsx'),
    `'use client';

import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/shared/components/ui';
import { cn } from '@/shared/lib/utils';
import { ADMIN_OUTLINE_BUTTON_CLASS, ADMIN_PRIMARY_BUTTON_CLASS } from '@/shared/lib/admin-control-theme';

export type EditGroupFormRegenerateDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tForm: (key: string) => string;
  onConfirmRegenerate: () => void;
};

export function EditGroupFormRegenerateDialog({
  open,
  onOpenChange,
  tForm,
  onConfirmRegenerate,
}: EditGroupFormRegenerateDialogProps) {
  return (
${slice(lines, 729, 753)}
  );
}
`,
  );

  const mainImports = `'use client';

import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Fragment } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/shared/lib/utils';
import {
  ADMIN_ICON_BUTTON_SM_CLASS,
} from '@/shared/lib/admin-control-theme';
import {
  portalSheetLayerProps,
  stackedSheetDialogHandlers,
  useSheetStackZIndex,
  stackedSheetOverlayClassName,
} from '@/shared/lib/sheet-stack';
import { PORTAL_DESKTOP_SIDE_SHEET_CLASS } from '@/shared/lib/portal-form-sheet-classes';
import { X } from 'lucide-react';
import { useEditGroupForm } from './edit-group-form/useEditGroupForm';
import { EditGroupFormFields } from './edit-group-form/EditGroupFormFields';
import { EditGroupFormRegenerateDialog } from './edit-group-form/EditGroupFormRegenerateDialog';
import type { EditGroupFormProps } from './edit-group-form/edit-group-form.types';

export type { EditGroupFormProps } from './edit-group-form/edit-group-form.types';

export function EditGroupForm(props: EditGroupFormProps) {
  const form = useEditGroupForm(props);
  const tCommon = useTranslations('common');

  if (form.isLoading) {
    return (
${slice(lines, 393, 437)
  .replace(/\btForm\b/g, 'form.tForm')
  .replace(/\btCommon\b/g, 'tCommon')
  .replace(/\brequestClose\b/g, 'form.requestClose')
  .replace(/\bisDialogOpen\b/g, 'form.isDialogOpen')
  .replace(/\boverlayStyle\b/g, 'form.overlayStyle')
  .replace(/\bcontentStyle\b/g, 'form.contentStyle')
  .replace(/\bisBaseLayer\b/g, 'form.isBaseLayer')
  .replace(/\bdragStyle\b/g, 'form.dragStyle')
  .replace(/\bhandleDragStart\b/g, 'form.handleDragStart')
  .replace(/\bhandleDragMove\b/g, 'form.handleDragMove')
  .replace(/\bhandleDragEnd\b/g, 'form.handleDragEnd')}
    );
  }

  return (
    <Fragment>
${slice(lines, 440, 501)
  .replace(/\btForm\b/g, 'form.tForm')
  .replace(/\btGroups\b/g, 'form.tGroups')
  .replace(/\btCommon\b/g, 'tCommon')
  .replace(/\bisDialogOpen\b/g, 'form.isDialogOpen')
  .replace(/\brequestClose\b/g, 'form.requestClose')
  .replace(/\boverlayStyle\b/g, 'form.overlayStyle')
  .replace(/\bcontentStyle\b/g, 'form.contentStyle')
  .replace(/\bdragStyle\b/g, 'form.dragStyle')
  .replace(/\bhandleDragStart\b/g, 'form.handleDragStart')
  .replace(/\bhandleDragMove\b/g, 'form.handleDragMove')
  .replace(/\bhandleDragEnd\b/g, 'form.handleDragEnd')
  .replace(/\bisGroupActive\b/g, 'form.isGroupActive')
  .replace(/\bisFormBusy\b/g, 'form.isFormBusy')
  .replace(/\bonToggleActive\b/g, 'props.onToggleActive')}
            <EditGroupFormFields {...form} handleSubmit={form.handleSubmit} onSubmit={form.onSubmit} />
${slice(lines, 724, 727)}
    </Fragment>
  );
}
`;

  // Fix main - the slice 440-501 + fields + closing needs adjustment
  const mainBody = `'use client';

import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Fragment } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/shared/lib/utils';
import { ADMIN_ICON_BUTTON_SM_CLASS } from '@/shared/lib/admin-control-theme';
import {
  portalSheetLayerProps,
  stackedSheetDialogHandlers,
  stackedSheetOverlayClassName,
} from '@/shared/lib/sheet-stack';
import { PORTAL_DESKTOP_SIDE_SHEET_CLASS } from '@/shared/lib/portal-form-sheet-classes';
import { X } from 'lucide-react';
import { useEditGroupForm } from './edit-group-form/useEditGroupForm';
import { EditGroupFormFields } from './edit-group-form/EditGroupFormFields';
import { EditGroupFormRegenerateDialog } from './edit-group-form/EditGroupFormRegenerateDialog';
import type { EditGroupFormProps } from './edit-group-form/edit-group-form.types';

export type { EditGroupFormProps } from './edit-group-form/edit-group-form.types';

export function EditGroupForm(props: EditGroupFormProps) {
  const form = useEditGroupForm(props);
  const tCommon = useTranslations('common');

  if (form.isLoading) {
    return (
${slice(lines, 393, 437)
  .replace(/\btForm\b/g, 'form.tForm')
  .replace(/\btCommon\b/g, 'tCommon')
  .replace(/\brequestClose\b/g, 'form.requestClose')
  .replace(/\bisDialogOpen\b/g, 'form.isDialogOpen')
  .replace(/\boverlayStyle\b/g, 'form.overlayStyle')
  .replace(/\bcontentStyle\b/g, 'form.contentStyle')
  .replace(/\bisBaseLayer\b/g, 'form.isBaseLayer')
  .replace(/\bdragStyle\b/g, 'form.dragStyle')
  .replace(/\bhandleDragStart\b/g, 'form.handleDragStart')
  .replace(/\bhandleDragMove\b/g, 'form.handleDragMove')
  .replace(/\bhandleDragEnd\b/g, 'form.handleDragEnd')}
    );
  }

  return (
    <Fragment>
${slice(lines, 441, 500)
  .replace(/\btForm\b/g, 'form.tForm')
  .replace(/\btGroups\b/g, 'form.tGroups')
  .replace(/\btCommon\b/g, 'tCommon')
  .replace(/\bisDialogOpen\b/g, 'form.isDialogOpen')
  .replace(/\brequestClose\b/g, 'form.requestClose')
  .replace(/\boverlayStyle\b/g, 'form.overlayStyle')
  .replace(/\bcontentStyle\b/g, 'form.contentStyle')
  .replace(/\bdragStyle\b/g, 'form.dragStyle')
  .replace(/\bhandleDragStart\b/g, 'form.handleDragStart')
  .replace(/\bhandleDragMove\b/g, 'form.handleDragMove')
  .replace(/\bhandleDragEnd\b/g, 'form.handleDragEnd')
  .replace(/\bisGroupActive\b/g, 'form.isGroupActive')
  .replace(/\bisFormBusy\b/g, 'form.isFormBusy')
  .replace(/\bonToggleActive\b/g, 'props.onToggleActive')}
            <EditGroupFormFields {...form} handleSubmit={form.handleSubmit} onSubmit={form.onSubmit} />
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>

      <EditGroupFormRegenerateDialog
        open={form.regenerateDialogOpen}
        onOpenChange={form.setRegenerateDialogOpen}
        tForm={form.tForm}
        onConfirmRegenerate={form.onConfirmRegenerate}
      />
    </Fragment>
  );
}
`;

  fs.writeFileSync(srcPath, mainBody);
  console.log('EditGroupForm lines:', readLines(srcPath).length);
}

function splitEditStudentForm() {
  const srcPath = path.resolve('apps/web/src/features/students/components/EditStudentForm.tsx');
  const dir = path.resolve('apps/web/src/features/students/components/edit-student-form');
  const lines = readLines(srcPath);
  fs.mkdirSync(dir, { recursive: true });

  fs.writeFileSync(
    path.join(dir, 'edit-student-form.types.ts'),
    `import type { UserStatus } from '@/types';

${slice(lines, 43, 46)}

${slice(lines, 48, 72)}
`,
  );

  fs.writeFileSync(
    path.join(dir, 'edit-student-form.constants.ts'),
    `import { cn } from '@/shared/lib/utils';
import { ADMIN_FORM_INPUT_CLASS } from '@/shared/lib/admin-control-theme';

export const ADMIN_TEXTAREA_CLASS = cn(
  ADMIN_FORM_INPUT_CLASS,
  'h-auto min-h-[5.5rem] resize-none py-2',
);
`,
  );

  const hookHeader = `'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslations } from 'next-intl';
import { useUpdateStudent, useStudent, type UpdateStudentDto } from '@/features/students';
import { useGroups } from '@/features/groups';
import { useCenters } from '@/features/centers';
import { useState, useEffect, useMemo, useRef, type TouchEvent } from 'react';
import type { UserStatus } from '@/types';
import { getErrorMessage } from '@/shared/lib/api';
import {
  portalSheetLayerProps,
  stackedSheetDialogHandlers,
  useSheetStackZIndex,
  stackedSheetOverlayClassName,
} from '@/shared/lib/sheet-stack';
import {
  ensureCurrentGroupInList,
  filterAssignableGroupsByCenter,
} from '../../lib/group-center-assignment';
import { computeAgeFromDob } from '../../student-account-form.schema';
import { isoToDmy, resolveDmyOrIsoToIso } from '@/shared/lib/dmy-date';
import type { EditStudentFormProps, UpdateStudentFormData } from './edit-student-form.types';

export function useEditStudentForm({ open, onOpenChange, studentId }: EditStudentFormProps) {
`;

  fs.writeFileSync(
    path.join(dir, 'useEditStudentForm.ts'),
    `${hookHeader}
${slice(lines, 75, 381)}
  return {
    t,
    tForm,
    tVal,
    tCommon,
    tStatus,
    tSettings,
    updateStudentSchema,
    resolver,
    errorMessage,
    setErrorMessage,
    successMessage,
    setSuccessMessage,
    dragOffsetY,
    isDragging,
    isSettling,
    updateStudent,
    student,
    isLoadingStudent,
    register,
    handleSubmit,
    errors,
    isSubmitting,
    dirtyFields,
    reset,
    watch,
    setValue,
    watchedCenterId,
    watchedGroupId,
    watchedStatus,
    watchedDob,
    watchedFirstLessonDate,
    watchedAge,
    computedAge,
    effectiveAge,
    showParentSection,
    groupsForCenter,
    allGroups,
    centers,
    statusOptions,
    isLoadingGroups,
    isLoadingCenters,
    handleDragStart,
    handleDragMove,
    handleDragEnd,
    dragStyle,
    onSubmit,
    requestClose,
    overlayStyle,
    contentStyle,
    isBaseLayer,
    open,
    onOpenChange,
  };
}
`,
  );

  fs.writeFileSync(
    path.join(dir, 'EditStudentFormFields.tsx'),
    `'use client';

import { Button, Input, Label } from '@/shared/components/ui';
import { cn } from '@/shared/lib/utils';
import {
  ADMIN_DATE_INPUT_CLASS,
  ADMIN_FORM_INPUT_CLASS,
  ADMIN_OUTLINE_BUTTON_CLASS,
  ADMIN_PRIMARY_BUTTON_CLASS,
} from '@/shared/lib/admin-control-theme';
import { SingleSelectDropdown } from '@/shared/components/ui/single-select-dropdown';
import { DmyDateInput } from '@/shared/components/ui/dmy-date-input';
import type { UserStatus } from '@/types';
import { ADMIN_TEXTAREA_CLASS } from './edit-student-form.constants';
import type { UpdateStudentFormData } from './edit-student-form.types';
import type { useEditStudentForm } from './useEditStudentForm';

type EditStudentFormFieldsProps = ReturnType<typeof useEditStudentForm>;

export function EditStudentFormFields(props: EditStudentFormFieldsProps) {
  const {
    t,
    tForm,
    tCommon,
    tSettings,
    tStatus,
    successMessage,
    errorMessage,
    handleSubmit,
    onSubmit,
    register,
    errors,
    isSubmitting,
    setValue,
    watchedDob,
    watchedFirstLessonDate,
    watchedStatus,
    watchedCenterId,
    watchedGroupId,
    effectiveAge,
    showParentSection,
    statusOptions,
    centers,
    groupsForCenter,
    isLoadingGroups,
    isLoadingCenters,
    updateStudent,
    requestClose,
  } = props;

  return (
${slice(lines, 431, 744)}
  );
}
`,
  );

  fs.writeFileSync(
    srcPath,
    `'use client';

import * as DialogPrimitive from '@radix-ui/react-dialog';
import { useTranslations } from 'next-intl';
import { cn } from '@/shared/lib/utils';
import { ADMIN_ICON_BUTTON_SM_CLASS } from '@/shared/lib/admin-control-theme';
import {
  portalSheetLayerProps,
  stackedSheetDialogHandlers,
  stackedSheetOverlayClassName,
} from '@/shared/lib/sheet-stack';
import { PORTAL_DESKTOP_SIDE_SHEET_CLASS } from '@/shared/lib/portal-form-sheet-classes';
import { X } from 'lucide-react';
import { useEditStudentForm } from './edit-student-form/useEditStudentForm';
import { EditStudentFormFields } from './edit-student-form/EditStudentFormFields';
import type { EditStudentFormProps } from './edit-student-form/edit-student-form.types';

export type { EditStudentFormProps } from './edit-student-form/edit-student-form.types';

export function EditStudentForm(props: EditStudentFormProps) {
  const form = useEditStudentForm(props);
  const tCommon = useTranslations('common');

  return (
${slice(lines, 385, 430)
  .replace(/\bopen\b/g, 'form.open')
  .replace(/\bonOpenChange\b/g, 'form.onOpenChange')
  .replace(/\btForm\b/g, 'form.tForm')
  .replace(/\btCommon\b/g, 'tCommon')
  .replace(/\bdragStyle\b/g, 'form.dragStyle')
  .replace(/\boverlayStyle\b/g, 'form.overlayStyle')
  .replace(/\bcontentStyle\b/g, 'form.contentStyle')
  .replace(/\bisBaseLayer\b/g, 'form.isBaseLayer')
  .replace(/\bhandleDragStart\b/g, 'form.handleDragStart')
  .replace(/\bhandleDragMove\b/g, 'form.handleDragMove')
  .replace(/\bhandleDragEnd\b/g, 'form.handleDragEnd')}
        {form.isLoadingStudent ? (
${slice(lines, 426, 429)}
        ) : (
          <EditStudentFormFields {...form} />
        )}
${slice(lines, 746, 750)}
  );
}
`,
  );

  console.log('EditStudentForm lines:', readLines(srcPath).length);
}

splitEditGroupForm();
splitEditStudentForm();
console.log('Frontend forms split done');
