import { Injectable } from '@nestjs/common';
import { CreateChatDto, CreateCustomGroupChatDto } from './dto';
import { PrismaService } from '../prisma/prisma.service';
import { ChatUserChatsService } from './chat-user-chats.service';
import { ChatDetailService } from './chat-detail.service';
import { ChatDirectService } from './chat-direct.service';
import { ChatGroupConversationService } from './chat-group-conversation.service';
import { ChatCustomGroupService } from './chat-custom-group.service';
import { JwtPayload } from '../../common/types/auth.types';

/**
 * Facade for chat/conversation management — delegates to domain-specific services.
 */
@Injectable()
export class ChatManagementService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userChatsService: ChatUserChatsService,
    private readonly detailService: ChatDetailService,
    private readonly directService: ChatDirectService,
    private readonly groupConversationService: ChatGroupConversationService,
    private readonly customGroupService: ChatCustomGroupService,
  ) {}

  getUserChats(userId: string, authUser?: JwtPayload): Promise<unknown> {
    return this.userChatsService.getUserChats(userId, authUser);
  }

  getChatById(chatId: string, userId: string, userRole?: string, authUser?: JwtPayload) {
    return this.detailService.getChatById(chatId, userId, userRole, authUser);
  }

  createDirectChat(dto: CreateChatDto, creatorId: string) {
    return this.directService.createDirectChat(dto, creatorId);
  }

  getOrCreateGroupConversation(
    groupId: string,
    userId: string,
    userRole?: string,
    authUser?: JwtPayload,
  ) {
    return this.groupConversationService.getOrCreateGroupConversation(
      groupId,
      userId,
      userRole,
      authUser,
    );
  }

  getGroupChat(groupId: string, userId?: string, userRole?: string, authUser?: JwtPayload) {
    return this.groupConversationService.getGroupChat(groupId, userId, userRole, authUser);
  }

  addGroupChatMember(groupId: string, userId: string, actor: JwtPayload) {
    return this.groupConversationService.addGroupChatMember(groupId, userId, actor);
  }

  getCustomGroupChats(userId: string, authUser?: JwtPayload): Promise<unknown> {
    return this.customGroupService.getCustomGroupChats(userId, authUser);
  }

  createCustomGroupChat(creatorId: string, dto: CreateCustomGroupChatDto, actor: JwtPayload) {
    return this.customGroupService.createCustomGroupChat(creatorId, dto, actor);
  }

  addCustomGroupChatMember(chatId: string, userId: string, actor: JwtPayload) {
    return this.customGroupService.addCustomGroupChatMember(chatId, userId, actor);
  }

  deleteCustomGroupChat(chatId: string, actor: JwtPayload) {
    return this.customGroupService.deleteCustomGroupChat(chatId, actor);
  }

  getOnlineUsers(_chatId: string, onlineUserIds: Set<string>): string[] {
    return Array.from(onlineUserIds);
  }

  async touchUserLastSeen(userId: string): Promise<Date> {
    const now = new Date();
    await this.prisma.user.update({
      where: { id: userId },
      data: { lastSeenAt: now },
      select: { id: true },
    });
    return now;
  }

  async getUsersLastSeen(
    userIds: string[],
  ): Promise<Array<{ id: string; lastSeenAt: Date | null }>> {
    if (userIds.length === 0) return [];
    return this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, lastSeenAt: true },
    });
  }
}
