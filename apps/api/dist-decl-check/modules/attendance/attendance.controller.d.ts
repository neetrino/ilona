import { AttendanceService } from './attendance.service';
import { MarkAttendanceDto, BulkAttendanceDto, QueryAttendanceDto, CreatePlannedAbsenceDto } from './dto';
import { AbsenceType } from '@ilona/database';
import { JwtPayload } from '../../common/types/auth.types';
import { PrismaService } from '../prisma/prisma.service';
export declare class AttendanceController {
    private readonly attendanceService;
    private readonly prisma;
    constructor(attendanceService: AttendanceService, prisma: PrismaService);
    getMyCalendar(user: JwtPayload, query: QueryAttendanceDto): Promise<{
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
    createMyPlannedAbsence(user: JwtPayload, dto: CreatePlannedAbsenceDto): Promise<{
        id: string;
        date: string;
        status: string;
        comment: string;
    }>;
    deleteMyPlannedAbsence(user: JwtPayload, id: string): Promise<{
        success: boolean;
    }>;
    listPlannedAbsences(user: JwtPayload, query: QueryAttendanceDto): Promise<{
        id: string;
        date: string;
        status: string;
        comment: string;
        createdAt: string;
        student: {
            id: string;
            name: string;
            email: string;
            group: {
                name: string;
                id: string;
            } | null;
        };
    }[]>;
    getMyAttendance(user: JwtPayload): Promise<{
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
    getByLessons(lessonIdsParam: string, user?: JwtPayload): Promise<unknown>;
    getByLesson(lessonId: string, user?: JwtPayload): Promise<unknown>;
    getByStudent(studentId: string, query: QueryAttendanceDto): Promise<{
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
    getGroupReport(groupId: string, query: QueryAttendanceDto, user: JwtPayload): Promise<{
        groupId: string;
        dateRange: {
            from: Date;
            to: Date;
        };
        lessonsCount: number;
        studentsReport: {
            student: {
                id: string;
                name: string;
            };
            attendances: {
                lessonId: string;
                date: Date;
                isPresent: boolean | null;
                absenceType: import("@ilona/database").$Enums.AbsenceType | null;
            }[];
            statistics: {
                totalLessons: number;
                present: number;
                absentJustified: number;
                absentUnjustified: number;
                attendanceRate: number;
            };
        }[];
    }>;
    getAtRiskStudents(user: JwtPayload): Promise<{
        student: {
            id: string;
            name: string;
            email: string;
            phone: string | null;
            parentPhone: string | null;
            parentEmail: string | null;
        };
        group: {
            name: string;
            id: string;
        } | null;
        unjustifiedAbsences: number;
        threshold: number;
    }[]>;
    markAttendance(dto: MarkAttendanceDto, user: JwtPayload): Promise<unknown>;
    markBulkAttendance(dto: BulkAttendanceDto, user: JwtPayload): Promise<unknown>;
    updateAbsenceType(id: string, absenceType: AbsenceType, note: string | undefined, user: JwtPayload): Promise<{
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
    }>;
}
