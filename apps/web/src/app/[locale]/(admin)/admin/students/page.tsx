'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';
import { StatCard, DataTable, Badge, Button } from '@/shared/components/ui';
import { useStudents, useDeleteStudent, type Student } from '@/features/students';
import { formatCurrency } from '@/shared/lib/utils';

export default function StudentsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const pageSize = 10;

  // Fetch students with search and pagination
  const { 
    data: studentsData, 
    isLoading,
    error 
  } = useStudents({ 
    skip: page * pageSize,
    take: pageSize,
    search: searchQuery || undefined 
  });

  // Delete mutation
  const deleteStudent = useDeleteStudent();

  const students = studentsData?.items || [];
  const totalStudents = studentsData?.total || 0;
  const totalPages = studentsData?.totalPages || 1;

  // Handle search
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setPage(0);
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this student?')) {
      try {
        await deleteStudent.mutateAsync(id);
      } catch (err) {
        console.error('Failed to delete student:', err);
      }
    }
  };

  // Stats calculation
  const activeStudents = students.filter(s => s.user?.status === 'ACTIVE').length;
  const studentsWithGroup = students.filter(s => s.group).length;
  const totalFees = students.reduce((sum, s) => sum + (s.monthlyFee || 0), 0);

  // Error state
  if (error) {
    console.error('Students fetch error:', error);
  }

  const studentColumns = [
    {
      key: 'checkbox',
      header: <input type="checkbox" className="w-4 h-4 rounded border-slate-300" />,
      render: () => <input type="checkbox" className="w-4 h-4 rounded border-slate-300" />,
    },
    {
      key: 'student',
      header: 'Student',
      sortable: true,
      render: (student: Student) => {
        const firstName = student.user?.firstName || '';
        const lastName = student.user?.lastName || '';
        const initials = `${firstName[0] || ''}${lastName[0] || ''}` || '?';
        return (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-semibold">
              {initials}
            </div>
            <div>
              <p className="font-semibold text-slate-800">
                {firstName} {lastName}
              </p>
              <p className="text-sm text-slate-500">{student.user?.email || ''}</p>
            </div>
          </div>
        );
      },
    },
    {
      key: 'group',
      header: 'Group',
      render: (student: Student) => (
        student.group ? (
          <div>
            <Badge variant="info">{student.group.name}</Badge>
            {student.group.level && (
              <span className="ml-2 text-xs text-slate-500">{student.group.level}</span>
            )}
          </div>
        ) : (
          <span className="text-slate-400">Not assigned</span>
        )
      ),
    },
    {
      key: 'center',
      header: 'Center',
      render: (student: Student) => (
        student.group?.center ? (
          <span className="text-slate-700">{student.group.center.name}</span>
        ) : (
          <span className="text-slate-400">—</span>
        )
      ),
    },
    {
      key: 'monthlyFee',
      header: 'Monthly Fee',
      className: 'text-right',
      render: (student: Student) => {
        const fee = typeof student.monthlyFee === 'string' ? parseFloat(student.monthlyFee) : Number(student.monthlyFee || 0);
        return (
          <span className="text-slate-700 font-medium">
            {formatCurrency(fee)}
          </span>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (student: Student) => {
        const status = student.user?.status || 'ACTIVE';
        return (
          <Badge variant={status === 'ACTIVE' ? 'success' : 'warning'}>
            {status}
          </Badge>
        );
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (student: Student) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 font-medium">
            View
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-red-600 hover:text-red-700 font-medium"
            onClick={() => handleDelete(student.id)}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <DashboardLayout 
      title="Student Management" 
      subtitle="Track enrollment, attendance and payment status across all groups."
    >
      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatCard
            title="Total Students"
            value={totalStudents}
            change={{ value: '+5.2%', type: 'positive' }}
          />
          <StatCard
            title="Active Students"
            value={activeStudents || totalStudents}
            change={{ value: '+3.1%', type: 'positive' }}
          />
          <StatCard
            title="In Groups"
            value={studentsWithGroup}
            change={{ value: `${totalStudents - studentsWithGroup} unassigned`, type: totalStudents - studentsWithGroup > 0 ? 'warning' : 'positive' }}
          />
          <StatCard
            title="Total Monthly Fees"
            value={formatCurrency(totalFees)}
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
              placeholder="Search students by name, email or group..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium">
            + Add student
          </Button>
          <button className="p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50">
            <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
          </button>
        </div>

        {/* Students Table */}
        <DataTable
          columns={studentColumns}
          data={students}
          keyExtractor={(student) => student.id}
          isLoading={isLoading}
          emptyMessage={searchQuery ? "No students match your search" : "No students found"}
        />

        {/* Pagination */}
        <div className="flex items-center justify-between text-sm text-slate-500">
          <span>
            Showing {Math.min(page * pageSize + 1, totalStudents)}-{Math.min((page + 1) * pageSize, totalStudents)} of {totalStudents} students
          </span>
          <div className="flex items-center gap-2">
            <button 
              className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-50" 
              disabled={page === 0}
              onClick={() => setPage(p => Math.max(0, p - 1))}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span>Page {page + 1} of {totalPages || 1}</span>
            <button 
              className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-50"
              disabled={page >= totalPages - 1}
              onClick={() => setPage(p => p + 1)}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-red-50 rounded-xl">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-800 mb-2">Unassigned Students</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  {totalStudents - studentsWithGroup > 0 
                    ? `${totalStudents - studentsWithGroup} students are not assigned to any group. Assign them to start their learning journey.`
                    : 'All students are assigned to groups. Great work!'}
                </p>
                <button className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700">
                  Manage Groups
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-amber-50 rounded-xl">
                <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-800 mb-2">Payment Collection</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Total monthly fees: ${totalFees.toLocaleString()}. 
                  Monitor payment status in the Finance section.
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
        </div>
      </div>
    </DashboardLayout>
  );
}
