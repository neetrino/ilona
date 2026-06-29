/** Reason why a payment is or isn't in the allowed payment window (for UI and API errors). */
export type PaymentWindowReason = 'current_month' | 'past' | 'future';

/** Normalize to first day of month in UTC so same calendar month = same value (unique constraint). */
export function startOfMonth(d: Date): Date {
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0));
}

/** End of month (exclusive): first day of next month in UTC. Used for calendar-month range queries. */
export function startOfNextMonth(d: Date): Date {
  return new Date(Date.UTC(d.getFullYear(), d.getMonth() + 1, 1, 0, 0, 0, 0));
}

/**
 * Check if a payment can be made for the given payment month at the given date.
 * Business rule: payment is allowed only within the corresponding calendar month.
 * Uses UTC for consistency (avoids timezone drift at month boundaries).
 */
export function isPaymentAllowedInWindow(
  paymentMonth: Date,
  asOf: Date,
): { allowed: boolean; reason: PaymentWindowReason } {
  const payY = paymentMonth.getUTCFullYear();
  const payM = paymentMonth.getUTCMonth();
  const nowY = asOf.getUTCFullYear();
  const nowM = asOf.getUTCMonth();

  if (nowY === payY && nowM === payM) {
    return { allowed: true, reason: 'current_month' };
  }
  if (nowY < payY || (nowY === payY && nowM < payM)) {
    return { allowed: false, reason: 'future' };
  }
  return { allowed: false, reason: 'past' };
}
