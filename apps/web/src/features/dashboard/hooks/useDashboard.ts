'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchFinanceDashboard, fetchAdminDashboardStats } from '../api/dashboard.api';

// Query keys
export const dashboardKeys = {
  all: ['dashboard'] as const,
  admin: (includeFinance = true) => [...dashboardKeys.all, 'admin', { includeFinance }] as const,
  finance: (dateFrom?: string, dateTo?: string) =>
    [...dashboardKeys.all, 'finance', { dateFrom, dateTo }] as const,
};

/**
 * Hook to fetch admin dashboard stats
 */
export function useAdminDashboardStats(options?: { includeFinance?: boolean }) {
  const includeFinance = options?.includeFinance ?? true;
  return useQuery({
    queryKey: dashboardKeys.admin(includeFinance),
    queryFn: () => fetchAdminDashboardStats(options),
    staleTime: 30 * 1000, // 30 seconds - dashboard data should be relatively fresh
  });
}

/**
 * Hook to fetch finance dashboard
 */
export function useFinanceDashboard(dateFrom?: string, dateTo?: string) {
  return useQuery({
    queryKey: dashboardKeys.finance(dateFrom, dateTo),
    queryFn: () => fetchFinanceDashboard(dateFrom, dateTo),
  });
}
