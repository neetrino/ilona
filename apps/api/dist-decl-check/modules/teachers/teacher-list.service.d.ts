import { PrismaService } from '../prisma/prisma.service';
import { Prisma, UserStatus } from '@ilona/database';
import { JwtPayload } from '../../common/types/auth.types';
export declare class TeacherListService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(params?: {
        skip?: number;
        take?: number;
        search?: string;
        status?: UserStatus;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
        currentUser?: JwtPayload;
    }): Promise<{
        items: {
            groups: {
                id: string;
                name: string;
                level: string | null;
                center: {
                    id: string;
                    name: string;
                } | undefined;
            }[];
            centers: {
                id: string;
                name: string;
            }[];
            secondTeacherForGroupsCount: number;
            obligationsDoneCount: number;
            obligationsTotal: number;
            deductionAmount: number;
            finalCost: number;
            _count: {
                students: number;
                groups: number;
                secondTeacherForGroups: number;
                lessons: number;
            };
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
            centerLinks: {
                center: {
                    name: string;
                    id: string;
                };
            }[];
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
        }[];
        total: number;
        page: number;
        pageSize: number;
        totalPages: number;
    }>;
}
