'use client';

import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';
import { StatCard, Badge, Button, DataTable } from '@/shared/components/ui';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { useMyDashboard, type StudentUpcomingLesson } from '@/features/students';
import { formatCurrency } from '@/shared/lib/utils';

export default function StudentDashboardPage() {
  const { user } = useAuthStore();
  
  // Fetch student dashboard data
  const { data: dashboard, isLoading } = useMyDashboard();

  const upcomingLessons = dashboard?.upcomingLessons || [];
  const stats = dashboard?.statistics;
  const pendingPayments = dashboard?.pendingPayments || [];
  const student = dashboard?.student;

  // Calculate stats
  const attendanceRate = stats?.attendance?.rate || 0;
  const totalLessons = stats?.attendance?.total || 0;
  const pendingPaymentAmount = pendingPayments.reduce((sum, p) => sum + p.amount, 0);
  const nextPayment = pendingPayments[0];

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  // Check if lesson is starting soon (within 30 min)
  const isStartingSoon = (dateStr: string) => {
    const lessonTime = new Date(dateStr).getTime();
    const now = Date.now();
    const diff = lessonTime - now;
    return diff > 0 && diff < 30 * 60 * 1000; // 30 minutes
  };

  const lessonColumns = [
    {
      key: 'date',
      header: 'Date',
      render: (lesson: StudentUpcomingLesson) => (
        <div className="text-center">
          <p className="font-semibold text-slate-800">{formatDate(lesson.scheduledAt)}</p>
          <p className="text-sm text-slate-500">{formatTime(lesson.scheduledAt)}</p>
        </div>
      ),
    },
    {
      key: 'lesson',
      header: 'Lesson',
      render: (lesson: StudentUpcomingLesson) => (
        <div>
          <p className="font-semibold text-slate-800">{lesson.topic || 'Lesson'}</p>
          <p className="text-sm text-slate-500">{lesson.duration} min</p>
        </div>
      ),
    },
    {
      key: 'teacher',
      header: 'Teacher',
      render: (lesson: StudentUpcomingLesson) => {
        const firstName = lesson.teacher?.user?.firstName || '';
        const lastName = lesson.teacher?.user?.lastName || '';
        const initials = `${firstName[0] || ''}${lastName[0] || ''}` || '?';
        return (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 text-sm font-medium">
              {initials}
            </div>
            <span className="text-slate-700">{firstName} {lastName}</span>
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (lesson: StudentUpcomingLesson) => (
        isStartingSoon(lesson.scheduledAt) ? (
          <Badge variant="success">Starting Soon</Badge>
        ) : (
          <span className="text-slate-500">Scheduled</span>
        )
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (lesson: StudentUpcomingLesson) => (
        isStartingSoon(lesson.scheduledAt) ? (
          <Button className="bg-blue-600 hover:bg-blue-700 text-white text-sm">
            Join Lesson
          </Button>
        ) : (
          <Button variant="ghost" className="text-blue-600 text-sm">
            View Details
          </Button>
        )
      ),
    },
  ];

  return (
    <DashboardLayout 
      title="My Learning" 
      subtitle={`Welcome back, ${user?.firstName || 'Student'}! Track your progress and upcoming lessons.`}
    >
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatCard 
            title="Attendance Rate" 
            value={`${attendanceRate}%`} 
            change={{ 
              value: attendanceRate >= 90 ? 'Excellent' : attendanceRate >= 75 ? 'Good' : 'Needs improvement', 
              type: attendanceRate >= 90 ? 'positive' : attendanceRate >= 75 ? 'neutral' : 'warning' 
            }}
          />
          <StatCard 
            title="Total Lessons" 
            value={totalLessons}
            change={{ value: `${stats?.attendance?.present || 0} attended`, type: 'positive' }}
          />
          <StatCard 
            title="Upcoming" 
            value={upcomingLessons.length}
            change={{ value: 'lessons scheduled', type: 'neutral' }}
          />
          <StatCard 
            title="Next Payment" 
            value={nextPayment ? formatCurrency(Number(nextPayment.amount)) : 'None'} 
            change={{ 
              value: nextPayment 
                ? `Due ${new Date(nextPayment.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                : 'All paid', 
              type: nextPayment?.status === 'OVERDUE' ? 'warning' : 'neutral' 
            }}
          />
        </div>

        {/* Group Info */}
        {student?.group && (
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm mb-1">Your Group</p>
                <h2 className="text-2xl font-bold">{student.group.name}</h2>
                {student.group.level && (
                  <p className="text-blue-100 mt-1">Level: {student.group.level}</p>
                )}
              </div>
              <Button className="bg-white text-blue-600 hover:bg-blue-50">
                Open Group Chat
              </Button>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="search"
              placeholder="Search lessons, vocabulary..."
              className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
          <button className="p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50">
            <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
          </button>
        </div>

        {/* Upcoming Lessons Table */}
        <div className="bg-white rounded-2xl border border-slate-200">
          <div className="p-4 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-800">Upcoming Lessons</h2>
          </div>
          <DataTable
            columns={lessonColumns}
            data={upcomingLessons}
            keyExtractor={(lesson) => lesson.id}
            isLoading={isLoading}
            emptyMessage="No upcoming lessons scheduled"
          />
        </div>

        {/* Pending Payments Alert */}
        {pendingPayments.length > 0 && (
          <div className={`rounded-2xl p-4 flex items-center gap-4 ${
            pendingPayments.some(p => p.status === 'OVERDUE') 
              ? 'bg-red-50 border border-red-200' 
              : 'bg-amber-50 border border-amber-200'
          }`}>
            <div className={`p-2 rounded-lg ${
              pendingPayments.some(p => p.status === 'OVERDUE') ? 'bg-red-100' : 'bg-amber-100'
            }`}>
              <svg className={`w-5 h-5 ${
                pendingPayments.some(p => p.status === 'OVERDUE') ? 'text-red-600' : 'text-amber-600'
              }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className={`font-medium ${
                pendingPayments.some(p => p.status === 'OVERDUE') ? 'text-red-800' : 'text-amber-800'
              }`}>
                {pendingPayments.some(p => p.status === 'OVERDUE') 
                  ? 'Payment Overdue' 
                  : 'Payment Pending'}
              </p>
              <p className={`text-sm ${
                pendingPayments.some(p => p.status === 'OVERDUE') ? 'text-red-600' : 'text-amber-600'
              }`}>
                Total: {formatCurrency(pendingPaymentAmount)} • {pendingPayments.length} payment(s)
              </p>
            </div>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              Pay Now
            </Button>
          </div>
        )}

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-emerald-50 rounded-xl">
                <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-800 mb-2">Your Progress</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Attendance: <span className="font-medium text-slate-700">{stats?.attendance?.present || 0}/{stats?.attendance?.total || 0}</span> lessons
                  {stats?.attendance?.unjustifiedAbsences && stats.attendance.unjustifiedAbsences > 0 && (
                    <> • <span className="text-red-600">{stats.attendance.unjustifiedAbsences} unexcused absences</span></>
                  )}
                </p>
                <button className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700">
                  View Full Progress
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-50 rounded-xl">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-800 mb-2">Recent Vocabulary</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Review the words from your recent lessons to improve retention and build your vocabulary.
                </p>
                <button className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700">
                  Practice Vocabulary
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
