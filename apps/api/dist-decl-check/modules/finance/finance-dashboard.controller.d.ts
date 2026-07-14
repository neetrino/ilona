import { JwtPayload } from '../../common/types/auth.types';
import { FinanceService } from './finance.service';
export declare class FinanceDashboardController {
    private readonly financeService;
    constructor(financeService: FinanceService);
    getDashboard(user: JwtPayload, dateFrom?: string, dateTo?: string): Promise<{
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
    getMonthlyReport(user: JwtPayload, year: string, month: string): Promise<unknown>;
    runAutomatedTasks(): Promise<{
        overduePayments: number;
        vocabularyDeductions: number;
        feedbackDeductions: number;
    }>;
}
