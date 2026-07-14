export type PaymentWindowReason = 'current_month' | 'past' | 'future';
export declare function startOfMonth(d: Date): Date;
export declare function startOfNextMonth(d: Date): Date;
export declare function isPaymentAllowedInWindow(paymentMonth: Date, asOf: Date): {
    allowed: boolean;
    reason: PaymentWindowReason;
};
