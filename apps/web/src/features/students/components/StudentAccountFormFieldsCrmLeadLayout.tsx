'use client';

import type { FieldErrors, UseFormRegister, UseFormSetValue, UseFormWatch } from 'react-hook-form';
import type { CreateStudentFormData } from '../student-account-form.schema';
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
  idPrefix = '',
}: StudentAccountFormFieldsCrmLeadLayoutProps) {
  const p = (id: string) => (idPrefix ? `${idPrefix}-${id}` : id);
  const watchedTeacherId = watch('teacherId') || '';
  const watchedGroupId = watch('groupId') || '';
  const phoneDigits = (watch('phone') ?? '').replace(/\D/g, '');
  const parentPhoneDigits = (watch('parentPhone') ?? '').replace(/\D/g, '');
  const selectedTeacher = teachers.find((t) => t.id === watchedTeacherId);
  const centerNamesFromTeacher = [
    ...new Set((selectedTeacher?.centerLinks ?? []).map((l) => l.center.name).filter(Boolean)),
  ];
  const centerNamesFromGroups = [
    ...new Set(groupsForTeacher.map((g) => g.center?.name).filter(Boolean) as string[]),
  ];
  const teacherCentersLabel = [...new Set([...centerNamesFromTeacher, ...centerNamesFromGroups])].join(', ');

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <h3 className={sectionTitle}>Basic Info</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor={p('firstName')} className="mb-1 block text-sm font-medium text-slate-700">
              First name <span className="text-red-500">*</span>
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
              Last name <span className="text-red-500">*</span>
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
            Phone number
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
        <h3 className={sectionTitle}>Account</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor={p('email')} className="mb-1 block text-sm font-medium text-slate-700">
              Email <span className="text-red-500">*</span>
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
              Password <span className="text-red-500">*</span>
            </label>
            <input
              id={p('password')}
              type="password"
              autoComplete="new-password"
              {...register('password')}
              className={inputClass}
            />
            {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>}
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className={sectionTitle}>Additional Info</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor={p('manualAge')} className="mb-1 block text-sm font-medium text-slate-700">
              Age
            </label>
            <input id={p('manualAge')} type="number" min={0} {...register('manualAge')} className={inputClass} disabled={isSubmitting} />
            {computedAge !== undefined && (
              <p className="mt-1 text-xs text-slate-500">Effective age: {computedAge}</p>
            )}
            {errors.manualAge && <p className="mt-1 text-sm text-red-600">{errors.manualAge.message}</p>}
          </div>
          <div>
            <label htmlFor={p('dateOfBirth')} className="mb-1 block text-sm font-medium text-slate-700">
              Date of birth (mm/dd/yyyy)
            </label>
            <input id={p('dateOfBirth')} type="date" {...register('dateOfBirth')} className={inputClass} />
            {errors.dateOfBirth && <p className="mt-1 text-sm text-red-600">{errors.dateOfBirth.message}</p>}
          </div>
          <div>
            <label htmlFor={p('firstLessonDate')} className="mb-1 block text-sm font-medium text-slate-700">
              First lesson date (mm/dd/yyyy)
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
          <p className={sectionTitle}>Parent details (under 18)</p>
          <div>
            <label htmlFor={p('parentName')} className="mb-1 block text-sm font-medium text-slate-700">
              Parent name <span className="text-red-500">*</span>
            </label>
            <input
              id={p('parentName')}
              type="text"
              placeholder="John"
              {...register('parentName')}
              className={inputClass}
            />
            {errors.parentName && <p className="mt-1 text-sm text-red-600">{errors.parentName.message}</p>}
          </div>
          <div>
            <label htmlFor={p('parentSurname')} className="mb-1 block text-sm font-medium text-slate-700">
              Parent surname
            </label>
            <input
              id={p('parentSurname')}
              type="text"
              placeholder="Smith"
              {...register('parentSurname')}
              className={inputClass}
            />
            {errors.parentSurname && <p className="mt-1 text-sm text-red-600">{errors.parentSurname.message}</p>}
          </div>
          <div>
            <label htmlFor={p('parentPhone')} className="mb-1 block text-sm font-medium text-slate-700">
              Parent phone <span className="text-red-500">*</span>
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
              placeholder="+374XXXXXXXX"
              className={inputClass}
              disabled={isSubmitting}
            />
            {errors.parentPhone && <p className="mt-1 text-sm text-red-600">{errors.parentPhone.message}</p>}
          </div>
          <div>
            <label htmlFor={p('parentEmail')} className="mb-1 block text-sm font-medium text-slate-700">
              Parent email <span className="text-red-500">*</span>
            </label>
            <input
              id={p('parentEmail')}
              type="email"
              autoComplete="email"
              placeholder="parent@example.com"
              {...register('parentEmail')}
              className={inputClass}
            />
            {errors.parentEmail && <p className="mt-1 text-sm text-red-600">{errors.parentEmail.message}</p>}
          </div>
          <div>
            <label htmlFor={p('parentPassportInfo')} className="mb-1 block text-sm font-medium text-slate-700">
              Parent passport details <span className="text-red-500">*</span>
            </label>
            <input
              id={p('parentPassportInfo')}
              type="text"
              placeholder="XX0000000"
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
        <h3 className={sectionTitle}>Academic Info</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor={p('levelId')} className="mb-1 block text-sm font-medium text-slate-700">
              Level
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
          <div>
            <label htmlFor={p('teacherId')} className="mb-1 block text-sm font-medium text-slate-700">
              Teacher
            </label>
            <select
              id={p('teacherId')}
              {...register('teacherId')}
              className={inputClass}
              disabled={isLoadingTeachers || isSubmitting}
            >
              <option value="">—</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.user?.firstName} {t.user?.lastName}
                </option>
              ))}
            </select>
            {errors.teacherId && <p className="mt-1 text-sm text-red-600">{errors.teacherId.message}</p>}
            {isLoadingTeachers && <p className="mt-1 text-xs text-slate-500">Loading teachers…</p>}
            {watchedTeacherId && teacherCentersLabel ? (
              <p className="mt-1 text-xs text-slate-500">Centers: {teacherCentersLabel}</p>
            ) : null}
          </div>
          <div>
            <label htmlFor={p('groupId')} className="mb-1 block text-sm font-medium text-slate-700">
              Group
            </label>
            <select
              id={p('groupId')}
              {...register('groupId')}
              className={inputClass}
              disabled={isLoadingGroups || !watchedTeacherId}
            >
              <option value="">{watchedTeacherId ? '—' : 'Select Teacher first'}</option>
              {groupsForTeacher.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
            {errors.groupId && <p className="mt-1 text-sm text-red-600">{errors.groupId.message}</p>}
            {watchedGroupId ? (
              <p className="mt-1 text-xs text-slate-500">
                Group location: {groupsForTeacher.find((g) => g.id === watchedGroupId)?.center?.name ?? '—'}
              </p>
            ) : null}
          </div>
          {showCenterSelect ? (
            <div>
              <label htmlFor={p('centerId')} className="mb-1 block text-sm font-medium text-slate-700">
                Center
              </label>
              <select
                id={p('centerId')}
                {...register('centerId')}
                className={inputClass}
                disabled={isLoadingCenters || isSubmitting}
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
              <label className="mb-1 block text-sm font-medium text-slate-700">Center</label>
              <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                {assignedCenterDisplay}
              </p>
            </div>
          ) : null}
        </div>
      </section>

      <section className="space-y-3">
        <h3 className={sectionTitle}>Billing & preferences</h3>
        <div>
          <label htmlFor={p('monthlyFee')} className="mb-1 block text-sm font-medium text-slate-700">
            Monthly fee (֏) <span className="text-red-500">*</span>
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
            Notes
          </label>
          <textarea
            id={p('notes')}
            rows={3}
            {...register('notes')}
            placeholder="Additional notes about the student…"
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
            Receive progress reports via email
          </label>
        </div>
      </section>
    </div>
  );
}
