'use client';

import { StudentAccountCrmIdentitySections } from './student-account-crm-layout/StudentAccountCrmIdentitySections';
import { StudentAccountCrmProfileSections } from './student-account-crm-layout/StudentAccountCrmProfileSections';
import { StudentAccountCrmEnrollmentSection } from './student-account-crm-layout/StudentAccountCrmEnrollmentSection';
import { StudentAccountCrmBillingSection } from './student-account-crm-layout/StudentAccountCrmBillingSection';
import { useStudentAccountCrmLayoutFields } from './student-account-crm-layout/useStudentAccountCrmLayoutFields';
import type { StudentAccountFormFieldsCrmLeadLayoutProps } from './student-account-crm-layout/student-account-crm-layout.types';

export type { StudentAccountFormFieldsCrmLeadLayoutProps } from './student-account-crm-layout/student-account-crm-layout.types';

export function StudentAccountFormFieldsCrmLeadLayout(
  props: StudentAccountFormFieldsCrmLeadLayoutProps,
) {
  const {
    register,
    setValue,
    errors,
    watch,
    showParentSection,
    isSubmitting,
    idPrefix = '',
    isLoadingGroups,
    isLoadingCenters,
    showCenterSelect,
    assignedCenterDisplay,
    groupsForCenter,
  } = props;

  const layout = useStudentAccountCrmLayoutFields(props);
  const phoneDigits = (watch('phone') ?? '').replace(/\D/g, '');
  const parentPhoneDigits = (watch('parentPhone') ?? '').replace(/\D/g, '');
  const watchedFirstLessonDate = watch('firstLessonDate') ?? '';

  const shell = { register, setValue, errors, watch, isSubmitting, idPrefix };

  return (
    <div className="space-y-6">
      <StudentAccountCrmIdentitySections {...shell} phoneDigits={phoneDigits} />
      <StudentAccountCrmProfileSections
        {...shell}
        showParentSection={showParentSection}
        watchedDateOfBirth={layout.watchedDateOfBirth}
        watchedFirstLessonDate={watchedFirstLessonDate}
        ageFromDob={layout.ageFromDob}
        showManualAgeInput={layout.showManualAgeInput}
        parentPhoneDigits={parentPhoneDigits}
      />
      <StudentAccountCrmEnrollmentSection
        {...shell}
        groupsForCenter={groupsForCenter}
        centers={props.centers}
        isLoadingGroups={isLoadingGroups}
        isLoadingCenters={isLoadingCenters}
        showCenterSelect={showCenterSelect}
        assignedCenterDisplay={assignedCenterDisplay}
        lockedCenterId={props.lockedCenterId}
        watchedCenterId={layout.watchedCenterId}
        effectiveCenterId={layout.effectiveCenterId}
        hasCenterScope={layout.hasCenterScope}
        watchedLevelId={layout.watchedLevelId}
        watchedGroupId={layout.watchedGroupId}
        groupPlaceholder={layout.groupPlaceholder}
        centerOptions={layout.centerOptions}
        groupOptions={layout.groupOptions}
        handleCenterChange={layout.handleCenterChange}
      />
      <StudentAccountCrmBillingSection {...shell} />
    </div>
  );
}
