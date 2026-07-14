export declare class CreateTeacherDto {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    bio?: string;
    specialization?: string;
    hourlyRate: number;
    lessonRateAMD?: number;
    experienceYears?: number;
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
    videoUrl?: string;
    centerIds?: string[];
}
