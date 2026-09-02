import { describe, expect, it } from 'vitest';
import { PaymentStatus, RiskLabel } from '@ilona/database';
import { startOfZonedDay, zonedWallClockToUtc } from '@ilona/types';
import {
  billingMonthUtcRange,
  DEFAULT_PAYMENT_DUE_DAY,
  evaluateStudentAtRisk,
  getAtRiskMonthRange,
  isUnpaidPaymentLate,
  isUnpaidStatus,
} from './student-at-risk.util';

function yerevan(ymd: string, time = '00:00'): Date {
  const [hour, minute] = time.split(':').map(Number);
  const [year, month, day] = ymd.split('-').map(Number);
  return zonedWallClockToUtc(year, month, day, hour, minute, 0, 0);
}

describe('student-at-risk.util', () => {
  describe('isUnpaidPaymentLate', () => {
    const september = new Date(Date.UTC(2026, 8, 1));

    it('is not late before the 5th of the billing month', () => {
      expect(
        isUnpaidPaymentLate({
          billingMonth: september,
          asOf: yerevan('2026-09-04', '23:59'),
        }),
      ).toBe(false);
    });

    it('becomes late at the start of the 5th in Asia/Yerevan', () => {
      expect(
        isUnpaidPaymentLate({
          billingMonth: september,
          asOf: yerevan('2026-09-05'),
        }),
      ).toBe(true);
    });

    it('stays late after the due day', () => {
      expect(
        isUnpaidPaymentLate({
          billingMonth: september,
          asOf: yerevan('2026-09-20', '12:00'),
        }),
      ).toBe(true);
    });

    it('treats a previous unpaid month as late even before the current 5th', () => {
      expect(
        isUnpaidPaymentLate({
          billingMonth: new Date(Date.UTC(2026, 7, 1)),
          asOf: yerevan('2026-09-02'),
        }),
      ).toBe(true);
    });

    it('uses paymentDueDays from settings when provided', () => {
      expect(
        isUnpaidPaymentLate({
          billingMonth: september,
          asOf: yerevan('2026-09-07'),
          dueDay: 10,
        }),
      ).toBe(false);
      expect(
        isUnpaidPaymentLate({
          billingMonth: september,
          asOf: yerevan('2026-09-10'),
          dueDay: 10,
        }),
      ).toBe(true);
    });

    it('defaults due day to the 5th', () => {
      expect(DEFAULT_PAYMENT_DUE_DAY).toBe(5);
    });
  });

  describe('evaluateStudentAtRisk', () => {
    it('requires both late payment and at least one absence', () => {
      expect(evaluateStudentAtRisk({ absenceCount: 1, hasLatePayment: true })).toMatchObject({
        isAtRisk: true,
        riskLevel: 'HIGH',
        riskLabel: RiskLabel.HIGH_RISK,
      });
    });

    it('does not mark at-risk for absences alone', () => {
      expect(evaluateStudentAtRisk({ absenceCount: 4, hasLatePayment: false })).toMatchObject({
        isAtRisk: false,
        riskLevel: 'MEDIUM',
        riskLabel: RiskLabel.RISK,
      });
    });

    it('does not mark at-risk for late payment alone', () => {
      expect(evaluateStudentAtRisk({ absenceCount: 0, hasLatePayment: true })).toMatchObject({
        isAtRisk: false,
        riskLevel: 'MEDIUM',
        riskLabel: RiskLabel.RISK,
      });
    });

    it('is low risk when neither criterion matches', () => {
      expect(evaluateStudentAtRisk({ absenceCount: 0, hasLatePayment: false })).toMatchObject({
        isAtRisk: false,
        riskLevel: 'LOW',
        riskLabel: RiskLabel.NONE,
      });
    });
  });

  describe('helpers', () => {
    it('treats pending and overdue as unpaid', () => {
      expect(isUnpaidStatus(PaymentStatus.PENDING)).toBe(true);
      expect(isUnpaidStatus(PaymentStatus.OVERDUE)).toBe(true);
      expect(isUnpaidStatus(PaymentStatus.PAID)).toBe(false);
      expect(isUnpaidStatus(PaymentStatus.CANCELLED)).toBe(false);
      expect(isUnpaidStatus(PaymentStatus.REFUNDED)).toBe(false);
    });

    it('builds the Yerevan calendar month range', () => {
      const range = getAtRiskMonthRange(yerevan('2026-09-12', '15:00'));
      expect(range.year).toBe(2026);
      expect(range.month).toBe(9);
      expect(range.start).toEqual(startOfZonedDay('2026-09-01'));
    });

    it('builds UTC billing-month bounds used by Payment.month', () => {
      const range = billingMonthUtcRange(2026, 9);
      expect(range.start.toISOString()).toBe('2026-09-01T00:00:00.000Z');
      expect(range.endExclusive.toISOString()).toBe('2026-10-01T00:00:00.000Z');
    });
  });
});
