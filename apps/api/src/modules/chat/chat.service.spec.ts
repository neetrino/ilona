/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { ChatService } from './chat.service';
import { ChatType, MessageType } from '@prisma/client';

describe('ChatService', () => {
  let chatService: ChatService;
  let mockPrismaService: {
    chat: {
      findMany: Mock;
      findUnique: Mock;
      findFirst: Mock;
      create: Mock;
      update: Mock;
    };
    message: {
      findMany: Mock;
      findUnique: Mock;
      create: Mock;
      update: Mock;
      delete: Mock;
      count: Mock;
    };
    chatParticipant: {
      updateMany: Mock;
    };
  };
  let mockStorageService: {
    delete: Mock;
  };

  const mockChat = {
    id: 'chat-1',
    type: ChatType.GROUP,
    name: 'Test Group Chat',
    groupId: 'group-1',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    group: { id: 'group-1', name: 'Group 1', level: 'A1', center: { id: 'c1', name: 'Center' } },
    participants: [
      {
        userId: 'user-1',
        isAdmin: true,
        leftAt: null,
        lastReadAt: new Date(),
        user: {
          id: 'user-1',
          firstName: 'John',
          lastName: 'Doe',
          avatarUrl: null,
          role: 'TEACHER',
          status: 'ACTIVE',
        },
      },
      {
        userId: 'user-2',
        isAdmin: false,
        leftAt: null,
        lastReadAt: null,
        user: {
          id: 'user-2',
          firstName: 'Jane',
          lastName: 'Smith',
          avatarUrl: null,
          role: 'STUDENT',
          status: 'ACTIVE',
        },
      },
    ],
    messages: [],
    _count: { messages: 10 },
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
    sender: {
      id: 'user-1',
      firstName: 'John',
      lastName: 'Doe',
      avatarUrl: null,
      role: 'TEACHER',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockPrismaService = {
      chat: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      message: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        count: vi.fn(),
      },
      chatParticipant: {
        updateMany: vi.fn(),
      },
    };

    mockStorageService = {
      delete: vi.fn().mockResolvedValue(undefined),
    };

    chatService = new ChatService(mockPrismaService as never, mockStorageService as never);
  });

  describe('getUserChats', () => {
    it('should return user chats with unread counts', async () => {
      mockPrismaService.chat.findMany.mockResolvedValue([mockChat]);
      mockPrismaService.message.count.mockResolvedValue(5);

      const result = await chatService.getUserChats('user-1');

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('chat-1');
      expect(result[0].unreadCount).toBeDefined();
    });
  });

  describe('getChatById', () => {
    it('should return chat if user is participant', async () => {
      mockPrismaService.chat.findUnique.mockResolvedValue(mockChat);

      const result = await chatService.getChatById('chat-1', 'user-1');

      expect(result.id).toBe('chat-1');
    });

    it('should throw NotFoundException if chat not found', async () => {
      mockPrismaService.chat.findUnique.mockResolvedValue(null);

      await expect(chatService.getChatById('nonexistent', 'user-1'))
        .rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is not participant', async () => {
      mockPrismaService.chat.findUnique.mockResolvedValue(mockChat);

      await expect(chatService.getChatById('chat-1', 'user-3'))
        .rejects.toThrow(ForbiddenException);
    });
  });

  describe('getMessages', () => {
    it('should return paginated messages', async () => {
      mockPrismaService.chat.findUnique.mockResolvedValue(mockChat);
      mockPrismaService.message.findMany.mockResolvedValue([mockMessage]);

      const result = await chatService.getMessages('chat-1', 'user-1', { take: 50 });

      expect(result.items).toHaveLength(1);
      expect(result.hasMore).toBe(false);
    });

    it('should indicate hasMore when more messages exist', async () => {
      mockPrismaService.chat.findUnique.mockResolvedValue(mockChat);
      const manyMessages = Array(51).fill(mockMessage);
      mockPrismaService.message.findMany.mockResolvedValue(manyMessages);

      const result = await chatService.getMessages('chat-1', 'user-1', { take: 50 });

      expect(result.hasMore).toBe(true);
      expect(result.items).toHaveLength(50);
    });
  });

  describe('createDirectChat', () => {
    it('should create a new direct chat', async () => {
      mockPrismaService.chat.findFirst.mockResolvedValue(null);
      mockPrismaService.chat.create.mockResolvedValue({
        ...mockChat,
        type: ChatType.DIRECT,
        groupId: null,
      });

      const result = await chatService.createDirectChat(
        { participantIds: ['user-2'] },
        'user-1',
      );

      expect(result).not.toBeNull();
      expect(result?.type).toBe(ChatType.DIRECT);
    });

    it('should return existing chat if already exists', async () => {
      mockPrismaService.chat.findFirst.mockResolvedValue({
        ...mockChat,
        type: ChatType.DIRECT,
      });

      await chatService.createDirectChat(
        { participantIds: ['user-2'] },
        'user-1',
      );

      expect(mockPrismaService.chat.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if no participants', async () => {
      await expect(
        chatService.createDirectChat({ participantIds: [] }, 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('sendMessage', () => {
    it('should create and return a message', async () => {
      mockPrismaService.chat.findUnique.mockResolvedValue(mockChat);
      mockPrismaService.message.create.mockResolvedValue(mockMessage);
      mockPrismaService.chat.update.mockResolvedValue(mockChat);

      const result = await chatService.sendMessage(
        { chatId: 'chat-1', content: 'Hello world', type: MessageType.TEXT },
        'user-1',
      );

      expect(result.content).toBe('Hello world');
      expect(mockPrismaService.chat.update).toHaveBeenCalled();
    });
  });

  describe('editMessage', () => {
    it('should edit a text message', async () => {
      mockPrismaService.message.findUnique.mockResolvedValue(mockMessage);
      mockPrismaService.message.update.mockResolvedValue({
        ...mockMessage,
        content: 'Edited content',
        isEdited: true,
      });

      const result = await chatService.editMessage(
        'msg-1',
        { content: 'Edited content' },
        'user-1',
      );

      expect(result.content).toBe('Edited content');
      expect(result.isEdited).toBe(true);
    });

    it('should throw NotFoundException if message not found', async () => {
      mockPrismaService.message.findUnique.mockResolvedValue(null);

      await expect(
        chatService.editMessage('nonexistent', { content: 'Test' }, 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if not message owner', async () => {
      mockPrismaService.message.findUnique.mockResolvedValue(mockMessage);

      await expect(
        chatService.editMessage('msg-1', { content: 'Test' }, 'user-2'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException for non-text messages', async () => {
      mockPrismaService.message.findUnique.mockResolvedValue({
        ...mockMessage,
        type: MessageType.VOICE,
      });

      await expect(
        chatService.editMessage('msg-1', { content: 'Test' }, 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('deleteMessage', () => {
    it('should hard delete a message', async () => {
      mockPrismaService.message.findUnique.mockResolvedValue(mockMessage);
      mockPrismaService.message.delete.mockResolvedValue(mockMessage);

      const result = await chatService.deleteMessage('msg-1', 'user-1');

      expect(mockPrismaService.message.delete).toHaveBeenCalledWith({
        where: { id: 'msg-1' },
      });
      expect(result).toEqual(mockMessage);
    });

    it('should delete file from storage if fileUrl exists', async () => {
      const messageWithFile = {
        ...mockMessage,
        fileUrl: 'https://pub-xxx.r2.dev/chat/filename.webm',
      };
      mockPrismaService.message.findUnique.mockResolvedValue(messageWithFile);
      mockPrismaService.message.delete.mockResolvedValue(messageWithFile);
      mockStorageService.delete.mockResolvedValue(undefined);

      await chatService.deleteMessage('msg-1', 'user-1');

      expect(mockStorageService.delete).toHaveBeenCalledWith('chat/filename.webm');
      expect(mockPrismaService.message.delete).toHaveBeenCalled();
    });

    it('should throw NotFoundException if message not found', async () => {
      mockPrismaService.message.findUnique.mockResolvedValue(null);

      await expect(
        chatService.deleteMessage('nonexistent', 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if not message owner', async () => {
      mockPrismaService.message.findUnique.mockResolvedValue(mockMessage);

      await expect(
        chatService.deleteMessage('msg-1', 'user-2'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('markAsRead', () => {
    it('should update lastReadAt for participant', async () => {
      mockPrismaService.chatParticipant.updateMany.mockResolvedValue({ count: 1 });

      const result = await chatService.markAsRead('chat-1', 'user-1');

      expect(result.success).toBe(true);
      expect(mockPrismaService.chatParticipant.updateMany).toHaveBeenCalledWith({
        where: { chatId: 'chat-1', userId: 'user-1' },
        data: { lastReadAt: expect.any(Date) },
      });
    });
  });

  describe('sendVocabularyMessage', () => {
    it('should send vocabulary message for chat admin', async () => {
      mockPrismaService.chat.findUnique.mockResolvedValue(mockChat);
      mockPrismaService.message.create.mockResolvedValue({
        ...mockMessage,
        content: '📚 **Vocabulary for Today:**\n\n1. Hello\n2. World',
        metadata: { isVocabulary: true, words: ['Hello', 'World'] },
      });

      const result = await chatService.sendVocabularyMessage(
        'chat-1',
        'user-1',
        ['Hello', 'World'],
      );

      expect(result.metadata).toBeDefined();
    });

    it('should throw ForbiddenException if not admin', async () => {
      mockPrismaService.chat.findUnique.mockResolvedValue(mockChat);

      await expect(
        chatService.sendVocabularyMessage('chat-1', 'user-2', ['word']),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getGroupChat', () => {
    it('should return chat for a group', async () => {
      mockPrismaService.chat.findUnique.mockResolvedValue(mockChat);

      const result = await chatService.getGroupChat('group-1');

      expect(result?.id).toBe('chat-1');
    });

    it('should return null if no chat exists', async () => {
      mockPrismaService.chat.findUnique.mockResolvedValue(null);

      const result = await chatService.getGroupChat('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('getOnlineUsers', () => {
    it('should return online users array', () => {
      const onlineIds = new Set(['user-1', 'user-2']);

      const result = chatService.getOnlineUsers('chat-1', onlineIds);

      expect(result).toContain('user-1');
      expect(result).toContain('user-2');
    });
  });
});
