import { PaymentStatus, StudentStatus, UserStatus } from '@ilona/database';
import type { Prisma } from '@ilona/database';
import type { PrismaService } from '../prisma/prisma.service';
import {
  DEFAULT_PAYMENT_DUE_DAY,
  evaluateStudentAtRisk,
  getAtRiskMonthRange,
  isUnpaidPaymentLate,
  isUnpaidStatus,
  MIN_ABSENCES_FOR_AT_RISK,
  type AtRiskEvaluation,
} from './student-at-risk.util';

export type AtRiskQueryOptions = {
  asOf?: Date;
  studentIds?: string[];
  centerId?: string;
  month?: number;
  year?: number;
};

function activeStudentWhere(options: AtRiskQueryOptions): Prisma.StudentWhereInput {
  const where: Prisma.StudentWhereInput = {
    user: { status: UserStatus.ACTIVE },
  };
  if (options.studentIds && options.studentIds.length > 0) {
    where.id = { in: options.studentIds };
  }
  if (options.centerId) {
    where.OR = [{ group: { centerId: options.centerId } }, { centerId: options.centerId }];
  }
  return where;
}

export async function getPaymentDueDay(prisma: PrismaService): Promise<number> {
  const settings = await prisma.systemSettings.findFirst({
    orderBy: { id: 'desc' },
    select: { paymentDueDays: true },
  });
  return settings?.paymentDueDays ?? DEFAULT_PAYMENT_DUE_DAY;
}

export async function loadAbsenceCountsByStudent(
  prisma: PrismaService,
  studentIds: string[],
  start: Date,
  end: Date,
): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  if (studentIds.length === 0) {
    return counts;
  }

  const rows = await prisma.attendance.groupBy({
    by: ['studentId'],
    where: {
      studentId: { in: studentIds },
      isPresent: false,
      lesson: { scheduledAt: { gte: start, lte: end } },
    },
    _count: { _all: true },
  });

  for (const row of rows) {
    counts.set(row.studentId, row._count._all);
  }
  return counts;
}

export async function loadAttendanceBreakdownByStudent(
  prisma: PrismaService,
  studentIds: string[],
  start: Date,
  end: Date,
): Promise<Map<string, { present: number; justified: number; unjustified: number; total: number }>> {
  const breakdown = new Map<
    string,
    { present: number; justified: number; unjustified: number; total: number }
  >();
  if (studentIds.length === 0) {
    return breakdown;
  }

  const rows = await prisma.attendance.groupBy({
    by: ['studentId', 'isPresent', 'absenceType'],
    where: {
      studentId: { in: studentIds },
      lesson: { scheduledAt: { gte: start, lte: end } },
    },
    _count: { _all: true },
  });

  for (const row of rows) {
    const count = row._count._all;
    const current = breakdown.get(row.studentId) ?? {
      present: 0,
      justified: 0,
      unjustified: 0,
      total: 0,
    };
    current.total += count;
    if (row.isPresent) {
      current.present += count;
    } else if (row.absenceType === 'JUSTIFIED') {
      current.justified += count;
    } else {
      current.unjustified += count;
    }
    breakdown.set(row.studentId, current);
  }
  return breakdown;
}

export async function loadLatePaymentByStudent(
  prisma: PrismaService,
  studentIds: string[],
  asOf: Date,
  dueDay: number,
): Promise<Map<string, boolean>> {
  const flags = new Map<string, boolean>();
  if (studentIds.length === 0) {
    return flags;
  }

  const payments = await prisma.payment.findMany({
    where: {
      studentId: { in: studentIds },
      status: { in: [PaymentStatus.PENDING, PaymentStatus.OVERDUE] },
    },
    select: { studentId: true, month: true, status: true },
  });

  for (const payment of payments) {
    if (!isUnpaidStatus(payment.status)) {
      continue;
    }
    if (isUnpaidPaymentLate({ billingMonth: payment.month, asOf, dueDay })) {
      flags.set(payment.studentId, true);
    }
  }
  return flags;
}

export async function evaluateStudentsAtRisk(
  prisma: PrismaService,
  studentIds: string[],
  options: AtRiskQueryOptions = {},
): Promise<Map<string, AtRiskEvaluation>> {
  const asOf = options.asOf ?? new Date();
  const range = getAtRiskMonthRange(asOf, options.month, options.year);
  const dueDay = await getPaymentDueDay(prisma);
  const [absences, latePayments] = await Promise.all([
    loadAbsenceCountsByStudent(prisma, studentIds, range.start, range.end),
    loadLatePaymentByStudent(prisma, studentIds, asOf, dueDay),
  ]);

  const result = new Map<string, AtRiskEvaluation>();
  for (const studentId of studentIds) {
    result.set(
      studentId,
      evaluateStudentAtRisk({
        absenceCount: absences.get(studentId) ?? 0,
        hasLatePayment: latePayments.get(studentId) ?? false,
      }),
    );
  }
  return result;
}

export async function findAtRiskStudentIds(
  prisma: PrismaService,
  options: AtRiskQueryOptions = {},
): Promise<string[]> {
  const asOf = options.asOf ?? new Date();
  const range = getAtRiskMonthRange(asOf, options.month, options.year);
  const students = await prisma.student.findMany({
    where: activeStudentWhere(options),
    select: { id: true },
  });
  const studentIds = students.map((student) => student.id);
  if (studentIds.length === 0) {
    return [];
  }

  const dueDay = await getPaymentDueDay(prisma);
  const absences = await loadAbsenceCountsByStudent(
    prisma,
    studentIds,
    range.start,
    range.end,
  );
  const withAbsences = studentIds.filter(
    (id) => (absences.get(id) ?? 0) >= MIN_ABSENCES_FOR_AT_RISK,
  );
  if (withAbsences.length === 0) {
    return [];
  }

  const latePayments = await loadLatePaymentByStudent(
    prisma,
    withAbsences,
    asOf,
    dueDay,
  );
  return withAbsences.filter((id) => latePayments.get(id));
}

const RISK_LIFECYCLE = new Set<StudentStatus>([StudentStatus.RISK, StudentStatus.HIGH_RISK]);

export async function applyAtRiskLifecycleFilter(
  prisma: PrismaService,
  where: Prisma.StudentWhereInput,
  lifecycleStatuses: StudentStatus[] | undefined,
  options: AtRiskQueryOptions,
): Promise<void> {
  const persisted = (lifecycleStatuses ?? []).filter((status) => !RISK_LIFECYCLE.has(status));
  const wantsAtRisk = (lifecycleStatuses ?? []).some((status) => RISK_LIFECYCLE.has(status));
  if (persisted.length === 0 && !wantsAtRisk) {
    return;
  }
  if (persisted.length > 0 && !wantsAtRisk) {
    where.status = { in: persisted };
    return;
  }

  const atRiskIds = await findAtRiskStudentIds(prisma, options);
  const idFilter = { id: { in: atRiskIds.length > 0 ? atRiskIds : ['__none__'] } };
  if (persisted.length === 0) {
    where.id = idFilter.id;
    return;
  }
  where.AND = [
    ...(Array.isArray(where.AND) ? where.AND : where.AND ? [where.AND] : []),
    { OR: [{ status: { in: persisted } }, idFilter] },
  ];
}
