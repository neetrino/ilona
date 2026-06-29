import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, PaymentStatus } from '@ilona/database';
import { CreatePaymentDto, UpdatePaymentDto, ProcessPaymentDto } from './dto/create-payment.dto';
import { getPaymentDb } from './payment-db.util';
import { paymentStudentIncludeBasic } from './payment-include.util';
import { isPaymentAllowedInWindow, startOfMonth } from './payment.util';
import { PaymentQueryService } from './payment-query.service';

@Injectable()
export class PaymentWriteService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly queryService: PaymentQueryService,
  ) {}

  private get db() {
    return getPaymentDb(this.prisma);
  }

  async create(dto: CreatePaymentDto) {
    const student = await this.db.student.findUnique({
      where: { id: dto.studentId },
    });

    if (!student) {
      throw new BadRequestException(`Student with ID ${dto.studentId} not found`);
    }

    const periodStart = startOfMonth(new Date(dto.month));
    const dueDate = dto.dueDate
      ? new Date(dto.dueDate)
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const existing = await this.db.payment.findFirst({
      where: { studentId: dto.studentId, month: periodStart },
      include: {
        student: {
          include: paymentStudentIncludeBasic,
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
            include: paymentStudentIncludeBasic,
          },
        },
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        return this.db.payment.findFirstOrThrow({
          where: { studentId: dto.studentId, month: periodStart },
          include: {
            student: {
              include: paymentStudentIncludeBasic,
            },
          },
        });
      }
      throw err;
    }
  }

  async update(id: string, dto: UpdatePaymentDto) {
    const payment = await this.queryService.findById(id);

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
    }

    return this.db.payment.update({
      where: { id },
      data,
      include: {
        student: {
          include: paymentStudentIncludeBasic,
        },
      },
    });
  }

  async processPayment(id: string, dto: ProcessPaymentDto) {
    const payment = await this.queryService.findById(id);

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
          include: paymentStudentIncludeBasic,
        },
      },
    });
  }

  async processPaymentForStudent(
    paymentId: string,
    studentId: string,
    dto: ProcessPaymentDto,
  ) {
    const method = (dto.paymentMethod ?? '').toLowerCase();
    if (!['cash', 'card', 'idram'].includes(method)) {
      throw new BadRequestException('paymentMethod must be one of: cash, card, idram');
    }
    const payment = await this.queryService.findByIdAndStudentId(paymentId, studentId);

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (payment.status === PaymentStatus.PAID) {
      throw new BadRequestException('Payment is already marked as paid');
    }

    const now = new Date();
    const window = isPaymentAllowedInWindow(payment.month, now);
    if (!window.allowed) {
      const paymentMonthLabel = payment.month.toLocaleString('en-GB', {
        timeZone: 'UTC',
        month: 'long',
        year: 'numeric',
      });
      const currentMonthLabel = now.toLocaleString('en-GB', {
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

    return this.db.payment.update({
      where: { id: paymentId },
      data: updateData,
      include: {
        student: {
          include: paymentStudentIncludeBasic,
        },
      },
    });
  }

  async cancel(id: string) {
    const payment = await this.queryService.findById(id);

    if (payment.status === PaymentStatus.PAID) {
      throw new BadRequestException('Cannot cancel a paid payment');
    }

    return this.db.payment.update({
      where: { id },
      data: { status: PaymentStatus.CANCELLED },
    });
  }

  async delete(id: string) {
    await this.queryService.findById(id);
    return this.db.payment.delete({ where: { id } });
  }

  async deleteMany(ids: string[]) {
    if (!ids?.length) {
      return { deleted: 0 };
    }
    const result = await this.db.payment.deleteMany({
      where: { id: { in: ids } },
    });
    return { deleted: result.count };
  }
}
