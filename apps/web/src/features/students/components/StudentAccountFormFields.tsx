'use client';

import { StudentAccountFormFieldsBillingSection } from './student-account-form-fields/StudentAccountFormFieldsBillingSection';
import { StudentAccountFormFieldsEnrollmentSection } from './student-account-form-fields/StudentAccountFormFieldsEnrollmentSection';
import { StudentAccountFormFieldsIdentitySection } from './student-account-form-fields/StudentAccountFormFieldsIdentitySection';
import { StudentAccountFormFieldsParentSection } from './student-account-form-fields/StudentAccountFormFieldsParentSection';
import { useStudentAccountFormFields } from './student-account-form-fields/useStudentAccountFormFields';
import type { StudentAccountFormFieldsProps } from './student-account-form-fields/student-account-form-fields.types';

export type {
  StudentAccountFormFieldsProps,
  StudentAccountGroupOption,
  StudentAccountTeacherOption,
} from './student-account-form-fields/student-account-form-fields.types';

export function StudentAccountFormFields(props: StudentAccountFormFieldsProps) {
  const {
    register,
    errors,
    watch,
    setValue,
    showParentSection,
    groupsForTeacher,
    isLoadingGroups,
    isLoadingTeachers,
    isSubmitting,
    centers,
    isLoadingCenters = false,
    showCenterSelect = true,
    assignedCenterDisplay = null,
    idPrefix = '',
  } = props;

  const layout = useStudentAccountFormFields(props);
  const shell = {
    register,
    errors,
    watch,
    setValue,
    isSubmitting,
    idPrefix,
    p: layout.p,
  };

  return (
    <div className="space-y-4">
      <StudentAccountFormFieldsIdentitySection {...shell} />
      <StudentAccountFormFieldsEnrollmentSection
        {...shell}
        groupsForTeacher={groupsForTeacher}
        isLoadingGroups={isLoadingGroups}
        isLoadingTeachers={isLoadingTeachers}
        centers={centers}
        isLoadingCenters={isLoadingCenters}
        showCenterSelect={showCenterSelect}
        assignedCenterDisplay={assignedCenterDisplay}
        watchedTeacherId={layout.watchedTeacherId}
        watchedGroupId={layout.watchedGroupId}
        watchedLevelId={layout.watchedLevelId}
        watchedCenterId={layout.watchedCenterId}
        watchedDateOfBirth={layout.watchedDateOfBirth}
        watchedFirstLessonDate={layout.watchedFirstLessonDate}
        ageFromDob={layout.ageFromDob}
        showManualAgeInput={layout.showManualAgeInput}
        teacherCentersLabel={layout.teacherCentersLabel}
        levelOptions={layout.levelOptions}
        teacherOptions={layout.teacherOptions}
        groupOptions={layout.groupOptions}
        centerOptions={layout.centerOptions}
      />
      {showParentSection ? <StudentAccountFormFieldsParentSection {...shell} /> : null}
      <StudentAccountFormFieldsBillingSection {...shell} />
    </div>
  );
}
