'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';
import { Badge, Button, Input, Label } from '@/shared/components/ui';
import { useTeacher, useUpdateTeacher, type UpdateTeacherDto } from '@/features/teachers';
import type { UserStatus } from '@/types';

const updateTeacherSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters').max(50, 'First name must be at most 50 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters').max(50, 'Last name must be at most 50 characters'),
  phone: z.string().max(50, 'Phone must be at most 50 characters').optional().or(z.literal('')),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']),
  bio: z.string().max(1000, 'Bio must be at most 1000 characters').optional().or(z.literal('')),
  specialization: z.string().max(200, 'Specialization must be at most 200 characters').optional().or(z.literal('')),
  hourlyRate: z.number().min(0, 'Hourly rate must be positive'),
  workingDays: z.array(z.string()).optional(),
  workingHours: z.object({
    start: z.string(),
    end: z.string(),
  }).optional(),
});

type UpdateTeacherFormData = z.infer<typeof updateTeacherSchema>;

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function TeacherProfilePage() {
  const t = useTranslations('teachers');
  const tCommon = useTranslations('common');
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
      bio: '',
      specialization: '',
      hourlyRate: 0,
      workingDays: [],
      workingHours: {
        start: '09:00',
        end: '18:00',
      },
    },
  });

  // Reset form when teacher data loads or when exiting edit mode
  useEffect(() => {
    if (teacher && !isEditMode) {
      const hourlyRate = typeof teacher.hourlyRate === 'string' 
        ? parseFloat(teacher.hourlyRate) 
        : Number(teacher.hourlyRate || 0);
      
      reset({
        firstName: teacher.user?.firstName || '',
        lastName: teacher.user?.lastName || '',
        phone: teacher.user?.phone || '',
        status: (teacher.user?.status || 'ACTIVE') as UserStatus,
        bio: teacher.bio || '',
        specialization: teacher.specialization || '',
        hourlyRate,
        workingDays: teacher.workingDays || [],
        workingHours: teacher.workingHours || { start: '09:00', end: '18:00' },
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
      const payload: UpdateTeacherDto = {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone || undefined,
        status: data.status,
        bio: data.bio || undefined,
        specialization: data.specialization || undefined,
        hourlyRate: data.hourlyRate,
        workingDays: data.workingDays && data.workingDays.length > 0 ? data.workingDays : undefined,
        workingHours: data.workingHours,
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
    } catch (error: any) {
      // Handle error with more specific messages
      let message = 'Failed to update teacher. Please try again.';
      
      if (error?.response?.data?.message) {
        message = error.response.data.message;
      } else if (error?.message) {
        message = error.message;
      } else if (error?.response?.status === 409) {
        message = 'This record was modified by another user. Please refresh and try again.';
      } else if (error?.response?.status === 400) {
        message = 'Invalid data. Please check your input and try again.';
      }
      
      setErrorMessage(message);
      setSuccessMessage(null);
      
      // If there's a conflict, refetch the latest data
      if (error?.response?.status === 409) {
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
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
              className="bg-blue-600 hover:bg-blue-700 text-white"
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
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-2xl font-bold">
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
                    <Badge variant={teacher.user?.status === 'ACTIVE' ? 'success' : 'warning'}>
                      {teacher.user?.status || 'UNKNOWN'}
                    </Badge>
                  </div>
                  <p className="text-slate-500 mb-4">{teacher.user?.email || ''}</p>
                  <div className="flex flex-wrap gap-4 text-sm">
                    {teacher.user?.phone && (
                      <div className="flex items-center gap-2 text-slate-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        {teacher.user.phone}
                      </div>
                    )}
                    {teacher.user?.lastLoginAt && (
                      <div className="flex items-center gap-2 text-slate-600">
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

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-500">Total Groups</span>
              <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <p className="text-3xl font-bold text-slate-800">{teacher._count?.groups || 0}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-500">Total Lessons</span>
              <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <p className="text-3xl font-bold text-slate-800">{teacher._count?.lessons || 0}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-500">Hourly Rate</span>
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
                  {...register('hourlyRate', { valueAsNumber: true })}
                  error={errors.hourlyRate?.message}
                  className="text-2xl font-bold"
                />
              </div>
            ) : (
              <p className="text-3xl font-bold text-slate-800">
                {new Intl.NumberFormat('hy-AM', {
                  style: 'currency',
                  currency: 'AMD',
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                }).format(hourlyRate)}/hr
              </p>
            )}
          </div>
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
                    <p className="text-slate-800 mt-1">{teacher.user?.email || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-500">Phone</label>
                    <p className="text-slate-800 mt-1">{teacher.user?.phone || 'N/A'}</p>
                  </div>
                </>
              )}
              <div>
                <label className="text-sm font-medium text-slate-500">Member Since</label>
                <p className="text-slate-800 mt-1">
                  {teacher.user?.createdAt 
                    ? new Date(teacher.user.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })
                    : 'N/A'}
                </p>
              </div>
            </div>
          </div>

          {/* Professional Information */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Professional Information</h3>
            <div className="space-y-4">
              {isEditMode ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="specialization">Specialization</Label>
                    <Input
                      id="specialization"
                      {...register('specialization')}
                      error={errors.specialization?.message}
                      placeholder={t('specializationPlaceholder')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <textarea
                      id="bio"
                      {...register('bio')}
                      rows={4}
                      className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder={t('bioPlaceholder')}
                    />
                    {errors.bio && (
                      <p className="text-sm text-red-600">{errors.bio.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Working Days</Label>
                    <div className="flex flex-wrap gap-2">
                      {DAYS_OF_WEEK.map((day) => {
                        const watchedDays = watch('workingDays') || [];
                        const isSelected = watchedDays.includes(day);
                        return (
                          <button
                            key={day}
                            type="button"
                            onClick={() => {
                              const currentDays = watch('workingDays') || [];
                              const newDays = isSelected
                                ? currentDays.filter((d) => d !== day)
                                : [...currentDays, day];
                              setValue('workingDays', newDays, { shouldDirty: true });
                            }}
                            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                              isSelected
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            {day}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="workingHoursStart">Working Hours Start</Label>
                      <Input
                        id="workingHoursStart"
                        type="time"
                        {...register('workingHours.start')}
                        error={errors.workingHours?.start?.message}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="workingHoursEnd">Working Hours End</Label>
                      <Input
                        id="workingHoursEnd"
                        type="time"
                        {...register('workingHours.end')}
                        error={errors.workingHours?.end?.message}
                      />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {teacher.specialization && (
                    <div>
                      <label className="text-sm font-medium text-slate-500">Specialization</label>
                      <p className="text-slate-800 mt-1">{teacher.specialization}</p>
                    </div>
                  )}
                  {teacher.bio && (
                    <div>
                      <label className="text-sm font-medium text-slate-500">Bio</label>
                      <p className="text-slate-800 mt-1">{teacher.bio}</p>
                    </div>
                  )}
                  {teacher.workingDays && teacher.workingDays.length > 0 && (
                    <div>
                      <label className="text-sm font-medium text-slate-500">Working Days</label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {teacher.workingDays.map((day, idx) => (
                          <Badge key={idx} variant="info">{day}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {teacher.workingHours && (
                    <div>
                      <label className="text-sm font-medium text-slate-500">Working Hours</label>
                      <p className="text-slate-800 mt-1">
                        {teacher.workingHours.start} - {teacher.workingHours.end}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Assigned Groups */}
        {teacher.groups && teacher.groups.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Assigned Groups</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {teacher.groups.map((group) => (
                <div key={group.id} className="border border-slate-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-slate-800">{group.name}</h4>
                    {group.level && (
                      <Badge variant="default">{group.level}</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No Groups Message */}
        {(!teacher.groups || teacher.groups.length === 0) && (
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Assigned Groups</h3>
            <p className="text-slate-500">No groups assigned to this teacher.</p>
          </div>
        )}

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
              className="bg-blue-600 hover:bg-blue-700 text-white"
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

