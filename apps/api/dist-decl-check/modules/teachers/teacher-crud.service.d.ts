import { CreateTeacherDto, UpdateTeacherDto } from './dto';
import { UserStatus } from '@ilona/database';
import { JwtPayload } from '../../common/types/auth.types';
import { TeacherListService } from './teacher-list.service';
import { TeacherReadService } from './teacher-read.service';
import { TeacherWriteService } from './teacher-write.service';
export declare class TeacherCrudService {
    private readonly listService;
    private readonly readService;
    private readonly writeService;
    constructor(listService: TeacherListService, readService: TeacherReadService, writeService: TeacherWriteService);
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
            hourlyRate: import("@ilona/database/dist/generated/client/runtime/library").Decimal;
            lessonRateAMD: import("@ilona/database/dist/generated/client/runtime/library").Decimal | null;
            videoUrl: string | null;
            workingDays: string[];
            workingHours: import("@ilona/database/dist/generated/client/runtime/library").JsonValue | null;
            hireDate: Date | null;
        }[];
        total: number;
        page: number;
        pageSize: number;
        totalPages: number;
    }>;
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
    create(dto: CreateTeacherDto, currentUser?: JwtPayload): Promise<{
        user: {
            status: import("@ilona/database").$Enums.UserStatus;
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
    }>;
    update(id: string, dto: UpdateTeacherDto, currentUser?: JwtPayload): Promise<{
        user: {
            status: import("@ilona/database").$Enums.UserStatus;
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
    }>;
    delete(id: string, currentUser?: JwtPayload): Promise<{
        success: boolean;
    }>;
    deleteMany(ids: string[], currentUser?: JwtPayload): Promise<{
        success: boolean;
        deletedCount: number;
    }>;
}
