'use client';

import { useEffect, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import type { FieldErrors, UseFormRegister, UseFormSetValue, UseFormWatch } from 'react-hook-form';
import {
  Checkbox,
  Input,
  Label,
  PasswordInput,
  SegmentedControl,
} from '@/shared/components/ui';
import { SingleSelectDropdown } from '@/shared/components/ui/single-select-dropdown';
import {
  ADMIN_FORM_INPUT_CLASS,
} from '@/shared/lib/admin-control-theme';
import {
  DEFAULT_GROUP_LEVEL,
  GROUP_LEVEL_SEGMENT_OPTIONS,
} from '@/features/groups/lib/group-level-options';
import { cn } from '@/shared/lib/utils';
import { formatDmyInputValue } from '../student-dob-date';
import { computeAgeFromDob } from '../student-account-form.schema';
import type { CreateStudentWithConfirmFormData } from '../student-account-form.schema';
import type { GroupAssignmentOption } from '../lib/group-center-assignment';

const sectionHeading = 'text-sm font-semibold text-[#3b3b40]';

const ADMIN_TEXTAREA_CLASS = cn(
  ADMIN_FORM_INPUT_CLASS,
  'h-auto min-h-[5.5rem] resize-none py-2',
);

export interface StudentAccountFormFieldsCrmLeadLayoutProps {
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
}

export function StudentAccountFormFieldsCrmLeadLayout({
  register,
  setValue,
  errors,
  watch,
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
  const watchedLevelId = watch('levelId') || DEFAULT_GROUP_LEVEL;
  const watchedGroupId = watch('groupId') || '';
  const phoneDigits = (watch('phone') ?? '').replace(/\D/g, '');
  const parentPhoneDigits = (watch('parentPhone') ?? '').replace(/\D/g, '');
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

  const groupPlaceholder = !hasCenterScope
    ? tForm('selectCenterFirst')
    : isLoadingGroups
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
      ...groupsForCenter.map((group) => ({ id: group.id, label: group.name })),
    ],
    [groupPlaceholder, groupsForCenter],
  );

  const handleCenterChange = (nextCenterId: string) => {
    setValue('centerId', nextCenterId, { shouldDirty: true, shouldValidate: true });
    setValue('teacherId', '', { shouldDirty: true });
    setValue('groupId', '', { shouldDirty: true });
  };

  return (
    <div className="space-y-6">
      <section className="space-y-4">
        <h3 className={sectionHeading}>{tCrm('basicInfo')}</h3>
        <div className="grid grid-cols-1 gap-4 min-[1367px]:grid-cols-3">
          <div className="min-w-0 space-y-2">
            <Label htmlFor={p('firstName')}>
              {tCommon('firstName')} <span className="text-red-500">*</span>
            </Label>
            <Input
              id={p('firstName')}
              className={ADMIN_FORM_INPUT_CLASS}
              placeholder={tForm('firstNamePlaceholder')}
              {...register('firstName')}
              disabled={isSubmitting}
            />
            {errors.firstName ? (
              <p className="text-sm text-red-600">{errors.firstName.message}</p>
            ) : null}
          </div>
          <div className="min-w-0 space-y-2">
            <Label htmlFor={p('lastName')}>
              {tCommon('lastName')} <span className="text-red-500">*</span>
            </Label>
            <Input
              id={p('lastName')}
              className={ADMIN_FORM_INPUT_CLASS}
              placeholder={tForm('lastNamePlaceholder')}
              {...register('lastName')}
              disabled={isSubmitting}
            />
            {errors.lastName ? (
              <p className="text-sm text-red-600">{errors.lastName.message}</p>
            ) : null}
          </div>
          <div className="min-w-0 space-y-2">
            <Label htmlFor={p('phone')}>{tForm('phoneNumber')}</Label>
            <Input
              id={p('phone')}
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              value={phoneDigits !== '' ? `+${phoneDigits}` : ''}
              onChange={(e) =>
                setValue('phone', e.target.value.replace(/\D/g, ''), {
                  shouldValidate: true,
                  shouldDirty: true,
                })
              }
              placeholder={tForm('phoneExamplePlaceholder')}
              className={ADMIN_FORM_INPUT_CLASS}
              disabled={isSubmitting}
            />
            {errors.phone ? <p className="text-sm text-red-600">{errors.phone.message}</p> : null}
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className={sectionHeading}>{tForm('account')}</h3>
        <div className="grid grid-cols-1 gap-4 min-[1367px]:grid-cols-3">
          <div className="min-w-0 space-y-2">
            <Label htmlFor={p('email')}>
              {tCommon('email')} <span className="text-red-500">*</span>
            </Label>
            <Input
              id={p('email')}
              type="email"
              autoComplete="email"
              placeholder={tForm('emailPlaceholder')}
              className={ADMIN_FORM_INPUT_CLASS}
              {...register('email')}
              disabled={isSubmitting}
            />
            {errors.email ? <p className="text-sm text-red-600">{errors.email.message}</p> : null}
          </div>
          <div className="min-w-0 space-y-2">
            <Label htmlFor={p('password')}>
              {tForm('password')} <span className="text-red-500">*</span>
            </Label>
            <PasswordInput
              id={p('password')}
              autoComplete="new-password"
              placeholder={tForm('passwordPlaceholder')}
              className={ADMIN_FORM_INPUT_CLASS}
              {...register('password')}
              error={errors.password?.message}
              disabled={isSubmitting}
            />
          </div>
          <div className="min-w-0 space-y-2">
            <Label htmlFor={p('confirmPassword')}>
              {tForm('confirmPassword')} <span className="text-red-500">*</span>
            </Label>
            <PasswordInput
              id={p('confirmPassword')}
              autoComplete="new-password"
              placeholder={tForm('passwordPlaceholder')}
              className={ADMIN_FORM_INPUT_CLASS}
              {...register('confirmPassword')}
              error={errors.confirmPassword?.message}
              disabled={isSubmitting}
            />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className={sectionHeading}>{tCrm('additionalInfo')}</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="min-w-0 space-y-2">
            <Label htmlFor={p('dateOfBirth')}>{t('dateOfBirth')}</Label>
            <Input
              id={p('dateOfBirth')}
              type="text"
              inputMode="numeric"
              autoComplete="bday"
              placeholder={tForm('dateOfBirthPlaceholder')}
              value={watchedDateOfBirth}
              onChange={(e) => {
                const next = formatDmyInputValue(e.target.value, watchedDateOfBirth);
                setValue('dateOfBirth', next, { shouldValidate: true, shouldDirty: true });
                const fromDob = computeAgeFromDob(next.trim() || undefined);
                if (fromDob !== undefined) {
                  setValue('manualAge', undefined, { shouldDirty: true, shouldValidate: true });
                }
              }}
              className={ADMIN_FORM_INPUT_CLASS}
              disabled={isSubmitting}
            />
            {errors.dateOfBirth ? (
              <p className="text-sm text-red-600">{errors.dateOfBirth.message}</p>
            ) : null}
          </div>
          <div className="min-w-0 space-y-2">
            <Label htmlFor={p('manualAge')}>{tForm('ageYears')}</Label>
            {showManualAgeInput ? (
              <>
                <Input
                  id={p('manualAge')}
                  type="number"
                  min={0}
                  placeholder={tForm('ageExamplePlaceholder')}
                  className={ADMIN_FORM_INPUT_CLASS}
                  {...register('manualAge')}
                  disabled={isSubmitting}
                />
                {errors.manualAge ? (
                  <p className="text-sm text-red-600">{errors.manualAge.message}</p>
                ) : null}
              </>
            ) : (
              <>
                <p
                  className="flex h-10 items-center rounded-[15px] border border-[rgba(14,14,16,0.12)] bg-slate-50/80 px-3 text-sm text-[#3b3b40]"
                  aria-live="polite"
                >
                  {ageFromDob}
                </p>
                <p className="text-xs text-slate-500">{tForm('ageHint', { age: ageFromDob })}</p>
              </>
            )}
          </div>
          <div className="min-w-0 space-y-2">
            <Label htmlFor={p('firstLessonDate')}>{tForm('firstLessonDate')}</Label>
            <Input
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
              className={ADMIN_FORM_INPUT_CLASS}
              disabled={isSubmitting}
            />
            {errors.firstLessonDate ? (
              <p className="text-sm text-red-600">{errors.firstLessonDate.message}</p>
            ) : null}
          </div>
        </div>
      </section>

      {showParentSection ? (
        <section className="space-y-4 rounded-[15px] border border-slate-200 bg-slate-50/60 p-4">
          <p className={sectionHeading}>{tCrm('parentDetailsUnder18')}</p>
          <div className="min-w-0 space-y-2">
            <Label htmlFor={p('parentName')}>
              {tCrm('parentName')} <span className="text-red-500">*</span>
            </Label>
            <Input
              id={p('parentName')}
              className={ADMIN_FORM_INPUT_CLASS}
              placeholder={tCrm('parentNamePlaceholder')}
              {...register('parentName')}
              disabled={isSubmitting}
            />
            {errors.parentName ? (
              <p className="text-sm text-red-600">{errors.parentName.message}</p>
            ) : null}
          </div>
          <div className="min-w-0 space-y-2">
            <Label htmlFor={p('parentSurname')}>{tCrm('parentSurname')}</Label>
            <Input
              id={p('parentSurname')}
              className={ADMIN_FORM_INPUT_CLASS}
              placeholder={tCrm('parentSurnamePlaceholder')}
              {...register('parentSurname')}
              disabled={isSubmitting}
            />
            {errors.parentSurname ? (
              <p className="text-sm text-red-600">{errors.parentSurname.message}</p>
            ) : null}
          </div>
          <div className="min-w-0 space-y-2">
            <Label htmlFor={p('parentPhone')}>
              {tCrm('parentPhone')} <span className="text-red-500">*</span>
            </Label>
            <Input
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
              className={ADMIN_FORM_INPUT_CLASS}
              disabled={isSubmitting}
            />
            {errors.parentPhone ? (
              <p className="text-sm text-red-600">{errors.parentPhone.message}</p>
            ) : null}
          </div>
          <div className="min-w-0 space-y-2">
            <Label htmlFor={p('parentEmail')}>
              {tCrm('parentEmail')} <span className="text-red-500">*</span>
            </Label>
            <Input
              id={p('parentEmail')}
              type="email"
              autoComplete="email"
              placeholder={tCrm('parentEmailPlaceholder')}
              className={ADMIN_FORM_INPUT_CLASS}
              {...register('parentEmail')}
              disabled={isSubmitting}
            />
            {errors.parentEmail ? (
              <p className="text-sm text-red-600">{errors.parentEmail.message}</p>
            ) : null}
          </div>
          <div className="min-w-0 space-y-2">
            <Label htmlFor={p('parentPassportInfo')}>
              {tCrm('parentPassport')} <span className="text-red-500">*</span>
            </Label>
            <Input
              id={p('parentPassportInfo')}
              className={ADMIN_FORM_INPUT_CLASS}
              placeholder={tCrm('passportPlaceholder')}
              {...register('parentPassportInfo')}
              disabled={isSubmitting}
            />
            {errors.parentPassportInfo ? (
              <p className="text-sm text-red-600">{errors.parentPassportInfo.message}</p>
            ) : null}
          </div>
        </section>
      ) : null}

      <section className="space-y-4">
        <h3 className={sectionHeading}>{tCrm('academicInfo')}</h3>
        <div className="grid grid-cols-1 gap-4 min-[1367px]:grid-cols-3">
          <div className="min-w-0 space-y-2">
            <Label>{tCommon('level')}</Label>
            <input type="hidden" {...register('levelId')} />
            <SegmentedControl
              options={GROUP_LEVEL_SEGMENT_OPTIONS}
              value={watchedLevelId}
              onChange={(nextValue) =>
                setValue('levelId', nextValue, { shouldDirty: true, shouldValidate: true })
              }
              disabled={isSubmitting}
              aria-label={tCommon('level')}
            />
          </div>

          {showCenterSelect ? (
            <div className="min-w-0 space-y-2">
              <Label htmlFor={p('centerId')}>{tCommon('center')}</Label>
              <input type="hidden" {...register('centerId')} />
              <SingleSelectDropdown
                id={p('centerId')}
                triggerClassName={ADMIN_FORM_INPUT_CLASS}
                options={centerOptions}
                value={watchedCenterId}
                onValueChange={(nextValue) => handleCenterChange(nextValue ?? '')}
                isLoading={isLoadingCenters}
                disabled={isLoadingCenters || isSubmitting}
                error={errors.centerId?.message ?? null}
              />
              {errors.centerId ? (
                <p className="text-sm text-red-600">{errors.centerId.message}</p>
              ) : null}
            </div>
          ) : assignedCenterDisplay ? (
            <div className="min-w-0 space-y-2">
              <Label>{tCommon('center')}</Label>
              <p className="rounded-[15px] border border-slate-200 bg-slate-50/60 px-3 py-2 text-sm text-[#3b3b40]">
                {assignedCenterDisplay}
              </p>
            </div>
          ) : null}

          <div className="min-w-0 space-y-2">
            <input type="hidden" {...register('teacherId')} />
            <Label htmlFor={p('groupId')}>{tCommon('group')}</Label>
            <input type="hidden" {...register('groupId')} />
            <SingleSelectDropdown
              id={p('groupId')}
              triggerClassName={ADMIN_FORM_INPUT_CLASS}
              options={groupOptions}
              value={watchedGroupId}
              onValueChange={(nextValue) =>
                setValue('groupId', nextValue ?? '', { shouldDirty: true, shouldValidate: true })
              }
              isLoading={isLoadingGroups}
              disabled={isLoadingGroups || isSubmitting || !hasCenterScope}
              error={errors.groupId?.message ?? null}
            />
            {errors.groupId ? <p className="text-sm text-red-600">{errors.groupId.message}</p> : null}
            {hasCenterScope && !isLoadingGroups && groupsForCenter.length === 0 ? (
              <p className="text-xs text-slate-500">{tForm('noGroupsForCenter')}</p>
            ) : null}
            {watchedGroupId ? (
              <p className="text-xs text-slate-500">
                {tForm('groupLocation', {
                  name: groupsForCenter.find((g) => g.id === watchedGroupId)?.center?.name ?? '—',
                })}
              </p>
            ) : null}
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className={sectionHeading}>{tForm('billingPreferences')}</h3>
        <div className="min-w-0 space-y-2">
          <Label htmlFor={p('monthlyFee')}>
            {t('monthlyFeeLabel')} (֏) <span className="text-red-500">*</span>
          </Label>
          <Input
            id={p('monthlyFee')}
            type="number"
            step="0.01"
            min={0}
            placeholder={tForm('monthlyFeePlaceholder')}
            className={ADMIN_FORM_INPUT_CLASS}
            {...register('monthlyFee', { valueAsNumber: true })}
            disabled={isSubmitting}
          />
          {errors.monthlyFee ? (
            <p className="text-sm text-red-600">{errors.monthlyFee.message}</p>
          ) : null}
        </div>
        <div className="min-w-0 space-y-2">
          <Label htmlFor={p('notes')}>{tCommon('notes')}</Label>
          <textarea
            id={p('notes')}
            rows={3}
            {...register('notes')}
            placeholder={tForm('notesPlaceholder')}
            disabled={isSubmitting}
            className={cn(
              ADMIN_TEXTAREA_CLASS,
              errors.notes ? 'border-red-300' : '',
              isSubmitting ? 'cursor-not-allowed bg-slate-100' : '',
            )}
          />
          {errors.notes ? <p className="text-sm text-red-600">{errors.notes.message}</p> : null}
        </div>
        <label className="flex cursor-pointer select-none items-start gap-2">
          <Checkbox
            checked={watch('receiveReports')}
            onCheckedChange={(checked) =>
              setValue('receiveReports', checked === true, { shouldDirty: true })
            }
            disabled={isSubmitting}
            className="mt-0.5"
          />
          <span className="text-sm text-slate-600">{t('receiveReportsOn')}</span>
        </label>
      </section>
    </div>
  );
}
