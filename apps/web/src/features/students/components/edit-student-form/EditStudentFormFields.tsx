'use client';

import { Button, Input, Label } from '@/shared/components/ui';
import { cn } from '@/shared/lib/utils';
import {
  ADMIN_DATE_INPUT_CLASS,
  ADMIN_FORM_INPUT_CLASS,
  ADMIN_OUTLINE_BUTTON_CLASS,
  ADMIN_PRIMARY_BUTTON_CLASS,
} from '@/shared/lib/admin-control-theme';
import { SingleSelectDropdown } from '@/shared/components/ui/single-select-dropdown';
import { DmyDateInput } from '@/shared/components/ui/dmy-date-input';
import type { UserStatus } from '@/types';
import { ADMIN_TEXTAREA_CLASS } from './edit-student-form.constants';
import type { useEditStudentForm } from './useEditStudentForm';

type EditStudentFormFieldsProps = ReturnType<typeof useEditStudentForm>;

export function EditStudentFormFields(props: EditStudentFormFieldsProps) {
  const {
    t,
    tForm,
    tCommon,
    tSettings,
    successMessage,
    errorMessage,
    handleSubmit,
    onSubmit,
    register,
    errors,
    isSubmitting,
    setValue,
    watchedDob,
    watchedFirstLessonDate,
    watchedStatus,
    watchedCenterId,
    watchedGroupId,
    effectiveAge,
    showParentSection,
    statusOptions,
    centers,
    groupsForCenter,
    isLoadingGroups,
    isLoadingCenters,
    updateStudent,
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">
                  {tCommon('firstName')} <span className="text-red-500">{tForm('requiredMark')}</span>
                </Label>
                <Input
                  id="firstName"
                  className={ADMIN_FORM_INPUT_CLASS}
                  {...register('firstName')}
                  error={errors.firstName?.message}
                  placeholder={tForm('firstNamePlaceholder')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">
                  {tCommon('lastName')} <span className="text-red-500">{tForm('requiredMark')}</span>
                </Label>
                <Input
                  id="lastName"
                  className={ADMIN_FORM_INPUT_CLASS}
                  {...register('lastName')}
                  error={errors.lastName?.message}
                  placeholder={tForm('lastNamePlaceholder')}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">{tCommon('phone')}</Label>
              <Input
                id="phone"
                type="tel"
                className={ADMIN_FORM_INPUT_CLASS}
                {...register('phone')}
                error={errors.phone?.message}
                placeholder={t('phonePlaceholder')}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">{t('dateOfBirth')}</Label>
                <DmyDateInput
                  id="dateOfBirth"
                  value={watchedDob}
                  placeholder={tForm('dateOfBirthPlaceholder')}
                  onChange={(value) =>
                    setValue('dateOfBirth', value, { shouldDirty: true, shouldValidate: true })
                  }
                  className={ADMIN_DATE_INPUT_CLASS}
                  disabled={isSubmitting}
                />
                {errors.dateOfBirth && (
                  <p className="text-sm text-red-600">{errors.dateOfBirth.message}</p>
                )}
                {effectiveAge !== undefined ? (
                  <p className="text-xs text-slate-500">{tForm('ageHint', { age: effectiveAge })}</p>
                ) : (
                  <p className="hidden text-xs text-slate-500 min-[1367px]:block" aria-hidden>
                    {'\u00A0'}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="firstLessonDate">{tForm('firstLessonDate')}</Label>
                <DmyDateInput
                  id="firstLessonDate"
                  value={watchedFirstLessonDate}
                  placeholder={tForm('firstLessonDatePlaceholder')}
                  onChange={(value) =>
                    setValue('firstLessonDate', value, { shouldDirty: true, shouldValidate: true })
                  }
                  className={ADMIN_DATE_INPUT_CLASS}
                  disabled={isSubmitting}
                />
                {errors.firstLessonDate && (
                  <p className="text-sm text-red-600">{errors.firstLessonDate.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-[minmax(9rem,34%)_minmax(0,1fr)] items-start gap-4 min-[1367px]:grid-cols-2">
              <div className="min-w-0 space-y-2">
                <Label htmlFor="status">{tCommon('status')}</Label>
                <input type="hidden" {...register('status')} />
                <SingleSelectDropdown
                  id="status"
                  triggerClassName={ADMIN_FORM_INPUT_CLASS}
                  options={statusOptions}
                  value={watchedStatus}
                  onValueChange={(nextValue) =>
                    setValue('status', (nextValue as UserStatus) ?? 'ACTIVE', {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                  }
                />
                {errors.status && (
                  <p className="text-sm text-red-600">{errors.status.message}</p>
                )}
              </div>

              <div className="min-w-0 space-y-2">
                <Label htmlFor="centerId">{tCommon('center')}</Label>
                <input type="hidden" {...register('centerId')} />
                <SingleSelectDropdown
                  id="centerId"
                  triggerClassName={ADMIN_FORM_INPUT_CLASS}
                  options={[
                    { id: '', label: tCommon('notAssigned') },
                    ...centers.map((center) => ({
                      id: center.id,
                      label: center.name,
                    })),
                  ]}
                  value={watchedCenterId}
                  onValueChange={(nextValue) => {
                    setValue('centerId', nextValue ?? '', { shouldDirty: true, shouldValidate: true });
                    setValue('groupId', '', { shouldDirty: true, shouldValidate: true });
                    setValue('teacherId', '', { shouldDirty: true, shouldValidate: true });
                  }}
                  disabled={isLoadingCenters || isSubmitting}
                />
                {errors.centerId && (
                  <p className="text-sm text-red-600">{errors.centerId.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="groupId">{t('group')}</Label>
              <input type="hidden" {...register('teacherId')} />
              <input type="hidden" {...register('groupId')} />
              <SingleSelectDropdown
                id="groupId"
                triggerClassName={ADMIN_FORM_INPUT_CLASS}
                options={[
                  {
                    id: '',
                    label: watchedCenterId
                      ? isLoadingGroups
                        ? tCommon('loading')
                        : groupsForCenter.length === 0
                          ? tForm('noGroupsForCenter')
                          : t('selectGroup')
                      : tForm('selectCenterFirst'),
                  },
                  ...groupsForCenter.map((group) => ({
                    id: group.id,
                    label: `${group.name}${group.level ? ` (${group.level})` : ''}`,
                  })),
                ]}
                value={watchedGroupId}
                onValueChange={(nextValue) =>
                  setValue('groupId', nextValue ?? '', {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
                disabled={isLoadingGroups || isSubmitting || !watchedCenterId}
              />
              {errors.groupId && (
                <p className="text-sm text-red-600">{errors.groupId.message}</p>
              )}
              {watchedCenterId && !isLoadingGroups && groupsForCenter.length === 0 && (
                <p className="text-sm text-slate-500">{tForm('noGroupsForCenter')}</p>
              )}
              {watchedCenterId && isLoadingGroups && (
                <p className="text-sm text-slate-500">{tCommon('loading')}</p>
              )}
              {watchedGroupId ? (
                <p className="text-xs text-slate-500">
                  {tCommon('center')}:{' '}
                  {groupsForCenter.find((g) => g.id === watchedGroupId)?.center?.name ?? t('notAvailable')}
                </p>
              ) : null}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="monthlyFee">
                  {t('monthlyFeeLabel')} (֏) <span className="text-red-500">{tForm('requiredMark')}</span>
                </Label>
                <Input
                  id="monthlyFee"
                  type="number"
                  step="0.01"
                  min="0"
                  className={ADMIN_FORM_INPUT_CLASS}
                  {...register('monthlyFee', { valueAsNumber: true })}
                  error={errors.monthlyFee?.message}
                  placeholder="50000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="registerDate">{t('registerDateLabel')}</Label>
                <Input
                  id="registerDate"
                  type="date"
                  className={ADMIN_DATE_INPUT_CLASS}
                  {...register('registerDate')}
                  error={errors.registerDate?.message}
                />
              </div>
            </div>

            {showParentSection && (
            <div className="border-t pt-4">
              <h3 className="mb-4 text-sm font-semibold text-[#1010a3]">
                {tForm('parentDetailsSection')}
              </h3>

              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 min-[1367px]:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="parentName">{t('parentName')}</Label>
                    <Input
                      id="parentName"
                      className={ADMIN_FORM_INPUT_CLASS}
                      {...register('parentName')}
                      error={errors.parentName?.message}
                      placeholder={tForm('firstNamePlaceholder')}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="parentPhone">{t('parentPhone')}</Label>
                    <Input
                      id="parentPhone"
                      type="tel"
                      className={ADMIN_FORM_INPUT_CLASS}
                      {...register('parentPhone')}
                      error={errors.parentPhone?.message}
                      placeholder={t('phonePlaceholder')}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 min-[1367px]:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="parentEmail">{t('parentEmail')}</Label>
                    <Input
                      id="parentEmail"
                      type="email"
                      className={ADMIN_FORM_INPUT_CLASS}
                      {...register('parentEmail')}
                      error={errors.parentEmail?.message}
                      placeholder={tForm('emailPlaceholder')}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="parentPassportInfo">{tForm('parentPassportInfo')}</Label>
                    <Input
                      id="parentPassportInfo"
                      className={ADMIN_FORM_INPUT_CLASS}
                      {...register('parentPassportInfo')}
                      error={errors.parentPassportInfo?.message}
                      placeholder={tForm('parentPassportInfo')}
                    />
                  </div>
                </div>
              </div>
            </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="notes">{t('notes')}</Label>
              <textarea
                id="notes"
                {...register('notes')}
                rows={4}
                className={ADMIN_TEXTAREA_CLASS}
                placeholder={t('notes')}
              />
              {errors.notes && (
                <p className="text-sm text-red-600">{errors.notes.message}</p>
              )}
            </div>

            <div className="flex flex-col-reverse gap-2 pt-2 min-[1367px]:flex-row min-[1367px]:justify-end">
              <Button
                type="button"
                variant="outline"
                className={cn(ADMIN_OUTLINE_BUTTON_CLASS, 'border-[rgba(14,14,16,0.07)] hover:bg-slate-50')}
                onClick={requestClose}
                disabled={isSubmitting || updateStudent.isPending}
              >
                {tCommon('cancel')}
              </Button>
              <Button
                type="submit"
                isLoading={isSubmitting || updateStudent.isPending}
                className={cn(ADMIN_PRIMARY_BUTTON_CLASS, 'bg-primary text-primary-foreground hover:bg-primary/90')}
              >
                {isSubmitting || updateStudent.isPending ? tSettings('saving') : tSettings('saveChanges')}
              </Button>
            </div>
          </form>
  );
}
