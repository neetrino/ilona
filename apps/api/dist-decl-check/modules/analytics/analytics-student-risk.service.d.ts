import { PrismaService } from '../prisma/prisma.service';
import type { StudentRiskLevel } from './analytics.types';
export declare class AnalyticsStudentRiskService {
    private readonly prisma;
    constructor(prisma: PrismaService);
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
        riskLevel: StudentRiskLevel;
        pendingPayments: number;
    }[]>;
}
