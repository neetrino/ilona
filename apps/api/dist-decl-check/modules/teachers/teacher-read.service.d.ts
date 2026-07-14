import { PrismaService } from '../prisma/prisma.service';
import { JwtPayload } from '../../common/types/auth.types';
import { TeacherAccessService } from './teacher-access.service';
export declare class TeacherReadService {
    private readonly prisma;
    private readonly accessService;
    constructor(prisma: PrismaService, accessService: TeacherAccessService);
    findById(id: string, currentUser?: JwtPayload): Promise<{
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
        _count: {
            feedbacks: number;
            groups: number;
            secondTeacherForGroups: number;
            lessons: number;
        };
        groups: ({
            center: {
                name: string;
                id: string;
            };
            _count: {
                students: number;
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
        })[];
        secondTeacherForGroups: ({
            center: {
                name: string;
                id: string;
            };
            _count: {
                students: number;
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
        })[];
        centerLinks: {
            center: {
                name: string;
                id: string;
            };
        }[];
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
    }>;
    findByUserId(userId: string): Promise<{
        user: {
            status: import("@ilona/database").$Enums.UserStatus;
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            phone: string | null;
            avatarUrl: string | null;
        };
        groups: ({
            center: {
                name: string;
                id: string;
            };
            _count: {
                lessons: number;
                students: number;
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
        })[];
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
    }>;
}
