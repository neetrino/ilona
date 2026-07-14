import { JwtPayload } from '../../common/types/auth.types';
import { PaymentsService } from './payments.service';
import { ProcessPaymentDto } from './dto/create-payment.dto';
import { FinanceControllerScopeService } from './finance-controller-scope.service';
export declare class FinanceStudentController {
    private readonly paymentsService;
    private readonly scope;
    constructor(paymentsService: PaymentsService, scope: FinanceControllerScopeService);
    getMyPayments(user: JwtPayload, skip?: string, take?: string, status?: string, dateFrom?: string, dateTo?: string): Promise<unknown>;
    getMyPaymentsSummary(user: JwtPayload): Promise<{
        totalPaid: number;
        totalPending: number;
        totalOverdue: number;
        nextPayment: {
            id: string;
            amount: number;
            dueDate: string;
        } | null;
    }>;
    processMyPayment(user: JwtPayload, id: string, dto: ProcessPaymentDto): Promise<unknown>;
}
