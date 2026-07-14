import { LessonCreationSource, Prisma } from '@ilona/database';
import { PrismaService } from '../prisma/prisma.service';
import { type GroupCalendarStored, type GroupWeeklySlot } from '../groups/group-schedule-payload';
export declare class GroupScheduleLessonsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    recordSuppressedSlotAfterLessonDeletion(params: {
        groupId: string;
        scheduledAt: Date;
        creationSource: LessonCreationSource;
    }): Promise<void>;
    syncAfterGroupSaved(params: {
        groupId: string;
        teacherId: string | null | undefined;
        secondTeacherId: string | null | undefined;
        secondTeacherStartsFirstWeek: boolean;
        weeklySlots: GroupWeeklySlot[];
        calendar: GroupCalendarStored | null;
        previousScheduleJson: unknown;
        previousTeacherId: string | null;
        previousSecondTeacherId: string | null;
        previousSecondTeacherStartsFirstWeek: boolean | null;
        confirmReplaceGeneratedLessons: boolean;
    }): Promise<Prisma.InputJsonValue | typeof Prisma.JsonNull | undefined>;
}
