'use client';

import { useEffect, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import type { FieldErrors, UseFormRegister, UseFormSetValue, UseFormWatch } from 'react-hook-form';
import { Input, Label, PasswordInput } from '@/shared/components/ui';
import { DmyDateInput } from '@/shared/components/ui/dmy-date-input';
import { SingleSelectDropdown } from '@/shared/components/ui/single-select-dropdown';
import { formatPhoneForDisplay } from '@/shared/lib/utils';
import { computeAgeFromDob } from '../student-account-form.schema';
import type { CreateStudentFormData } from '../student-account-form.schema';

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

const dmyInputClassName =
  'flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';

const textareaClassName = `${dmyInputClassName} min-h-[6rem] resize-y`;

const LEVEL_FILTER_OPTIONS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;

export function StudentAccountFormFields({
  register,
  errors,
  watch,
  setValue,
  computedAge: _computedAge,
  showParentSection,
  groupsForTeacher,
  teachers,
  isLoadingGroups,
  isLoadingTeachers,
  isSubmitting,
  centers,
  isLoadingCenters = false,
  showCenterSelect = true,
  assignedCenterDisplay = null,
  idPrefix = '',
}: StudentAccountFormFieldsProps) {
  const t = useTranslations('students');
  const tForm = useTranslations('students.form');
  const tCommon = useTranslations('common');

  const p = (id: string) => (idPrefix ? `${idPrefix}-${id}` : id);
  const watchedTeacherId = watch('teacherId') || '';
  const watchedGroupId = watch('groupId') || '';
  const watchedLevelId = watch('levelId') || '';
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
    ...new Set(
      (selectedTeacher?.centerLinks ?? []).map((l) => l.center.name).filter(Boolean),
    ),
  ];
  const centerNamesFromGroups = [
    ...new Set(groupsForTeacher.map((g) => g.center?.name).filter(Boolean) as string[]),
  ];
  const teacherCentersLabel = [...new Set([...centerNamesFromTeacher, ...centerNamesFromGroups])].join(
    ', ',
  );

  const levelOptions = useMemo(
    () => [
      { id: '', label: tForm('anyLevel') },
      ...LEVEL_FILTER_OPTIONS.map((level) => ({ id: level, label: level })),
    ],
    [tForm],
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

  const centerOptions = useMemo(
    () => [
      { id: '', label: tCommon('notAssigned') },
      ...centers.map((center) => ({ id: center.id, label: center.name })),
    ],
    [centers, tCommon],
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor={p('firstName')}>
            {tCommon('firstName')} <span className="text-red-500">{tForm('requiredMark')}</span>
          </Label>
          <Input
            id={p('firstName')}
            {...register('firstName')}
            error={errors.firstName?.message}
            placeholder={tForm('firstNamePlaceholder')}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={p('lastName')}>
            {tCommon('lastName')} <span className="text-red-500">{tForm('requiredMark')}</span>
          </Label>
          <Input
            id={p('lastName')}
            {...register('lastName')}
            error={errors.lastName?.message}
            placeholder={tForm('lastNamePlaceholder')}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor={p('email')}>
          {tForm('email')} <span className="text-red-500">{tForm('requiredMark')}</span>
        </Label>
        <Input
          id={p('email')}
          type="email"
          {...register('email')}
          error={errors.email?.message}
          placeholder={tForm('emailPlaceholder')}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={p('password')}>
          {tForm('password')} <span className="text-red-500">{tForm('requiredMark')}</span>
        </Label>
        <PasswordInput
          id={p('password')}
          {...register('password')}
          error={errors.password?.message}
          placeholder={tForm('passwordPlaceholder')}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={p('phone')}>{tCommon('phone')}</Label>
        <Input
          id={p('phone')}
          type="tel"
          {...register('phone')}
          error={errors.phone?.message}
          placeholder={t('phonePlaceholder')}
        />
      </div>

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
            className={dmyInputClassName}
            disabled={isSubmitting}
          />
          {errors.dateOfBirth && (
            <p className="text-sm text-red-600">{errors.dateOfBirth.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor={p('manualAge')}>{tForm('ageYears')}</Label>
          {showManualAgeInput ? (
            <>
              <Input
                id={p('manualAge')}
                type="number"
                min={0}
                {...register('manualAge')}
                error={errors.manualAge?.message}
              />
            </>
          ) : (
            <>
              <p className="flex h-10 items-center rounded-md border border-input bg-muted/40 px-3 text-sm">
                {ageFromDob}
              </p>
              <p className="text-xs text-slate-500">{tForm('ageHint', { age: ageFromDob })}</p>
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
            className={dmyInputClassName}
            disabled={isSubmitting}
          />
          {errors.firstLessonDate && (
            <p className="text-sm text-red-600">{errors.firstLessonDate.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor={p('levelId')}>{tForm('levelOptional')}</Label>
        <input type="hidden" {...register('levelId')} />
        <SingleSelectDropdown
          id={p('levelId')}
          options={levelOptions}
          value={watchedLevelId}
          onValueChange={(nextValue) =>
            setValue('levelId', nextValue ?? '', { shouldDirty: true, shouldValidate: true })
          }
          disabled={isSubmitting}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor={p('teacherId')}>{t('teacher')}</Label>
          <input type="hidden" {...register('teacherId')} />
          <SingleSelectDropdown
            id={p('teacherId')}
            options={teacherOptions}
            value={watchedTeacherId}
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
          <Label htmlFor={p('centerId')}>{tCommon('center')}</Label>
          <input type="hidden" {...register('centerId')} />
          <SingleSelectDropdown
            id={p('centerId')}
            options={centerOptions}
            value={watchedCenterId}
            onValueChange={(nextValue) =>
              setValue('centerId', nextValue ?? '', { shouldDirty: true, shouldValidate: true })
            }
            isLoading={isLoadingCenters}
            disabled={isLoadingCenters || isSubmitting}
            error={errors.centerId?.message ?? null}
          />
          {errors.centerId && <p className="text-sm text-red-600">{errors.centerId.message}</p>}
        </div>
      ) : assignedCenterDisplay ? (
        <div className="space-y-2">
          <Label>{tCommon('center')}</Label>
          <p className="rounded-md border border-input bg-muted/40 px-3 py-2 text-sm text-slate-700">
            {assignedCenterDisplay}
          </p>
        </div>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor={p('monthlyFee')}>
          {t('monthlyFeeLabel')} (֏) <span className="text-red-500">{tForm('requiredMark')}</span>
        </Label>
        <Input
          id={p('monthlyFee')}
          type="number"
          step="0.01"
          min="0"
          {...register('monthlyFee', { valueAsNumber: true })}
          error={errors.monthlyFee?.message}
          placeholder="50000"
        />
      </div>

      {showParentSection && (
        <div className="border-t pt-4 transition-all duration-300 ease-in-out">
          <h3 className="text-sm font-semibold text-slate-800 mb-2">
            {tCommon('parentInformation')}
            <span className="text-red-500 ml-1">{tForm('requiredMark')}</span>
          </h3>
          <p className="text-xs text-slate-500 mb-4">{tForm('parentDetailsSection')}</p>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor={p('parentName')}>
                {t('parentName')} <span className="text-red-500">{tForm('requiredMark')}</span>
              </Label>
              <Input
                id={p('parentName')}
                {...register('parentName')}
                error={errors.parentName?.message}
                placeholder={tForm('firstNamePlaceholder')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={p('parentSurname')}>{tCommon('lastName')}</Label>
              <Input
                id={p('parentSurname')}
                {...register('parentSurname')}
                error={errors.parentSurname?.message}
                placeholder={tForm('lastNamePlaceholder')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={p('parentPhone')}>
                {t('parentPhone')} <span className="text-red-500">{tForm('requiredMark')}</span>
              </Label>
              <Input
                id={p('parentPhone')}
                type="tel"
                {...register('parentPhone')}
                error={errors.parentPhone?.message}
                placeholder={t('phonePlaceholder')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={p('parentEmail')}>
                {t('parentEmail')} <span className="text-red-500">{tForm('requiredMark')}</span>
              </Label>
              <Input
                id={p('parentEmail')}
                type="email"
                autoComplete="email"
                {...register('parentEmail')}
                error={errors.parentEmail?.message}
                placeholder={tForm('emailPlaceholder')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={p('parentPassportInfo')}>
                {tForm('parentPassportInfo')} <span className="text-red-500">{tForm('requiredMark')}</span>
              </Label>
              <Input
                id={p('parentPassportInfo')}
                {...register('parentPassportInfo')}
                error={errors.parentPassportInfo?.message}
                placeholder={tForm('parentPassportInfo')}
              />
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor={p('notes')}>{t('notes')}</Label>
        <textarea
          id={p('notes')}
          {...register('notes')}
          rows={4}
          className={textareaClassName}
          placeholder={t('notes')}
        />
        {errors.notes && <p className="text-sm text-red-600">{errors.notes.message}</p>}
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id={p('receiveReports')}
          {...register('receiveReports')}
          className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary"
        />
        <Label htmlFor={p('receiveReports')} className="text-sm font-normal cursor-pointer">
          {t('receiveReportsOn')}
        </Label>
      </div>
    </div>
  );
}
