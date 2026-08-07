'use client';

import { useEffect, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { DEFAULT_GROUP_LEVEL } from '@/features/groups/lib/group-level-options';
import { computeAgeFromDob } from '../../student-account-form.schema';
import type { StudentAccountFormFieldsCrmLeadLayoutProps } from './student-account-crm-layout.types';

export function useStudentAccountCrmLayoutFields(
  props: StudentAccountFormFieldsCrmLeadLayoutProps,
) {
  const { watch, setValue, lockedCenterId, groupsForCenter, centers } = props;
  const tForm = useTranslations('students.form');
  const tCommon = useTranslations('common');
  const t = useTranslations('students');

  const watchedCenterId = watch('centerId') || '';
  const effectiveCenterId = lockedCenterId || watchedCenterId || '';
  const hasCenterScope = Boolean(effectiveCenterId);
  const watchedLevelId = watch('levelId') || DEFAULT_GROUP_LEVEL;
  const watchedGroupId = watch('groupId') || '';
  const watchedDateOfBirth = watch('dateOfBirth') ?? '';
  const ageFromDob = useMemo(
    () => computeAgeFromDob(watchedDateOfBirth.trim() || undefined),
    [watchedDateOfBirth],
  );
  const showManualAgeInput = ageFromDob === undefined;

  useEffect(() => {
    if (ageFromDob !== undefined) {
      setValue('manualAge', undefined, { shouldDirty: true, shouldValidate: true });
    }
  }, [ageFromDob, setValue]);

  const groupPlaceholder = !hasCenterScope
    ? tForm('selectCenterFirst')
    : props.isLoadingGroups
      ? tCommon('loading')
      : groupsForCenter.length === 0
        ? tForm('noGroupsForCenter')
        : t('selectGroup');

  const centerOptions = useMemo(
    () => [
      { id: '', label: '—' },
      ...centers.map((center) => ({ id: center.id, label: center.name })),
    ],
    [centers],
  );

  const groupOptions = useMemo(
    () => [
      { id: '', label: groupPlaceholder },
      ...groupsForCenter.map((group) => ({
        id: group.id,
        label: `${group.name}${group.level ? ` (${group.level})` : ''}`.trim(),
      })),
    ],
    [groupPlaceholder, groupsForCenter],
  );

  const handleCenterChange = (nextCenterId: string) => {
    setValue('centerId', nextCenterId, { shouldDirty: true, shouldValidate: true });
    setValue('teacherId', '', { shouldDirty: true });
    setValue('groupId', '', { shouldDirty: true });
  };

  return {
    watchedCenterId,
    effectiveCenterId,
    hasCenterScope,
    watchedLevelId,
    watchedGroupId,
    watchedDateOfBirth,
    ageFromDob,
    showManualAgeInput,
    groupPlaceholder,
    centerOptions,
    groupOptions,
    handleCenterChange,
  };
}
