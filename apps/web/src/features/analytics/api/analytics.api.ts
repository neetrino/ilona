import { api } from '@/shared/lib/api';

// Types
export interface DashboardSummary {
  totalTeachers: number;
  totalStudents: number;
  totalGroups: number;
  todayLessons: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  monthlyProfit: number;
  pendingPayments: number;
  atRiskStudents: number;
}

export interface TeacherPerformance {
  id: string;
  name: string;
  email: string;
  totalLessons: number;
  completedLessons: number;
  completionRate: number;
  vocabularySentRate: number;
  groupsCount: number;
  deductionsCount: number;
  deductionsAmount: number;
  salaryEarned: number;
}

export interface StudentRisk {
  id: string;
  name: string;
  email: string;
  phone?: string;
  group?: {
    id: string;
    name: string;
  };
  totalLessons: number;
  present: number;
  absentJustified: number;
  absentUnjustified: number;
  attendanceRate: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  pendingPayments: number;
}

export interface RevenueData {
  month: string;
  monthName: string;
  income: number;
  expenses: number;
  profit: number;
  paymentsCount: number;
}

export interface AttendanceOverview {
  summary: {
    total: number;
    present: number;
    absentJustified: number;
    absentUnjustified: number;
    attendanceRate: number;
  };
  daily: {
    date: string;
    present: number;
    absent: number;
  }[];
}

export interface LessonsOverview {
  total: number;
  completed: number;
  cancelled: number;
  missed: number;
  scheduled: number;
  inProgress: number;
  completionRate: number;
  vocabularySentRate: number;
}

const ANALYTICS_ENDPOINT = '/analytics';

export async function fetchDashboardSummary(): Promise<DashboardSummary> {
  return api.get<DashboardSummary>(`${ANALYTICS_ENDPOINT}/summary`);
}

export async function fetchTeacherPerformance(
  dateFrom?: string,
  dateTo?: string
): Promise<TeacherPerformance[]> {
  const params = new URLSearchParams();
  if (dateFrom) params.append('dateFrom', dateFrom);
  if (dateTo) params.append('dateTo', dateTo);
  
  const query = params.toString();
  const url = query ? `${ANALYTICS_ENDPOINT}/teachers?${query}` : `${ANALYTICS_ENDPOINT}/teachers`;
  
  return api.get<TeacherPerformance[]>(url);
}

export async function fetchStudentRisk(): Promise<StudentRisk[]> {
  return api.get<StudentRisk[]>(`${ANALYTICS_ENDPOINT}/students/risk`);
}

export async function fetchRevenueAnalytics(months = 6): Promise<RevenueData[]> {
  return api.get<RevenueData[]>(`${ANALYTICS_ENDPOINT}/revenue?months=${months}`);
}

export async function fetchAttendanceOverview(
  dateFrom?: string,
  dateTo?: string
): Promise<AttendanceOverview> {
  const params = new URLSearchParams();
  if (dateFrom) params.append('dateFrom', dateFrom);
  if (dateTo) params.append('dateTo', dateTo);
  
  const query = params.toString();
  const url = query ? `${ANALYTICS_ENDPOINT}/attendance?${query}` : `${ANALYTICS_ENDPOINT}/attendance`;
  
  return api.get<AttendanceOverview>(url);
}

export async function fetchLessonsOverview(
  dateFrom?: string,
  dateTo?: string
): Promise<LessonsOverview> {
  const params = new URLSearchParams();
  if (dateFrom) params.append('dateFrom', dateFrom);
  if (dateTo) params.append('dateTo', dateTo);
  
  const query = params.toString();
  const url = query ? `${ANALYTICS_ENDPOINT}/lessons?${query}` : `${ANALYTICS_ENDPOINT}/lessons`;
  
  return api.get<LessonsOverview>(url);
}