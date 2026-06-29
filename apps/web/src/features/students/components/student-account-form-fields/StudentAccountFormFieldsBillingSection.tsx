'use client';

import { useTranslations } from 'next-intl';
import { Input, Label, SegmentedControl } from '@/shared/components/ui';
import { GROUP_LEVEL_SEGMENT_OPTIONS } from '@/features/groups/lib/group-level-options';
import { TEXTAREA_CLASS_NAME, FORM_INPUT_CLASS_NAME } from './student-account-form-fields.constants';
import type { StudentAccountFormFieldsBillingSectionProps } from './student-account-form-fields.types';

export function StudentAccountFormFieldsBillingSection({
  register,
  errors,
  setValue,
  isSubmitting,
  watchedLevelId,
  p,
}: StudentAccountFormFieldsBillingSectionProps) {
  const t = useTranslations('students');
  const tForm = useTranslations('students.form');
  const tCommon = useTranslations('common');

  return (
    <>
      <div className="grid grid-cols-2 gap-4">
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

        <div className="min-w-0 space-y-2">
          <Label htmlFor={p('monthlyFee')}>
            {t('monthlyFeeLabel')} (֏) <span className="text-red-500">{tForm('requiredMark')}</span>
          </Label>
          <Input
            id={p('monthlyFee')}
            type="number"
            step="0.01"
            min="0"
            className={FORM_INPUT_CLASS_NAME}
            {...register('monthlyFee', { valueAsNumber: true })}
            error={errors.monthlyFee?.message}
            placeholder="50000"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor={p('notes')}>{t('notes')}</Label>
        <textarea
          id={p('notes')}
          {...register('notes')}
          rows={4}
          className={TEXTAREA_CLASS_NAME}
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
    </>
  );
}
