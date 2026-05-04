'use client';

import { useState, type ReactNode } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';
import { DataTable } from '@/shared/components/ui';
import { Button, StatCard } from '@/shared/components/ui';
import { useSalaryBreakdown, useExcludeLessonsFromSalary, financeKeys } from '@/features/finance/hooks/useFinance';
import type { SalaryBreakdownLesson } from '@/features/finance/types';
import { Trash2, ArrowLeft } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { ObligationDetailsModal } from '@/features/finance/components/ObligationDetailsModal';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/shared/components/ui';
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
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const teacherId = params.teacherId as string;
  const month = params.month as string;
  const locale = params.locale as string;

  const teacherNameFromUrl = searchParams.get('teacherName');
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
    const tab = searchParams.get('tab');
    const salariesPage = searchParams.get('salariesPage');
    const salaryStatus = searchParams.get('salaryStatus');
    const q = searchParams.get('q');

    const backParams = new URLSearchParams();
    if (tab) backParams.set('tab', tab);
    if (salariesPage) backParams.set('salariesPage', salariesPage);
    if (salaryStatus) backParams.set('salaryStatus', salaryStatus);
    if (q) backParams.set('q', q);

    const query = backParams.toString();
    return query ? `/${locale}/admin/finance?${query}` : `/${locale}/admin/finance`;
  };

  const teacherInitials = initialsFromLabel(teacherName);

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
          className="w-4 h-4 rounded border-slate-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isLoading}
          aria-label={`Select lesson ${lesson.lessonName}`}
        />
      ),
    },
    {
      key: 'teacherName',
      header: t('teacher'),
      render: () => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-semibold shrink-0">
            {teacherInitials}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-slate-800 truncate">{teacherName}</p>
            <p className="text-sm text-slate-500 truncate">
              {month ? formatMonth(month) : t('period')}
            </p>
          </div>
        </div>
      ),
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
        return (
          <div className="min-w-0">
            <p className="font-semibold text-slate-800 truncate">{primary}</p>
            {secondary ? <p className="text-sm text-slate-500 truncate">{secondary}</p> : null}
          </div>
        );
      },
    },
    {
      key: 'lessonDate',
      header: t('lessonDate'),
      sortable: true,
      render: (lesson: SalaryBreakdownLesson) => (
        <span className="text-slate-500">{formatDate(lesson.lessonDate)}</span>
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
          className="text-sm font-medium text-slate-600 hover:text-primary transition-colors mx-auto block"
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
        <span className="font-semibold text-slate-800">{formatCurrency(lesson.salary)}</span>
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
        <span className="font-semibold text-slate-800">{formatCurrency(lesson.total)}</span>
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
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">{children}</div>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5 lg:gap-6">
            <StatCard
              title={t('lessons')}
              value={sortedLessons.length}
              change={{ value: formatMonth(month) || t('period'), type: 'neutral' }}
            />
            <StatCard title={t('earnings')} value={formatCurrency(totalSalary)} />
            <StatCard title={t('deductions')} value={formatCurrency(totalDeduction)} />
            <StatCard title={t('netTotal')} value={formatCurrency(totalNet)} />
          </div>
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
              Delete ({selectedLessonIds.size})
            </Button>
          </div>
        )}

        {isLoading ? (
          cardState(
            <div className="p-12 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>,
          )
        ) : error ? (
          cardState(
            <div className="px-6 py-12 text-center text-red-600 text-sm">{t('breakdownLoadError')}</div>,
          )
        ) : !breakdown || sortedLessons.length === 0 ? (
          cardState(
            <div className="px-6 py-12 text-center text-slate-500 text-sm">{t('breakdownNoLessons')}</div>,
          )
        ) : (
          cardState(
            <>
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
              <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/60 flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3 sm:gap-8 text-sm">
                <span className="text-slate-500 font-medium uppercase tracking-wide">{t('totals')}</span>
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 justify-end">
                  <span>
                    <span className="text-slate-500 mr-2">{t('lessonSalary')}</span>
                    <span className="font-semibold text-slate-800">{formatCurrency(totalSalary)}</span>
                  </span>
                  <span>
                    <span className="text-slate-500 mr-2">{t('lessonDeduction')}</span>
                    <span className="font-medium text-red-600">
                      {totalDeduction > 0 ? '−' : ''}
                      {formatCurrency(totalDeduction)}
                    </span>
                  </span>
                  <span>
                    <span className="text-slate-500 mr-2">{t('rowTotal')}</span>
                    <span className="font-semibold text-slate-800">{formatCurrency(totalNet)}</span>
                  </span>
                </div>
              </div>
            </>,
          )
        )}
      </div>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('excludeLessonsTitle')}</DialogTitle>
            <DialogDescription>
              {t('excludeLessonsLead', { count: selectedLessonIds.size })} {t('excludeLessonsDetail')}
            </DialogDescription>
          </DialogHeader>
          {deleteError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{deleteError}</p>
            </div>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setDeleteError(null);
              }}
              disabled={excludeLessons.isPending}
            >
              {tCommon('cancel')}
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={excludeLessons.isPending}
            >
              {excludeLessons.isPending ? t('excluding') : t('excludeLessonsConfirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
