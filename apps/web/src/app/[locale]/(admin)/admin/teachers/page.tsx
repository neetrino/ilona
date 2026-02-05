'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';
import { StatCard, DataTable, Badge, Button } from '@/shared/components/ui';
import { useTeachers, useDeleteTeacher, AddTeacherForm, type Teacher } from '@/features/teachers';

export default function TeachersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [isAddTeacherOpen, setIsAddTeacherOpen] = useState(false);
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;
  const t = useTranslations('teachers');
  const tCommon = useTranslations('common');
  const tStatus = useTranslations('status');
  const pageSize = 10;

  // Fetch teachers with search and pagination
  const { 
    data: teachersData, 
    isLoading,
    error 
  } = useTeachers({ 
    skip: page * pageSize,
    take: pageSize,
    search: searchQuery || undefined 
  });

  // Delete mutation
  const deleteTeacher = useDeleteTeacher();

  const teachers = teachersData?.items || [];
  const totalTeachers = teachersData?.total || 0;
  const totalPages = teachersData?.totalPages || 1;

  // Handle search with debounce effect
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setPage(0); // Reset to first page on search
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    if (confirm(t('confirmDelete'))) {
      try {
        await deleteTeacher.mutateAsync(id);
      } catch (err) {
        console.error('Failed to delete teacher:', err);
      }
    }
  };

  // Handle row click to navigate to teacher profile
  const handleRowClick = (teacher: Teacher) => {
    router.push(`/${locale}/admin/teachers/${teacher.id}`);
  };

  // Stats calculation
  const activeTeachers = teachers.filter(t => t.user?.status === 'ACTIVE').length;
  const totalLessons = teachers.reduce((sum, t) => sum + (t._count?.lessons || 0), 0);

  // Error state
  if (error) {
    console.error('Teachers fetch error:', error);
  }

  const teacherColumns = [
    {
      key: 'checkbox',
      header: (
        <input type="checkbox" className="w-4 h-4 rounded border-slate-300" />
      ),
      render: () => (
        <input 
          type="checkbox" 
          className="w-4 h-4 rounded border-slate-300" 
          onClick={(e) => e.stopPropagation()}
        />
      ),
    },
    {
      key: 'teacher',
      header: t('title'),
      sortable: true,
      render: (teacher: Teacher) => {
        const firstName = teacher.user?.firstName || '';
        const lastName = teacher.user?.lastName || '';
        const phone = teacher.user?.phone || t('noPhoneNumber');
        const initials = `${firstName[0] || ''}${lastName[0] || ''}` || '?';
        return (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-semibold">
              {initials}
            </div>
            <div>
              <p className="font-semibold text-slate-800 hover:text-blue-600 transition-colors">
                {firstName} {lastName}
              </p>
              <p className="text-sm text-slate-500">{phone}</p>
            </div>
          </div>
        );
      },
    },
    {
      key: 'groups',
      header: t('assignedGroups'),
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
              <span className="text-slate-400 text-sm">{t('noGroups')}</span>
            )}
          </div>
        );
      },
    },
    {
      key: 'status',
      header: t('status'),
      render: (teacher: Teacher) => {
        const status = teacher.user?.status || 'ACTIVE';
        return (
          <Badge variant={status === 'ACTIVE' ? 'success' : 'warning'}>
            {tStatus(status.toLowerCase())}
          </Badge>
        );
      },
    },
    {
      key: 'hourlyRate',
      header: t('rate'),
      className: 'text-right',
      render: (teacher: Teacher) => {
        const rate = typeof teacher.hourlyRate === 'string' ? parseFloat(teacher.hourlyRate) : Number(teacher.hourlyRate || 0);
        return (
          <span className="text-slate-700 font-medium">
            {new Intl.NumberFormat('hy-AM', {
              style: 'currency',
              currency: 'AMD',
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            }).format(rate)}/hr
          </span>
        );
      },
    },
    {
      key: 'actions',
      header: t('actions'),
      render: (teacher: Teacher) => (
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-blue-600 hover:text-blue-700 font-medium"
            onClick={(e) => {
              e.stopPropagation();
              // TODO: Implement edit functionality
            }}
          >
            {t('edit')}
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-red-600 hover:text-red-700 font-medium"
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(teacher.id);
            }}
          >
            {t('delete')}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <DashboardLayout 
      title={t('title')} 
      subtitle={t('subtitle')}
    >
      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatCard
            title={t('totalTeachers')}
            value={totalTeachers}
            change={{ value: '+4.5%', type: 'positive' }}
          />
          <StatCard
            title={t('activeTeachers')}
            value={activeTeachers || totalTeachers}
            change={{ value: '+2.1%', type: 'positive' }}
          />
          <StatCard
            title={t('totalLessons')}
            value={totalLessons}
          />
          <StatCard
            title={t('avgLessonsPerTeacher')}
            value={teachers.length > 0 ? Math.round(totalLessons / teachers.length) : 0}
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
              placeholder={t('searchPlaceholder')}
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
          <Button 
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium"
            onClick={() => setIsAddTeacherOpen(true)}
          >
            + {t('addTeacher')}
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
          onRowClick={handleRowClick}
          isLoading={isLoading}
          emptyMessage={searchQuery ? t('noTeachersMatch') : t('noTeachersFound')}
        />

        {/* Pagination */}
        <div className="flex items-center justify-between text-sm text-slate-500">
          <span>
            {t('showing', {
              start: page * pageSize + 1,
              end: Math.min((page + 1) * pageSize, totalTeachers),
              total: totalTeachers
            })}
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
            <span>{t('page', { current: page + 1, total: totalPages })}</span>
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
              <div className="p-3 bg-amber-50 rounded-xl">
                <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-800 mb-2">{t('salaryCalculation')}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  {t('salaryDescription')}
                </p>
                <button 
                  className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
                  onClick={() => router.push(`/${locale}/admin/finance`)}
                >
                  {t('viewSalaries')}
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
                <h3 className="font-semibold text-slate-800 mb-2">{t('staffWorkload')}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  {teachers.length > 0 
                    ? t('workloadDescription', { avg: Math.round(totalLessons / teachers.length) })
                    : t('workloadNoTeachers')}
                </p>
                <button 
                  className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
                  onClick={() => router.push(`/${locale}/admin/analytics`)}
                >
                  {t('viewAnalytics')}
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
