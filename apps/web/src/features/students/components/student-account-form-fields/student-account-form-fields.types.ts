import type { FieldErrors, UseFormRegister, UseFormSetValue, UseFormWatch } from 'react-hook-form';
import type { CreateStudentFormData } from '../../student-account-form.schema';

export type StudentAccountTeacherOption = {
  id: string;
  user: { firstName?: string | null; lastName?: string | null; phone?: string | null };
  centerLinks?: Array<{ center: { id: string; name: string } }>;
};

export type StudentAccountGroupOption = {
  id: string;
  name: string;
  level?: string | null;
  teacherId?: string | null;
  center?: { id: string; name: string };
};

export interface StudentAccountFormFieldsProps {
  register: UseFormRegister<CreateStudentFormData>;
  errors: FieldErrors<CreateStudentFormData>;
  watch: UseFormWatch<CreateStudentFormData>;
  setValue: UseFormSetValue<CreateStudentFormData>;
  computedAge: number | undefined;
  showParentSection: boolean;
  groupsForTeacher: StudentAccountGroupOption[];
  teachers: StudentAccountTeacherOption[];
  isLoadingGroups: boolean;
  isLoadingTeachers: boolean;
  isSubmitting: boolean;
  /** Active centers for manual Center assignment */
  centers: Array<{ id: string; name: string }>;
  isLoadingCenters?: boolean;
  /** When false (e.g. Manager CRM registration), Center dropdown is hidden; backend assigns center. */
  showCenterSelect?: boolean;
  /** Read-only label when `showCenterSelect` is false (e.g. manager’s branch name). */
  assignedCenterDisplay?: string | null;
  /** Prefix for input ids when multiple forms exist on one page */
  idPrefix?: string;
}

export type StudentAccountFormFieldShellProps = Pick<
  StudentAccountFormFieldsProps,
  'register' | 'errors' | 'watch' | 'setValue' | 'isSubmitting'
> & {
  idPrefix: string;
  p: (id: string) => string;
};

export type StudentAccountFormFieldsEnrollmentSectionProps = StudentAccountFormFieldShellProps &
  Pick<
    StudentAccountFormFieldsProps,
    | 'groupsForTeacher'
    | 'isLoadingGroups'
    | 'isLoadingTeachers'
    | 'centers'
    | 'isLoadingCenters'
    | 'showCenterSelect'
    | 'assignedCenterDisplay'
  > & {
    watchedTeacherId: string;
    watchedGroupId: string;
    watchedCenterId: string;
    watchedDateOfBirth: string;
    watchedFirstLessonDate: string;
    ageFromDob: number | undefined;
    showManualAgeInput: boolean;
    teacherCentersLabel: string;
    teacherOptions: Array<{ id: string; label: string }>;
    groupOptions: Array<{ id: string; label: string }>;
    centerSegmentOptions: Array<{ id: string; label: string }>;
    centerDropdownOptions: Array<{ id: string; label: string }>;
  };

export type StudentAccountFormFieldsParentSectionProps = StudentAccountFormFieldShellProps;

export type StudentAccountFormFieldsBillingSectionProps = StudentAccountFormFieldShellProps & {
  watchedLevelId: string;
};
