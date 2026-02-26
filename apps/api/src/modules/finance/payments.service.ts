import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, PaymentStatus } from '@prisma/client';
import { CreatePaymentDto, UpdatePaymentDto, ProcessPaymentDto } from './dto/create-payment.dto';

/** Normalize to first day of month in UTC so same calendar month = same value (unique constraint). */
function startOfMonth(d: Date): Date {
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0));
}

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

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
      this.prisma.payment.findMany({
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
      this.prisma.payment.count({ where }),
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
   * Get payment by ID
   */
  async findById(id: string) {
    const payment = await this.prisma.payment.findUnique({
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
    return this.prisma.payment.findFirst({
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
   */
  async create(dto: CreatePaymentDto) {
    const student = await this.prisma.student.findUnique({
      where: { id: dto.studentId },
    });

    if (!student) {
      throw new BadRequestException(`Student with ID ${dto.studentId} not found`);
    }

    const periodStart = startOfMonth(new Date(dto.month));
    const dueDate = dto.dueDate ? new Date(dto.dueDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const existing = await this.prisma.payment.findFirst({
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
      return await this.prisma.payment.create({
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
        return this.prisma.payment.findFirstOrThrow({
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
   * Update payment details
   */
  async update(id: string, dto: UpdatePaymentDto) {
    await this.findById(id);

    return this.prisma.payment.update({
      where: { id },
      data: {
        amount: dto.amount,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        status: dto.status,
        notes: dto.notes,
      },
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

    return this.prisma.payment.update({
      where: { id },
      data: {
        status: PaymentStatus.PAID,
        paymentMethod: dto.paymentMethod,
        transactionId: dto.transactionId,
        paidAt: new Date(),
      },
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
   * Process a payment (mark as paid) only if it belongs to the given student.
   * Returns 404 when payment does not exist or belongs to another student (no information leak).
   */
  async processPaymentForStudent(
    paymentId: string,
    studentId: string,
    dto: ProcessPaymentDto,
  ) {
    const payment = await this.findByIdAndStudentId(paymentId, studentId);

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (payment.status === PaymentStatus.PAID) {
      throw new BadRequestException('Payment is already marked as paid');
    }

    return this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: PaymentStatus.PAID,
        paymentMethod: dto.paymentMethod,
        transactionId: dto.transactionId,
        paidAt: new Date(),
      },
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

    return this.prisma.payment.update({
      where: { id },
      data: { status: PaymentStatus.CANCELLED },
    });
  }

  /**
   * Delete a payment (hard delete)
   */
  async delete(id: string) {
    await this.findById(id);
    return this.prisma.payment.delete({ where: { id } });
  }

  /**
   * Delete multiple payments
   */
  async deleteMany(ids: string[]) {
    if (!ids?.length) {
      return { deleted: 0 };
    }
    const result = await this.prisma.payment.deleteMany({
      where: { id: { in: ids } },
    });
    return { deleted: result.count };
  }

  /**
   * Get student payment summary for dashboard and student payments page.
   * Returns totalPaid, totalPending, totalOverdue and nextPayment (first PENDING/OVERDUE by dueDate).
   */
  async getStudentPaymentSummary(studentId: string) {
    const [paidAgg, pendingAgg, overdueAgg, nextPayment] = await Promise.all([
      this.prisma.payment.aggregate({
        where: { studentId, status: PaymentStatus.PAID },
        _sum: { amount: true },
      }),
      this.prisma.payment.aggregate({
        where: { studentId, status: PaymentStatus.PENDING },
        _sum: { amount: true },
      }),
      this.prisma.payment.aggregate({
        where: { studentId, status: PaymentStatus.OVERDUE },
        _sum: { amount: true },
      }),
      this.prisma.payment.findFirst({
        where: {
          studentId,
          status: { in: [PaymentStatus.PENDING, PaymentStatus.OVERDUE] },
        },
        orderBy: { dueDate: 'asc' },
        select: { id: true, amount: true, dueDate: true },
      }),
    ]);

    const totalPaid = Number(paidAgg._sum.amount) || 0;
    const totalPending = Number(pendingAgg._sum.amount) || 0;
    const totalOverdue = Number(overdueAgg._sum.amount) || 0;

    return {
      totalPaid,
      totalPending,
      totalOverdue,
      nextPayment: nextPayment
        ? {
            id: nextPayment.id,
            amount: Number(nextPayment.amount),
            dueDate: nextPayment.dueDate.toISOString(),
          }
        : null,
    };
  }

  /**
   * Ensure a payment record exists for each month from student enrollment to current month.
   * Uses (studentId, month) with startOfMonth for idempotency. One payment per student per month.
   */
  async ensureMonthlyPayments(studentId: string): Promise<void> {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      select: { id: true, monthlyFee: true, enrolledAt: true },
    });

    if (!student) return;

    const settings = await this.prisma.systemSettings.findFirst({
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

    for (const periodStart of periodStarts) {
      const existing = await this.prisma.payment.findFirst({
        where: { studentId, month: periodStart },
      });
      if (existing) continue;

      const dueDate = new Date(periodStart.getFullYear(), periodStart.getMonth() + 1, dueDays);

      try {
        await this.prisma.payment.create({
          data: {
            studentId,
            amount: student.monthlyFee,
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

    const result = await this.prisma.payment.updateMany({
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

    const stats = await this.prisma.payment.aggregate({
      where,
      _sum: { amount: true },
      _count: true,
      _avg: { amount: true },
    });

    // Group by payment method
    const byMethod = await this.prisma.payment.groupBy({
      by: ['paymentMethod'],
      where,
      _sum: { amount: true },
      _count: true,
    });

    return {
      totalRevenue: Number(stats._sum.amount) || 0,
      totalPayments: stats._count,
      averagePayment: Number(stats._avg.amount) || 0,
      byMethod: byMethod.map((m) => ({
        method: m.paymentMethod,
        count: m._count,
        amount: Number(m._sum.amount) || 0,
      })),
    };
  }
}
