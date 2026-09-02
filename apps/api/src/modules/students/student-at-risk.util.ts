import {
  endOfZonedDay,
  getZonedParts,
  startOfZonedDay,
} from '@ilona/types';
import { PaymentStatus, RiskLabel } from '@ilona/database';

export type AtRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export const DEFAULT_PAYMENT_DUE_DAY = 5;
export const MIN_ABSENCES_FOR_AT_RISK = 1;

const UNPAID_STATUSES: ReadonlySet<PaymentStatus> = new Set([
  PaymentStatus.PENDING,
  PaymentStatus.OVERDUE,
]);

export type AtRiskMonthRange = {
  start: Date;
  end: Date;
  year: number;
  month: number;
};

export type AtRiskEvaluation = {
  isAtRisk: boolean;
  hasLatePayment: boolean;
  absenceCount: number;
  riskLabel: RiskLabel;
  riskLevel: AtRiskLevel;
};

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function lastDayOfMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function getAtRiskMonthRange(
  asOf: Date,
  month?: number,
  year?: number,
): AtRiskMonthRange {
  const parts = getZonedParts(asOf);
  const resolvedYear = year ?? parts.year;
  const resolvedMonth = month ?? parts.month;
  const lastDay = lastDayOfMonth(resolvedYear, resolvedMonth);
  const startYmd = `${resolvedYear}-${pad2(resolvedMonth)}-01`;
  const endYmd = `${resolvedYear}-${pad2(resolvedMonth)}-${pad2(lastDay)}`;
  return {
    start: startOfZonedDay(startYmd),
    end: endOfZonedDay(endYmd),
    year: resolvedYear,
    month: resolvedMonth,
  };
}

export function billingMonthUtcRange(year: number, month: number): { start: Date; endExclusive: Date } {
  return {
    start: new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0)),
    endExclusive: new Date(Date.UTC(year, month, 1, 0, 0, 0, 0)),
  };
}

export function isUnpaidStatus(status: PaymentStatus): boolean {
  return UNPAID_STATUSES.has(status);
}

/** Late from the due day of the billing month (default the 5th, Asia/Yerevan). */
export function isUnpaidPaymentLate(params: {
  billingMonth: Date;
  asOf: Date;
  dueDay?: number;
}): boolean {
  const dueDay = params.dueDay ?? DEFAULT_PAYMENT_DUE_DAY;
  const year = params.billingMonth.getUTCFullYear();
  const month = params.billingMonth.getUTCMonth() + 1;
  const clampedDueDay = Math.min(Math.max(dueDay, 1), lastDayOfMonth(year, month));
  const dueStart = startOfZonedDay(`${year}-${pad2(month)}-${pad2(clampedDueDay)}`);
  return params.asOf.getTime() >= dueStart.getTime();
}

export function evaluateStudentAtRisk(params: {
  absenceCount: number;
  hasLatePayment: boolean;
}): AtRiskEvaluation {
  const absenceCount = Math.max(0, params.absenceCount);
  const hasLatePayment = params.hasLatePayment;
  const hasAbsences = absenceCount >= MIN_ABSENCES_FOR_AT_RISK;
  const isAtRisk = hasAbsences && hasLatePayment;

  let riskLevel: AtRiskLevel = 'LOW';
  let riskLabel: RiskLabel = RiskLabel.NONE;
  if (isAtRisk) {
    riskLevel = 'HIGH';
    riskLabel = RiskLabel.HIGH_RISK;
  } else if (hasAbsences || hasLatePayment) {
    riskLevel = 'MEDIUM';
    riskLabel = RiskLabel.RISK;
  }

  return { isAtRisk, hasLatePayment, absenceCount, riskLabel, riskLevel };
}
