import { PrismaService } from '../prisma/prisma.service';
export declare class AnalyticsLessonsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
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
}
