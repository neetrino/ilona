import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@ilona/database';
import { AttendanceScopeService } from './attendance-scope.service';
export declare class AttendanceLessonQueryService {
    private readonly prisma;
    private readonly scope;
    constructor(prisma: PrismaService, scope: AttendanceScopeService);
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
}
