import { JwtPayload } from '../../common/types/auth.types';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto, UpdatePaymentDto, QueryPaymentDto, ProcessPaymentDto } from './dto/create-payment.dto';
export declare class FinancePaymentsController {
    private readonly paymentsService;
    constructor(paymentsService: PaymentsService);
    getPayments(user: JwtPayload, query: QueryPaymentDto): Promise<unknown>;
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
    getRevenueStats(user: JwtPayload, dateFrom?: string, dateTo?: string): Promise<{
        totalRevenue: number;
        totalPayments: number;
        averagePayment: number;
        byMethod: {
            method: string | null;
            count: number;
            amount: number;
        }[];
    }>;
    getPayment(id: string): Promise<unknown>;
    createPayment(dto: CreatePaymentDto): Promise<unknown>;
    updatePayment(id: string, dto: UpdatePaymentDto): Promise<unknown>;
    processPayment(id: string, dto: ProcessPaymentDto): Promise<unknown>;
    cancelPayment(id: string): Promise<unknown>;
    deletePayments(ids: string[]): Promise<{
        deleted: number;
    }>;
    deletePayment(id: string): Promise<unknown>;
}
