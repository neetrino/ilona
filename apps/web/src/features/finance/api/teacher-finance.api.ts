import { api } from '@/shared/lib/api';
import type { SalaryRecord, SalariesResponse, SalaryBreakdown } from '@/features/finance/types';

export type { SalaryRecord, SalariesResponse };

export interface TeacherSalarySummary {
  totalEarned: number;
  totalPending: number;
  totalDeductions: number;
  lessonsCount: number;
  averagePerLesson: number;
}
console.log("Hwl")

export interface Deduction {
  id: string;
  teacherId: string;
  amount: number;
  reason: 'LATE' | 'ABSENCE' | 'VOCAB_NOT_SENT' | 'OTHER';
  description?: string;
  lessonId?: string;
  createdAt: string;
}

export interface DeductionsResponse {
  items: Deduction[];
  total: number;
}

const FINANCE_ENDPOINT = '/finance';

/**
 * Fetch teacher's salary records (all months, same data shape as Admin for this teacher).
 */
export async function fetchMySalaries(
  skip?: number,
  take?: number,
  status?: string
): Promise<SalariesResponse> {
  const params = new URLSearchParams();
  if (skip !== undefined) params.append('skip', String(skip));
  if (take !== undefined) params.append('take', String(take));
  if (status) params.append('status', status);

  const query = params.toString();
  const url = query ? `${FINANCE_ENDPOINT}/my-salary?${query}` : `${FINANCE_ENDPOINT}/my-salary`;

  return api.get<SalariesResponse>(url);
}

/**
 * Fetch teacher's salary summary (totals, pending, deductions, lessons count).
 */
export async function fetchMySalarySummary(): Promise<TeacherSalarySummary> {
  return api.get<TeacherSalarySummary>(`${FINANCE_ENDPOINT}/my-salary/summary`);
}

/**
 * Fetch salary breakdown for a month (lesson-level details, same as Admin view for this teacher).
 */
export async function fetchMySalaryBreakdown(month: string): Promise<SalaryBreakdown> {
  return api.get<SalaryBreakdown>(`${FINANCE_ENDPOINT}/my-salary/breakdown?month=${encodeURIComponent(month)}`);
}

/**
 * Fetch a single salary record by ID (only own records).
 */
export async function fetchMySalaryById(id: string): Promise<SalaryRecord> {
  return api.get<SalaryRecord>(`${FINANCE_ENDPOINT}/my-salary/${id}`);
}

/**
 * Fetch teacher's deductions
 */
export async function fetchMyDeductions(
  skip?: number,
  take?: number
): Promise<DeductionsResponse> {
  const params = new URLSearchParams();
  if (skip !== undefined) params.append('skip', String(skip));
  if (take !== undefined) params.append('take', String(take));

  const query = params.toString();
  const url = query ? `${FINANCE_ENDPOINT}/my-deductions?${query}` : `${FINANCE_ENDPOINT}/my-deductions`;

  return api.get<DeductionsResponse>(url);
}
