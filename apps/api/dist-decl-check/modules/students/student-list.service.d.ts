import { PrismaService } from '../prisma/prisma.service';
import { Prisma, UserRole, UserStatus, StudentStatus } from '@ilona/database';
export declare class StudentListService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(params?: {
        skip?: number;
        take?: number;
        search?: string;
        groupId?: string;
        groupIds?: string[];
        status?: UserStatus;
        statusIds?: UserStatus[];
        teacherId?: string;
        teacherIds?: string[];
        centerId?: string;
        centerIds?: string[];
        lifecycleStatuses?: StudentStatus[];
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
        month?: number;
        year?: number;
        currentUserId?: string;
        userRole?: UserRole;
    }): Promise<{
        items: {
            attendanceSummary: {
                totalClasses: number;
                absences: number;
                justifiedAbsences: number;
                unjustifiedAbsences: number;
            };
            derivedRiskLabel: import("@ilona/database").$Enums.RiskLabel;
            isRecentlyPaidFromCrm: boolean;
            newBadgeExpiresAt: Date;
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
            center: {
                name: string;
                id: string;
            } | null;
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
        }[];
        total: number;
        page: number;
        pageSize: number;
        totalPages: number;
        totalMonthlyFees: number;
    }>;
}
