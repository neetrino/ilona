import { NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { LessonsService } from './lessons.service';

describe('LessonsService', () => {
  let lessonsService: LessonsService;
  let mockPrismaService: {
    lesson: {
      findMany: Mock;
      findUnique: Mock;
      findFirst: Mock;
      create: Mock;
      update: Mock;
      delete: Mock;
      count: Mock;
    };
    group: { findUnique: Mock };
    teacher: { findUnique: Mock };
  };

  const mockLesson = {
    id: 'lesson-1',
    groupId: 'group-1',
    teacherId: 'teacher-1',
    scheduledAt: new Date('2026-02-03T10:00:00Z'),
    duration: 60,
    topic: 'Test Topic',
    description: 'Test Description',
    status: 'SCHEDULED' as const,
    vocabularySent: false,
    vocabularySentAt: null,
    feedbacksCompleted: false,
    completedAt: null,
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    group: {
      id: 'group-1',
      name: 'Test Group',
      level: 'A1',
      center: { id: 'center-1', name: 'Test Center' },
      students: [],
    },
    teacher: {
      id: 'teacher-1',
      user: { id: 'user-1', firstName: 'John', lastName: 'Doe' },
    },
    attendances: [],
    feedbacks: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockPrismaService = {
      lesson: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        count: vi.fn(),
      },
      group: { findUnique: vi.fn() },
      teacher: { findUnique: vi.fn() },
    };

    const mockSalariesService = {
      recalculateSalaryForMonth: vi.fn().mockResolvedValue(undefined),
    };

    lessonsService = new LessonsService(
      mockPrismaService as never,
      mockSalariesService as never,
    );
  });

  describe('findById', () => {
    it('should return a lesson by id', async () => {
      mockPrismaService.lesson.findUnique.mockResolvedValue(mockLesson);

      const result = await lessonsService.findById('lesson-1');

      expect(result).toEqual(mockLesson);
    });

    it('should throw NotFoundException if lesson not found', async () => {
      mockPrismaService.lesson.findUnique.mockResolvedValue(null);

      await expect(lessonsService.findById('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    const createDto = {
      groupId: 'group-1',
      teacherId: 'teacher-1',
      scheduledAt: '2026-02-03T10:00:00Z',
      duration: 60,
      topic: 'Test Topic',
    };

    it('should create a new lesson', async () => {
      mockPrismaService.group.findUnique.mockResolvedValue({ id: 'group-1' });
      mockPrismaService.teacher.findUnique.mockResolvedValue({ id: 'teacher-1' });
      mockPrismaService.lesson.findFirst.mockResolvedValue(null);
      mockPrismaService.lesson.create.mockResolvedValue(mockLesson);

      const result = await lessonsService.create(createDto);

      expect(result).toEqual(mockLesson);
    });

    it('should throw BadRequestException if group not found', async () => {
      mockPrismaService.group.findUnique.mockResolvedValue(null);

      await expect(lessonsService.create(createDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if teacher not found', async () => {
      mockPrismaService.group.findUnique.mockResolvedValue({ id: 'group-1' });
      mockPrismaService.teacher.findUnique.mockResolvedValue(null);

      await expect(lessonsService.create(createDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if time conflict exists', async () => {
      mockPrismaService.group.findUnique.mockResolvedValue({ id: 'group-1' });
      mockPrismaService.teacher.findUnique.mockResolvedValue({ id: 'teacher-1' });
      mockPrismaService.lesson.findFirst.mockResolvedValue(mockLesson);

      await expect(lessonsService.create(createDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('startLesson', () => {
    it('should start a scheduled lesson', async () => {
      mockPrismaService.lesson.findUnique.mockResolvedValue(mockLesson);
      mockPrismaService.teacher.findUnique.mockResolvedValue({
        id: 'teacher-1',
        userId: 'user-1',
      });
      mockPrismaService.lesson.update.mockResolvedValue({
        ...mockLesson,
        status: 'IN_PROGRESS',
      });

      const result = await lessonsService.startLesson('lesson-1', 'user-1', 'TEACHER');

      expect(result.status).toBe('IN_PROGRESS');
    });

    it('should throw ForbiddenException if teacher is not assigned', async () => {
      mockPrismaService.lesson.findUnique.mockResolvedValue(mockLesson);
      mockPrismaService.teacher.findUnique.mockResolvedValue({
        id: 'teacher-2',
        userId: 'user-2',
      });

      await expect(
        lessonsService.startLesson('lesson-1', 'user-2', 'TEACHER'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if lesson is not scheduled', async () => {
      mockPrismaService.lesson.findUnique.mockResolvedValue({
        ...mockLesson,
        status: 'COMPLETED',
      });
      mockPrismaService.teacher.findUnique.mockResolvedValue({
        id: 'teacher-1',
        userId: 'user-1',
      });

      await expect(
        lessonsService.startLesson('lesson-1', 'user-1', 'TEACHER'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('completeLesson', () => {
    it('should complete a lesson', async () => {
      mockPrismaService.lesson.findUnique.mockResolvedValue({
        ...mockLesson,
        status: 'IN_PROGRESS',
      });
      mockPrismaService.teacher.findUnique.mockResolvedValue({
        id: 'teacher-1',
        userId: 'user-1',
      });
      mockPrismaService.lesson.update.mockResolvedValue({
        ...mockLesson,
        status: 'COMPLETED',
        completedAt: new Date(),
      });

      const result = await lessonsService.completeLesson(
        'lesson-1',
        { notes: 'Good lesson' },
        'user-1',
        'TEACHER',
      );

      expect(result.status).toBe('COMPLETED');
    });
  });

  describe('cancelLesson', () => {
    it('should cancel a lesson', async () => {
      mockPrismaService.lesson.findUnique.mockResolvedValue(mockLesson);
      mockPrismaService.lesson.update.mockResolvedValue({
        ...mockLesson,
        status: 'CANCELLED',
      });

      const result = await lessonsService.cancelLesson('lesson-1', 'Teacher sick');

      expect(result.status).toBe('CANCELLED');
    });

    it('should throw BadRequestException if lesson is already completed', async () => {
      mockPrismaService.lesson.findUnique.mockResolvedValue({
        ...mockLesson,
        status: 'COMPLETED',
      });

      await expect(
        lessonsService.cancelLesson('lesson-1'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getLessonStatistics', () => {
    it('should return lesson statistics', async () => {
      mockPrismaService.lesson.count
        .mockResolvedValueOnce(100) // total
        .mockResolvedValueOnce(80) // completed
        .mockResolvedValueOnce(5) // cancelled
        .mockResolvedValueOnce(3) // missed
        .mockResolvedValueOnce(2); // inProgress

      const result = await lessonsService.getLessonStatistics();

      expect(result).toEqual({
        total: 100,
        completed: 80,
        cancelled: 5,
        missed: 3,
        inProgress: 2,
        scheduled: 10,
        completionRate: 80,
      });
    });
  });
});
