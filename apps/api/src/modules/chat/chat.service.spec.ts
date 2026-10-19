/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ChatService } from './chat.service';
import { ChatType, MessageType } from '@ilona/database';

describe('ChatService', () => {
  let chatService: ChatService;
  const chatManagementService = {
    getUserChats: vi.fn(),
    getChatById: vi.fn(),
    createDirectChat: vi.fn(),
    getGroupChat: vi.fn(),
    getOrCreateGroupConversation: vi.fn(),
    getOnlineUsers: vi.fn(),
    touchUserLastSeen: vi.fn(),
    getUsersLastSeen: vi.fn(),
  };
  const messageService = {
    getMessage: vi.fn(),
    getMessages: vi.fn(),
    sendMessage: vi.fn(),
    editMessage: vi.fn(),
    deleteMessage: vi.fn(),
    markAsRead: vi.fn(),
    sendVocabularyMessage: vi.fn(),
  };
  const chatListsService = {
    getTeacherStudents: vi.fn(),
    getTeacherGroups: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    chatService = new ChatService(
      chatManagementService as never,
      messageService as never,
      chatListsService as never,
    );
  });

  it('delegates getUserChats', async () => {
    chatManagementService.getUserChats.mockResolvedValue([{ id: 'chat-1', unreadCount: 2 }]);
    const result = await chatService.getUserChats('user-1');
    expect(chatManagementService.getUserChats).toHaveBeenCalledWith('user-1', undefined);
    expect(result).toEqual([{ id: 'chat-1', unreadCount: 2 }]);
  });

  it('delegates getChatById', async () => {
    chatManagementService.getChatById.mockResolvedValue({ id: 'chat-1', type: ChatType.GROUP });
    const result = await chatService.getChatById('chat-1', 'user-1', 'TEACHER');
    expect(chatManagementService.getChatById).toHaveBeenCalledWith(
      'chat-1',
      'user-1',
      'TEACHER',
      undefined,
    );
    expect(result).toEqual({ id: 'chat-1', type: ChatType.GROUP });
  });

  it('delegates getMessages', async () => {
    messageService.getMessages.mockResolvedValue({ items: [], hasMore: false });
    await chatService.getMessages('chat-1', 'user-1', { take: 20 });
    expect(messageService.getMessages).toHaveBeenCalledWith(
      'chat-1',
      'user-1',
      { take: 20 },
      undefined,
      undefined,
    );
  });

  it('delegates createDirectChat', async () => {
    chatManagementService.createDirectChat.mockResolvedValue({
      id: 'chat-2',
      type: ChatType.DIRECT,
    });
    const result = await chatService.createDirectChat({ participantIds: ['user-2'] }, 'user-1');
    expect(chatManagementService.createDirectChat).toHaveBeenCalledWith(
      { participantIds: ['user-2'] },
      'user-1',
    );
    expect(result.type).toBe(ChatType.DIRECT);
  });

  it('delegates sendMessage', async () => {
    messageService.sendMessage.mockResolvedValue({
      id: 'msg-1',
      content: 'Hello',
      type: MessageType.TEXT,
    });
    const result = await chatService.sendMessage(
      { chatId: 'chat-1', content: 'Hello', type: MessageType.TEXT },
      'user-1',
      'STUDENT',
    );
    expect(messageService.sendMessage).toHaveBeenCalled();
    expect(result.content).toBe('Hello');
  });

  it('delegates editMessage', async () => {
    messageService.editMessage.mockResolvedValue({ id: 'msg-1', content: 'Edited', isEdited: true });
    const result = await chatService.editMessage('msg-1', { content: 'Edited' }, 'user-1');
    expect(messageService.editMessage).toHaveBeenCalledWith(
      'msg-1',
      { content: 'Edited' },
      'user-1',
      undefined,
    );
    expect(result.isEdited).toBe(true);
  });

  it('delegates deleteMessage', async () => {
    messageService.deleteMessage.mockResolvedValue({ id: 'msg-1' });
    await chatService.deleteMessage('msg-1', 'user-1');
    expect(messageService.deleteMessage).toHaveBeenCalledWith('msg-1', 'user-1', undefined);
  });

  it('delegates markAsRead', async () => {
    messageService.markAsRead.mockResolvedValue({ ok: true });
    await chatService.markAsRead('chat-1', 'user-1');
    expect(messageService.markAsRead).toHaveBeenCalledWith('chat-1', 'user-1', undefined);
  });

  it('delegates sendVocabularyMessage', async () => {
    messageService.sendVocabularyMessage.mockResolvedValue({ id: 'msg-v' });
    await chatService.sendVocabularyMessage('chat-1', 'user-1', ['apple']);
    expect(messageService.sendVocabularyMessage).toHaveBeenCalledWith(
      'chat-1',
      'user-1',
      ['apple'],
    );
  });

  it('delegates getGroupChat', async () => {
    chatManagementService.getGroupChat.mockResolvedValue({ id: 'chat-g' });
    await chatService.getGroupChat('group-1', 'user-1', 'TEACHER');
    expect(chatManagementService.getGroupChat).toHaveBeenCalledWith(
      'group-1',
      'user-1',
      'TEACHER',
      undefined,
    );
  });

  it('delegates getOnlineUsers', () => {
    const online = new Set(['user-1']);
    chatManagementService.getOnlineUsers.mockReturnValue(['user-1']);
    expect(chatService.getOnlineUsers('chat-1', online)).toEqual(['user-1']);
    expect(chatManagementService.getOnlineUsers).toHaveBeenCalledWith('chat-1', online);
  });
});
