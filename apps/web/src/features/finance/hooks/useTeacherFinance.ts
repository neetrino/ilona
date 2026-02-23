'use client';

import { useQuery } from '@tanstack/react-query';
import {
  fetchMySalaries,
  fetchMySalarySummary,
  fetchMyDeductions,
  fetchMySalaryBreakdown,
} from '../api/teacher-finance.api';

export const teacherFinanceKeys = {
  all: ['teacher-finance'] as const,
  salaries: () => [...teacherFinanceKeys.all, 'salaries'] as const,
  salaryList: (skip?: number, take?: number, status?: string) =>
    [...teacherFinanceKeys.salaries(), { skip, take, status }] as const,
  salarySummary: () => [...teacherFinanceKeys.all, 'salary-summary'] as const,
  salaryBreakdown: (month: string) => [...teacherFinanceKeys.salaries(), 'breakdown', month] as const,
  deductions: () => [...teacherFinanceKeys.all, 'deductions'] as const,
  deductionList: (skip?: number, take?: number) => [...teacherFinanceKeys.deductions(), { skip, take }] as const,
};

/**
 * Hook to fetch teacher's salary records
 */
export function useMySalaries(skip?: number, take?: number, status?: string) {
  return useQuery({
    queryKey: teacherFinanceKeys.salaryList(skip, take, status),
    queryFn: () => fetchMySalaries(skip, take, status),
  });
}

/**
 * Hook to fetch teacher's salary summary
 */
export function useMySalarySummary() {
  return useQuery({
    queryKey: teacherFinanceKeys.salarySummary(),
    queryFn: () => fetchMySalarySummary(),
  });
}

/**
 * Hook to fetch teacher's salary breakdown for a month (lesson-level details)
 */
export function useMySalaryBreakdown(month: string | null, enabled = true) {
  return useQuery({
    queryKey: teacherFinanceKeys.salaryBreakdown(month ?? ''),
    queryFn: () => fetchMySalaryBreakdown(month!),
    enabled: enabled && !!month,
  });
}

/**
 * Hook to fetch teacher's deductions
 */
export function useMyDeductions(skip?: number, take?: number) {
  return useQuery({
    queryKey: teacherFinanceKeys.deductionList(skip, take),
    queryFn: () => fetchMyDeductions(skip, take),
  });
}
