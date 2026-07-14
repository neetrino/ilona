import { PrismaService } from '../prisma/prisma.service';
export declare class PaymentSummaryService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private get db();
    getStudentPaymentSummary(studentId: string): Promise<{
        totalPaid: number;
        totalPending: number;
        totalOverdue: number;
        nextPayment: {
            id: string;
            amount: number;
            dueDate: string;
        } | null;
    }>;
    getRevenueStats(dateFrom?: Date, dateTo?: Date, centerId?: string): Promise<{
        totalRevenue: number;
        totalPayments: number;
        averagePayment: number;
        byMethod: {
            method: string | null;
            count: number;
            amount: number;
        }[];
    }>;
}
