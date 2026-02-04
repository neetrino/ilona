'use client';

import { useParams, useRouter } from 'next/navigation';
import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';
import { Badge, Button } from '@/shared/components/ui';
import { useTeacher } from '@/features/teachers';

export default function TeacherProfilePage() {
  const params = useParams();
  const router = useRouter();
  const teacherId = params.id as string;
  const locale = params.locale as string;

  const { data: teacher, isLoading, error } = useTeacher(teacherId);

  // Loading state
  if (isLoading) {
    return (
      <DashboardLayout 
        title="Teacher Profile" 
        subtitle="Loading teacher information..."
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
        title="Teacher Profile" 
        subtitle="Error loading teacher information"
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
      title="Teacher Profile" 
      subtitle={`Viewing profile for ${firstName} ${lastName}`}
    >
      <div className="space-y-6">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          onClick={() => router.push(`/${locale}/admin/teachers`)}
          className="mb-4"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Teachers
        </Button>

        {/* Profile Header */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-start gap-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-2xl font-bold">
              {initials}
            </div>
            <div className="flex-1">
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
            <p className="text-3xl font-bold text-slate-800">
              {new Intl.NumberFormat('hy-AM', {
                style: 'currency',
                currency: 'AMD',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              }).format(hourlyRate)}/hr
            </p>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Personal Information */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Personal Information</h3>
            <div className="space-y-4">
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
      </div>
    </DashboardLayout>
  );
}

