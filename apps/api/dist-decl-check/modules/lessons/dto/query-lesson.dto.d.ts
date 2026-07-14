export declare class QueryLessonDto {
    skip?: number;
    take?: number;
    centerId?: string;
    groupId?: string;
    groupIds?: string[];
    teacherId?: string;
    teacherIds?: string[];
    status?: string;
    dateFrom?: string;
    dateTo?: string;
    sortBy?: 'scheduledAt' | 'dateTime';
    sortOrder?: 'asc' | 'desc';
    q?: string;
}
