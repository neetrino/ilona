import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, PaymentStatus } from '@ilona/database';
import { CreatePaymentDto, UpdatePaymentDto, ProcessPaymentDto } from './dto/create-payment.dto';

/** Payment row with student (and user/group) for monthly grouped list. */
type PaymentWithStudent = Prisma.PaymentGetPayload<{
  include: {
    student: {
      include: {
        user: { select: { firstName: true; lastName: true; email: true } };
        group: { select: { id: true; name: true } };
      };
    };
  };
}>;

/** Result row from payment.groupBy({ by: ['paymentMethod'], ... }). */
type PaymentGroupByMethod = {
  paymentMethod: string | null;
  _sum: { amount: Prisma.Decimal | null };
  _count: number;
};

/** Normalize to first day of month in UTC so same calendar month = same value (unique constraint). */
function startOfMonth(d: Date): Date {
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0));
}

/** End of month (exclusive): first day of next month in UTC. Used for calendar-month range queries. */
function startOfNextMonth(d: Date): Date {
  return new Date(Date.UTC(d.getFullYear(), d.getMonth() + 1, 1, 0, 0, 0, 0));
}

/** Reason why a payment is or isn't in the allowed payment window (for UI and API errors). */
export type PaymentWindowReason = 'current_month' | 'past' | 'future';

/**
 * Check if a payment can be made for the given payment month at the given date.
 * Business rule: payment is allowed only within the corresponding calendar month.
 * Uses UTC for consistency (avoids timezone drift at month boundaries).
 *
 * Future extension (payment window from day X to day Y): add optional params or
 * read from SystemSettings (e.g. paymentWindowFromDay, paymentWindowToDay); then
 * allow only when asOf's day is in [fromDay, toDay] for that month. Keep the same
 * return shape (allowed, reason) so API and frontend stay unchanged.
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

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Prisma delegate access (payment, student, systemSettings). Cast for TS when PrismaClient typings are not resolved. */
  private get db(): {
    payment: Prisma.PaymentDelegate;
    student: Prisma.StudentDelegate;
    systemSettings: Prisma.SystemSettingsDelegate;
  } {
    return this.prisma as unknown as {
      payment: Prisma.PaymentDelegate;
      student: Prisma.StudentDelegate;
      systemSettings: Prisma.SystemSettingsDelegate;
    };
  }

  /**
   * Get all payments with filters
   */
  async findAll(params?: {
    skip?: number;
    take?: number;
    studentId?: string;
    status?: PaymentStatus;
    dateFrom?: Date;
    dateTo?: Date;
    q?: string;
  }) {
    const { skip = 0, take = 50, studentId, status, dateFrom, dateTo, q } = params || {};

    const where: Prisma.PaymentWhereInput = {};

    if (studentId) where.studentId = studentId;
    if (status) where.status = status;
    if (dateFrom || dateTo) {
      where.createdAt = {
        ...(dateFrom && { gte: dateFrom }),
        ...(dateTo && { lte: dateTo }),
      };
    }

    // Search by student name or email (case-insensitive)
    const searchTerm = typeof q === 'string' ? q.trim() : '';
    if (searchTerm.length > 0) {
      where.student = {
        user: {
          OR: [
            { firstName: { contains: searchTerm, mode: 'insensitive' } },
            { lastName: { contains: searchTerm, mode: 'insensitive' } },
            { email: { contains: searchTerm, mode: 'insensitive' } },
          ],
        },
      };
    }

    const studentInclude: Prisma.StudentInclude = {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    };
    if (studentId) {
      studentInclude.group = { select: { id: true, name: true } };
    }

    const [items, total] = await Promise.all([
      this.db.payment.findMany({
        where,
        skip,
        take,
        orderBy: studentId ? { month: 'desc' } : { createdAt: 'desc' },
        include: {
          student: {
            include: studentInclude,
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

  /**
   * Get payments for a student grouped by calendar month (year + month).
   * Returns exactly one row per month. Amount is the single monthly fee for that month
   * (from the representative payment). We do NOT sum amounts: monthly fee is per-student,
   * not per-class; summing would double-count if duplicate Payment rows exist for the same month.
   */
  async findMonthlyGroupedForStudent(params: {
    studentId: string;
    skip?: number;
    take?: number;
    status?: PaymentStatus;
  }) {
    const { studentId, skip = 0, take = 50, status } = params;

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

    // Group by calendar month (UTC) so one entry per (year, month)
    const byMonth = new Map<string, PaymentWithStudent[]>();
    for (const p of payments) {
      const month = p.month;
      const key = `${month.getUTCFullYear()}-${month.getUTCMonth()}`;
      if (!byMonth.has(key)) byMonth.set(key, []);
      byMonth.get(key)!.push(p);
    }

    const now = new Date();
    const grouped = Array.from(byMonth.entries())
      .map(([, list]) => {
        // Use representative payment's amount only (one monthly fee per month). Do not sum.
        const pendingOrOverdue = list.find(
          (item: PaymentWithStudent) => item.status === PaymentStatus.PENDING || item.status === PaymentStatus.OVERDUE,
        );
        const representative = pendingOrOverdue ?? list[0];
        const monthNorm = startOfMonth(representative.month);
        const amount = Number(representative.amount) || 0;
        const status = list.some((item: PaymentWithStudent) => item.status === PaymentStatus.PAID)
          ? PaymentStatus.PAID
          : list.some((item: PaymentWithStudent) => item.status === PaymentStatus.OVERDUE)
            ? PaymentStatus.OVERDUE
            : PaymentStatus.PENDING;
        const window = isPaymentAllowedInWindow(monthNorm, now);
        const unpaid = status === PaymentStatus.PENDING || status === PaymentStatus.OVERDUE;
        const canPay = unpaid && window.allowed;
        return {
          id: representative.id,
          studentId: representative.studentId,
          amount,
          status,
          dueDate: representative.dueDate,
          month: monthNorm,
          paidAt: list.some((item: PaymentWithStudent) => item.paidAt) ? (list.find((item: PaymentWithStudent) => item.paidAt)!.paidAt ?? null) : null,
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

  /**
   * Get payment by ID
   */
  async findById(id: string) {
    const payment = await this.db.payment.findUnique({
      where: { id },
      include: {
        student: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
              },
            },
            group: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException(`Payment with ID ${id} not found`);
    }

    return payment;
  }

  /**
   * Get payment by ID only if it belongs to the given student.
   * Used by student-facing endpoints to enforce ownership without leaking existence of other students' payments.
   * Returns null when payment does not exist or belongs to another student (caller should respond with 404).
   */
  async findByIdAndStudentId(paymentId: string, studentId: string) {
    return this.db.payment.findFirst({
      where: { id: paymentId, studentId },
      include: {
        student: {
          include: {
            user: {
              select: { firstName: true, lastName: true, email: true },
            },
          },
        },
      },
    });
  }

  /**
   * Create a new payment record. Enforces one payment per student per month:
   * if one already exists for that (studentId, month), returns it (idempotent).
   * For consistency with student view, amount should match the student's monthlyFee (Admin-defined).
   */
  async create(dto: CreatePaymentDto) {
    const student = await this.db.student.findUnique({
      where: { id: dto.studentId },
    });

    if (!student) {
      throw new BadRequestException(`Student with ID ${dto.studentId} not found`);
    }

    const periodStart = startOfMonth(new Date(dto.month));
    const dueDate = dto.dueDate ? new Date(dto.dueDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const existing = await this.db.payment.findFirst({
      where: { studentId: dto.studentId, month: periodStart },
      include: {
        student: {
          include: {
            user: {
              select: { firstName: true, lastName: true, email: true },
            },
          },
        },
      },
    });
    if (existing) {
      return existing;
    }

    try {
      return await this.db.payment.create({
        data: {
          studentId: dto.studentId,
          amount: dto.amount,
          month: periodStart,
          dueDate,
          notes: dto.notes,
          status: PaymentStatus.PENDING,
        } as Prisma.PaymentUncheckedCreateInput,
        include: {
          student: {
            include: {
              user: {
                select: { firstName: true, lastName: true, email: true },
              },
            },
          },
        },
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        return this.db.payment.findFirstOrThrow({
          where: { studentId: dto.studentId, month: periodStart },
          include: {
            student: {
              include: {
                user: {
                  select: { firstName: true, lastName: true, email: true },
                },
              },
            },
          },
        });
      }
      throw err;
    }
  }

  /**
   * Update payment details. paymentMethod can be set only when status is PENDING (admin sets method for pending/cash payments).
   */
  async update(id: string, dto: UpdatePaymentDto) {
    const payment = await this.findById(id);

    const data: Prisma.PaymentUncheckedUpdateInput = {
      amount: dto.amount,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      status: dto.status,
      notes: dto.notes,
    };

    if (dto.paymentMethod !== undefined) {
      if (payment.status !== PaymentStatus.PAID) {
        data.paymentMethod = dto.paymentMethod;
      }
      // If already PAID, do not allow changing method (CARD/IDRAM are locked)
    }

    return this.db.payment.update({
      where: { id },
      data,
      include: {
        student: {
          include: {
            user: {
              select: { firstName: true, lastName: true, email: true },
            },
          },
        },
      },
    });
  }

  /**
   * Process a payment (mark as paid). Admin use; no ownership check.
   */
  async processPayment(id: string, dto: ProcessPaymentDto) {
    const payment = await this.findById(id);

    if (payment.status === PaymentStatus.PAID) {
      throw new BadRequestException('Payment is already marked as paid');
    }

    const data: Prisma.PaymentUncheckedUpdateInput = {
      status: PaymentStatus.PAID,
      paidAt: new Date(),
      transactionId: dto.transactionId ?? undefined,
    };
    if (dto.paymentMethod !== undefined) {
      data.paymentMethod = dto.paymentMethod.toUpperCase();
    }

    return this.db.payment.update({
      where: { id },
      data,
      include: {
        student: {
          include: {
            user: {
              select: { firstName: true, lastName: true, email: true },
            },
          },
        },
      },
    });
  }

  /**
   * Process a payment (fake) only if it belongs to the given student.
   * - Card / Idram: set status PAID, method CARD/IDRAM, paidAt now.
   * - Cash: set status PENDING, method CASH (admin confirms later).
   * paymentMethod is required for student flow (cash | card | idram).
   * Returns 404 when payment does not exist or belongs to another student.
   * Enforces payment window: student can pay only during the corresponding calendar month.
   */
  async processPaymentForStudent(
    paymentId: string,
    studentId: string,
    dto: ProcessPaymentDto,
  ) {
    const method = (dto.paymentMethod ?? '').toLowerCase();
    if (!['cash', 'card', 'idram'].includes(method)) {
      throw new BadRequestException('paymentMethod must be one of: cash, card, idram');
    }
    const payment = await this.findByIdAndStudentId(paymentId, studentId);

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (payment.status === PaymentStatus.PAID) {
      throw new BadRequestException('Payment is already marked as paid');
    }

    const now = new Date();
    const window = isPaymentAllowedInWindow(payment.month, now);
    if (!window.allowed) {
      const paymentMonthLabel = payment.month.toLocaleString('en-US', {
        timeZone: 'UTC',
        month: 'long',
        year: 'numeric',
      });
      const currentMonthLabel = now.toLocaleString('en-US', {
        timeZone: 'UTC',
        month: 'long',
        year: 'numeric',
      });
      if (window.reason === 'past') {
        throw new BadRequestException(
          `Payment can only be made during the corresponding month. This payment is for ${paymentMonthLabel}; current month is ${currentMonthLabel}.`,
        );
      }
      throw new BadRequestException(
        `Payment is not yet available. This payment is for ${paymentMonthLabel}; current month is ${currentMonthLabel}.`,
      );
    }

    const methodUpper = method.toUpperCase();
    const isOnline = methodUpper === 'CARD' || methodUpper === 'IDRAM';
    const updateData: Prisma.PaymentUncheckedUpdateInput = {
      paymentMethod: methodUpper,
      transactionId: dto.transactionId ?? undefined,
    };
    if (isOnline) {
      updateData.status = PaymentStatus.PAID;
      updateData.paidAt = now;
    }
    // Cash: keep status PENDING, only set method

    return this.db.payment.update({
      where: { id: paymentId },
      data: updateData,
      include: {
        student: {
          include: {
            user: {
              select: { firstName: true, lastName: true, email: true },
            },
          },
        },
      },
    });
  }

  /**
   * Cancel payment
   */
  async cancel(id: string) {
    const payment = await this.findById(id);

    if (payment.status === PaymentStatus.PAID) {
      throw new BadRequestException('Cannot cancel a paid payment');
    }

    return this.db.payment.update({
      where: { id },
      data: { status: PaymentStatus.CANCELLED },
    });
  }

  /**
   * Delete a payment (hard delete)
   */
  async delete(id: string) {
    await this.findById(id);
    return this.db.payment.delete({ where: { id } });
  }

  /**
   * Delete multiple payments
   */
  async deleteMany(ids: string[]) {
    if (!ids?.length) {
      return { deleted: 0 };
    }
    const result = await this.db.payment.deleteMany({
      where: { id: { in: ids } },
    });
    return { deleted: result.count };
  }

  /**
   * Get student payment summary for dashboard and student payments page.
   * Returns totalPaid, totalPending, totalOverdue and nextPayment (first PENDING/OVERDUE by dueDate).
   * Totals are computed with one amount per calendar month to avoid double-counting duplicate Payment rows.
   */
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

    // One amount per calendar month (year-month key); prevents double-counting
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

  /**
   * Ensure a payment record exists for each month from student enrollment to current month.
   * Uses (studentId, month) with startOfMonth for idempotency. One payment per student per month.
   * Amount is always the student's monthlyFee (Admin-defined); never multiplied by classes or recalculated.
   */
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

    for (let y = start.getFullYear(), m = start.getMonth(); y < now.getFullYear() || (y === now.getFullYear() && m <= now.getMonth()); m++) {
      if (m > 11) {
        m = -1;
        y += 1;
        continue;
      }
      periodStarts.push(new Date(Date.UTC(y, m, 1, 0, 0, 0, 0)));
    }

    const periodEndExclusive = (p: Date) => startOfNextMonth(p);

    for (const periodStart of periodStarts) {
      // Use calendar-month range so we match any existing payment for this month regardless of timezone
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

  /**
   * Check for overdue payments and update status
   */
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

  /**
   * Get revenue statistics
   */
  async getRevenueStats(dateFrom?: Date, dateTo?: Date) {
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
    };

    const stats = await this.db.payment.aggregate({
      where,
      _sum: { amount: true },
      _count: true,
      _avg: { amount: true },
    });

    // Group by payment method
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
