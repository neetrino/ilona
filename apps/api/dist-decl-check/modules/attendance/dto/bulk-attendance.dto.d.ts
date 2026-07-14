import { AbsenceType } from '@ilona/database';
declare class AttendanceItemDto {
    studentId: string;
    isPresent: boolean;
    absenceType?: AbsenceType;
    note?: string;
}
export declare class BulkAttendanceDto {
    lessonId: string;
    attendances: AttendanceItemDto[];
}
export {};
