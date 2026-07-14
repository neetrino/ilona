import { PrismaService } from '../prisma/prisma.service';
export declare class AnalyticsAttendanceService {
    private readonly prisma;
    constructor(prisma: PrismaService);
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
}
