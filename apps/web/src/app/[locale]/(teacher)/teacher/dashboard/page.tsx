'use client';

import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';
import { StatCard, Badge, Button, DataTable } from '@/shared/components/ui';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { useLessons, useStartLesson, useCompleteLesson, type Lesson } from '@/features/lessons';
import { useMyGroups } from '@/features/groups';

export default function TeacherDashboardPage() {
  const { user } = useAuthStore();

  // Get today's date range
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Fetch today's lessons
  const { 
    data: lessonsData, 
    isLoading: isLoadingLessons 
  } = useLessons({
    dateFrom: today.toISOString(),
    dateTo: tomorrow.toISOString(),
    take: 20,
  });

  // Fetch teacher's groups - use canonical endpoint for consistency
  const { data: groups = [] } = useMyGroups();

  // Mutations
  const startLesson = useStartLesson();
  const completeLesson = useCompleteLesson();

  const todayLessons = lessonsData?.items || [];

  // Calculate stats
  const totalStudents = groups.reduce((sum, g) => sum + (g._count?.students || 0), 0);
  const scheduledLessons = todayLessons.filter(l => l.status === 'SCHEDULED').length;
  const completedLessons = todayLessons.filter(l => l.status === 'COMPLETED').length;
  const vocabularySent = todayLessons.filter(l => l.vocabularySent).length;

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  // Handle start lesson
  const handleStartLesson = async (id: string) => {
    try {
      await startLesson.mutateAsync(id);
    } catch (err) {
      console.error('Failed to start lesson:', err);
    }
  };

  // Handle complete lesson
  const handleCompleteLesson = async (id: string) => {
    try {
      await completeLesson.mutateAsync({ id });
    } catch (err) {
      console.error('Failed to complete lesson:', err);
    }
  };

  const lessonColumns = [
    {
      key: 'time',
      header: 'Time',
      render: (lesson: Lesson) => (
        <div className="text-center">
          <p className="font-semibold text-slate-800">{formatTime(lesson.scheduledAt)}</p>
          <p className="text-xs text-slate-500">{lesson.duration} min</p>
        </div>
      ),
    },
    {
      key: 'lesson',
      header: 'Lesson',
      render: (lesson: Lesson) => (
        <div>
          <p className="font-semibold text-slate-800">{lesson.topic || 'Untitled'}</p>
          <p className="text-sm text-slate-500">Level: {lesson.group?.level || 'N/A'}</p>
        </div>
      ),
    },
    {
      key: 'group',
      header: 'Group',
      render: (lesson: Lesson) => (
        <Badge variant="info">{lesson.group?.name || 'No group'}</Badge>
      ),
    },
    {
      key: 'students',
      header: 'Students',
      className: 'text-center',
      render: (lesson: Lesson) => (
        <span className="font-medium text-slate-700">
          {lesson.group?._count?.students || lesson._count?.attendances || 0}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (lesson: Lesson) => {
        switch (lesson.status) {
          case 'COMPLETED':
            return <Badge variant="success">Completed</Badge>;
          case 'IN_PROGRESS':
            return <Badge variant="warning">In Progress</Badge>;
          case 'CANCELLED':
            return <Badge variant="default">Cancelled</Badge>;
          default:
            return <Badge variant="info">Scheduled</Badge>;
        }
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (lesson: Lesson) => (
        <div className="flex items-center gap-2">
          {lesson.status === 'SCHEDULED' && (
            <Button 
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm"
              onClick={() => handleStartLesson(lesson.id)}
              disabled={startLesson.isPending}
            >
              Start
            </Button>
          )}
          {lesson.status === 'IN_PROGRESS' && (
            <Button 
              className="bg-green-600 hover:bg-green-700 text-white text-sm"
              onClick={() => handleCompleteLesson(lesson.id)}
              disabled={completeLesson.isPending}
            >
              Complete
            </Button>
          )}
          {lesson.status === 'COMPLETED' && (
            <Button variant="ghost" className="text-blue-600 text-sm">
              View
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <DashboardLayout 
      title="Daily Plan" 
      subtitle={`Welcome back, ${user?.firstName || 'Teacher'}! Here's your schedule for today.`}
    >
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatCard 
            title="Today's Lessons" 
            value={todayLessons.length}
            change={{ value: `${completedLessons} completed`, type: completedLessons > 0 ? 'positive' : 'neutral' }}
          />
          <StatCard 
            title="Total Students" 
            value={totalStudents}
            change={{ value: `${groups.length} groups`, type: 'neutral' }}
          />
          <StatCard 
            title="Pending Lessons" 
            value={scheduledLessons} 
            change={{ value: scheduledLessons > 0 ? 'Upcoming' : 'All done', type: scheduledLessons > 0 ? 'warning' : 'positive' }}
          />
          <StatCard 
            title="Vocabulary Sent" 
            value={`${vocabularySent}/${todayLessons.length}`} 
            change={{ value: vocabularySent < todayLessons.length ? 'Send now' : 'All sent', type: vocabularySent < todayLessons.length ? 'warning' : 'positive' }}
          />
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="search"
              placeholder="Search lessons, groups or students..."
              className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium">
            Open Chat
          </Button>
        </div>

        {/* Today's Lessons Table */}
        <div className="bg-white rounded-2xl border border-slate-200">
          <div className="p-4 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-800">Today's Lessons</h2>
          </div>
          <DataTable
            columns={lessonColumns}
            data={todayLessons}
            keyExtractor={(lesson) => lesson.id}
            isLoading={isLoadingLessons}
            emptyMessage="No lessons scheduled for today"
          />
        </div>

        {/* My Groups */}
        {groups.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">My Groups</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {groups.slice(0, 6).map(group => (
                <div key={group.id} className="p-4 bg-slate-50 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-slate-800">{group.name}</h4>
                    {group.level && <Badge variant="info">{group.level}</Badge>}
                  </div>
                  <p className="text-sm text-slate-500">
                    {group._count?.students || 0} students • {group._count?.lessons || 0} lessons
                  </p>
                  <p className="text-xs text-slate-400 mt-1">{group.center?.name}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-amber-50 rounded-xl">
                <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-800 mb-2">Student Feedback</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Remember to provide feedback for students after each lesson. This helps track progress and keeps parents informed.
                </p>
                <button className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700">
                  Write Feedback
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-800 mb-2">Send Vocabulary</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Send today's vocabulary list to your groups after each lesson. This helps students review and retain new words.
                </p>
                <button className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700">
                  Open Group Chat
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
