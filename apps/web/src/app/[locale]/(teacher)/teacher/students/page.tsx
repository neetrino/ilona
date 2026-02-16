'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter, useSearchParams, usePathname } from 'next/navigation';
import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';
import { useMyAssignedStudents } from '@/features/students/hooks/useStudents';
import { useMyGroups } from '@/features/groups/hooks/useGroups';
import type { Student } from '@/features/students/types';
import type { Group } from '@/features/groups/types';
import { cn } from '@/shared/lib/utils';
import Link from 'next/link';

export default function TeacherStudentsPage() {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const locale = params.locale as string;
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch teacher's groups
  const { data: groups, isLoading: isLoadingGroups } = useMyGroups();
  const groupsList = groups || [];

  // Get selected group from URL query params
  const urlGroupId = searchParams.get('groupId');

  // Validate and determine the actual selected group ID
  // Only use URL groupId if it exists in the teacher's groups
  const validSelectedGroupId = useMemo(() => {
    if (!urlGroupId || isLoadingGroups) return null;
    const groupExists = groupsList.some((g) => g.id === urlGroupId);
    return groupExists ? urlGroupId : null;
  }, [urlGroupId, groupsList, isLoadingGroups]);

  // Handle invalid groupId in URL: remove it and select first group if available
  // Also auto-select first group if none is selected
  useEffect(() => {
    // Wait for groups to finish loading
    if (isLoadingGroups) return;

    // If teacher has no groups, remove any groupId from URL
    if (groupsList.length === 0) {
      if (urlGroupId) {
        const params = new URLSearchParams(searchParams.toString());
        params.delete('groupId');
        const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
        router.replace(newUrl);
      }
      return;
    }

    // Teacher has groups - handle selection
    const needsUpdate = 
      // Case 1: URL has groupId but it's invalid (doesn't belong to teacher)
      (urlGroupId && !validSelectedGroupId) ||
      // Case 2: No groupId in URL and we have groups available
      (!urlGroupId);

    if (needsUpdate) {
      const params = new URLSearchParams(searchParams.toString());
      params.set('groupId', groupsList[0].id);
      router.replace(`${pathname}?${params.toString()}`);
    }
  }, [isLoadingGroups, groupsList, urlGroupId, validSelectedGroupId, pathname, router, searchParams]);

  // Fetch students assigned to the teacher, filtered by selected group
  // Only fetch if we have a valid selected group ID
  const { data: studentsData, isLoading: isLoadingStudents } = useMyAssignedStudents({
    take: 100,
    groupId: validSelectedGroupId || undefined,
  });
  const students = (studentsData?.items || []) as Student[];

  // Get selected group details
  const selectedGroup = useMemo(() => {
    if (!validSelectedGroupId) return null;
    return groupsList.find((g) => g.id === validSelectedGroupId) || null;
  }, [validSelectedGroupId, groupsList]);

  // Filter students by search
  const filteredStudents = students.filter((student) => {
    if (!searchQuery) return true;
    const fullName = `${student.user.firstName} ${student.user.lastName}`.toLowerCase();
    const phone = student.user.phone?.toLowerCase() || '';
    return (
      fullName.includes(searchQuery.toLowerCase()) ||
      phone.includes(searchQuery.toLowerCase())
    );
  });

  // Handle group selection
  const handleGroupSelect = (groupId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('groupId', groupId);
    router.push(`${pathname}?${params.toString()}`);
  };

  // Get level display text
  const getLevelDisplay = (level?: string) => {
    if (!level) return '';
    const levelMap: Record<string, string> = {
      A1: 'Beginner (A1)',
      A2: 'Elementary (A2)',
      B1: 'Intermediate (B1)',
      B2: 'Upper-Intermediate (B2)',
      C1: 'Advanced (C1)',
      C2: 'Proficient (C2)',
    };
    return levelMap[level] || level;
  };

  const isLoading = isLoadingGroups || isLoadingStudents;

  return (
    <DashboardLayout
      title="My Students"
      subtitle="View students in your groups and provide feedback."
    >
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Your Groups Sidebar */}
        <div className="lg:w-80 flex-shrink-0">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200">
              <h3 className="font-semibold text-slate-800">Your Groups</h3>
            </div>
            <div className="divide-y divide-slate-100 max-h-[calc(100vh-300px)] overflow-y-auto">
              {isLoadingGroups ? (
                <div className="p-4 space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-16 bg-slate-200 rounded-lg" />
                    </div>
                  ))}
                </div>
              ) : groupsList.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="w-12 h-12 mx-auto mb-3 bg-slate-100 rounded-full flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-slate-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                  </div>
                  <h4 className="text-sm font-semibold text-slate-800 mb-1">
                    No groups assigned yet
                  </h4>
                  <p className="text-xs text-slate-500">
                    Groups assigned to you will appear here
                  </p>
                </div>
              ) : (
                groupsList.map((group) => {
                  const isSelected = validSelectedGroupId === group.id;
                  const studentCount = group._count?.students || 0;

                  return (
                    <button
                      key={group.id}
                      onClick={() => handleGroupSelect(group.id)}
                      className={cn(
                        'w-full p-4 text-left transition-colors hover:bg-slate-50',
                        isSelected && 'bg-primary/10 border-l-4 border-primary'
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h4
                            className={cn(
                              'font-semibold text-sm mb-1 truncate',
                              isSelected ? 'text-primary' : 'text-slate-800'
                            )}
                          >
                            {group.name}
                          </h4>
                          <p className="text-xs text-slate-500 mb-1">
                            {group.level ? getLevelDisplay(group.level) : 'No level'}
                          </p>
                          <p className="text-xs text-slate-400">
                            {studentCount} student{studentCount !== 1 ? 's' : ''}
                          </p>
                        </div>
                        {isSelected && (
                          <div className="flex-shrink-0 w-2 h-2 rounded-full bg-primary mt-1" />
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Students Content Area */}
        <div className="flex-1 min-w-0">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            {/* Group Header */}
            {selectedGroup ? (
              <div className="p-4 border-b border-slate-200 bg-slate-50">
                <h3 className="font-semibold text-slate-800 mb-1">{selectedGroup.name}</h3>
                <p className="text-sm text-slate-500">
                  {selectedGroup.level ? getLevelDisplay(selectedGroup.level) : 'No level'} •{' '}
                  {filteredStudents.length} student{filteredStudents.length !== 1 ? 's' : ''}
                </p>
              </div>
            ) : groupsList.length > 0 && !isLoadingGroups ? (
              <div className="p-4 border-b border-slate-200 bg-slate-50">
                <h3 className="font-semibold text-slate-800 mb-1">All Students</h3>
                <p className="text-sm text-slate-500">
                  {filteredStudents.length} student{filteredStudents.length !== 1 ? 's' : ''} assigned to you
                </p>
              </div>
            ) : null}

            <div className="p-4 border-b border-slate-200">
              {/* Search */}
              <div className="relative">
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
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
                  placeholder="Search students..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            {/* Students List */}
            <div className="divide-y divide-slate-100">
              {isLoading ? (
                <div className="p-8 space-y-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-200" />
                        <div className="flex-1">
                          <div className="h-4 bg-slate-200 rounded w-1/3 mb-2" />
                          <div className="h-3 bg-slate-200 rounded w-1/2" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredStudents.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
                    <svg
                      className="w-8 h-8 text-slate-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-1">
                    {searchQuery ? 'No students found' : 'No students in this group'}
                  </h3>
                  <p className="text-sm text-slate-500">
                    {searchQuery
                      ? 'Try adjusting your search query'
                      : 'Students assigned to this group will appear here'}
                  </p>
                </div>
              ) : (
                filteredStudents.map((student) => {
                  const initials = `${student.user.firstName[0]}${student.user.lastName[0]}`;
                  const avatarUrl = student.user.avatarUrl;

                  return (
                    <div
                      key={student.id}
                      className="p-4 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {avatarUrl ? (
                            <img
                              src={avatarUrl}
                              alt={`${student.user.firstName} ${student.user.lastName}`}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-semibold">
                              {initials}
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-slate-800">
                              {student.user.firstName} {student.user.lastName}
                            </p>
                            <p className="text-sm text-slate-500">
                              {student.user.phone || 'No phone'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Link
                            href={`/${locale}/teacher/students/${student.id}?${searchParams.toString()}`}
                            className="px-3 py-1.5 text-sm text-primary hover:bg-primary/10 rounded-lg transition-colors"
                          >
                            View Profile
                          </Link>
                          <button className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                            Send Message
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
