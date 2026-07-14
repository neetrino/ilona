import { CreateLessonDto, UpdateLessonDto } from './dto';
import { LessonStatus, UserRole } from '@ilona/database';
import { LessonListService } from './lesson-list.service';
import { LessonReadService } from './lesson-read.service';
import { LessonCreateService } from './lesson-create.service';
import { LessonUpdateService } from './lesson-update.service';
import { LessonDeleteService } from './lesson-delete.service';
export declare class LessonCrudService {
    private readonly listService;
    private readonly readService;
    private readonly createService;
    private readonly updateService;
    private readonly deleteService;
    constructor(listService: LessonListService, readService: LessonReadService, createService: LessonCreateService, updateService: LessonUpdateService, deleteService: LessonDeleteService);
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
                hourlyRate: import("@ilona/database/dist/generated/client/runtime/library").Decimal;
                lessonRateAMD: import("@ilona/database/dist/generated/client/runtime/library").Decimal | null;
                videoUrl: string | null;
                workingDays: string[];
                workingHours: import("@ilona/database/dist/generated/client/runtime/library").JsonValue | null;
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
                hourlyRate: import("@ilona/database/dist/generated/client/runtime/library").Decimal;
                lessonRateAMD: import("@ilona/database/dist/generated/client/runtime/library").Decimal | null;
                videoUrl: string | null;
                workingDays: string[];
                workingHours: import("@ilona/database/dist/generated/client/runtime/library").JsonValue | null;
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
    findById(id: string, currentUserId?: string, userRole?: UserRole): Promise<{
        group: {
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
            students: ({
                user: {
                    status: import("@ilona/database").$Enums.UserStatus;
                    id: string;
                    firstName: string;
                    lastName: string;
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
        };
        teacher: {
            user: {
                id: string;
                email: string;
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
            hourlyRate: import("@ilona/database/dist/generated/client/runtime/library").Decimal;
            lessonRateAMD: import("@ilona/database/dist/generated/client/runtime/library").Decimal | null;
            videoUrl: string | null;
            workingDays: string[];
            workingHours: import("@ilona/database/dist/generated/client/runtime/library").JsonValue | null;
            hireDate: Date | null;
        };
        dailyPlan: {
            id: string;
            createdAt: Date;
        } | null;
        feedbacks: ({
            student: {
                user: {
                    id: string;
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
            student: {
                user: {
                    id: string;
                    firstName: string;
                    lastName: string;
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
            };
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
        substituteTeacher: ({
            user: {
                id: string;
                email: string;
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
            hourlyRate: import("@ilona/database/dist/generated/client/runtime/library").Decimal;
            lessonRateAMD: import("@ilona/database/dist/generated/client/runtime/library").Decimal | null;
            videoUrl: string | null;
            workingDays: string[];
            workingHours: import("@ilona/database/dist/generated/client/runtime/library").JsonValue | null;
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
                hourlyRate: import("@ilona/database/dist/generated/client/runtime/library").Decimal;
                lessonRateAMD: import("@ilona/database/dist/generated/client/runtime/library").Decimal | null;
                videoUrl: string | null;
                workingDays: string[];
                workingHours: import("@ilona/database/dist/generated/client/runtime/library").JsonValue | null;
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
                hourlyRate: import("@ilona/database/dist/generated/client/runtime/library").Decimal;
                lessonRateAMD: import("@ilona/database/dist/generated/client/runtime/library").Decimal | null;
                videoUrl: string | null;
                workingDays: string[];
                workingHours: import("@ilona/database/dist/generated/client/runtime/library").JsonValue | null;
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
                hourlyRate: import("@ilona/database/dist/generated/client/runtime/library").Decimal;
                lessonRateAMD: import("@ilona/database/dist/generated/client/runtime/library").Decimal | null;
                videoUrl: string | null;
                workingDays: string[];
                workingHours: import("@ilona/database/dist/generated/client/runtime/library").JsonValue | null;
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
                hourlyRate: import("@ilona/database/dist/generated/client/runtime/library").Decimal;
                lessonRateAMD: import("@ilona/database/dist/generated/client/runtime/library").Decimal | null;
                videoUrl: string | null;
                workingDays: string[];
                workingHours: import("@ilona/database/dist/generated/client/runtime/library").JsonValue | null;
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
    create(dto: CreateLessonDto, currentUserId?: string, userRole?: UserRole): Promise<{
        group: {
            name: string;
            id: string;
        };
        teacher: {
            user: {
                id: string;
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
    }>;
    createBulk(lessons: CreateLessonDto[], currentUserId?: string, userRole?: UserRole): Promise<({
        group: {
            name: string;
            id: string;
        };
        teacher: {
            user: {
                id: string;
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
    update(id: string, dto: UpdateLessonDto, userId?: string, userRole?: UserRole): Promise<{
        group: {
            name: string;
            centerId: string;
            id: string;
        };
        teacher: {
            user: {
                id: string;
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
        dailyPlan: {
            id: string;
            createdAt: Date;
        } | null;
        substituteTeacher: ({
            user: {
                id: string;
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
    }>;
    setSubstituteForGroupDay(params: {
        groupId: string;
        date: string;
        substituteTeacherId: string | null;
    }, userId: string | undefined, userRole: UserRole | undefined): Promise<{
        updatedCount: number;
        lessonIds: string[];
    }>;
    delete(id: string): Promise<{
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
    }>;
    deleteBulk(lessonIds: string[], currentUserId?: string, userRole?: UserRole): Promise<{
        success: boolean;
        deletedCount: number;
    }>;
}
