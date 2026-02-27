import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { LeadsService } from './leads.service';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';

describe('LeadsService', () => {
  let service: LeadsService;
  let prisma: { crmLead: { findUnique: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn> }; crmLeadActivity: { create: ReturnType<typeof vi.fn> }; $transaction: ReturnType<typeof vi.fn> };
  let storage: { getPresignedUploadUrl: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    prisma = {
      crmLead: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      crmLeadActivity: { create: vi.fn() },
      $transaction: vi.fn((fn: (tx: unknown) => Promise<unknown>) => fn(prisma)),
    };
    storage = { getPresignedUploadUrl: vi.fn() };
    service = new LeadsService(prisma as unknown as PrismaService, storage as unknown as StorageService);
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

    it('throws BadRequestException when NEW -> AGREED and required fields missing', async () => {
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
        service.changeStatus('lead-1', { status: 'AGREED' }, 'user-1')
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getAllowedTransitions', () => {
    it('returns allowed next statuses for NEW', () => {
      expect(service.getAllowedTransitions('NEW')).toEqual(['AGREED', 'ARCHIVE']);
    });
    it('returns empty for PAID', () => {
      expect(service.getAllowedTransitions('PAID')).toEqual([]);
    });
  });
});
