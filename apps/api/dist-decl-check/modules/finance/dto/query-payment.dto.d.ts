import { PaymentStatus } from '@ilona/database';
export declare class QueryPaymentDto {
    skip?: number;
    take?: number;
    studentId?: string;
    status?: PaymentStatus;
    dateFrom?: string;
    dateTo?: string;
    q?: string;
}
