import { NotFoundException, BadRequestException } from '@nestjs/common';
import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { PaymentsService } from './payments.service';
import { PaymentStatus } from '@prisma/client';

describe('PaymentsService', () => {
  let paymentsService: PaymentsService;
  let mockPrismaService: {
    payment: {
      findMany: Mock;
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
    it('should create a new payment', async () => {
      mockPrismaService.student.findUnique.mockResolvedValue({ id: 'student-1' });
      mockPrismaService.payment.create.mockResolvedValue(mockPayment);

      const result = await paymentsService.create({
        studentId: 'student-1',
        amount: 100,
        month: '2026-01-01',
      });

      expect(result.studentId).toBe('student-1');
      expect(result.amount).toBe(100);
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
    it('should return payment summary', async () => {
      mockPrismaService.payment.aggregate
        .mockResolvedValueOnce({ _sum: { amount: 500 }, _count: 5 }) // total
        .mockResolvedValueOnce({ _sum: { amount: 300 }, _count: 3 }) // paid
        .mockResolvedValueOnce({ _sum: { amount: 100 }, _count: 1 }) // pending
        .mockResolvedValueOnce({ _sum: { amount: 100 }, _count: 1 }); // overdue

      const result = await paymentsService.getStudentPaymentSummary('student-1');

      expect(result.total.amount).toBe(500);
      expect(result.paid.amount).toBe(300);
      expect(result.pending.amount).toBe(100);
      expect(result.overdue.amount).toBe(100);
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

