'use client';

import { useTranslations } from 'next-intl';
import { Button, Label } from '@/shared/components/ui';
import { SingleSelectDropdown } from '@/shared/components/ui/single-select-dropdown';
import { GroupCalendarScheduleSection } from '@/features/groups/components/GroupCalendarScheduleSection';
import { cn } from '@/shared/lib/utils';
import {
  ADMIN_FORM_INPUT_CLASS,
  ADMIN_OUTLINE_BUTTON_CLASS,
  ADMIN_PRIMARY_BUTTON_CLASS,
} from '@/shared/lib/admin-control-theme';
import { GroupTeacherReadonlyRow } from './GroupTeacherReadonlyRow';
import type { useAddLessonForm } from './useAddLessonForm';

type AddLessonFormFieldsProps = ReturnType<typeof useAddLessonForm>;

export function AddLessonFormFields(form: AddLessonFormFieldsProps) {
  const tCommon = useTranslations('common');
  const tGroupsForm = useTranslations('groups.form');

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

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="min-w-0 space-y-2">
            <Label htmlFor="groupId">
              {tCommon('group')} <span className="text-red-500">*</span>
            </Label>
            <input type="hidden" {...form.register('groupId')} />
            <SingleSelectDropdown
              id="groupId"
              triggerClassName={ADMIN_FORM_INPUT_CLASS}
              options={[
                { id: '', label: form.tForm('selectGroup') },
                ...form.groups.map((group) => ({
                  id: group.id,
                  label: `${group.name}${group.level ? ` (${group.level})` : ''}${group.center ? ` - ${group.center.name}` : ''}`,
                })),
              ]}
              value={form.groupIdW || ''}
              onValueChange={form.handleGroupChange}
              disabled={form.isBusy || form.isLoadingGroups}
              error={form.errors.groupId?.message ?? null}
              searchable
              searchPlaceholder={form.tForm('searchGroups')}
              placeholder={form.tForm('selectGroup')}
              wrapText
            />
            {form.errors.groupId ? (
              <p className="text-sm text-red-600">{form.errors.groupId.message}</p>
            ) : null}
            {form.isLoadingGroups ? (
              <p className="text-sm text-slate-500">{form.tForm('loadingGroups')}</p>
            ) : null}
            {!form.isLoadingGroups && form.noGroupsAvailable ? (
              <p className="text-sm text-amber-600">{form.tForm('noGroupsAvailable')}</p>
            ) : null}
            {form.selectedGroupHasNoTeacher ? (
              <p className="text-sm text-amber-600">{form.tForm('noTeacherOnGroup')}</p>
            ) : null}
          </div>

          <div className="min-w-0 space-y-2">
            <input type="hidden" {...form.register('teacherId')} />
            {!form.hasGroup ? (
              <>
                <Label htmlFor="teacherId">
                  {tCommon('teacher')} <span className="text-red-500">*</span>
                </Label>
                <div
                  id="teacherId"
                  className={cn(ADMIN_FORM_INPUT_CLASS, 'flex items-center bg-slate-50')}
                >
                  <span className="text-sm text-slate-400">{form.tForm('selectGroupFirst')}</span>
                </div>
              </>
            ) : form.selectedGroupTeachers[0] ? (
              <>
                <Label htmlFor="teacherId">
                  {tGroupsForm('teacher1')} <span className="text-red-500">*</span>
                </Label>
                <div
                  id="teacherId"
                  className={cn(ADMIN_FORM_INPUT_CLASS, 'flex items-center bg-slate-50')}
                >
                  <GroupTeacherReadonlyRow teacher={form.selectedGroupTeachers[0]} />
                </div>
              </>
            ) : (
              <>
                <Label htmlFor="teacherId">
                  {tCommon('teacher')} <span className="text-red-500">*</span>
                </Label>
                <div
                  id="teacherId"
                  className={cn(ADMIN_FORM_INPUT_CLASS, 'flex items-center bg-slate-50')}
                >
                  <span className="text-sm text-slate-400">—</span>
                </div>
              </>
            )}
          </div>
        </div>

        {form.hasGroup && form.selectedGroupTeachers.length > 1 ? (
          <div className="space-y-2">
            <Label htmlFor={`teacherId-${form.selectedGroupTeachers[1].id}`}>
                  {tGroupsForm('teacher2')} <span className="text-red-500">*</span>
            </Label>
            <div
              id={`teacherId-${form.selectedGroupTeachers[1].id}`}
              className={cn(ADMIN_FORM_INPUT_CLASS, 'flex items-center bg-slate-50')}
            >
              <GroupTeacherReadonlyRow teacher={form.selectedGroupTeachers[1]} />
            </div>
          </div>
        ) : null}

        {form.errors.teacherId ? (
          <p className="text-sm text-red-600">{form.errors.teacherId.message}</p>
        ) : null}
      </div>

      <GroupCalendarScheduleSection
        schedule={form.schedule}
        onScheduleChange={form.setSchedule}
        dateFrom={form.dateFrom}
        dateTo={form.dateTo}
        onDateFromChange={form.setDateFrom}
        onDateToChange={form.setDateTo}
        disabled={form.isBusy}
        adminControls
      />

      <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          className={cn(ADMIN_OUTLINE_BUTTON_CLASS, 'border-[rgba(14,14,16,0.07)] hover:bg-slate-50')}
          onClick={form.requestClose}
          disabled={form.isBusy}
        >
          {tCommon('cancel')}
        </Button>
        <Button
          type="submit"
          className={cn(ADMIN_PRIMARY_BUTTON_CLASS, 'bg-primary text-primary-foreground hover:bg-primary/90')}
          disabled={
            form.isBusy ||
            form.isLoadingGroups ||
            form.groups.length === 0 ||
            !form.hasGroup ||
            !form.hasTeacher ||
            form.selectedGroupHasNoTeacher ||
            !form.scheduleValid
          }
          isLoading={form.isBusy}
        >
          {form.isBusy ? form.tForm('creating') : form.tForm('createLessons')}
        </Button>
      </div>
    </form>
  );
}
