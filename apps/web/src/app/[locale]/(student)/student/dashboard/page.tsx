'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';
import { StatCard, Badge, Button, DataTable } from '@/shared/components/ui';
import { useAuthStore } from '@/features/auth/store/auth.store';

interface UpcomingLesson {
  id: string;
  scheduledAt: string;
  duration: number;
  topic?: string;
  status: string;
  teacher: {
    firstName: string;
    lastName: string;
  };
  group: {
    name: string;
    level?: string;
  };
}

export default function StudentDashboardPage() {
  const { user: _user } = useAuthStore();
  const [upcomingLessons, setUpcomingLessons] = useState<UpcomingLesson[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Mock data
    setUpcomingLessons([
      {
        id: '1',
        scheduledAt: new Date(Date.now() + 1800000).toISOString(),
        duration: 60,
        topic: 'Present Perfect Tense',
        status: 'STARTING_SOON',
        teacher: { firstName: 'Sarah', lastName: 'Jenkins' },
        group: { name: 'English B2', level: 'B2' },
      },
      {
        id: '2',
        scheduledAt: new Date(Date.now() + 86400000).toISOString(),
        duration: 45,
        topic: 'Reading Comprehension',
        status: 'SCHEDULED',
        teacher: { firstName: 'Sarah', lastName: 'Jenkins' },
        group: { name: 'English B2', level: 'B2' },
      },
      {
        id: '3',
        scheduledAt: new Date(Date.now() + 172800000).toISOString(),
        duration: 60,
        topic: 'Writing Practice',
        status: 'SCHEDULED',
        teacher: { firstName: 'Sarah', lastName: 'Jenkins' },
        group: { name: 'English B2', level: 'B2' },
      },
    ]);
    setIsLoading(false);
  }, []);

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
    });
  };

  const lessonColumns = [
    {
      key: 'date',
      header: 'Date',
      render: (lesson: UpcomingLesson) => (
        <div className="text-center">
          <p className="font-semibold text-slate-800">{formatDate(lesson.scheduledAt)}</p>
          <p className="text-sm text-slate-500">{formatTime(lesson.scheduledAt)}</p>
        </div>
      ),
    },
    {
      key: 'lesson',
      header: 'Lesson',
      render: (lesson: UpcomingLesson) => (
        <div>
          <p className="font-semibold text-slate-800">{lesson.topic || 'Lesson'}</p>
          <p className="text-sm text-slate-500">{lesson.duration} min</p>
        </div>
      ),
    },
    {
      key: 'teacher',
      header: 'Teacher',
      render: (lesson: UpcomingLesson) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 text-sm font-medium">
            {lesson.teacher.firstName[0]}{lesson.teacher.lastName[0]}
          </div>
          <span className="text-slate-700">{lesson.teacher.firstName} {lesson.teacher.lastName}</span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (lesson: UpcomingLesson) => (
        lesson.status === 'STARTING_SOON' ? (
          <Badge variant="success">Starting Soon</Badge>
        ) : (
          <span className="text-slate-500">Scheduled</span>
        )
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (lesson: UpcomingLesson) => (
        lesson.status === 'STARTING_SOON' ? (
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
      subtitle="Track your progress and upcoming lessons."
    >
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatCard 
            title="Attendance Rate" 
            value="94%" 
            change={{ value: '+2%', type: 'positive' }}
          />
          <StatCard title="Lessons This Month" value="12" />
          <StatCard title="Completed Lessons" value="45" />
          <StatCard 
            title="Next Payment" 
            value="$150" 
            change={{ value: 'Due in 5 days', type: 'neutral' }}
          />
        </div>

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
        <DataTable
          columns={lessonColumns}
          data={upcomingLessons}
          keyExtractor={(lesson) => lesson.id}
          isLoading={isLoading}
          emptyMessage="No upcoming lessons"
        />

        {/* Pagination */}
        <div className="flex items-center justify-end gap-2 text-sm text-slate-500">
          <button className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-50" disabled>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span>1-3 of 12</span>
          <button className="p-2 rounded-lg hover:bg-slate-100">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

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
                  Current Level: <span className="font-medium text-slate-700">B2</span> • Words learned this month: <span className="font-medium text-slate-700">124</span>
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
