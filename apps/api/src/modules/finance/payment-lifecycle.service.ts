import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, PaymentStatus, UserStatus } from '@ilona/database';
import { getPaymentDb } from './payment-db.util';
import { startOfMonth, startOfNextMonth } from './payment.util';

@Injectable()
export class PaymentLifecycleService {
  private lastActiveStudentsSyncAt = 0;
  private static readonly ACTIVE_STUDENTS_SYNC_TTL_MS = 60_000;

  constructor(private readonly prisma: PrismaService) {}

  private get db() {
    return getPaymentDb(this.prisma);
  }

  async ensureMonthlyPayments(studentId: string): Promise<void> {
    const student = await this.db.student.findUnique({
      where: { id: studentId },
      select: { id: true, monthlyFee: true, enrolledAt: true },
    });

    if (!student) return;

    const monthlyFee = student.monthlyFee != null ? Number(student.monthlyFee) : 0;

    const settings = await this.db.systemSettings.findFirst({
      orderBy: { id: 'desc' },
      select: { paymentDueDays: true },
    });

    const dueDays = settings?.paymentDueDays ?? 5;
    const now = new Date();
    const start = new Date(student.enrolledAt);
    const periodStarts: Date[] = [];

    for (
      let y = start.getFullYear(), m = start.getMonth();
      y < now.getFullYear() || (y === now.getFullYear() && m <= now.getMonth());
      m++
    ) {
      if (m > 11) {
        m = -1;
        y += 1;
        continue;
      }
      periodStarts.push(new Date(Date.UTC(y, m, 1, 0, 0, 0, 0)));
    }

    const periodEndExclusive = (p: Date) => startOfNextMonth(p);

    for (const periodStart of periodStarts) {
      const existing = await this.db.payment.findFirst({
        where: {
          studentId,
          month: { gte: periodStart, lt: periodEndExclusive(periodStart) },
        },
      });
      if (existing) continue;

      const dueDate = new Date(periodStart.getFullYear(), periodStart.getMonth() + 1, dueDays);

      try {
        await this.db.payment.create({
          data: {
            studentId,
            amount: monthlyFee,
            month: periodStart,
            dueDate,
            status: dueDate < now ? PaymentStatus.OVERDUE : PaymentStatus.PENDING,
          } as Prisma.PaymentUncheckedCreateInput,
        });
      } catch (err) {
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
          continue;
        }
        throw err;
      }
    }
  }

  async ensureCurrentMonthPaymentsForActiveStudents(): Promise<void> {
    const nowTs = Date.now();
    if (nowTs - this.lastActiveStudentsSyncAt < PaymentLifecycleService.ACTIVE_STUDENTS_SYNC_TTL_MS) {
      return;
    }

    const [settings, students] = await Promise.all([
      this.db.systemSettings.findFirst({
        orderBy: { id: 'desc' },
        select: { paymentDueDays: true },
      }),
      this.db.student.findMany({
        where: {
          user: { status: UserStatus.ACTIVE },
          enrolledAt: { lte: new Date() },
        },
        select: {
          id: true,
          monthlyFee: true,
        },
      }),
    ]);

    if (students.length === 0) {
      this.lastActiveStudentsSyncAt = nowTs;
      return;
    }

    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = startOfNextMonth(monthStart);
    const dueDays = settings?.paymentDueDays ?? 5;

    const existingForCurrentMonth = await this.db.payment.findMany({
      where: {
        studentId: { in: students.map((s) => s.id) },
        month: { gte: monthStart, lt: monthEnd },
      },
      select: { studentId: true },
    });

    const existingStudentIds = new Set(existingForCurrentMonth.map((row) => row.studentId));
    const dueDate = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, dueDays);
    const status = dueDate < now ? PaymentStatus.OVERDUE : PaymentStatus.PENDING;

    const rowsToCreate = students
      .filter((student) => !existingStudentIds.has(student.id))
      .map((student) => ({
        studentId: student.id,
        amount: Number(student.monthlyFee) || 0,
        month: monthStart,
        dueDate,
        status,
      }));

    if (rowsToCreate.length > 0) {
      await this.db.payment.createMany({
        data: rowsToCreate,
        skipDuplicates: true,
      });
    }

    this.lastActiveStudentsSyncAt = nowTs;
  }

  async checkOverduePayments() {
    const now = new Date();

    const result = await this.db.payment.updateMany({
      where: {
        status: PaymentStatus.PENDING,
        dueDate: { lt: now },
      },
      data: {
        status: PaymentStatus.OVERDUE,
      },
    });

    return { updated: result.count };
  }
}
