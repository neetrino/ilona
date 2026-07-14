import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { MessageType, UserRole } from '@ilona/database';
import { MessageMutationService } from './message-mutation.service';
import type { JwtPayload } from '../../common/types/auth.types';

describe('MessageMutationService', () => {
  let service: MessageMutationService;
  let mockPrismaService: {
    message: {
      findUnique: Mock;
      delete: Mock;
    };
  };
  let mockStorageService: {
    delete: Mock;
  };
  let mockChatManagementService: {
    getChatById: Mock;
  };

  const mockMessage = {
    id: 'msg-1',
    chatId: 'chat-1',
    senderId: 'user-1',
    type: MessageType.TEXT,
    content: 'Hello world',
    fileUrl: null,
    fileName: null,
    fileSize: null,
    duration: null,
    metadata: null,
    isSystem: false,
    isEdited: false,
    editedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const adminAuth: JwtPayload = {
    sub: 'admin-1',
    email: 'admin@example.com',
    role: UserRole.ADMIN,
  };

  const managerAuth: JwtPayload = {
    sub: 'manager-1',
    email: 'manager@example.com',
    role: UserRole.MANAGER,
  };

  const teacherAuth: JwtPayload = {
    sub: 'user-2',
    email: 'teacher@example.com',
    role: UserRole.TEACHER,
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockPrismaService = {
      message: {
        findUnique: vi.fn(),
        delete: vi.fn(),
      },
    };

    mockStorageService = {
      delete: vi.fn().mockResolvedValue(undefined),
    };

    mockChatManagementService = {
      getChatById: vi.fn().mockResolvedValue({ id: 'chat-1' }),
    };

    service = new MessageMutationService(
      mockPrismaService as never,
      mockStorageService as never,
      mockChatManagementService as never,
    );
  });

  describe('deleteMessage', () => {
    it('allows the message owner to delete', async () => {
      mockPrismaService.message.findUnique.mockResolvedValue(mockMessage);
      mockPrismaService.message.delete.mockResolvedValue(mockMessage);

      const result = await service.deleteMessage('msg-1', 'user-1', teacherAuth);

      expect(mockPrismaService.message.delete).toHaveBeenCalledWith({ where: { id: 'msg-1' } });
      expect(result).toEqual(mockMessage);
    });

    it('allows ADMIN to delete another user message', async () => {
      mockPrismaService.message.findUnique.mockResolvedValue(mockMessage);
      mockPrismaService.message.delete.mockResolvedValue(mockMessage);

      await service.deleteMessage('msg-1', 'admin-1', adminAuth);

      expect(mockChatManagementService.getChatById).toHaveBeenCalledWith(
        'chat-1',
        'admin-1',
        UserRole.ADMIN,
        adminAuth,
      );
      expect(mockPrismaService.message.delete).toHaveBeenCalledWith({ where: { id: 'msg-1' } });
    });

    it('allows MANAGER to delete another user message', async () => {
      mockPrismaService.message.findUnique.mockResolvedValue(mockMessage);
      mockPrismaService.message.delete.mockResolvedValue(mockMessage);

      await service.deleteMessage('msg-1', 'manager-1', managerAuth);

      expect(mockPrismaService.message.delete).toHaveBeenCalledWith({ where: { id: 'msg-1' } });
    });

    it('forbids non-owner non-moderator delete', async () => {
      mockPrismaService.message.findUnique.mockResolvedValue(mockMessage);

      await expect(service.deleteMessage('msg-1', 'user-2', teacherAuth)).rejects.toThrow(
        ForbiddenException,
      );
      expect(mockPrismaService.message.delete).not.toHaveBeenCalled();
    });

    it('throws NotFoundException if message not found', async () => {
      mockPrismaService.message.findUnique.mockResolvedValue(null);

      await expect(service.deleteMessage('missing', 'user-1', teacherAuth)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
