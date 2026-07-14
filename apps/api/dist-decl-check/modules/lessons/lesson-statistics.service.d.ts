import { PrismaService } from '../prisma/prisma.service';
export declare class LessonStatisticsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getLessonStatistics(teacherId?: string, dateFrom?: Date, dateTo?: Date, centerId?: string): Promise<{
        total: number;
        completed: number;
        cancelled: number;
        missed: number;
        inProgress: number;
        scheduled: number;
        completionRate: number;
    }>;
}
