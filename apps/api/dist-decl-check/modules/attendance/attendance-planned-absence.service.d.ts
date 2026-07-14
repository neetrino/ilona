import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@ilona/database';
import { AttendanceScopeService } from './attendance-scope.service';
import { AttendanceSideEffectsService } from './attendance-side-effects.service';
export declare class AttendancePlannedAbsenceService {
    private readonly prisma;
    private readonly scope;
    private readonly sideEffects;
    private readonly logger;
    constructor(prisma: PrismaService, scope: AttendanceScopeService, sideEffects: AttendanceSideEffectsService);
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
