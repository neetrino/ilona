export declare class QueryTeacherDto {
    skip?: number;
    take?: number;
    search?: string;
    status?: string;
    sortBy?: 'students' | 'teacher' | 'groups' | 'lessons' | 'obligation' | 'deduction' | 'cost';
    sortOrder?: 'asc' | 'desc';
}
