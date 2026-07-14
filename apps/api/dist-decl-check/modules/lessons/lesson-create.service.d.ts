import { PrismaService } from '../prisma/prisma.service';
import { CreateLessonDto } from './dto';
import { UserRole } from '@ilona/database';
import { LessonManagerAccessService } from './lesson-manager-access.service';
export declare class LessonCreateService {
    private readonly prisma;
    private readonly managerAccessService;
    constructor(prisma: PrismaService, managerAccessService: LessonManagerAccessService);
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
}
