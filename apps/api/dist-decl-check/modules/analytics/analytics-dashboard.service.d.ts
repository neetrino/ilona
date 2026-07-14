import { PrismaService } from '../prisma/prisma.service';
export declare class AnalyticsDashboardService {
    private readonly prisma;
    constructor(prisma: PrismaService);
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
