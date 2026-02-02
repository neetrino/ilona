'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';
import { StatCard, Badge, Button } from '@/shared/components/ui';
import { useAuthStore } from '@/features/auth/store/auth.store';

interface UpcomingLesson {
  id: string;
  scheduledAt: string;
  duration: number;
  topic?: string;
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
  const { user } = useAuthStore();
  const [upcomingLessons, setUpcomingLessons] = useState<UpcomingLesson[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Mock data for now
    setUpcomingLessons([
      {
        id: '1',
        scheduledAt: new Date(Date.now() + 1800000).toISOString(),
        duration: 60,
        topic: 'Present Perfect Tense',
        teacher: { firstName: 'Sarah', lastName: 'Jenkins' },
        group: { name: 'English B2', level: 'B2' },
      },
      {
        id: '2',
        scheduledAt: new Date(Date.now() + 86400000).toISOString(),
        duration: 45,
        topic: 'Reading Comprehension',
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

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    }
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <DashboardLayout 
      title={`Hello, ${user?.firstName || 'Student'}! 👋`}
      subtitle="Track your progress and stay on top of your learning journey."
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upcoming Lessons */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-slate-800">Upcoming Lessons</h2>
              <Button variant="ghost" className="text-blue-600">
                View schedule
              </Button>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingLessons.map((lesson, index) => (
                  <div
                    key={lesson.id}
                    className={`flex items-center gap-4 p-4 rounded-xl transition-colors ${
                      index === 0 ? 'bg-blue-50 border border-blue-100' : 'bg-slate-50'
                    }`}
                  >
                    <div className="w-20 text-center">
                      <p className={`text-sm font-medium ${index === 0 ? 'text-blue-600' : 'text-slate-500'}`}>
                        {formatDate(lesson.scheduledAt)}
                      </p>
                      <p className="text-lg font-bold text-slate-800">{formatTime(lesson.scheduledAt)}</p>
                    </div>
                    <div className="h-12 w-px bg-slate-200" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-slate-800">{lesson.topic || 'Lesson'}</h3>
                        {index === 0 && <Badge variant="success">Starting Soon</Badge>}
                      </div>
                      <p className="text-sm text-slate-500">
                        with {lesson.teacher.firstName} {lesson.teacher.lastName} • {lesson.duration} min
                      </p>
                    </div>
                    {index === 0 && (
                      <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                        Join Lesson
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Progress Card */}
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white">
            <h3 className="text-lg font-semibold mb-4">Your Progress</h3>
            
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-white/80">Current Level</span>
                  <span className="font-semibold">B2</span>
                </div>
                <div className="h-2 bg-white/20 rounded-full">
                  <div className="h-full w-3/4 bg-white rounded-full"></div>
                </div>
              </div>

              <div className="pt-4 border-t border-white/20">
                <p className="text-sm text-white/80 mb-1">Words learned this month</p>
                <p className="text-3xl font-bold">124</p>
              </div>

              <div className="pt-4 border-t border-white/20">
                <p className="text-sm text-white/80 mb-1">Streak</p>
                <div className="flex items-center gap-2">
                  <span className="text-3xl font-bold">12</span>
                  <span className="text-white/80">days 🔥</span>
                </div>
              </div>
            </div>

            <Button className="w-full mt-6 bg-white text-indigo-600 hover:bg-white/90">
              View Full Progress
            </Button>
          </div>
        </div>

        {/* Recent Vocabulary */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-slate-800">Recent Vocabulary</h2>
            <Button variant="ghost" className="text-blue-600">
              View all
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {['Accomplish', 'Determine', 'Efficient', 'Significant'].map((word) => (
              <div key={word} className="p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer">
                <p className="font-semibold text-slate-800 mb-1">{word}</p>
                <p className="text-xs text-slate-500">Click to review</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
