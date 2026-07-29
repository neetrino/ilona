'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Badge, Input, Label } from '@/shared/components/ui';
import { SingleSelectDropdown } from '@/shared/components/ui/single-select-dropdown';
import { formatDate, formatPhoneForDisplay } from '@/shared/lib/utils';
import type { Student } from '@/features/students';
import type { GroupAssignmentOption } from '@/features/students/lib/group-center-assignment';
import type { UseFormRegister, UseFormSetValue } from 'react-hook-form';
import type { UpdateStudentFormData } from '../schemas';

interface StudentDetailsProps {
  student: Student;
  isEditMode: boolean;
  groups: GroupAssignmentOption[];
  groupSelectDisabled?: boolean;
  isLoadingGroups: boolean;
  errors?: {
    phone?: { message?: string };
    groupId?: { message?: string };
    parentName?: { message?: string };
    parentPhone?: { message?: string };
    parentEmail?: { message?: string };
  };
  register: UseFormRegister<UpdateStudentFormData>;
  setValue?: UseFormSetValue<UpdateStudentFormData>;
  groupIdValue?: string;
}

export function StudentDetails({
  student,
  isEditMode,
  groups,
  groupSelectDisabled = false,
  isLoadingGroups,
  errors,
  register,
  setValue,
  groupIdValue = '',
}: StudentDetailsProps) {
  const t = useTranslations('students');
  const tc = useTranslations('common');
  const locale = useLocale();
  const firstName = student.user?.firstName || '';
  const lastName = student.user?.lastName || '';
  const na = t('notAvailable');
  const assignedTeacher = student.teacher ?? student.group?.teacher;
  const secondTeacher = student.group?.secondTeacher;

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
                    ? formatDate(student.user.createdAt, locale)
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
              <input type="hidden" {...register('teacherId')} />
              <div className="space-y-2">
                <Label htmlFor="groupId">{t('group')}</Label>
                <SingleSelectDropdown
                  id="groupId"
                  options={[
                    {
                      id: '',
                      label: groupSelectDisabled
                        ? t('form.selectCenterFirst')
                        : groups.length === 0
                          ? t('form.noGroupsForCenter')
                          : tc('notAssigned'),
                    },
                    ...groups.map((group) => ({
                      id: group.id,
                      label: `${group.name} ${group.level ? `(${group.level})` : ''}`.trim(),
                    })),
                  ]}
                  value={groupIdValue}
                  onValueChange={(nextValue) =>
                    setValue?.('groupId', nextValue ?? '', { shouldDirty: true })
                  }
                  disabled={isLoadingGroups || groupSelectDisabled}
                />
                {errors?.groupId && (
                  <p className="text-sm text-red-600">{errors.groupId.message}</p>
                )}
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
                    className="h-4 w-4 rounded border-[rgba(14,14,16,0.12)] accent-[#1010a3]"
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
              {assignedTeacher && (
                <div>
                  <label className="text-sm font-medium text-[#8b8b90]">{t('teacher')}</label>
                  <p className="text-[#3b3b40] mt-1">
                    {assignedTeacher.user.firstName} {assignedTeacher.user.lastName}
                  </p>
                </div>
              )}
              {secondTeacher && secondTeacher.id !== assignedTeacher?.id && (
                <div>
                  <label className="text-sm font-medium text-[#8b8b90]">{t('teacher2')}</label>
                  <p className="text-[#3b3b40] mt-1">
                    {secondTeacher.user.firstName} {secondTeacher.user.lastName}
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
