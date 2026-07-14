import { CreateGroupDto, UpdateGroupDto } from './dto';
import { JwtPayload } from '../../common/types/auth.types';
import { GroupQueryService } from './group-query.service';
import { GroupWriteService } from './group-write.service';
import { GroupMembershipService } from './group-membership.service';
export declare class GroupsService {
    private readonly queryService;
    private readonly writeService;
    private readonly membershipService;
    constructor(queryService: GroupQueryService, writeService: GroupWriteService, membershipService: GroupMembershipService);
    findAll(params?: Parameters<GroupQueryService['findAll']>[0]): Promise<{
        items: ({
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
            chat: {
                name: string | null;
                groupId: string | null;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                type: import("@ilona/database").$Enums.ChatType;
                isActive: boolean;
            } | null;
            _count: {
                chat: number;
                crmLeads: number;
                center: number;
                teacher: number;
                secondTeacher: number;
                lessons: number;
                students: number;
                studentHistoryEntries: number;
                dailyPlans: number;
                recordingItems: number;
            };
            crmLeads: {
                status: import("@ilona/database").$Enums.CrmLeadStatus;
                groupId: string | null;
                centerId: string | null;
                teacherId: string | null;
                id: string;
                firstName: string | null;
                lastName: string | null;
                phone: string | null;
                createdAt: Date;
                updatedAt: Date;
                createdByUserId: string;
                assignedManagerId: string | null;
                age: number | null;
                dateOfBirth: Date | null;
                parentName: string | null;
                parentPhone: string | null;
                parentEmail: string | null;
                parentPassportInfo: string | null;
                firstLessonDate: Date | null;
                comment: string | null;
                levelId: string | null;
                transferFlag: boolean;
                transferComment: string | null;
                archivedReason: string | null;
                source: string | null;
                notes: string | null;
                teacherApprovedAt: Date | null;
            }[];
            lessons: {
                status: import("@ilona/database").$Enums.LessonStatus;
                groupId: string;
                teacherId: string;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                notes: string | null;
                duration: number;
                description: string | null;
                topic: string | null;
                creationSource: import("@ilona/database").$Enums.LessonCreationSource;
                substituteTeacherId: string | null;
                scheduledAt: Date;
                vocabularySent: boolean;
                vocabularySentAt: Date | null;
                feedbacksCompleted: boolean;
                feedbacksCompletedAt: Date | null;
                absenceMarked: boolean;
                absenceMarkedAt: Date | null;
                voiceSent: boolean;
                voiceSentAt: Date | null;
                textSent: boolean;
                textSentAt: Date | null;
                completedAt: Date | null;
            }[];
            students: {
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
            dailyPlans: {
                groupId: string | null;
                teacherId: string;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                lessonId: string | null;
                date: Date;
            }[];
            recordingItems: {
                groupId: string;
                id: string;
                createdAt: Date;
                fileUrl: string;
                fileName: string | null;
                lessonId: string | null;
                studentId: string;
                durationSec: number | null;
                recordedAt: Date;
            }[];
            secondTeacher: {
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
            studentHistoryEntries: {
                groupId: string;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                joinedAt: Date;
                leftAt: Date | null;
                studentId: string;
            }[];
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
        total: number;
        page: number;
        pageSize: number;
        totalPages: number;
    }>;
    findStudentsByGroupId(groupId: string, params?: {
        skip?: number;
        take?: number;
    }, currentUser?: JwtPayload): Promise<{
        items: ({
            user: {
                status: import("@ilona/database").$Enums.UserStatus;
                id: string;
                email: string;
                firstName: string;
                lastName: string;
            };
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
        })[];
        total: number;
        page: number;
        pageSize: number;
        totalPages: number;
    }>;
    findById(id: string, currentUser?: JwtPayload): Promise<{
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
                phone: string | null;
                avatarUrl: string | null;
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
        chat: {
            id: string;
        } | null;
        _count: {
            lessons: number;
            students: number;
        };
        students: ({
            user: {
                status: import("@ilona/database").$Enums.UserStatus;
                id: string;
                email: string;
                firstName: string;
                lastName: string;
                phone: string | null;
                avatarUrl: string | null;
            };
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
        })[];
        secondTeacher: ({
            user: {
                id: string;
                email: string;
                firstName: string;
                lastName: string;
                phone: string | null;
                avatarUrl: string | null;
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
    }>;
    getTeacherByUserId(userId: string): Promise<{
        id: string;
    } | null>;
    findByTeacher(teacherId: string): Promise<{
        _count: {
            students: number;
            lessons: number;
        };
        center: {
            name: string;
            id: string;
        };
        teacher: {
            user: {
                id: string;
                email: string;
                firstName: string;
                lastName: string;
            };
            id: string;
        } | null;
        secondTeacher: {
            user: {
                id: string;
                email: string;
                firstName: string;
                lastName: string;
            };
            id: string;
        } | null;
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
    }[]>;
    findByTeacherUserId(userId: string): Promise<{
        _count: {
            students: number;
            lessons: number;
        };
        center: {
            name: string;
            id: string;
        };
        teacher: {
            user: {
                id: string;
                email: string;
                firstName: string;
                lastName: string;
            };
            id: string;
        } | null;
        secondTeacher: {
            user: {
                id: string;
                email: string;
                firstName: string;
                lastName: string;
            };
            id: string;
        } | null;
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
    }[]>;
    create(dto: CreateGroupDto, currentUser?: JwtPayload): Promise<{
        center: {
            name: string;
            id: string;
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
        secondTeacher: ({
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
    }>;
    update(id: string, dto: UpdateGroupDto, currentUser?: JwtPayload): Promise<{
        center: {
            name: string;
            id: string;
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
        secondTeacher: ({
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
    }>;
    delete(id: string, currentUser?: JwtPayload): Promise<{
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
    }>;
    toggleActive(id: string, currentUser?: JwtPayload): Promise<{
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
    }>;
    assignTeacher(groupId: string, teacherId: string, currentUser?: JwtPayload): Promise<{
        center: {
            name: string;
            id: string;
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
    }>;
    addStudent(groupId: string, studentId: string, currentUser?: JwtPayload): Promise<{
        success: boolean;
    }>;
    removeStudent(groupId: string, studentId: string, currentUser?: JwtPayload): Promise<{
        success: boolean;
    }>;
}
