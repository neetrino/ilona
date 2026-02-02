'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';
import { StatCard, DataTable, Badge, Button } from '@/shared/components/ui';
import { useGroups, useDeleteGroup, useToggleGroupActive, type Group } from '@/features/groups';

export default function GroupsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [showActiveOnly, setShowActiveOnly] = useState<boolean | undefined>(undefined);
  const pageSize = 10;

  // Fetch groups
  const { 
    data: groupsData, 
    isLoading 
  } = useGroups({ 
    skip: page * pageSize,
    take: pageSize,
    search: searchQuery || undefined,
    isActive: showActiveOnly,
  });

  // Mutations
  const deleteGroup = useDeleteGroup();
  const toggleActive = useToggleGroupActive();

  const groups = groupsData?.items || [];
  const totalGroups = groupsData?.total || 0;
  const totalPages = groupsData?.totalPages || 1;

  // Handle search
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setPage(0);
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this group?')) {
      try {
        await deleteGroup.mutateAsync(id);
      } catch (err) {
        console.error('Failed to delete group:', err);
      }
    }
  };

  // Handle toggle active
  const handleToggleActive = async (id: string) => {
    try {
      await toggleActive.mutateAsync(id);
    } catch (err) {
      console.error('Failed to toggle group status:', err);
    }
  };

  // Stats
  const activeGroups = groups.filter(g => g.isActive).length;
  const totalStudentsInGroups = groups.reduce((sum, g) => sum + (g._count?.students || 0), 0);
  const averageGroupSize = groups.length > 0 
    ? Math.round(totalStudentsInGroups / groups.length) 
    : 0;

  const groupColumns = [
    {
      key: 'name',
      header: 'Group',
      render: (group: Group) => (
        <div>
          <p className="font-semibold text-slate-800">{group.name}</p>
          <p className="text-sm text-slate-500">{group.description || 'No description'}</p>
        </div>
      ),
    },
    {
      key: 'level',
      header: 'Level',
      render: (group: Group) => (
        group.level ? (
          <Badge variant="info">{group.level}</Badge>
        ) : (
          <span className="text-slate-400">—</span>
        )
      ),
    },
    {
      key: 'center',
      header: 'Center',
      render: (group: Group) => (
        <span className="text-slate-700">{group.center?.name || '—'}</span>
      ),
    },
    {
      key: 'teacher',
      header: 'Teacher',
      render: (group: Group) => {
        if (!group.teacher) {
          return <span className="text-amber-600 text-sm">Not assigned</span>;
        }
        const firstName = group.teacher.user?.firstName || '';
        const lastName = group.teacher.user?.lastName || '';
        const initials = `${firstName[0] || ''}${lastName[0] || ''}` || '?';
        return (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 text-sm font-medium">
              {initials}
            </div>
            <span className="text-slate-700">{firstName} {lastName}</span>
          </div>
        );
      },
    },
    {
      key: 'students',
      header: 'Students',
      className: 'text-center',
      render: (group: Group) => (
        <div className="text-center">
          <span className="font-medium text-slate-800">{group._count?.students || 0}</span>
          <span className="text-slate-400">/{group.maxStudents}</span>
        </div>
      ),
    },
    {
      key: 'lessons',
      header: 'Lessons',
      className: 'text-center',
      render: (group: Group) => (
        <span className="text-slate-700">{group._count?.lessons || 0}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (group: Group) => (
        <Badge variant={group.isActive ? 'success' : 'default'}>
          {group.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (group: Group) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 font-medium">
            View
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-amber-600 hover:text-amber-700 font-medium"
            onClick={() => handleToggleActive(group.id)}
          >
            {group.isActive ? 'Deactivate' : 'Activate'}
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-red-600 hover:text-red-700 font-medium"
            onClick={() => handleDelete(group.id)}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <DashboardLayout 
      title="Group Management" 
      subtitle="Manage learning groups, assign teachers and track progress."
    >
      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatCard
            title="Total Groups"
            value={totalGroups}
          />
          <StatCard
            title="Active Groups"
            value={activeGroups || totalGroups}
            change={{ value: 'Currently running', type: 'positive' }}
          />
          <StatCard
            title="Students Enrolled"
            value={totalStudentsInGroups}
          />
          <StatCard
            title="Avg Group Size"
            value={averageGroupSize}
            change={{ value: 'students per group', type: 'neutral' }}
          />
        </div>

        {/* Filters & Actions */}
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="search"
              placeholder="Search groups by name..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
          
          {/* Filter by status */}
          <select
            value={showActiveOnly === undefined ? 'all' : showActiveOnly ? 'active' : 'inactive'}
            onChange={(e) => {
              const val = e.target.value;
              setShowActiveOnly(val === 'all' ? undefined : val === 'active');
              setPage(0);
            }}
            className="px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>

          <Button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium">
            + Add group
          </Button>
        </div>

        {/* Groups Table */}
        <DataTable
          columns={groupColumns}
          data={groups}
          keyExtractor={(group) => group.id}
          isLoading={isLoading}
          emptyMessage={searchQuery ? "No groups match your search" : "No groups found"}
        />

        {/* Pagination */}
        <div className="flex items-center justify-between text-sm text-slate-500">
          <span>
            Showing {Math.min(page * pageSize + 1, totalGroups)}-{Math.min((page + 1) * pageSize, totalGroups)} of {totalGroups} groups
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

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-50 rounded-xl">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-800 mb-2">Bulk Student Assignment</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Quickly assign multiple students to groups using our batch assignment tool.
                </p>
                <button className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700">
                  Open Assignment Tool
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-green-50 rounded-xl">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-800 mb-2">Schedule Templates</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Create recurring lesson schedules for groups automatically.
                </p>
                <button className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700">
                  Manage Schedules
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
