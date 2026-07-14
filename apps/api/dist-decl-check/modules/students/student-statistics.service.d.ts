import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@ilona/database';
export declare class StudentStatisticsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getStatistics(id: string, currentUserId?: string, userRole?: UserRole): Promise<{
        attendance: {
            total: number;
            present: number;
            absent: number;
            unjustifiedAbsences: number;
            currentStreak: number;
            rate: number;
        };
        recordings: {
            total: number;
            submitted: number;
            rate: number;
        };
        payments: {
            pending: number;
            overdue: number;
            paid: number;
            rate: number;
        };
        feedbacks: number;
        progress: {
            attendanceRate: number;
            recordingRate: number;
            paymentRate: number;
            overall: number;
        };
    }>;
    private getRecordingStats;
    getMyDashboard(userId: string): Promise<unknown>;
}
