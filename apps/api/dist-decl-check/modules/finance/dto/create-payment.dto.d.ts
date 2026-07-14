import { PaymentStatus } from '@ilona/database';
export declare class CreatePaymentDto {
    studentId: string;
    amount: number;
    month: string;
    dueDate?: string;
    notes?: string;
}
export declare const STUDENT_PAYMENT_METHODS: readonly ["cash", "card", "idram"];
export type StudentPaymentMethod = (typeof STUDENT_PAYMENT_METHODS)[number];
export declare class ProcessPaymentDto {
    paymentMethod?: StudentPaymentMethod;
    transactionId?: string;
    notes?: string;
}
export declare const ADMIN_PAYMENT_METHOD_OPTIONS: readonly ["CASH", "CARD", "IDRAM", "TERMINAL"];
export declare class UpdatePaymentDto {
    amount?: number;
    dueDate?: string;
    status?: PaymentStatus;
    paymentMethod?: string;
    notes?: string;
}
export declare class QueryPaymentDto {
    skip?: number;
    take?: number;
    studentId?: string;
    status?: PaymentStatus;
    dateFrom?: string;
    dateTo?: string;
    q?: string;
}
