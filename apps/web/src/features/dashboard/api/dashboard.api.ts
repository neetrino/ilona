import { api, ApiError } from '@/shared/lib/api';
import type { FinanceDashboard, AdminDashboardStats } from '../types';
import type { TeachersResponse } from '@/features/teachers';
import type { StudentsResponse } from '@/features/students';
import type { GroupsResponse } from '@/features/groups';

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

  const teachersPromise = api.get<TeachersResponse>('/teachers?take=1');
  const studentsPromise = api.get<StudentsResponse>('/students?take=1');
  const groupsPromise = api.get<GroupsResponse>('/groups?take=1');
  const financePromise: Promise<FinanceDashboard | null> = includeFinance
    ? fetchFinanceDashboard().catch((error: unknown) => {
        // Manager role may open the same dashboard route, but finance endpoint is ADMIN-only.
        if (error instanceof ApiError && error.statusCode === 403) {
          return null;
        }
        throw error;
      })
    : Promise.resolve(null);

  const [teachersResponse, studentsResponse, groupsResponse, financeDashboard] =
    await Promise.all([teachersPromise, studentsPromise, groupsPromise, financePromise]);

  // Count active vs total teachers (we'll need to make separate calls if we want active count)
  // For now, estimate active as total since we don't have a separate status filter endpoint
  const totalTeachers = teachersResponse.total;

  return {
    teachers: {
      total: totalTeachers,
      active: totalTeachers, // TODO: Add status filter when available
    },
    students: {
      total: studentsResponse.total,
      active: 0,
    },
    groups: {
      total: groupsResponse.total,
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
