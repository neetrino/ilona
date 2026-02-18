import { api } from '@/shared/lib/api';
import type {
  Payment,
  PaymentsResponse,
  PaymentFilters,
  SalaryRecord,
  SalariesResponse,
  SalaryFilters,
  DeductionsResponse,
  FinanceDashboard,
  CreatePaymentDto,
  ProcessPaymentDto,
  SalaryBreakdown,
} from '../types';

// ============ DASHBOARD ============

/**
 * Fetch finance dashboard data
 */
export async function fetchFinanceDashboard(
  dateFrom?: string,
  dateTo?: string
): Promise<FinanceDashboard> {
  const params = new URLSearchParams();
  if (dateFrom) params.append('dateFrom', dateFrom);
  if (dateTo) params.append('dateTo', dateTo);

  const query = params.toString();
  const url = query ? `/finance/dashboard?${query}` : '/finance/dashboard';

  return api.get<FinanceDashboard>(url);
}

// ============ PAYMENTS ============

/**
 * Fetch all payments with filters
 */
export async function fetchPayments(filters?: PaymentFilters): Promise<PaymentsResponse> {
  const params = new URLSearchParams();
  
  if (filters?.skip !== undefined) params.append('skip', String(filters.skip));
  if (filters?.take !== undefined) params.append('take', String(filters.take));
  if (filters?.studentId) params.append('studentId', filters.studentId);
  if (filters?.status) params.append('status', filters.status);
  if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom);
  if (filters?.dateTo) params.append('dateTo', filters.dateTo);

  const query = params.toString();
  const url = query ? `/finance/payments?${query}` : '/finance/payments';
  
  return api.get<PaymentsResponse>(url);
}

/**
 * Fetch a single payment by ID
 */
export async function fetchPayment(id: string): Promise<Payment> {
  return api.get<Payment>(`/finance/payments/${id}`);
}

/**
 * Create a new payment
 */
export async function createPayment(data: CreatePaymentDto): Promise<Payment> {
  return api.post<Payment>('/finance/payments', data);
}

/**
 * Process a payment (mark as paid)
 */
export async function processPayment(id: string, data?: ProcessPaymentDto): Promise<Payment> {
  return api.patch<Payment>(`/finance/payments/${id}/process`, data || {});
}

/**
 * Update a payment
 */
export async function updatePayment(id: string, data: { status?: string; amount?: number; dueDate?: string; notes?: string }): Promise<Payment> {
  return api.put<Payment>(`/finance/payments/${id}`, data);
}

/**
 * Cancel a payment
 */
export async function cancelPayment(id: string): Promise<Payment> {
  return api.patch<Payment>(`/finance/payments/${id}/cancel`, {});
}

// ============ SALARIES ============

/**
 * Fetch all salary records with filters
 */
export async function fetchSalaries(filters?: SalaryFilters): Promise<SalariesResponse> {
  const params = new URLSearchParams();
  
  if (filters?.skip !== undefined) params.append('skip', String(filters.skip));
  if (filters?.take !== undefined) params.append('take', String(filters.take));
  if (filters?.teacherId) params.append('teacherId', filters.teacherId);
  if (filters?.status) params.append('status', filters.status);
  if (filters?.month !== undefined) params.append('month', String(filters.month));
  if (filters?.year !== undefined) params.append('year', String(filters.year));

  const query = params.toString();
  const url = query ? `/finance/salaries?${query}` : '/finance/salaries';
  
  return api.get<SalariesResponse>(url);
}

/**
 * Fetch a single salary record by ID
 */
export async function fetchSalary(id: string): Promise<SalaryRecord> {
  return api.get<SalaryRecord>(`/finance/salaries/${id}`);
}

/**
 * Process a salary (mark as paid)
 */
export async function processSalary(id: string): Promise<SalaryRecord> {
  return api.patch<SalaryRecord>(`/finance/salaries/${id}/process`, {});
}

/**
 * Update salary status
 */
export async function updateSalaryStatus(id: string, status: string): Promise<SalaryRecord> {
  return api.patch<SalaryRecord>(`/finance/salaries/${id}`, { status });
}

/**
 * Generate monthly salaries
 */
export async function generateMonthlySalaries(month: number, year: number): Promise<SalaryRecord[]> {
  return api.post<SalaryRecord[]>('/finance/salaries/generate-monthly', { month, year });
}

/**
 * Fetch salary breakdown for a teacher and month
 */
export async function fetchSalaryBreakdown(teacherId: string, month: string): Promise<SalaryBreakdown> {
  return api.get<SalaryBreakdown>(`/finance/salaries/${teacherId}/breakdown?month=${month}`);
}

/**
 * Delete a salary record
 */
export async function deleteSalary(id: string): Promise<void> {
  return api.delete<void>(`/finance/salaries/${id}`);
}

/**
 * Delete multiple salary records
 */
export async function deleteSalaries(ids: string[]): Promise<{ count: number }> {
  return api.delete<{ count: number }>('/finance/salaries', {
    body: JSON.stringify({ ids }),
  });
}

/**
 * Exclude lessons from salary calculation (changes lesson status to CANCELLED)
 */
export async function excludeLessonsFromSalary(lessonIds: string[]): Promise<{ count: number; lessonIds: string[] }> {
  return api.delete<{ count: number; lessonIds: string[] }>('/finance/salaries/breakdown/exclude', {
    body: JSON.stringify({ ids: lessonIds }),
  });
}

// ============ DEDUCTIONS ============

/**
 * Fetch all deductions
 */
export async function fetchDeductions(params?: {
  skip?: number;
  take?: number;
  teacherId?: string;
}): Promise<DeductionsResponse> {
  const searchParams = new URLSearchParams();
  
  if (params?.skip !== undefined) searchParams.append('skip', String(params.skip));
  if (params?.take !== undefined) searchParams.append('take', String(params.take));
  if (params?.teacherId) searchParams.append('teacherId', params.teacherId);

  const query = searchParams.toString();
  const url = query ? `/finance/deductions?${query}` : '/finance/deductions';
  
  return api.get<DeductionsResponse>(url);
}
