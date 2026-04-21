// Hooks
export {
  useDashboardSummary,
  useTeacherPerformance,
  useStudentRisk,
  useRevenueAnalytics,
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
  AttendanceOverview,
  LessonsOverview,
} from './api/analytics.api';

// Components
export { TeacherRatioTable } from './components/TeacherRatioTable';
export type { TeacherRatioMetric } from './components/TeacherRatioTable';
