/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { NotFoundException } from '@nestjs/common';
import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { CentersService } from './centers.service';

describe('CentersService', () => {
  let centersService: CentersService;
  let mockPrismaService: {
    center: {
      findMany: Mock;
      findUnique: Mock;
      findFirst: Mock;
      create: Mock;
      update: Mock;
      delete: Mock;
      count: Mock;
    };
    group: { count: Mock };
    student: { count: Mock };
    lesson: { count: Mock };
    $transaction: Mock;
  };

  const mockCenter = {
    id: 'center-1',
    name: 'Test Center',
    address: '123 Test St',
    phone: '+1234567890',
    email: 'center@test.com',
    description: 'A test center',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    _count: { groups: 5 },
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockPrismaService = {
      center: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        count: vi.fn(),
      },
      group: { count: vi.fn() },
      student: { count: vi.fn() },
      lesson: { count: vi.fn() },
      $transaction: vi.fn(async (ops: Promise<unknown>[]) => Promise.all(ops)),
    };

    centersService = new CentersService(mockPrismaService as never);
  });

  describe('findAll', () => {
    it('should return paginated centers', async () => {
      const centers = [mockCenter];
      mockPrismaService.center.findMany.mockResolvedValue(centers);
      mockPrismaService.center.count.mockResolvedValue(1);

      const result = await centersService.findAll({ skip: 0, take: 10 });

      expect(result.items).toEqual(centers);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(10);
    });

    it('should filter centers by search term', async () => {
      mockPrismaService.center.findMany.mockResolvedValue([mockCenter]);
      mockPrismaService.center.count.mockResolvedValue(1);

      await centersService.findAll({ search: 'Test' });

      expect(mockPrismaService.center.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.any(Array),
          }),
        }),
      );
    });

    it('should filter centers by isActive', async () => {
      mockPrismaService.center.findMany.mockResolvedValue([mockCenter]);
      mockPrismaService.center.count.mockResolvedValue(1);

      await centersService.findAll({ isActive: true });

      expect(mockPrismaService.center.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isActive: true,
          }),
        }),
      );
    });
  });

  describe('findById', () => {
    it('should return a center by id', async () => {
      mockPrismaService.center.findUnique.mockResolvedValue(mockCenter);

      const result = await centersService.findById('center-1');

      expect(result).toEqual(mockCenter);
      expect(mockPrismaService.center.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'center-1' },
        }),
      );
    });

    it('should throw NotFoundException if center not found', async () => {
      mockPrismaService.center.findUnique.mockResolvedValue(null);

      await expect(centersService.findById('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('should create a new center', async () => {
      const createDto = {
        name: 'New Center',
        address: '456 New St',
        phone: '+9876543210',
        email: 'new@test.com',
        description: 'A new center',
      };

      mockPrismaService.center.findFirst.mockResolvedValue(null);
      mockPrismaService.center.create.mockResolvedValue({
        id: 'center-2',
        ...createDto,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await centersService.create(createDto);

      expect(result.name).toBe('New Center');
      expect(mockPrismaService.center.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: 'New Center',
          isActive: true,
        }),
      });
    });
  });

  describe('update', () => {
    it('should update an existing center', async () => {
      mockPrismaService.center.findUnique.mockResolvedValue(mockCenter);
      mockPrismaService.center.findFirst.mockResolvedValue(null);
      mockPrismaService.center.update.mockResolvedValue({
        ...mockCenter,
        name: 'Updated Center',
      });

      const result = await centersService.update('center-1', {
        name: 'Updated Center',
      });

      expect(result.name).toBe('Updated Center');
    });

    it('should throw NotFoundException if center not found', async () => {
      mockPrismaService.center.findUnique.mockResolvedValue(null);

      await expect(
        centersService.update('nonexistent', { name: 'Updated' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete', () => {
    it('should delete an existing center', async () => {
      mockPrismaService.center.findUnique.mockResolvedValue(mockCenter);
      mockPrismaService.group.count.mockResolvedValue(0);
      mockPrismaService.student.count.mockResolvedValue(0);
      mockPrismaService.center.delete.mockResolvedValue(mockCenter);

      const result = await centersService.delete('center-1');

      expect(result).toEqual(mockCenter);
      expect(mockPrismaService.center.delete).toHaveBeenCalledWith({
        where: { id: 'center-1' },
      });
    });
  });

  describe('toggleActive', () => {
    it('should toggle center active status', async () => {
      mockPrismaService.center.findUnique.mockResolvedValue(mockCenter);
      mockPrismaService.center.update.mockResolvedValue({
        ...mockCenter,
        isActive: false,
      });

      const result = await centersService.toggleActive('center-1');

      expect(result.isActive).toBe(false);
      expect(mockPrismaService.center.update).toHaveBeenCalledWith({
        where: { id: 'center-1' },
        data: { isActive: false },
      });
    });
  });

  describe('getStatistics', () => {
    it('should return center statistics', async () => {
      mockPrismaService.center.findUnique.mockResolvedValue(mockCenter);
      mockPrismaService.group.count.mockResolvedValue(5);
      mockPrismaService.student.count.mockResolvedValue(50);
      mockPrismaService.lesson.count.mockResolvedValue(200);

      const result = await centersService.getStatistics('center-1');

      expect(result).toEqual({
        groupsCount: 5,
        studentsCount: 50,
        lessonsCount: 200,
      });
    });
  });
});
