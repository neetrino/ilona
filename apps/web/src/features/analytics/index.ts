// Hooks
export {
  useDashboardSummary,
  useTeacherPerformance,
  useStudentRisk,
  useRevenueAnalytics,
  useRevenueAnalyticsByRange,
  useAttendanceOverview,
  useLessonsOverview,
  analyticsKeys,
} from './hooks/useAnalytics';

// Types
export type {
  DashboardSummary,
  TeacherPerformance,
  StudentRisk,
  RevenueData,
  RevenueSeries,
  AttendanceOverview,
  LessonsOverview,
} from './api/analytics.api';

// Components
export { analyticsTableScrollClass } from './analytics-table-scroll';
export { TeacherRatioTable } from './components/TeacherRatioTable';
export type { TeacherRatioMetric } from './components/TeacherRatioTable';
export { RevenueBreakdownTable } from './components/RevenueBreakdownTable';
export { AnalyticsMobilePagination } from './components/AnalyticsMobilePagination';
export { AdminAnalyticsPage } from './components/admin-analytics/AdminAnalyticsPage';
