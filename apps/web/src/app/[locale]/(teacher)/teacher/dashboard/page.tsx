'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';
import { StatCard, Badge, Button } from '@/shared/components/ui';
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
}

export default function TeacherDashboardPage() {
  const { user } = useAuthStore();
  const [todayLessons, setTodayLessons] = useState<TodayLesson[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Mock data for now
    setTodayLessons([
      {
        id: '1',
        scheduledAt: new Date().toISOString(),
        duration: 60,
        topic: 'Present Perfect Tense',
        status: 'SCHEDULED',
        group: { id: 'g1', name: 'English B2', level: 'B2' },
      },
      {
        id: '2',
        scheduledAt: new Date(Date.now() + 3600000).toISOString(),
        duration: 45,
        topic: 'Business Vocabulary',
        status: 'SCHEDULED',
        group: { id: 'g2', name: 'Business English', level: 'C1' },
      },
      {
        id: '3',
        scheduledAt: new Date(Date.now() + 7200000).toISOString(),
        duration: 60,
        topic: 'IELTS Speaking Practice',
        status: 'SCHEDULED',
        group: { id: 'g3', name: 'IELTS Prep', level: 'Advanced' },
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

  return (
    <DashboardLayout 
      title={`Welcome back, ${user?.firstName || 'Teacher'}!`}
      subtitle="Here's your schedule and tasks for today."
    >
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatCard title="Today's Lessons" value="3" />
          <StatCard title="This Week" value="18" />
          <StatCard title="Students" value="45" />
          <StatCard
            title="Pending Feedbacks"
            value="2"
            change={{ value: 'Due today', type: 'warning' }}
          />
        </div>

        {/* Today's Schedule */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-slate-800">Today's Schedule</h2>
            <Button variant="ghost" className="text-blue-600">
              View full calendar
            </Button>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {todayLessons.map((lesson, index) => (
                <div
                  key={lesson.id}
                  className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors"
                >
                  <div className="w-16 text-center">
                    <p className="text-lg font-bold text-slate-800">{formatTime(lesson.scheduledAt)}</p>
                    <p className="text-xs text-slate-500">{lesson.duration} min</p>
                  </div>
                  <div className="h-12 w-px bg-slate-200" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-slate-800">{lesson.topic || 'Untitled Lesson'}</h3>
                      <Badge variant="info">{lesson.group.name}</Badge>
                    </div>
                    <p className="text-sm text-slate-500">
                      Level: {lesson.group.level}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {index === 0 && (
                      <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                        Start Lesson
                      </Button>
                    )}
                    <Button variant="outline">View Details</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 text-white">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-white/20 rounded-xl">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <span className="text-sm font-medium bg-white/20 px-3 py-1 rounded-full">Quick Action</span>
            </div>
            <h3 className="text-xl font-bold mb-2">Mark Attendance</h3>
            <p className="text-white/80 text-sm mb-4">Quickly mark attendance for your current or upcoming lesson.</p>
            <Button className="bg-white text-blue-600 hover:bg-white/90 w-full">
              Open Attendance
            </Button>
          </div>

          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 text-white">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-white/20 rounded-xl">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <span className="text-sm font-medium bg-white/20 px-3 py-1 rounded-full">Quick Action</span>
            </div>
            <h3 className="text-xl font-bold mb-2">Send Vocabulary</h3>
            <p className="text-white/80 text-sm mb-4">Share today's vocabulary words with your students via chat.</p>
            <Button className="bg-white text-emerald-600 hover:bg-white/90 w-full">
              Open Chat
            </Button>
          </div>

          <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-6 text-white">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-white/20 rounded-xl">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <Badge className="bg-white/20 text-white border-0">2 Pending</Badge>
            </div>
            <h3 className="text-xl font-bold mb-2">Student Feedback</h3>
            <p className="text-white/80 text-sm mb-4">Complete feedback forms for students from recent lessons.</p>
            <Button className="bg-white text-amber-600 hover:bg-white/90 w-full">
              Write Feedback
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
