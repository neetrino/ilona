'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import type { FieldErrors, UseFormRegister, UseFormSetValue, UseFormWatch } from 'react-hook-form';
import { PasswordInput } from '@/shared/components/ui';
import type { Group } from '@/features/groups';
import type { CreateStudentFormData } from '../student-account-form.schema';
import { teacherBelongsToCenter } from '../lib/center-scoped-assignment';
import type { StudentAccountGroupOption, StudentAccountTeacherOption } from './StudentAccountFormFields';

const LEVEL_OPTIONS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;

const inputClass =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1';

const sectionTitle = 'text-xs font-semibold uppercase tracking-wide text-slate-500';

export interface StudentAccountFormFieldsCrmLeadLayoutProps {
  register: UseFormRegister<CreateStudentFormData>;
  setValue: UseFormSetValue<CreateStudentFormData>;
  errors: FieldErrors<CreateStudentFormData>;
  watch: UseFormWatch<CreateStudentFormData>;
  computedAge: number | undefined;
  showParentSection: boolean;
  groupsForTeacher: StudentAccountGroupOption[];
  teachers: StudentAccountTeacherOption[];
  centers: Array<{ id: string; name: string }>;
  isLoadingGroups: boolean;
  isLoadingTeachers: boolean;
  isLoadingCenters?: boolean;
  isSubmitting: boolean;
  showCenterSelect?: boolean;
  assignedCenterDisplay?: string | null;
  lockedCenterId?: string | null;
  groupsForAssignmentFilter?: Pick<Group, 'teacherId' | 'centerId'>[];
  idPrefix?: string;
}

export function StudentAccountFormFieldsCrmLeadLayout({
  register,
  setValue,
  errors,
  watch,
  computedAge,
  showParentSection,
  groupsForTeacher,
  teachers,
  centers,
  isLoadingGroups,
  isLoadingTeachers,
  isLoadingCenters = false,
  isSubmitting,
  showCenterSelect = true,
  assignedCenterDisplay = null,
  lockedCenterId = null,
  groupsForAssignmentFilter = [],
  idPrefix = '',
}: StudentAccountFormFieldsCrmLeadLayoutProps) {
  const t = useTranslations('students');
  const tForm = useTranslations('students.form');
  const tCrm = useTranslations('crm');
  const tCommon = useTranslations('common');

  const p = (id: string) => (idPrefix ? `${idPrefix}-${id}` : id);
  const watchedCenterId = watch('centerId') || '';
  const effectiveCenterId = lockedCenterId || watchedCenterId || '';
  const hasCenterScope = Boolean(effectiveCenterId);
  const watchedTeacherId = watch('teacherId') || '';
  const watchedGroupId = watch('groupId') || '';
  const phoneDigits = (watch('phone') ?? '').replace(/\D/g, '');
  const parentPhoneDigits = (watch('parentPhone') ?? '').replace(/\D/g, '');
  const selectedTeacher = teachers.find((te) => te.id === watchedTeacherId);
  const centerNamesFromTeacher = [
    ...new Set((selectedTeacher?.centerLinks ?? []).map((l) => l.center.name).filter(Boolean)),
  ];
  const centerNamesFromGroups = [
    ...new Set(groupsForTeacher.map((g) => g.center?.name).filter(Boolean) as string[]),
  ];
  const teacherCentersLabel = [...new Set([...centerNamesFromTeacher, ...centerNamesFromGroups])].join(', ');

  const teachersScoped = useMemo(() => {
    if (!hasCenterScope) return [];
    let list = teachers.filter((te) =>
      teacherBelongsToCenter(te.id, effectiveCenterId, te.centerLinks, groupsForAssignmentFilter),
    );
    if (watchedTeacherId && !list.some((te) => te.id === watchedTeacherId)) {
      const current = teachers.find((te) => te.id === watchedTeacherId);
      if (current) list = [current, ...list];
    }
    return list;
  }, [
    effectiveCenterId,
    hasCenterScope,
    teachers,
    groupsForAssignmentFilter,
    watchedTeacherId,
  ]);

  const { onChange: onCenterFieldChange, ...centerIdRegisterRest } = register('centerId');

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <h3 className={sectionTitle}>{tCrm('basicInfo')}</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor={p('firstName')} className="mb-1 block text-sm font-medium text-slate-700">
              {tCommon('firstName')} <span className="text-red-500">{tForm('requiredMark')}</span>
            </label>
            <input
              id={p('firstName')}
              type="text"
              {...register('firstName')}
              className={inputClass}
            />
            {errors.firstName && <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>}
          </div>
          <div>
            <label htmlFor={p('lastName')} className="mb-1 block text-sm font-medium text-slate-700">
              {tCommon('lastName')} <span className="text-red-500">{tForm('requiredMark')}</span>
            </label>
            <input
              id={p('lastName')}
              type="text"
              {...register('lastName')}
              className={inputClass}
            />
            {errors.lastName && <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>}
          </div>
        </div>
        <div>
          <label htmlFor={p('phone')} className="mb-1 block text-sm font-medium text-slate-700">
            {tForm('phoneNumber')}
          </label>
          <input
            id={p('phone')}
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            value={phoneDigits !== '' ? `+${phoneDigits}` : '+'}
            onChange={(e) =>
              setValue('phone', e.target.value.replace(/\D/g, ''), { shouldValidate: true, shouldDirty: true })
            }
            className={inputClass}
            disabled={isSubmitting}
          />
          {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>}
        </div>
      </section>

      <section className="space-y-3">
        <h3 className={sectionTitle}>{tForm('account')}</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor={p('email')} className="mb-1 block text-sm font-medium text-slate-700">
              {tCommon('email')} <span className="text-red-500">{tForm('requiredMark')}</span>
            </label>
            <input
              id={p('email')}
              type="email"
              autoComplete="email"
              {...register('email')}
              className={inputClass}
            />
            {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
          </div>
          <div>
            <label htmlFor={p('password')} className="mb-1 block text-sm font-medium text-slate-700">
              {tForm('password')} <span className="text-red-500">{tForm('requiredMark')}</span>
            </label>
            <PasswordInput
              id={p('password')}
              autoComplete="new-password"
              {...register('password')}
              className={inputClass}
              error={errors.password?.message}
            />
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className={sectionTitle}>{tCrm('additionalInfo')}</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor={p('manualAge')} className="mb-1 block text-sm font-medium text-slate-700">
              {tForm('ageYears')}
            </label>
            <input id={p('manualAge')} type="number" min={0} {...register('manualAge')} className={inputClass} disabled={isSubmitting} />
            {computedAge !== undefined && (
              <p className="mt-1 text-xs text-slate-500">{tForm('effectiveAge', { age: computedAge })}</p>
            )}
            {errors.manualAge && <p className="mt-1 text-sm text-red-600">{errors.manualAge.message}</p>}
          </div>
          <div>
            <label htmlFor={p('dateOfBirth')} className="mb-1 block text-sm font-medium text-slate-700">
              {tCrm('dateOfBirth')}
            </label>
            <input id={p('dateOfBirth')} type="date" {...register('dateOfBirth')} className={inputClass} />
            {errors.dateOfBirth && <p className="mt-1 text-sm text-red-600">{errors.dateOfBirth.message}</p>}
          </div>
          <div>
            <label htmlFor={p('firstLessonDate')} className="mb-1 block text-sm font-medium text-slate-700">
              {tCrm('firstLessonDate')}
            </label>
            <input id={p('firstLessonDate')} type="date" {...register('firstLessonDate')} className={inputClass} />
            {errors.firstLessonDate && (
              <p className="mt-1 text-sm text-red-600">{errors.firstLessonDate.message}</p>
            )}
          </div>
        </div>
      </section>

      {showParentSection && (
        <section className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
          <p className={sectionTitle}>{tCrm('parentDetailsUnder18')}</p>
          <div>
            <label htmlFor={p('parentName')} className="mb-1 block text-sm font-medium text-slate-700">
              {tCrm('parentName')} <span className="text-red-500">{tForm('requiredMark')}</span>
            </label>
            <input
              id={p('parentName')}
              type="text"
              placeholder={tCrm('parentNamePlaceholder')}
              {...register('parentName')}
              className={inputClass}
            />
            {errors.parentName && <p className="mt-1 text-sm text-red-600">{errors.parentName.message}</p>}
          </div>
          <div>
            <label htmlFor={p('parentSurname')} className="mb-1 block text-sm font-medium text-slate-700">
              {tCrm('parentSurname')}
            </label>
            <input
              id={p('parentSurname')}
              type="text"
              placeholder={tCrm('parentSurnamePlaceholder')}
              {...register('parentSurname')}
              className={inputClass}
            />
            {errors.parentSurname && <p className="mt-1 text-sm text-red-600">{errors.parentSurname.message}</p>}
          </div>
          <div>
            <label htmlFor={p('parentPhone')} className="mb-1 block text-sm font-medium text-slate-700">
              {tCrm('parentPhone')} <span className="text-red-500">{tForm('requiredMark')}</span>
            </label>
            <input
              id={p('parentPhone')}
              type="tel"
              inputMode="numeric"
              value={parentPhoneDigits !== '' ? `+${parentPhoneDigits}` : ''}
              onChange={(e) =>
                setValue('parentPhone', e.target.value.replace(/\D/g, ''), {
                  shouldValidate: true,
                  shouldDirty: true,
                })
              }
              placeholder={tCrm('parentPhonePlaceholder')}
              className={inputClass}
              disabled={isSubmitting}
            />
            {errors.parentPhone && <p className="mt-1 text-sm text-red-600">{errors.parentPhone.message}</p>}
          </div>
          <div>
            <label htmlFor={p('parentEmail')} className="mb-1 block text-sm font-medium text-slate-700">
              {tCrm('parentEmail')} <span className="text-red-500">{tForm('requiredMark')}</span>
            </label>
            <input
              id={p('parentEmail')}
              type="email"
              autoComplete="email"
              placeholder={tCrm('parentEmailPlaceholder')}
              {...register('parentEmail')}
              className={inputClass}
            />
            {errors.parentEmail && <p className="mt-1 text-sm text-red-600">{errors.parentEmail.message}</p>}
          </div>
          <div>
            <label htmlFor={p('parentPassportInfo')} className="mb-1 block text-sm font-medium text-slate-700">
              {tCrm('parentPassport')} <span className="text-red-500">{tForm('requiredMark')}</span>
            </label>
            <input
              id={p('parentPassportInfo')}
              type="text"
              placeholder={tCrm('passportPlaceholder')}
              {...register('parentPassportInfo')}
              className={inputClass}
            />
            {errors.parentPassportInfo && (
              <p className="mt-1 text-sm text-red-600">{errors.parentPassportInfo.message}</p>
            )}
          </div>
        </section>
      )}

      <section className="space-y-3">
        <h3 className={sectionTitle}>{tCrm('academicInfo')}</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor={p('levelId')} className="mb-1 block text-sm font-medium text-slate-700">
              {tCommon('level')}
            </label>
            <select id={p('levelId')} {...register('levelId')} className={inputClass} disabled={isSubmitting}>
              <option value="">—</option>
              {LEVEL_OPTIONS.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>
          {showCenterSelect ? (
            <div>
              <label htmlFor={p('centerId')} className="mb-1 block text-sm font-medium text-slate-700">
                {tCommon('center')}
              </label>
              <select
                id={p('centerId')}
                {...centerIdRegisterRest}
                className={inputClass}
                disabled={isLoadingCenters || isSubmitting}
                onChange={(e) => {
                  onCenterFieldChange(e);
                  setValue('teacherId', '', { shouldDirty: true });
                  setValue('groupId', '', { shouldDirty: true });
                }}
              >
                <option value="">—</option>
                {centers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {errors.centerId && <p className="mt-1 text-sm text-red-600">{errors.centerId.message}</p>}
            </div>
          ) : assignedCenterDisplay ? (
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">{tCommon('center')}</label>
              <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                {assignedCenterDisplay}
              </p>
            </div>
          ) : null}
          <div>
            <label htmlFor={p('teacherId')} className="mb-1 block text-sm font-medium text-slate-700">
              {tCommon('teacher')}
            </label>
            <select
              id={p('teacherId')}
              {...register('teacherId')}
              className={inputClass}
              disabled={isLoadingTeachers || isSubmitting || !hasCenterScope}
            >
              <option value="">
                {hasCenterScope ? t('selectTeacher') : tForm('selectCenterFirst')}
              </option>
              {teachersScoped.map((te) => (
                <option key={te.id} value={te.id}>
                  {te.user?.firstName} {te.user?.lastName}
                </option>
              ))}
            </select>
            {errors.teacherId && <p className="mt-1 text-sm text-red-600">{errors.teacherId.message}</p>}
            {isLoadingTeachers && <p className="mt-1 text-xs text-slate-500">{t('loadingTeachers')}</p>}
            {watchedTeacherId && teacherCentersLabel ? (
              <p className="mt-1 text-xs text-slate-500">
                {tForm('teacherCenters')}: {teacherCentersLabel}
              </p>
            ) : null}
          </div>
          <div>
            <label htmlFor={p('groupId')} className="mb-1 block text-sm font-medium text-slate-700">
              {tCommon('group')}
            </label>
            <select
              id={p('groupId')}
              {...register('groupId')}
              className={inputClass}
              disabled={isLoadingGroups || isSubmitting || !watchedTeacherId}
            >
              <option value="">
                {watchedTeacherId ? t('selectGroup') : t('selectTeacherFirst')}
              </option>
              {groupsForTeacher.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
            {errors.groupId && <p className="mt-1 text-sm text-red-600">{errors.groupId.message}</p>}
            {watchedGroupId ? (
              <p className="mt-1 text-xs text-slate-500">
                {tForm('groupLocation', {
                  name: groupsForTeacher.find((g) => g.id === watchedGroupId)?.center?.name ?? '—',
                })}
              </p>
            ) : null}
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className={sectionTitle}>{tForm('billingPreferences')}</h3>
        <div>
          <label htmlFor={p('monthlyFee')} className="mb-1 block text-sm font-medium text-slate-700">
            {t('monthlyFeeLabel')} (֏) <span className="text-red-500">{tForm('requiredMark')}</span>
          </label>
          <input
            id={p('monthlyFee')}
            type="number"
            step="0.01"
            min={0}
            {...register('monthlyFee', { valueAsNumber: true })}
            className={inputClass}
          />
          {errors.monthlyFee && <p className="mt-1 text-sm text-red-600">{errors.monthlyFee.message}</p>}
        </div>
        <div>
          <label htmlFor={p('notes')} className="mb-1 block text-sm font-medium text-slate-700">
            {tCommon('notes')}
          </label>
          <textarea
            id={p('notes')}
            rows={3}
            {...register('notes')}
            placeholder={tForm('notesPlaceholder')}
            className={inputClass}
          />
          {errors.notes && <p className="mt-1 text-sm text-red-600">{errors.notes.message}</p>}
        </div>
        <div className="flex items-center gap-2">
          <input
            id={p('receiveReports')}
            type="checkbox"
            {...register('receiveReports')}
            className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
          />
          <label htmlFor={p('receiveReports')} className="text-sm font-medium text-slate-700">
            {t('receiveReportsOn')}
          </label>
        </div>
      </section>
    </div>
  );
}
