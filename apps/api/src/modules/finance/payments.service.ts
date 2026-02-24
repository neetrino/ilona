import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, PaymentStatus } from '@prisma/client';
import { CreatePaymentDto, UpdatePaymentDto, ProcessPaymentDto } from './dto/create-payment.dto';

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

    const [items, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          student: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
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
   * Create a new payment record
   */
  async create(dto: CreatePaymentDto) {
    // Validate student
    const student = await this.prisma.student.findUnique({
      where: { id: dto.studentId },
    });

    if (!student) {
      throw new BadRequestException(`Student with ID ${dto.studentId} not found`);
    }

    return this.prisma.payment.create({
      data: {
        studentId: dto.studentId,
        amount: dto.amount,
        month: new Date(dto.month),
        dueDate: dto.dueDate ? new Date(dto.dueDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        notes: dto.notes,
        status: PaymentStatus.PENDING,
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
   * Process a payment (mark as paid)
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
   * Get student payment summary
   */
  async getStudentPaymentSummary(studentId: string) {
    const [total, paid, pending, overdue] = await Promise.all([
      this.prisma.payment.aggregate({
        where: { studentId },
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.payment.aggregate({
        where: { studentId, status: PaymentStatus.PAID },
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.payment.aggregate({
        where: { studentId, status: PaymentStatus.PENDING },
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.payment.aggregate({
        where: { studentId, status: PaymentStatus.OVERDUE },
        _sum: { amount: true },
        _count: true,
      }),
    ]);

    return {
      total: {
        count: total._count,
        amount: Number(total._sum.amount) || 0,
      },
      paid: {
        count: paid._count,
        amount: Number(paid._sum.amount) || 0,
      },
      pending: {
        count: pending._count,
        amount: Number(pending._sum.amount) || 0,
      },
      overdue: {
        count: overdue._count,
        amount: Number(overdue._sum.amount) || 0,
      },
    };
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
