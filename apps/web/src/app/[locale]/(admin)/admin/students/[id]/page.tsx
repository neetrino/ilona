'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';
import { Button } from '@/shared/components/ui';
import { useStudent, useStudentStatistics, useUpdateStudent, type UpdateStudentDto } from '@/features/students';
import { useGroups } from '@/features/groups';
import { useTeachers } from '@/features/teachers';
import { StudentProfileHeader } from './components/StudentProfileHeader';
import { StudentStats } from './components/StudentStats';
import { StudentDetails } from './components/StudentDetails';
import { StudentNotes } from './components/StudentNotes';
import { StudentAttendance } from './components/StudentAttendance';
import { updateStudentSchema, type UpdateStudentFormData } from './schemas';
import type { UserStatus } from '@/types';

export default function StudentProfilePage() {
  const t = useTranslations('students');
  const _tCommon = useTranslations('common');
  const params = useParams();
  const router = useRouter();
  const studentId = params.id as string;
  const locale = params.locale as string;
  const [isEditMode, setIsEditMode] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const { data: student, isLoading, error, refetch } = useStudent(studentId);
  const { data: statistics, isLoading: _isLoadingStats } = useStudentStatistics(studentId, !!student);
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
        status: student.user?.status || 'ACTIVE',
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
        <StudentProfileHeader
          student={student}
          isEditMode={isEditMode}
          firstName={firstName}
          lastName={lastName}
          initials={initials}
          errors={errors}
          register={register}
        />

        {/* Stats Grid */}
        <StudentStats
          monthlyFee={monthlyFee}
          statistics={statistics}
          isEditMode={isEditMode}
          errors={errors}
          register={register}
        />

        {/* Details Grid */}
        <StudentDetails
          student={student}
          isEditMode={isEditMode}
          groups={groups}
          teachers={teachers}
          isLoadingGroups={isLoadingGroups}
          isLoadingTeachers={isLoadingTeachers}
          errors={errors}
          register={register}
        />

        {/* Notes */}
        <StudentNotes
          student={student}
          isEditMode={isEditMode}
          errors={errors}
          register={register}
        />

        {/* Recent Activity */}
        <StudentAttendance student={student} />

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
