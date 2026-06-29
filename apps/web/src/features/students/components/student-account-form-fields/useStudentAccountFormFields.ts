'use client';

import { useEffect, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { formatPhoneForDisplay } from '@/shared/lib/utils';
import { computeAgeFromDob } from '../../student-account-form.schema';
import { DEFAULT_GROUP_LEVEL } from '@/features/groups/lib/group-level-options';
import { formFieldId } from './student-account-form-fields.constants';
import type { StudentAccountFormFieldsProps } from './student-account-form-fields.types';

export function useStudentAccountFormFields(props: StudentAccountFormFieldsProps) {
  const { watch, setValue, teachers, groupsForTeacher, centers, idPrefix = '' } = props;
  const t = useTranslations('students');
  const tCommon = useTranslations('common');

  const p = (id: string) => formFieldId(idPrefix, id);
  const watchedTeacherId = watch('teacherId') || '';
  const watchedGroupId = watch('groupId') || '';
  const watchedLevelId = watch('levelId') || DEFAULT_GROUP_LEVEL;
  const watchedCenterId = watch('centerId') || '';
  const watchedDateOfBirth = watch('dateOfBirth') ?? '';
  const watchedFirstLessonDate = watch('firstLessonDate') ?? '';
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

  const selectedTeacher = teachers.find((te) => te.id === watchedTeacherId);
  const centerNamesFromTeacher = [
    ...new Set((selectedTeacher?.centerLinks ?? []).map((l) => l.center.name).filter(Boolean)),
  ];
  const centerNamesFromGroups = [
    ...new Set(groupsForTeacher.map((g) => g.center?.name).filter(Boolean) as string[]),
  ];
  const teacherCentersLabel = [...new Set([...centerNamesFromTeacher, ...centerNamesFromGroups])].join(
    ', ',
  );

  const teacherOptions = useMemo(
    () => [
      { id: '', label: t('selectTeacher') },
      ...teachers.map((teacher) => ({
        id: teacher.id,
        label: `${teacher.user?.firstName ?? ''} ${teacher.user?.lastName ?? ''}${
          teacher.user?.phone ? ` - ${formatPhoneForDisplay(teacher.user.phone)}` : ''
        }`.trim(),
      })),
    ],
    [teachers, t],
  );

  const groupPlaceholder = watchedTeacherId ? tCommon('notAssigned') : t('selectTeacherFirst');
  const groupOptions = useMemo(
    () => [
      { id: '', label: groupPlaceholder },
      ...groupsForTeacher.map((group) => ({
        id: group.id,
        label: `${group.name}${group.level ? ` (${group.level})` : ''}`.trim(),
      })),
    ],
    [groupPlaceholder, groupsForTeacher],
  );

  const centerSegmentOptions = useMemo(
    () => centers.map((center) => ({ id: center.id, label: center.name })),
    [centers],
  );

  return {
    p,
    watchedTeacherId,
    watchedGroupId,
    watchedLevelId,
    watchedCenterId,
    watchedDateOfBirth,
    watchedFirstLessonDate,
    ageFromDob,
    showManualAgeInput,
    teacherCentersLabel,
    teacherOptions,
    groupOptions,
    centerSegmentOptions,
  };
}
