'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';
import { StatCard, DataTable, Badge, Button } from '@/shared/components/ui';
import { useTeachers, AddTeacherForm, type Teacher } from '@/features/teachers';
import { useAdminDashboardStats } from '@/features/dashboard';

export default function AdminDashboardPage() {
  const [isAddTeacherOpen, setIsAddTeacherOpen] = useState(false);
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;
  
  // Fetch teachers list (top 5 for dashboard)
  const { 
    data: teachersData, 
    isLoading: isLoadingTeachers,
    error: teachersError 
  } = useTeachers({ take: 5 });

  // Fetch dashboard stats
  const { 
    data: stats, 
    isLoading: isLoadingStats,
    error: statsError 
  } = useAdminDashboardStats();

  const teachers = teachersData?.items || [];
  const totalTeachers = teachersData?.total || 0;
  const isLoading = isLoadingTeachers || isLoadingStats;

  // Show error state
  if (teachersError || statsError) {
    console.error('Dashboard error:', teachersError || statsError);
  }

  const teacherColumns = [
    {
      key: 'teacher',
      header: 'Teacher',
      sortable: true,
      render: (teacher: Teacher) => {
        const firstName = teacher.user?.firstName || '';
        const lastName = teacher.user?.lastName || '';
        const initials = `${firstName[0] || ''}${lastName[0] || ''}` || '?';
        return (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-slate-600 font-semibold">
              {initials}
            </div>
            <div>
              <p className="font-semibold text-slate-800">
                {firstName} {lastName}
              </p>
              <p className="text-sm text-slate-500">{teacher.user?.email || ''}</p>
            </div>
          </div>
        );
      },
    },
    {
      key: 'groups',
      header: 'Assigned Groups',
      render: (teacher: Teacher) => {
        const groups = teacher.groups || [];
        return (
          <div className="flex flex-wrap gap-1.5">
            {groups.slice(0, 2).map((group) => (
              <Badge key={group.id} variant="info">
                {group.name}
              </Badge>
            ))}
            {groups.length > 2 && (
              <Badge variant="default">+{groups.length - 2}</Badge>
            )}
            {groups.length === 0 && (
              <span className="text-slate-400 text-sm">No groups</span>
            )}
          </div>
        );
      },
    },
    {
      key: 'lessons',
      header: 'Lessons',
      sortable: true,
      className: 'text-center',
      render: (teacher: Teacher) => (
        <span className="text-slate-700 font-medium">{teacher._count?.lessons || 0}</span>
      ),
    },
    {
      key: 'groups_count',
      header: 'Groups',
      sortable: true,
      className: 'text-center',
      render: (teacher: Teacher) => (
        <span className="text-slate-700 font-medium">{teacher._count?.groups || 0}</span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (teacher: Teacher) => (
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-blue-600 hover:text-blue-700 font-medium"
          onClick={() => router.push(`/${locale}/admin/teachers/${teacher.id}`)}
        >
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
            value={stats?.teachers.total || totalTeachers}
            change={{ value: '+4.5%', type: 'positive' }}
          />
          <StatCard
            title="Active Teachers"
            value={stats?.teachers.active || totalTeachers}
            change={{ value: '+2.1%', type: 'positive' }}
          />
          <StatCard
            title="Pending Payments"
            value={stats?.finance.pendingPayments || 0}
            change={{ 
              value: stats?.finance.overduePayments 
                ? `${stats.finance.overduePayments} overdue` 
                : 'All on time', 
              type: stats?.finance.overduePayments ? 'negative' : 'positive' 
            }}
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
              className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
          <Button 
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium shadow-lg shadow-blue-500/20"
            onClick={() => setIsAddTeacherOpen(true)}
          >
            + Add teacher
          </Button>
          <button className="p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50">
            <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
          </button>
        </div>

        {/* Teachers Table */}
        <DataTable
          columns={teacherColumns}
          data={teachers}
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
          <span>1-{Math.min(5, teachers.length)} of {totalTeachers}</span>
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
                <h3 className="font-semibold text-slate-800 mb-2">Finance Overview</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  {stats?.finance.pendingPayments || 0} pending payments worth tracking. 
                  {stats?.finance.overduePayments ? ` ${stats.finance.overduePayments} are overdue and need attention.` : ' All payments are on track.'}
                </p>
                <button className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700">
                  View Finance
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
                <h3 className="font-semibold text-slate-800 mb-2">Staff Overview</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  {totalTeachers} teachers registered in the system.
                  {teachers.length > 0 && ` Average lessons per teacher: ${Math.round(teachers.reduce((sum, t) => sum + (t._count?.lessons || 0), 0) / teachers.length)}.`}
                </p>
                <button className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700">
                  Manage Teachers
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Teacher Modal */}
      <AddTeacherForm 
        open={isAddTeacherOpen} 
        onOpenChange={setIsAddTeacherOpen} 
      />
    </DashboardLayout>
  );
}
