import { UserStatus } from '@ilona/database';
export declare class UpdateTeacherDto {
    firstName?: string;
    lastName?: string;
    phone?: string;
    status?: UserStatus;
    bio?: string;
    specialization?: string;
    hourlyRate?: number;
    lessonRateAMD?: number;
    experienceYears?: number | null;
    workingDays?: string[];
    workingHours?: {
        MON?: Array<{
            start: string;
            end: string;
        }>;
        TUE?: Array<{
            start: string;
            end: string;
        }>;
        WED?: Array<{
            start: string;
            end: string;
        }>;
        THU?: Array<{
            start: string;
            end: string;
        }>;
        FRI?: Array<{
            start: string;
            end: string;
        }>;
        SAT?: Array<{
            start: string;
            end: string;
        }>;
        SUN?: Array<{
            start: string;
            end: string;
        }>;
    };
    videoUrl?: string | null;
    centerIds?: string[];
}
