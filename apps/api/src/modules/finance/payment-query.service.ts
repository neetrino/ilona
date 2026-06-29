import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, PaymentStatus } from '@ilona/database';
import { getPaymentDb } from './payment-db.util';
import {
  paymentStudentIncludeBasic,
  paymentStudentIncludeWithGroup,
  paymentStudentIncludeWithPhone,
} from './payment-include.util';
import { isPaymentAllowedInWindow, startOfMonth } from './payment.util';
import type { PaymentWithStudent } from './payment.types';

@Injectable()
export class PaymentQueryService {
  constructor(private readonly prisma: PrismaService) {}

  private get db() {
    return getPaymentDb(this.prisma);
  }

  async findAll(params?: {
    skip?: number;
    take?: number;
    studentId?: string;
    status?: PaymentStatus;
    dateFrom?: Date;
    dateTo?: Date;
    q?: string;
    centerId?: string;
  }) {
    const { skip = 0, take = 50, studentId, status, dateFrom, dateTo, q, centerId } = params || {};

    const where: Prisma.PaymentWhereInput = {};

    if (studentId) where.studentId = studentId;
    if (status) where.status = status;
    if (dateFrom || dateTo) {
      where.createdAt = {
        ...(dateFrom && { gte: dateFrom }),
        ...(dateTo && { lte: dateTo }),
      };
    }

    const studentFilters: Prisma.StudentWhereInput[] = [];
    if (centerId) {
      studentFilters.push({ group: { centerId } });
    }

    const searchTerm = typeof q === 'string' ? q.trim() : '';
    if (searchTerm.length > 0) {
      studentFilters.push({
        OR: [
          {
            user: {
              OR: [
                { firstName: { contains: searchTerm, mode: 'insensitive' } },
                { lastName: { contains: searchTerm, mode: 'insensitive' } },
                { email: { contains: searchTerm, mode: 'insensitive' } },
              ],
            },
          },
          {
            group: {
              name: { contains: searchTerm, mode: 'insensitive' },
            },
          },
        ],
      });
    }

    if (studentFilters.length > 0) {
      where.student = studentFilters.length === 1 ? studentFilters[0] : { AND: studentFilters };
    }

    const [items, total] = await Promise.all([
      this.db.payment.findMany({
        where,
        skip,
        take,
        orderBy: [{ month: 'desc' }, { createdAt: 'desc' }],
        include: {
          student: {
            include: paymentStudentIncludeWithGroup,
          },
        },
      }),
      this.db.payment.count({ where }),
    ]);

    return {
      items,
      total,
      page: Math.floor(skip / take) + 1,
      pageSize: take,
      totalPages: Math.ceil(total / take),
    };
  }

  async findMonthlyGroupedForStudent(params: {
    studentId: string;
    skip?: number;
    take?: number;
    status?: PaymentStatus;
    dateFrom?: Date;
    dateTo?: Date;
  }) {
    const { studentId, skip = 0, take = 50, status, dateFrom, dateTo } = params;

    const where: Prisma.PaymentWhereInput = { studentId };
    if (status) where.status = status;

    const payments = await this.db.payment.findMany({
      where,
      orderBy: { month: 'desc' },
      include: {
        student: {
          include: {
            user: { select: { firstName: true, lastName: true, email: true } },
            group: { select: { id: true, name: true } },
          },
        },
      },
    });

    const byMonth = new Map<string, PaymentWithStudent[]>();
    for (const p of payments) {
      const month = p.month;
      const key = `${month.getUTCFullYear()}-${month.getUTCMonth()}`;
      if (!byMonth.has(key)) byMonth.set(key, []);
      byMonth.get(key)!.push(p);
    }

    const now = new Date();
    const rangeFrom = dateFrom?.getTime();
    const rangeTo = dateTo?.getTime();
    const grouped = Array.from(byMonth.entries())
      .map(([, list]) => {
        const pendingOrOverdue = list.find(
          (item: PaymentWithStudent) =>
            item.status === PaymentStatus.PENDING || item.status === PaymentStatus.OVERDUE,
        );
        const representative = pendingOrOverdue ?? list[0];
        const monthNorm = startOfMonth(representative.month);
        const amount = Number(representative.amount) || 0;
        const rowStatus = list.some((item: PaymentWithStudent) => item.status === PaymentStatus.PAID)
          ? PaymentStatus.PAID
          : list.some((item: PaymentWithStudent) => item.status === PaymentStatus.OVERDUE)
            ? PaymentStatus.OVERDUE
            : PaymentStatus.PENDING;
        const window = isPaymentAllowedInWindow(monthNorm, now);
        const unpaid = rowStatus === PaymentStatus.PENDING || rowStatus === PaymentStatus.OVERDUE;
        const canPay = unpaid && window.allowed;
        return {
          id: representative.id,
          studentId: representative.studentId,
          amount,
          status: rowStatus,
          dueDate: representative.dueDate,
          month: monthNorm,
          paidAt: list.some((item: PaymentWithStudent) => item.paidAt)
            ? (list.find((item: PaymentWithStudent) => item.paidAt)!.paidAt ?? null)
            : null,
          paymentMethod: representative.paymentMethod,
          transactionId: representative.transactionId,
          receiptUrl: representative.receiptUrl,
          notes: representative.notes,
          createdAt: representative.createdAt,
          updatedAt: representative.updatedAt,
          student: representative.student,
          canPay,
          paymentWindowReason: unpaid ? window.reason : undefined,
        };
      })
      .filter((row) => {
        if (rangeFrom === undefined || rangeTo === undefined) return true;
        const f = rangeFrom;
        const t = rangeTo;
        const mStart = row.month.getTime();
        const mEnd = Date.UTC(
          row.month.getUTCFullYear(),
          row.month.getUTCMonth() + 1,
          0,
          23,
          59,
          59,
          999,
        );
        if (row.status === PaymentStatus.PAID && row.paidAt) {
          const p = new Date(row.paidAt).getTime();
          return p >= f && p <= t;
        }
        return mStart <= t && mEnd >= f;
      })
      .sort((a, b) => b.month.getTime() - a.month.getTime());

    const total = grouped.length;
    const items = grouped.slice(skip, skip + take);

    return {
      items,
      total,
      page: Math.floor(skip / take) + 1,
      pageSize: take,
      totalPages: Math.ceil(total / take),
    };
  }

  async findById(id: string) {
    const payment = await this.db.payment.findUnique({
      where: { id },
      include: {
        student: {
          include: paymentStudentIncludeWithPhone,
        },
      },
    });

    if (!payment) {
      throw new NotFoundException(`Payment with ID ${id} not found`);
    }

    return payment;
  }

  async findByIdAndStudentId(paymentId: string, studentId: string) {
    return this.db.payment.findFirst({
      where: { id: paymentId, studentId },
      include: {
        student: {
          include: paymentStudentIncludeBasic,
        },
      },
    });
  }
}
