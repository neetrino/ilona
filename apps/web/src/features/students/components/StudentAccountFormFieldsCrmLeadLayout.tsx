'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import type { FieldErrors, UseFormRegister, UseFormSetValue, UseFormWatch } from 'react-hook-form';
import { PasswordInput } from '@/shared/components/ui';
import { SingleSelectDropdown } from '@/shared/components/ui/single-select-dropdown';
import { formatDmyInputValue } from '../student-dob-date';
import type { CreateStudentWithConfirmFormData } from '../student-account-form.schema';
import type { GroupAssignmentOption } from '../lib/group-center-assignment';

const LEVEL_OPTIONS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;

const inputClass =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1';

const sectionTitle = 'text-xs font-semibold uppercase tracking-wide text-slate-500';

export interface StudentAccountFormFieldsCrmLeadLayoutProps {
  register: UseFormRegister<CreateStudentWithConfirmFormData>;
  setValue: UseFormSetValue<CreateStudentWithConfirmFormData>;
  errors: FieldErrors<CreateStudentWithConfirmFormData>;
  watch: UseFormWatch<CreateStudentWithConfirmFormData>;
  computedAge: number | undefined;
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
}

export function StudentAccountFormFieldsCrmLeadLayout({
  register,
  setValue,
  errors,
  watch,
  computedAge,
  showParentSection,
  groupsForCenter,
  centers,
  isLoadingGroups,
  isLoadingCenters = false,
  isSubmitting,
  showCenterSelect = true,
  assignedCenterDisplay = null,
  lockedCenterId = null,
  idPrefix = '',
}: StudentAccountFormFieldsCrmLeadLayoutProps) {
  const t = useTranslations('students');
  const tForm = useTranslations('students.form');
  const tCrm = useTranslations('crm');
  const tCommon = useTranslations('common');

  const p = (id: string) => (idPrefix ? `${idPrefix}-${id}` : id);
  const watchedCenterId = watch('centerId') || '';
  const effectiveCenterId = lockedCenterId || watchedCenterId || '';
  const hasCenterScope = Boolean(effectiveCenterId);
  const watchedLevelId = watch('levelId') || '';
  const watchedGroupId = watch('groupId') || '';
  const phoneDigits = (watch('phone') ?? '').replace(/\D/g, '');
  const parentPhoneDigits = (watch('parentPhone') ?? '').replace(/\D/g, '');
  const watchedDateOfBirth = watch('dateOfBirth') ?? '';
  const watchedFirstLessonDate = watch('firstLessonDate') ?? '';

  const groupPlaceholder = !hasCenterScope
    ? tForm('selectCenterFirst')
    : isLoadingGroups
      ? tCommon('loading')
      : groupsForCenter.length === 0
        ? tForm('noGroupsForCenter')
        : t('selectGroup');

  const levelOptions = useMemo(
    () => [
      { id: '', label: '—' },
      ...LEVEL_OPTIONS.map((level) => ({ id: level, label: level })),
    ],
    [],
  );

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
      ...groupsForCenter.map((group) => ({ id: group.id, label: group.name })),
    ],
    [groupPlaceholder, groupsForCenter],
  );

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <h3 className={sectionTitle}>{tCrm('basicInfo')}</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor={p('firstName')} className="mb-1 block text-sm font-medium text-slate-700">
              {tCommon('firstName')} <span className="text-red-500">{tForm('requiredMark')}</span>
            </label>
            <input
              id={p('firstName')}
              type="text"
              placeholder={tForm('firstNamePlaceholder')}
              {...register('firstName')}
              className={inputClass}
            />
            {errors.firstName && <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>}
          </div>
          <div>
            <label htmlFor={p('lastName')} className="mb-1 block text-sm font-medium text-slate-700">
              {tCommon('lastName')} <span className="text-red-500">{tForm('requiredMark')}</span>
            </label>
            <input
              id={p('lastName')}
              type="text"
              placeholder={tForm('lastNamePlaceholder')}
              {...register('lastName')}
              className={inputClass}
            />
            {errors.lastName && <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>}
          </div>
        </div>
        <div>
          <label htmlFor={p('phone')} className="mb-1 block text-sm font-medium text-slate-700">
            {tForm('phoneNumber')}
          </label>
          <input
            id={p('phone')}
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            value={phoneDigits !== '' ? `+${phoneDigits}` : ''}
            onChange={(e) =>
              setValue('phone', e.target.value.replace(/\D/g, ''), { shouldValidate: true, shouldDirty: true })
            }
            placeholder={tForm('phoneExamplePlaceholder')}
            className={inputClass}
            disabled={isSubmitting}
          />
          {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>}
        </div>
      </section>

      <section className="space-y-3">
        <h3 className={sectionTitle}>{tForm('account')}</h3>
        <div>
          <label htmlFor={p('email')} className="mb-1 block text-sm font-medium text-slate-700">
            {tCommon('email')} <span className="text-red-500">{tForm('requiredMark')}</span>
          </label>
          <input
            id={p('email')}
            type="email"
            autoComplete="email"
            placeholder={tForm('emailPlaceholder')}
            {...register('email')}
            className={inputClass}
          />
          {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor={p('password')} className="mb-1 block text-sm font-medium text-slate-700">
              {tForm('password')} <span className="text-red-500">{tForm('requiredMark')}</span>
            </label>
            <PasswordInput
              id={p('password')}
              autoComplete="new-password"
              placeholder={tForm('passwordPlaceholder')}
              {...register('password')}
              className={inputClass}
              error={errors.password?.message}
            />
          </div>
          <div>
            <label htmlFor={p('confirmPassword')} className="mb-1 block text-sm font-medium text-slate-700">
              {tForm('confirmPassword')} <span className="text-red-500">{tForm('requiredMark')}</span>
            </label>
            <PasswordInput
              id={p('confirmPassword')}
              autoComplete="new-password"
              placeholder={tForm('passwordPlaceholder')}
              {...register('confirmPassword')}
              className={inputClass}
              error={errors.confirmPassword?.message}
            />
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className={sectionTitle}>{tCrm('additionalInfo')}</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor={p('manualAge')} className="mb-1 block text-sm font-medium text-slate-700">
              {tForm('ageYears')}
            </label>
            <input id={p('manualAge')} type="number" min={0} placeholder={tForm('ageExamplePlaceholder')} {...register('manualAge')} className={inputClass} disabled={isSubmitting} />
            {computedAge !== undefined && (
              <p className="mt-1 text-xs text-slate-500">{tForm('effectiveAge', { age: computedAge })}</p>
            )}
            {errors.manualAge && <p className="mt-1 text-sm text-red-600">{errors.manualAge.message}</p>}
          </div>
          <div>
            <label htmlFor={p('dateOfBirth')} className="mb-1 block text-sm font-medium text-slate-700">
              {t('dateOfBirth')}
            </label>
            <input
              id={p('dateOfBirth')}
              type="text"
              inputMode="numeric"
              autoComplete="bday"
              placeholder={tForm('dateOfBirthPlaceholder')}
              value={watchedDateOfBirth}
              onChange={(e) =>
                setValue('dateOfBirth', formatDmyInputValue(e.target.value, watchedDateOfBirth), {
                  shouldValidate: true,
                  shouldDirty: true,
                })
              }
              className={inputClass}
              disabled={isSubmitting}
            />
            {errors.dateOfBirth && <p className="mt-1 text-sm text-red-600">{errors.dateOfBirth.message}</p>}
          </div>
          <div>
            <label htmlFor={p('firstLessonDate')} className="mb-1 block text-sm font-medium text-slate-700">
              {tForm('firstLessonDate')}
            </label>
            <input
              id={p('firstLessonDate')}
              type="text"
              inputMode="numeric"
              placeholder={tForm('firstLessonDatePlaceholder')}
              value={watchedFirstLessonDate}
              onChange={(e) =>
                setValue('firstLessonDate', formatDmyInputValue(e.target.value, watchedFirstLessonDate), {
                  shouldValidate: true,
                  shouldDirty: true,
                })
              }
              className={inputClass}
              disabled={isSubmitting}
            />
            {errors.firstLessonDate && (
              <p className="mt-1 text-sm text-red-600">{errors.firstLessonDate.message}</p>
            )}
          </div>
        </div>
      </section>

      {showParentSection && (
        <section className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
          <p className={sectionTitle}>{tCrm('parentDetailsUnder18')}</p>
          <div>
            <label htmlFor={p('parentName')} className="mb-1 block text-sm font-medium text-slate-700">
              {tCrm('parentName')} <span className="text-red-500">{tForm('requiredMark')}</span>
            </label>
            <input
              id={p('parentName')}
              type="text"
              placeholder={tCrm('parentNamePlaceholder')}
              {...register('parentName')}
              className={inputClass}
            />
            {errors.parentName && <p className="mt-1 text-sm text-red-600">{errors.parentName.message}</p>}
          </div>
          <div>
            <label htmlFor={p('parentSurname')} className="mb-1 block text-sm font-medium text-slate-700">
              {tCrm('parentSurname')}
            </label>
            <input
              id={p('parentSurname')}
              type="text"
              placeholder={tCrm('parentSurnamePlaceholder')}
              {...register('parentSurname')}
              className={inputClass}
            />
            {errors.parentSurname && <p className="mt-1 text-sm text-red-600">{errors.parentSurname.message}</p>}
          </div>
          <div>
            <label htmlFor={p('parentPhone')} className="mb-1 block text-sm font-medium text-slate-700">
              {tCrm('parentPhone')} <span className="text-red-500">{tForm('requiredMark')}</span>
            </label>
            <input
              id={p('parentPhone')}
              type="tel"
              inputMode="numeric"
              value={parentPhoneDigits !== '' ? `+${parentPhoneDigits}` : ''}
              onChange={(e) =>
                setValue('parentPhone', e.target.value.replace(/\D/g, ''), {
                  shouldValidate: true,
                  shouldDirty: true,
                })
              }
              placeholder={tCrm('parentPhonePlaceholder')}
              className={inputClass}
              disabled={isSubmitting}
            />
            {errors.parentPhone && <p className="mt-1 text-sm text-red-600">{errors.parentPhone.message}</p>}
          </div>
          <div>
            <label htmlFor={p('parentEmail')} className="mb-1 block text-sm font-medium text-slate-700">
              {tCrm('parentEmail')} <span className="text-red-500">{tForm('requiredMark')}</span>
            </label>
            <input
              id={p('parentEmail')}
              type="email"
              autoComplete="email"
              placeholder={tCrm('parentEmailPlaceholder')}
              {...register('parentEmail')}
              className={inputClass}
            />
            {errors.parentEmail && <p className="mt-1 text-sm text-red-600">{errors.parentEmail.message}</p>}
          </div>
          <div>
            <label htmlFor={p('parentPassportInfo')} className="mb-1 block text-sm font-medium text-slate-700">
              {tCrm('parentPassport')} <span className="text-red-500">{tForm('requiredMark')}</span>
            </label>
            <input
              id={p('parentPassportInfo')}
              type="text"
              placeholder={tCrm('passportPlaceholder')}
              {...register('parentPassportInfo')}
              className={inputClass}
            />
            {errors.parentPassportInfo && (
              <p className="mt-1 text-sm text-red-600">{errors.parentPassportInfo.message}</p>
            )}
          </div>
        </section>
      )}

      <section className="space-y-3">
        <h3 className={sectionTitle}>{tCrm('academicInfo')}</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor={p('levelId')} className="mb-1 block text-sm font-medium text-slate-700">
              {tCommon('level')}
            </label>
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
          {showCenterSelect ? (
            <div>
              <label htmlFor={p('centerId')} className="mb-1 block text-sm font-medium text-slate-700">
                {tCommon('center')}
              </label>
              <input type="hidden" {...register('centerId')} />
              <SingleSelectDropdown
                id={p('centerId')}
                options={centerOptions}
                value={watchedCenterId}
                onValueChange={(nextValue) => {
                  setValue('centerId', nextValue ?? '', { shouldDirty: true, shouldValidate: true });
                  setValue('teacherId', '', { shouldDirty: true });
                  setValue('groupId', '', { shouldDirty: true });
                }}
                isLoading={isLoadingCenters}
                disabled={isLoadingCenters || isSubmitting}
                error={errors.centerId?.message ?? null}
              />
              {errors.centerId && <p className="mt-1 text-sm text-red-600">{errors.centerId.message}</p>}
            </div>
          ) : assignedCenterDisplay ? (
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">{tCommon('center')}</label>
              <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                {assignedCenterDisplay}
              </p>
            </div>
          ) : null}
          <div>
            <input type="hidden" {...register('teacherId')} />
            <label htmlFor={p('groupId')} className="mb-1 block text-sm font-medium text-slate-700">
              {tCommon('group')}
            </label>
            <input type="hidden" {...register('groupId')} />
            <SingleSelectDropdown
              id={p('groupId')}
              options={groupOptions}
              value={watchedGroupId}
              onValueChange={(nextValue) =>
                setValue('groupId', nextValue ?? '', { shouldDirty: true, shouldValidate: true })
              }
              isLoading={isLoadingGroups}
              disabled={isLoadingGroups || isSubmitting || !hasCenterScope}
              error={errors.groupId?.message ?? null}
            />
            {errors.groupId && <p className="mt-1 text-sm text-red-600">{errors.groupId.message}</p>}
            {hasCenterScope && !isLoadingGroups && groupsForCenter.length === 0 ? (
              <p className="mt-1 text-xs text-slate-500">{tForm('noGroupsForCenter')}</p>
            ) : null}
            {watchedGroupId ? (
              <p className="mt-1 text-xs text-slate-500">
                {tForm('groupLocation', {
                  name: groupsForCenter.find((g) => g.id === watchedGroupId)?.center?.name ?? '—',
                })}
              </p>
            ) : null}
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className={sectionTitle}>{tForm('billingPreferences')}</h3>
        <div>
          <label htmlFor={p('monthlyFee')} className="mb-1 block text-sm font-medium text-slate-700">
            {t('monthlyFeeLabel')} (֏) <span className="text-red-500">{tForm('requiredMark')}</span>
          </label>
          <input
            id={p('monthlyFee')}
            type="number"
            step="0.01"
            min={0}
            placeholder={tForm('monthlyFeePlaceholder')}
            {...register('monthlyFee', { valueAsNumber: true })}
            className={inputClass}
          />
          {errors.monthlyFee && <p className="mt-1 text-sm text-red-600">{errors.monthlyFee.message}</p>}
        </div>
        <div>
          <label htmlFor={p('notes')} className="mb-1 block text-sm font-medium text-slate-700">
            {tCommon('notes')}
          </label>
          <textarea
            id={p('notes')}
            rows={3}
            {...register('notes')}
            placeholder={tForm('notesPlaceholder')}
            className={inputClass}
          />
          {errors.notes && <p className="mt-1 text-sm text-red-600">{errors.notes.message}</p>}
        </div>
        <div className="flex items-center gap-2">
          <input
            id={p('receiveReports')}
            type="checkbox"
            {...register('receiveReports')}
            className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
          />
          <label htmlFor={p('receiveReports')} className="text-sm font-medium text-slate-700">
            {t('receiveReportsOn')}
          </label>
        </div>
      </section>
    </div>
  );
}
