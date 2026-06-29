import type { ReactNode } from 'react';
import type { SalaryBreakdownLesson } from '../../types';

export interface SalaryBreakdownModalProps {
  teacherId: string | null;
  teacherName: string;
  month: string;
  open: boolean;
  onClose: () => void;
}

export interface SelectAllCheckboxProps {
  checked: boolean;
  indeterminate: boolean;
  onChange: () => void;
  disabled?: boolean;
}

export interface SalaryBreakdownTotalsRowProps {
  totalSalary: number;
  totalDeduction: number;
  totalNet: number;
}

export interface SalaryBreakdownColumn {
  key: string;
  header: ReactNode;
  sortable?: boolean;
  render?: (lesson: SalaryBreakdownLesson) => ReactNode;
  className?: string;
}

export interface BuildSalaryBreakdownColumnsParams {
  t: (key: string, values?: Record<string, string | number>) => string;
  teacherName: string;
  teacherInitials: string;
  isLoading: boolean;
  allSelected: boolean;
  someSelected: boolean;
  selectedLessonIds: Set<string>;
  formatDate: (dateString: string | null | undefined) => string;
  onSelectAll: () => void;
  onSelectOne: (lessonId: string, checked: boolean) => void;
  onObligationClick: (lessonId: string) => void;
}
