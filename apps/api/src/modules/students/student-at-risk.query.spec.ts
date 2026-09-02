import { describe, expect, it, vi } from 'vitest';
import { PaymentStatus, StudentStatus } from '@ilona/database';
import { zonedWallClockToUtc } from '@ilona/types';
import { applyAtRiskLifecycleFilter, findAtRiskStudentIds } from './student-at-risk.query';
import type { PrismaService } from '../prisma/prisma.service';

function yerevan(ymd: string, time = '12:00'): Date {
  const [hour, minute] = time.split(':').map(Number);
  const [year, month, day] = ymd.split('-').map(Number);
  return zonedWallClockToUtc(year, month, day, hour, minute, 0, 0);
}

function createPrisma(overrides: {
  studentIds?: string[];
      absences?: Array<{ studentId: string; _count: { _all: number } }>;
  payments?: Array<{ studentId: string; month: Date; status: PaymentStatus }>;
  dueDay?: number;
}) {
  return {
    systemSettings: {
      findFirst: vi.fn().mockResolvedValue({ paymentDueDays: overrides.dueDay ?? 5 }),
    },
    student: {
      findMany: vi.fn().mockResolvedValue((overrides.studentIds ?? []).map((id) => ({ id }))),
    },
    attendance: {
      groupBy: vi.fn().mockResolvedValue(overrides.absences ?? []),
    },
    payment: {
      findMany: vi.fn().mockResolvedValue(overrides.payments ?? []),
    },
  } as unknown as PrismaService;
}

describe('findAtRiskStudentIds', () => {
  const asOf = yerevan('2026-09-10');
  const september = new Date(Date.UTC(2026, 8, 1));

  it('returns only students with late payment AND at least one absence', async () => {
    const prisma = createPrisma({
      studentIds: ['late-absent', 'absent-only', 'late-only', 'clear'],
      absences: [
        { studentId: 'late-absent', _count: { _all: 1 } },
        { studentId: 'absent-only', _count: { _all: 2 } },
      ],
      payments: [
        { studentId: 'late-absent', month: september, status: PaymentStatus.PENDING },
        { studentId: 'late-only', month: september, status: PaymentStatus.OVERDUE },
      ],
    });

    await expect(findAtRiskStudentIds(prisma, { asOf })).resolves.toEqual(['late-absent']);
  });

  it('does not flag unpaid students before the 5th', async () => {
    const prisma = createPrisma({
      studentIds: ['too-early'],
      absences: [{ studentId: 'too-early', _count: { _all: 3 } }],
      payments: [
        { studentId: 'too-early', month: september, status: PaymentStatus.PENDING },
      ],
    });

    await expect(
      findAtRiskStudentIds(prisma, { asOf: yerevan('2026-09-04') }),
    ).resolves.toEqual([]);
  });

  it('treats a previous unpaid month as late even before the current 5th', async () => {
    const prisma = createPrisma({
      studentIds: ['carry-over'],
      absences: [{ studentId: 'carry-over', _count: { _all: 1 } }],
      payments: [
        {
          studentId: 'carry-over',
          month: new Date(Date.UTC(2026, 7, 1)),
          status: PaymentStatus.PENDING,
        },
      ],
    });

    await expect(
      findAtRiskStudentIds(prisma, { asOf: yerevan('2026-09-02') }),
    ).resolves.toEqual(['carry-over']);
  });

  it('counts any recorded absence, including a single justified one', async () => {
    const prisma = createPrisma({
      studentIds: ['justified'],
      absences: [{ studentId: 'justified', _count: { _all: 1 } }],
      payments: [
        { studentId: 'justified', month: september, status: PaymentStatus.PENDING },
      ],
    });

    await expect(findAtRiskStudentIds(prisma, { asOf })).resolves.toEqual(['justified']);
  });

  it('ignores paid billing-month invoices', async () => {
    const prisma = createPrisma({
      studentIds: ['paid'],
      absences: [{ studentId: 'paid', _count: { _all: 2 } }],
      payments: [],
    });

    await expect(findAtRiskStudentIds(prisma, { asOf })).resolves.toEqual([]);
  });
});

describe('applyAtRiskLifecycleFilter', () => {
  const asOf = yerevan('2026-09-10');
  const september = new Date(Date.UTC(2026, 8, 1));

  it('filters HIGH_RISK/RISK by derived at-risk IDs, not persisted status', async () => {
    const prisma = createPrisma({
      studentIds: ['late-absent', 'absent-only'],
      absences: [
        { studentId: 'late-absent', _count: { _all: 1 } },
        { studentId: 'absent-only', _count: { _all: 2 } },
      ],
      payments: [
        { studentId: 'late-absent', month: september, status: PaymentStatus.PENDING },
      ],
    });
    const where = {};
    await applyAtRiskLifecycleFilter(prisma, where, [StudentStatus.HIGH_RISK], { asOf });
    expect(where).toEqual({ id: { in: ['late-absent'] } });
  });

  it('keeps persisted NEW/UNGROUPED filters unchanged', async () => {
    const prisma = createPrisma({ studentIds: [] });
    const where = {};
    await applyAtRiskLifecycleFilter(prisma, where, [StudentStatus.NEW], { asOf });
    expect(where).toEqual({ status: { in: [StudentStatus.NEW] } });
  });
});
