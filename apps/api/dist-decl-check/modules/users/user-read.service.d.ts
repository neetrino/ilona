import type { Cache } from 'cache-manager';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, UserRole } from '@ilona/database';
export declare class UserReadService {
    private readonly prisma;
    private readonly cache;
    private readonly logger;
    constructor(prisma: PrismaService, cache: Cache);
    invalidateUserCache(userId: string): Promise<void>;
    findByEmail(email: string): Promise<{
        status: import("@ilona/database").$Enums.UserStatus;
        role: import("@ilona/database").$Enums.UserRole;
        id: string;
        email: string;
        passwordHash: string;
        firstName: string;
        lastName: string;
        phone: string | null;
        avatarUrl: string | null;
        lastLoginAt: Date | null;
        lastSeenAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
    } | null>;
    findAuthById(id: string): Promise<{
        status: import("@ilona/database").$Enums.UserStatus;
        id: string;
        passwordHash: string;
    } | null>;
    getManagerCenterId(userId: string): Promise<string | null>;
    findById(id: string): Promise<{
        status: import("@ilona/database").$Enums.UserStatus;
        role: import("@ilona/database").$Enums.UserRole;
        id: string;
        email: string;
        passwordHash: string;
        firstName: string;
        lastName: string;
        phone: string | null;
        avatarUrl: string | null;
        lastLoginAt: Date | null;
        lastSeenAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
    } | {
        managerCenterId: string | null;
        teacher: {
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
                schedule: Prisma.JsonValue | null;
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
            monthlyFee: Prisma.Decimal;
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
    findAll(filters?: {
        role?: UserRole;
        status?: string;
    }): Promise<{
        status: import("@ilona/database").$Enums.UserStatus;
        role: import("@ilona/database").$Enums.UserRole;
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        phone: string | null;
        avatarUrl: string | null;
        createdAt: Date;
    }[]>;
    findManagers(): Promise<{
        status: import("@ilona/database").$Enums.UserStatus;
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        phone: string | null;
        createdAt: Date;
    }[]>;
}
