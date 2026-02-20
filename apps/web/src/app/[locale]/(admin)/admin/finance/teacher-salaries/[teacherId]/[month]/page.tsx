'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';
import { DataTable } from '@/shared/components/ui';
import { Button } from '@/shared/components/ui';
import { useSalaryBreakdown, useExcludeLessonsFromSalary, financeKeys } from '@/features/finance/hooks/useFinance';
import type { SalaryBreakdownLesson } from '@/features/finance/types';
import { Trash2, ArrowLeft } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { ObligationDetailsModal } from '@/features/finance/components/ObligationDetailsModal';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/shared/components/ui';

function SelectAllCheckbox({
  checked,
  indeterminate,
  onChange,
  disabled,
}: {
  checked: boolean;
  indeterminate: boolean;
  onChange: () => void;
  disabled?: boolean;
}) {
  const checkboxRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (checkboxRef.current) {
      checkboxRef.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);

  return (
    <input
      ref={checkboxRef}
      type="checkbox"
      className="w-4 h-4 rounded border-slate-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      checked={checked}
      onChange={onChange}
      onClick={(e) => e.stopPropagation()}
      disabled={disabled}
      aria-label="Select all"
    />
  );
}

export default function SalaryBreakdownPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  
  const teacherId = params.teacherId as string;
  const month = params.month as string; // YYYY-MM format
  const locale = params.locale as string;

  // Get teacher name from query params (encoded)
  const teacherNameFromUrl = searchParams.get('teacherName');
  const teacherName = teacherNameFromUrl ? decodeURIComponent(teacherNameFromUrl) : 'Teacher';

  const { data: breakdown, isLoading, error, refetch } = useSalaryBreakdown(teacherId, month, !!teacherId);
  const excludeLessons = useExcludeLessonsFromSalary();

  const [selectedLessonIds, setSelectedLessonIds] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<string>('lessonDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [selectedLessonIdForObligation, setSelectedLessonIdForObligation] = useState<string | null>(null);
  const [isObligationModalOpen, setIsObligationModalOpen] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('hy-AM', {
      style: 'currency',
      currency: 'AMD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) {
      return '';
    }
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return '';
    }
    return date.toLocaleDateString('en-US', {
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
    if (isNaN(yearNum) || isNaN(monthNumParsed) || monthNumParsed < 1 || monthNumParsed > 12) {
      return '';
    }
    const date = new Date(yearNum, monthNumParsed - 1);
    if (isNaN(date.getTime())) {
      return '';
    }
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  // Handle sorting
  const handleSort = (key: string) => {
    if (sortBy === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(key);
      setSortOrder('asc');
    }
  };

  // Sort lessons
  const sortedLessons = breakdown?.lessons ? [...breakdown.lessons].sort((a, b) => {
    let aVal: any;
    let bVal: any;

    if (sortBy === 'lessonDate') {
      const aDate = a.lessonDate ? new Date(a.lessonDate) : new Date(0);
      const bDate = b.lessonDate ? new Date(b.lessonDate) : new Date(0);
      aVal = isNaN(aDate.getTime()) ? 0 : aDate.getTime();
      bVal = isNaN(bDate.getTime()) ? 0 : bDate.getTime();
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
  }) : [];

  // Checkbox handlers
  const allSelected = sortedLessons.length > 0 && selectedLessonIds.size === sortedLessons.length;
  const someSelected = selectedLessonIds.size > 0 && selectedLessonIds.size < sortedLessons.length;

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

  // Handle delete button click
  const handleDeleteClick = () => {
    if (selectedLessonIds.size === 0) return;
    setDeleteError(null);
    setIsDeleteDialogOpen(true);
  };

  // Handle delete confirmation
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
      const errorMessage = err instanceof Error ? err.message : 'Failed to exclude lessons from salary. Please try again.';
      setDeleteError(errorMessage);
    }
  };

  // Build back URL preserving query params from finance page
  const getBackUrl = () => {
    // Preserve common query params that might be useful
    const tab = searchParams.get('tab');
    const salariesPage = searchParams.get('salariesPage');
    const salaryStatus = searchParams.get('salaryStatus');
    const q = searchParams.get('q');
    
    const params = new URLSearchParams();
    if (tab) params.set('tab', tab);
    if (salariesPage) params.set('salariesPage', salariesPage);
    if (salaryStatus) params.set('salaryStatus', salaryStatus);
    if (q) params.set('q', q);
    
    const query = params.toString();
    return query ? `/${locale}/admin/finance?${query}` : `/${locale}/admin/finance`;
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
      className: 'w-12',
      render: (lesson: SalaryBreakdownLesson) => (
        <input
          type="checkbox"
          checked={selectedLessonIds.has(lesson.lessonId)}
          onChange={(e) => handleSelectOne(lesson.lessonId, e.target.checked)}
          onClick={(e) => e.stopPropagation()}
          className="w-4 h-4 rounded border-slate-300 cursor-pointer"
          aria-label={`Select lesson ${lesson.lessonName}`}
        />
      ),
    },
    {
      key: 'teacherName',
      header: 'Teacher Name',
      className: 'text-left',
      render: () => <span className="text-slate-800">{teacherName}</span>,
    },
    {
      key: 'lessonName',
      header: 'Lesson Name',
      className: 'text-left',
      sortable: true,
      render: (lesson: SalaryBreakdownLesson) => (
        <span className="font-medium text-slate-800">{lesson.lessonName}</span>
      ),
    },
    {
      key: 'lessonDate',
      header: 'Lesson Date',
      className: 'text-left',
      sortable: true,
      render: (lesson: SalaryBreakdownLesson) => (
        <span className="text-slate-700">{formatDate(lesson.lessonDate)}</span>
      ),
    },
    {
      key: 'obligation',
      header: 'Obligation',
      className: 'text-center',
      render: (lesson: SalaryBreakdownLesson) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setSelectedLessonIdForObligation(lesson.lessonId);
            setIsObligationModalOpen(true);
          }}
          className="text-slate-700 font-medium hover:text-primary hover:underline cursor-pointer transition-colors"
          aria-label={`View obligation details for ${lesson.lessonName}`}
        >
          {lesson.obligationCompleted}/{lesson.obligationTotal}
        </button>
      ),
    },
    {
      key: 'salary',
      header: 'Salary',
      className: 'text-right',
      sortable: true,
      render: (lesson: SalaryBreakdownLesson) => (
        <span className="text-slate-700">{formatCurrency(lesson.salary)}</span>
      ),
    },
    {
      key: 'deduction',
      header: 'Deduction',
      className: 'text-right',
      render: (lesson: SalaryBreakdownLesson) => (
        <span className="text-red-500 font-medium">
          -{formatCurrency(lesson.deduction)}
        </span>
      ),
    },
    {
      key: 'total',
      header: 'Total',
      className: 'text-right',
      sortable: true,
      render: (lesson: SalaryBreakdownLesson) => (
        <span className="font-semibold text-slate-800">{formatCurrency(lesson.total)}</span>
      ),
    },
  ];

  // Calculate totals
  const totalSalary = sortedLessons.reduce((sum, l) => sum + l.salary, 0);
  const totalDeduction = sortedLessons.reduce((sum, l) => sum + l.deduction, 0);
  const totalNet = sortedLessons.reduce((sum, l) => sum + l.total, 0);

  return (
    <DashboardLayout 
      title={`Salary Breakdown: ${teacherName}${month ? ` - ${formatMonth(month)}` : ''}`}
      subtitle="Detailed lesson-by-lesson breakdown of salary calculations for this month"
    >
      <div className="space-y-6">
        {/* Back Button */}
        <Button
          variant="outline"
          onClick={() => router.push(getBackUrl())}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Finance
        </Button>

        {/* Action Bar */}
        {selectedLessonIds.size > 0 && (
          <div className="flex items-center justify-end">
            <Button
              variant="destructive"
              size="sm"
              className="flex items-center gap-2"
              onClick={handleDeleteClick}
              disabled={excludeLessons.isPending}
            >
              <Trash2 className="w-4 h-4" />
              Delete ({selectedLessonIds.size})
            </Button>
          </div>
        )}

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : error ? (
          <div className="text-center py-12 text-red-500">
            Failed to load salary breakdown. Please try again.
          </div>
        ) : !breakdown || sortedLessons.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            No lessons found for this period.
          </div>
        ) : (
          <>
            <DataTable
              columns={breakdownColumns}
              data={sortedLessons}
              keyExtractor={(lesson) => lesson.lessonId}
              isLoading={false}
              emptyMessage="No lessons found"
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSort={handleSort}
            />
            
            {/* Totals Row */}
            <div className="mt-4 pt-4 border-t border-slate-200">
              <div className="grid grid-cols-12 gap-4 text-sm font-semibold">
                <div className="col-span-5"></div>
                <div className="col-span-2 text-right text-slate-600">Totals:</div>
                <div className="col-span-1 text-right text-slate-800">{formatCurrency(totalSalary)}</div>
                <div className="col-span-1 text-right text-red-500">-{formatCurrency(totalDeduction)}</div>
                <div className="col-span-1 text-right text-slate-900">{formatCurrency(totalNet)}</div>
                <div className="col-span-2"></div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Exclude Lessons from Salary</DialogTitle>
            <DialogDescription>
              Are you sure you want to exclude {selectedLessonIds.size} lesson{selectedLessonIds.size > 1 ? 's' : ''} from salary calculation? 
              This will change the lesson status to CANCELLED and remove {selectedLessonIds.size > 1 ? 'them' : 'it'} from the salary breakdown. 
              The lesson{selectedLessonIds.size > 1 ? 's' : ''} will remain in the system but won't be counted for salary.
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
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={excludeLessons.isPending}
            >
              {excludeLessons.isPending ? 'Excluding...' : 'Exclude'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Obligation Details Modal */}
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

