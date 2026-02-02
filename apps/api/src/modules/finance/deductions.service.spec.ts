import { NotFoundException, BadRequestException } from '@nestjs/common';
import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { DeductionsService } from './deductions.service';
import { DeductionReason } from '@prisma/client';

describe('DeductionsService', () => {
  let deductionsService: DeductionsService;
  let mockPrismaService: {
    deduction: {
      findMany: Mock;
      findUnique: Mock;
      findFirst: Mock;
      create: Mock;
      delete: Mock;
      count: Mock;
      aggregate: Mock;
      groupBy: Mock;
    };
    teacher: { findUnique: Mock };
    lesson: { findMany: Mock; findUnique: Mock };
  };

  const mockDeduction = {
    id: 'deduction-1',
    teacherId: 'teacher-1',
    lessonId: 'lesson-1',
    reason: DeductionReason.MISSING_VOCABULARY,
    amount: 10,
    percentage: null,
    note: 'Missing vocabulary',
    appliedAt: new Date(),
    createdAt: new Date(),
    teacher: {
      id: 'teacher-1',
      user: {
        id: 'user-1',
        firstName: 'John',
        lastName: 'Teacher',
        email: 'teacher@test.com',
      },
    },
  };

  const mockLesson = {
    id: 'lesson-1',
    teacherId: 'teacher-1',
    scheduledAt: new Date(),
    status: 'COMPLETED',
    completedAt: new Date(Date.now() - 48 * 60 * 60 * 1000), // 48 hours ago
    vocabularySent: false,
    feedbacksCompleted: false,
    teacher: { id: 'teacher-1' },
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockPrismaService = {
      deduction: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
        delete: vi.fn(),
        count: vi.fn(),
        aggregate: vi.fn(),
        groupBy: vi.fn(),
      },
      teacher: { findUnique: vi.fn() },
      lesson: { findMany: vi.fn(), findUnique: vi.fn() },
    };

    deductionsService = new DeductionsService(mockPrismaService as never);
  });

  describe('findAll', () => {
    it('should return paginated deductions', async () => {
      mockPrismaService.deduction.findMany.mockResolvedValue([mockDeduction]);
      mockPrismaService.deduction.count.mockResolvedValue(1);

      const result = await deductionsService.findAll({ skip: 0, take: 10 });

      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should filter by teacherId', async () => {
      mockPrismaService.deduction.findMany.mockResolvedValue([mockDeduction]);
      mockPrismaService.deduction.count.mockResolvedValue(1);

      await deductionsService.findAll({ teacherId: 'teacher-1' });

      expect(mockPrismaService.deduction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ teacherId: 'teacher-1' }),
        }),
      );
    });

    it('should filter by reason', async () => {
      mockPrismaService.deduction.findMany.mockResolvedValue([mockDeduction]);
      mockPrismaService.deduction.count.mockResolvedValue(1);

      await deductionsService.findAll({ reason: DeductionReason.MISSING_VOCABULARY });

      expect(mockPrismaService.deduction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ reason: DeductionReason.MISSING_VOCABULARY }),
        }),
      );
    });
  });

  describe('findById', () => {
    it('should return deduction by id', async () => {
      mockPrismaService.deduction.findUnique.mockResolvedValue(mockDeduction);

      const result = await deductionsService.findById('deduction-1');

      expect(result.id).toBe('deduction-1');
    });

    it('should throw NotFoundException if not found', async () => {
      mockPrismaService.deduction.findUnique.mockResolvedValue(null);

      await expect(deductionsService.findById('nonexistent'))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create a new deduction', async () => {
      mockPrismaService.teacher.findUnique.mockResolvedValue({ id: 'teacher-1' });
      mockPrismaService.lesson.findUnique.mockResolvedValue(mockLesson);
      mockPrismaService.deduction.create.mockResolvedValue(mockDeduction);

      const result = await deductionsService.create({
        teacherId: 'teacher-1',
        reason: DeductionReason.MISSING_VOCABULARY,
        amount: 10,
        lessonId: 'lesson-1',
      });

      expect(result.teacherId).toBe('teacher-1');
      expect(result.amount).toBe(10);
    });

    it('should throw BadRequestException if teacher not found', async () => {
      mockPrismaService.teacher.findUnique.mockResolvedValue(null);

      await expect(
        deductionsService.create({
          teacherId: 'nonexistent',
          reason: DeductionReason.MISSING_VOCABULARY,
          amount: 10,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if lesson not found', async () => {
      mockPrismaService.teacher.findUnique.mockResolvedValue({ id: 'teacher-1' });
      mockPrismaService.lesson.findUnique.mockResolvedValue(null);

      await expect(
        deductionsService.create({
          teacherId: 'teacher-1',
          reason: DeductionReason.MISSING_VOCABULARY,
          amount: 10,
          lessonId: 'nonexistent',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('delete', () => {
    it('should delete a deduction', async () => {
      mockPrismaService.deduction.findUnique.mockResolvedValue(mockDeduction);
      mockPrismaService.deduction.delete.mockResolvedValue(mockDeduction);

      const result = await deductionsService.delete('deduction-1');

      expect(result.id).toBe('deduction-1');
    });
  });

  describe('getStatistics', () => {
    it('should return deduction statistics', async () => {
      mockPrismaService.deduction.aggregate.mockResolvedValue({
        _sum: { amount: 500 },
        _count: 50,
      });
      mockPrismaService.deduction.groupBy.mockResolvedValue([
        { reason: DeductionReason.MISSING_VOCABULARY, _sum: { amount: 300 }, _count: 30 },
        { reason: DeductionReason.MISSING_FEEDBACK, _sum: { amount: 200 }, _count: 20 },
      ]);

      const result = await deductionsService.getStatistics();

      expect(result.total.amount).toBe(500);
      expect(result.total.count).toBe(50);
      expect(result.byReason).toHaveLength(2);
    });
  });

  describe('checkMissingVocabulary', () => {
    it('should create deductions for lessons without vocabulary', async () => {
      mockPrismaService.lesson.findMany.mockResolvedValue([mockLesson]);
      mockPrismaService.deduction.findFirst.mockResolvedValue(null);
      mockPrismaService.lesson.findUnique.mockResolvedValue(mockLesson);
      mockPrismaService.teacher.findUnique.mockResolvedValue({ id: 'teacher-1' });
      mockPrismaService.deduction.create.mockResolvedValue(mockDeduction);

      const result = await deductionsService.checkMissingVocabulary(24, 10);

      expect(result.checked).toBe(1);
      expect(result.created).toBe(1);
    });

    it('should not create duplicate deductions', async () => {
      mockPrismaService.lesson.findMany.mockResolvedValue([mockLesson]);
      mockPrismaService.deduction.findFirst.mockResolvedValue(mockDeduction);

      const result = await deductionsService.checkMissingVocabulary(24, 10);

      expect(result.checked).toBe(1);
      expect(result.created).toBe(0);
    });
  });

  describe('checkMissingFeedback', () => {
    it('should create deductions for lessons without feedback', async () => {
      mockPrismaService.lesson.findMany.mockResolvedValue([mockLesson]);
      mockPrismaService.deduction.findFirst.mockResolvedValue(null);
      mockPrismaService.lesson.findUnique.mockResolvedValue(mockLesson);
      mockPrismaService.teacher.findUnique.mockResolvedValue({ id: 'teacher-1' });
      mockPrismaService.deduction.create.mockResolvedValue({
        ...mockDeduction,
        reason: DeductionReason.MISSING_FEEDBACK,
      });

      const result = await deductionsService.checkMissingFeedback(24, 15);

      expect(result.checked).toBe(1);
      expect(result.created).toBe(1);
    });
  });
});


