import { PrismaService } from '../prisma/prisma.service';
import { Prisma, DeductionReason } from '@ilona/database';
import { CreateDeductionDto } from './dto/create-deduction.dto';
export declare class DeductionsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private get db();
    findAll(params?: {
        skip?: number;
        take?: number;
        teacherId?: string;
        reason?: DeductionReason;
        dateFrom?: Date;
        dateTo?: Date;
        centerId?: string;
    }): Promise<{
        items: ({
            teacher: {
                user: {
                    id: string;
                    email: string;
                    firstName: string;
                    lastName: string;
                };
            } & {
                id: string;
                userId: string;
                createdAt: Date;
                updatedAt: Date;
                bio: string | null;
                specialization: string | null;
                hourlyRate: Prisma.Decimal;
                lessonRateAMD: Prisma.Decimal | null;
                videoUrl: string | null;
                workingDays: string[];
                workingHours: Prisma.JsonValue | null;
                hireDate: Date | null;
            };
        } & {
            teacherId: string;
            id: string;
            createdAt: Date;
            lessonId: string | null;
            note: string | null;
            reason: import("@ilona/database").$Enums.DeductionReason;
            amount: Prisma.Decimal;
            percentage: Prisma.Decimal | null;
            appliedAt: Date;
        })[];
        total: number;
        page: number;
        pageSize: number;
        totalPages: number;
    }>;
    findById(id: string): Promise<{
        teacher: {
            user: {
                id: string;
                email: string;
                firstName: string;
                lastName: string;
            };
        } & {
            id: string;
            userId: string;
            createdAt: Date;
            updatedAt: Date;
            bio: string | null;
            specialization: string | null;
            hourlyRate: Prisma.Decimal;
            lessonRateAMD: Prisma.Decimal | null;
            videoUrl: string | null;
            workingDays: string[];
            workingHours: Prisma.JsonValue | null;
            hireDate: Date | null;
        };
    } & {
        teacherId: string;
        id: string;
        createdAt: Date;
        lessonId: string | null;
        note: string | null;
        reason: import("@ilona/database").$Enums.DeductionReason;
        amount: Prisma.Decimal;
        percentage: Prisma.Decimal | null;
        appliedAt: Date;
    }>;
    create(dto: CreateDeductionDto): Promise<{
        teacher: {
            user: {
                email: string;
                firstName: string;
                lastName: string;
            };
        } & {
            id: string;
            userId: string;
            createdAt: Date;
            updatedAt: Date;
            bio: string | null;
            specialization: string | null;
            hourlyRate: Prisma.Decimal;
            lessonRateAMD: Prisma.Decimal | null;
            videoUrl: string | null;
            workingDays: string[];
            workingHours: Prisma.JsonValue | null;
            hireDate: Date | null;
        };
    } & {
        teacherId: string;
        id: string;
        createdAt: Date;
        lessonId: string | null;
        note: string | null;
        reason: import("@ilona/database").$Enums.DeductionReason;
        amount: Prisma.Decimal;
        percentage: Prisma.Decimal | null;
        appliedAt: Date;
    }>;
    createVocabularyDeduction(lessonId: string, amount: number): Promise<{
        teacher: {
            user: {
                email: string;
                firstName: string;
                lastName: string;
            };
        } & {
            id: string;
            userId: string;
            createdAt: Date;
            updatedAt: Date;
            bio: string | null;
            specialization: string | null;
            hourlyRate: Prisma.Decimal;
            lessonRateAMD: Prisma.Decimal | null;
            videoUrl: string | null;
            workingDays: string[];
            workingHours: Prisma.JsonValue | null;
            hireDate: Date | null;
        };
    } & {
        teacherId: string;
        id: string;
        createdAt: Date;
        lessonId: string | null;
        note: string | null;
        reason: import("@ilona/database").$Enums.DeductionReason;
        amount: Prisma.Decimal;
        percentage: Prisma.Decimal | null;
        appliedAt: Date;
    }>;
    createFeedbackDeduction(lessonId: string, amount: number): Promise<{
        teacher: {
            user: {
                email: string;
                firstName: string;
                lastName: string;
            };
        } & {
            id: string;
            userId: string;
            createdAt: Date;
            updatedAt: Date;
            bio: string | null;
            specialization: string | null;
            hourlyRate: Prisma.Decimal;
            lessonRateAMD: Prisma.Decimal | null;
            videoUrl: string | null;
            workingDays: string[];
            workingHours: Prisma.JsonValue | null;
            hireDate: Date | null;
        };
    } & {
        teacherId: string;
        id: string;
        createdAt: Date;
        lessonId: string | null;
        note: string | null;
        reason: import("@ilona/database").$Enums.DeductionReason;
        amount: Prisma.Decimal;
        percentage: Prisma.Decimal | null;
        appliedAt: Date;
    }>;
    delete(id: string): Promise<{
        teacherId: string;
        id: string;
        createdAt: Date;
        lessonId: string | null;
        note: string | null;
        reason: import("@ilona/database").$Enums.DeductionReason;
        amount: Prisma.Decimal;
        percentage: Prisma.Decimal | null;
        appliedAt: Date;
    }>;
    getStatistics(teacherId?: string, dateFrom?: Date, dateTo?: Date, centerId?: string): Promise<{
        total: {
            count: number;
            amount: number;
        };
        byReason: {
            reason: import("@ilona/database").$Enums.DeductionReason;
            count: number;
            amount: number;
        }[];
    }>;
    checkMissingVocabulary(hoursAfterLesson?: number, deductionAmount?: number): Promise<{
        checked: number;
        created: number;
        deductions: ({
            teacher: {
                user: {
                    email: string;
                    firstName: string;
                    lastName: string;
                };
            } & {
                id: string;
                userId: string;
                createdAt: Date;
                updatedAt: Date;
                bio: string | null;
                specialization: string | null;
                hourlyRate: Prisma.Decimal;
                lessonRateAMD: Prisma.Decimal | null;
                videoUrl: string | null;
                workingDays: string[];
                workingHours: Prisma.JsonValue | null;
                hireDate: Date | null;
            };
        } & {
            teacherId: string;
            id: string;
            createdAt: Date;
            lessonId: string | null;
            note: string | null;
            reason: import("@ilona/database").$Enums.DeductionReason;
            amount: Prisma.Decimal;
            percentage: Prisma.Decimal | null;
            appliedAt: Date;
        })[];
    }>;
    checkMissingFeedback(hoursAfterLesson?: number, deductionAmount?: number): Promise<{
        checked: number;
        created: number;
        deductions: ({
            teacher: {
                user: {
                    email: string;
                    firstName: string;
                    lastName: string;
                };
            } & {
                id: string;
                userId: string;
                createdAt: Date;
                updatedAt: Date;
                bio: string | null;
                specialization: string | null;
                hourlyRate: Prisma.Decimal;
                lessonRateAMD: Prisma.Decimal | null;
                videoUrl: string | null;
                workingDays: string[];
                workingHours: Prisma.JsonValue | null;
                hireDate: Date | null;
            };
        } & {
            teacherId: string;
            id: string;
            createdAt: Date;
            lessonId: string | null;
            note: string | null;
            reason: import("@ilona/database").$Enums.DeductionReason;
            amount: Prisma.Decimal;
            percentage: Prisma.Decimal | null;
            appliedAt: Date;
        })[];
    }>;
}
