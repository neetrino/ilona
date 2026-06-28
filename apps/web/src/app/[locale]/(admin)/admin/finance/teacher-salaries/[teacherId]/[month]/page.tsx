'use client';

import { useState, type ReactNode } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAppSearchUrl } from '@/shared/hooks/useAppSearchUrl';
import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';
import { DataTable } from '@/shared/components/ui';
import { Button, StatCard, DeleteConfirmationDialog } from '@/shared/components/ui';
import { useSalaryBreakdown, useExcludeLessonsFromSalary, financeKeys } from '@/features/finance/hooks/useFinance';
import { TeacherSubstituteBadge, substituteLessonChipClassName } from '@/features/finance';
import type { SalaryBreakdownLesson } from '@/features/finance/types';
import { cn } from '@/shared/lib/utils';
import { Trash2, ArrowLeft, Wallet, TrendingDown, TrendingUp } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { ObligationDetailsModal } from '@/features/finance/components/ObligationDetailsModal';
import { formatCurrency } from '@/shared/lib/utils';
import { SelectAllCheckbox } from '../../../components/SelectAllCheckbox';

function initialsFromLabel(label: string): string {
  const parts = label.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) {
    const w = parts[0];
    return w.slice(0, 2).toUpperCase();
  }
  const a = parts[0][0] ?? '';
  const b = parts[parts.length - 1][0] ?? '';
  return `${a}${b}`.toUpperCase() || '?';
}

export default function SalaryBreakdownPage() {
  const t = useTranslations('finance');
  const tCommon = useTranslations('common');
  const params = useParams();
  const router = useRouter();
  const { readParam } = useAppSearchUrl();
  const queryClient = useQueryClient();

  const teacherId = params.teacherId as string;
  const month = params.month as string;
  const locale = params.locale as string;

  const teacherNameFromUrl = readParam('teacherName');
  const teacherName = teacherNameFromUrl ? decodeURIComponent(teacherNameFromUrl) : t('teacher');

  const { data: breakdown, isLoading, error, refetch } = useSalaryBreakdown(teacherId, month, !!teacherId);
  const excludeLessons = useExcludeLessonsFromSalary();

  const [selectedLessonIds, setSelectedLessonIds] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<string>('lessonDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [selectedLessonIdForObligation, setSelectedLessonIdForObligation] = useState<string | null>(null);
  const [isObligationModalOpen, setIsObligationModalOpen] = useState(false);

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) {
      return '';
    }
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) {
      return '';
    }
    return date.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatMonth = (monthStr: string) => {
    if (!monthStr || monthStr.trim() === '') {
      return '';
    }
    const [year, monthNum] = monthStr.split('-');
    if (!year || !monthNum) {
      return '';
    }
    const yearNum = parseInt(year, 10);
    const monthNumParsed = parseInt(monthNum, 10);
    if (Number.isNaN(yearNum) || Number.isNaN(monthNumParsed) || monthNumParsed < 1 || monthNumParsed > 12) {
      return '';
    }
    const date = new Date(yearNum, monthNumParsed - 1);
    if (Number.isNaN(date.getTime())) {
      return '';
    }
    return date.toLocaleDateString(locale, { month: 'long', year: 'numeric' });
  };

  const handleSort = (key: string) => {
    if (sortBy === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(key);
      setSortOrder('asc');
    }
  };

  const sortedLessons = breakdown?.lessons
    ? [...breakdown.lessons].sort((a, b) => {
        let aVal: string | number;
        let bVal: string | number;

        if (sortBy === 'lessonDate') {
          const aDate = a.lessonDate ? new Date(a.lessonDate) : new Date(0);
          const bDate = b.lessonDate ? new Date(b.lessonDate) : new Date(0);
          aVal = Number.isNaN(aDate.getTime()) ? 0 : aDate.getTime();
          bVal = Number.isNaN(bDate.getTime()) ? 0 : bDate.getTime();
        } else if (sortBy === 'lessonName') {
          aVal = a.lessonName.toLowerCase();
          bVal = b.lessonName.toLowerCase();
        } else if (sortBy === 'salary') {
          aVal = a.salary;
          bVal = b.salary;
        } else if (sortBy === 'total') {
          aVal = a.total;
          bVal = b.total;
        } else {
          return 0;
        }

        if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      })
    : [];

  const allSelected =
    sortedLessons.length > 0 && sortedLessons.every((l) => selectedLessonIds.has(l.lessonId));
  const someSelected =
    sortedLessons.some((l) => selectedLessonIds.has(l.lessonId)) && !allSelected;

  const handleSelectAll = () => {
    if (allSelected) {
      setSelectedLessonIds(new Set());
    } else {
      setSelectedLessonIds(new Set(sortedLessons.map((l) => l.lessonId)));
    }
  };

  const handleSelectOne = (lessonId: string, checked: boolean) => {
    const newSet = new Set(selectedLessonIds);
    if (checked) {
      newSet.add(lessonId);
    } else {
      newSet.delete(lessonId);
    }
    setSelectedLessonIds(newSet);
  };

  const handleDeleteClick = () => {
    if (selectedLessonIds.size === 0) return;
    setDeleteError(null);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (selectedLessonIds.size === 0) return;

    setDeleteError(null);

    try {
      await excludeLessons.mutateAsync(Array.from(selectedLessonIds));
      setSelectedLessonIds(new Set());
      setIsDeleteDialogOpen(false);
      await refetch();
      queryClient.invalidateQueries({ queryKey: financeKeys.salaries() });
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to exclude lessons from salary. Please try again.';
      setDeleteError(errorMessage);
    }
  };

  const getBackUrl = () => {
    const tab = readParam('tab');
    const salariesPage = readParam('salariesPage');
    const salaryStatus = readParam('salaryStatus');
    const q = readParam('q');

    const backParams = new URLSearchParams();
    if (tab) backParams.set('tab', tab);
    if (salariesPage) backParams.set('salariesPage', salariesPage);
    if (salaryStatus) backParams.set('salaryStatus', salaryStatus);
    if (q) backParams.set('q', q);

    const query = backParams.toString();
    return query ? `/${locale}/admin/finance?${query}` : `/${locale}/admin/finance`;
  };

  const teacherInitials = initialsFromLabel(teacherName);
  const substituteSummary = breakdown?.substituteSummary ?? {
    lessonCount: 0,
    netAmount: 0,
  };

  const breakdownColumns = [
    {
      key: 'checkbox',
      header: (
        <SelectAllCheckbox
          checked={allSelected}
          indeterminate={someSelected}
          onChange={handleSelectAll}
          disabled={isLoading}
        />
      ),
      className: '!pl-4 !pr-2 w-12',
      render: (lesson: SalaryBreakdownLesson) => (
        <input
          type="checkbox"
          checked={selectedLessonIds.has(lesson.lessonId)}
          onChange={(e) => handleSelectOne(lesson.lessonId, e.target.checked)}
          onClick={(e) => e.stopPropagation()}
          className="w-4 h-4 rounded border-[rgba(14,14,16,0.12)] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isLoading}
          aria-label={`Select lesson ${lesson.lessonName}`}
        />
      ),
    },
    {
      key: 'teacherName',
      header: t('teacher'),
      render: (lesson: SalaryBreakdownLesson) => {
        const isSub = lesson.isSubstituteLesson === true;
        return (
          <div className="flex items-center gap-3">
            <div className="relative shrink-0">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f1f1f2] text-sm font-semibold text-[#3b3b40]">
                {teacherInitials}
              </div>
              {isSub ? <TeacherSubstituteBadge /> : null}
            </div>
            <div className="min-w-0">
              <p className="truncate font-semibold text-[#3b3b40]">{teacherName}</p>
              <p className="truncate text-sm text-[#8b8b90]">
                {month ? formatMonth(month) : t('period')}
              </p>
            </div>
          </div>
        );
      },
    },
    {
      key: 'lessonName',
      header: t('breakdownGroup'),
      sortable: true,
      render: (lesson: SalaryBreakdownLesson) => {
        const primary = lesson.groupName || lesson.lessonName;
        const secondary =
          lesson.groupName && lesson.lessonName && lesson.groupName !== lesson.lessonName
            ? lesson.lessonName
            : '';
        const isSub = lesson.isSubstituteLesson === true;
        return (
          <div className="min-w-0">
            <div className="flex items-start gap-2 min-w-0">
              {isSub ? (
                <span className={`${substituteLessonChipClassName} mt-0.5`}>
                  {t('substituteLessonBadge')}
                </span>
              ) : null}
              <p className="font-semibold text-[#3b3b40] truncate min-w-0">{primary}</p>
            </div>
            {secondary ? <p className="text-sm text-[#8b8b90] truncate">{secondary}</p> : null}
            {isSub && lesson.mainTeacherName ? (
              <p className="mt-1 text-xs leading-snug text-violet-900">
                {t('substituteForMainTeacher', { name: lesson.mainTeacherName })}
              </p>
            ) : null}
          </div>
        );
      },
    },
    {
      key: 'lessonDate',
      header: t('lessonDate'),
      sortable: true,
      render: (lesson: SalaryBreakdownLesson) => (
        <span className="text-[#8b8b90]">{formatDate(lesson.lessonDate)}</span>
      ),
    },
    {
      key: 'obligation',
      header: t('obligation'),
      className: 'text-center',
      render: (lesson: SalaryBreakdownLesson) => (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedLessonIdForObligation(lesson.lessonId);
            setIsObligationModalOpen(true);
          }}
          className="text-sm font-medium text-[#3b3b40] hover:text-[#1010a3] transition-colors mx-auto block"
          aria-label={`View obligation details for ${lesson.lessonName}`}
        >
          {lesson.obligationCompleted}/{lesson.obligationTotal}
        </button>
      ),
    },
    {
      key: 'salary',
      header: t('lessonSalary'),
      sortable: true,
      render: (lesson: SalaryBreakdownLesson) => (
        <span className="font-semibold text-[#3b3b40]">{formatCurrency(lesson.salary)}</span>
      ),
    },
    {
      key: 'deduction',
      header: t('lessonDeduction'),
      render: (lesson: SalaryBreakdownLesson) => (
        <span className="font-medium text-red-600">
          {lesson.deduction > 0 ? '−' : ''}
          {formatCurrency(lesson.deduction)}
        </span>
      ),
    },
    {
      key: 'total',
      header: t('rowTotal'),
      sortable: true,
      render: (lesson: SalaryBreakdownLesson) => (
        <span className="font-semibold text-[#3b3b40]">{formatCurrency(lesson.total)}</span>
      ),
    },
  ];

  const totalSalary = sortedLessons.reduce((sum, l) => sum + l.salary, 0);
  const totalDeduction = sortedLessons.reduce((sum, l) => sum + l.deduction, 0);
  const totalNet = sortedLessons.reduce((sum, l) => sum + l.total, 0);

  const pageTitle = month
    ? `${t('salaryBreakdown')}: ${teacherName} — ${formatMonth(month)}`
    : `${t('salaryBreakdown')}: ${teacherName}`;

  const cardState = (children: ReactNode) => (
    <div className="rounded-3xl border border-[rgba(14,14,16,0.07)] bg-white overflow-hidden">{children}</div>
  );

  return (
    <DashboardLayout title={pageTitle} subtitle={t('salaryBreakdownSubtitle')}>
      <div className="space-y-6">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(getBackUrl())}
          className="flex items-center gap-2 rounded-xl px-6 py-3 font-medium w-full sm:w-auto justify-center"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('backToFinance')}
        </Button>

        {!isLoading && !error && breakdown && sortedLessons.length > 0 && (
          <>
            <div
              className={cn(
                'grid grid-cols-2 gap-4 md:gap-5 lg:gap-6',
                substituteSummary.lessonCount > 0 ? 'lg:grid-cols-5' : 'lg:grid-cols-4',
              )}
            >
              <StatCard
                title={t('lessons')}
                value={sortedLessons.length}
                change={{ value: formatMonth(month) || t('period'), type: 'neutral' }}
              />
              <StatCard title={t('earnings')} value={formatCurrency(totalSalary)} />
              <StatCard title={t('deductions')} value={formatCurrency(totalDeduction)} />
              <StatCard title={t('netTotal')} value={formatCurrency(totalNet)} />
              {substituteSummary.lessonCount > 0 ? (
                <StatCard
                  title={t('substituteStatTitle')}
                  value={formatCurrency(substituteSummary.netAmount)}
                  change={{
                    value: t('lessons') + `: ${substituteSummary.lessonCount}`,
                    type: 'neutral',
                  }}
                />
              ) : null}
            </div>
          </>
        )}

        {selectedLessonIds.size > 0 && (
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end sm:gap-4">
            <Button
              type="button"
              variant="destructive"
              className="px-6 py-3 rounded-xl font-medium flex items-center gap-2 w-full sm:w-auto justify-center"
              onClick={handleDeleteClick}
              disabled={excludeLessons.isPending}
            >
              <Trash2 className="w-4 h-4" />
              {allSelected
                ? t('deleteAll', { count: selectedLessonIds.size })
                : t('deleteSelected', { count: selectedLessonIds.size })}
            </Button>
          </div>
        )}

        {isLoading ? (
          cardState(
            <div className="p-12 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1010a3]" />
            </div>,
          )
        ) : error ? (
          cardState(
            <div className="px-6 py-12 text-center text-red-600 text-sm">{t('breakdownLoadError')}</div>,
          )
        ) : !breakdown || sortedLessons.length === 0 ? (
          cardState(
            <div className="px-6 py-12 text-center text-[#8b8b90] text-sm">{t('breakdownNoLessons')}</div>,
          )
        ) : (
          cardState(
            <>
              <div className="space-y-3 p-3 sm:hidden">
                {sortedLessons.map((lesson) => (
                  <article
                    key={`mobile-${lesson.lessonId}`}
                    className="rounded-2xl border border-[rgba(14,14,16,0.08)] bg-white px-4 py-3.5 shadow-[0_1px_2px_rgba(14,14,16,0.03)]"
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={selectedLessonIds.has(lesson.lessonId)}
                        onChange={(e) => handleSelectOne(lesson.lessonId, e.target.checked)}
                        className="my-auto h-5 w-5 rounded border-[rgba(14,14,16,0.2)] accent-[#1010a3]"
                        aria-label={`Select lesson ${lesson.lessonName}`}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start gap-2 min-w-0">
                          {lesson.isSubstituteLesson ? (
                            <span className={`${substituteLessonChipClassName} mt-0.5`}>
                              {t('substituteLessonBadge')}
                            </span>
                          ) : null}
                          <p className="truncate text-[1.05rem] font-semibold text-[#1f2937]">
                            {lesson.groupName || lesson.lessonName}
                          </p>
                        </div>
                        <p className="mt-1 text-sm text-[#64748b]">{teacherName}</p>
                      </div>
                    </div>

                    <div className="my-3 border-t border-[rgba(14,14,16,0.08)]" />

                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-2xl border border-[rgba(14,14,16,0.08)] px-3 py-3">
                        <p className="text-sm text-[#64748b]">{t('lessonDate')}</p>
                        <p className="mt-1 text-sm font-semibold text-[#0f172a]">{formatDate(lesson.lessonDate)}</p>
                      </div>
                      <div className="rounded-2xl border border-[rgba(14,14,16,0.08)] px-3 py-3">
                        <p className="text-sm text-[#64748b]">{t('obligation')}</p>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLessonIdForObligation(lesson.lessonId);
                            setIsObligationModalOpen(true);
                          }}
                          className="mt-1 text-sm font-semibold text-[#1010a3]"
                        >
                          {lesson.obligationCompleted}/{lesson.obligationTotal}
                        </button>
                      </div>
                      <div className="rounded-2xl border border-[rgba(14,14,16,0.08)] px-3 py-3">
                        <p className="text-sm text-[#64748b]">{t('lessonSalary')}</p>
                        <p className="mt-1 text-sm font-semibold text-[#0f172a]">{formatCurrency(lesson.salary)}</p>
                      </div>
                      <div className="rounded-2xl border border-[rgba(14,14,16,0.08)] px-3 py-3">
                        <p className="text-sm text-[#64748b]">{t('lessonDeduction')}</p>
                        <p className="mt-1 text-sm font-semibold text-red-600">
                          {lesson.deduction > 0 ? '−' : ''}
                          {formatCurrency(lesson.deduction)}
                        </p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              <div className="hidden sm:block">
                <DataTable
                  columns={breakdownColumns}
                  data={sortedLessons}
                  keyExtractor={(lesson) => lesson.lessonId}
                  isLoading={false}
                  emptyMessage={t('breakdownNoLessons')}
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                  onSort={handleSort}
                  embedInParentCard
                />
              </div>

              <div className="border-t border-[rgba(14,14,16,0.07)] bg-[#fafafa]/60">
                <div className="space-y-3 p-3 sm:hidden">
                  <div className="rounded-2xl bg-white p-4 shadow-[0_1px_2px_rgba(14,14,16,0.03)]">
                    <p className="mb-4 text-[1.9rem] font-semibold leading-none text-[#111827]">{t('totals')}</p>
                    <div className="rounded-2xl border border-[rgba(14,14,16,0.08)] bg-[#fafafa] px-4 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <span className="inline-flex size-11 items-center justify-center rounded-full bg-[#eef0ff] text-[#5b6470]">
                          <Wallet className="h-5 w-5" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-[#7c828d]">{t('lessonSalary')}</p>
                        </div>
                        <p className="whitespace-nowrap text-right text-[clamp(1rem,5.3vw,1.5rem)] font-semibold leading-none text-[#111827]">
                          {formatCurrency(totalSalary)}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-4">
                      <div className="rounded-2xl border border-[rgba(14,14,16,0.08)] bg-[#fafafa] px-4 py-3">
                        <div className="mb-2 inline-flex size-11 items-center justify-center rounded-full bg-[#ffeef0] text-[#d22839]">
                          <TrendingDown className="h-5 w-5" />
                        </div>
                        <p className="text-sm text-[#5f6672]">{t('lessonDeduction')}</p>
                        <p className="mt-1 whitespace-nowrap text-[clamp(1rem,5.2vw,1.5rem)] font-semibold leading-none text-[#d22839]">
                          {totalDeduction > 0 ? '−' : ''}
                          {formatCurrency(totalDeduction)}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-[rgba(14,14,16,0.08)] bg-[#fafafa] px-4 py-3">
                        <div className="mb-2 inline-flex size-11 items-center justify-center rounded-full bg-[#e9f8f0] text-[#0f8a47]">
                          <TrendingUp className="h-5 w-5" />
                        </div>
                        <p className="text-sm text-[#5f6672]">{t('rowTotal')}</p>
                        <p className="mt-1 whitespace-nowrap text-[clamp(1rem,5.2vw,1.5rem)] font-semibold leading-none text-[#111827]">
                          {formatCurrency(totalNet)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="hidden flex-col gap-3 px-6 py-4 text-sm sm:flex">
                  <span className="text-[#8b8b90] font-medium uppercase tracking-wide">{t('totals')}</span>
                  <div className="flex flex-col gap-2">
                    <span className="flex items-center justify-between gap-4">
                      <span className="text-[#8b8b90]">{t('lessonSalary')}</span>
                      <span className="font-semibold text-[#3b3b40]">{formatCurrency(totalSalary)}</span>
                    </span>
                    <span className="flex items-center justify-between gap-4">
                      <span className="text-[#8b8b90]">{t('lessonDeduction')}</span>
                      <span className="font-medium text-red-600">
                        {totalDeduction > 0 ? '−' : ''}
                        {formatCurrency(totalDeduction)}
                      </span>
                    </span>
                    <span className="flex items-center justify-between gap-4">
                      <span className="text-[#8b8b90]">{t('rowTotal')}</span>
                      <span className="font-semibold text-[#3b3b40]">{formatCurrency(totalNet)}</span>
                    </span>
                  </div>
                </div>
              </div>
            </>,
          )
        )}
      </div>

      <DeleteConfirmationDialog
        open={isDeleteDialogOpen}
        onOpenChange={(open) => {
          setIsDeleteDialogOpen(open);
          if (!open) setDeleteError(null);
        }}
        onConfirm={handleDeleteConfirm}
        title={t('excludeLessonsTitle')}
        description={`${t('excludeLessonsLead', { count: selectedLessonIds.size })} ${t('excludeLessonsDetail')}`}
        isLoading={excludeLessons.isPending}
        error={deleteError}
        confirmLabel={t('excludeLessonsConfirm')}
        cancelLabel={tCommon('cancel')}
        loadingLabel={t('excluding')}
      />

      <ObligationDetailsModal
        lessonId={selectedLessonIdForObligation}
        open={isObligationModalOpen}
        onClose={() => {
          setIsObligationModalOpen(false);
          setSelectedLessonIdForObligation(null);
        }}
      />
    </DashboardLayout>
  );
}
