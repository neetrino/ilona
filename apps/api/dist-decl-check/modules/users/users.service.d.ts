import { UserRole, UserStatus } from '@ilona/database';
import { UserReadService } from './user-read.service';
import { UserManagerService } from './user-manager.service';
import { UserWriteService } from './user-write.service';
export declare class UsersService {
    private readonly readService;
    private readonly managerService;
    private readonly writeService;
    constructor(readService: UserReadService, managerService: UserManagerService, writeService: UserWriteService);
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
    createManager(data: {
        firstName: string;
        lastName: string;
        email: string;
        password: string;
        phone?: string;
        centerId: string;
    }): Promise<{
        managerProfile: {
            centerId: string;
            center: {
                name: string;
                id: string;
            };
        } | null;
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        phone: string | null;
        role: UserRole;
        status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
        createdAt: Date;
    }>;
    updateManager(managerId: string, data: {
        firstName?: string;
        lastName?: string;
        email?: string;
        phone?: string;
        password?: string;
        centerId?: string;
        status?: UserStatus;
    }): Promise<{
        managerProfile: {
            centerId: string;
            isCurrentAssignment: boolean;
            center: {
                name: string;
                id: string;
            };
            lastManaged: {
                centerId: string;
                centerName: string;
                managedAt: string;
            } | null;
        } | null;
        status: import("@ilona/database").$Enums.UserStatus;
        role: import("@ilona/database").$Enums.UserRole;
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        phone: string | null;
        createdAt: Date;
    }>;
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
