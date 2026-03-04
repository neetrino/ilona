/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { PaymentsService } from './payments.service';
import type { ProcessPaymentDto } from './dto/create-payment.dto';
import { PaymentStatus } from '@prisma/client';

describe('PaymentsService', () => {
  let paymentsService: PaymentsService;
  let mockPrismaService: {
    payment: {
      findMany: Mock;
      findFirst: Mock;
      findUnique: Mock;
      create: Mock;
      update: Mock;
      updateMany: Mock;
      count: Mock;
      aggregate: Mock;
      groupBy: Mock;
    };
    student: { findUnique: Mock };
  };

  const mockPayment = {
    id: 'payment-1',
    studentId: 'student-1',
    amount: 100,
    month: new Date('2026-01-01'),
    dueDate: new Date('2026-01-15'),
    status: PaymentStatus.PENDING,
    paidAt: null,
    paymentMethod: null,
    transactionId: null,
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    student: {
      id: 'student-1',
      user: {
        id: 'user-1',
        firstName: 'John',
        lastName: 'Student',
        email: 'student@test.com',
      },
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockPrismaService = {
      payment: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        updateMany: vi.fn(),
        count: vi.fn(),
        aggregate: vi.fn(),
        groupBy: vi.fn(),
      },
      student: { findUnique: vi.fn() },
    };

    paymentsService = new PaymentsService(mockPrismaService as never);
  });

  describe('findAll', () => {
    it('should return paginated payments', async () => {
      mockPrismaService.payment.findMany.mockResolvedValue([mockPayment]);
      mockPrismaService.payment.count.mockResolvedValue(1);

      const result = await paymentsService.findAll({ skip: 0, take: 10 });

      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
    });

    it('should filter by studentId', async () => {
      mockPrismaService.payment.findMany.mockResolvedValue([mockPayment]);
      mockPrismaService.payment.count.mockResolvedValue(1);

      await paymentsService.findAll({ studentId: 'student-1' });

      expect(mockPrismaService.payment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ studentId: 'student-1' }),
        }),
      );
    });

    it('should filter by status', async () => {
      mockPrismaService.payment.findMany.mockResolvedValue([mockPayment]);
      mockPrismaService.payment.count.mockResolvedValue(1);

      await paymentsService.findAll({ status: PaymentStatus.PENDING });

      expect(mockPrismaService.payment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: PaymentStatus.PENDING }),
        }),
      );
    });
  });

  describe('findById', () => {
    it('should return payment by id', async () => {
      mockPrismaService.payment.findUnique.mockResolvedValue(mockPayment);

      const result = await paymentsService.findById('payment-1');

      expect(result.id).toBe('payment-1');
    });

    it('should throw NotFoundException if not found', async () => {
      mockPrismaService.payment.findUnique.mockResolvedValue(null);

      await expect(paymentsService.findById('nonexistent'))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create a new payment when none exists for that month', async () => {
      mockPrismaService.student.findUnique.mockResolvedValue({ id: 'student-1' });
      mockPrismaService.payment.findFirst.mockResolvedValue(null);
      mockPrismaService.payment.create.mockResolvedValue(mockPayment);

      const result = await paymentsService.create({
        studentId: 'student-1',
        amount: 100,
        month: '2026-01-01',
      });

      expect(result.studentId).toBe('student-1');
      expect(result.amount).toBe(100);
    });

    it('should return existing payment when one exists for that student and month', async () => {
      mockPrismaService.student.findUnique.mockResolvedValue({ id: 'student-1' });
      mockPrismaService.payment.findFirst.mockResolvedValue(mockPayment);

      const result = await paymentsService.create({
        studentId: 'student-1',
        amount: 100,
        month: '2026-01-01',
      });

      expect(result).toBe(mockPayment);
      expect(mockPrismaService.payment.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if student not found', async () => {
      mockPrismaService.student.findUnique.mockResolvedValue(null);

      await expect(
        paymentsService.create({
          studentId: 'nonexistent',
          amount: 100,
          month: '2026-01-01',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('processPayment', () => {
    it('should mark payment as paid', async () => {
      mockPrismaService.payment.findUnique.mockResolvedValue(mockPayment);
      mockPrismaService.payment.update.mockResolvedValue({
        ...mockPayment,
        status: PaymentStatus.PAID,
        paymentMethod: 'card',
        paidAt: new Date(),
      });

      const result = await paymentsService.processPayment('payment-1', {
        paymentMethod: 'card',
      });

      expect(result.status).toBe(PaymentStatus.PAID);
      expect(result.paymentMethod).toBe('card');
    });

    it('should throw if payment already paid', async () => {
      mockPrismaService.payment.findUnique.mockResolvedValue({
        ...mockPayment,
        status: PaymentStatus.PAID,
      });

      await expect(
        paymentsService.processPayment('payment-1', { paymentMethod: 'card' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('processPaymentForStudent', () => {
    it('should reject when payment month is in the past (payment window)', async () => {
      const feb2025 = new Date(Date.UTC(2025, 1, 1, 0, 0, 0, 0));
      mockPrismaService.payment.findFirst.mockResolvedValue({
        ...mockPayment,
        id: 'pay-feb',
        studentId: 'student-1',
        status: PaymentStatus.PENDING,
        month: feb2025,
        dueDate: new Date(2025, 2, 5),
        amount: 30000,
        student: { id: 'student-1', user: { firstName: 'A', lastName: 'B', email: 'a@b.com' } },
      });

      await expect(
        paymentsService.processPaymentForStudent('pay-feb', 'student-1', {
          paymentMethod: 'transfer',
        } as unknown as ProcessPaymentDto),
      ).rejects.toThrow(BadRequestException);
      await expect(
        paymentsService.processPaymentForStudent('pay-feb', 'student-1', {
          paymentMethod: 'card',
        }),
      ).rejects.toThrow(/Payment can only be made during the corresponding month/);
      expect(mockPrismaService.payment.update).not.toHaveBeenCalled();
    });

    it('should allow and process when payment month is current month', async () => {
      const now = new Date();
      const currentMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
      mockPrismaService.payment.findFirst.mockResolvedValue({
        ...mockPayment,
        id: 'pay-current',
        studentId: 'student-1',
        status: PaymentStatus.PENDING,
        month: currentMonthStart,
        dueDate: new Date(now.getFullYear(), now.getMonth() + 1, 5),
        amount: 30000,
        student: { id: 'student-1', user: { firstName: 'A', lastName: 'B', email: 'a@b.com' } },
      });
      mockPrismaService.payment.update.mockResolvedValue({
        ...mockPayment,
        status: PaymentStatus.PAID,
        paymentMethod: 'CARD',
        paidAt: new Date(),
      });

      const result = await paymentsService.processPaymentForStudent('pay-current', 'student-1', {
        paymentMethod: 'card',
      });

      expect(result.status).toBe(PaymentStatus.PAID);
      expect(mockPrismaService.payment.update).toHaveBeenCalled();
    });
  });

  describe('cancel', () => {
    it('should cancel a pending payment', async () => {
      mockPrismaService.payment.findUnique.mockResolvedValue(mockPayment);
      mockPrismaService.payment.update.mockResolvedValue({
        ...mockPayment,
        status: PaymentStatus.CANCELLED,
      });

      const result = await paymentsService.cancel('payment-1');

      expect(result.status).toBe(PaymentStatus.CANCELLED);
    });

    it('should throw if payment already paid', async () => {
      mockPrismaService.payment.findUnique.mockResolvedValue({
        ...mockPayment,
        status: PaymentStatus.PAID,
      });

      await expect(paymentsService.cancel('payment-1'))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('getStudentPaymentSummary', () => {
    it('should return payment summary with totalPaid, totalPending, totalOverdue, nextPayment (one amount per month)', async () => {
      mockPrismaService.payment.findMany.mockResolvedValueOnce([
        { month: new Date('2024-01-01'), amount: 100, status: PaymentStatus.PAID },
        { month: new Date('2024-02-01'), amount: 100, status: PaymentStatus.PAID },
        { month: new Date('2024-03-01'), amount: 100, status: PaymentStatus.PENDING },
        { month: new Date('2024-04-01'), amount: 100, status: PaymentStatus.OVERDUE },
      ]);
      mockPrismaService.payment.findFirst.mockResolvedValueOnce({
        id: 'pay-1',
        amount: 100,
        dueDate: new Date('2024-03-05'),
      });

      const result = await paymentsService.getStudentPaymentSummary('student-1');

      expect(result.totalPaid).toBe(200);
      expect(result.totalPending).toBe(100);
      expect(result.totalOverdue).toBe(100);
      expect(result.nextPayment).toEqual({
        id: 'pay-1',
        amount: 100,
        dueDate: new Date('2024-03-05').toISOString(),
      });
    });
  });

  describe('checkOverduePayments', () => {
    it('should update overdue payments', async () => {
      mockPrismaService.payment.updateMany.mockResolvedValue({ count: 5 });

      const result = await paymentsService.checkOverduePayments();

      expect(result.updated).toBe(5);
      expect(mockPrismaService.payment.updateMany).toHaveBeenCalledWith({
        where: {
          status: PaymentStatus.PENDING,
          dueDate: { lt: expect.any(Date) },
        },
        data: { status: PaymentStatus.OVERDUE },
      });
    });
  });

  describe('getRevenueStats', () => {
    it('should return revenue statistics', async () => {
      mockPrismaService.payment.aggregate.mockResolvedValue({
        _sum: { amount: 10000 },
        _count: 100,
        _avg: { amount: 100 },
      });
      mockPrismaService.payment.groupBy.mockResolvedValue([
        { paymentMethod: 'card', _sum: { amount: 6000 }, _count: 60 },
        { paymentMethod: 'cash', _sum: { amount: 4000 }, _count: 40 },
      ]);

      const result = await paymentsService.getRevenueStats();

      expect(result.totalRevenue).toBe(10000);
      expect(result.totalPayments).toBe(100);
      expect(result.byMethod).toHaveLength(2);
    });
  });
});


