import { CreateStudentDto, UpdateStudentDto } from './dto';
import { UserRole, UserStatus, StudentStatus } from '@ilona/database';
import { JwtPayload } from '../../common/types/auth.types';
import { StudentListService } from './student-list.service';
import { StudentReadService } from './student-read.service';
import { StudentCreateService } from './student-create.service';
import { StudentUpdateService } from './student-update.service';
import { StudentDeleteService } from './student-delete.service';
export declare class StudentCrudService {
    private readonly listService;
    private readonly readService;
    private readonly createService;
    private readonly updateService;
    private readonly deleteService;
    constructor(listService: StudentListService, readService: StudentReadService, createService: StudentCreateService, updateService: StudentUpdateService, deleteService: StudentDeleteService);
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
            monthlyFee: import("@ilona/database/dist/generated/client/runtime/library").Decimal;
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
    findById(id: string, currentUserId?: string, userRole?: UserRole): Promise<{
        groupHistory: {
            id: string;
            groupId: string;
            joinedAt: Date;
            leftAt: Date | null;
            group: {
                id: string;
                name: string;
                level: string | null;
                center: {
                    id: string;
                    name: string;
                };
            };
        }[];
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
            teacher: ({
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
                hourlyRate: import("@ilona/database/dist/generated/client/runtime/library").Decimal;
                lessonRateAMD: import("@ilona/database/dist/generated/client/runtime/library").Decimal | null;
                videoUrl: string | null;
                workingDays: string[];
                workingHours: import("@ilona/database/dist/generated/client/runtime/library").JsonValue | null;
                hireDate: Date | null;
            }) | null;
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
        feedbacks: ({
            teacher: {
                user: {
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
                hourlyRate: import("@ilona/database/dist/generated/client/runtime/library").Decimal;
                lessonRateAMD: import("@ilona/database/dist/generated/client/runtime/library").Decimal | null;
                videoUrl: string | null;
                workingDays: string[];
                workingHours: import("@ilona/database/dist/generated/client/runtime/library").JsonValue | null;
                hireDate: Date | null;
            };
            lesson: {
                id: string;
                topic: string | null;
                scheduledAt: Date;
            };
        } & {
            teacherId: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            content: string;
            lessonId: string;
            studentId: string;
            level: import("@ilona/database").$Enums.CefrLevel | null;
            rating: number | null;
            strengths: string | null;
            improvements: string | null;
            grammarTopics: string[];
            skills: string[];
            skillsNote: string | null;
            participation: number | null;
            progress: string | null;
            encouragement: string | null;
        })[];
        attendances: ({
            lesson: {
                id: string;
                topic: string | null;
                scheduledAt: Date;
            };
            markedBy: {
                role: import("@ilona/database").$Enums.UserRole;
                id: string;
                firstName: string;
                lastName: string;
            } | null;
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            lessonId: string;
            studentId: string;
            markedById: string | null;
            isPresent: boolean;
            absenceType: import("@ilona/database").$Enums.AbsenceType | null;
            note: string | null;
            markedAt: Date;
        })[];
        payments: {
            status: import("@ilona/database").$Enums.PaymentStatus;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            notes: string | null;
            studentId: string;
            month: Date;
            transactionId: string | null;
            amount: import("@ilona/database/dist/generated/client/runtime/library").Decimal;
            paidAt: Date | null;
            dueDate: Date;
            paymentMethod: string | null;
            receiptUrl: string | null;
        }[];
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
            teacher: ({
                user: {
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
                hourlyRate: import("@ilona/database/dist/generated/client/runtime/library").Decimal;
                lessonRateAMD: import("@ilona/database/dist/generated/client/runtime/library").Decimal | null;
                videoUrl: string | null;
                workingDays: string[];
                workingHours: import("@ilona/database/dist/generated/client/runtime/library").JsonValue | null;
                hireDate: Date | null;
            }) | null;
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
    }>;
    create(dto: CreateStudentDto, user?: JwtPayload): Promise<{
        user: {
            status: import("@ilona/database").$Enums.UserStatus;
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            phone: string | null;
        };
        group: {
            name: string;
            id: string;
        } | null;
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
    }>;
    createLinkedToCrmPaidLead(leadId: string, dto: CreateStudentDto, actorUserId: string, user?: JwtPayload): Promise<void>;
    update(id: string, dto: UpdateStudentDto, user?: JwtPayload): Promise<{
        user: {
            status: import("@ilona/database").$Enums.UserStatus;
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            phone: string | null;
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
    }>;
    delete(id: string, user?: JwtPayload): Promise<{
        success: boolean;
    }>;
    deleteMany(ids: string[], user?: JwtPayload): Promise<{
        success: boolean;
        deleted: number;
    }>;
}
