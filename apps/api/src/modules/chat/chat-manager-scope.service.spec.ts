/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { ChatType } from '@ilona/database';
import { ChatManagerScopeService } from './chat-manager-scope.service';

describe('ChatManagerScopeService', () => {
  let service: ChatManagerScopeService;
  let mockPrismaService: {
    user: { findUnique: Mock };
    managerProfile: { findFirst: Mock };
    student: { findUnique: Mock };
    teacher: { findUnique: Mock };
  };

  const centerId = 'center-1';
  const activeManagerId = 'manager-active';
  const inactiveManagerId = 'manager-inactive';

  beforeEach(() => {
    vi.clearAllMocks();

    mockPrismaService = {
      user: { findUnique: vi.fn() },
      managerProfile: { findFirst: vi.fn() },
      student: { findUnique: vi.fn() },
      teacher: { findUnique: vi.fn() },
    };

    service = new ChatManagerScopeService(mockPrismaService as never);
  });

  describe('isChatInManagerBranch', () => {
    it('allows direct chat access when the other participant is inactive', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ status: 'INACTIVE' });

      const chat = {
        id: 'chat-dm',
        type: ChatType.DIRECT,
        groupId: null,
        group: null,
        participants: [
          { userId: activeManagerId },
          { userId: inactiveManagerId },
        ],
      };

      const result = await service.isChatInManagerBranch(
        chat,
        activeManagerId,
        centerId,
      );

      expect(result).toBe(true);
      expect(mockPrismaService.managerProfile.findFirst).not.toHaveBeenCalled();
    });

    it('allows custom group chat when an inactive manager is among participants', async () => {
      mockPrismaService.user.findUnique
        .mockResolvedValueOnce({ status: 'INACTIVE' })
        .mockResolvedValueOnce({ role: 'STUDENT' });
      mockPrismaService.student.findUnique.mockResolvedValue({
        centerId,
        group: null,
      });

      const chat = {
        id: 'chat-custom',
        type: ChatType.GROUP,
        groupId: null,
        group: null,
        participants: [
          { userId: activeManagerId },
          { userId: inactiveManagerId },
          { userId: 'student-1' },
        ],
      };

      const result = await service.isChatInManagerBranch(
        chat,
        activeManagerId,
        centerId,
      );

      expect(result).toBe(true);
    });
  });
});
