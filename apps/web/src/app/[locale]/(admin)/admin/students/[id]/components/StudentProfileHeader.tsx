'use client';

import { Badge, Button, Input, Label } from '@/shared/components/ui';
import type { Student } from '@/features/students';
import type { UserStatus } from '@/types';

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
  register: any;
  onEditClick: () => void;
}

export function StudentProfileHeader({
  student,
  isEditMode,
  firstName,
  lastName,
  initials,
  errors,
  register,
  onEditClick,
}: StudentProfileHeaderProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <div className="flex items-start gap-6">
        <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center text-white text-2xl font-bold">
          {initials}
        </div>
        <div className="flex-1">
          {isEditMode ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">
                    First Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="firstName"
                    {...register('firstName')}
                    error={errors?.firstName?.message}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">
                    Last Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="lastName"
                    {...register('lastName')}
                    error={errors?.lastName?.message}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status <span className="text-red-500">*</span></Label>
                <select
                  id="status"
                  {...register('status')}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                  <option value="SUSPENDED">Suspended</option>
                </select>
                {errors?.status && (
                  <p className="text-sm text-red-600">{errors.status.message}</p>
                )}
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold text-slate-800">
                  {firstName} {lastName}
                </h2>
                <Badge variant={student.user?.status === 'ACTIVE' ? 'success' : 'warning'}>
                  {student.user?.status || 'UNKNOWN'}
                </Badge>
              </div>
              <p className="text-slate-500 mb-4">{student.user?.email || ''}</p>
              <div className="flex flex-wrap gap-4 text-sm">
                {student.user?.phone && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    {student.user.phone}
                  </div>
                )}
                {student.user?.lastLoginAt && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Last login: {new Date(student.user.lastLoginAt).toLocaleDateString()}
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

