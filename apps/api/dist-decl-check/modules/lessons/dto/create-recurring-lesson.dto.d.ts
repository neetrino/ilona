export declare class CreateRecurringLessonDto {
    groupId: string;
    teacherId: string;
    weekdays: number[];
    startTime: string;
    endTime: string;
    startDate: string;
    endDate: string;
    topic?: string;
    description?: string;
}
