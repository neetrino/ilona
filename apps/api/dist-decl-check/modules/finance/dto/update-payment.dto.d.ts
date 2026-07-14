import { PaymentStatus } from '@ilona/database';
export declare class UpdatePaymentDto {
    amount?: number;
    dueDate?: string;
    status?: PaymentStatus;
    description?: string;
}
