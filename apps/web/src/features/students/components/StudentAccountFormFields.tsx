'use client';

import type { FieldErrors, UseFormRegister, UseFormSetValue, UseFormWatch } from 'react-hook-form';
import { Input, Label } from '@/shared/components/ui';
import type { CreateStudentFormData } from '../student-account-form.schema';

export type StudentAccountTeacherOption = {
  id: string;
  user: { firstName?: string | null; lastName?: string | null; phone?: string | null };
};

export type StudentAccountGroupOption = {
  id: string;
  name: string;
  level?: string | null;
  teacherId?: string | null;
};

export interface StudentAccountFormFieldsProps {
  register: UseFormRegister<CreateStudentFormData>;
  errors: FieldErrors<CreateStudentFormData>;
  watch: UseFormWatch<CreateStudentFormData>;
  setValue: UseFormSetValue<CreateStudentFormData>;
  computedAge: number | undefined;
  showParentSection: boolean;
  groupsForTeacher: StudentAccountGroupOption[];
  teachers: StudentAccountTeacherOption[];
  isLoadingGroups: boolean;
  isLoadingTeachers: boolean;
  isSubmitting: boolean;
  /** Prefix for input ids when multiple forms exist on one page */
  idPrefix?: string;
}

const selectClassName =
  'flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';

export function StudentAccountFormFields({
  register,
  errors,
  watch,
  setValue,
  computedAge,
  showParentSection,
  groupsForTeacher,
  teachers,
  isLoadingGroups,
  isLoadingTeachers,
  isSubmitting,
  idPrefix = '',
}: StudentAccountFormFieldsProps) {
  const p = (id: string) => (idPrefix ? `${idPrefix}-${id}` : id);
  const watchedTeacherId = watch('teacherId') || '';

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor={p('firstName')}>
            First Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id={p('firstName')}
            {...register('firstName')}
            error={errors.firstName?.message}
            placeholder="John"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={p('lastName')}>
            Last Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id={p('lastName')}
            {...register('lastName')}
            error={errors.lastName?.message}
            placeholder="Doe"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor={p('email')}>
          Email <span className="text-red-500">*</span>
        </Label>
        <Input
          id={p('email')}
          type="email"
          {...register('email')}
          error={errors.email?.message}
          placeholder="john.doe@example.com"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={p('password')}>
          Password <span className="text-red-500">*</span>
        </Label>
        <Input
          id={p('password')}
          type="password"
          {...register('password')}
          error={errors.password?.message}
          placeholder="••••••••"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={p('phone')}>Phone</Label>
        <Input
          id={p('phone')}
          type="tel"
          {...register('phone')}
          error={errors.phone?.message}
          placeholder="+1 (555) 123-4567"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor={p('dateOfBirth')}>
            Date of Birth <span className="text-red-500">*</span>
          </Label>
          <Input
            id={p('dateOfBirth')}
            type="date"
            {...register('dateOfBirth')}
            error={errors.dateOfBirth?.message}
          />
          {computedAge !== undefined && <p className="text-xs text-slate-500">Age: {computedAge}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor={p('firstLessonDate')}>First Lesson Date</Label>
          <Input
            id={p('firstLessonDate')}
            type="date"
            {...register('firstLessonDate')}
            error={errors.firstLessonDate?.message}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor={p('teacherId')}>Teacher</Label>
          <select
            id={p('teacherId')}
            {...register('teacherId', {
              onChange: () => setValue('groupId', ''),
            })}
            className={selectClassName}
            disabled={isLoadingTeachers || isSubmitting}
          >
            <option value="">Select a teacher</option>
            {teachers.map((teacher) => (
              <option key={teacher.id} value={teacher.id}>
                {teacher.user?.firstName ?? ''} {teacher.user?.lastName ?? ''}
                {teacher.user?.phone ? ` - ${teacher.user.phone}` : ''}
              </option>
            ))}
          </select>
          {errors.teacherId && <p className="text-sm text-red-600">{errors.teacherId.message}</p>}
          {isLoadingTeachers && <p className="text-sm text-slate-500">Loading teachers...</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor={p('groupId')}>Group</Label>
          <select
            id={p('groupId')}
            {...register('groupId')}
            className={selectClassName}
            disabled={isLoadingGroups || !watchedTeacherId}
          >
            <option value="">{watchedTeacherId ? 'No group assigned' : 'Select Teacher first'}</option>
            {groupsForTeacher.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name} {group.level ? `(${group.level})` : ''}
              </option>
            ))}
          </select>
          {errors.groupId && <p className="text-sm text-red-600">{errors.groupId.message}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor={p('monthlyFee')}>
          Monthly Fee (֏) <span className="text-red-500">*</span>
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
            Parent/Guardian Information
            <span className="text-red-500 ml-1">*</span>
          </h3>
          <p className="text-xs text-slate-500 mb-4">Required for students under 18 years of age</p>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor={p('parentName')}>
                Parent/Guardian Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id={p('parentName')}
                {...register('parentName')}
                error={errors.parentName?.message}
                placeholder="Jane Doe"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={p('parentPhone')}>
                Parent/Guardian Phone <span className="text-red-500">*</span>
              </Label>
              <Input
                id={p('parentPhone')}
                type="tel"
                {...register('parentPhone')}
                error={errors.parentPhone?.message}
                placeholder="+1 (555) 123-4567"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={p('parentEmail')}>
                Parent/Guardian Email <span className="text-red-500">*</span>
              </Label>
              <Input
                id={p('parentEmail')}
                type="email"
                {...register('parentEmail')}
                error={errors.parentEmail?.message}
                placeholder="parent@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={p('parentPassportInfo')}>
                Parent Passport Information <span className="text-red-500">*</span>
              </Label>
              <Input
                id={p('parentPassportInfo')}
                {...register('parentPassportInfo')}
                error={errors.parentPassportInfo?.message}
                placeholder="Passport number / ID"
              />
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor={p('notes')}>Notes</Label>
        <textarea
          id={p('notes')}
          {...register('notes')}
          rows={4}
          className={selectClassName}
          placeholder="Additional notes about the student..."
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
          Receive progress reports via email
        </Label>
      </div>
    </div>
  );
}
