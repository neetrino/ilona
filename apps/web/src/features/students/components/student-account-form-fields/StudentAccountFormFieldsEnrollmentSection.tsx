'use client';

import { useTranslations } from 'next-intl';
import { Input, Label, SegmentedControl } from '@/shared/components/ui';
import { cn } from '@/shared/lib/utils';
import { DmyDateInput } from '@/shared/components/ui/dmy-date-input';
import { SingleSelectDropdown } from '@/shared/components/ui/single-select-dropdown';
import { computeAgeFromDob } from '../../student-account-form.schema';
import { FORM_INPUT_CLASS_NAME, FORM_READONLY_FIELD_CLASS } from './student-account-form-fields.constants';
import type { StudentAccountFormFieldsEnrollmentSectionProps } from './student-account-form-fields.types';

export function StudentAccountFormFieldsEnrollmentSection({
  register,
  errors,
  setValue,
  isSubmitting,
  p,
  groupsForTeacher,
  isLoadingGroups,
  isLoadingTeachers,
  isLoadingCenters = false,
  showCenterSelect = true,
  assignedCenterDisplay = null,
  watchedTeacherId,
  watchedGroupId,
  watchedCenterId,
  watchedDateOfBirth,
  watchedFirstLessonDate,
  ageFromDob,
  showManualAgeInput,
  teacherCentersLabel,
  teacherOptions,
  groupOptions,
  centerSegmentOptions,
}: StudentAccountFormFieldsEnrollmentSectionProps) {
  const t = useTranslations('students');
  const tForm = useTranslations('students.form');
  const tCommon = useTranslations('common');

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor={p('dateOfBirth')}>{t('dateOfBirth')}</Label>
          <DmyDateInput
            id={p('dateOfBirth')}
            value={watchedDateOfBirth}
            placeholder={tForm('dateOfBirthPlaceholder')}
            onChange={(value) => {
              setValue('dateOfBirth', value, { shouldValidate: true, shouldDirty: true });
              const fromDob = computeAgeFromDob(value.trim() || undefined);
              if (fromDob !== undefined) {
                setValue('manualAge', undefined, { shouldDirty: true, shouldValidate: true });
              }
            }}
            className={FORM_INPUT_CLASS_NAME}
            disabled={isSubmitting}
          />
          {errors.dateOfBirth && (
            <p className="text-sm text-red-600">{errors.dateOfBirth.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor={p('manualAge')}>{tForm('ageYears')}</Label>
          {showManualAgeInput ? (
            <Input
              id={p('manualAge')}
              type="number"
              min={0}
              className={FORM_INPUT_CLASS_NAME}
              {...register('manualAge')}
              error={errors.manualAge?.message}
            />
          ) : (
            <>
              <p className={FORM_READONLY_FIELD_CLASS}>
                {ageFromDob}
              </p>
              <p className="text-xs text-slate-500">{tForm('ageHint', { age: ageFromDob! })}</p>
            </>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor={p('firstLessonDate')}>{tForm('firstLessonDate')}</Label>
          <DmyDateInput
            id={p('firstLessonDate')}
            value={watchedFirstLessonDate}
            placeholder={tForm('firstLessonDatePlaceholder')}
            onChange={(value) =>
              setValue('firstLessonDate', value, { shouldValidate: true, shouldDirty: true })
            }
            className={FORM_INPUT_CLASS_NAME}
            disabled={isSubmitting}
          />
          {errors.firstLessonDate && (
            <p className="text-sm text-red-600">{errors.firstLessonDate.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor={p('teacherId')}>{t('teacher')}</Label>
          <input type="hidden" {...register('teacherId')} />
          <SingleSelectDropdown
            id={p('teacherId')}
            options={teacherOptions}
            value={watchedTeacherId}
            triggerClassName={FORM_INPUT_CLASS_NAME}
            onValueChange={(nextValue) =>
              setValue('teacherId', nextValue ?? '', { shouldDirty: true, shouldValidate: true })
            }
            isLoading={isLoadingTeachers}
            disabled={isLoadingTeachers || isSubmitting}
            error={errors.teacherId?.message ?? null}
          />
          {errors.teacherId && <p className="text-sm text-red-600">{errors.teacherId.message}</p>}
          {isLoadingTeachers && <p className="text-sm text-slate-500">{t('loadingTeachers')}</p>}
          {watchedTeacherId && teacherCentersLabel ? (
            <p className="text-xs text-slate-500">
              {tForm('teacherCenters')}: {teacherCentersLabel}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor={p('groupId')}>{t('group')}</Label>
          <input type="hidden" {...register('groupId')} />
          <SingleSelectDropdown
            id={p('groupId')}
            options={groupOptions}
            value={watchedGroupId}
            triggerClassName={FORM_INPUT_CLASS_NAME}
            onValueChange={(nextValue) =>
              setValue('groupId', nextValue ?? '', { shouldDirty: true, shouldValidate: true })
            }
            isLoading={isLoadingGroups}
            disabled={isLoadingGroups || !watchedTeacherId || isSubmitting}
            error={errors.groupId?.message ?? null}
          />
          {errors.groupId && <p className="text-sm text-red-600">{errors.groupId.message}</p>}
          {watchedGroupId ? (
            <p className="text-xs text-slate-500">
              {tCommon('center')}:{' '}
              {groupsForTeacher.find((g) => g.id === watchedGroupId)?.center?.name ?? t('notAvailable')}
            </p>
          ) : null}
        </div>
      </div>

      {showCenterSelect ? (
        <div className="space-y-2">
          <Label>{tCommon('center')}</Label>
          <input type="hidden" {...register('centerId')} />
          {isLoadingCenters ? (
            <p className="text-sm text-slate-500">{tCommon('loading')}</p>
          ) : centerSegmentOptions.length > 0 ? (
            <SegmentedControl
              options={centerSegmentOptions}
              value={watchedCenterId}
              onChange={(nextValue) =>
                setValue('centerId', nextValue, { shouldDirty: true, shouldValidate: true })
              }
              allowDeselect
              disabled={isSubmitting}
              aria-label={tCommon('center')}
            />
          ) : (
            <p className="text-sm text-slate-500">{tCommon('notAssigned')}</p>
          )}
          {errors.centerId && <p className="text-sm text-red-600">{errors.centerId.message}</p>}
        </div>
      ) : assignedCenterDisplay ? (
        <div className="space-y-2">
          <Label>{tCommon('center')}</Label>
          <p className={cn(FORM_READONLY_FIELD_CLASS, 'h-auto min-h-11 py-2')}>
            {assignedCenterDisplay}
          </p>
        </div>
      ) : null}
    </>
  );
}
