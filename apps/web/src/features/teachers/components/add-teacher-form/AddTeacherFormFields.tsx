'use client';

import { useTranslations } from 'next-intl';
import {
  Button,
  Input,
  Label,
  PasswordInput,
} from '@/shared/components/ui';
import { experienceYearsFieldRegisterOptions } from '@/features/teachers/utils/experience';
import { cn } from '@/shared/lib/utils';
import {
  ADMIN_FORM_INPUT_CLASS,
  ADMIN_OUTLINE_BUTTON_CLASS,
  ADMIN_PRIMARY_BUTTON_CLASS,
} from '@/shared/lib/admin-control-theme';
import {
  ADD_TEACHER_CENTER_CHIP_CLASS,
  ADD_TEACHER_SECTION_HEADING,
} from './add-teacher-form.constants';
import type { useAddTeacherForm } from './useAddTeacherForm';

type AddTeacherFormFieldsProps = ReturnType<typeof useAddTeacherForm>;

export function AddTeacherFormFields(form: AddTeacherFormFieldsProps) {
  const t = useTranslations('teachers');
  const tCrm = useTranslations('crm');
  const tStudentsForm = useTranslations('students.form');
  const tCommon = useTranslations('common');

  return (
    <form onSubmit={form.handleSubmit(form.onSubmit)} className="space-y-6">
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

      <section className="space-y-4">
        <h3 className={ADD_TEACHER_SECTION_HEADING}>{tCrm('basicInfo')}</h3>
        <div className="grid grid-cols-2 gap-4 min-[1367px]:grid-cols-3">
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
              disabled={form.isFormBusy}
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
              disabled={form.isFormBusy}
            />
          </div>
          <div className="col-span-2 min-w-0 space-y-2 min-[1367px]:col-span-1">
            <Label htmlFor="phone">{tStudentsForm('phoneNumber')}</Label>
            <Input
              id="phone"
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              value={form.phoneDigits !== '' ? `+${form.phoneDigits}` : ''}
              onChange={(e) =>
                form.setValue('phone', e.target.value.replace(/\D/g, ''), {
                  shouldValidate: true,
                  shouldDirty: true,
                })
              }
              placeholder={form.tForm('phonePlaceholder')}
              className={ADMIN_FORM_INPUT_CLASS}
              disabled={form.isFormBusy}
            />
            {form.errors.phone ? (
              <p className="text-sm text-red-600">{form.errors.phone.message}</p>
            ) : null}
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className={ADD_TEACHER_SECTION_HEADING}>{tStudentsForm('account')}</h3>
        <div className="grid grid-cols-2 gap-4 min-[1367px]:grid-cols-3">
          <div className="col-span-2 min-w-0 space-y-2 min-[1367px]:col-span-1">
            <Label htmlFor="email">
              {tCommon('email')} <span className="text-red-500">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              className={ADMIN_FORM_INPUT_CLASS}
              {...form.register('email')}
              error={form.errors.email?.message}
              placeholder={form.tForm('emailPlaceholder')}
              disabled={form.isFormBusy}
            />
          </div>
          <div className="min-w-0 space-y-2">
            <Label htmlFor="password">
              {form.tForm('password')} <span className="text-red-500">*</span>
            </Label>
            <PasswordInput
              id="password"
              autoComplete="new-password"
              className={ADMIN_FORM_INPUT_CLASS}
              {...form.register('password')}
              error={form.errors.password?.message}
              placeholder={form.tForm('passwordPlaceholder')}
              disabled={form.isFormBusy}
            />
          </div>
          <div className="min-w-0 space-y-2">
            <Label htmlFor="confirmPassword">
              {form.tForm('confirmPassword')} <span className="text-red-500">*</span>
            </Label>
            <PasswordInput
              id="confirmPassword"
              autoComplete="new-password"
              className={ADMIN_FORM_INPUT_CLASS}
              {...form.register('confirmPassword')}
              error={form.errors.confirmPassword?.message}
              placeholder={form.tForm('passwordPlaceholder')}
              disabled={form.isFormBusy}
            />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className={ADD_TEACHER_SECTION_HEADING}>{t('professionalInformation')}</h3>
        <div className="grid grid-cols-2 gap-4">
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
              disabled={form.isFormBusy}
            />
          </div>
          <div className="min-w-0 space-y-2">
            <Label htmlFor="experienceYears">{t('experienceYears')}</Label>
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
              disabled={form.isFormBusy}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="videoUrl">{form.tForm('publicVideoUrl')}</Label>
          <Input
            id="videoUrl"
            type="url"
            className={ADMIN_FORM_INPUT_CLASS}
            {...form.register('videoUrl')}
            error={form.errors.videoUrl?.message}
            placeholder={form.tForm('videoUrlPlaceholder')}
            disabled={form.isFormBusy}
          />
          <p className="text-xs text-slate-500">{form.tForm('videoUrlHintAdd')}</p>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className={ADD_TEACHER_SECTION_HEADING}>{form.tForm('centersBranches')}</h3>
        {form.centers.length === 0 ? (
          <p className="text-xs text-slate-500">{form.tForm('noCentersAvailable')}</p>
        ) : (
          <div className="grid grid-cols-2 gap-2 min-[1367px]:flex min-[1367px]:flex-wrap min-[1367px]:gap-2">
            {form.centers.map((center) => {
              const active = form.selectedCenterIds.includes(center.id);
              return (
                <button
                  key={center.id}
                  type="button"
                  onClick={() => form.toggleCenter(center.id)}
                  disabled={form.isFormBusy}
                  title={center.name}
                  className={cn(
                    ADD_TEACHER_CENTER_CHIP_CLASS,
                    'w-full min-w-0 min-[1367px]:w-auto',
                    active
                      ? 'border-[#1010a3] bg-[#1010a3] text-white'
                      : 'border-[rgba(14,14,16,0.07)] bg-white text-[#3b3b40] hover:bg-slate-50',
                  )}
                >
                  <span className="block truncate">{center.name}</span>
                </button>
              );
            })}
          </div>
        )}
        <p className="text-xs text-slate-500">{form.tForm('centersBranchesHint')}</p>
      </section>

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
          isLoading={form.isFormBusy}
          className={cn(ADMIN_PRIMARY_BUTTON_CLASS, 'bg-primary text-primary-foreground hover:bg-primary/90')}
        >
          {form.isFormBusy ? form.tForm('creating') : form.tForm('createTeacher')}
        </Button>
      </div>
    </form>
  );
}
