'use client';

import { Badge, Input, Label } from '@/shared/components/ui';
import type { Student } from '@/features/students';
import type { Group } from '@/features/groups';
import type { Teacher } from '@/features/teachers';

interface StudentDetailsProps {
  student: Student;
  isEditMode: boolean;
  groups: Group[];
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
  register: any;
}

export function StudentDetails({
  student,
  isEditMode,
  groups,
  teachers,
  isLoadingGroups,
  isLoadingTeachers,
  errors,
  register,
}: StudentDetailsProps) {
  const firstName = student.user?.firstName || '';
  const lastName = student.user?.lastName || '';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Personal Information */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Personal Information</h3>
        <div className="space-y-4">
          {isEditMode ? (
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                {...register('phone')}
                error={errors?.phone?.message}
                placeholder="+1 (555) 123-4567"
              />
            </div>
          ) : (
            <>
              <div>
                <label className="text-sm font-medium text-slate-500">First Name</label>
                <p className="text-slate-800 mt-1">{firstName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-500">Last Name</label>
                <p className="text-slate-800 mt-1">{lastName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-500">Email</label>
                <p className="text-slate-800 mt-1">{student.user?.email || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-500">Phone</label>
                <p className="text-slate-800 mt-1">{student.user?.phone || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-500">Member Since</label>
                <p className="text-slate-800 mt-1">
                  {student.user?.createdAt 
                    ? new Date(student.user.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })
                    : 'N/A'}
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Group & Parent Information */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Group & Parent Information</h3>
        <div className="space-y-4">
          {isEditMode ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="groupId">Group</Label>
                  <select
                    id="groupId"
                    {...register('groupId')}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    disabled={isLoadingGroups}
                  >
                    <option value="">Not assigned</option>
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

                <div className="space-y-2">
                  <Label htmlFor="teacherId">Teacher</Label>
                  <select
                    id="teacherId"
                    {...register('teacherId')}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    disabled={isLoadingTeachers}
                  >
                    <option value="">Select a teacher</option>
                    {teachers.map((teacher) => (
                      <option key={teacher.id} value={teacher.id}>
                        {teacher.user.firstName} {teacher.user.lastName}
                        {teacher.user.phone ? ` - ${teacher.user.phone}` : ''}
                      </option>
                    ))}
                  </select>
                  {errors?.teacherId && (
                    <p className="text-sm text-red-600">{errors.teacherId.message}</p>
                  )}
                  {isLoadingTeachers && (
                    <p className="text-sm text-slate-500">Loading teachers...</p>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="parentName">Parent Name</Label>
                <Input
                  id="parentName"
                  {...register('parentName')}
                  error={errors?.parentName?.message}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="parentPhone">Parent Phone</Label>
                <Input
                  id="parentPhone"
                  type="tel"
                  {...register('parentPhone')}
                  error={errors?.parentPhone?.message}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="parentEmail">Parent Email</Label>
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
                    className="w-4 h-4 rounded border-slate-300"
                  />
                  Receive Reports
                </Label>
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="text-sm font-medium text-slate-500">Group</label>
                <div className="text-slate-800 mt-1">
                  {student.group ? (
                    <div className="flex items-center gap-2">
                      <Badge variant="info">{student.group.name}</Badge>
                      {student.group.level && (
                        <span className="text-sm text-slate-500">{student.group.level}</span>
                      )}
                    </div>
                  ) : (
                    <span className="text-slate-400">Not assigned</span>
                  )}
                </div>
              </div>
              {student.group?.center && (
                <div>
                  <label className="text-sm font-medium text-slate-500">Center</label>
                  <p className="text-slate-800 mt-1">{student.group.center.name}</p>
                </div>
              )}
              {student.teacher && (
                <div>
                  <label className="text-sm font-medium text-slate-500">Teacher</label>
                  <p className="text-slate-800 mt-1">
                    {student.teacher.user.firstName} {student.teacher.user.lastName}
                  </p>
                </div>
              )}
              {student.parentName && (
                <div>
                  <label className="text-sm font-medium text-slate-500">Parent Name</label>
                  <p className="text-slate-800 mt-1">{student.parentName}</p>
                </div>
              )}
              {student.parentPhone && (
                <div>
                  <label className="text-sm font-medium text-slate-500">Parent Phone</label>
                  <p className="text-slate-800 mt-1">{student.parentPhone}</p>
                </div>
              )}
              {student.parentEmail && (
                <div>
                  <label className="text-sm font-medium text-slate-500">Parent Email</label>
                  <p className="text-slate-800 mt-1">{student.parentEmail}</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

