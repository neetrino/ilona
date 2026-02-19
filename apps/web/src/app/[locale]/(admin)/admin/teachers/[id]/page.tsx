'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';
import { Button } from '@/shared/components/ui';
import { useTeacher, useUpdateTeacher, type UpdateTeacherDto } from '@/features/teachers';
import { type WeeklySchedule as WeeklyScheduleType, type DayOfWeek } from '@/features/teachers/components/WeeklySchedule';
import { TeacherProfileHeader } from './components/TeacherProfileHeader';
import { TeacherStats } from './components/TeacherStats';
import { TeacherDetails } from './components/TeacherDetails';
import { updateTeacherSchema, type UpdateTeacherFormData } from './schemas';
import type { UserStatus } from '@/types';

export default function TeacherProfilePage() {
  const t = useTranslations('teachers');
  const _tCommon = useTranslations('common');
  const params = useParams();
  const router = useRouter();
  const teacherId = params.id as string;
  const locale = params.locale as string;
  const [isEditMode, setIsEditMode] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const { data: teacher, isLoading, error, refetch } = useTeacher(teacherId);
  const updateTeacher = useUpdateTeacher();

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
    watch,
    setValue,
  } = useForm<UpdateTeacherFormData>({
    resolver: zodResolver(updateTeacherSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      phone: '',
      status: 'ACTIVE' as UserStatus,
      hourlyRate: 0,
      workingDays: [],
      workingHours: undefined,
    },
  });

  // Reset form when teacher data loads or when exiting edit mode
  useEffect(() => {
    if (teacher && !isEditMode) {
      const hourlyRate = typeof teacher.hourlyRate === 'string' 
        ? parseFloat(teacher.hourlyRate) 
        : Number(teacher.hourlyRate || 0);
      
      // Convert old format to new format if needed
      let workingHoursValue: WeeklyScheduleType | undefined = undefined;
      if (teacher.workingHours) {
        // Check if it's the new format (has day keys)
        if ('MON' in teacher.workingHours || 'TUE' in teacher.workingHours) {
          workingHoursValue = teacher.workingHours as WeeklyScheduleType;
        } else if ('start' in teacher.workingHours && 'end' in teacher.workingHours) {
          // Old format: convert to new format using workingDays
          const oldHours = teacher.workingHours as { start: string; end: string };
          workingHoursValue = {};
          (teacher.workingDays || []).forEach((day) => {
            workingHoursValue![day as DayOfWeek] = [
              { start: oldHours.start, end: oldHours.end },
            ];
          });
        }
      }
      
      reset({
        firstName: teacher.user?.firstName || '',
        lastName: teacher.user?.lastName || '',
        phone: teacher.user?.phone || '',
        status: teacher.user?.status || 'ACTIVE',
        hourlyRate,
        workingDays: teacher.workingDays || [],
        workingHours: workingHoursValue,
      });
      setHasUnsavedChanges(false);
      setErrorMessage(null);
      setSuccessMessage(null);
    }
  }, [teacher, isEditMode, reset]);

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

  // Refetch data when page becomes visible (to catch updates from other tabs/windows)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && !isEditMode) {
        // Only refetch if not in edit mode to avoid overwriting user's changes
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

  const onSubmit = async (data: UpdateTeacherFormData) => {
    setErrorMessage(null);
    setSuccessMessage(null);
    
    try {
      // Extract working days from workingHours
      const workingDays = data.workingHours ? Object.keys(data.workingHours) : [];
      
      const payload: UpdateTeacherDto = {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone || undefined,
        status: data.status,
        hourlyRate: data.hourlyRate,
        workingDays: workingDays.length > 0 ? workingDays : undefined,
        workingHours: data.workingHours && Object.keys(data.workingHours).length > 0 ? data.workingHours : undefined,
      };

      await updateTeacher.mutateAsync({ id: teacherId, data: payload });
      
      // Show success message
      setSuccessMessage('Teacher updated successfully!');
      setErrorMessage(null);
      
      // Exit edit mode after a brief delay
      setTimeout(() => {
        setIsEditMode(false);
        setSuccessMessage(null);
      }, 1500);
    } catch (error: unknown) {
      // Handle error with more specific messages
      let message = 'Failed to update teacher. Please try again.';
      
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
        // Refetch will happen automatically via query invalidation
        // But we can also manually trigger it
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
        title={t('teacherProfile')} 
        subtitle={t('loadingTeacherInfo')}
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  // Error state
  if (error || !teacher) {
    return (
      <DashboardLayout 
        title={t('teacherProfile')} 
        subtitle={t('errorLoadingTeacherInfo')}
      >
        <div className="bg-white rounded-xl border border-red-200 p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-50 rounded-xl">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-slate-800 mb-2">Teacher Not Found</h3>
              <p className="text-sm text-slate-500 mb-4">
                {error 
                  ? 'Failed to load teacher information. Please try again later.'
                  : 'The teacher you are looking for does not exist or has been removed.'}
              </p>
              <Button 
                variant="outline" 
                onClick={() => router.push(`/${locale}/admin/teachers`)}
              >
                Back to Teachers
              </Button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const firstName = teacher.user?.firstName || '';
  const lastName = teacher.user?.lastName || '';
  const initials = `${firstName[0] || ''}${lastName[0] || ''}` || '?';
  const hourlyRate = typeof teacher.hourlyRate === 'string' 
    ? parseFloat(teacher.hourlyRate) 
    : Number(teacher.hourlyRate || 0);

  return (
    <DashboardLayout 
      title={t('teacherProfile')} 
      subtitle={`Viewing profile for ${firstName} ${lastName}`}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Back Button & Edit Mode Toggle */}
        <div className="flex items-center justify-between mb-4">
          <Button 
            variant="ghost" 
            type="button"
            onClick={() => handleNavigation(`/${locale}/admin/teachers`)}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Teachers
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
        <TeacherProfileHeader
          teacher={teacher}
          isEditMode={isEditMode}
          firstName={firstName}
          lastName={lastName}
          initials={initials}
          errors={errors}
          register={register}
          onEditClick={() => setIsEditMode(true)}
        />

        {/* Stats Grid */}
        <TeacherStats
          teacher={teacher}
          hourlyRate={hourlyRate}
          isEditMode={isEditMode}
          errors={errors}
          register={register}
        />

        {/* Details Grid */}
        <TeacherDetails
          teacher={teacher}
          isEditMode={isEditMode}
          firstName={firstName}
          lastName={lastName}
          errors={errors}
          register={register}
          watch={watch}
          setValue={setValue}
        />


        {/* Edit Mode Actions */}
        {isEditMode && (
          <div className="flex items-center justify-end gap-4 pt-4 border-t border-slate-200">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={updateTeacher.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
              disabled={updateTeacher.isPending || !isDirty}
              isLoading={updateTeacher.isPending}
            >
              Save Changes
            </Button>
          </div>
        )}
      </form>
    </DashboardLayout>
  );
}

