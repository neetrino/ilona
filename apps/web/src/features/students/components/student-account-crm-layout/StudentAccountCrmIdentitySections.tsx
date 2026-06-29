'use client';

import { useTranslations } from 'next-intl';
import { Input, Label, PasswordInput } from '@/shared/components/ui';
import { ADMIN_FORM_INPUT_CLASS } from '@/shared/lib/admin-control-theme';
import {
  CRM_LAYOUT_SECTION_HEADING,
  crmLayoutFieldId,
} from './student-account-crm-layout.constants';
import type { StudentAccountCrmFieldShellProps } from './student-account-crm-layout.types';

type StudentAccountCrmIdentitySectionsProps = StudentAccountCrmFieldShellProps & {
  phoneDigits: string;
};

export function StudentAccountCrmIdentitySections({
  register,
  setValue,
  errors,
  isSubmitting,
  idPrefix,
  phoneDigits,
}: StudentAccountCrmIdentitySectionsProps) {
  const tForm = useTranslations('students.form');
  const tCrm = useTranslations('crm');
  const tCommon = useTranslations('common');
  const p = (id: string) => crmLayoutFieldId(idPrefix, id);

  return (
    <>
      <section className="space-y-4">
        <h3 className={CRM_LAYOUT_SECTION_HEADING}>{tCrm('basicInfo')}</h3>
        <div className="grid grid-cols-2 gap-4 min-[1367px]:grid-cols-3">
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
          <div className="col-span-2 min-w-0 space-y-2 min-[1367px]:col-span-1">
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
        <h3 className={CRM_LAYOUT_SECTION_HEADING}>{tForm('account')}</h3>
        <div className="grid grid-cols-2 gap-4 min-[1367px]:grid-cols-3">
          <div className="col-span-2 min-w-0 space-y-2 min-[1367px]:col-span-1">
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
    </>
  );
}
