import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@ilona/database';
import { AttendanceScopeService } from './attendance-scope.service';
export declare class AttendanceReportService {
    private readonly prisma;
    private readonly scope;
    constructor(prisma: PrismaService, scope: AttendanceScopeService);
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
}
