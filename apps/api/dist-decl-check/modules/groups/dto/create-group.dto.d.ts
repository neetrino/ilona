export declare class GroupScheduleEntryDto {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    notes?: string;
}
export declare class GroupCalendarPlanDto {
    dateFrom: string;
    dateTo: string;
    topic?: string;
    description?: string;
}
export declare class CreateGroupDto {
    name: string;
    level?: string;
    description?: string;
    centerId: string;
    teacherId?: string;
    secondTeacherId?: string;
    secondTeacherStartsFirstWeek?: boolean;
    schedule?: GroupScheduleEntryDto[];
    calendarPlan?: GroupCalendarPlanDto;
    isActive?: boolean;
    iconKey?: string | null;
}
