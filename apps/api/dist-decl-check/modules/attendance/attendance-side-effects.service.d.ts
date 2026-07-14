import { PrismaService } from '../prisma/prisma.service';
export declare class AttendanceSideEffectsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    notifyStaffOfPlannedAbsence(student: {
        id: string;
        user: {
            firstName: string;
            lastName: string;
        };
        group: {
            name: string;
            teacherId: string | null;
            centerId: string;
        } | null;
    }, dateStr: string, comment: string): Promise<void>;
    checkAbsenceThreshold(studentId: string): Promise<void>;
}
