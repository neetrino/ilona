export declare class QueryStudentDto {
    skip?: number;
    take?: number;
    search?: string;
    groupId?: string;
    groupIds?: string[];
    status?: string;
    statusIds?: string[];
    lifecycleStatuses?: string[];
    teacherId?: string;
    teacherIds?: string[];
    centerId?: string;
    centerIds?: string[];
    sortBy?: 'student' | 'monthlyFee' | 'absence' | 'register';
    sortOrder?: 'asc' | 'desc';
    month?: number;
    year?: number;
}
