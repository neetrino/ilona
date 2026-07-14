import { PrismaService } from '../prisma/prisma.service';
export declare class SalaryRecordReadService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private get db();
    findById(id: string): Promise<{
        obligationsInfo: unknown;
        actionBreakdown: {
            absenceMarked: {
                completed: number;
                required: number;
            };
            feedbacksCompleted: {
                completed: number;
                required: number;
            };
            voiceSent: {
                completed: number;
                required: number;
            };
            textSent: {
                completed: number;
                required: number;
            };
            dailyPlan: {
                completed: number;
                required: number;
            };
        };
        teacher: {
            user: {
                id: string;
                email: string;
                firstName: string;
                lastName: string;
                phone: string | null;
            };
        } & {
            id: string;
            userId: string;
            createdAt: Date;
            updatedAt: Date;
            bio: string | null;
            specialization: string | null;
            hourlyRate: import("@ilona/database/dist/generated/client/runtime/library").Decimal;
            lessonRateAMD: import("@ilona/database/dist/generated/client/runtime/library").Decimal | null;
            videoUrl: string | null;
            workingDays: string[];
            workingHours: import("@ilona/database/dist/generated/client/runtime/library").JsonValue | null;
            hireDate: Date | null;
        };
        status: import("@ilona/database").$Enums.SalaryStatus;
        teacherId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        notes: string | null;
        lessonsCount: number;
        month: Date;
        grossAmount: import("@ilona/database/dist/generated/client/runtime/library").Decimal;
        totalDeductions: import("@ilona/database/dist/generated/client/runtime/library").Decimal;
        netAmount: import("@ilona/database/dist/generated/client/runtime/library").Decimal;
        paidAt: Date | null;
    }>;
}
