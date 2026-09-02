'use client';

import type { ReactNode } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import {
  Building2,
  Calendar,
  Mail,
  Phone,
  UserCircle,
  UserRound,
  Users,
} from 'lucide-react';
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

function ProfileInfoRow({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#eef2ff] text-[#1010a3]">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <label className="text-sm font-medium text-[#8b8b90]">{label}</label>
        <div className="mt-1 break-words text-sm font-semibold text-[#3b3b40]">{value}</div>
      </div>
    </div>
  );
}

const ICON_CLASS = 'h-4 w-4';

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
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <div className="rounded-xl border border-[rgba(14,14,16,0.07)] bg-white p-6">
        <h3 className="mb-4 text-lg font-semibold text-[#3b3b40]">{tc('personalInformation')}</h3>
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
              <ProfileInfoRow
                icon={<UserRound className={ICON_CLASS} aria-hidden="true" />}
                label={tc('firstName')}
                value={firstName || na}
              />
              <ProfileInfoRow
                icon={<UserRound className={ICON_CLASS} aria-hidden="true" />}
                label={tc('lastName')}
                value={lastName || na}
              />
              <ProfileInfoRow
                icon={<Mail className={ICON_CLASS} aria-hidden="true" />}
                label={tc('email')}
                value={student.user?.email || na}
              />
              <ProfileInfoRow
                icon={<Phone className={ICON_CLASS} aria-hidden="true" />}
                label={tc('phone')}
                value={formatPhoneForDisplay(student.user?.phone, na)}
              />
              <ProfileInfoRow
                icon={<Calendar className={ICON_CLASS} aria-hidden="true" />}
                label={t('memberSince')}
                value={
                  student.user?.createdAt
                    ? formatDate(student.user.createdAt, locale)
                    : na
                }
              />
            </>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-[rgba(14,14,16,0.07)] bg-white p-6">
        <h3 className="mb-4 text-lg font-semibold text-[#3b3b40]">{t('groupParentSection')}</h3>
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
              <ProfileInfoRow
                icon={<Users className={ICON_CLASS} aria-hidden="true" />}
                label={t('group')}
                value={
                  student.group ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="info">{student.group.name}</Badge>
                      {student.group.level ? (
                        <span className="text-sm font-medium text-[#8b8b90]">{student.group.level}</span>
                      ) : null}
                    </div>
                  ) : (
                    <span className="font-medium text-[#8b8b90]">{tc('notAssigned')}</span>
                  )
                }
              />
              {student.group?.center ? (
                <ProfileInfoRow
                  icon={<Building2 className={ICON_CLASS} aria-hidden="true" />}
                  label={tc('center')}
                  value={student.group.center.name}
                />
              ) : null}
              {assignedTeacher ? (
                <ProfileInfoRow
                  icon={<UserRound className={ICON_CLASS} aria-hidden="true" />}
                  label={t('teacher')}
                  value={`${assignedTeacher.user.firstName} ${assignedTeacher.user.lastName}`}
                />
              ) : null}
              {secondTeacher && secondTeacher.id !== assignedTeacher?.id ? (
                <ProfileInfoRow
                  icon={<UserRound className={ICON_CLASS} aria-hidden="true" />}
                  label={t('teacher2')}
                  value={`${secondTeacher.user.firstName} ${secondTeacher.user.lastName}`}
                />
              ) : null}
              {student.parentName ? (
                <ProfileInfoRow
                  icon={<UserCircle className={ICON_CLASS} aria-hidden="true" />}
                  label={t('parentName')}
                  value={student.parentName}
                />
              ) : null}
              {student.parentPhone ? (
                <ProfileInfoRow
                  icon={<Phone className={ICON_CLASS} aria-hidden="true" />}
                  label={t('parentPhone')}
                  value={formatPhoneForDisplay(student.parentPhone)}
                />
              ) : null}
              {student.parentEmail ? (
                <ProfileInfoRow
                  icon={<Mail className={ICON_CLASS} aria-hidden="true" />}
                  label={t('parentEmail')}
                  value={student.parentEmail}
                />
              ) : null}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
