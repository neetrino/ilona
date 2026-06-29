'use client';

import { formatCurrency } from '@/shared/lib/utils';
import { TeacherSubstituteBadge, substituteLessonChipClassName } from '../TeacherSubstituteBadge';
import { SelectAllCheckbox } from './SelectAllCheckbox';
import type { BuildSalaryBreakdownColumnsParams, SalaryBreakdownColumn } from './salary-breakdown-modal.types';

export function buildSalaryBreakdownColumns({
  t,
  teacherName,
  teacherInitials,
  isLoading,
  allSelected,
  someSelected,
  selectedLessonIds,
  formatDate,
  onSelectAll,
  onSelectOne,
  onObligationClick,
}: BuildSalaryBreakdownColumnsParams): SalaryBreakdownColumn[] {
  return [
    {
      key: 'checkbox',
      header: (
        <SelectAllCheckbox
          checked={allSelected}
          indeterminate={someSelected}
          onChange={onSelectAll}
          disabled={isLoading}
        />
      ),
      className: 'w-12',
      render: (lesson) => (
        <input
          type="checkbox"
          checked={selectedLessonIds.has(lesson.lessonId)}
          onChange={(e) => onSelectOne(lesson.lessonId, e.target.checked)}
          onClick={(e) => e.stopPropagation()}
          className="w-4 h-4 rounded border-slate-300 cursor-pointer"
          aria-label={`Select lesson ${lesson.lessonName}`}
        />
      ),
    },
    {
      key: 'teacherName',
      header: t('teacher'),
      className: 'text-left',
      render: (lesson) => {
        const isSub = lesson.isSubstituteLesson === true;
        return (
          <div className="flex min-w-0 items-center gap-3">
            <div className="relative shrink-0">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 text-sm font-semibold text-slate-600">
                {teacherInitials}
              </div>
              {isSub ? <TeacherSubstituteBadge /> : null}
            </div>
            <span className="truncate font-medium text-slate-800">{teacherName}</span>
          </div>
        );
      },
    },
    {
      key: 'lessonName',
      header: t('breakdownGroup'),
      className: 'text-left',
      sortable: true,
      render: (lesson) => {
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
              <span className="font-medium text-slate-800 truncate min-w-0">{primary}</span>
            </div>
            {secondary ? <p className="text-sm text-slate-500 truncate">{secondary}</p> : null}
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
      header: 'Lesson Date',
      className: 'text-left',
      sortable: true,
      render: (lesson) => (
        <span className="text-slate-700">{formatDate(lesson.lessonDate)}</span>
      ),
    },
    {
      key: 'obligation',
      header: 'Obligation',
      className: 'text-center',
      render: (lesson) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onObligationClick(lesson.lessonId);
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
      render: (lesson) => (
        <span className="text-slate-700">{formatCurrency(lesson.salary)}</span>
      ),
    },
    {
      key: 'deduction',
      header: 'Deduction',
      className: 'text-right',
      render: (lesson) => (
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
      render: (lesson) => (
        <span className="font-semibold text-slate-800">{formatCurrency(lesson.total)}</span>
      ),
    },
  ];
}
