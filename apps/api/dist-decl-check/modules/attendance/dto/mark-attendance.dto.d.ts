import { AbsenceType } from '@ilona/database';
export declare class MarkAttendanceDto {
    lessonId: string;
    studentId: string;
    isPresent: boolean;
    absenceType?: AbsenceType;
    note?: string;
}
