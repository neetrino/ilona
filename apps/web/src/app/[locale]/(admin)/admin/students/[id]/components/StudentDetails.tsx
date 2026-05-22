'use client';

import { useTranslations } from 'next-intl';
import { Badge, Input, Label } from '@/shared/components/ui';
import { formatPhoneForDisplay } from '@/shared/lib/utils';
import type { Student } from '@/features/students';
import type { Group } from '@/features/groups';
import type { Teacher } from '@/features/teachers';
import type { UseFormRegister, UseFormSetValue } from 'react-hook-form';
import type { UpdateStudentFormData } from '../schemas';

interface StudentDetailsProps {
  student: Student;
  isEditMode: boolean;
  groups: Group[];
  groupSelectDisabled?: boolean;
  teachers: Teacher[];
  isLoadingGroups: boolean;
  isLoadingTeachers: boolean;
  errors?: {
    phone?: { message?: string };
    groupId?: { message?: string };
    teacherId?: { message?: string };
    parentName?: { message?: string };
    parentPhone?: { message?: string };
    parentEmail?: { message?: string };
  };
  register: UseFormRegister<UpdateStudentFormData>;
  setValue?: UseFormSetValue<UpdateStudentFormData>;
}

export function StudentDetails({
  student,
  isEditMode,
  groups,
  groupSelectDisabled = false,
  teachers,
  isLoadingGroups,
  isLoadingTeachers,
  errors,
  register,
  setValue,
}: StudentDetailsProps) {
  const t = useTranslations('students');
  const tc = useTranslations('common');
  const firstName = student.user?.firstName || '';
  const lastName = student.user?.lastName || '';
  const na = t('notAvailable');

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-white rounded-xl border border-[rgba(14,14,16,0.07)] p-6">
        <h3 className="text-lg font-semibold text-[#3b3b40] mb-4">{tc('personalInformation')}</h3>
        <div className="space-y-4">
          {isEditMode ? (
            <div className="space-y-2">
              <Label htmlFor="phone">{tc('phone')}</Label>
              <Input
                id="phone"
                type="tel"
                {...register('phone')}
                error={errors?.phone?.message}
                placeholder={t('phonePlaceholder')}
              />
            </div>
          ) : (
            <>
              <div>
                <label className="text-sm font-medium text-[#8b8b90]">{tc('firstName')}</label>
                <p className="text-[#3b3b40] mt-1">{firstName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-[#8b8b90]">{tc('lastName')}</label>
                <p className="text-[#3b3b40] mt-1">{lastName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-[#8b8b90]">{tc('email')}</label>
                <p className="text-[#3b3b40] mt-1">{student.user?.email || na}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-[#8b8b90]">{tc('phone')}</label>
                <p className="text-[#3b3b40] mt-1">{formatPhoneForDisplay(student.user?.phone, na)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-[#8b8b90]">{t('memberSince')}</label>
                <p className="text-[#3b3b40] mt-1">
                  {student.user?.createdAt
                    ? new Date(student.user.createdAt).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                    : na}
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[rgba(14,14,16,0.07)] p-6">
        <h3 className="text-lg font-semibold text-[#3b3b40] mb-4">{t('groupParentSection')}</h3>
        <div className="space-y-4">
          {isEditMode ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="teacherId">{t('teacher')}</Label>
                  <select
                    id="teacherId"
                    {...register('teacherId', {
                      onChange: () => setValue?.('groupId', ''),
                    })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={isLoadingTeachers}
                  >
                    <option value="">{t('selectTeacher')}</option>
                    {teachers.map((teacher) => (
                      <option key={teacher.id} value={teacher.id}>
                        {teacher.user.firstName} {teacher.user.lastName}
                        {teacher.user.phone ? ` - ${formatPhoneForDisplay(teacher.user.phone)}` : ''}
                      </option>
                    ))}
                  </select>
                  {errors?.teacherId && (
                    <p className="text-sm text-red-600">{errors.teacherId.message}</p>
                  )}
                  {isLoadingTeachers && (
                    <p className="text-sm text-[#8b8b90]">{t('loadingTeachers')}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="groupId">{t('group')}</Label>
                  <select
                    id="groupId"
                    {...register('groupId')}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={isLoadingGroups || groupSelectDisabled}
                  >
                    <option value="">
                      {groupSelectDisabled ? t('selectTeacherFirst') : tc('notAssigned')}
                    </option>
                    {groups.map((group) => (
                      <option key={group.id} value={group.id}>
                        {group.name} {group.level ? `(${group.level})` : ''}
                      </option>
                    ))}
                  </select>
                  {errors?.groupId && (
                    <p className="text-sm text-red-600">{errors.groupId.message}</p>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="parentName">{t('parentName')}</Label>
                <Input
                  id="parentName"
                  {...register('parentName')}
                  error={errors?.parentName?.message}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="parentPhone">{t('parentPhone')}</Label>
                <Input
                  id="parentPhone"
                  type="tel"
                  {...register('parentPhone')}
                  error={errors?.parentPhone?.message}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="parentEmail">{t('parentEmail')}</Label>
                <Input
                  id="parentEmail"
                  type="email"
                  {...register('parentEmail')}
                  error={errors?.parentEmail?.message}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="receiveReports" className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="receiveReports"
                    {...register('receiveReports')}
                    className="w-4 h-4 rounded border-[rgba(14,14,16,0.12)]"
                  />
                  {t('receiveReportsLabel')}
                </Label>
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="text-sm font-medium text-[#8b8b90]">{t('group')}</label>
                <div className="text-[#3b3b40] mt-1">
                  {student.group ? (
                    <div className="flex items-center gap-2">
                      <Badge variant="info">{student.group.name}</Badge>
                      {student.group.level && (
                        <span className="text-sm text-[#8b8b90]">{student.group.level}</span>
                      )}
                    </div>
                  ) : (
                    <span className="text-[#8b8b90]">{tc('notAssigned')}</span>
                  )}
                </div>
              </div>
              {student.group?.center && (
                <div>
                  <label className="text-sm font-medium text-[#8b8b90]">{tc('center')}</label>
                  <p className="text-[#3b3b40] mt-1">{student.group.center.name}</p>
                </div>
              )}
              {student.teacher && (
                <div>
                  <label className="text-sm font-medium text-[#8b8b90]">{t('teacher')}</label>
                  <p className="text-[#3b3b40] mt-1">
                    {student.teacher.user.firstName} {student.teacher.user.lastName}
                  </p>
                </div>
              )}
              {student.parentName && (
                <div>
                  <label className="text-sm font-medium text-[#8b8b90]">{t('parentName')}</label>
                  <p className="text-[#3b3b40] mt-1">{student.parentName}</p>
                </div>
              )}
              {student.parentPhone && (
                <div>
                  <label className="text-sm font-medium text-[#8b8b90]">{t('parentPhone')}</label>
                  <p className="text-[#3b3b40] mt-1">{formatPhoneForDisplay(student.parentPhone)}</p>
                </div>
              )}
              {student.parentEmail && (
                <div>
                  <label className="text-sm font-medium text-[#8b8b90]">{t('parentEmail')}</label>
                  <p className="text-[#3b3b40] mt-1">{student.parentEmail}</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
