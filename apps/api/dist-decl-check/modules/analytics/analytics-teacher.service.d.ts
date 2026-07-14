import { PrismaService } from '../prisma/prisma.service';
export declare class AnalyticsTeacherService {
    private readonly prisma;
    constructor(prisma: PrismaService);
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
}
