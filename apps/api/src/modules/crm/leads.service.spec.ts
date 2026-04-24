import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { LeadsService } from './leads.service';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { StudentsService } from '../students/students.service';

describe('LeadsService', () => {
  let service: LeadsService;
  let prisma: {
    crmLead: { findUnique: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn> };
    managerProfile: { findUnique: ReturnType<typeof vi.fn> };
    crmLeadActivity: { create: ReturnType<typeof vi.fn> };
    user: { findMany: ReturnType<typeof vi.fn> };
    $transaction: ReturnType<typeof vi.fn>;
  };
  let storage: { getPresignedUploadUrl: ReturnType<typeof vi.fn> };
  let studentsService: { createLinkedToCrmPaidLead: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    prisma = {
      crmLead: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      managerProfile: {
        findUnique: vi.fn(),
      },
      crmLeadActivity: { create: vi.fn() },
      user: { findMany: vi.fn().mockResolvedValue([]) },
      $transaction: vi.fn((fn: (tx: unknown) => Promise<unknown>) => fn(prisma)),
    };
    storage = { getPresignedUploadUrl: vi.fn() };
    studentsService = { createLinkedToCrmPaidLead: vi.fn() };
    service = new LeadsService(
      prisma as unknown as PrismaService,
      storage as unknown as StorageService,
      studentsService as unknown as StudentsService,
    );
  });

  describe('changeStatus', () => {
    it('throws BadRequestException for invalid transition NEW -> PAID', async () => {
      prisma.crmLead.findUnique.mockResolvedValue({
        id: 'lead-1',
        status: 'NEW',
        firstName: 'John',
        lastName: 'Doe',
        phone: '+123',
        age: 10,
        levelId: 'A1',
        teacherId: 't1',
        groupId: 'g1',
        centerId: 'c1',
        createdByUser: {},
        assignedManager: null,
        teacher: {},
        group: {},
        center: {},
        attachments: [],
        activities: [],
        student: null,
      });

      await expect(
        service.changeStatus('lead-1', { status: 'PAID' }, 'user-1')
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when NEW -> FIRST_LESSON and required fields missing', async () => {
      prisma.crmLead.findUnique.mockResolvedValue({
        id: 'lead-1',
        status: 'NEW',
        firstName: null,
        lastName: null,
        phone: null,
        age: null,
        levelId: null,
        teacherId: null,
        groupId: null,
        centerId: null,
        createdByUser: {},
        assignedManager: null,
        teacher: null,
        group: null,
        center: null,
        attachments: [],
        activities: [],
        student: null,
      });

      await expect(
        service.changeStatus('lead-1', { status: 'FIRST_LESSON' }, 'user-1')
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects any status change away from PAID (including for ADMIN)', async () => {
      prisma.crmLead.findUnique.mockResolvedValue({
        id: 'lead-1',
        status: 'PAID',
        firstName: 'John',
        lastName: 'Doe',
        phone: '+123',
        centerId: 'c1',
        createdByUser: {},
        assignedManager: null,
        teacher: null,
        group: null,
        center: null,
        attachments: [],
        activities: [],
        student: { id: 's1' },
      });

      await expect(
        service.changeStatus('lead-1', { status: 'ARCHIVE' }, 'user-1', {
          user: { role: 'ADMIN', sub: 'admin-1' } as never,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getAllowedTransitions', () => {
    it('returns allowed next statuses for NEW', () => {
      expect(service.getAllowedTransitions('NEW')).toEqual(['FIRST_LESSON', 'ARCHIVE']);
    });
    it('returns empty for PAID', () => {
      expect(service.getAllowedTransitions('PAID')).toEqual([]);
    });
  });

  describe('changeBranch', () => {
    it('updates centerId and assignedManagerId by manager profile', async () => {
      prisma.crmLead.findUnique.mockResolvedValue({
        id: 'lead-1',
        status: 'NEW',
        centerId: null,
        createdByUser: {},
        assignedManager: null,
        teacher: null,
        group: null,
        center: null,
        attachments: [],
        activities: [],
        student: null,
      });
      prisma.managerProfile.findUnique.mockResolvedValue({ userId: 'manager-1' });
      prisma.crmLead.update.mockResolvedValue({
        id: 'lead-1',
        centerId: 'center-1',
        assignedManagerId: 'manager-1',
      });

      const result = await service.changeBranch(
        'lead-1',
        { centerId: 'center-1' },
        'user-1',
        { role: 'ADMIN' } as never,
      );

      expect(prisma.managerProfile.findUnique).toHaveBeenCalledWith({
        where: { centerId: 'center-1' },
        select: { userId: true },
      });
      expect(prisma.crmLead.update).toHaveBeenCalled();
      expect(result).toEqual({
        id: 'lead-1',
        centerId: 'center-1',
        assignedManagerId: 'manager-1',
      });
    });
  });
});
