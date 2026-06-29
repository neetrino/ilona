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

  async getMessage(messageId: string) {
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
  ) {
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
    const items = hasMore ? messages.slice(0, -1) : messages;

    return {
      items: items.reverse().map(mapMessageWithSender),
      hasMore,
      nextCursor: hasMore ? items[items.length - 1]?.id : null,
    };
  }
}
