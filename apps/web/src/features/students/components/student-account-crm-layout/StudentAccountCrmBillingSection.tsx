'use client';

import { useTranslations } from 'next-intl';
import { Checkbox, Input, Label } from '@/shared/components/ui';
import { cn } from '@/shared/lib/utils';
import { ADMIN_FORM_INPUT_CLASS } from '@/shared/lib/admin-control-theme';
import {
  CRM_LAYOUT_SECTION_HEADING,
  CRM_LAYOUT_TEXTAREA_CLASS,
  crmLayoutFieldId,
} from './student-account-crm-layout.constants';
import type { StudentAccountCrmFieldShellProps } from './student-account-crm-layout.types';

export function StudentAccountCrmBillingSection({
  register,
  setValue,
  errors,
  watch,
  isSubmitting,
  idPrefix,
}: StudentAccountCrmFieldShellProps) {
  const t = useTranslations('students');
  const tForm = useTranslations('students.form');
  const tCommon = useTranslations('common');
  const p = (id: string) => crmLayoutFieldId(idPrefix, id);

  return (
    <section className="space-y-4">
      <h3 className={CRM_LAYOUT_SECTION_HEADING}>{tForm('billingPreferences')}</h3>
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
            CRM_LAYOUT_TEXTAREA_CLASS,
            errors.notes ? 'border-red-300' : '',
            isSubmitting ? 'cursor-not-allowed bg-slate-100' : '',
          )}
        />
        {errors.notes ? <p className="text-sm text-red-600">{errors.notes.message}</p> : null}
      </div>
      <label className="flex cursor-pointer select-none items-start gap-2">
        <Checkbox
          checked={watch('receiveReports') ?? true}
          onCheckedChange={(checked) =>
            setValue('receiveReports', checked === true, { shouldDirty: true })
          }
          disabled={isSubmitting}
          className="mt-0.5"
        />
        <span className="text-sm text-slate-600">{t('receiveReportsOn')}</span>
      </label>
    </section>
  );
}
