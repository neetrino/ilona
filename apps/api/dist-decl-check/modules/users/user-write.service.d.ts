import { PrismaService } from '../prisma/prisma.service';
import { UserReadService } from './user-read.service';
export declare class UserWriteService {
    private readonly prisma;
    private readonly readService;
    private readonly logger;
    constructor(prisma: PrismaService, readService: UserReadService);
    updateLastLogin(userId: string): Promise<void>;
    updatePassword(userId: string, passwordHash: string): Promise<void>;
    update(userId: string, data: {
        firstName?: string;
        lastName?: string;
        phone?: string;
        avatarUrl?: string;
        email?: string;
        videoUrl?: string | null;
        bio?: string | null;
        experienceYears?: number | null;
    }): Promise<{
        managerCenterId: string | null;
        teacher: {
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
        } | null;
        student: ({
            group: ({
                center: {
                    name: string;
                    id: string;
                    email: string | null;
                    phone: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                    address: string | null;
                    description: string | null;
                    colorHex: string | null;
                    isActive: boolean;
                };
            } & {
                name: string;
                centerId: string;
                teacherId: string | null;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                description: string | null;
                isActive: boolean;
                iconKey: string | null;
                level: string | null;
                maxStudents: number;
                secondTeacherId: string | null;
                secondTeacherStartsFirstWeek: boolean;
                schedule: import("@ilona/database/dist/generated/client/runtime/library").JsonValue | null;
            }) | null;
        } & {
            status: import("@ilona/database").$Enums.StudentStatus;
            groupId: string | null;
            centerId: string | null;
            teacherId: string | null;
            id: string;
            userId: string;
            createdAt: Date;
            updatedAt: Date;
            age: number | null;
            dateOfBirth: Date | null;
            parentName: string | null;
            parentPhone: string | null;
            parentEmail: string | null;
            parentPassportInfo: string | null;
            firstLessonDate: Date | null;
            notes: string | null;
            currentStreak: number;
            riskLabel: import("@ilona/database").$Enums.RiskLabel;
            monthlyFee: import("@ilona/database/dist/generated/client/runtime/library").Decimal;
            enrolledAt: Date;
            registerDate: Date | null;
            receiveReports: boolean;
            leadId: string | null;
        }) | null;
        status: import("@ilona/database").$Enums.UserStatus;
        role: import("@ilona/database").$Enums.UserRole;
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        phone: string | null;
        avatarUrl: string | null;
        lastLoginAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
