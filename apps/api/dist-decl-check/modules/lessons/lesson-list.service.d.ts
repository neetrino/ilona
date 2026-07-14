import { PrismaService } from '../prisma/prisma.service';
import { Prisma, LessonStatus, UserRole } from '@ilona/database';
import { LessonEnrichmentService } from './lesson-enrichment.service';
import { LessonManagerAccessService } from './lesson-manager-access.service';
export declare class LessonListService {
    private readonly prisma;
    private readonly enrichmentService;
    private readonly managerAccessService;
    constructor(prisma: PrismaService, enrichmentService: LessonEnrichmentService, managerAccessService: LessonManagerAccessService);
    findAll(params?: {
        skip?: number;
        take?: number;
        centerId?: string;
        groupId?: string;
        groupIds?: string[];
        teacherId?: string;
        teacherIds?: string[];
        status?: LessonStatus;
        dateFrom?: Date;
        dateTo?: Date;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
        search?: string;
        currentUserId?: string;
        userRole?: UserRole;
    }): Promise<{
        items: ({
            group: {
                name: string;
                center: {
                    name: string;
                    id: string;
                };
                id: string;
                level: string | null;
            };
            teacher: {
                user: {
                    id: string;
                    firstName: string;
                    lastName: string;
                    avatarUrl: string | null;
                };
            } & {
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
            };
            dailyPlan: {
                id: string;
                createdAt: Date;
            } | null;
            _count: {
                feedbacks: number;
                attendances: number;
            };
            feedbacks: {
                createdAt: Date;
            }[];
            substituteTeacher: ({
                user: {
                    id: string;
                    firstName: string;
                    lastName: string;
                    avatarUrl: string | null;
                };
            } & {
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
            }) | null;
        } & {
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
        } & {
            isLockedForTeacher: boolean;
            completionStatus: "DONE" | "IN_PROCESS" | null;
            dailyDutiesStatus: import("@ilona/types").DailyDutiesLessonStatus;
            dailyPlanCompleted: boolean;
            isAbsenceLocked: boolean;
            isFeedbackLocked: boolean;
            isVoiceLocked: boolean;
            isTextLocked: boolean;
            isDailyPlanLocked: boolean;
            dutyActionStatus: {
                absence: import("@ilona/types").DutyActionStatus;
                feedback: import("@ilona/types").DutyActionStatus;
                voice: import("@ilona/types").DutyActionStatus;
                text: import("@ilona/types").DutyActionStatus;
                dailyPlan: import("@ilona/types").DutyActionStatus;
            };
        })[];
        total: number;
        page: number;
        pageSize: number;
        totalPages: number;
    }>;
    findByTeacher(teacherId: string, dateFrom?: Date, dateTo?: Date): Promise<{
        items: ({
            group: {
                name: string;
                center: {
                    name: string;
                    id: string;
                };
                id: string;
                _count: {
                    students: number;
                };
                level: string | null;
            };
            teacher: {
                user: {
                    id: string;
                    firstName: string;
                    lastName: string;
                    avatarUrl: string | null;
                };
            } & {
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
            };
            dailyPlan: {
                id: string;
                createdAt: Date;
            } | null;
            _count: {
                feedbacks: number;
                attendances: number;
            };
            feedbacks: {
                createdAt: Date;
            }[];
            substituteTeacher: ({
                user: {
                    id: string;
                    firstName: string;
                    lastName: string;
                    avatarUrl: string | null;
                };
            } & {
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
            }) | null;
        } & {
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
        } & {
            isLockedForTeacher: boolean;
            completionStatus: "DONE" | "IN_PROCESS" | null;
            dailyDutiesStatus: import("@ilona/types").DailyDutiesLessonStatus;
            dailyPlanCompleted: boolean;
            isAbsenceLocked: boolean;
            isFeedbackLocked: boolean;
            isVoiceLocked: boolean;
            isTextLocked: boolean;
            isDailyPlanLocked: boolean;
            dutyActionStatus: {
                absence: import("@ilona/types").DutyActionStatus;
                feedback: import("@ilona/types").DutyActionStatus;
                voice: import("@ilona/types").DutyActionStatus;
                text: import("@ilona/types").DutyActionStatus;
                dailyPlan: import("@ilona/types").DutyActionStatus;
            };
        })[];
        total: number;
        page: number;
        pageSize: number;
        totalPages: number;
    }>;
    getTodayLessons(teacherId: string): Promise<{
        items: ({
            group: {
                name: string;
                center: {
                    name: string;
                    id: string;
                };
                id: string;
                _count: {
                    students: number;
                };
                level: string | null;
            };
            teacher: {
                user: {
                    id: string;
                    firstName: string;
                    lastName: string;
                    avatarUrl: string | null;
                };
            } & {
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
            };
            dailyPlan: {
                id: string;
                createdAt: Date;
            } | null;
            _count: {
                feedbacks: number;
                attendances: number;
            };
            feedbacks: {
                createdAt: Date;
            }[];
            substituteTeacher: ({
                user: {
                    id: string;
                    firstName: string;
                    lastName: string;
                    avatarUrl: string | null;
                };
            } & {
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
            }) | null;
        } & {
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
        } & {
            isLockedForTeacher: boolean;
            completionStatus: "DONE" | "IN_PROCESS" | null;
            dailyDutiesStatus: import("@ilona/types").DailyDutiesLessonStatus;
            dailyPlanCompleted: boolean;
            isAbsenceLocked: boolean;
            isFeedbackLocked: boolean;
            isVoiceLocked: boolean;
            isTextLocked: boolean;
            isDailyPlanLocked: boolean;
            dutyActionStatus: {
                absence: import("@ilona/types").DutyActionStatus;
                feedback: import("@ilona/types").DutyActionStatus;
                voice: import("@ilona/types").DutyActionStatus;
                text: import("@ilona/types").DutyActionStatus;
                dailyPlan: import("@ilona/types").DutyActionStatus;
            };
        })[];
        total: number;
        page: number;
        pageSize: number;
        totalPages: number;
    }>;
    getUpcoming(teacherId: string, limit?: number): Promise<({
        group: {
            name: string;
            id: string;
            _count: {
                students: number;
            };
            level: string | null;
        };
    } & {
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
    })[]>;
}
