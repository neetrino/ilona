'use client';

import { useTranslations } from 'next-intl';
import { DatePickerInput, Input, Label } from '@/shared/components/ui';
import { cn } from '@/shared/lib/utils';
import { ADMIN_FORM_INPUT_CLASS } from '@/shared/lib/admin-control-theme';
import { resolveDmyOrIsoToIso } from '../../student-dob-date';
import {
  computeAgeFromDob,
  getStudentDobMaxDate,
  getStudentDobMinDate,
} from '../../student-account-form.schema';
import {
  CRM_LAYOUT_SECTION_HEADING,
  crmLayoutFieldId,
} from './student-account-crm-layout.constants';
import type { StudentAccountCrmFieldShellProps } from './student-account-crm-layout.types';

const DATE_FIELD_CLASS = cn(ADMIN_FORM_INPUT_CLASS, 'pr-10');

type StudentAccountCrmProfileSectionsProps = StudentAccountCrmFieldShellProps & {
  showParentSection: boolean;
  watchedDateOfBirth: string;
  watchedFirstLessonDate: string;
  ageFromDob: number | undefined;
  showManualAgeInput: boolean;
  parentPhoneDigits: string;
};

export function StudentAccountCrmProfileSections({
  register,
  setValue,
  errors,
  isSubmitting,
  idPrefix,
  showParentSection,
  watchedDateOfBirth,
  watchedFirstLessonDate,
  ageFromDob,
  showManualAgeInput,
  parentPhoneDigits,
}: StudentAccountCrmProfileSectionsProps) {
  const t = useTranslations('students');
  const tForm = useTranslations('students.form');
  const tCrm = useTranslations('crm');
  const p = (id: string) => crmLayoutFieldId(idPrefix, id);

  return (
    <>
      <section className="space-y-4">
        <h3 className={CRM_LAYOUT_SECTION_HEADING}>{tCrm('additionalInfo')}</h3>
        <div className="grid grid-cols-2 gap-4 min-[1367px]:grid-cols-3">
          <div className="min-w-0 space-y-2">
            <Label htmlFor={p('dateOfBirth')}>{t('dateOfBirth')}</Label>
            <DatePickerInput
              id={p('dateOfBirth')}
              autoComplete="bday"
              placeholder={tForm('dateOfBirthPlaceholder')}
              value={resolveDmyOrIsoToIso(watchedDateOfBirth) ?? ''}
              onValueChange={(nextValue) => {
                setValue('dateOfBirth', nextValue, { shouldValidate: true, shouldDirty: true });
                const fromDob = computeAgeFromDob(nextValue || undefined);
                if (fromDob !== undefined) {
                  setValue('manualAge', undefined, { shouldDirty: true, shouldValidate: true });
                }
              }}
              min={getStudentDobMinDate()}
              max={getStudentDobMaxDate()}
              className={DATE_FIELD_CLASS}
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
                <p className="text-xs text-slate-500">
                  {tForm('ageHint', { age: ageFromDob ?? 0 })}
                </p>
              </>
            )}
          </div>
          <div className="col-span-2 min-w-0 space-y-2 min-[1367px]:col-span-1">
            <Label htmlFor={p('firstLessonDate')}>{tForm('firstLessonDate')}</Label>
            <DatePickerInput
              id={p('firstLessonDate')}
              placeholder={tForm('firstLessonDatePlaceholder')}
              value={resolveDmyOrIsoToIso(watchedFirstLessonDate) ?? ''}
              onValueChange={(nextValue) =>
                setValue('firstLessonDate', nextValue, {
                  shouldValidate: true,
                  shouldDirty: true,
                })
              }
              className={DATE_FIELD_CLASS}
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
          <p className={CRM_LAYOUT_SECTION_HEADING}>{tCrm('parentDetailsUnder18')}</p>
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
    </>
  );
}
