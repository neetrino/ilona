'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchFinanceDashboard,
  fetchPayments,
  fetchPayment,
  createPayment,
  processPayment,
  cancelPayment,
  fetchSalaries,
  fetchSalary,
  processSalary,
  updateSalaryStatus,
  generateMonthlySalaries,
  fetchDeductions,
} from '../api/finance.api';
import type {
  PaymentFilters,
  SalaryFilters,
  CreatePaymentDto,
  ProcessPaymentDto,
} from '../types';

// Query keys
export const financeKeys = {
  all: ['finance'] as const,
  dashboard: (dateFrom?: string, dateTo?: string) =>
    [...financeKeys.all, 'dashboard', { dateFrom, dateTo }] as const,
  
  // Payments
  payments: () => [...financeKeys.all, 'payments'] as const,
  paymentsList: (filters?: PaymentFilters) => [...financeKeys.payments(), 'list', filters] as const,
  paymentDetail: (id: string) => [...financeKeys.payments(), 'detail', id] as const,
  
  // Salaries
  salaries: () => [...financeKeys.all, 'salaries'] as const,
  salariesList: (filters?: SalaryFilters) => [...financeKeys.salaries(), 'list', filters] as const,
  salaryDetail: (id: string) => [...financeKeys.salaries(), 'detail', id] as const,
  
  // Deductions
  deductions: () => [...financeKeys.all, 'deductions'] as const,
  deductionsList: (params?: { teacherId?: string }) => [...financeKeys.deductions(), 'list', params] as const,
};

// ============ DASHBOARD ============

export function useFinanceDashboard(dateFrom?: string, dateTo?: string) {
  return useQuery({
    queryKey: financeKeys.dashboard(dateFrom, dateTo),
    queryFn: () => fetchFinanceDashboard(dateFrom, dateTo),
  });
}

// ============ PAYMENTS ============

export function usePayments(filters?: PaymentFilters) {
  return useQuery({
    queryKey: financeKeys.paymentsList(filters),
    queryFn: () => fetchPayments(filters),
  });
}

export function usePayment(id: string, enabled = true) {
  return useQuery({
    queryKey: financeKeys.paymentDetail(id),
    queryFn: () => fetchPayment(id),
    enabled: enabled && !!id,
  });
}

export function useCreatePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePaymentDto) => createPayment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: financeKeys.payments() });
      queryClient.invalidateQueries({ queryKey: financeKeys.dashboard() });
    },
  });
}

export function useProcessPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data?: ProcessPaymentDto }) =>
      processPayment(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: financeKeys.paymentDetail(id) });
      queryClient.invalidateQueries({ queryKey: financeKeys.payments() });
      queryClient.invalidateQueries({ queryKey: financeKeys.dashboard() });
    },
  });
}

export function useCancelPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => cancelPayment(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: financeKeys.paymentDetail(id) });
      queryClient.invalidateQueries({ queryKey: financeKeys.payments() });
      queryClient.invalidateQueries({ queryKey: financeKeys.dashboard() });
    },
  });
}

// ============ SALARIES ============

export function useSalaries(filters?: SalaryFilters) {
  return useQuery({
    queryKey: financeKeys.salariesList(filters),
    queryFn: () => fetchSalaries(filters),
  });
}

export function useSalary(id: string, enabled = true) {
  return useQuery({
    queryKey: financeKeys.salaryDetail(id),
    queryFn: () => fetchSalary(id),
    enabled: enabled && !!id,
  });
}

export function useProcessSalary() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => processSalary(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: financeKeys.salaryDetail(id) });
      queryClient.invalidateQueries({ queryKey: financeKeys.salaries() });
      queryClient.invalidateQueries({ queryKey: financeKeys.dashboard() });
    },
  });
}

export function useUpdateSalaryStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => updateSalaryStatus(id, status),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: financeKeys.salaryDetail(id) });
      queryClient.invalidateQueries({ queryKey: financeKeys.salaries() });
      queryClient.invalidateQueries({ queryKey: financeKeys.dashboard() });
    },
  });
}

export function useGenerateMonthlySalaries() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ month, year }: { month: number; year: number }) =>
      generateMonthlySalaries(month, year),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: financeKeys.salaries() });
      queryClient.invalidateQueries({ queryKey: financeKeys.dashboard() });
    },
  });
}

// ============ DEDUCTIONS ============

export function useDeductions(params?: { teacherId?: string; skip?: number; take?: number }) {
  return useQuery({
    queryKey: financeKeys.deductionsList(params),
    queryFn: () => fetchDeductions(params),
  });
}
