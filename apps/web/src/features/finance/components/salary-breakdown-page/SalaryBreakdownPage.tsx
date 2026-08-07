'use client';

import { useState, type ReactNode } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAppSearchUrl } from '@/shared/hooks/useAppSearchUrl';
import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';
import { DeleteConfirmationDialog } from '@/shared/components/ui';
import { useSalaryBreakdown, useExcludeLessonsFromSalary, financeKeys } from '@/features/finance/hooks/useFinance';
import { TeacherSubstituteBadge, substituteLessonChipClassName } from '@/features/finance';
import type { SalaryBreakdownLesson } from '@/features/finance/types';
import { formatCurrency } from '@/shared/lib/utils';
import { useQueryClient } from '@tanstack/react-query';
import { ObligationDetailsModal } from '@/features/finance/components/ObligationDetailsModal';
import { SelectAllCheckbox } from '@/app/[locale]/(admin)/admin/finance/components/SelectAllCheckbox';
import { initialsFromLabel } from './salary-breakdown-page.utils';
import { SalaryBreakdownHeader } from './SalaryBreakdownHeader';
import { SalaryBreakdownTable } from './SalaryBreakdownTable';
import { LoadingSpinner } from '@/shared/components/ui/loading-spinner';

export function SalaryBreakdownPage() {
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

  const openObligationModal = (lessonId: string) => {
    setSelectedLessonIdForObligation(lessonId);
    setIsObligationModalOpen(true);
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
            openObligationModal(lesson.lessonId);
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

  const deleteButtonLabel = allSelected
    ? t('deleteAll', { count: selectedLessonIds.size })
    : t('deleteSelected', { count: selectedLessonIds.size });

  return (
    <DashboardLayout title={pageTitle} subtitle={t('salaryBreakdownSubtitle')}>
      <div className="space-y-6">
        <SalaryBreakdownHeader
          onBack={() => router.push(getBackUrl())}
          backLabel={t('backToFinance')}
          isLoading={isLoading}
          error={error}
          hasLessons={!!breakdown && sortedLessons.length > 0}
          lessonCount={sortedLessons.length}
          monthLabel={formatMonth(month)}
          periodLabel={t('period')}
          totalSalary={totalSalary}
          totalDeduction={totalDeduction}
          totalNet={totalNet}
          substituteSummary={substituteSummary}
          substituteStatTitle={t('substituteStatTitle')}
          lessonsLabel={t('lessons')}
          earningsLabel={t('earnings')}
          deductionsLabel={t('deductions')}
          netTotalLabel={t('netTotal')}
          selectedCount={selectedLessonIds.size}
          deleteButtonLabel={deleteButtonLabel}
          onDeleteClick={handleDeleteClick}
          isDeletePending={excludeLessons.isPending}
        />

        {isLoading ? (
          cardState(
            <div className="p-12 flex items-center justify-center">
              <LoadingSpinner size="md" />
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
            <SalaryBreakdownTable
              sortedLessons={sortedLessons}
              breakdownColumns={breakdownColumns}
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSort={handleSort}
              selectedLessonIds={selectedLessonIds}
              onSelectOne={handleSelectOne}
              onOpenObligation={openObligationModal}
              formatDate={formatDate}
              teacherName={teacherName}
              emptyMessage={t('breakdownNoLessons')}
              totalsLabel={t('totals')}
              lessonDateLabel={t('lessonDate')}
              obligationLabel={t('obligation')}
              lessonSalaryLabel={t('lessonSalary')}
              lessonDeductionLabel={t('lessonDeduction')}
              rowTotalLabel={t('rowTotal')}
              substituteLessonBadgeLabel={t('substituteLessonBadge')}
              totalSalary={totalSalary}
              totalDeduction={totalDeduction}
              totalNet={totalNet}
            />,
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
