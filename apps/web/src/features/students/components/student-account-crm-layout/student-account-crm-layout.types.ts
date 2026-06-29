import type { FieldErrors, UseFormRegister, UseFormSetValue, UseFormWatch } from 'react-hook-form';
import type { CreateStudentWithConfirmFormData } from '../../student-account-form.schema';
import type { GroupAssignmentOption } from '../../lib/group-center-assignment';

export type StudentAccountFormFieldsCrmLeadLayoutProps = {
  register: UseFormRegister<CreateStudentWithConfirmFormData>;
  setValue: UseFormSetValue<CreateStudentWithConfirmFormData>;
  errors: FieldErrors<CreateStudentWithConfirmFormData>;
  watch: UseFormWatch<CreateStudentWithConfirmFormData>;
  showParentSection: boolean;
  groupsForCenter: GroupAssignmentOption[];
  centers: Array<{ id: string; name: string }>;
  isLoadingGroups: boolean;
  isLoadingCenters?: boolean;
  isSubmitting: boolean;
  showCenterSelect?: boolean;
  assignedCenterDisplay?: string | null;
  lockedCenterId?: string | null;
  idPrefix?: string;
};

export type StudentAccountCrmFieldShellProps = Pick<
  StudentAccountFormFieldsCrmLeadLayoutProps,
  'register' | 'setValue' | 'errors' | 'watch' | 'isSubmitting'
> & {
  idPrefix: string;
};

export type StudentAccountCrmEnrollmentProps = StudentAccountCrmFieldShellProps &
  Pick<
    StudentAccountFormFieldsCrmLeadLayoutProps,
    | 'groupsForCenter'
    | 'centers'
    | 'isLoadingGroups'
    | 'isLoadingCenters'
    | 'showCenterSelect'
    | 'assignedCenterDisplay'
    | 'lockedCenterId'
  > & {
    watchedCenterId: string;
    effectiveCenterId: string;
    hasCenterScope: boolean;
    watchedLevelId: string;
    watchedGroupId: string;
    groupPlaceholder: string;
    centerOptions: Array<{ id: string; label: string }>;
    groupOptions: Array<{ id: string; label: string }>;
    handleCenterChange: (nextCenterId: string) => void;
  };
