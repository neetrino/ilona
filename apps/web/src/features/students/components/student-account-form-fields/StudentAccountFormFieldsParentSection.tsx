'use client';

import { useTranslations } from 'next-intl';
import { Input, Label } from '@/shared/components/ui';
import type { StudentAccountFormFieldsParentSectionProps } from './student-account-form-fields.types';

export function StudentAccountFormFieldsParentSection({
  register,
  errors,
  p,
}: StudentAccountFormFieldsParentSectionProps) {
  const t = useTranslations('students');
  const tForm = useTranslations('students.form');
  const tCommon = useTranslations('common');

  return (
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
  );
}
