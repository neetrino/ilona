import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@ilona/database';
import { GroupScheduleLessonsService } from './group-schedule-lessons.service';
import { LessonManagerAccessService } from './lesson-manager-access.service';
export declare class LessonDeleteService {
    private readonly prisma;
    private readonly groupScheduleLessonsService;
    private readonly managerAccessService;
    constructor(prisma: PrismaService, groupScheduleLessonsService: GroupScheduleLessonsService, managerAccessService: LessonManagerAccessService);
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
