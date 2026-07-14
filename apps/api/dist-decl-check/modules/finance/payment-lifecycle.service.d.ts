import { PrismaService } from '../prisma/prisma.service';
export declare class PaymentLifecycleService {
    private readonly prisma;
    private lastActiveStudentsSyncAt;
    private static readonly ACTIVE_STUDENTS_SYNC_TTL_MS;
    constructor(prisma: PrismaService);
    private get db();
    ensureMonthlyPayments(studentId: string): Promise<void>;
    ensureCurrentMonthPaymentsForActiveStudents(): Promise<void>;
    checkOverduePayments(): Promise<{
        updated: number;
    }>;
}
