'use client';

import { useEffect, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';
import { Badge, Button } from '@/shared/components/ui';
import { useStudent } from '@/features/students';
import { ApiError } from '@/shared/lib/api';
import Image from 'next/image';

export default function TeacherStudentProfilePage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const studentId = params.id as string;
  const locale = params.locale as string;

  const { data: student, isLoading, error, refetch } = useStudent(studentId);

  const isForbidden = error instanceof ApiError && error.statusCode === 403;
  const isNotFound = error instanceof ApiError && error.statusCode === 404;

  // Build back URL preserving search/filter state
  const getBackUrl = () => {
    const groupId = searchParams.get('groupId');
    const search = searchParams.get('search');
    const params = new URLSearchParams();
    if (groupId) params.set('groupId', groupId);
    if (search) params.set('search', search);
    const query = params.toString();
    return query ? `/${locale}/teacher/students?${query}` : `/${locale}/teacher/students`;
  };

  // Refetch data when page becomes visible
  // Use useCallback to stabilize the handler reference
  const handleVisibilityChange = useCallback(() => {
    if (!document.hidden) {
      refetch();
    }
  }, [refetch]);

  useEffect(() => {
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [handleVisibilityChange]);

  // Loading state
  if (isLoading) {
    return (
      <DashboardLayout 
        title="Student Profile" 
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
        title="Student Profile" 
        subtitle="Error loading student information"
      >
        <div className={`bg-white rounded-xl border p-6 ${
          isForbidden ? 'border-amber-200' : 'border-red-200'
        }`}>
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl ${
              isForbidden ? 'bg-amber-50' : 'bg-red-50'
            }`}>
              {isForbidden ? (
                <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              ) : (
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-slate-800 mb-2">
                {isForbidden ? 'Access Denied' : isNotFound ? 'Student Not Found' : 'Error Loading Student'}
              </h3>
              <p className="text-sm text-slate-500 mb-4">
                {isForbidden
                  ? 'You do not have permission to view this student. You can only view profiles of students assigned to you.'
                  : isNotFound
                  ? 'The student you are looking for does not exist or has been removed.'
                  : error instanceof ApiError
                  ? error.message || 'Failed to load student information. Please try again later.'
                  : 'Failed to load student information. Please try again later.'}
              </p>
              <Button 
                variant="outline" 
                onClick={() => router.push(getBackUrl())}
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
  const avatarUrl = student.user?.avatarUrl;

  return (
    <DashboardLayout 
      title="Student Profile" 
      subtitle={`Viewing profile for ${firstName} ${lastName}`}
    >
      <div className="space-y-6">
        {/* Back Button */}
        <div className="flex items-center justify-between mb-4">
          <Button 
            variant="ghost" 
            type="button"
            onClick={() => router.push(getBackUrl())}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Students
          </Button>
        </div>

        {/* Profile Header */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-start gap-6">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={`${firstName} ${lastName}`}
                width={80}
                height={80}
                className="w-20 h-20 rounded-full object-cover"
                unoptimized
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center text-white text-2xl font-bold">
                {initials}
              </div>
            )}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold text-slate-800">
                  {firstName} {lastName}
                </h2>
                <Badge variant={student.user?.status === 'ACTIVE' ? 'success' : 'warning'}>
                  {student.user?.status || 'UNKNOWN'}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-4 text-sm">
                {student.user?.lastLoginAt && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Last login: {new Date(student.user.lastLoginAt).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Learning info (sensitive personal data hidden for teachers) */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <h3 className="mb-4 text-lg font-semibold text-slate-800">Basic Info</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-500">First Name</label>
                <p className="mt-1 text-slate-800">{firstName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-500">Last Name</label>
                <p className="mt-1 text-slate-800">{lastName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-500">Member Since</label>
                <p className="mt-1 text-slate-800">
                  {student.user?.createdAt
                    ? new Date(student.user.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                    : 'N/A'}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <h3 className="mb-4 text-lg font-semibold text-slate-800">Learning</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-500">Group</label>
                <div className="mt-1 text-slate-800">
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
                  <p className="mt-1 text-slate-800">{student.group.center.name}</p>
                </div>
              )}
              {student.teacher && (
                <div>
                  <label className="text-sm font-medium text-slate-500">Teacher</label>
                  <p className="mt-1 text-slate-800">
                    {student.teacher.user.firstName} {student.teacher.user.lastName}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Notes */}
        {student.notes && (
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Notes</h3>
            <p className="text-slate-700 whitespace-pre-wrap">{student.notes}</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}








