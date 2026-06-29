'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/shared/components/ui';
import { cn } from '@/shared/lib/utils';
import {
  ADMIN_OUTLINE_BUTTON_CLASS,
  ADMIN_PRIMARY_BUTTON_CLASS,
} from '@/shared/lib/admin-control-theme';
import { StudentAccountFormFieldsCrmLeadLayout } from '../StudentAccountFormFieldsCrmLeadLayout';
import type { useAddStudentForm } from './useAddStudentForm';

type AddStudentFormFieldsProps = ReturnType<typeof useAddStudentForm>;

export function AddStudentFormFields(form: AddStudentFormFieldsProps) {
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

      <StudentAccountFormFieldsCrmLeadLayout
        register={form.register}
        setValue={form.setValue}
        errors={form.errors}
        watch={form.watch}
        showParentSection={form.showParentSection}
        groupsForCenter={form.groupsForCenter}
        centers={form.centers}
        isLoadingGroups={form.isLoadingGroups}
        isLoadingCenters={form.isLoadingCenters}
        isSubmitting={form.isSubmitting}
        showCenterSelect={form.showCenterSelect}
        assignedCenterDisplay={form.managerCenterLabel}
        lockedCenterId={form.lockedCenterId}
      />

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
          {form.isFormBusy ? form.tForm('creating') : form.tForm('createStudent')}
        </Button>
      </div>
    </form>
  );
}
