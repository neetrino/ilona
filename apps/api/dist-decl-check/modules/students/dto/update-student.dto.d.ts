import { UserStatus } from '@ilona/database';
export declare class UpdateStudentDto {
    firstName?: string;
    lastName?: string;
    phone?: string;
    age?: number;
    dateOfBirth?: string | null;
    firstLessonDate?: string | null;
    status?: UserStatus;
    groupId?: string | null;
    teacherId?: string | null;
    centerId?: string | null;
    parentName?: string;
    parentPhone?: string;
    parentEmail?: string;
    parentPassportInfo?: string;
    monthlyFee?: number;
    notes?: string;
    receiveReports?: boolean;
    registerDate?: string | null;
}
