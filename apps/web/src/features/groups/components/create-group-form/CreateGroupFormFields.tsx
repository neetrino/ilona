'use client';

import { Button, Input, Label, Checkbox, SegmentedControl } from '@/shared/components/ui';
import { cn } from '@/shared/lib/utils';
import {
  ADMIN_FORM_INPUT_CLASS,
  ADMIN_OUTLINE_BUTTON_CLASS,
  ADMIN_PRIMARY_BUTTON_CLASS,
} from '@/shared/lib/admin-control-theme';
import { SingleSelectDropdown } from '@/shared/components/ui/single-select-dropdown';
import { GroupCalendarScheduleSection } from '../GroupCalendarScheduleSection';
import { GroupIconPicker } from '../GroupIconPicker';
import { teacherOptionLabel } from '../../lib/center-scoped-teachers';
import { GROUP_LEVEL_SEGMENT_OPTIONS } from '../../lib/group-level-options';
import { ADMIN_TEXTAREA_CLASS } from '../edit-group-form/edit-group-form.constants';
import type { CreateGroupFormData } from './create-group-form.types';
import type { useCreateGroupForm } from './useCreateGroupForm';

type CreateGroupFormFieldsProps = ReturnType<typeof useCreateGroupForm> & {
  handleSubmit: ReturnType<typeof useCreateGroupForm>['handleSubmit'];
  onSubmit: (data: CreateGroupFormData) => Promise<void>;
};

export function CreateGroupFormFields(props: CreateGroupFormFieldsProps) {
  const {
    tForm,
    tCommon,
    successMessage,
    errorMessage,
    handleSubmit,
    onSubmit,
    register,
    errors,
    isSubmitting,
    setValue,
    iconKey,
    setIconKey,
    schedule,
    setSchedule,
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
    createGroup,
    centers,
    centerSegmentOptions,
    watchedCenterId,
    watchedTeacherId,
    watchedSecondTeacherId,
    watchedLevel,
    handleCenterChange,
    teachersForCenter,
    teacherPlaceholder,
    teacherDropdownDisabled,
    isLoadingCenters,
    isLoadingTeachers,
    isFormBusy,
    secondTeacherStartsFirstWeek,
    setSecondTeacherStartsFirstWeek,
    requestClose,
  } = props;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {successMessage && (
        <div className="rounded-[15px] border border-green-200 bg-green-50 p-3">
          <p className="text-sm text-green-600">{successMessage}</p>
        </div>
      )}
      {errorMessage && (
        <div className="rounded-[15px] border border-red-200 bg-red-50 p-3">
          <p className="text-sm text-red-600">{errorMessage}</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="min-w-0 space-y-2">
          <Label htmlFor="name">
            {tForm('groupName')} <span className="text-red-500">*</span>
          </Label>
          <Input
            id="name"
            className={ADMIN_FORM_INPUT_CLASS}
            {...register('name')}
            error={errors.name?.message}
            placeholder={tForm('namePlaceholder')}
            disabled={isSubmitting}
          />
        </div>

        <div className="min-w-0 space-y-2">
          <Label>{tCommon('level')}</Label>
          <SegmentedControl
            options={GROUP_LEVEL_SEGMENT_OPTIONS}
            value={watchedLevel}
            onChange={(nextValue) =>
              setValue('level', nextValue, { shouldDirty: true, shouldValidate: true })
            }
            disabled={isSubmitting}
            aria-label={tCommon('level')}
          />
          {errors.level?.message ? (
            <p className="text-sm text-red-600">{errors.level.message}</p>
          ) : null}
        </div>
      </div>

      <div className="space-y-2">
        <Label id="create-group-icon-label">{tForm('groupIcon')}</Label>
        <p className="text-xs text-slate-500">{tForm('iconHintEdit')}</p>
        <GroupIconPicker
          value={iconKey}
          onChange={setIconKey}
          defaultSelectsRandom
          disabled={isSubmitting}
          adminControls
          aria-labelledby="create-group-icon-label"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">{tForm('description')}</Label>
        <textarea
          id="description"
          {...register('description')}
          rows={3}
          placeholder={tForm('descriptionPlaceholder')}
          disabled={isSubmitting}
          className={cn(
            ADMIN_TEXTAREA_CLASS,
            errors.description ? 'border-red-300' : '',
            isSubmitting ? 'cursor-not-allowed bg-slate-100' : '',
          )}
        />
        {errors.description && (
          <p className="text-sm text-red-600">{errors.description.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label>
          {tCommon('center')} <span className="text-red-500">*</span>
        </Label>
        {isLoadingCenters ? (
          <p className="text-sm text-slate-500">{tForm('loadingCenters')}</p>
        ) : centers.length === 0 ? (
          <p className="text-sm text-amber-600">{tForm('noCentersAvailable')}</p>
        ) : (
          <>
            <div className="min-[1367px]:hidden">
              <SingleSelectDropdown
                id="centerId"
                triggerClassName={ADMIN_FORM_INPUT_CLASS}
                options={centerSegmentOptions}
                value={watchedCenterId || null}
                onValueChange={(nextValue) => handleCenterChange(nextValue ?? '')}
                placeholder={tForm('selectCenter')}
                isLoading={isLoadingCenters}
                error={errors.centerId?.message ?? null}
                disabled={isSubmitting || isLoadingCenters}
              />
            </div>
            <div className="hidden min-[1367px]:block">
              <SegmentedControl
                options={centerSegmentOptions}
                value={watchedCenterId}
                onChange={handleCenterChange}
                disabled={isSubmitting || isLoadingCenters}
                aria-label={tCommon('center')}
              />
            </div>
          </>
        )}
        {errors.centerId?.message ? (
          <p className="hidden text-sm text-red-600 min-[1367px]:block">{errors.centerId.message}</p>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="min-w-0 space-y-2">
          <Label htmlFor="teacherId">
            {tForm('teacher1Main')} <span className="text-red-500">*</span>
          </Label>
          <input type="hidden" {...register('teacherId')} />
          <SingleSelectDropdown
            id="teacherId"
            triggerClassName={ADMIN_FORM_INPUT_CLASS}
            options={teachersForCenter.map((teacher) => ({
              id: teacher.id,
              label: teacherOptionLabel(teacher),
            }))}
            value={watchedTeacherId || null}
            onValueChange={(nextValue) => {
              const nextTeacherId = nextValue ?? '';
              setValue('teacherId', nextTeacherId, {
                shouldDirty: true,
                shouldValidate: true,
              });
              if (watchedSecondTeacherId && watchedSecondTeacherId === nextTeacherId) {
                setValue('secondTeacherId', '', {
                  shouldDirty: true,
                  shouldValidate: true,
                });
              }
            }}
            placeholder={teacherPlaceholder}
            isLoading={isLoadingTeachers}
            error={errors.teacherId?.message ?? null}
            disabled={teacherDropdownDisabled}
          />
        </div>

        <div className="min-w-0 space-y-2">
          <Label htmlFor="secondTeacherId">
            {tForm('teacher2')} <span className="text-red-500">*</span>
          </Label>
          <input type="hidden" {...register('secondTeacherId')} />
          <SingleSelectDropdown
            id="secondTeacherId"
            triggerClassName={ADMIN_FORM_INPUT_CLASS}
            options={teachersForCenter
              .filter((teacher) => teacher.id !== watchedTeacherId)
              .map((teacher) => ({
                id: teacher.id,
                label: teacherOptionLabel(teacher),
              }))}
            value={watchedSecondTeacherId || null}
            onValueChange={(nextValue) =>
              setValue('secondTeacherId', nextValue ?? '', {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
            placeholder={teacherPlaceholder}
            isLoading={isLoadingTeachers}
            error={errors.secondTeacherId?.message ?? null}
            disabled={teacherDropdownDisabled}
          />
          <label className="flex cursor-pointer select-none items-start gap-2 pt-1">
            <Checkbox
              checked={secondTeacherStartsFirstWeek}
              onCheckedChange={setSecondTeacherStartsFirstWeek}
              disabled={isFormBusy}
              className="mt-0.5"
            />
            <span className="text-sm text-slate-600">{tForm('teacher2StartsFirstWeek')}</span>
          </label>
        </div>
      </div>

      {isLoadingTeachers && (
        <p className="text-sm text-slate-500">{tForm('loadingTeachers')}</p>
      )}

      <p className="text-xs text-slate-500">{tForm('teacherRotationHint')}</p>

      <GroupCalendarScheduleSection
        schedule={schedule}
        onScheduleChange={setSchedule}
        dateFrom={dateFrom}
        dateTo={dateTo}
        onDateFromChange={setDateFrom}
        onDateToChange={setDateTo}
        disabled={isFormBusy}
        adminControls
      />

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
          disabled={
            isFormBusy ||
            isLoadingCenters ||
            isLoadingTeachers ||
            centers.length === 0
          }
          className={cn(ADMIN_PRIMARY_BUTTON_CLASS, 'bg-primary text-primary-foreground hover:bg-primary/90')}
        >
          {isSubmitting || createGroup.isPending ? tForm('creating') : tForm('createGroup')}
        </Button>
      </div>
    </form>
  );
}
