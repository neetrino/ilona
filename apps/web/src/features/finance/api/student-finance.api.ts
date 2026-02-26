import { api } from '@/shared/lib/api';

/** Reason from backend: payment can be made only in the corresponding month. */
export type PaymentWindowReason = 'current_month' | 'past' | 'future';

export interface Payment {
  id: string;
  studentId: string;
  amount: number;
  status: 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  dueDate: string;
  month?: string;
  paidAt?: string;
  notes?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  student?: {
    group?: { id: string; name: string } | null;
  };
  /** True only when unpaid and current month matches payment month (backend-enforced). */
  canPay?: boolean;
  /** Set when unpaid; explains why Pay is disabled (past = period ended, future = not yet). */
  paymentWindowReason?: PaymentWindowReason;
}

export interface PaymentsResponse {
  items: Payment[];
  total: number;
  page?: number;
  pageSize?: number;
  totalPages?: number;
}

export interface ProcessMyPaymentDto {
  paymentMethod: string;
  transactionId?: string;
  notes?: string;
}

export interface StudentPaymentSummary {
  totalPaid: number;
  totalPending: number;
  totalOverdue: number;
  nextPayment: {
    id: string;
    amount: number;
    dueDate: string;
  } | null;
}

const FINANCE_ENDPOINT = '/finance';

/**
 * Fetch student's payment records
 */
export async function fetchMyPayments(
  skip?: number,
  take?: number,
  status?: string
): Promise<PaymentsResponse> {
  const params = new URLSearchParams();
  if (skip !== undefined) params.append('skip', String(skip));
  if (take !== undefined) params.append('take', String(take));
  if (status) params.append('status', status);

  const query = params.toString();
  const url = query ? `${FINANCE_ENDPOINT}/my-payments?${query}` : `${FINANCE_ENDPOINT}/my-payments`;

  return api.get<PaymentsResponse>(url);
}

/**
 * Fetch student's payment summary
 */
export async function fetchMyPaymentsSummary(): Promise<StudentPaymentSummary> {
  return api.get<StudentPaymentSummary>(`${FINANCE_ENDPOINT}/my-payments/summary`);
}

/**
 * Mark one of the student's payments as paid (student self-service).
 */
export async function processMyPayment(
  paymentId: string,
  data: ProcessMyPaymentDto
): Promise<Payment> {
  return api.patch<Payment>(`${FINANCE_ENDPOINT}/my-payments/${paymentId}/process`, data);
}
