'use client';

import { useTranslations } from 'next-intl';
import { Input, Label, PasswordInput } from '@/shared/components/ui';
import { FORM_INPUT_CLASS_NAME } from './student-account-form-fields.constants';
import type { StudentAccountFormFieldShellProps } from './student-account-form-fields.types';

export function StudentAccountFormFieldsIdentitySection({
  register,
  errors,
  p,
}: StudentAccountFormFieldShellProps) {
  const t = useTranslations('students');
  const tForm = useTranslations('students.form');
  const tCommon = useTranslations('common');

  return (
    <>
      <div className="grid grid-cols-2 gap-4 min-[1367px]:grid-cols-3">
        <div className="min-w-0 space-y-2">
          <Label htmlFor={p('firstName')}>
            {tCommon('firstName')} <span className="text-red-500">{tForm('requiredMark')}</span>
          </Label>
          <Input
            id={p('firstName')}
            className={FORM_INPUT_CLASS_NAME}
            {...register('firstName')}
            error={errors.firstName?.message}
            placeholder={tForm('firstNamePlaceholder')}
          />
        </div>

        <div className="min-w-0 space-y-2">
          <Label htmlFor={p('lastName')}>
            {tCommon('lastName')} <span className="text-red-500">{tForm('requiredMark')}</span>
          </Label>
          <Input
            id={p('lastName')}
            className={FORM_INPUT_CLASS_NAME}
            {...register('lastName')}
            error={errors.lastName?.message}
            placeholder={tForm('lastNamePlaceholder')}
          />
        </div>

        <div className="col-span-2 min-w-0 space-y-2 min-[1367px]:col-span-1">
          <Label htmlFor={p('phone')}>{tCommon('phone')}</Label>
          <Input
            id={p('phone')}
            type="tel"
            className={FORM_INPUT_CLASS_NAME}
            {...register('phone')}
            error={errors.phone?.message}
            placeholder={t('phonePlaceholder')}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="min-w-0 space-y-2">
          <Label htmlFor={p('email')}>
            {tForm('email')} <span className="text-red-500">{tForm('requiredMark')}</span>
          </Label>
          <Input
            id={p('email')}
            type="email"
            className={FORM_INPUT_CLASS_NAME}
            {...register('email')}
            error={errors.email?.message}
            placeholder={tForm('emailPlaceholder')}
          />
        </div>

        <div className="min-w-0 space-y-2">
          <Label htmlFor={p('password')}>
            {tForm('password')} <span className="text-red-500">{tForm('requiredMark')}</span>
          </Label>
          <PasswordInput
            id={p('password')}
            className={FORM_INPUT_CLASS_NAME}
            {...register('password')}
            error={errors.password?.message}
            placeholder={tForm('passwordPlaceholder')}
          />
        </div>
      </div>
    </>
  );
}
