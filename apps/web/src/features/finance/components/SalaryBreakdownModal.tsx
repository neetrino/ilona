'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/shared/components/ui';
import { DataTable } from '@/shared/components/ui';
import { useSalaryBreakdown } from '../hooks/useFinance';
import type { SalaryBreakdownLesson } from '../types';

interface SalaryBreakdownModalProps {
  teacherId: string | null;
  teacherName: string;
  month: string; // YYYY-MM format
  open: boolean;
  onClose: () => void;
}

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

export function SalaryBreakdownModal({
  teacherId,
  teacherName,
  month,
  open,
  onClose,
}: SalaryBreakdownModalProps) {
  const t = useTranslations('finance');
  const { data: breakdown, isLoading, error } = useSalaryBreakdown(teacherId, month, open && !!teacherId);

  const [selectedLessonIds, setSelectedLessonIds] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<string>('lessonDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      setSelectedLessonIds(new Set());
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  // Close modal on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [open, onClose]);

  if (!open || !teacherId) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('hy-AM', {
      style: 'currency',
      currency: 'AMD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatMonth = (monthStr: string) => {
    const [year, monthNum] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(monthNum) - 1);
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
      aVal = new Date(a.lessonDate).getTime();
      bVal = new Date(b.lessonDate).getTime();
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
        <span className="text-slate-700 font-medium">
          {lesson.obligationCompleted}/{lesson.obligationTotal}
        </span>
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
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>
            Salary Breakdown: {teacherName} - {formatMonth(month)}
          </DialogTitle>
          <DialogDescription>
            Detailed lesson-by-lesson breakdown of salary calculations for this month
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
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
      </DialogContent>
    </Dialog>
  );
}

