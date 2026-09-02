'use client';

import { Badge, Input, Label, Avatar } from '@/shared/components/ui';
import { SingleSelectDropdown } from '@/shared/components/ui/single-select-dropdown';
import type { Student } from '@/features/students';
import { formatDate, formatPhoneForDisplay } from '@/shared/lib/utils';
import type { UseFormRegister, UseFormSetValue } from 'react-hook-form';
import type { UpdateStudentFormData } from '../schemas';
import type { UserStatus } from '@/types';
import { useLocale, useTranslations } from 'next-intl';

interface StudentProfileHeaderProps {
  student: Student;
  isEditMode: boolean;
  firstName: string;
  lastName: string;
  initials: string;
  errors?: {
    firstName?: { message?: string };
    lastName?: { message?: string };
    status?: { message?: string };
  };
  register: UseFormRegister<UpdateStudentFormData>;
  setValue: UseFormSetValue<UpdateStudentFormData>;
  statusValue: UserStatus;
}

export function StudentProfileHeader({
  student,
  isEditMode,
  firstName,
  lastName,
  initials: _initials,
  errors,
  register,
  setValue,
  statusValue,
}: StudentProfileHeaderProps) {
  const tCommon = useTranslations('common');
  const tStatus = useTranslations('status');
  const locale = useLocale();
  const avatarUrl = student.user?.avatarUrl;

  return (
    <div className="rounded-xl border border-[rgba(14,14,16,0.07)] bg-white p-4 sm:p-6">
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:gap-6">
        <Avatar
          src={avatarUrl}
          name={`${firstName} ${lastName}`.trim() || tCommon('studentFallback')}
          size="xl"
          className={avatarUrl ? 'shrink-0' : 'shrink-0 bg-[#1010a3] text-white'}
        />
        <div className="min-w-0 w-full flex-1">
          {isEditMode ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
              <div className="mb-2 flex flex-wrap items-center gap-2 sm:gap-3">
                <h2 className="break-words text-xl font-bold text-[#3b3b40] sm:text-2xl">
                  {firstName} {lastName}
                </h2>
                <Badge variant={student.user?.status === 'ACTIVE' ? 'success' : 'warning'}>
                  {student.user?.status || 'UNKNOWN'}
                </Badge>
              </div>
              {student.user?.email ? (
                <p className="mb-4 break-all text-[#8b8b90]">{student.user.email}</p>
              ) : null}
              <div className="flex flex-col gap-2 text-sm sm:flex-row sm:flex-wrap sm:gap-4">
                {student.user?.phone && (
                  <div className="flex min-w-0 items-center gap-2 text-[#3b3b40]">
                    <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span className="break-all">{formatPhoneForDisplay(student.user.phone)}</span>
                  </div>
                )}
                {student.user?.lastLoginAt && (
                  <div className="flex min-w-0 items-center gap-2 text-[#3b3b40]">
                    <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="break-words">Last login: {formatDate(student.user.lastLoginAt, locale)}</span>
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

