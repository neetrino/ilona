'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';
import { Badge, Button, Input, Label } from '@/shared/components/ui';
import { useStudent, useStudentStatistics, useUpdateStudent, type UpdateStudentDto, type Student } from '@/features/students';
import { useGroups } from '@/features/groups';
import { useTeachers } from '@/features/teachers';
import { formatCurrency } from '@/shared/lib/utils';
import type { UserStatus } from '@/types';
import { getErrorMessage } from '@/shared/lib/api';

// Extended Student type with attendances (from API response)
interface StudentWithAttendances extends Student {
  attendances?: Array<{
    id: string;
    isPresent: boolean;
    absenceType?: 'JUSTIFIED' | 'UNJUSTIFIED' | null;
    lesson?: {
      id: string;
      topic?: string;
      scheduledAt: string;
    };
  }>;
}

const updateStudentSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters').max(50, 'First name must be at most 50 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters').max(50, 'Last name must be at most 50 characters'),
  phone: z.string().max(50, 'Phone must be at most 50 characters').optional().or(z.literal('')),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']),
  groupId: z.string().optional().or(z.literal('')),
  teacherId: z.string().optional().or(z.literal('')),
  parentName: z.string().max(100, 'Parent name must be at most 100 characters').optional().or(z.literal('')),
  parentPhone: z.string().max(50, 'Parent phone must be at most 50 characters').optional().or(z.literal('')),
  parentEmail: z.string().email('Invalid email address').optional().or(z.literal('')),
  monthlyFee: z.number().min(0, 'Monthly fee must be positive'),
  notes: z.string().max(500, 'Notes must be at most 500 characters').optional().or(z.literal('')),
  receiveReports: z.boolean().optional(),
});

type UpdateStudentFormData = z.infer<typeof updateStudentSchema>;

export default function StudentProfilePage() {
  const t = useTranslations('students');
  const tCommon = useTranslations('common');
  const params = useParams();
  const router = useRouter();
  const studentId = params.id as string;
  const locale = params.locale as string;
  const [isEditMode, setIsEditMode] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const { data: student, isLoading, error, refetch } = useStudent(studentId);
  const { data: statistics, isLoading: isLoadingStats } = useStudentStatistics(studentId, !!student);
  const { data: groupsData, isLoading: isLoadingGroups } = useGroups({ take: 100, isActive: true });
  const { data: teachersData, isLoading: isLoadingTeachers } = useTeachers({ status: 'ACTIVE', take: 100 });
  const updateStudent = useUpdateStudent();

  const groups = groupsData?.items || [];
  const teachers = teachersData?.items || [];

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
    watch,
  } = useForm<UpdateStudentFormData>({
    resolver: zodResolver(updateStudentSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      phone: '',
      status: 'ACTIVE' as UserStatus,
      groupId: '',
      teacherId: '',
      parentName: '',
      parentPhone: '',
      parentEmail: '',
      monthlyFee: 0,
      notes: '',
      receiveReports: false,
    },
  });

  // Reset form when student data loads or when exiting edit mode
  useEffect(() => {
    if (student && !isEditMode) {
      const monthlyFee = typeof student.monthlyFee === 'string' 
        ? parseFloat(student.monthlyFee) 
        : Number(student.monthlyFee || 0);
      
      reset({
        firstName: student.user?.firstName || '',
        lastName: student.user?.lastName || '',
        phone: student.user?.phone || '',
        status: (student.user?.status || 'ACTIVE') as UserStatus,
        groupId: student.groupId || '',
        teacherId: student.teacherId || '',
        parentName: student.parentName || '',
        parentPhone: student.parentPhone || '',
        parentEmail: student.parentEmail || '',
        monthlyFee,
        notes: student.notes || '',
        receiveReports: student.receiveReports ?? false,
      });
      setHasUnsavedChanges(false);
      setErrorMessage(null);
      setSuccessMessage(null);
    }
  }, [student, isEditMode, reset]);

  // Track unsaved changes
  useEffect(() => {
    if (isEditMode) {
      setHasUnsavedChanges(isDirty);
    }
  }, [isDirty, isEditMode]);

  // Warn before leaving page with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges && isEditMode) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedChanges, isEditMode]);

  // Refetch data when page becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && !isEditMode) {
        refetch();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isEditMode, refetch]);

  // Handle navigation with unsaved changes warning
  const handleNavigation = useCallback((path: string) => {
    if (hasUnsavedChanges && isEditMode) {
      if (!window.confirm('You have unsaved changes. Are you sure you want to leave? Your changes will be lost.')) {
        return;
      }
    }
    router.push(path);
  }, [hasUnsavedChanges, isEditMode, router]);

  const onSubmit = async (data: UpdateStudentFormData) => {
    setErrorMessage(null);
    setSuccessMessage(null);
    
    try {
      const payload: UpdateStudentDto = {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone || undefined,
        status: data.status,
        groupId: data.groupId || undefined,
        teacherId: data.teacherId || undefined,
        parentName: data.parentName || undefined,
        parentPhone: data.parentPhone || undefined,
        parentEmail: data.parentEmail || undefined,
        monthlyFee: data.monthlyFee,
        notes: data.notes || undefined,
        receiveReports: data.receiveReports,
      };

      await updateStudent.mutateAsync({ id: studentId, data: payload });
      
      // Show success message
      setSuccessMessage('Student updated successfully!');
      setErrorMessage(null);
      
      // Exit edit mode after a brief delay
      setTimeout(() => {
        setIsEditMode(false);
        setSuccessMessage(null);
      }, 1500);
    } catch (error: unknown) {
      // Handle error with more specific messages
      let message = 'Failed to update student. Please try again.';
      
      if (error instanceof Error) {
        message = error.message;
      } else if (error && typeof error === 'object' && 'response' in error) {
        const response = (error as { response?: { data?: { message?: string }; status?: number } }).response;
        if (response?.data?.message) {
          message = response.data.message;
        } else if (response?.status === 409) {
          message = 'This record was modified by another user. Please refresh and try again.';
        } else if (response?.status === 400) {
          message = 'Invalid data. Please check your input and try again.';
        }
      }
      
      setErrorMessage(message);
      setSuccessMessage(null);
      
      // If there's a conflict, refetch the latest data
      if (error && typeof error === 'object' && 'response' in error &&
          (error as { response?: { status?: number } }).response?.status === 409) {
        setTimeout(() => {
          setIsEditMode(false);
        }, 2000);
      }
    }
  };

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      if (!window.confirm('You have unsaved changes. Are you sure you want to cancel? Your changes will be lost.')) {
        return;
      }
    }
    setIsEditMode(false);
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  // Loading state
  if (isLoading) {
    return (
      <DashboardLayout 
        title={t('studentProfile') || 'Student Profile'} 
        subtitle="Loading student information..."
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  // Error state
  if (error || !student) {
    return (
      <DashboardLayout 
        title={t('studentProfile') || 'Student Profile'} 
        subtitle="Error loading student information"
      >
        <div className="bg-white rounded-xl border border-red-200 p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-50 rounded-xl">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-slate-800 mb-2">Student Not Found</h3>
              <p className="text-sm text-slate-500 mb-4">
                {error 
                  ? 'Failed to load student information. Please try again later.'
                  : 'The student you are looking for does not exist or has been removed.'}
              </p>
              <Button 
                variant="outline" 
                onClick={() => router.push(`/${locale}/admin/students`)}
              >
                Back to Students
              </Button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const firstName = student.user?.firstName || '';
  const lastName = student.user?.lastName || '';
  const initials = `${firstName[0] || ''}${lastName[0] || ''}` || '?';
  const monthlyFee = typeof student.monthlyFee === 'string' 
    ? parseFloat(student.monthlyFee) 
    : Number(student.monthlyFee || 0);

  return (
    <DashboardLayout 
      title={t('studentProfile') || 'Student Profile'} 
      subtitle={`Viewing profile for ${firstName} ${lastName}`}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Back Button & Edit Mode Toggle */}
        <div className="flex items-center justify-between mb-4">
          <Button 
            variant="ghost" 
            type="button"
            onClick={() => handleNavigation(`/${locale}/admin/students`)}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Students
          </Button>
          {!isEditMode && (
            <Button 
              type="button"
              onClick={() => setIsEditMode(true)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit Profile
            </Button>
          )}
        </div>

        {/* Success/Error Messages */}
        {successMessage && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
            <p className="text-sm text-green-600">{successMessage}</p>
          </div>
        )}
        {errorMessage && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-sm text-red-600">{errorMessage}</p>
          </div>
        )}

        {/* Profile Header */}
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
                        error={errors.firstName?.message}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">
                        Last Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="lastName"
                        {...register('lastName')}
                        error={errors.lastName?.message}
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
                    {errors.status && (
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

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-500">Monthly Fee</span>
              <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            {isEditMode ? (
              <div className="space-y-2">
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  {...register('monthlyFee', { valueAsNumber: true })}
                  error={errors.monthlyFee?.message}
                  className="text-2xl font-bold"
                />
              </div>
            ) : (
              <p className="text-3xl font-bold text-slate-800">{formatCurrency(monthlyFee)}</p>
            )}
          </div>
          {statistics && (
            <>
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-500">Attendance Rate</span>
                  <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-3xl font-bold text-slate-800">
                  {statistics.attendance.rate.toFixed(1)}%
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {statistics.attendance.present} / {statistics.attendance.total} lessons
                </p>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-500">Pending Payments</span>
                  <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-3xl font-bold text-slate-800">{statistics.payments.pending}</p>
                {statistics.payments.overdue > 0 && (
                  <p className="text-xs text-red-600 mt-1">
                    {statistics.payments.overdue} overdue
                  </p>
                )}
              </div>
            </>
          )}
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Personal Information */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Personal Information</h3>
            <div className="space-y-4">
              {isEditMode ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      {...register('phone')}
                      error={errors.phone?.message}
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                </>
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
                      {errors.groupId && (
                        <p className="text-sm text-red-600">{errors.groupId.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="teacherId">Teacher</Label>
                      <select
                        id="teacherId"
                        {...register('teacherId')}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        disabled={isLoadingTeachers || updateStudent.isPending}
                      >
                        <option value="">Select a teacher</option>
                        {teachers.map((teacher) => (
                          <option key={teacher.id} value={teacher.id}>
                            {teacher.user.firstName} {teacher.user.lastName}
                            {teacher.user.phone ? ` - ${teacher.user.phone}` : ''}
                          </option>
                        ))}
                      </select>
                      {errors.teacherId && (
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
                      error={errors.parentName?.message}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="parentPhone">Parent Phone</Label>
                    <Input
                      id="parentPhone"
                      type="tel"
                      {...register('parentPhone')}
                      error={errors.parentPhone?.message}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="parentEmail">Parent Email</Label>
                    <Input
                      id="parentEmail"
                      type="email"
                      {...register('parentEmail')}
                      error={errors.parentEmail?.message}
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

        {/* Notes */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Notes</h3>
          {isEditMode ? (
            <div className="space-y-2">
              <textarea
                {...register('notes')}
                rows={4}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                placeholder="Add notes about this student..."
              />
              {errors.notes && (
                <p className="text-sm text-red-600">{errors.notes.message}</p>
              )}
            </div>
          ) : (
            <p className="text-slate-700 whitespace-pre-wrap">{student.notes || 'No notes'}</p>
          )}
        </div>

        {/* Recent Activity */}
        {(student as StudentWithAttendances).attendances && (student as StudentWithAttendances).attendances!.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Recent Attendance</h3>
            <div className="space-y-3">
              {(student as StudentWithAttendances).attendances!.slice(0, 5).map((attendance) => (
                <div key={attendance.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <p className="font-medium text-slate-800">
                      {attendance.lesson?.topic || 'Lesson'}
                    </p>
                    <p className="text-sm text-slate-500">
                      {attendance.lesson?.scheduledAt 
                        ? new Date(attendance.lesson.scheduledAt).toLocaleDateString()
                        : 'N/A'}
                    </p>
                  </div>
                  <Badge variant={attendance.status === 'PRESENT' ? 'success' : 'warning'}>
                    {attendance.status}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Edit Mode Actions */}
        {isEditMode && (
          <div className="flex items-center justify-end gap-4 pt-4 border-t border-slate-200">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={updateStudent.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
              disabled={updateStudent.isPending || !isDirty}
              isLoading={updateStudent.isPending}
            >
              Save Changes
            </Button>
          </div>
        )}
      </form>
    </DashboardLayout>
  );
}
