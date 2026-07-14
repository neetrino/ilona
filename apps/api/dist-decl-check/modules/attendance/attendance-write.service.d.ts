import { PrismaService } from '../prisma/prisma.service';
import { MarkAttendanceDto, BulkAttendanceDto } from './dto';
import { AbsenceType, UserRole } from '@ilona/database';
import { SalariesService } from '../finance/salaries.service';
import { AttendanceScopeService } from './attendance-scope.service';
import { AttendanceSideEffectsService } from './attendance-side-effects.service';
import type { Prisma } from '@ilona/database';
export declare class AttendanceWriteService {
    private readonly prisma;
    private readonly scope;
    private readonly sideEffects;
    private readonly salariesService;
    constructor(prisma: PrismaService, scope: AttendanceScopeService, sideEffects: AttendanceSideEffectsService, salariesService: SalariesService);
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
            monthlyFee: Prisma.Decimal;
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
                monthlyFee: Prisma.Decimal;
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
    private syncLessonAbsenceMarkedInTx;
    private syncLessonAbsenceMarked;
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
}
