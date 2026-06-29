import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { softDeletedMessageFilter } from './chat-list.util';

@Injectable()
export class ChatUnreadCountService {
  private readonly logger = new Logger(ChatUnreadCountService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getParticipantLastReadMap(chatIds: string[], userId: string) {
    if (chatIds.length === 0) return new Map<string, Date | null>();

    const participants = await this.prisma.chatParticipant.findMany({
      where: {
        chatId: { in: chatIds },
        userId,
        leftAt: null,
      },
      select: {
        chatId: true,
        lastReadAt: true,
      },
    });

    return new Map(participants.map((p) => [p.chatId, p.lastReadAt]));
  }

  async countUnreadAfterLastRead(
    entries: Array<{ chatId: string; lastReadAt: Date }>,
    userId: string,
    logContext: string,
  ) {
    const counts = await Promise.all(
      entries.map(async ({ chatId, lastReadAt }) => {
        try {
          const count = await this.prisma.message.count({
            where: {
              chatId,
              createdAt: { gt: lastReadAt },
              senderId: { not: userId },
            },
          });
          return { chatId, count };
        } catch (error) {
          this.logger.warn(`Failed to get unread count for ${logContext} ${chatId}:`, error);
          return { chatId, count: 0 };
        }
      }),
    );

    return new Map(counts.map((entry) => [entry.chatId, entry.count]));
  }

  async countUnreadNeverReadForGroups(chatIds: string[], userId: string) {
    const counts = await Promise.all(
      chatIds.map(async (chatId) => {
        try {
          const count = await this.prisma.message.count({
            where: {
              chatId,
              senderId: { not: userId },
              ...softDeletedMessageFilter,
            },
          });
          return { chatId, count };
        } catch (error) {
          this.logger.warn(`Failed to get never-read count for group chat ${chatId}:`, error);
          return { chatId, count: 0 };
        }
      }),
    );

    return new Map(counts.map((entry) => [entry.chatId, entry.count]));
  }

  async getSingleChatUnreadCount(
    chatId: string,
    userId: string,
    lastReadAt: Date | null | undefined,
    totalMessageCount: number,
  ) {
    if (lastReadAt) {
      return this.prisma.message.count({
        where: {
          chatId,
          createdAt: { gt: lastReadAt },
          senderId: { not: userId },
        },
      });
    }
    return totalMessageCount;
  }
}
