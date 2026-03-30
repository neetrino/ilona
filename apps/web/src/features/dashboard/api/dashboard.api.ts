import { api, ApiError } from '@/shared/lib/api';
import type { FinanceDashboard, AdminDashboardStats } from '../types';
import type { TeachersResponse } from '@/features/teachers';

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

/**
 * Fetch admin dashboard stats by combining multiple API calls
 * This aggregates data from various endpoints into a single stats object
 */
export async function fetchAdminDashboardStats(options?: {
  includeFinance?: boolean;
}): Promise<AdminDashboardStats> {
  const includeFinance = options?.includeFinance ?? true;

  // Fetch base dashboard data
  const teachersResponse = await api.get<TeachersResponse>('/teachers?take=1'); // Just to get total count

  let financeDashboard: Awaited<ReturnType<typeof fetchFinanceDashboard>> | null = null;
  if (includeFinance) {
    try {
      financeDashboard = await fetchFinanceDashboard();
    } catch (error) {
      // Manager role may open the same dashboard route, but finance endpoint is ADMIN-only.
      if (!(error instanceof ApiError) || error.statusCode !== 403) {
        throw error;
      }
    }
  }

  // Count active vs total teachers (we'll need to make separate calls if we want active count)
  // For now, estimate active as total since we don't have a separate status filter endpoint
  const totalTeachers = teachersResponse.total;

  return {
    teachers: {
      total: totalTeachers,
      active: totalTeachers, // TODO: Add status filter when available
    },
    students: {
      total: 0, // TODO: Add students endpoint
      active: 0,
    },
    groups: {
      total: 0, // TODO: Add groups endpoint
    },
    centers: {
      total: 0, // TODO: Add centers endpoint
    },
    finance: {
      pendingPayments: financeDashboard?.pendingPayments?.count || 0,
      overduePayments: financeDashboard?.pendingPayments?.overdueCount || 0,
      totalRevenue: financeDashboard?.revenue?.totalRevenue || 0,
    },
    lessons: {
      missedFeedbacks: 0, // TODO: Add lessons endpoint
      todayLessons: 0,
    },
  };
}
