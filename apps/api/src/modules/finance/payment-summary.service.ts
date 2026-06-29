import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, PaymentStatus } from '@ilona/database';
import { getPaymentDb } from './payment-db.util';
import type { PaymentGroupByMethod } from './payment.types';

@Injectable()
export class PaymentSummaryService {
  constructor(private readonly prisma: PrismaService) {}

  private get db() {
    return getPaymentDb(this.prisma);
  }

  async getStudentPaymentSummary(studentId: string) {
    const [allPayments, nextPayment] = await Promise.all([
      this.db.payment.findMany({
        where: { studentId },
        select: { month: true, amount: true, status: true },
      }),
      this.db.payment.findFirst({
        where: {
          studentId,
          status: { in: [PaymentStatus.PENDING, PaymentStatus.OVERDUE] },
        },
        orderBy: { dueDate: 'asc' },
        select: { id: true, amount: true, dueDate: true },
      }),
    ]);

    const byMonth = new Map<string, { amount: number; status: PaymentStatus }>();
    for (const row of allPayments) {
      const month = row.month;
      const key = `${month.getUTCFullYear()}-${month.getUTCMonth()}`;
      if (!byMonth.has(key)) {
        byMonth.set(key, { amount: Number(row.amount) || 0, status: row.status });
      }
    }

    let totalPaid = 0;
    let totalPending = 0;
    let totalOverdue = 0;
    for (const { amount, status } of byMonth.values()) {
      if (status === PaymentStatus.PAID) totalPaid += amount;
      else if (status === PaymentStatus.PENDING) totalPending += amount;
      else if (status === PaymentStatus.OVERDUE) totalOverdue += amount;
    }

    return {
      totalPaid,
      totalPending,
      totalOverdue,
      nextPayment: nextPayment
        ? {
            id: nextPayment.id,
            amount: Number(nextPayment.amount) || 0,
            dueDate: nextPayment.dueDate.toISOString(),
          }
        : null,
    };
  }

  async getRevenueStats(dateFrom?: Date, dateTo?: Date, centerId?: string) {
    const where: Prisma.PaymentWhereInput = {
      status: PaymentStatus.PAID,
      ...(dateFrom || dateTo
        ? {
            paidAt: {
              ...(dateFrom && { gte: dateFrom }),
              ...(dateTo && { lte: dateTo }),
            },
          }
        : {}),
      ...(centerId ? { student: { group: { centerId } } } : {}),
    };

    const stats = await this.db.payment.aggregate({
      where,
      _sum: { amount: true },
      _count: true,
      _avg: { amount: true },
    });

    const byMethod = await this.db.payment.groupBy({
      by: ['paymentMethod'],
      where,
      _sum: { amount: true },
      _count: true,
    });

    return {
      totalRevenue: Number(stats._sum.amount) || 0,
      totalPayments: stats._count,
      averagePayment: Number(stats._avg.amount) || 0,
      byMethod: byMethod.map((m: PaymentGroupByMethod) => ({
        method: m.paymentMethod,
        count: m._count,
        amount: Number(m._sum.amount) || 0,
      })),
    };
  }
}
