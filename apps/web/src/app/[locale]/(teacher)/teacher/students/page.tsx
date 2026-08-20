'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { readUrlSearchParam } from '@/shared/lib/url-search-params';
import { useAppSearchUrl } from '@/shared/hooks/useAppSearchUrl';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';
import { useMyAssignedStudents, studentKeys, StudentDetailsModal, type Student } from '@/features/students';
import { isOnboardingItem } from '@/features/students/types';
import { teacherApproveLead, teacherTransferLead } from '@/features/crm/api/crm.api';
import { useMyGroups } from '@/features/groups/hooks/useGroups';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { StudentFeedbackModal } from '@/app/[locale]/(admin)/admin/students/components/StudentFeedbackModal';
import { cn } from '@/shared/lib/utils';
import { CUSTOM_MODAL_OVERLAY_CLASS, CUSTOM_MODAL_PANEL_CLASS } from '@/shared/lib/portal-form-sheet-classes';
import { ADMIN_ICON_BUTTON_CLASS } from '@/shared/lib/admin-control-theme';
import Image from 'next/image';

function getLevelDisplay(level?: string): string {
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
}

export default function TeacherStudentsPage() {
  const params = useParams();
  const tNav = useTranslations('nav');
  const tTeacherStudents = useTranslations('teacherStudents');
  const tStudents = useTranslations('students');
  const tCrm = useTranslations('crm');
  const tCommon = useTranslations('common');
  const { searchParams, urlRevision, replaceParams } = useAppSearchUrl();
  const locale = params.locale as string;
  const [searchQuery, setSearchQuery] = useState('');
  const [transferLeadId, setTransferLeadId] = useState<string | null>(null);
  const [transferComment, setTransferComment] = useState('');
  const [feedbackStudent, setFeedbackStudent] = useState<Student | null>(null);
  const queryClient = useQueryClient();

  const { isHydrated, isAuthenticated, tokens } = useAuthStore();
  const isAuthReady = isHydrated && isAuthenticated && !!tokens?.accessToken;

  const { data: groups, isLoading: isLoadingGroups } = useMyGroups();
  const groupsList = useMemo(() => groups || [], [groups]);
  const [pendingGroupId, setPendingGroupId] = useState<string | null>(null);

  const urlGroupId = readUrlSearchParam('groupId', searchParams, urlRevision);
  const detailsStudentId = readUrlSearchParam('studentId', searchParams, urlRevision);

  const validSelectedGroupId = useMemo(() => {
    const effectiveGroupId = pendingGroupId ?? urlGroupId;
    if (!effectiveGroupId || isLoadingGroups) return null;
    const exists = groupsList.some((g) => g.id === effectiveGroupId);
    return exists ? effectiveGroupId : null;
  }, [pendingGroupId, urlGroupId, groupsList, isLoadingGroups]);

  useEffect(() => {
    if (pendingGroupId !== null && urlGroupId === pendingGroupId) {
      setPendingGroupId(null);
    }
  }, [pendingGroupId, urlGroupId, urlRevision]);

  useEffect(() => {
    if (isLoadingGroups) return;
    if (groupsList.length === 0) {
      if (urlGroupId) {
        replaceParams({ groupId: null });
      }
      return;
    }
    const needsUpdate = (urlGroupId && !groupsList.some((g) => g.id === urlGroupId)) || !urlGroupId;
    if (needsUpdate && pendingGroupId === null) {
      replaceParams({ groupId: groupsList[0].id });
    }
  }, [groupsList, isLoadingGroups, pendingGroupId, replaceParams, urlGroupId, urlRevision]);

  const { data: studentsData, isLoading: isLoadingStudents } = useMyAssignedStudents({
    take: 100,
    groupId: validSelectedGroupId || undefined,
    search: searchQuery || undefined,
  });
  const items = studentsData?.items || [];

  const approveMutation = useMutation({
    mutationFn: teacherApproveLead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...studentKeys.all, 'my-assigned'] });
    },
  });

  const transferMutation = useMutation({
    mutationFn: ({ leadId, comment }: { leadId: string; comment: string }) =>
      teacherTransferLead(leadId, comment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...studentKeys.all, 'my-assigned'] });
      setTransferLeadId(null);
      setTransferComment('');
    },
  });

  const selectedGroup = useMemo(() => {
    if (!validSelectedGroupId) return null;
    return groupsList.find((g) => g.id === validSelectedGroupId) || null;
  }, [validSelectedGroupId, groupsList]);

  const handleGroupSelect = (groupId: string) => {
    setPendingGroupId(groupId);
    replaceParams({ groupId, studentId: null });
  };

  const isLoading = !isAuthReady || isLoadingGroups || isLoadingStudents;

  return (
    <DashboardLayout
      title={tNav('myStudents')}
      subtitle={tTeacherStudents('subtitle')}
    >
      <div className="space-y-4">
        {/* Group tabs */}
        <div className="rounded-xl border border-[rgba(14,14,16,0.07)] bg-white p-2">
          {!isAuthReady || isLoadingGroups ? (
            <div className="flex gap-2 p-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-10 w-40 animate-pulse rounded-lg bg-[#f1f1f2]"
                />
              ))}
            </div>
          ) : groupsList.length === 0 ? (
            <div className="p-6 text-center text-sm text-[#8b8b90]">
              {tTeacherStudents('noGroupsAssignedHint')}
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {groupsList.map((group) => {
                const isSelected = validSelectedGroupId === group.id;
                const studentCount = group._count?.students ?? 0;
                return (
                  <button
                    key={group.id}
                    type="button"
                    onClick={() => handleGroupSelect(group.id)}
                    className={cn(
                      'rounded-lg border px-3 py-2 text-left transition-colors',
                      isSelected
                        ? 'border-primary bg-primary/10'
                        : 'border-[rgba(14,14,16,0.07)] bg-white hover:bg-[#fafafa]',
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          'text-sm font-semibold',
                          isSelected ? 'text-primary' : 'text-[#1010a3]',
                        )}
                      >
                        {group.name}
                      </span>
                    </div>
                    <div className="mt-0.5 text-xs text-[#8b8b90]">
                      {group.level ? getLevelDisplay(group.level) : tTeacherStudents('noLevel')} ·{' '}
                      {tTeacherStudents('studentCount', { count: studentCount })}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Students Content */}
        <div className="overflow-hidden rounded-xl border border-[rgba(14,14,16,0.07)] bg-white">
          {selectedGroup ? (
            <div className="border-b border-[rgba(14,14,16,0.07)] bg-[#fafafa] p-4">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-[#1010a3]">{selectedGroup.name}</h3>
              </div>
              <p className="mt-1 text-sm text-[#8b8b90]">
                {selectedGroup.level ? getLevelDisplay(selectedGroup.level) : tTeacherStudents('noLevel')} ·{' '}
                {tTeacherStudents('studentCount', { count: items.length })}
              </p>
            </div>
          ) : null}

          <div className="border-b border-[rgba(14,14,16,0.07)] p-4">
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8b8b90]"
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
                placeholder={tStudents('searchStudents')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg bg-[#f6f6f7] py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div className="divide-y divide-[rgba(14,14,16,0.07)]">
            {isLoading ? (
              <div className="space-y-4 p-8">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center gap-3 animate-pulse">
                    <div className="h-10 w-10 rounded-full bg-[#f1f1f2]" />
                    <div className="flex-1">
                      <div className="mb-2 h-4 w-1/3 rounded bg-[#f1f1f2]" />
                      <div className="h-3 w-1/2 rounded bg-[#f1f1f2]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="p-12 text-center text-sm text-[#8b8b90]">
                {searchQuery
                  ? tTeacherStudents('noStudentsSearch')
                  : tTeacherStudents('noStudentsInGroup')}
              </div>
            ) : (
              items.map((item) => {
                if (isOnboardingItem(item)) {
                  const name =
                    [item.firstName, item.lastName].filter(Boolean).join(' ') || tTeacherStudents('noName');
                  const initials =
                    (item.firstName?.[0] ?? '') + (item.lastName?.[0] ?? '') || '?';
                  const canApproveTransfer =
                    item.status === 'FIRST_LESSON' &&
                    !item.teacherApprovedAt &&
                    !item.transferFlag;
                  return (
                    <div
                      key={`onboarding-${item.leadId}`}
                      className="border-l-2 border-amber-200 bg-amber-50/80 p-4 transition-colors hover:bg-amber-100/80"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-200 font-semibold text-amber-800">
                            {initials}
                          </div>
                          <div>
                            <p className="font-medium text-[#1010a3]">
                              {name}
                              <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-xs font-normal text-amber-700">
                                {tCommon('onboarding')}
                              </span>
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {item.teacherApprovedAt ? (
                            <span
                              className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-700"
                              title={tCrm('approved')}
                              aria-label={tCrm('approved')}
                            >
                              ✓
                            </span>
                          ) : item.transferFlag ? (
                            <span className="rounded bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800">
                              {tTeacherStudents('transferRequested')}
                            </span>
                          ) : canApproveTransfer ? (
                            <>
                              <button
                                type="button"
                                onClick={() => approveMutation.mutate(item.leadId)}
                                disabled={approveMutation.isPending}
                                className="rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                              >
                                {tTeacherStudents('approve')}
                              </button>
                              <button
                                type="button"
                                onClick={() => setTransferLeadId(item.leadId)}
                                disabled={transferMutation.isPending}
                                className="rounded-lg border border-amber-500 px-3 py-1.5 text-sm font-medium text-amber-700 hover:bg-amber-50"
                              >
                                {tCrm('transfer')}
                              </button>
                            </>
                          ) : (
                            <span className="text-xs text-[#8b8b90]">
                              {tTeacherStudents('firstLessonPending')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                }

                const student = item;
                const initials = `${student.user.firstName[0]}${student.user.lastName[0]}`;
                const avatarUrl = student.user.avatarUrl;
                const openStudentProfile = () =>
                  replaceParams({ studentId: student.id }, { mode: 'push' });
                return (
                  <div
                    key={student.id}
                    role="button"
                    tabIndex={0}
                    onClick={openStudentProfile}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        openStudentProfile();
                      }
                    }}
                    className="cursor-pointer p-4 transition-colors hover:bg-[#fafafa]"
                    aria-label={`${tTeacherStudents('viewProfile')}: ${student.user.firstName} ${student.user.lastName}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {avatarUrl ? (
                          <Image
                            src={avatarUrl}
                            alt={`${student.user.firstName} ${student.user.lastName}`}
                            width={40}
                            height={40}
                            className="h-10 w-10 rounded-full object-cover"
                            unoptimized
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary font-semibold text-white">
                            {initials}
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-[#1010a3]">
                            {student.user.firstName} {student.user.lastName}
                          </p>
                          {student.group?.name && (
                            <p className="text-xs text-[#8b8b90]">
                              {student.group.name}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            setFeedbackStudent(student);
                          }}
                          onKeyDown={(event) => event.stopPropagation()}
                          title={tTeacherStudents('viewFeedbackHistory')}
                          aria-label={tTeacherStudents('viewFeedbackHistory')}
                          className={`${ADMIN_ICON_BUTTON_CLASS} text-[#8b8b90] hover:bg-primary/10 hover:text-primary`}
                        >
                          <svg
                            className="h-5 w-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 10h.01M12 10h.01M16 10h.01M21 12a9 9 0 01-9 9 9 9 0 01-3.87-.87L3 21l.87-5.13A9 9 0 1121 12z"
                            />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            openStudentProfile();
                          }}
                          onKeyDown={(event) => event.stopPropagation()}
                          className="rounded-lg px-3 py-1.5 text-sm text-primary transition-colors hover:bg-primary/10"
                        >
                          {tTeacherStudents('viewProfile')}
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

      <StudentDetailsModal
        studentId={detailsStudentId}
        open={!!detailsStudentId}
        onClose={() => replaceParams({ studentId: null })}
        locale={locale}
        audience="teacher"
        onFeedback={(student) => setFeedbackStudent(student)}
      />

      {/* Feedback history modal */}
      <StudentFeedbackModal
        open={!!feedbackStudent}
        onOpenChange={(open) => {
          if (!open) setFeedbackStudent(null);
        }}
        student={feedbackStudent}
      />

      {/* Transfer modal for onboarding leads */}
      {transferLeadId && (
        <>
          <div className={CUSTOM_MODAL_OVERLAY_CLASS} aria-hidden="true" />
          <div className={cn(CUSTOM_MODAL_PANEL_CLASS, 'max-w-md p-6')}>
            <h3 className="mb-2 text-lg font-semibold text-[#1010a3]">{tTeacherStudents('transferTitle')}</h3>
            <p className="mb-4 text-sm text-[#8b8b90]">
              {tTeacherStudents('transferDescription')}
            </p>
            <textarea
              value={transferComment}
              onChange={(e) => setTransferComment(e.target.value)}
              placeholder={tTeacherStudents('transferPlaceholder')}
              rows={4}
              className="mb-4 w-full rounded-lg border border-[rgba(14,14,16,0.07)] px-3 py-2 text-sm"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setTransferLeadId(null);
                  setTransferComment('');
                }}
                className="rounded-lg border border-[rgba(14,14,16,0.07)] px-4 py-2 text-sm font-medium text-[#3b3b40]"
              >
                {tCommon('cancel')}
              </button>
              <button
                type="button"
                onClick={() =>
                  transferMutation.mutate({
                    leadId: transferLeadId,
                    comment: transferComment,
                  })
                }
                disabled={
                  transferComment.trim().length < 10 || transferMutation.isPending
                }
                className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50"
              >
                {tCommon('submit')}
              </button>
            </div>
          </div>
        </>
      )}
    </DashboardLayout>
  );
}
