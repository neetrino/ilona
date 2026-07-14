import { PrismaService } from '../prisma/prisma.service';
import { PaymentsService } from './payments.service';
import { DeductionsService } from './deductions.service';
export declare class FinanceService {
    private readonly prisma;
    private readonly paymentsService;
    private readonly deductionsService;
    constructor(prisma: PrismaService, paymentsService: PaymentsService, deductionsService: DeductionsService);
    getDashboard(dateFrom?: Date, dateTo?: Date, centerId?: string): Promise<{
        revenue: {
            totalRevenue: number;
            totalPayments: number;
            averagePayment: number;
            byMethod: {
                method: string | null;
                count: number;
                amount: number;
            }[];
        };
        expenses: {
            totalExpenses: number;
            salariesPaid: number;
        };
        pendingPayments: {
            pending: number;
            overdue: number;
            total: number;
        };
        pendingSalaries: number;
        profit: number;
    }>;
    private getExpensesStats;
    private getPendingPaymentsCount;
    private getPendingSalariesCount;
    getMonthlyReport(year: number, month: number, centerId?: string): Promise<unknown>;
    runAutomatedTasks(): Promise<{
        overduePayments: number;
        vocabularyDeductions: number;
        feedbackDeductions: number;
    }>;
}
