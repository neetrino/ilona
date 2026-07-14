import { MarkAttendanceDto, BulkAttendanceDto } from './dto';
import { AbsenceType, UserRole } from '@ilona/database';
import { AttendanceLessonQueryService } from './attendance-lesson-query.service';
import { AttendanceStudentQueryService } from './attendance-student-query.service';
import { AttendanceReportService } from './attendance-report.service';
import { AttendanceWriteService } from './attendance-write.service';
import { AttendancePlannedAbsenceService } from './attendance-planned-absence.service';
export declare class AttendanceService {
    private readonly lessonQuery;
    private readonly studentQuery;
    private readonly reportService;
    private readonly writeService;
    private readonly plannedAbsenceService;
    constructor(lessonQuery: AttendanceLessonQueryService, studentQuery: AttendanceStudentQueryService, reportService: AttendanceReportService, writeService: AttendanceWriteService, plannedAbsenceService: AttendancePlannedAbsenceService);
    getByLesson(lessonId: string, userId?: string, userRole?: UserRole): Promise<{
        lesson: {
            id: string;
            scheduledAt: Date;
            topic: string | null;
            status: import("@ilona/database").$Enums.LessonStatus;
        };
        studentsWithAttendance: {
            student: {
                user: {
                    status: import("@ilona/database").$Enums.UserStatus;
                    id: string;
                    firstName: string;
                    lastName: string;
                    avatarUrl: string | null;
                };
            } & {
                status: import("@ilona/database").$Enums.StudentStatus;
                groupId: string | null;
                centerId: string | null;
                teacherId: string | null;
                id: string;
                userId: string;
                createdAt: Date;
                updatedAt: Date;
                age: number | null;
                dateOfBirth: Date | null;
                parentName: string | null;
                parentPhone: string | null;
                parentEmail: string | null;
                parentPassportInfo: string | null;
                firstLessonDate: Date | null;
                notes: string | null;
                currentStreak: number;
                riskLabel: import("@ilona/database").$Enums.RiskLabel;
                monthlyFee: import("@ilona/database/dist/generated/client/runtime/library").Decimal;
                enrolledAt: Date;
                registerDate: Date | null;
                receiveReports: boolean;
                leadId: string | null;
            };
            attendance: ({
                student: {
                    user: {
                        id: string;
                        firstName: string;
                        lastName: string;
                        avatarUrl: string | null;
                    };
                } & {
                    status: import("@ilona/database").$Enums.StudentStatus;
                    groupId: string | null;
                    centerId: string | null;
                    teacherId: string | null;
                    id: string;
                    userId: string;
                    createdAt: Date;
                    updatedAt: Date;
                    age: number | null;
                    dateOfBirth: Date | null;
                    parentName: string | null;
                    parentPhone: string | null;
                    parentEmail: string | null;
                    parentPassportInfo: string | null;
                    firstLessonDate: Date | null;
                    notes: string | null;
                    currentStreak: number;
                    riskLabel: import("@ilona/database").$Enums.RiskLabel;
                    monthlyFee: import("@ilona/database/dist/generated/client/runtime/library").Decimal;
                    enrolledAt: Date;
                    registerDate: Date | null;
                    receiveReports: boolean;
                    leadId: string | null;
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
            }) | null;
        }[];
        summary: {
            total: number;
            present: number;
            absent: number;
            notMarked: number;
        };
    }>;
    getByLessons(lessonIds: string[], userId?: string, userRole?: UserRole): Promise<Record<string, {
        lesson: {
            id: string;
            scheduledAt: Date;
            topic: string | null;
            status: import("@ilona/database").$Enums.LessonStatus;
        };
        studentsWithAttendance: {
            student: {
                user: {
                    status: import("@ilona/database").$Enums.UserStatus;
                    id: string;
                    firstName: string;
                    lastName: string;
                    avatarUrl: string | null;
                };
            } & {
                status: import("@ilona/database").$Enums.StudentStatus;
                groupId: string | null;
                centerId: string | null;
                teacherId: string | null;
                id: string;
                userId: string;
                createdAt: Date;
                updatedAt: Date;
                age: number | null;
                dateOfBirth: Date | null;
                parentName: string | null;
                parentPhone: string | null;
                parentEmail: string | null;
                parentPassportInfo: string | null;
                firstLessonDate: Date | null;
                notes: string | null;
                currentStreak: number;
                riskLabel: import("@ilona/database").$Enums.RiskLabel;
                monthlyFee: import("@ilona/database/dist/generated/client/runtime/library").Decimal;
                enrolledAt: Date;
                registerDate: Date | null;
                receiveReports: boolean;
                leadId: string | null;
            };
            attendance: ({
                student: {
                    user: {
                        id: string;
                        firstName: string;
                        lastName: string;
                        avatarUrl: string | null;
                    };
                } & {
                    status: import("@ilona/database").$Enums.StudentStatus;
                    groupId: string | null;
                    centerId: string | null;
                    teacherId: string | null;
                    id: string;
                    userId: string;
                    createdAt: Date;
                    updatedAt: Date;
                    age: number | null;
                    dateOfBirth: Date | null;
                    parentName: string | null;
                    parentPhone: string | null;
                    parentEmail: string | null;
                    parentPassportInfo: string | null;
                    firstLessonDate: Date | null;
                    notes: string | null;
                    currentStreak: number;
                    riskLabel: import("@ilona/database").$Enums.RiskLabel;
                    monthlyFee: import("@ilona/database/dist/generated/client/runtime/library").Decimal;
                    enrolledAt: Date;
                    registerDate: Date | null;
                    receiveReports: boolean;
                    leadId: string | null;
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
            }) | null;
        }[];
        summary: {
            total: number;
            present: number;
            absent: number;
            notMarked: number;
        };
    }>>;
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
    markAttendance(dto: MarkAttendanceDto, userId?: string, userRole?: UserRole): Promise<{
        student: {
            user: {
                id: string;
                firstName: string;
                lastName: string;
            };
        } & {
            status: import("@ilona/database").$Enums.StudentStatus;
            groupId: string | null;
            centerId: string | null;
            teacherId: string | null;
            id: string;
            userId: string;
            createdAt: Date;
            updatedAt: Date;
            age: number | null;
            dateOfBirth: Date | null;
            parentName: string | null;
            parentPhone: string | null;
            parentEmail: string | null;
            parentPassportInfo: string | null;
            firstLessonDate: Date | null;
            notes: string | null;
            currentStreak: number;
            riskLabel: import("@ilona/database").$Enums.RiskLabel;
            monthlyFee: import("@ilona/database/dist/generated/client/runtime/library").Decimal;
            enrolledAt: Date;
            registerDate: Date | null;
            receiveReports: boolean;
            leadId: string | null;
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
    }>;
    markBulkAttendance(dto: BulkAttendanceDto, userId?: string, userRole?: UserRole): Promise<{
        success: boolean;
        count: number;
        attendances: ({
            student: {
                user: {
                    id: string;
                    firstName: string;
                    lastName: string;
                };
            } & {
                status: import("@ilona/database").$Enums.StudentStatus;
                groupId: string | null;
                centerId: string | null;
                teacherId: string | null;
                id: string;
                userId: string;
                createdAt: Date;
                updatedAt: Date;
                age: number | null;
                dateOfBirth: Date | null;
                parentName: string | null;
                parentPhone: string | null;
                parentEmail: string | null;
                parentPassportInfo: string | null;
                firstLessonDate: Date | null;
                notes: string | null;
                currentStreak: number;
                riskLabel: import("@ilona/database").$Enums.RiskLabel;
                monthlyFee: import("@ilona/database/dist/generated/client/runtime/library").Decimal;
                enrolledAt: Date;
                registerDate: Date | null;
                receiveReports: boolean;
                leadId: string | null;
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
    }>;
    updateAbsenceType(attendanceId: string, absenceType: AbsenceType, note?: string, userId?: string, userRole?: UserRole): Promise<{
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
    getGroupAttendanceReport(groupId: string, dateFrom: Date, dateTo: Date, userId?: string, userRole?: UserRole): Promise<{
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
    getAtRiskStudents(maxUnjustifiedAbsences?: number, currentUser?: {
        sub: string;
        role: UserRole;
    }): Promise<{
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
    createPlannedAbsenceForStudentUser(userId: string, dateStr: string, rawComment: string): Promise<{
        id: string;
        date: string;
        status: string;
        comment: string;
    }>;
    deleteMyPlannedAbsence(userId: string, plannedAbsenceId: string): Promise<{
        success: boolean;
    }>;
    listPlannedAbsencesForStaff(dateFrom: Date, dateTo: Date, userId: string, userRole: UserRole): Promise<{
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
}
