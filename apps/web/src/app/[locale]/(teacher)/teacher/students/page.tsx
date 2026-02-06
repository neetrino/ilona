'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';
import { useMyAssignedStudents } from '@/features/students/hooks/useStudents';
import type { Student } from '@/features/students/types';
import { cn } from '@/shared/lib/utils';
import Link from 'next/link';

export default function TeacherStudentsPage() {
  const params = useParams();
  const locale = params.locale as string;
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch students assigned to the teacher
  const { data: studentsData, isLoading } = useMyAssignedStudents({ take: 100 });
  const students = (studentsData?.items || []) as Student[];

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

  return (
    <DashboardLayout
      title="My Students"
      subtitle="View students assigned to you and provide feedback."
    >
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-slate-800">Assigned Students</h3>
              <p className="text-sm text-slate-500">
                {isLoading ? 'Loading...' : `${students.length} student${students.length !== 1 ? 's' : ''} assigned to you`}
              </p>
            </div>
          </div>

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
              placeholder="Search students by name or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
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
                {searchQuery ? 'No students found' : 'No assigned students yet'}
              </h3>
              <p className="text-sm text-slate-500">
                {searchQuery
                  ? 'Try adjusting your search query'
                  : 'Students assigned to you by an admin will appear here'}
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
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold">
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
                        {student.group && (
                          <p className="text-xs text-slate-400 mt-0.5">
                            Group: {student.group.name}
                            {student.group.level && ` • ${student.group.level}`}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/${locale}/teacher/students/${student.id}`}
                        className="px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
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
    </DashboardLayout>
  );
}
