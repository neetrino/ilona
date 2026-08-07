'use client';

import { useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useAppSearchUrl } from '@/shared/hooks/useAppSearchUrl';
import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';
import { Badge, ChatBackButton } from '@/shared/components/ui';
import { useStudent } from '@/features/students';
import { ApiError } from '@/shared/lib/api';
import Image from 'next/image';
import { LoadingSpinner } from '@/shared/components/ui/loading-spinner';

function formatUserStatus(
  status: string | undefined,
  tStatus: ReturnType<typeof useTranslations<'status'>>
): string {
  if (status === 'ACTIVE') return tStatus('active');
  if (status === 'INACTIVE') return tStatus('inactive');
  if (status === 'SUSPENDED') return tStatus('suspended');
  return status ?? 'UNKNOWN';
}

export default function TeacherStudentProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { readParam } = useAppSearchUrl();
  const locale = useLocale();
  const t = useTranslations('students.teacherView');
  const tCommon = useTranslations('common');
  const tStudents = useTranslations('students');
  const tStatus = useTranslations('status');
  const studentId = params.id as string;
  const routeLocale = params.locale as string;

  const { data: student, isLoading, error, refetch } = useStudent(studentId);

  const isForbidden = error instanceof ApiError && error.statusCode === 403;
  const isNotFound = error instanceof ApiError && error.statusCode === 404;

  // Build back URL preserving search/filter state
  const getBackUrl = () => {
    const groupId = readParam('groupId');
    const search = readParam('search');
    const urlParams = new URLSearchParams();
    if (groupId) urlParams.set('groupId', groupId);
    if (search) urlParams.set('search', search);
    const query = urlParams.toString();
    return query ? `/${routeLocale}/teacher/students?${query}` : `/${routeLocale}/teacher/students`;
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
        title={t('profileTitle')} 
        subtitle={t('loadingSubtitle')}
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  // Error state
  if (error || !student) {
    return (
      <DashboardLayout 
        title={t('profileTitle')} 
        subtitle={t('errorSubtitle')}
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
              <h3 className="font-semibold text-[#1010a3] mb-2">
                {isForbidden ? t('accessDenied') : isNotFound ? t('studentNotFound') : t('errorLoadingStudent')}
              </h3>
              <p className="text-sm text-[#8b8b90] mb-4">
                {isForbidden
                  ? t('forbiddenMessage')
                  : isNotFound
                  ? t('notFoundMessage')
                  : error instanceof ApiError
                  ? error.message || t('failedToLoadMessage')
                  : t('failedToLoadMessage')}
              </p>
              <ChatBackButton
                onClick={() => router.push(getBackUrl())}
                aria-label={t('backToStudents')}
              />
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
  const fullName = `${firstName} ${lastName}`.trim();

  return (
    <DashboardLayout 
      title={t('profileTitle')} 
      subtitle={t('viewingProfileFor', { name: fullName })}
    >
      <div className="space-y-6">
        {/* Back Button */}
        <div className="flex items-center justify-between mb-4">
          <ChatBackButton
            onClick={() => router.push(getBackUrl())}
            aria-label={t('backToStudents')}
          />
        </div>

        {/* Profile Header */}
        <div className="bg-white rounded-xl border border-[rgba(14,14,16,0.07)] p-6">
          <div className="flex items-start gap-6">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={fullName}
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
                <h2 className="text-2xl font-bold text-[#1010a3]">
                  {firstName} {lastName}
                </h2>
                <Badge variant={student.user?.status === 'ACTIVE' ? 'success' : 'warning'}>
                  {formatUserStatus(student.user?.status, tStatus)}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-4 text-sm">
                {student.user?.lastLoginAt && (
                  <div className="flex items-center gap-2 text-[#8b8b90]">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {t('lastLogin', {
                      date: new Date(student.user.lastLoginAt).toLocaleDateString(locale),
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Learning info (sensitive personal data hidden for teachers) */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-[rgba(14,14,16,0.07)] bg-white p-6">
            <h3 className="mb-4 text-lg font-semibold text-[#1010a3]">{t('basicInfo')}</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-[#8b8b90]">{tCommon('firstName')}</label>
                <p className="mt-1 text-[#1010a3]">{firstName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-[#8b8b90]">{tCommon('lastName')}</label>
                <p className="mt-1 text-[#1010a3]">{lastName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-[#8b8b90]">{tStudents('memberSince')}</label>
                <p className="mt-1 text-[#1010a3]">
                  {student.user?.createdAt
                    ? new Date(student.user.createdAt).toLocaleDateString(locale, {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                    : tStudents('notAvailable')}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-[rgba(14,14,16,0.07)] bg-white p-6">
            <h3 className="mb-4 text-lg font-semibold text-[#1010a3]">{t('learning')}</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-[#8b8b90]">{tCommon('group')}</label>
                <div className="mt-1 text-[#1010a3]">
                  {student.group ? (
                    <div className="flex items-center gap-2">
                      <Badge variant="info">{student.group.name}</Badge>
                      {student.group.level && (
                        <span className="text-sm text-[#8b8b90]">{student.group.level}</span>
                      )}
                    </div>
                  ) : (
                    <span className="text-[#8b8b90]">{tCommon('notAssigned')}</span>
                  )}
                </div>
              </div>
              {student.group?.center && (
                <div>
                  <label className="text-sm font-medium text-[#8b8b90]">{tCommon('center')}</label>
                  <p className="mt-1 text-[#1010a3]">{student.group.center.name}</p>
                </div>
              )}
              {student.teacher && (
                <div>
                  <label className="text-sm font-medium text-[#8b8b90]">{tCommon('teacher')}</label>
                  <p className="mt-1 text-[#1010a3]">
                    {student.teacher.user.firstName} {student.teacher.user.lastName}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Notes */}
        {student.notes && (
          <div className="bg-white rounded-xl border border-[rgba(14,14,16,0.07)] p-6">
            <h3 className="text-lg font-semibold text-[#1010a3] mb-4">{tCommon('notes')}</h3>
            <p className="text-[#3b3b40] whitespace-pre-wrap">{student.notes}</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
