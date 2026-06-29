'use client';

import { useTranslations } from 'next-intl';
import { Button, Input, Label } from '@/shared/components/ui';
import { cn } from '@/shared/lib/utils';
import {
  ADMIN_FORM_INPUT_CLASS,
  ADMIN_OUTLINE_BUTTON_CLASS,
  ADMIN_PRIMARY_BUTTON_CLASS,
} from '@/shared/lib/admin-control-theme';
import { ADMIN_TEXTAREA_CLASS } from './edit-center-form.constants';
import type { useEditCenterForm } from './useEditCenterForm';

type EditCenterFormFieldsProps = Pick<
  ReturnType<typeof useEditCenterForm>,
  | 'handleSubmit'
  | 'onSubmit'
  | 'errorMessage'
  | 'successMessage'
  | 'register'
  | 'errors'
  | 'isFormBusy'
  | 'watch'
  | 'setValue'
  | 'reset'
  | 'requestClose'
  | 'isSubmitting'
  | 'updateCenter'
>;

export function EditCenterFormFields({
  handleSubmit,
  onSubmit,
  errorMessage,
  successMessage,
  register,
  errors,
  isFormBusy,
  watch,
  setValue,
  reset,
  requestClose,
  isSubmitting,
  updateCenter,
}: EditCenterFormFieldsProps) {
  const tForm = useTranslations('centers.form');
  const tCommon = useTranslations('common');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {successMessage ? (
        <div className="rounded-[15px] border border-green-200 bg-green-50 p-3">
          <p className="text-sm text-green-600">{successMessage}</p>
        </div>
      ) : null}
      {errorMessage ? (
        <div className="rounded-[15px] border border-red-200 bg-red-50 p-3">
          <p className="text-sm text-red-600">{errorMessage}</p>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="min-w-0 space-y-2">
          <Label htmlFor="name">
            {tForm('centerName')} <span className="text-red-500">*</span>
          </Label>
          <Input
            id="name"
            className={ADMIN_FORM_INPUT_CLASS}
            {...register('name')}
            error={errors.name?.message}
            placeholder={tForm('namePlaceholder')}
            disabled={isFormBusy}
          />
        </div>

        <div className="min-w-0 space-y-2">
          <Label htmlFor="address">{tForm('address')}</Label>
          <Input
            id="address"
            className={ADMIN_FORM_INPUT_CLASS}
            {...register('address')}
            error={errors.address?.message}
            placeholder={tForm('addressPlaceholder')}
            disabled={isFormBusy}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="phone">{tForm('phone')}</Label>
          <Input
            id="phone"
            className={ADMIN_FORM_INPUT_CLASS}
            {...register('phone')}
            error={errors.phone?.message}
            placeholder={tForm('phonePlaceholder')}
            disabled={isFormBusy}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">{tForm('email')}</Label>
          <Input
            id="email"
            type="email"
            className={ADMIN_FORM_INPUT_CLASS}
            {...register('email')}
            error={errors.email?.message}
            placeholder={tForm('emailPlaceholder')}
            disabled={isFormBusy}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">{tForm('description')}</Label>
        <textarea
          id="description"
          {...register('description')}
          rows={3}
          placeholder={tForm('descriptionPlaceholder')}
          disabled={isFormBusy}
          className={cn(
            ADMIN_TEXTAREA_CLASS,
            errors.description ? 'border-red-300' : '',
            isFormBusy ? 'cursor-not-allowed bg-slate-100' : '',
          )}
        />
        {errors.description ? (
          <p className="text-sm text-red-600">{errors.description.message}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="colorHex">{tForm('centerColor')}</Label>
        <div className="flex items-center gap-3">
          <div className="group relative h-11 w-11 shrink-0">
            <span
              className="pointer-events-none block h-full w-full rounded-full shadow-[0_2px_10px_rgba(15,23,42,0.18)] transition-transform group-hover:scale-105"
              style={{ backgroundColor: watch('colorHex') || '#253046' }}
              aria-hidden
            />
            <input
              type="color"
              id="colorHex"
              value={watch('colorHex') || '#253046'}
              onChange={(e) => {
                setValue('colorHex', e.target.value, { shouldValidate: true });
              }}
              disabled={isFormBusy}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
              aria-label={tForm('centerColor')}
            />
          </div>
          <div className="flex-1">
            <Input
              id="colorHexText"
              className={cn(ADMIN_FORM_INPUT_CLASS, 'font-mono')}
              value={watch('colorHex') || ''}
              onChange={(e) => {
                setValue('colorHex', e.target.value, { shouldValidate: true });
              }}
              onBlur={() => {
                const value = watch('colorHex');
                if (value && value.startsWith('#')) {
                  return;
                }
                if (value && !value.startsWith('#')) {
                  setValue('colorHex', `#${value}`, { shouldValidate: true });
                }
              }}
              error={errors.colorHex?.message}
              placeholder={tForm('colorPlaceholder')}
              disabled={isFormBusy}
            />
          </div>
          {watch('colorHex') ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                reset({
                  ...watch(),
                  colorHex: '',
                });
              }}
              disabled={isFormBusy}
              className={cn(ADMIN_OUTLINE_BUTTON_CLASS, 'border-[rgba(14,14,16,0.07)] hover:bg-slate-50')}
            >
              {tForm('resetToDefault')}
            </Button>
          ) : null}
        </div>
        <p className="text-xs text-slate-500">{tForm('colorHint')}</p>
      </div>

      <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          className={cn(ADMIN_OUTLINE_BUTTON_CLASS, 'border-[rgba(14,14,16,0.07)] hover:bg-slate-50')}
          onClick={requestClose}
          disabled={isFormBusy}
        >
          {tCommon('cancel')}
        </Button>
        <Button
          type="submit"
          disabled={isFormBusy}
          className={cn(ADMIN_PRIMARY_BUTTON_CLASS, 'bg-primary text-primary-foreground hover:bg-primary/90')}
        >
          {isSubmitting || updateCenter.isPending ? tForm('saving') : tForm('saveChanges')}
        </Button>
      </div>
    </form>
  );
}
