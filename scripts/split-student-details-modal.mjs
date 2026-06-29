import fs from 'node:fs';
import path from 'node:path';

const srcPath = path.resolve('apps/web/src/features/students/components/StudentDetailsModal.tsx');
const dir = path.resolve('apps/web/src/features/students/components/student-details-modal');
const lines = fs.readFileSync(srcPath, 'utf8').split(/\r?\n/);
const slice = (a, b) => lines.slice(a - 1, b).join('\n');

fs.mkdirSync(dir, { recursive: true });

fs.writeFileSync(
  path.join(dir, 'student-details-modal.types.ts'),
  `import type { Student } from '../../types';

${slice(44, 54)}
`,
);

fs.writeFileSync(
  path.join(dir, 'student-details-modal.util.ts'),
  `import { getAppDateLocaleTag } from '@/shared/lib/utils';
import type { StudentLifecycleStatus } from '../../types';

${slice(56, 94).replace(/^function /gm, 'export function ')}

${slice(124, 135).replace(/^function /, 'export function ')}
`,
);

fs.writeFileSync(
  path.join(dir, 'StudentDetailsModalStatCard.tsx'),
  `'use client';

import { PublicAssetImage } from '@/shared/components/ui';
import { cn } from '@/shared/lib/utils';
import { portalInnerCardClass } from '@/shared/lib/portal-theme';

type StudentModalStatCardProps = {
  label: string;
  value: string;
  caption: string;
  iconSrc: string;
  iconBg: string;
};

${slice(104, 122).replace('function StudentModalStatCard', 'export function StudentDetailsModalStatCard')}
`,
);

const hookImports = `'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type TouchEvent } from 'react';
import { useTranslations } from 'next-intl';
import { useOutsidePress } from '@/shared/hooks/useOutsidePress';
import { useSheetStackZIndex } from '@/shared/lib/sheet-stack';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { getAdminPortalBasePath } from '@/shared/lib/role-routes';
import { useStudent, useStudentStatistics } from '../../hooks/useStudents';
import type { StudentDetailsModalProps } from './student-details-modal.types';

export function useStudentDetailsModal(props: StudentDetailsModalProps) {
  const {
    studentId,
    open,
    onClose,
    onEdit,
    onDelete,
    onDeactivate,
    onFeedback,
    actionsDisabled = false,
  } = props;
`;

fs.writeFileSync(
  path.join(dir, 'useStudentDetailsModal.ts'),
  `${hookImports}
${slice(148, 293)}
  return {
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
    handleDragStart,
    handleDragMove,
    handleDragEnd,
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
  };
}
`,
);

const mainImports = `'use client';

import * as DialogPrimitive from '@radix-ui/react-dialog';
import Image from 'next/image';
import Link from 'next/link';
import { AdminAvatarPhotoLightbox, Avatar, Badge } from '@/shared/components/ui';
import { ADMIN_ICON_BUTTON_SM_CLASS } from '@/shared/lib/admin-control-theme';
import { cn, formatCurrency, formatPhoneForDisplay } from '@/shared/lib/utils';
import { PORTAL_DESKTOP_SIDE_SHEET_CLASS } from '@/shared/lib/portal-form-sheet-classes';
import { portalPrimaryButtonClass } from '@/shared/lib/portal-theme';
import { STUDENT_DASHBOARD_ASSETS } from '@/features/student-dashboard/assets';
import {
  portalSheetLayerProps,
  stackedSheetDialogHandlers,
  stackedSheetOverlayClassName,
} from '@/shared/lib/sheet-stack';
import {
  Building2,
  Calendar,
  CircleDollarSign,
  FileText,
  GraduationCap,
  Mail,
  MessageCircle,
  MoreVertical,
  Pencil,
  Phone,
  Trash2,
  UserCircle,
  Users,
  X,
} from 'lucide-react';
import { formatDateOfBirth, formatDisplayDate, formatLifecycle } from './student-details-modal/student-details-modal.util';
import { StudentDetailsModalStatCard } from './student-details-modal/StudentDetailsModalStatCard';
import { useStudentDetailsModal } from './student-details-modal/useStudentDetailsModal';
import type { StudentDetailsModalProps } from './student-details-modal/student-details-modal.types';

export type { StudentDetailsModalProps } from './student-details-modal/student-details-modal.types';

export function StudentDetailsModal(props: StudentDetailsModalProps) {
  const {
    studentId,
    open,
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
    handleDragStart,
    handleDragMove,
    handleDragEnd,
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
  } = useStudentDetailsModal(props);

`;

fs.writeFileSync(srcPath, `${mainImports}\n${slice(295, 741)}\n}\n`);

console.log('StudentDetailsModal lines:', fs.readFileSync(srcPath, 'utf8').split(/\r?\n/).length);
