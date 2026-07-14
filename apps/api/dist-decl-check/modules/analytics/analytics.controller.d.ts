import { AnalyticsService } from './analytics.service';
export declare class AnalyticsController {
    private readonly analyticsService;
    constructor(analyticsService: AnalyticsService);
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
    getTeacherPerformance(dateFrom?: string, dateTo?: string): Promise<{
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
    getRevenueAnalytics(months?: string, dateFrom?: string, dateTo?: string, series?: 'none' | 'per_day' | 'per_month'): Promise<import("./analytics.types").RevenueAnalyticsRow[]>;
    getAttendanceOverview(dateFrom?: string, dateTo?: string): Promise<{
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
    getLessonsOverview(dateFrom?: string, dateTo?: string): Promise<{
        total: number;
        completed: number;
        cancelled: number;
        missed: number;
        scheduled: number;
        inProgress: number;
        completionRate: number;
        vocabularySentRate: number;
    }>;
}
