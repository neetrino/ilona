'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';
import { StatCard, Badge, Button, DataTable } from '@/shared/components/ui';
import { useAuthStore } from '@/features/auth/store/auth.store';

interface TodayLesson {
  id: string;
  scheduledAt: string;
  duration: number;
  topic?: string;
  status: string;
  group: {
    id: string;
    name: string;
    level?: string;
  };
  studentsCount: number;
}

export default function TeacherDashboardPage() {
  const { user: _user } = useAuthStore();
  const [todayLessons, setTodayLessons] = useState<TodayLesson[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Mock data
    setTodayLessons([
      {
        id: '1',
        scheduledAt: new Date().toISOString(),
        duration: 60,
        topic: 'Present Perfect Tense',
        status: 'SCHEDULED',
        group: { id: 'g1', name: 'English B2', level: 'B2' },
        studentsCount: 8,
      },
      {
        id: '2',
        scheduledAt: new Date(Date.now() + 3600000).toISOString(),
        duration: 45,
        topic: 'Business Vocabulary',
        status: 'SCHEDULED',
        group: { id: 'g2', name: 'Business FR', level: 'C1' },
        studentsCount: 6,
      },
      {
        id: '3',
        scheduledAt: new Date(Date.now() + 7200000).toISOString(),
        duration: 60,
        topic: 'IELTS Speaking Practice',
        status: 'SCHEDULED',
        group: { id: 'g3', name: 'IELTS ADV', level: 'Advanced' },
        studentsCount: 4,
      },
    ]);
    setIsLoading(false);
  }, []);

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const lessonColumns = [
    {
      key: 'time',
      header: 'Time',
      render: (lesson: TodayLesson) => (
        <div className="text-center">
          <p className="font-semibold text-slate-800">{formatTime(lesson.scheduledAt)}</p>
          <p className="text-xs text-slate-500">{lesson.duration} min</p>
        </div>
      ),
    },
    {
      key: 'lesson',
      header: 'Lesson',
      render: (lesson: TodayLesson) => (
        <div>
          <p className="font-semibold text-slate-800">{lesson.topic || 'Untitled'}</p>
          <p className="text-sm text-slate-500">Level: {lesson.group.level}</p>
        </div>
      ),
    },
    {
      key: 'group',
      header: 'Group',
      render: (lesson: TodayLesson) => (
        <Badge variant="info">{lesson.group.name}</Badge>
      ),
    },
    {
      key: 'students',
      header: 'Students',
      className: 'text-center',
      render: (lesson: TodayLesson) => (
        <span className="font-medium text-slate-700">{lesson.studentsCount}</span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (lesson: TodayLesson, index?: number) => (
        <div className="flex items-center gap-2">
          {index === 0 ? (
            <Button className="bg-blue-600 hover:bg-blue-700 text-white text-sm">
              Start Lesson
            </Button>
          ) : (
            <Button variant="ghost" className="text-blue-600 text-sm">
              View Details
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <DashboardLayout 
      title="Daily Plan" 
      subtitle="Your schedule, tasks and student feedback for today."
    >
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatCard title="Today's Lessons" value="3" />
          <StatCard title="Total Students" value="18" />
          <StatCard 
            title="Pending Feedbacks" 
            value="2" 
            change={{ value: '! Due today', type: 'warning' }}
          />
          <StatCard 
            title="Vocabulary Sent" 
            value="1/3" 
            change={{ value: 'Send now', type: 'neutral' }}
          />
        </div>

        {/* Search & Actions */}
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
            + Add Lesson
          </Button>
        </div>

        {/* Today's Lessons Table */}
        <DataTable
          columns={lessonColumns}
          data={todayLessons}
          keyExtractor={(lesson) => lesson.id}
          isLoading={isLoading}
          emptyMessage="No lessons scheduled for today"
        />

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
                <h3 className="font-semibold text-slate-800 mb-2">Pending Feedback</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  You have 2 students awaiting feedback from yesterday's lessons. Complete feedback to maintain your performance score.
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
                  Remember to send today's vocabulary list to your groups after each lesson. This helps students review and retain new words.
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
