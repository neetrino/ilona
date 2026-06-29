'use client';

import { useTranslations } from 'next-intl';
import { Button, Input, Label } from '@/shared/components/ui';
import { cn } from '@/shared/lib/utils';
import {
  ADMIN_FORM_INPUT_CLASS,
  ADMIN_OUTLINE_BUTTON_CLASS,
  ADMIN_PRIMARY_BUTTON_CLASS,
} from '@/shared/lib/admin-control-theme';
import { ADMIN_TEXTAREA_CLASS } from '../edit-center-form/edit-center-form.constants';
import type { useCreateCenterForm } from './useCreateCenterForm';

type CreateCenterFormFieldsProps = ReturnType<typeof useCreateCenterForm>;

export function CreateCenterFormFields(form: CreateCenterFormFieldsProps) {
  const tForm = useTranslations('centers.form');
  const tCommon = useTranslations('common');

  return (
    <form onSubmit={form.handleSubmit(form.onSubmit)} className="space-y-4">
      {form.successMessage ? (
        <div className="rounded-[15px] border border-green-200 bg-green-50 p-3">
          <p className="text-sm text-green-600">{form.successMessage}</p>
        </div>
      ) : null}
      {form.errorMessage ? (
        <div className="rounded-[15px] border border-red-200 bg-red-50 p-3">
          <p className="text-sm text-red-600">{form.errorMessage}</p>
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
            {...form.register('name')}
            error={form.errors.name?.message}
            placeholder={tForm('namePlaceholder')}
            disabled={form.isFormBusy}
          />
        </div>

        <div className="min-w-0 space-y-2">
          <Label htmlFor="address">{tForm('address')}</Label>
          <Input
            id="address"
            className={ADMIN_FORM_INPUT_CLASS}
            {...form.register('address')}
            error={form.errors.address?.message}
            placeholder={tForm('addressPlaceholder')}
            disabled={form.isFormBusy}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="phone">{tForm('phone')}</Label>
          <Input
            id="phone"
            className={ADMIN_FORM_INPUT_CLASS}
            {...form.register('phone')}
            error={form.errors.phone?.message}
            placeholder={tForm('phonePlaceholder')}
            disabled={form.isFormBusy}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">{tForm('email')}</Label>
          <Input
            id="email"
            type="email"
            className={ADMIN_FORM_INPUT_CLASS}
            {...form.register('email')}
            error={form.errors.email?.message}
            placeholder={tForm('emailPlaceholder')}
            disabled={form.isFormBusy}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">{tForm('description')}</Label>
        <textarea
          id="description"
          {...form.register('description')}
          rows={3}
          placeholder={tForm('descriptionPlaceholder')}
          disabled={form.isFormBusy}
          className={cn(
            ADMIN_TEXTAREA_CLASS,
            form.errors.description ? 'border-red-300' : '',
            form.isFormBusy ? 'cursor-not-allowed bg-slate-100' : '',
          )}
        />
        {form.errors.description ? (
          <p className="text-sm text-red-600">{form.errors.description.message}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="colorHex">{tForm('centerColorOptional')}</Label>
        <div className="flex items-center gap-3">
          <div className="group relative h-11 w-11 shrink-0">
            <span
              className="pointer-events-none block h-full w-full rounded-full shadow-[0_2px_10px_rgba(15,23,42,0.18)] transition-transform group-hover:scale-105"
              style={{ backgroundColor: form.watch('colorHex') || '#253046' }}
              aria-hidden
            />
            <input
              type="color"
              id="colorHex"
              value={form.watch('colorHex') || '#253046'}
              onChange={(e) => {
                form.setValue('colorHex', e.target.value, { shouldValidate: true });
              }}
              disabled={form.isFormBusy}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
              aria-label={tForm('centerColorOptional')}
            />
          </div>
          <div className="flex-1">
            <Input
              id="colorHexText"
              className={cn(ADMIN_FORM_INPUT_CLASS, 'font-mono')}
              value={form.watch('colorHex') || ''}
              onChange={(e) => {
                form.setValue('colorHex', e.target.value, { shouldValidate: true });
              }}
              onBlur={() => {
                const value = form.watch('colorHex');
                if (value && value.startsWith('#')) {
                  return;
                }
                if (value && !value.startsWith('#')) {
                  form.setValue('colorHex', `#${value}`, { shouldValidate: true });
                }
              }}
              error={form.errors.colorHex?.message}
              placeholder={tForm('colorPlaceholder')}
              disabled={form.isFormBusy}
            />
          </div>
        </div>
        <p className="text-xs text-slate-500">{tForm('colorHint')}</p>
      </div>

      <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          className={cn(ADMIN_OUTLINE_BUTTON_CLASS, 'border-[rgba(14,14,16,0.07)] hover:bg-slate-50')}
          onClick={form.requestClose}
          disabled={form.isFormBusy}
        >
          {tCommon('cancel')}
        </Button>
        <Button
          type="submit"
          disabled={form.isFormBusy}
          className={cn(ADMIN_PRIMARY_BUTTON_CLASS, 'bg-primary text-primary-foreground hover:bg-primary/90')}
        >
          {form.isSubmitting ? tForm('creating') : tForm('createCenter')}
        </Button>
      </div>
    </form>
  );
}
