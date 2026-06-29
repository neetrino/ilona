'use client';

import { useTranslations } from 'next-intl';
import { Input, Label, PasswordInput } from '@/shared/components/ui';
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
    </>
  );
}
