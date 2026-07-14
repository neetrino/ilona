import { PrismaService } from '../prisma/prisma.service';
export declare class AttendanceStudentQueryService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    getByStudent(studentId: string, params?: {
        dateFrom?: Date;
        dateTo?: Date;
    }): Promise<{
        attendances: ({
            lesson: {
                group: {
                    name: string;
                    id: string;
                };
                id: string;
                topic: string | null;
                scheduledAt: Date;
            };
            markedBy: {
                role: import("@ilona/database").$Enums.UserRole;
                id: string;
                firstName: string;
                lastName: string;
            } | null;
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            lessonId: string;
            studentId: string;
            markedById: string | null;
            isPresent: boolean;
            absenceType: import("@ilona/database").$Enums.AbsenceType | null;
            note: string | null;
            markedAt: Date;
        })[];
        statistics: {
            total: number;
            present: number;
            absent: number;
            absentJustified: number;
            absentUnjustified: number;
            attendanceRate: number;
        };
    }>;
    getStudentCalendarMonth(studentId: string, params?: {
        dateFrom?: Date;
        dateTo?: Date;
    }): Promise<{
        lessons: never[] | {
            group: {
                name: string;
                id: string;
            };
            id: string;
            topic: string | null;
            scheduledAt: Date;
        }[];
        attendances: ({
            lesson: {
                group: {
                    name: string;
                    id: string;
                };
                id: string;
                topic: string | null;
                scheduledAt: Date;
            };
            markedBy: {
                role: import("@ilona/database").$Enums.UserRole;
                id: string;
                firstName: string;
                lastName: string;
            } | null;
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            lessonId: string;
            studentId: string;
            markedById: string | null;
            isPresent: boolean;
            absenceType: import("@ilona/database").$Enums.AbsenceType | null;
            note: string | null;
            markedAt: Date;
        })[];
        statistics: {
            total: number;
            present: number;
            absent: number;
            absentJustified: number;
            absentUnjustified: number;
            attendanceRate: number;
        };
        plannedAbsences: {
            id: string;
            date: string;
            status: string;
            comment: string;
        }[];
    }>;
    private findPlannedAbsencesForStudentSafe;
}
