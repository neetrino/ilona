'use client';

import { useTranslations } from 'next-intl';
import { Button, Input, Label } from '@/shared/components/ui';
import { experienceYearsFieldRegisterOptions } from '@/features/teachers/utils/experience';
import { cn } from '@/shared/lib/utils';
import {
  ADMIN_FORM_INPUT_CLASS,
  ADMIN_OUTLINE_BUTTON_CLASS,
  ADMIN_PRIMARY_BUTTON_CLASS,
} from '@/shared/lib/admin-control-theme';
import { SingleSelectDropdown } from '@/shared/components/ui/single-select-dropdown';
import {
  EDIT_TEACHER_CENTER_CHIP_ACTIVE_CLASS,
  EDIT_TEACHER_CENTER_CHIP_BASE_CLASS,
  EDIT_TEACHER_CENTER_CHIP_INACTIVE_CLASS,
} from './edit-teacher-form.constants';
import type { useEditTeacherForm } from './useEditTeacherForm';

type EditTeacherFormFieldsProps = ReturnType<typeof useEditTeacherForm>;

export function EditTeacherFormFields(form: EditTeacherFormFieldsProps) {
  const tCommon = useTranslations('common');
  const tStatus = useTranslations('status');

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

      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <div className="min-w-0 space-y-2">
          <Label htmlFor="firstName">
            {tCommon('firstName')} <span className="text-red-500">*</span>
          </Label>
          <Input
            id="firstName"
            className={ADMIN_FORM_INPUT_CLASS}
            {...form.register('firstName')}
            error={form.errors.firstName?.message}
            placeholder={form.tForm('firstNamePlaceholder')}
          />
        </div>

        <div className="min-w-0 space-y-2">
          <Label htmlFor="lastName">
            {tCommon('lastName')} <span className="text-red-500">*</span>
          </Label>
          <Input
            id="lastName"
            className={ADMIN_FORM_INPUT_CLASS}
            {...form.register('lastName')}
            error={form.errors.lastName?.message}
            placeholder={form.tForm('lastNamePlaceholder')}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <div className="min-w-0 space-y-2">
          <Label htmlFor="phone">{tCommon('phone')}</Label>
          <Input
            id="phone"
            type="tel"
            className={ADMIN_FORM_INPUT_CLASS}
            {...form.register('phone')}
            error={form.errors.phone?.message}
            placeholder={form.tForm('phonePlaceholder')}
          />
        </div>

        <div className="min-w-0 space-y-2">
          <Label htmlFor="status">{tCommon('status')}</Label>
          <input type="hidden" {...form.register('status')} />
          <SingleSelectDropdown
            id="status"
            className="w-full"
            triggerClassName={ADMIN_FORM_INPUT_CLASS}
            options={[
              { id: 'ACTIVE', label: tStatus('active') },
              { id: 'INACTIVE', label: tStatus('inactive') },
              { id: 'SUSPENDED', label: tStatus('suspended') },
            ]}
            value={form.watchedStatus}
            onValueChange={(nextValue) =>
              form.setValue('status', (nextValue as 'ACTIVE' | 'INACTIVE' | 'SUSPENDED') ?? 'ACTIVE', {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
          />
          {form.errors.status ? (
            <p className="text-sm text-red-600">{form.errors.status.message}</p>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <div className="min-w-0 space-y-2">
          <Label htmlFor="hourlyRate">
            {form.tForm('perLessonRate')} <span className="text-red-500">*</span>
          </Label>
          <Input
            id="hourlyRate"
            type="number"
            step="0.01"
            min="0"
            className={ADMIN_FORM_INPUT_CLASS}
            {...form.register('hourlyRate', { valueAsNumber: true })}
            error={form.errors.hourlyRate?.message}
            placeholder={form.tForm('hourlyRatePlaceholder')}
          />
        </div>

        <div className="min-w-0 space-y-2">
          <Label htmlFor="experienceYears">{form.t('experienceYears')}</Label>
          <Input
            id="experienceYears"
            type="number"
            min="0"
            max="80"
            step="1"
            className={ADMIN_FORM_INPUT_CLASS}
            {...form.register('experienceYears', experienceYearsFieldRegisterOptions)}
            error={form.errors.experienceYears?.message}
            placeholder={form.tForm('experiencePlaceholder')}
          />
        </div>
      </div>

      <div className="mt-8 space-y-2">
        <Label htmlFor="videoUrl">{form.tForm('publicVideoUrl')}</Label>
        <Input
          id="videoUrl"
          type="url"
          className={ADMIN_FORM_INPUT_CLASS}
          {...form.register('videoUrl')}
          error={form.errors.videoUrl?.message}
          placeholder={form.tForm('videoUrlPlaceholder')}
        />
        <p className="text-xs text-slate-500">{form.tForm('videoUrlHint')}</p>
      </div>

      <div className="space-y-2">
        <Label>{form.tForm('centersBranches')}</Label>
        {form.centers.length === 0 ? (
          <p className="text-xs text-slate-500">{form.tForm('noCentersAvailable')}</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {form.centers.map((center) => {
              const active = form.selectedCenterIds.includes(center.id);
              return (
                <button
                  key={center.id}
                  type="button"
                  onClick={() => form.toggleCenter(center.id)}
                  className={cn(
                    EDIT_TEACHER_CENTER_CHIP_BASE_CLASS,
                    active ? EDIT_TEACHER_CENTER_CHIP_ACTIVE_CLASS : EDIT_TEACHER_CENTER_CHIP_INACTIVE_CLASS,
                  )}
                >
                  {center.name}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          className={cn(
            ADMIN_OUTLINE_BUTTON_CLASS,
            'border-[rgba(14,14,16,0.07)] hover:bg-slate-50',
          )}
          onClick={form.handleCancel}
          disabled={form.isSubmitting || form.updateTeacher.isPending}
        >
          {tCommon('cancel')}
        </Button>
        <Button
          type="submit"
          isLoading={form.isSubmitting || form.updateTeacher.isPending}
          className={cn(ADMIN_PRIMARY_BUTTON_CLASS, 'bg-[#1010a3] text-white hover:bg-[#1010a3]/90')}
        >
          {form.isSubmitting || form.updateTeacher.isPending ? form.tForm('saving') : form.tForm('saveChanges')}
        </Button>
      </div>
    </form>
  );
}
