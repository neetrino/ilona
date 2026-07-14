import { PrismaService } from '../prisma/prisma.service';
import { UpdateLessonDto } from './dto';
import { UserRole } from '@ilona/database';
import { LessonEnrichmentService } from './lesson-enrichment.service';
import { LessonReadService } from './lesson-read.service';
import { LessonManagerAccessService } from './lesson-manager-access.service';
import { SalariesService } from '../finance/salaries.service';
export declare class LessonUpdateService {
    private readonly prisma;
    private readonly enrichmentService;
    private readonly readService;
    private readonly managerAccessService;
    private readonly salariesService;
    constructor(prisma: PrismaService, enrichmentService: LessonEnrichmentService, readService: LessonReadService, managerAccessService: LessonManagerAccessService, salariesService: SalariesService);
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
}
