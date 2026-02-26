'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchMyPayments,
  fetchMyPaymentsSummary,
  processMyPayment,
  type ProcessMyPaymentDto,
} from '../api/student-finance.api';

export const studentFinanceKeys = {
  all: ['student-finance'] as const,
  payments: () => [...studentFinanceKeys.all, 'payments'] as const,
  paymentList: (skip?: number, take?: number, status?: string) => [...studentFinanceKeys.payments(), { skip, take, status }] as const,
  paymentSummary: () => [...studentFinanceKeys.all, 'payment-summary'] as const,
};

/**
 * Hook to fetch student's payment records.
 * Backend is idempotent (one payment per student per month); staleTime reduces duplicate requests.
 */
export function useMyPayments(skip?: number, take?: number, status?: string) {
  return useQuery({
    queryKey: studentFinanceKeys.paymentList(skip, take, status),
    queryFn: () => fetchMyPayments(skip, take, status),
    staleTime: 60 * 1000,
  });
}

/**
 * Hook to fetch student's payment summary.
 * Backend is idempotent; staleTime reduces duplicate requests.
 */
export function useMyPaymentsSummary() {
  return useQuery({
    queryKey: studentFinanceKeys.paymentSummary(),
    queryFn: () => fetchMyPaymentsSummary(),
    staleTime: 60 * 1000,
  });
}

/**
 * Hook to mark a payment as paid (student self-service). Invalidates payment list and summary.
 * Disable submit button with mutation.isPending to prevent double submit.
 */
export function useProcessMyPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ paymentId, data }: { paymentId: string; data: ProcessMyPaymentDto }) =>
      processMyPayment(paymentId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: studentFinanceKeys.payments() });
      queryClient.invalidateQueries({ queryKey: studentFinanceKeys.paymentSummary() });
    },
  });
}
