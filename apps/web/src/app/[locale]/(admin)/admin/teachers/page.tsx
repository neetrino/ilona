'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';
import { StatCard, DataTable, Badge, Button } from '@/shared/components/ui';
import { api, ApiError } from '@/shared/lib/api';

interface Teacher {
  id: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatarUrl?: string;
  };
  hourlyRate: number;
  groups: Array<{ id: string; name: string; level?: string }>;
  _count: {
    lessons: number;
  };
}

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const data = await api.get<{ items: Teacher[] }>('/teachers?take=50');
        setTeachers(data.items || []);
      } catch (error) {
        if (error instanceof ApiError) {
          console.error('Failed to fetch teachers:', error.message);
        }
        // Use mock data if API fails
        setTeachers([
          {
            id: '1',
            user: { id: 'u1', firstName: 'Sarah', lastName: 'Jenkins', email: 'sarah.j@linguist.edu' },
            hourlyRate: 25,
            groups: [{ id: 'g1', name: 'ENGLISH B2' }, { id: 'g2', name: 'BUSINESS FR' }],
            _count: { lessons: 24 },
          },
          {
            id: '2',
            user: { id: 'u2', firstName: 'Marcus', lastName: 'Thorne', email: 'm.thorne@linguist.edu' },
            hourlyRate: 30,
            groups: [{ id: 'g3', name: 'IELTS ADV' }],
            _count: { lessons: 12 },
          },
          {
            id: '3',
            user: { id: 'u3', firstName: 'Elena', lastName: 'Rodriguez', email: 'elena.r@linguist.edu' },
            hourlyRate: 22,
            groups: [{ id: 'g4', name: 'SPANISH A1' }],
            _count: { lessons: 0 },
          },
          {
            id: '4',
            user: { id: 'u4', firstName: 'David', lastName: 'Kim', email: 'd.kim@linguist.edu' },
            hourlyRate: 28,
            groups: [{ id: 'g5', name: 'TOEFL PREP' }, { id: 'g6', name: 'K-PUPIL' }],
            _count: { lessons: 18 },
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTeachers();
  }, []);

  // Mock stats
  const stats = {
    totalTeachers: 124,
    activeTeachers: 118,
    missedFeedbacks: 12,
  };

  // Mock missed obligations data
  const missedObligations: Record<string, { count: number; type: string }> = {
    '1': { count: 3, type: 'Feedbacks' },
    '3': { count: 1, type: 'Follow-up' },
    '4': { count: 5, type: 'Feedbacks' },
  };

  const filteredTeachers = teachers.filter((teacher) => {
    const fullName = `${teacher.user.firstName} ${teacher.user.lastName}`.toLowerCase();
    const email = teacher.user.email.toLowerCase();
    const query = searchQuery.toLowerCase();
    return fullName.includes(query) || email.includes(query);
  });

  const teacherColumns = [
    {
      key: 'checkbox',
      header: (
        <input type="checkbox" className="w-4 h-4 rounded border-slate-300" />
      ),
      render: () => (
        <input type="checkbox" className="w-4 h-4 rounded border-slate-300" />
      ),
    },
    {
      key: 'teacher',
      header: 'Teacher ↕',
      sortable: true,
      render: (teacher: Teacher) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-semibold">
            {teacher.user.firstName[0]}{teacher.user.lastName[0]}
          </div>
          <div>
            <p className="font-semibold text-slate-800">
              {teacher.user.firstName} {teacher.user.lastName}
            </p>
            <p className="text-sm text-slate-500">{teacher.user.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'groups',
      header: 'Assigned Groups',
      render: (teacher: Teacher) => (
        <div className="flex flex-wrap gap-1.5">
          {teacher.groups.slice(0, 2).map((group) => (
            <Badge key={group.id} variant="info">
              {group.name}
            </Badge>
          ))}
          {teacher.groups.length > 2 && (
            <Badge variant="default">+{teacher.groups.length - 2}</Badge>
          )}
          {teacher.groups.length === 0 && (
            <span className="text-slate-400 text-sm">No groups</span>
          )}
        </div>
      ),
    },
    {
      key: 'students',
      header: 'Students ↕',
      sortable: true,
      className: 'text-center',
      render: (teacher: Teacher) => (
        <span className="text-slate-700 font-medium">{teacher._count?.lessons || 0}</span>
      ),
    },
    {
      key: 'obligations',
      header: 'Missed Obligations',
      render: (teacher: Teacher) => {
        const missed = missedObligations[teacher.id];
        if (missed) {
          return (
            <div className="flex items-center gap-2">
              <span className="text-red-500">!</span>
              <span className="px-2 py-1 bg-red-50 text-red-600 text-sm font-medium rounded-full">
                {missed.count} {missed.type}
              </span>
            </div>
          );
        }
        return <span className="text-slate-400">— None</span>;
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      render: () => (
        <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 font-medium">
          View Profile
        </Button>
      ),
    },
  ];

  return (
    <DashboardLayout 
      title="Teacher Management" 
      subtitle="Monitor accountability, performance, and workload across all departments."
    >
      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            title="Total Teachers"
            value={stats.totalTeachers}
            change={{ value: '+4.5%', type: 'positive' }}
          />
          <StatCard
            title="Active Teachers"
            value={stats.activeTeachers}
            change={{ value: '+2.1%', type: 'positive' }}
          />
          <StatCard
            title="Missed Feedbacks"
            value={stats.missedFeedbacks}
            change={{ value: '-12%', type: 'negative' }}
          />
        </div>

        {/* Search & Actions Bar */}
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="search"
              placeholder="Search teachers by name, email or group..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium">
            + Add teacher
          </Button>
          <button className="p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50">
            <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
          </button>
          <button className="p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50">
            <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
            </svg>
          </button>
        </div>

        {/* Teachers Table */}
        <DataTable
          columns={teacherColumns}
          data={filteredTeachers}
          keyExtractor={(teacher) => teacher.id}
          isLoading={isLoading}
          emptyMessage="No teachers found"
        />

        {/* Pagination */}
        <div className="flex items-center justify-end gap-2 text-sm text-slate-500">
          <button className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-50" disabled>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span>1-{filteredTeachers.length} of {stats.totalTeachers}</span>
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
              <div className="p-3 bg-amber-50 rounded-xl">
                <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-800 mb-2">Salary calculation</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  There are currently 12 missed student feedback deadlines. Systematic delays in feedback negatively impact student retention rates.
                </p>
                <button className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700">
                  Review Policy
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-800 mb-2">Staff Workload</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Average student count per teacher is 14.2. Department of English is nearing capacity. Consider onboarding 2 more English teachers.
                </p>
                <button className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700">
                  View Capacity
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


