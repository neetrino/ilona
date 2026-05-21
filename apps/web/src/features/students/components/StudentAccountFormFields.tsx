'use client';

import { useTranslations } from 'next-intl';
import type { FieldErrors, UseFormRegister, UseFormWatch } from 'react-hook-form';
import { Input, Label, PasswordInput } from '@/shared/components/ui';
import type { CreateStudentFormData } from '../student-account-form.schema';

export type StudentAccountTeacherOption = {
  id: string;
  user: { firstName?: string | null; lastName?: string | null; phone?: string | null };
  centerLinks?: Array<{ center: { id: string; name: string } }>;
};

export type StudentAccountGroupOption = {
  id: string;
  name: string;
  level?: string | null;
  teacherId?: string | null;
  center?: { id: string; name: string };
};

export interface StudentAccountFormFieldsProps {
  register: UseFormRegister<CreateStudentFormData>;
  errors: FieldErrors<CreateStudentFormData>;
  watch: UseFormWatch<CreateStudentFormData>;
  computedAge: number | undefined;
  showParentSection: boolean;
  groupsForTeacher: StudentAccountGroupOption[];
  teachers: StudentAccountTeacherOption[];
  isLoadingGroups: boolean;
  isLoadingTeachers: boolean;
  isSubmitting: boolean;
  /** Active centers for manual Center assignment */
  centers: Array<{ id: string; name: string }>;
  isLoadingCenters?: boolean;
  /** When false (e.g. Manager CRM registration), Center dropdown is hidden; backend assigns center. */
  showCenterSelect?: boolean;
  /** Read-only label when `showCenterSelect` is false (e.g. manager’s branch name). */
  assignedCenterDisplay?: string | null;
  /** Prefix for input ids when multiple forms exist on one page */
  idPrefix?: string;
}

const selectClassName =
  'flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';

const LEVEL_FILTER_OPTIONS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;

export function StudentAccountFormFields({
  register,
  errors,
  watch,
  computedAge,
  showParentSection,
  groupsForTeacher,
  teachers,
  isLoadingGroups,
  isLoadingTeachers,
  isSubmitting,
  centers,
  isLoadingCenters = false,
  showCenterSelect = true,
  assignedCenterDisplay = null,
  idPrefix = '',
}: StudentAccountFormFieldsProps) {
  const t = useTranslations('students');
  const tForm = useTranslations('students.form');
  const tCommon = useTranslations('common');

  const p = (id: string) => (idPrefix ? `${idPrefix}-${id}` : id);
  const watchedTeacherId = watch('teacherId') || '';
  const watchedGroupId = watch('groupId') || '';
  const selectedTeacher = teachers.find((te) => te.id === watchedTeacherId);
  const centerNamesFromTeacher = [
    ...new Set(
      (selectedTeacher?.centerLinks ?? []).map((l) => l.center.name).filter(Boolean),
    ),
  ];
  const centerNamesFromGroups = [
    ...new Set(groupsForTeacher.map((g) => g.center?.name).filter(Boolean) as string[]),
  ];
  const teacherCentersLabel = [...new Set([...centerNamesFromTeacher, ...centerNamesFromGroups])].join(
    ', ',
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor={p('firstName')}>
            {tCommon('firstName')} <span className="text-red-500">{tForm('requiredMark')}</span>
          </Label>
          <Input
            id={p('firstName')}
            {...register('firstName')}
            error={errors.firstName?.message}
            placeholder={tForm('firstNamePlaceholder')}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={p('lastName')}>
            {tCommon('lastName')} <span className="text-red-500">{tForm('requiredMark')}</span>
          </Label>
          <Input
            id={p('lastName')}
            {...register('lastName')}
            error={errors.lastName?.message}
            placeholder={tForm('lastNamePlaceholder')}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor={p('email')}>
          {tForm('email')} <span className="text-red-500">{tForm('requiredMark')}</span>
        </Label>
        <Input
          id={p('email')}
          type="email"
          {...register('email')}
          error={errors.email?.message}
          placeholder={tForm('emailPlaceholder')}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={p('password')}>
          {tForm('password')} <span className="text-red-500">{tForm('requiredMark')}</span>
        </Label>
        <PasswordInput
          id={p('password')}
          {...register('password')}
          error={errors.password?.message}
          placeholder={tForm('passwordPlaceholder')}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={p('phone')}>{tCommon('phone')}</Label>
        <Input
          id={p('phone')}
          type="tel"
          {...register('phone')}
          error={errors.phone?.message}
          placeholder={t('phonePlaceholder')}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor={p('manualAge')}>{tForm('ageYears')}</Label>
          <Input
            id={p('manualAge')}
            type="number"
            min={0}
            {...register('manualAge')}
            error={errors.manualAge?.message}
          />
          <p className="text-xs text-slate-500">{tForm('useIfDobUnknown')}</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor={p('dateOfBirth')}>{t('dateOfBirth')}</Label>
          <Input
            id={p('dateOfBirth')}
            type="date"
            {...register('dateOfBirth')}
            error={errors.dateOfBirth?.message}
          />
          {computedAge !== undefined && (
            <p className="text-xs text-slate-500">{tForm('ageHint', { age: computedAge })}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor={p('firstLessonDate')}>{tForm('firstLessonDate')}</Label>
          <Input
            id={p('firstLessonDate')}
            type="date"
            {...register('firstLessonDate')}
            error={errors.firstLessonDate?.message}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor={p('levelId')}>{tForm('levelOptional')}</Label>
        <select
          id={p('levelId')}
          {...register('levelId')}
          className={selectClassName}
          disabled={isSubmitting}
        >
          <option value="">{tForm('anyLevel')}</option>
          {LEVEL_FILTER_OPTIONS.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor={p('teacherId')}>{t('teacher')}</Label>
          <select
            id={p('teacherId')}
            {...register('teacherId')}
            className={selectClassName}
            disabled={isLoadingTeachers || isSubmitting}
          >
            <option value="">{t('selectTeacher')}</option>
            {teachers.map((teacher) => (
              <option key={teacher.id} value={teacher.id}>
                {teacher.user?.firstName ?? ''} {teacher.user?.lastName ?? ''}
                {teacher.user?.phone ? ` - ${teacher.user.phone}` : ''}
              </option>
            ))}
          </select>
          {errors.teacherId && <p className="text-sm text-red-600">{errors.teacherId.message}</p>}
          {isLoadingTeachers && <p className="text-sm text-slate-500">{t('loadingTeachers')}</p>}
          {watchedTeacherId && teacherCentersLabel ? (
            <p className="text-xs text-slate-500">
              {tForm('teacherCenters')}: {teacherCentersLabel}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor={p('groupId')}>{t('group')}</Label>
          <select
            id={p('groupId')}
            {...register('groupId')}
            className={selectClassName}
            disabled={isLoadingGroups || !watchedTeacherId}
          >
            <option value="">
              {watchedTeacherId ? tCommon('notAssigned') : t('selectTeacherFirst')}
            </option>
            {groupsForTeacher.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name} {group.level ? `(${group.level})` : ''}
              </option>
            ))}
          </select>
          {errors.groupId && <p className="text-sm text-red-600">{errors.groupId.message}</p>}
          {watchedGroupId ? (
            <p className="text-xs text-slate-500">
              {tCommon('center')}:{' '}
              {groupsForTeacher.find((g) => g.id === watchedGroupId)?.center?.name ?? t('notAvailable')}
            </p>
          ) : null}
        </div>
      </div>

      {showCenterSelect ? (
        <div className="space-y-2">
          <Label htmlFor={p('centerId')}>{tCommon('center')}</Label>
          <select
            id={p('centerId')}
            {...register('centerId')}
            className={selectClassName}
            disabled={isLoadingCenters || isSubmitting}
          >
            <option value="">{tCommon('notAssigned')}</option>
            {centers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          {errors.centerId && <p className="text-sm text-red-600">{errors.centerId.message}</p>}
        </div>
      ) : assignedCenterDisplay ? (
        <div className="space-y-2">
          <Label>{tCommon('center')}</Label>
          <p className="rounded-md border border-input bg-muted/40 px-3 py-2 text-sm text-slate-700">
            {assignedCenterDisplay}
          </p>
        </div>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor={p('monthlyFee')}>
          {t('monthlyFeeLabel')} (֏) <span className="text-red-500">{tForm('requiredMark')}</span>
        </Label>
        <Input
          id={p('monthlyFee')}
          type="number"
          step="0.01"
          min="0"
          {...register('monthlyFee', { valueAsNumber: true })}
          error={errors.monthlyFee?.message}
          placeholder="50000"
        />
      </div>

      {showParentSection && (
        <div className="border-t pt-4 transition-all duration-300 ease-in-out">
          <h3 className="text-sm font-semibold text-slate-800 mb-2">
            {tCommon('parentInformation')}
            <span className="text-red-500 ml-1">{tForm('requiredMark')}</span>
          </h3>
          <p className="text-xs text-slate-500 mb-4">{tForm('parentDetailsSection')}</p>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor={p('parentName')}>
                {t('parentName')} <span className="text-red-500">{tForm('requiredMark')}</span>
              </Label>
              <Input
                id={p('parentName')}
                {...register('parentName')}
                error={errors.parentName?.message}
                placeholder={tForm('firstNamePlaceholder')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={p('parentSurname')}>{tCommon('lastName')}</Label>
              <Input
                id={p('parentSurname')}
                {...register('parentSurname')}
                error={errors.parentSurname?.message}
                placeholder={tForm('lastNamePlaceholder')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={p('parentPhone')}>
                {t('parentPhone')} <span className="text-red-500">{tForm('requiredMark')}</span>
              </Label>
              <Input
                id={p('parentPhone')}
                type="tel"
                {...register('parentPhone')}
                error={errors.parentPhone?.message}
                placeholder={t('phonePlaceholder')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={p('parentEmail')}>
                {t('parentEmail')} <span className="text-red-500">{tForm('requiredMark')}</span>
              </Label>
              <Input
                id={p('parentEmail')}
                type="email"
                autoComplete="email"
                {...register('parentEmail')}
                error={errors.parentEmail?.message}
                placeholder={tForm('emailPlaceholder')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={p('parentPassportInfo')}>
                {tForm('parentPassportInfo')} <span className="text-red-500">{tForm('requiredMark')}</span>
              </Label>
              <Input
                id={p('parentPassportInfo')}
                {...register('parentPassportInfo')}
                error={errors.parentPassportInfo?.message}
                placeholder={tForm('parentPassportInfo')}
              />
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor={p('notes')}>{t('notes')}</Label>
        <textarea
          id={p('notes')}
          {...register('notes')}
          rows={4}
          className={selectClassName}
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
    </div>
  );
}
