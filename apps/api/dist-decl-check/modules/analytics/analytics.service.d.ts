import { AnalyticsTeacherService } from './analytics-teacher.service';
import { AnalyticsStudentRiskService } from './analytics-student-risk.service';
import { AnalyticsRevenueService } from './analytics-revenue.service';
import { AnalyticsAttendanceService } from './analytics-attendance.service';
import { AnalyticsLessonsService } from './analytics-lessons.service';
import { AnalyticsDashboardService } from './analytics-dashboard.service';
import type { RevenueSeries } from './analytics.types';
export declare class AnalyticsService {
    private readonly teacherService;
    private readonly studentRiskService;
    private readonly revenueService;
    private readonly attendanceService;
    private readonly lessonsService;
    private readonly dashboardService;
    constructor(teacherService: AnalyticsTeacherService, studentRiskService: AnalyticsStudentRiskService, revenueService: AnalyticsRevenueService, attendanceService: AnalyticsAttendanceService, lessonsService: AnalyticsLessonsService, dashboardService: AnalyticsDashboardService);
    getTeacherPerformance(dateFrom?: Date, dateTo?: Date): Promise<{
        id: string;
        name: string;
        email: string;
        totalLessons: number;
        completedLessons: number;
        completionRate: number;
        vocabularySentRate: number;
        feedbacksRate: number;
        voiceRate: number;
        textRate: number;
        absenceMarkedRate: number;
        groupsCount: number;
        deductionsCount: number;
        deductionsAmount: number;
        salaryEarned: number;
    }[]>;
    getStudentRiskAnalytics(): Promise<{
        id: string;
        name: string;
        email: string;
        phone: string | null;
        group: {
            name: string;
            id: string;
        } | null;
        totalLessons: number;
        present: number;
        absentJustified: number;
        absentUnjustified: number;
        attendanceRate: number;
        riskLevel: import("./analytics.types").StudentRiskLevel;
        pendingPayments: number;
    }[]>;
    getRevenueForDateRange(from: Date, to: Date, series?: RevenueSeries): Promise<import("./analytics.types").RevenueAnalyticsRow[]>;
    getRevenueAnalytics(months?: number): Promise<import("./analytics.types").RevenueAnalyticsRow[]>;
    getAttendanceOverview(dateFrom?: Date, dateTo?: Date): Promise<{
        summary: {
            total: number;
            present: number;
            absentJustified: number;
            absentUnjustified: number;
            attendanceRate: number;
        };
        daily: {
            present: number;
            absent: number;
            date: string;
        }[];
    }>;
    getLessonsOverview(dateFrom?: Date, dateTo?: Date): Promise<{
        total: number;
        completed: number;
        cancelled: number;
        missed: number;
        scheduled: number;
        inProgress: number;
        completionRate: number;
        vocabularySentRate: number;
    }>;
    getDashboardSummary(): Promise<{
        totalTeachers: number;
        totalStudents: number;
        totalGroups: number;
        todayLessons: number;
        monthlyIncome: number;
        monthlyExpenses: number;
        monthlyProfit: number;
        pendingPayments: number;
        atRiskStudents: number;
    }>;
}
