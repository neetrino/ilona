import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ChatManagementService } from './chat-management.service';
import { chatSenderPublicSelect, mapMessageWithSender } from './chat-message-sender.util';
import { JwtPayload } from '../../common/types/auth.types';

@Injectable()
export class MessageQueryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly chatManagementService: ChatManagementService,
  ) {}

  async getMessage(messageId: string): Promise<unknown> {
    return this.prisma.message.findUnique({
      where: { id: messageId },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
            role: true,
          },
        },
      },
    });
  }

  async getMessages(
    chatId: string,
    userId: string,
    params?: { cursor?: string; take?: number },
    userRole?: string,
    authUser?: JwtPayload,
  ): Promise<unknown> {
    await this.chatManagementService.getChatById(chatId, userId, userRole, authUser);

    const { cursor, take = 50 } = params || {};

    const messages = await this.prisma.message.findMany({
      where: {
        chatId,
        NOT: {
          AND: [{ content: null }, { isSystem: true }],
        },
      },
      take: take + 1,
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1,
      }),
      orderBy: { createdAt: 'desc' },
      include: {
        sender: {
          select: chatSenderPublicSelect,
        },
      },
    });

    const hasMore = messages.length > take;
    // Desc order: index 0 = newest, last = oldest in this page.
    const pageItems = hasMore ? messages.slice(0, take) : messages;
    const nextCursor = hasMore ? (pageItems[pageItems.length - 1]?.id ?? null) : null;

    return {
      items: [...pageItems].reverse().map(mapMessageWithSender),
      hasMore,
      nextCursor,
    };
  }
}
