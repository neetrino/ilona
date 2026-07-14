import { PrismaService } from '../prisma/prisma.service';
import { Prisma, UserStatus } from '@ilona/database';
export declare class StudentQueryService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    findAssignedToTeacher(teacherId: string, params?: {
        skip?: number;
        take?: number;
        search?: string;
        status?: UserStatus;
        groupId?: string;
    }): Promise<{
        items: ({
            type: "onboarding";
            leadId: string;
            status: string;
            firstName: string | null;
            lastName: string | null;
            phone: string | null;
            teacherApprovedAt: Date | null;
            transferFlag: boolean;
            transferComment: string | null;
            groupId: string | null;
            group: {
                id: string;
                name: string;
                level: string | null;
                center: {
                    id: string;
                    name: string;
                } | null;
            } | null;
        } | {
            user: {
                status: import("@ilona/database").$Enums.UserStatus;
                id: string;
                email: string;
                firstName: string;
                lastName: string;
                phone: string | null;
                avatarUrl: string | null;
                lastLoginAt: Date | null;
                createdAt: Date;
            };
            group: {
                name: string;
                center: {
                    name: string;
                    id: string;
                };
                id: string;
                level: string | null;
            } | null;
            teacher: {
                user: {
                    id: string;
                    email: string;
                    firstName: string;
                    lastName: string;
                    phone: string | null;
                };
                id: string;
            } | null;
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
            type: "student";
        })[];
        total: number;
        page: number;
        pageSize: number;
        totalPages: number;
        totalMonthlyFees: number;
    }>;
    findAssignedToTeacherByUserId(userId: string, params?: {
        skip?: number;
        take?: number;
        search?: string;
        status?: UserStatus;
        groupId?: string;
    }): Promise<{
        items: ({
            type: "onboarding";
            leadId: string;
            status: string;
            firstName: string | null;
            lastName: string | null;
            phone: string | null;
            teacherApprovedAt: Date | null;
            transferFlag: boolean;
            transferComment: string | null;
            groupId: string | null;
            group: {
                id: string;
                name: string;
                level: string | null;
                center: {
                    id: string;
                    name: string;
                } | null;
            } | null;
        } | {
            user: {
                status: import("@ilona/database").$Enums.UserStatus;
                id: string;
                email: string;
                firstName: string;
                lastName: string;
                phone: string | null;
                avatarUrl: string | null;
                lastLoginAt: Date | null;
                createdAt: Date;
            };
            group: {
                name: string;
                center: {
                    name: string;
                    id: string;
                };
                id: string;
                level: string | null;
            } | null;
            teacher: {
                user: {
                    id: string;
                    email: string;
                    firstName: string;
                    lastName: string;
                    phone: string | null;
                };
                id: string;
            } | null;
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
            type: "student";
        })[];
        total: number;
        page: number;
        pageSize: number;
        totalPages: number;
        totalMonthlyFees: number;
    }>;
    getMyTeachers(userId: string): Promise<{
        id: string;
        userId: string;
        name: string | undefined;
        firstName: string;
        lastName: string;
        phone: string | null;
        avatarUrl: string | null;
    }[]>;
}
