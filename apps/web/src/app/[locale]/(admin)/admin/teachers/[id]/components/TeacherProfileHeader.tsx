'use client';

import { Avatar, Badge, Input, Label } from '@/shared/components/ui';
import { SingleSelectDropdown } from '@/shared/components/ui/single-select-dropdown';
import type { Teacher } from '@/features/teachers';
import { formatPhoneForDisplay } from '@/shared/lib/utils';
import type { UseFormRegister, UseFormSetValue } from 'react-hook-form';
import type { UpdateTeacherFormData } from '../schemas';
import type { UserStatus } from '@/types';
import { useTranslations } from 'next-intl';

interface TeacherProfileHeaderProps {
  teacher: Teacher;
  isEditMode: boolean;
  firstName: string;
  lastName: string;
  initials: string;
  errors?: {
    firstName?: { message?: string };
    lastName?: { message?: string };
    status?: { message?: string };
  };
  register: UseFormRegister<UpdateTeacherFormData>;
  setValue: UseFormSetValue<UpdateTeacherFormData>;
  statusValue: UserStatus;
}

export function TeacherProfileHeader({
  teacher,
  isEditMode,
  firstName,
  lastName,
  initials: _initials,
  errors,
  register,
  setValue,
  statusValue,
}: TeacherProfileHeaderProps) {
  const tCommon = useTranslations('common');
  const tStatus = useTranslations('status');
  const tTeachers = useTranslations('teachers');
  const fullName = `${firstName} ${lastName}`.trim() || tTeachers('teacherProfile');
  const avatarUrl = teacher.user?.avatarUrl;

  return (
    <div className="bg-white rounded-xl border border-[rgba(14,14,16,0.07)] p-6">
      <div className="flex items-start gap-6">
        <Avatar
          src={avatarUrl}
          name={fullName}
          size="xl"
          className="w-20 h-20"
          alt={fullName}
        />
        <div className="flex-1">
          {isEditMode ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">
                    {tCommon('firstName')} <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="firstName"
                    {...register('firstName')}
                    error={errors?.firstName?.message}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">
                    {tCommon('lastName')} <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="lastName"
                    {...register('lastName')}
                    error={errors?.lastName?.message}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">{tCommon('status')} <span className="text-red-500">*</span></Label>
                <SingleSelectDropdown
                  id="status"
                  options={[
                    { id: 'ACTIVE', label: tStatus('active') },
                    { id: 'INACTIVE', label: tStatus('inactive') },
                    { id: 'SUSPENDED', label: tStatus('suspended') },
                  ]}
                  value={statusValue}
                  onValueChange={(nextValue) =>
                    setValue('status', (nextValue as UserStatus | null) ?? 'ACTIVE', { shouldDirty: true })
                  }
                />
                {errors?.status && (
                  <p className="text-sm text-red-600">{errors.status.message}</p>
                )}
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold text-[#3b3b40]">
                  {firstName} {lastName}
                </h2>
                <Badge variant={teacher.user?.status === 'ACTIVE' ? 'success' : 'warning'}>
                  {teacher.user?.status || 'UNKNOWN'}
                </Badge>
              </div>
              <p className="text-[#8b8b90] mb-4">{teacher.user?.email || ''}</p>
              <div className="flex flex-wrap gap-4 text-sm">
                {teacher.user?.phone && (
                  <div className="flex items-center gap-2 text-[#3b3b40]">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    {formatPhoneForDisplay(teacher.user.phone)}
                  </div>
                )}
                {teacher.user?.lastLoginAt && (
                  <div className="flex items-center gap-2 text-[#3b3b40]">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Last login: {new Date(teacher.user.lastLoginAt).toLocaleDateString()}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

