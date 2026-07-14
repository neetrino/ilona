import { Prisma } from '@ilona/database';
export interface GroupWeeklySlot {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    notes?: string;
}
export interface GroupCalendarStored {
    dateFrom: string;
    dateTo: string;
    topic?: string;
    description?: string;
    generationKey?: string;
    suppressedSlotStarts?: string[];
}
export type GroupScheduleStored = GroupWeeklySlot[] | {
    weeklySlots: GroupWeeklySlot[];
    calendar?: GroupCalendarStored;
};
export declare function parseGroupSchedulePayload(raw: unknown): {
    weeklySlots: GroupWeeklySlot[];
    calendar: GroupCalendarStored | null;
};
export declare function computeGenerationKey(teacherId: string, secondTeacherId: string, weeklySlots: GroupWeeklySlot[], dateFrom: string, dateTo: string, secondTeacherStartsFirstWeek?: boolean): string;
export declare function buildScheduleJson(weeklySlots: GroupWeeklySlot[], calendar: GroupCalendarStored | null): Prisma.InputJsonValue | typeof Prisma.JsonNull | undefined;
